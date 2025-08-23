#!/usr/bin/env python3
"""
Test script to verify IBM Granite Speech ASR model is working correctly.
"""
import asyncio
import tempfile
import numpy as np
import librosa
from src.services.realtime_analysis_service import RealtimeAnalysisService

async def test_granite_asr():
    """Test IBM Granite Speech ASR model."""
    print("Testing IBM Granite Speech ASR model...")
    
    # Create test audio (simple sine wave)
    duration = 3.0  # 3 seconds
    sample_rate = 16000
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create a simple test audio (sine wave)
    frequency = 440  # A4 note
    audio = np.sin(2 * np.pi * frequency * t) * 0.3
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
        import soundfile as sf
        sf.write(tmp_file.name, audio, sample_rate)
        
        try:
            # Test the service
            service = RealtimeAnalysisService()
            await service.ensure_models_loaded()
            
            # Test transcription
            result = await service.transcribe_chunk(tmp_file.name)
            print(f"Transcription result: {result}")
            
            if "FAILED" not in result:
                print("✅ IBM Granite Speech ASR model loaded successfully!")
            else:
                print("❌ IBM Granite Speech ASR model failed to load or transcribe")
                
        except Exception as e:
            print(f"❌ Error testing IBM Granite Speech: {e}")
        finally:
            import os
            os.unlink(tmp_file.name)

if __name__ == "__main__":
    asyncio.run(test_granite_asr())