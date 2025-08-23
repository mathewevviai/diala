"""
Unified TTS API

Provides a single endpoint to synthesize speech across multiple providers.
Currently supports: chatterbox (local), elevenlabs, openai. MiniMax placeholder.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import os
import io
import base64
import httpx
import logging

from src.services.chatterbox_service import ChatterboxService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts", tags=["TTS Unified"])


class SpeakRequest(BaseModel):
    provider: str = Field(..., description="TTS provider id, e.g., 'chatterbox', 'elevenlabs', 'openai', 'minimax'")
    text: str = Field(..., description="Text to speak")
    voice_id: Optional[str] = Field(None, description="Voice id or name depending on provider")
    format: Optional[str] = Field("wav", description="audio format: wav|mp3")


ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_CLOUD_TTS_API_KEY = os.getenv("GOOGLE_CLOUD_TTS_API_KEY")
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY")
MINIMAX_GROUP_ID = os.getenv("MINIMAX_GROUP_ID")
KOKORO_API_URL = os.getenv("KOKORO_API_URL", "http://localhost:8880/v1")
DIA_API_URL = os.getenv("DIA_API_URL", "http://localhost:8882/v1")
ORPHEUS_API_URL = os.getenv("ORPHEUS_API_URL", "http://localhost:5005")
SESAme_API_URL = os.getenv("SESAME_API_URL")

chatterbox_service = ChatterboxService()


async def _speak_chatterbox(text: str, voice_id: Optional[str], fmt: str):
    audio_path = await chatterbox_service.generate_speech(
        text=text,
        voice_id=voice_id or "default",
        chunk_size=2048,
        exaggeration=1.0,
        cfg_weight=1.7,
    )
    return StreamingResponse(open(audio_path, "rb"), media_type="audio/wav")


async def _elevenlabs_resolve_voice_id(name_or_id: str) -> str:
    # If it already looks like an id (uuid-ish), use as-is
    if name_or_id and len(name_or_id) >= 24 and "-" in name_or_id:
        return name_or_id
    # Otherwise, try to resolve by name
    try:
        if not ELEVEN_LABS_API_KEY:
            return name_or_id
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {"xi-api-key": ELEVEN_LABS_API_KEY}
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code >= 400:
            return name_or_id
        data = resp.json()
        for v in data.get("voices", []):
            if v.get("name", "").lower() == (name_or_id or "").lower():
                return v.get("voice_id", name_or_id)
        return name_or_id
    except Exception:
        return name_or_id


async def _speak_elevenlabs(text: str, voice_id: Optional[str], fmt: str):
    if not ELEVEN_LABS_API_KEY:
        raise HTTPException(status_code=500, detail="ELEVEN_LABS_API_KEY not configured")
    resolved_voice = await _elevenlabs_resolve_voice_id(voice_id or "Rachel")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{resolved_voice}"
    headers = {
        "Accept": "audio/mpeg" if fmt == "mp3" else "audio/mpeg",  # Their API returns mpeg by default
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY,
    }
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.ConnectError:
        logger.error("Kokoro TTS connect error: %s", url)
        raise HTTPException(status_code=502, detail=f"Kokoro TTS unreachable at {url}")
    if resp.status_code >= 400:
        logger.error("ElevenLabs TTS failed: %s", resp.text)
        raise HTTPException(status_code=resp.status_code, detail="ElevenLabs TTS failed")
    # Return as audio/mpeg; the frontend will still play
    return StreamingResponse(io.BytesIO(resp.content), media_type="audio/mpeg")


async def _speak_openai(text: str, voice_id: Optional[str], fmt: str):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    model = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
    voice = voice_id or os.getenv("OPENAI_TTS_VOICE", "alloy")
    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "voice": voice,
        "input": text,
        "format": "mp3" if fmt == "mp3" else "wav",
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.ConnectError:
        logger.error("Dia TTS connect error: %s", url)
        raise HTTPException(status_code=502, detail=f"Dia TTS unreachable at {url}")
    if resp.status_code >= 400:
        logger.error("OpenAI TTS failed: %s", resp.text)
        raise HTTPException(status_code=resp.status_code, detail="OpenAI TTS failed")
    media = "audio/mpeg" if fmt == "mp3" else "audio/wav"
    return StreamingResponse(io.BytesIO(resp.content), media_type=media)


async def _speak_minimax(text: str, voice_id: Optional[str], fmt: str):
    # Placeholder until MiniMax TTS endpoint is finalized
    if not (MINIMAX_API_KEY and MINIMAX_GROUP_ID):
        raise HTTPException(status_code=501, detail="MiniMax TTS not configured")
    raise HTTPException(status_code=501, detail="MiniMax TTS not implemented")


async def _speak_google(text: str, voice_id: Optional[str], fmt: str):
    if not GOOGLE_CLOUD_TTS_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_CLOUD_TTS_API_KEY not configured")
    name = voice_id or "en-US-Neural2-A"
    # Derive languageCode from name prefix like en-US-*
    language_code = "en-US"
    try:
        parts = name.split("-")
        if len(parts) >= 2:
            language_code = f"{parts[0]}-{parts[1]}"
    except Exception:
        pass
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_CLOUD_TTS_API_KEY}"
    payload = {
        "input": {"text": text},
        "voice": {"languageCode": language_code, "name": name},
        "audioConfig": {"audioEncoding": "MP3" if fmt == "mp3" else "LINEAR16"},
    }
    headers = {"Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.ConnectError:
        logger.error("Orpheus TTS connect error: %s", url)
        raise HTTPException(status_code=502, detail=f"Orpheus TTS unreachable at {url}")
    if resp.status_code >= 400:
        logger.error("Google TTS failed: %s", resp.text)
        raise HTTPException(status_code=resp.status_code, detail="Google TTS failed")
    data = resp.json()
    b64 = data.get("audioContent")
    if not b64:
        raise HTTPException(status_code=500, detail="Google TTS returned empty audioContent")
    audio_bytes = base64.b64decode(b64)
    media = "audio/mpeg" if fmt == "mp3" else "audio/wav"
    return StreamingResponse(io.BytesIO(audio_bytes), media_type=media)


async def _speak_kokoro(text: str, voice_id: Optional[str], fmt: str):
    """Call Kokoro-FastAPI /v1/audio/speech with streaming or buffered audio."""
    logger.info("=== KOKORO TTS DEBUG ===")
    logger.info(f"Input: text='{text[:100]}...', voice='{voice_id}', fmt='{fmt}'")
    
    if not KOKORO_API_URL:
        logger.error("❌ KOKORO_API_URL not configured")
        raise HTTPException(status_code=500, detail="KOKORO_API_URL not configured")
    
    voice = voice_id or "af_heart"
    url = f"{KOKORO_API_URL.rstrip('/')}/audio/speech"
    
    # Fix format mapping - use actual format instead of PCM for MP3
    response_format = fmt if fmt in ["mp3", "wav"] else "wav"
    
    payload = {
        "model": "kokoro",
        "input": text,
        "voice": voice,
        "response_format": response_format,
        "speed": 1.0,
        "stream": True,
        "language": "EN",
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": f"audio/{response_format}",
    }
    
    logger.info(f"KOKORO_API_URL: {KOKORO_API_URL}")
    logger.info(f"Final URL: {url}")
    logger.info(f"Response format: {response_format}")
    logger.info(f"Payload: {payload}")
    logger.info(f"Headers: {headers}")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info("🔄 Sending request to Kokoro...")
            resp = await client.post(url, headers=headers, json=payload)
            
        logger.info(f"✅ Response received: {resp.status_code}")
        logger.info(f"Response headers: {dict(resp.headers)}")
        logger.info(f"Content-Type: {resp.headers.get('content-type')}")
        
        if resp.status_code >= 400:
            logger.error(f"❌ Kokoro TTS failed: {resp.status_code} - {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=f"Kokoro TTS failed: {resp.text}")
            
        content_length = len(resp.content) if hasattr(resp, 'content') else 'streaming'
        logger.info(f"Content length: {content_length}")
        
        ct = resp.headers.get("content-type", "audio/wav")
        logger.info(f"Final content-type: {ct}")
        logger.info("=== KOKORO TTS SUCCESS ===")
        
        return StreamingResponse(io.BytesIO(resp.content), media_type=ct)
        
    except Exception as e:
        logger.error(f"❌ Kokoro TTS exception: {type(e).__name__}: {str(e)}")
        raise


async def _speak_external_json(
    base_url: str,
    path: str,
    payload: Dict[str, Any],
    prefer_format: str,
):
    """Generic JSON POST -> audio response adapter.

    Accepts either binary audio/* or JSON { audio: base64, mime? }.
    """
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
    if resp.status_code >= 400:
        logger.error("External TTS failed [%s]: %s", url, resp.text)
        raise HTTPException(status_code=resp.status_code, detail="External TTS failed")
    ct = resp.headers.get("content-type", "")
    if ct.startswith("audio/"):
        return StreamingResponse(io.BytesIO(resp.content), media_type=ct)
    try:
        data = resp.json()
        b64 = data.get("audio")
        if not b64:
            raise ValueError("missing audio field")
        audio_bytes = base64.b64decode(b64)
        media = data.get("mime") or ("audio/mpeg" if prefer_format == "mp3" else "audio/wav")
        return StreamingResponse(io.BytesIO(audio_bytes), media_type=media)
    except Exception:
        raise HTTPException(status_code=500, detail="External TTS returned unexpected response")


async def _speak_dia(text: str, voice_id: Optional[str], fmt: str):
    if not DIA_API_URL:
        raise HTTPException(status_code=500, detail="DIA_API_URL not configured")
    voice = voice_id or "dia-voice-1"
    url = f"{DIA_API_URL.rstrip('/')}/audio/speech"
    response_format = "pcm" if fmt == "mp3" else "wav"
    payload = {
        "model": "dia-standard",
        "text": text,
        "voice": voice,
        "response_format": response_format,
        "speed": 1.0,
        "stream": True,
    }
    headers = {"Content-Type": "application/json", "Accept": f"audio/{response_format}"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
    if resp.status_code >= 400:
        logger.error("Dia TTS failed: %s", resp.text)
        raise HTTPException(status_code=resp.status_code, detail="Dia TTS failed")
    ct = resp.headers.get("content-type", "audio/wav")
    return StreamingResponse(io.BytesIO(resp.content), media_type=ct)


async def _speak_orpheus(text: str, voice_id: Optional[str], fmt: str):
    if not ORPHEUS_API_URL:
        raise HTTPException(status_code=500, detail="ORPHEUS_API_URL not configured")
    voice = voice_id or "tara"
    url = f"{ORPHEUS_API_URL.rstrip('/')}/v1/audio/speech"
    response_format = "wav"
    payload = {
        "input": text,
        "model": "orpheus",
        "voice": voice,
        "response_format": response_format,
    }
    headers = {"Content-Type": "application/json", "Accept": "audio/wav"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
    if resp.status_code >= 400:
        logger.error("Orpheus TTS failed: %s", resp.text)
        raise HTTPException(status_code=resp.status_code, detail="Orpheus TTS failed")
    ct = resp.headers.get("content-type", "audio/wav")
    return StreamingResponse(io.BytesIO(resp.content), media_type=ct)


async def _speak_sesame(text: str, voice_id: Optional[str], fmt: str):
    if not SESAMe_API_URL:
        raise HTTPException(status_code=500, detail="SESAME_API_URL not configured")
    voice = voice_id or "default"
    payload = {"text": text, "voice": voice, "format": "mp3" if fmt == "mp3" else "wav"}
    return await _speak_external_json(SESAMe_API_URL, "/synthesize", payload, fmt)


@router.post("/speak")
async def speak(req: SpeakRequest):
    logger.info("=== TTS SPEAK REQUEST ===")
    logger.info(f"Provider: {req.provider}")
    logger.info(f"Text: '{req.text[:100]}...'")
    logger.info(f"Voice ID: {req.voice_id}")
    logger.info(f"Format: {req.format}")
    
    provider = (req.provider or "").lower()
    fmt = (req.format or "wav").lower()
    
    logger.info(f"Normalized provider: {provider}")
    logger.info(f"Normalized format: {fmt}")
    
    try:
        if provider == "chatterbox":
            logger.info("🎯 Using chatterbox provider")
            return await _speak_chatterbox(req.text, req.voice_id, fmt)
        elif provider == "elevenlabs":
            logger.info("🎯 Using elevenlabs provider")
            return await _speak_elevenlabs(req.text, req.voice_id, fmt)
        elif provider == "openai":
            logger.info("🎯 Using openai provider")
            return await _speak_openai(req.text, req.voice_id, fmt)
        elif provider == "google" or provider == "gemini":
            logger.info("🎯 Using google/gemini provider")
            return await _speak_google(req.text, req.voice_id, fmt)
        elif provider == "minimax":
            logger.info("🎯 Using minimax provider")
            return await _speak_minimax(req.text, req.voice_id, fmt)
        elif provider == "kokoro":
            logger.info("🎯 Using kokoro provider")
            return await _speak_kokoro(req.text, req.voice_id, fmt)
        elif provider == "sesame":
            logger.info("🎯 Using sesame provider")
            return await _speak_sesame(req.text, req.voice_id, fmt)
        else:
            logger.error(f"❌ Unsupported provider: {provider}")
            raise HTTPException(status_code=501, detail=f"TTS provider '{provider}' not supported")
    except Exception as e:
        logger.error(f"❌ TTS speak error: {type(e).__name__}: {str(e)}")
        raise


# ──────────────────────────────────────────────────────────────────────────────
# Streaming variants
# ──────────────────────────────────────────────────────────────────────────────

async def _stream_file_bytes(path: str, chunk_size: int = 8192):
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk


async def _proxy_stream_post(url: str, json_body: Dict[str, Any], headers: Dict[str, str]) -> StreamingResponse:
    try:
        client = httpx.AsyncClient(timeout=60.0)
        resp = await client.post(url, headers=headers, json=json_body)
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail=f"Upstream TTS unreachable at {url}")
    if resp.status_code >= 400:
        text = await resp.aread()
        raise HTTPException(status_code=resp.status_code, detail=text.decode(errors="ignore")[:300])

    async def streamer():
        async with client.stream("POST", url, headers=headers, json=json_body) as r:
            async for chunk in r.aiter_bytes():
                if chunk:
                    yield chunk
    # content-type may be audio/wav or audio/pcm
    media = resp.headers.get("content-type", "audio/wav")
    return StreamingResponse(streamer(), media_type=media)


@router.post("/speak/stream")
async def speak_stream(req: SpeakRequest):
    provider = (req.provider or "").lower()
    fmt = (req.format or "wav").lower()
    if provider == "chatterbox":
        # Generate then stream file bytes
        path = await chatterbox_service.generate_speech(req.text, req.voice_id or "default")
        return StreamingResponse(_stream_file_bytes(path), media_type="audio/wav")
    elif provider == "kokoro":
        voice = req.voice_id or "af_heart"
        url = f"{KOKORO_API_URL.rstrip('/')}/audio/speech"
        response_format = "pcm" if fmt == "mp3" else "wav"
        body = {
            "model": "kokoro",
            "input": req.text,
            "voice": voice,
            "response_format": response_format,
            "speed": 1.0,
            "stream": True,
            "language": "EN",
        }
        headers = {"Content-Type": "application/json", "Accept": f"audio/{response_format}"}
        return await _proxy_stream_post(url, body, headers)
    # dia and orpheus removed per request
    else:
        # For cloud providers, proxy non-streaming as stream
        return await speak(req)


# ──────────────────────────────────────────────────────────────────────────────
# Health / diagnostics
# ──────────────────────────────────────────────────────────────────────────────

async def _check_base_url(url: Optional[str]) -> Dict[str, Any]:
    if not url:
        return {"configured": False, "reachable": False, "status": None, "url": None}
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, headers={"Accept": "*/*"})
        return {"configured": True, "reachable": True, "status": resp.status_code, "url": url}
    except Exception as e:
        return {"configured": True, "reachable": False, "status": None, "url": url, "error": str(e)}


@router.get("/health")
async def tts_health():
    """Report configuration and basic reachability for TTS providers."""
    results = {
        "chatterbox": {
            "configured": True,
            "reachable": True,  # in-process service
            "url": "in-process",
        },
        "openai": {
            "configured": bool(OPENAI_API_KEY),
            "reachable": bool(OPENAI_API_KEY),
        },
        "elevenlabs": {
            "configured": bool(ELEVEN_LABS_API_KEY),
            "reachable": bool(ELEVEN_LABS_API_KEY),
        },
        "google": {
            "configured": bool(GOOGLE_CLOUD_TTS_API_KEY),
            "reachable": bool(GOOGLE_CLOUD_TTS_API_KEY),
        },
    }
    results["kokoro"] = await _check_base_url(KOKORO_API_URL)
    results["dia"] = await _check_base_url(DIA_API_URL)
    results["orpheus"] = await _check_base_url(ORPHEUS_API_URL)
    # Sesame optional
    results["sesame"] = await _check_base_url(SESAme_API_URL)
    return results


async def check_tts_providers_and_log(logger_: logging.Logger):
    try:
        health = await tts_health()
        logger_.info("TTS providers health: %s", health)
    except Exception as e:
        logger_.error("TTS health check failed: %s", e)
