#!/usr/bin/env python3
"""
Diagnostic Test - Test ASR with Original Audio (No Vocal Separation)
Tests real-time transcription using original audio file to isolate ASR issues
"""

import os
import asyncio
import logging
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torchaudio

# ------------------------------------------------ logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# --- Setup Project Root and Environment ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / ".env")

# --- Import from your project ---
from src.services.realtime_analysis_service import get_realtime_analysis_service

# ------------------------------------------------ CONFIG
AUDIO_FILE_PATH = PROJECT_ROOT / "tests" / "data" / "GlenCoco" / "RE37bc4d65b8e3edef3412c4868920127d.wav"
CHUNK_DURATION_S = 2.0  # Reduced to 2 seconds for better ASR detection
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def convert_audio_to_pcm_bytes(audio_chunk: np.ndarray, sample_rate: int) -> bytes:
    """Convert numpy audio array to 16-bit PCM bytes for the service."""
    if audio_chunk.dtype != np.float32:
        audio_chunk = audio_chunk.astype(np.float32)
    
    # Convert float32 [-1.0, 1.0] to int16 [-32768, 32767]
    audio_int16 = (audio_chunk * 32767).astype(np.int16)
    return audio_int16.tobytes()

def validate_audio_quality(audio_np: np.ndarray, sample_rate: int) -> dict:
    """Validate audio quality and return metrics."""
    if len(audio_np) == 0:
        return {"valid": False, "reason": "Empty audio array"}
    
    # Check for silence
    rms = np.sqrt(np.mean(audio_np ** 2))
    if rms < 0.001:
        return {"valid": False, "reason": "Audio is too quiet", "rms": rms}
    
    # Check for clipping
    clipping_ratio = np.sum(np.abs(audio_np) > 0.95) / len(audio_np)
    
    return {
        "valid": True,
        "rms": rms,
        "clipping_ratio": clipping_ratio,
        "duration": len(audio_np) / sample_rate,
        "samples": len(audio_np)
    }

async def test_original_audio():
    """Test ASR with original audio file (no vocal separation)."""
    logger.info(f"Testing original audio file: {AUDIO_FILE_PATH.name}")
    logger.info(f"Using {CHUNK_DURATION_S}-second chunks")
    start_time = time.time()

    # Initialize the realtime analysis service
    analysis_service = get_realtime_analysis_service()
    
    # Load original audio file directly (no vocal separation)
    logger.info("Loading original audio file...")
    TARGET_SR = 16000
    
    try:
        audio_waveform, sr = torchaudio.load(str(AUDIO_FILE_PATH), normalize=True)
        logger.info(f"Loaded audio: {sr}Hz, shape: {audio_waveform.shape}")
        
        # Handle stereo audio - convert to mono
        if audio_waveform.ndim > 1 and audio_waveform.shape[0] == 2:
            logger.info("Converting stereo to mono")
            audio_waveform = torch.mean(audio_waveform, dim=0)
        
        if sr != TARGET_SR:
            logger.info(f"Resampling from {sr}Hz to {TARGET_SR}Hz...")
            resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=TARGET_SR)
            audio_waveform = resampler(audio_waveform)
        
        # Convert to a 1D numpy array for processing
        audio_waveform_np = audio_waveform.squeeze().numpy()
        
        # Ensure we have enough samples
        if len(audio_waveform_np) < 100:
            logger.error("Audio file has insufficient samples for processing")
            return []
        
        # Validate audio quality
        quality_metrics = validate_audio_quality(audio_waveform_np, TARGET_SR)
        logger.info(f"Audio quality: {quality_metrics}")
        
        if not quality_metrics["valid"]:
            logger.error(f"Invalid audio: {quality_metrics['reason']}")
            return []
        
        # Process in chunks
        num_samples = len(audio_waveform_np)
        chunk_samples = int(CHUNK_DURATION_S * TARGET_SR)
        
        logger.info(f"Total samples: {num_samples}, chunk samples: {chunk_samples}")
        logger.info(f"Expected chunks: {max(1, num_samples // chunk_samples)}")
        
        offset = 0
        chunk_index = 0
        results = []
        empty_transcriptions = 0
        
        while offset < num_samples:
            chunk_start_time = offset / TARGET_SR
            chunk = audio_waveform_np[offset : offset + chunk_samples]
            
            if len(chunk) < chunk_samples // 2:  # Skip very small chunks
                break

            # Convert chunk to PCM bytes (as would be sent to endpoint)
            pcm_bytes = convert_audio_to_pcm_bytes(chunk, TARGET_SR)
            
            # Process using the RealtimeAnalysisService (simulating endpoint call)
            result = await analysis_service.process_sentiment_chunk(pcm_bytes)
            
            if result and result.get("text"):
                print(f"--- CHUNK {chunk_index} ({chunk_start_time:.2f}s) ---")
                print(f"  Sentiment: {result['sentiment']}")
                print(f"  Text: {result['text']}")
                results.append(result)
            else:
                empty_transcriptions += 1
                logger.debug(f"Chunk {chunk_index}: No transcription detected")
            
            offset += chunk_samples
            chunk_index += 1
        
        total_time = time.time() - start_time
        
        logger.info("="*80)
        logger.info("Original Audio Test Complete")
        logger.info(f"Total processing time: {total_time:.2f} seconds")
        logger.info(f"Total chunks processed: {len(results)}")
        logger.info(f"Empty transcriptions: {empty_transcriptions}")
        logger.info(f"Success rate: {len(results)/max(chunk_index, 1)*100:.1f}%")
        logger.info("="*80)
        
        return results
        
    except Exception as e:
        logger.error(f"Error processing original audio: {e}", exc_info=True)
        return []

if __name__ == "__main__":
    asyncio.run(test_original_audio())