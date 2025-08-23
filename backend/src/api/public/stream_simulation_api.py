#!/usr/bin/env python3
"""
Stream Simulation API - Drop-in replacement for audio_transcripts.py
Provides the same API endpoints but uses stream simulation instead of Whisper
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional
import os
import asyncio
import tempfile
import shutil
from datetime import datetime
from src.services.stream_simulation_service import stream_simulation_service

router = APIRouter()

# Constants
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB in bytes
ALLOWED_FORMATS = {
    "audio/flac": ".flac",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/mp4": ".mp4",
    "audio/x-m4a": ".m4a",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
    "audio/x-wav": ".wav",
}

class TranscriptionRequest(BaseModel):
    """Request model for audio transcription."""
    job_id: str = Field(..., description="Unique job identifier for tracking")
    user_id: str = Field(..., description="User ID for rate limiting")
    language: Optional[str] = Field(None, description="ISO-639-1 language code")
    prompt: Optional[str] = Field(None, description="Optional prompt to guide transcription style")

class JobStatusResponse(BaseModel):
    """Response model for job status."""
    status: str = Field(..., description="Job status", example="processing")
    job_id: str = Field(..., description="Job identifier")
    message: str = Field(..., description="Status message")

def validate_audio_file(file: UploadFile) -> str:
    """Validate audio file type and size."""
    import mimetypes
    
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds 25MB limit. Got {file.size / 1024 / 1024:.2f}MB"
        )
    
    # Check content type
    content_type = file.content_type
    if content_type not in ALLOWED_FORMATS:
        # Try to guess from filename
        guessed_type = mimetypes.guess_type(file.filename)[0]
        if guessed_type not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Supported formats: flac, mp3, mp4, m4a, ogg, wav, webm"
            )
        content_type = guessed_type
    
    return ALLOWED_FORMATS[content_type]

async def process_transcription_job(
    job_id: str,
    user_id: str,
    file_path: str,
    file_name: str,
    file_size: int,
    language: Optional[str] = None,
    prompt: Optional[str] = None,
    separate_voices: bool = True,
    identify_speakers: bool = True,
    min_speakers: int = 1,
    max_speakers: int = 10
):
    """Process transcription job using stream simulation"""
    try:
        # Use stream simulation service
        result = await stream_simulation_service.process_audio_file(
            file_path=file_path,
            job_id=job_id,
            user_id=user_id,
            language=language,
            prompt=prompt,
            separate_voices=separate_voices,
            identify_speakers=identify_speakers,
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )
        
        # Send webhook to Convex
        from convex import ConvexClient
        import os
        CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
        convex_client = ConvexClient(CONVEX_URL)
        
        convex_client.mutation("mutations/audioTranscripts:updateResult", {
            "jobId": job_id,
            "status": "completed",
            **result
        })
        
    except Exception as e:
        # Send failure webhook
        from convex import ConvexClient
        import os
        CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
        convex_client = ConvexClient(CONVEX_URL)
        
        convex_client.mutation("mutations/audioTranscripts:updateResult", {
            "jobId": job_id,
            "status": "failed",
            "error": str(e)
        })
    finally:
        # Clean up temporary file
        try:
            os.remove(file_path)
        except:
            pass

@router.post("/transcribe", response_model=JobStatusResponse, summary="Transcribe Audio File")
async def transcribe_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Audio file to transcribe"),
    job_id: str = Form(..., description="Unique job identifier"),
    user_id: str = Form(..., description="User ID for rate limiting"),
    language: Optional[str] = Form(None, description="ISO-639-1 language code"),
    prompt: Optional[str] = Form(None, description="Optional transcription prompt"),
    separate_voices: Optional[bool] = Form(True, description="Extract vocals from background music/noise"),
    identify_speakers: Optional[bool] = Form(True, description="Identify different speakers"),
    min_speakers: Optional[int] = Form(1, description="Minimum expected speakers"),
    max_speakers: Optional[int] = Form(10, description="Maximum expected speakers")
):
    """
    Transcribe an audio file using stream simulation with speaker diarization
    
    This endpoint accepts audio files and initiates an asynchronous transcription job
    using our local stream simulation service with advanced speaker identification.
    
    **Supported Formats**: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
    **File Size Limit**: 25MB
    **Features**: Speaker identification, real-time processing simulation
    
    Returns:
        Job status with processing message
    """
    # Validate file
    file_extension = validate_audio_file(file)
    
    # Create temporary file
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, f"{job_id}{file_extension}")
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(temp_file_path)
        
        # Process in background
        background_tasks.add_task(
            process_transcription_job,
            job_id=job_id,
            user_id=user_id,
            file_path=temp_file_path,
            file_name=file.filename,
            file_size=file_size,
            language=language,
            prompt=prompt,
            separate_voices=separate_voices,
            identify_speakers=identify_speakers,
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )
        
        return JobStatusResponse(
            status="processing",
            job_id=job_id,
            message="Audio transcription started with stream simulation"
        )
        
    except Exception as e:
        # Clean up on error
        try:
            os.remove(temp_file_path)
            os.rmdir(temp_dir)
        except:
            pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process audio file: {str(e)}"
        )

@router.get("/health", summary="Health Check")
async def health_check():
    """
    Check if the stream simulation service is healthy
    
    Returns:
        Service status and capabilities
    """
    return {
        "status": "healthy",
        "service": "stream-simulation",
        "features": ["transcription", "speaker_diarization", "real_time_simulation"],
        "model": "modern_stream_simulation"
    }