#!/usr/bin/env python3
"""
Stream Simulation Service for Audio Transcription
Uses realtime analysis service with Whisper v3 ASR for real audio processing
"""

import os
import sys
import asyncio
import logging
import tempfile
import uuid
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

# Import the realtime analysis service
from src.services.realtime_analysis_service import get_realtime_analysis_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealtimeAudioProcessor:
    """Audio processor using realtime analysis service with Whisper v3"""
    
    async def process_audio_file(self, file_path: str, **kwargs) -> Dict[str, Any]:
        """Process audio file using realtime analysis service"""
        
        try:
            # Get the realtime analysis service
            service = await get_realtime_analysis_service()
            await service.ensure_models_loaded()
            
            # Load audio file
            audio_data, sample_rate = sf.read(file_path, dtype='int16')
            
            # Convert to bytes for processing
            audio_bytes = audio_data.tobytes()
            
            # Process with realtime analysis service
            result = await service.process_sentiment_chunk(audio_bytes)
            transcription = result.get("text", "")
            
            # Create segments from the transcription
            segments = []
            if transcription and transcription != "[NO SPEECH DETECTED]" and transcription != "[ASR FAILED]":
                # Simple segmentation - split into sentences for now
                sentences = transcription.split('. ')
                current_time = 0.0
                audio_duration = len(audio_data) / sample_rate
                
                for sentence in sentences:
                    if sentence.strip():
                        # Estimate duration based on word count and audio length
                        word_count = len(sentence.split())
                        estimated_duration = min(word_count * 0.5, audio_duration - current_time)
                        
                        segments.append({
                            "text": sentence.strip(),
                            "start": current_time,
                            "end": current_time + estimated_duration,
                            "speaker": "SPEAKER_00",
                            "sentiment": result.get("sentiment", "neutral")
                        })
                        current_time += estimated_duration
            
            return {
                "transcript": transcription,
                "language": "en",
                "fileName": os.path.basename(file_path),
                "fileSize": float(os.path.getsize(file_path)),
                "fileFormat": os.path.splitext(file_path)[1].replace('.', ''),
                "totalDuration": len(audio_data) / sample_rate if len(audio_data) > 0 else 0,
                "segments": segments,
                "sentiment": result.get("sentiment", "neutral"),
                "tokens": result.get("tokens", [])
            }
            
        except Exception as e:
            logger.error(f"Error processing with realtime analysis service: {e}")
            # Fallback to basic response
            return {
                "transcript": "[TRANSCRIPTION ERROR]",
                "language": "en",
                "fileName": os.path.basename(file_path),
                "fileSize": float(os.path.getsize(file_path)) if os.path.exists(file_path) else 0,
                "fileFormat": os.path.splitext(file_path)[1].replace('.', ''),
                "totalDuration": 0,
                "segments": [],
                "sentiment": "unknown",
                "tokens": []
            }

# Use realtime audio processor
ModernStreamProcessor = RealtimeAudioProcessor

async def run_modern_stream(file_path: str, **kwargs) -> Dict[str, Any]:
    """Process audio with realtime analysis service"""
    processor = RealtimeAudioProcessor()
    return await processor.process_audio_file(file_path, **kwargs)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StreamSimulationService:
    """
    Service that replaces Whisper with stream simulation for audio transcription
    Maintains API compatibility with existing audio_transcripts.py
    """
    
    def __init__(self):
        self.processor = ModernStreamProcessor()
        self.temp_dir = tempfile.mkdtemp(prefix="stream_sim_")
        
    async def process_audio_file(
        self,
        file_path: str,
        job_id: str,
        user_id: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None,
        separate_voices: bool = True,
        identify_speakers: bool = True,
        min_speakers: int = 1,
        max_speakers: int = 10
    ) -> Dict[str, Any]:
        """
        Process audio file using realtime analysis service instead of mock data
        
        Args:
            file_path: Path to audio file
            job_id: Unique job identifier
            user_id: User ID for tracking
            language: Language code
            prompt: Transcription prompt
            separate_voices: Whether to separate voices
            identify_speakers: Whether to identify speakers
            min_speakers: Minimum expected speakers
            max_speakers: Maximum expected speakers
            
        Returns:
            Dictionary with realtime analysis service transcription
        """
        try:
            logger.info(f"Starting realtime analysis processing for job {job_id}")
            
            # Process audio with realtime analysis service
            result = await run_modern_stream(
                file_path,
                separate_speakers=identify_speakers
            )
            
            # Format result to match existing API
            return self._format_for_api(result, file_path, job_id)
            
        except Exception as e:
            logger.error(f"Error in realtime analysis processing: {str(e)}")
            raise
    
    def _format_for_api(self, result: Dict[str, Any], file_path: str, job_id: str) -> Dict[str, Any]:
        """Format realtime analysis result to match Convex webhook API contract"""
        
        # Get file info
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_format = os.path.splitext(file_name)[1].lower().replace('.', '')
        
        # Build full transcript
        full_transcript = result.get('transcript', '')
        
        # Get segments from realtime analysis
        segments = result.get('segments', [])
        speakers = []
        for segment in segments:
            speakers.append({
                "speaker": segment.get("speaker", "SPEAKER_00"),
                "start": segment.get("start", 0.0),
                "end": segment.get("end", 0.0),
                "duration": segment.get("end", 0.0) - segment.get("start", 0.0)
            })
        
        # Return the exact fields expected by the webhook
        return {
            "transcript": full_transcript,
            "status": "completed",
            "jobId": job_id,
            "fileName": file_name,
            "fileSize": float(file_size),
            "fileFormat": file_format,
            "language": result.get("language", "en"),
            "speakers": speakers
        }
    
    def _group_segments_by_speaker(self, segments: List[Dict]) -> Dict[str, List[Dict]]:
        """Group segments by speaker for API compatibility"""
        grouped = {}
        for segment in segments:
            speaker = segment.get('speaker', 'SPEAKER_00')
            if speaker not in grouped:
                grouped[speaker] = []
            grouped[speaker].append(segment)
        return grouped
    
    async def simulate_processing_progress(self, job_id: str, total_segments: int):
        """Simulate processing progress for real-time updates"""
        for i in range(total_segments):
            progress = {
                "jobId": job_id,
                "status": "processing",
                "progress": (i + 1) / total_segments * 100,
                "current_segment": i + 1,
                "total_segments": total_segments
            }
            yield progress
    
    def cleanup(self):
        """Clean up temporary files"""
        import shutil
        try:
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            logger.warning(f"Error cleaning up temp files: {str(e)}")

# Global instance
stream_simulation_service = StreamSimulationService()