import os
import tempfile
import wave
import numpy as np
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
from pathlib import Path
from scipy.signal import butter, lfilter

router = APIRouter(prefix="/api/public/procedural-audio", tags=["procedural-audio"])

class AudioConfig(BaseModel):
    waveform: str
    frequency: float
    duration: float
    amplitude: float = 0.8
    effects: list[str] = []

class AudioResponse(BaseModel):
    id: str
    url: str
    config: AudioConfig
    metadata: Dict[str, str]

# Storage for generated audio files
AUDIO_STORAGE_PATH = Path("backend/audio_generator_service/generated_audio")
AUDIO_STORAGE_PATH.mkdir(parents=True, exist_ok=True)

def generate_waveform(config: AudioConfig) -> np.ndarray:
    """Generate audio waveform based on configuration."""
    sample_rate = 44100
    duration = config.duration
    frequency = config.frequency
    amplitude = config.amplitude
    
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    if config.waveform == 'sine':
        wave = amplitude * np.sin(2 * np.pi * frequency * t)
    elif config.waveform == 'square':
        wave = amplitude * np.sign(np.sin(2 * np.pi * frequency * t))
    elif config.waveform == 'sawtooth':
        wave = amplitude * (2 * (t * frequency - np.floor(t * frequency + 0.5)))
    elif config.waveform == 'triangle':
        wave = amplitude * (2 * np.abs(2 * (t * frequency - np.floor(t * frequency + 0.5))) - 1)
    elif config.waveform == 'noise':
        wave = amplitude * (2 * np.random.random(len(t)) - 1)
    else:
        wave = amplitude * np.sin(2 * np.pi * frequency * t)
    
    # Apply effects
    if 'reverb' in config.effects:
        # Simple reverb effect
        delay = int(0.1 * sample_rate)
        reverb = np.zeros_like(wave)
        reverb[delay:] = wave[:-delay] * 0.3
        wave = wave + reverb
    
    if 'delay' in config.effects:
        # Simple delay effect
        delay = int(0.2 * sample_rate)
        delay_line = np.zeros_like(wave)
        delay_line[delay:] = wave[:-delay] * 0.4
        wave = wave + delay_line
    
    if 'chorus' in config.effects:
        # Simple chorus effect
        chorus = np.zeros_like(wave)
        for offset in [0.01, 0.02]:
            delay = int(offset * sample_rate)
            chorus[delay:] = wave[:-delay] * 0.2
        wave = wave + chorus
    
    if 'filter' in config.effects:
        # Simple low-pass filter
        from scipy.signal import butter, lfilter
        nyq = sample_rate / 2
        low = 1000 / nyq
        b, a = butter(5, low, btype='low')
        wave = lfilter(b, a, wave)
    
    # Normalize
    wave = np.clip(wave, -1, 1)
    
    # Convert to 16-bit integers
    wave = (wave * 32767).astype(np.int16)
    
    return wave, sample_rate

def save_wav(audio_data: np.ndarray, sample_rate: int, filename: str) -> str:
    """Save audio data as WAV file."""
    filepath = AUDIO_STORAGE_PATH / filename
    
    with wave.open(str(filepath), 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    return str(filepath)

@router.post("/generate", response_model=AudioResponse)
async def generate_audio(config: AudioConfig):
    """Generate procedural audio based on configuration."""
    try:
        audio_id = str(uuid.uuid4())
        filename = f"{audio_id}.wav"
        
        # Generate audio
        audio_data, sample_rate = generate_waveform(config)
        
        # Save to file
        filepath = save_wav(audio_data, sample_rate, filename)
        
        # Return response
        return AudioResponse(
            id=audio_id,
            url=f"/api/public/procedural-audio/download/{audio_id}",
            config=config,
            metadata={
                "size": f"{os.path.getsize(filepath) // 1024}KB",
                "duration": f"{config.duration}s",
                "quality": "44.1kHz/16-bit"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{audio_id}")
async def download_audio(audio_id: str):
    """Download generated audio file."""
    filepath = AUDIO_STORAGE_PATH / f"{audio_id}.wav"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=str(filepath),
        filename=f"procedural-audio-{audio_id}.wav",
        media_type="audio/wav"
    )

@router.get("/preview/{audio_id}")
async def preview_audio(audio_id: str):
    """Get audio preview information."""
    filepath = AUDIO_STORAGE_PATH / f"{audio_id}.wav"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return {
        "id": audio_id,
        "exists": True,
        "size": os.path.getsize(filepath),
        "last_modified": os.path.getmtime(filepath)
    }