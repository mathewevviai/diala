#!/usr/bin/env python3
"""
Test Audio Preparation - Verify audio loading and preprocessing
Tests audio file loading and basic preprocessing to ensure chunks are created correctly
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

# ------------------------------------------------ CONFIG
AUDIO_FILE_PATH = PROJECT_ROOT / "tests" / "data" / "GlenCoco" / "RE37bc4d65b8e3edef3412c4868920127d.wav"

def convert_audio_to_pcm_bytes(audio_chunk: np.ndarray, sample_rate: int) -> bytes:
    """Convert numpy audio array to 16-bit PCM bytes for the service."""
    if audio_chunk.dtype != np.float32:
        audio_chunk = audio_chunk.astype(np.float32)
    
    # Convert float32 [-1.0, 1.0] to int16 [-32768, 32767]
    audio_int16 = (audio_chunk * 32767).astype(np.int16)
    return audio_int16.tobytes()

def analyze_audio_chunk(audio_np: np.ndarray, sample_rate: int) -> dict:
    """Analyze audio chunk for quality and characteristics."""
    if len(audio_np) == 0:
        return {"valid": False, "reason": "Empty"}
    
    rms = np.sqrt(np.mean(audio_np ** 2))
    peak = np.max(np.abs(audio_np))
    zero_crossings = len(np.where(np.diff(np.sign(audio_np)))[0])
    
    # Speech detection metrics
    energy_threshold = 0.01
    has_speech = rms > energy_threshold
    
    return {
        "valid": True,
        "samples": len(audio_np),
        "duration": len(audio_np) / sample_rate,
        "rms": rms,
        "peak": peak,
        "zero_crossings": zero_crossings,
        "has_speech": has_speech,
        "speech_ratio": rms / max(peak, 0.001)
    }

async def test_audio_preparation():
    """Test audio loading and chunk preparation."""
    logger.info("="*80)
    logger.info("AUDIO PREPARATION TEST")
    logger.info("="*80)
    
    start_time = time.time()
    
    # Load audio file
    logger.info(f"Loading: {AUDIO_FILE_PATH.name}")
    TARGET_SR = 16000
    
    try:
        audio_waveform, sr = torchaudio.load(str(AUDIO_FILE_PATH), normalize=True)
        logger.info(f"Loaded: {sr}Hz, shape: {audio_waveform.shape}")
        
        # Handle stereo audio - convert to mono
        if audio_waveform.ndim > 1 and audio_waveform.shape[0] == 2:
            logger.info("Converting stereo to mono")
            audio_waveform = torch.mean(audio_waveform, dim=0)
        
        if sr != TARGET_SR:
            logger.info(f"Resampling: {sr}Hz → {TARGET_SR}Hz")
            resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=TARGET_SR)
            audio_waveform = resampler(audio_waveform)
        
        audio_np = audio_waveform.squeeze().numpy()
        
        # Analyze full audio
        full_analysis = analyze_audio_chunk(audio_np, TARGET_SR)
        logger.info(f"Full audio: {full_analysis}")
        
        # Ensure we have enough samples
        if len(audio_np) < 100:
            logger.error("Audio file has insufficient samples for processing")
            return []
        
        # Process in chunks
        num_samples = len(audio_np)
        chunk_samples = int(2.0 * TARGET_SR)  # 2 second chunks
        
        logger.info(f"Total samples: {num_samples}, chunk samples: {chunk_samples}")
        logger.info(f"Expected chunks: {max(1, num_samples // chunk_samples)}")
        
        # Test first few chunks
        test_chunks = 5
        for i in range(min(test_chunks, num_samples // chunk_samples)):
            offset = i * chunk_samples
            chunk = audio_np[offset : offset + chunk_samples]
            
            chunk_analysis = analyze_audio_chunk(chunk, TARGET_SR)
            logger.info(f"Chunk {i}: {chunk_analysis}")
            
            # Test PCM conversion
            pcm_bytes = convert_audio_to_pcm_bytes(chunk, TARGET_SR)
            logger.info(f"Chunk {i}: PCM bytes length: {len(pcm_bytes)}")
        
        total_time = time.time() - start_time
        
        logger.info("="*80)
        logger.info("AUDIO PREPARATION TEST COMPLETE")
        logger.info("="*80)
        logger.info(f"Total processing time: {total_time:.2f}s")
        logger.info(f"Audio ready for ASR testing")
        
        return True
        
    except Exception as e:
        logger.error(f"Audio preparation failed: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    asyncio.run(test_audio_preparation())