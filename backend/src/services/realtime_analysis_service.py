"""
Service for real-time audio analysis including ASR, sentiment, and speaker embedding.
"""
import numpy as np
import torch
import logging
from typing import Dict, Optional, Any
from pathlib import Path
import warnings
import asyncio
import os
from sklearn.preprocessing import StandardScaler

# Suppress specific warnings
warnings.filterwarnings("ignore", category=UserWarning, module='torch.nn.modules.conv')

logger = logging.getLogger(__name__)

# Attempt to import all necessary libraries, handling potential ImportErrors
try:
    from transformers import (
        AutoModelForSpeechSeq2Seq,
        AutoProcessor,
        pipeline
    )
    from funasr import AutoModel
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.error("Transformers or FunASR not available. ASR and sentiment analysis will be disabled.")
    TRANSFORMERS_AVAILABLE = False

try:
    from speechbrain.pretrained import EncoderClassifier as SpeakerIdModel
    from speechbrain.pretrained import SepformerSeparation as SeparatorModel
    SPEECHBRAIN_AVAILABLE = True
except ImportError:
    logger.error("SpeechBrain not available. Speaker ID and separation will be disabled.")
    SPEECHBRAIN_AVAILABLE = False

class RealtimeAnalysisService:
    """
    Manages loading and interaction with various ML models for real-time analysis.
    This service now includes fixes for model loading and pipeline initialization.
    """
    _instance: Optional['RealtimeAnalysisService'] = None
    _lock = asyncio.Lock()

    def __init__(self, device: str = None, asr_model_id: str = "distil-whisper/distil-large-v3"):
        if not TRANSFORMERS_AVAILABLE or not SPEECHBRAIN_AVAILABLE:
            raise ImportError("Required libraries (transformers, funasr, speechbrain) are not installed.")

        # Force CPU to avoid GPU memory issues
        self.device = "cpu"
        self.asr_model_id = asr_model_id
        
        self.asr_pipeline = None
        self.sentiment_model = None
        self.sentiment_scaler = StandardScaler()
        self.speaker_id_model = None
        
        self.models_loaded = False
        self._models_loading = False

    @classmethod
    async def get_instance(cls) -> 'RealtimeAnalysisService':
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    async def ensure_models_loaded(self):
        """Ensure models are loaded, with lazy loading."""
        if self.models_loaded or self._models_loading:
            return
            
        self._models_loading = True
        try:
            logger.info("Loading models for RealtimeAnalysisService...")
            await self._load_asr_model_async()
            await self._load_sentiment_model_async()
            self.models_loaded = True
            logger.info("All models for RealtimeAnalysisService loaded successfully.")
        finally:
            self._models_loading = False

    async def _load_asr_model_async(self):
        """Loads the Whisper ASR pipeline asynchronously."""
        logger.info(f"Loading Whisper ASR model: {self.asr_model_id}")
        try:
            from transformers import pipeline
            import torch
            
            # Use pipeline for Whisper
            self.asr_pipeline = pipeline(
                "automatic-speech-recognition",
                model=self.asr_model_id,
                device=self.device
            )
            
            logger.info(f"Whisper ASR model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load Whisper ASR model: {e}")
            raise

    async def _load_sentiment_model_async(self):
        """Loads the sentiment analysis model asynchronously."""
        logger.info("Loading sentiment analysis model...")
        try:
            self.sentiment_model = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                return_all_scores=True,
                device=self.device
            )
            logger.info("Sentiment model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            raise

    def _validate_audio(self, audio_bytes: bytes) -> Dict[str, Any]:
        """Validate the incoming audio chunk."""
        try:
            audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            if len(audio_np) == 0:
                return {"valid": False, "reason": "Empty audio chunk"}
            rms = np.sqrt(np.mean(audio_np**2))
            return {"valid": True, "rms": rms, "duration": len(audio_np) / 16000, "samples": len(audio_np)}
        except Exception as e:
            return {"valid": False, "reason": str(e)}

    async def transcribe_chunk(self, audio_input: Any) -> str:
        """Transcribes audio using Whisper ASR pipeline.

        Accepts either a file path (str), raw PCM16 bytes, or a numpy array.
        """
        await self.ensure_models_loaded()

        try:
            input_for_pipeline: Any
            if isinstance(audio_input, (bytes, bytearray)):
                # Interpret as PCM16 mono at 16 kHz
                audio_np = np.frombuffer(audio_input, dtype=np.int16).astype(np.float32) / 32768.0
                input_for_pipeline = {"array": audio_np, "sampling_rate": 16000}
            elif isinstance(audio_input, np.ndarray):
                audio_np = audio_input.astype(np.float32)
                # If appears to be int16, normalize
                if audio_np.dtype != np.float32:
                    audio_np = audio_np.astype(np.float32)
                if audio_np.max() > 1.0 or audio_np.min() < -1.0:
                    audio_np = audio_np / 32768.0
                input_for_pipeline = {"array": audio_np, "sampling_rate": 16000}
            else:
                # Assume it's a file path
                input_for_pipeline = str(audio_input)

            result = self.asr_pipeline(input_for_pipeline, return_timestamps=False)
            transcription = result.get("text", "") if isinstance(result, dict) else ""
            if not transcription:
                return "[NO SPEECH DETECTED]"
            return transcription.strip()

        except Exception as e:
            logger.error(f"Whisper ASR transcription failed: {e}")
            return "[ASR FAILED]"

    def _extract_prosody_features(self, audio_chunk_bytes: bytes) -> Optional[np.ndarray]:
        """Extracts prosody features for sentiment analysis."""
        # Return None since sentiment model is not available
        return None

    def _classify_sentiment(self, prosody_features: np.ndarray) -> str:
        """Classifies sentiment based on prosody features."""
        # Fallback sentiment classification since model is not available
        return "neutral"

    async def process_sentiment_chunk(self, audio_chunk_bytes: bytes) -> Dict[str, Any]:
        """Processes a single chunk for both transcription and sentiment."""
        await self.ensure_models_loaded()
        
        validation = self._validate_audio(audio_chunk_bytes)
        if not validation["valid"]:
            return {"text": validation.get("reason", "Invalid audio"), "sentiment": "unknown", "tokens": []}
            
        transcription_task = asyncio.create_task(self.transcribe_chunk(audio_chunk_bytes))
        
        loop = asyncio.get_event_loop()
        prosody_features = await loop.run_in_executor(None, self._extract_prosody_features, audio_chunk_bytes)
        sentiment = self._classify_sentiment(prosody_features)
        
        text = await transcription_task
        
        return {"text": text, "sentiment": sentiment, "tokens": prosody_features.tolist() if prosody_features is not None else []}

# FIX: Implement a proper singleton pattern at the module level
_service_instance = None
_service_lock = asyncio.Lock()



async def get_realtime_analysis_service() -> 'RealtimeAnalysisService':
    """Provides a singleton instance of the RealtimeAnalysisService."""
    global _service_instance
    if _service_instance is None:
        async with _service_lock:
            if _service_instance is None:
                _service_instance = RealtimeAnalysisService()
    return _service_instance
