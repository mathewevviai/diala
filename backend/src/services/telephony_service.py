#!/usr/bin/env python3
"""
Telephony Service with ASR/Sentiment Integration
Integrates with Bandwidth Python SDK for real-time call management.
"""

import os
import sys
import base64
import logging
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bandwidth SDK Imports
import bandwidth
from bandwidth.api import calls_api
from bandwidth.models.create_call import CreateCall
from bandwidth.models.update_call import UpdateCall
from bandwidth.models.call_state_enum import CallStateEnum

# Import existing services
from src.services.realtime_analysis_service import get_realtime_analysis_service
from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier
from src.services.audio_processor import AudioProcessor

# --- Environment Variables for Bandwidth ---
BW_USERNAME = os.environ.get("BW_USERNAME")
BW_PASSWORD = os.environ.get("BW_PASSWORD")
BW_ACCOUNT_ID = os.environ.get("BW_ACCOUNT_ID")
BW_VOICE_APPLICATION_ID = os.environ.get("BW_VOICE_APPLICATION_ID")
BW_NUMBER = os.environ.get("BW_NUMBER")
BASE_CALLBACK_URL = os.environ.get("BASE_CALLBACK_URL") # Your publicly accessible server URL, e.g., https://myapp.com

@dataclass
class CallSession:
    call_id: str
    user_id: str
    phone_number: str
    direction: str
    start_time: datetime
    audio_chunks: List[Dict[str, Any]]
    current_transcript: str
    current_sentiment: str
    speakers: Dict[str, Any]

class TelephonyService:
    """
    Main telephony service that integrates:
    - Bandwidth SDK for call control
    - Real-time ASR
    - Sentiment analysis
    - Speaker diarization
    """

    def __init__(self):
        self.analysis_service = get_realtime_analysis_service()
        self.speaker_identifier = ModernStatefulSpeakerIdentifier()
        self.audio_processor = AudioProcessor()
        self.active_calls: Dict[str, CallSession] = {}
        
        # Initialize Bandwidth API Client
        configuration = bandwidth.Configuration(username=BW_USERNAME, password=BW_PASSWORD)
        api_client = bandwidth.ApiClient(configuration)
        self.calls_api_instance = calls_api.CallsApi(api_client)

    async def start_call(self, user_id: str, phone_number: str, direction: str) -> Dict[str, Any]:
        """Start a new telephony call using the Bandwidth SDK"""
        logger.info(f"Starting call to {phone_number} for user {user_id}")

        # The answerUrl points to our FastAPI endpoint that will serve BXML
        # This is how we start the audio stream from Bandwidth to our WebSocket server
        answer_url = f"{BASE_CALLBACK_URL}/bxml/start-stream"

        call_body = CreateCall(
            to=phone_number,
            var_from=BW_NUMBER,
            application_id=BW_VOICE_APPLICATION_ID,
            answer_url=answer_url,
            tag=user_id  # Use tag to associate the call with the user
        )

        try:
            api_response = self.calls_api_instance.create_call(BW_ACCOUNT_ID, call_body)
            call_id = api_response.call_id
            logger.info(f"Successfully created call {call_id}")

            # Initialize call session
            session = CallSession(
                call_id=call_id,
                user_id=user_id,
                phone_number=phone_number,
                direction=direction,
                start_time=datetime.now(),
                audio_chunks=[],
                current_transcript="",
                current_sentiment="neutral",
                speakers={}
            )
            self.active_calls[call_id] = session

            await self.speaker_identifier.initialize()

            return {
                "call_id": call_id,
                "status": "connecting",
                "session": session.__dict__
            }
        except bandwidth.ApiException as e:
            logger.error(f"Error starting call with Bandwidth: {e}")
            raise

    async def process_audio_chunk(self, call_id: str, chunk_id: str, audio_data: str, sequence: int) -> Dict[str, Any]:
        """Process audio chunk with ASR and sentiment analysis"""
        if call_id not in self.active_calls:
            raise ValueError(f"Call {call_id} not found")
        
        session = self.active_calls[call_id]
        
        try:
            # Bandwidth sends base64 encoded audio in the stream
            audio_bytes = base64.b64decode(audio_data)
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16)

            if len(audio_array) == 0:
                return {"error": "Empty audio data"}
            
            result = await self.analysis_service.process_sentiment_chunk(
                audio_array.astype(np.float32).tobytes()
            )
            
            speaker_id, confidence = self.speaker_identifier.identify_speaker(audio_array)
            
            chunk_data = {
                "chunk_id": chunk_id,
                "sequence": sequence,
                "transcript": result.get("text", ""),
                "sentiment": result.get("sentiment", "neutral"),
                "speaker": speaker_id,
                "confidence": confidence,
                "timestamp": datetime.now().isoformat()
            }
            
            session.audio_chunks.append(chunk_data)
            session.current_transcript = result.get("text", "")
            session.current_sentiment = result.get("sentiment", "neutral")
            
            if speaker_id not in session.speakers:
                session.speakers[speaker_id] = {"first_seen": datetime.now().isoformat(), "confidence": confidence}
            
            return chunk_data
            
        except Exception as e:
            logger.error(f"Error processing chunk {chunk_id}: {e}")
            return {"error": str(e), "transcript": "", "sentiment": "neutral", "speaker": "unknown"}

    async def end_call(self, call_id: str) -> Dict[str, Any]:
        """End telephony call using the Bandwidth SDK and cleanup"""
        if call_id not in self.active_calls:
            raise ValueError(f"Call {call_id} not found")
            
        logger.info(f"Ending call {call_id}")

        try:
            update_call_body = UpdateCall(state=CallStateEnum("completed"))
            self.calls_api_instance.update_call(BW_ACCOUNT_ID, call_id, update_call_body)
            logger.info(f"Successfully ended call {call_id} with Bandwidth")
        except bandwidth.ApiException as e:
            logger.error(f"Error ending call with Bandwidth: {e}")
            # Continue with local cleanup even if API call fails
            
        final_result = await self.process_final_transcription(call_id)
        
        # Cleanup
        del self.active_calls[call_id]
        
        return final_result

    async def process_final_transcription(self, call_id: str) -> Dict[str, Any]:
        """Process final transcription for a completed call"""
        if call_id not in self.active_calls:
            raise ValueError(f"Call {call_id} not found for final processing")
        
        session = self.active_calls[call_id]
        # ... (rest of the final processing logic remains the same)
        full_transcript = " ".join([chunk.get("transcript", "") for chunk in session.audio_chunks])
        return {"full_transcript": full_transcript, "speaker_summary": session.speakers}

    async def get_call_status(self, call_id: str) -> Dict[str, Any]:
        if call_id not in self.active_calls:
            return {"error": "Call not found"}
        session = self.active_calls[call_id]
        return {"status": "active", "duration": (datetime.now() - session.start_time).total_seconds()}


# Global service instance
telephony_service = TelephonyService()