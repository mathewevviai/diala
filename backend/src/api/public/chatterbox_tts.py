"""
Chatterbox TTS Router

Provides TTS endpoints integrated into the main FastAPI application.
Based on the standalone Chatterbox service but runs within the main process.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
import tempfile
import os
import logging

from src.services.chatterbox_service import ChatterboxService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/chatterbox")

# Initialize service (singleton)
chatterbox_service = ChatterboxService()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    health_info = await chatterbox_service.get_health_info()
    return health_info


@router.get("/voices")
async def list_voices():
    """List available voices"""
    # For now, return default voices
    # This can be extended to load custom voice models
    return [
        {
            "id": "default",
            "name": "Default Voice",
            "description": "Default Chatterbox TTS voice"
        },
        {
            "id": "custom",
            "name": "Custom Voice",
            "description": "Upload audio for voice cloning"
        }
    ]


@router.post("/generate")
async def generate_speech(
    text: str = Form(...),
    voice_id: Optional[str] = Form("default"),
    chunk_size: Optional[int] = Form(2048),
    exaggeration: Optional[float] = Form(1.0),
    cfg_weight: Optional[float] = Form(1.7)
):
    """Generate speech from text (non-streaming)"""
    try:
        logger.info(f"Generating speech for text: {text[:50]}...")
        
        # Generate audio using the service
        audio_path = await chatterbox_service.generate_speech(
            text=text,
            voice_id=voice_id,
            chunk_size=chunk_size,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight
        )
        
        # Return audio file
        return StreamingResponse(
            open(audio_path, "rb"),
            media_type="audio/wav",
            headers={"Content-Disposition": f"attachment; filename=speech.wav"}
        )
        
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate_with_voice")
async def generate_with_voice_cloning(
    text: str = Form(...),
    voice_audio: UploadFile = File(...),
    chunk_size: int = Form(2048),
    exaggeration: float = Form(1.0),
    cfg_weight: float = Form(1.7)
):
    """Generate speech with voice cloning from uploaded audio"""
    try:
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
            content = await voice_audio.read()
            tmp_audio.write(content)
            tmp_audio.flush()
            
            logger.info(f"Generating speech with voice cloning...")
            
            # Generate audio with voice cloning
            audio_path = await chatterbox_service.generate_with_voice_cloning(
                text=text,
                audio_prompt_path=tmp_audio.name,
                chunk_size=chunk_size,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight
            )
            
            # Return audio file
            return StreamingResponse(
                open(audio_path, "rb"),
                media_type="audio/wav",
                headers={"Content-Disposition": f"attachment; filename=cloned_speech.wav"}
            )
            
    except Exception as e:
        logger.error(f"Error in voice cloning: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temporary file
        if 'tmp_audio' in locals():
            try:
                os.unlink(tmp_audio.name)
            except:
                pass


@router.post("/generate_stream")
async def generate_speech_stream(
    text: str = Form(...),
    voice_id: Optional[str] = Form("default"),
    chunk_size: Optional[int] = Form(2048),
    exaggeration: Optional[float] = Form(1.0),
    cfg_weight: Optional[float] = Form(1.7)
):
    """Generate speech from text (streaming) - placeholder for future implementation"""
    raise HTTPException(
        status_code=501, 
        detail="Streaming generation not implemented in Phase 1"
    )


@router.get("/metrics")
async def metrics():
    """Endpoint for monitoring GPU metrics"""
    metrics = await chatterbox_service.get_gpu_metrics()
    return metrics