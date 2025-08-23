"""
Voice Models API Endpoints

Serves available TTS providers/models for cloning/run-time voice generation.
"""
from fastapi import APIRouter, HTTPException, File, UploadFile
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-models", tags=["voice-models"])

@router.get("/", response_model=List[Dict[str, Any]])
async def list_voice_models():
    try:
        # Static for now; in future wire to TTSManager/DB
        models = [
            {
                "id": "gemini",
                "label": "gemini",
                "provider": "gemini",
                "description": "Gemini Live realtime voices (no cloning)",
                "capabilities": {
                    "cloning": False,
                    "streaming": True,
                    "latency_ms": 120,
                },
            },
            {
                "id": "openai",
                "label": "openai",
                "provider": "openai",
                "description": "OpenAI Realtime TTS voices (Alloy, Nova, etc.)",
                "capabilities": {
                    "cloning": False,
                    "streaming": True,
                    "latency_ms": 150,
                },
            },
            {
                "id": "google",
                "label": "google",
                "provider": "google",
                "description": "Google Cloud Text-to-Speech standard voices",
                "capabilities": {
                    "cloning": False,
                    "streaming": True,
                    "latency_ms": 180,
                },
            },
            {
                "id": "dia",
                "label": "dia",
                "provider": "dia",
                "description": "Ultra-realistic dialogue with multi-speaker support and cloning",
                "capabilities": {
                    "cloning": True,
                    "streaming": True,
                    "latency_ms": 200
                }
            },
            {
                "id": "orpheus",
                "label": "orpheus",
                "provider": "orpheus",
                "description": "Human-like speech with zero-shot cloning and emotion control",
                "capabilities": {
                    "cloning": True,
                    "streaming": True,
                    "latency_ms": 200
                }
            },
            {
                "id": "chatterbox",
                "label": "chatterbox",
                "provider": "chatterbox",
                "description": "Open-source TTS with voice cloning",
                "capabilities": {
                    "cloning": True,
                    "streaming": True,
                    "latency_ms": 180
                }
            },
            {
                "id": "sesame-csm",
                "label": "sesame-csm",
                "provider": "sesame",
                "description": "Sesame CSM 1B - Conversational Speech Model with lifelike AI voice generation and cloning, runs locally",
                "capabilities": {
                    "cloning": True,
                    "streaming": True,
                    "latency_ms": 220
                }
            },
            {
                "id": "minimax-speech-2-5",
                "label": "MiniMax Speech 2.5",
                "provider": "minimax",
                "description": "Enhanced multilingual TTS (40+ languages) with high-fidelity voice cloning. Supports quick voice cloning workflow.",
                "capabilities": {
                    "cloning": True,
                    "streaming": False,
                    "latency_ms": 150
                }
            },
            {
                "id": "elevenlabs",
                "label": "elevenlabs",
                "provider": "elevenlabs",
                "description": "Premium cloud-based TTS with natural voice cloning",
                "capabilities": {
                    "cloning": True,
                    "streaming": True,
                    "latency_ms": 150
                }
            },
            {
                "id": "kokoro",
                "label": "kokoro",
                "provider": "kokoro",
                "description": "Emotional TTS model with expressive voice synthesis",
                "capabilities": {
                    "cloning": False,
                    "streaming": True,
                    "latency_ms": 250
                }
            }
        ]
        return models
    except Exception as e:
        logger.error(f"Failed to list voice models: {e}")
        raise HTTPException(status_code=500, detail="Failed to list voice models")


# ──────────────────────────────────────────────────────────────────────────────
# MiniMax Quick Voice Cloning integration
# ──────────────────────────────────────────────────────────────────────────────

MINIMAX_API_KEY: Optional[str] = os.getenv("MINIMAX_API_KEY")
MINIMAX_GROUP_ID: Optional[str] = os.getenv("MINIMAX_GROUP_ID")


def _ensure_minimax_env():
    if not MINIMAX_API_KEY or not MINIMAX_GROUP_ID:
        raise HTTPException(
            status_code=500,
            detail="MiniMax configuration missing: set MINIMAX_API_KEY and MINIMAX_GROUP_ID in backend environment",
        )


@router.get("/minimax/models")
async def minimax_supported_models():
    """Return supported MiniMax preview models for quick-clone preview."""
    return {
        "preview_models": [
            "speech-2.5-hd-preview",
            "speech-2.5-turbo-preview",
            "speech-02-hd",
            "speech-02-turbo",
            "speech-01-hd",
            "speech-01-turbo",
        ]
    }


@router.post("/minimax/upload")
async def minimax_upload_voice(file: UploadFile = File(...)):
    """
    Forward an uploaded audio file to MiniMax File Upload API to obtain a file_id
    for quick voice cloning (purpose=voice_clone).

    Accepts MP3/M4A/WAV; duration 10s–5min; size <20MB.
    """
    try:
        _ensure_minimax_env()

        file_bytes = await file.read()
        url = f"https://api.minimax.io/v1/files/upload?GroupId={MINIMAX_GROUP_ID}"
        headers = {
            "Authorization": f"Bearer {MINIMAX_API_KEY}",
        }
        data = {"purpose": "voice_clone"}
        files = {"file": (file.filename or "audio", file_bytes, file.content_type or "application/octet-stream")}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, data=data, files=files)

        if resp.status_code >= 400:
            logger.error("MiniMax upload failed: %s", resp.text)
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        return resp.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading to MiniMax: {e}")
        raise HTTPException(status_code=500, detail="MiniMax upload failed")


class MiniMaxCloneRequest(BaseModel):
    file_id: Any  # MiniMax returns int64; allow str for flexibility
    voice_id: str
    need_noise_reduction: Optional[bool] = None
    text: Optional[str] = None
    model: Optional[str] = None
    accuracy: Optional[float] = None
    need_volume_normalization: Optional[bool] = None


@router.post("/minimax/voice_clone")
async def minimax_voice_clone(payload: MiniMaxCloneRequest):
    """
    Trigger MiniMax Quick Voice Cloning with a previously uploaded file_id and a custom voice_id.
    Optionally include preview text and model to receive a preview link (charges apply).
    """
    try:
        _ensure_minimax_env()

        url = f"https://api.minimax.io/v1/voice_clone?GroupId={MINIMAX_GROUP_ID}"
        headers = {
            "Authorization": f"Bearer {MINIMAX_API_KEY}",
            "content-type": "application/json",
        }

        # Only send fields provided by the client
        json_body = {k: v for k, v in payload.model_dump(exclude_none=True).items()}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=json_body)

        if resp.status_code >= 400:
            logger.error("MiniMax voice_clone failed: %s", resp.text)
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        return resp.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calling MiniMax voice_clone: {e}")
        raise HTTPException(status_code=500, detail="MiniMax voice_clone failed")
