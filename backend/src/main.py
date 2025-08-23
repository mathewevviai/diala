# backend/src/main.py
"""
Main FastAPI application for Diala Backend
"""

import logging
import sys
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

# Load environment variables from .env.local and .env files
from dotenv import load_dotenv
from pathlib import Path

# Get the backend root directory
backend_root = Path(__file__).resolve().parent.parent

# Load .env.local first, then .env (like in the working test)
load_dotenv(backend_root / ".env.local")
load_dotenv(backend_root / ".env")

# Configure logging (elevate to DEBUG and include module/function/line)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)],
)

# Ensure verbose logging for leadgen components
for logger_name in (
    "src.api.public.hunter_leadgen",
    "src.core.leadgen.hunter_search_service",
    "src.services.hunter_pipeline",
    "src.core.leadgen.jina_client",
):
    logging.getLogger(logger_name).setLevel(logging.DEBUG)

# Also reduce overly-chatty third-party loggers if needed (commented by default)
# logging.getLogger("httpx").setLevel(logging.INFO)
logger = logging.getLogger(__name__)

# Import service instances for pre-loading
from .services.realtime_analysis_service import get_realtime_analysis_service
from .services.audio_separation_service import audio_separation_service

# Import routers
from .api.public import (
    youtube_transcripts, hunter_leadgen, audio_transcripts,
    tiktok_content, youtube_content, instagram_content,
    twitch_content, voice_onboarding, chatterbox_tts,
    embedding_models, bulk, voice_models, procedural_audio, analysis, realtime_analysis_api,
    underlying_models, tts, tts_models,
)

# Create FastAPI app
app = FastAPI(
    title="Diala Backend API",
    description="Diala Voice Agent Backend Services",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- THE FIX: Correct CORS Configuration ---
# We explicitly list the origins (ports) that are allowed to talk to this backend.
# Using a specific list instead of "*" is more secure and resolves the
# browser's conflict with `allow_credentials=True`.
origins = [
    "http://localhost:3000",  # Your Next.js frontend
    "http://127.0.0.1:3000",
    # Add any other origins you might use, like a deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODEL LOADING STATE ---
app.state.models_ready = False

async def load_models_background():
    """The actual model loading logic, to be run in the background."""
    logger.info("Background model loading initiated...")
    try:
        realtime_service = await get_realtime_analysis_service()
        await realtime_service.ensure_models_loaded()
        # Audio separation service loads models on-demand, no pre-loading needed
        app.state.models_ready = True
        logger.info("✅ All models have been pre-loaded and the server is ready.")
    except Exception as e:
        logger.error(f"❌ Failed to load models in the background: {e}", exc_info=True)

    # Attempt to verify OSS TTS provider availability (Kokoro only for now)
    try:
        from .api.public.tts import KOKORO_API_URL
        import httpx
        if KOKORO_API_URL:
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.get(KOKORO_API_URL)
            logger.info(f"Kokoro API reachable at {KOKORO_API_URL}: {r.status_code}")
        else:
            logger.info("KOKORO_API_URL not set; skipping Kokoro reachability check")
    except Exception as e:
        logger.warning(f"Kokoro API not reachable: {e}")

@app.on_event("startup")
async def startup_event():
    """
    On startup, create a background task to load the models.
    """
    logger.info("Diala Backend API starting up...")
    asyncio.create_task(load_models_background())
    logger.info("Server is running. Model loading continues in the background.")
    # Log TTS providers health on startup
    try:
        from .api.public.tts import check_tts_providers_and_log
        asyncio.create_task(check_tts_providers_and_log(logger))
    except Exception as e:
        logger.error(f"Failed to schedule TTS health check: {e}")

# Include routers
app.include_router(audio_transcripts.router, prefix="/api/public/audio", tags=["Audio"])
app.include_router(youtube_transcripts.router, prefix="/api/public/youtube", tags=["YouTube"])
app.include_router(hunter_leadgen.router, prefix="/api/public/hunter", tags=["Hunter"])
app.include_router(tiktok_content.router, prefix="/api/public/tiktok", tags=["Social Content"])
app.include_router(youtube_content.router, prefix="/api/public/youtube", tags=["Social Content"])
app.include_router(instagram_content.router, prefix="/api/public/instagram", tags=["Social Content"])
app.include_router(twitch_content.router, prefix="/api/public/twitch", tags=["Social Content"])
app.include_router(voice_onboarding.router, tags=["Voice Onboarding"])
app.include_router(voice_models.router, prefix="/api/public", tags=["Voice Models"])
app.include_router(chatterbox_tts.router, tags=["TTS"])
app.include_router(embedding_models.router, prefix="/api/public", tags=["Embeddings"])
app.include_router(underlying_models.router, prefix="/api/public", tags=["Underlying Models"])
app.include_router(tts.router, prefix="/api/public", tags=["TTS Unified"])
app.include_router(tts_models.router, prefix="/api/public", tags=["TTS Models"])
app.include_router(bulk.router, prefix="/api/public/bulk", tags=["Bulk Processing"])
app.include_router(procedural_audio.router)
app.include_router(analysis.router, prefix="/api/public", tags=["Analysis"])
app.include_router(realtime_analysis_api.router)

# Health check endpoint now also reports model readiness
@app.get("/health", tags=["System"])
async def health_check(request: Request):
    return {
        "status": "healthy",
        "service": "diala-backend",
        "version": "1.0.0",
        "models_ready": request.app.state.models_ready
    }

@app.get("/", tags=["System"])
async def root():
    return { "message": "Welcome to Diala Backend API", "documentation": "/docs" }
