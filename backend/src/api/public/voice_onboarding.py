"""
Voice Onboarding API Endpoints

Handles voice cloning operations for user onboarding,
including audio upload, processing, and voice profile creation.
Uses job queue system for efficient GPU resource management.
"""

import os
import tempfile
import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging
import asyncio
from datetime import datetime
import base64

from src.services.audio_processor import audio_processor
from src.services.tts_manager import TTSManager
from src.services.voice_clone_jobs import VoiceCloneJobManager
from src.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public/voice/onboarding", tags=["voice-onboarding"])

# Initialize managers
tts_manager = TTSManager()
job_manager = VoiceCloneJobManager()


@router.post("/clone")
async def create_voice_clone(
    audio_file: UploadFile = File(..., description="Audio or video file for voice cloning"),
    user_id: Optional[str] = Form(None, description="User ID (optional)"),
    voice_name: Optional[str] = Form(None, description="Name for the voice profile"),
    sample_text: Optional[str] = Form(
        "Hello, this is my cloned voice. I can now speak with my own voice characteristics.",
        description="Sample text to generate with cloned voice"
    ),
    use_whisper: Optional[bool] = Form(True, description="Use Whisper for audio preparation (recommended)"),
    segment_audio: Optional[bool] = Form(True, description="Segment audio into chunks"),
    max_segment_duration: Optional[int] = Form(30, description="Maximum segment duration in seconds"),
    separate_voices: Optional[bool] = Form(True, description="Extract vocals from background music/noise"),
    db: AsyncSession = Depends(get_db)
) -> JSONResponse:
    """
    Create a voice clone from uploaded audio/video file.
    
    This endpoint now uses a job queue system:
    - Development: Processes immediately with local CUDA
    - Production: Queues job for remote ROCm processing
    """
    temp_files = []
    
    try:
        # Validate file
        if not audio_file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Log file info
        logger.info(f"Received file for voice cloning: {audio_file.filename}, "
                   f"content_type: {audio_file.content_type}, size: {audio_file.size}")
        
        # Save uploaded file to temp location
        file_ext = os.path.splitext(audio_file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as tmp_file:
            content = await audio_file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
            temp_files.append(tmp_file_path)
        
        logger.info(f"Saved uploaded file to: {tmp_file_path}")
        
        # Process audio file (extract from video if needed, convert to MP3)
        processed_audio_path = await audio_processor.process_file_for_cloning(tmp_file_path)
        if processed_audio_path != tmp_file_path:
            temp_files.append(processed_audio_path)
        
        logger.info(f"Processed audio file: {processed_audio_path}")
        
        # Prepare job data
        job_data = {
            "audio_path": processed_audio_path,
            "user_id": user_id,
            "voice_name": voice_name or "My Voice",
            "sample_text": sample_text,
            "settings": {
                "exaggeration": 1.0,
                "chunkSize": 2048,
                "cfgWeight": 1.7
            },
            "preparation_config": {
                "use_whisper": use_whisper,
                "segment_audio": segment_audio,
                "max_segment_duration": max_segment_duration,
                "separate_voices": separate_voices,
                "transcribe": True,
                "clean_silence": True,
                "provider_specific": {}
            }
        }
        
        # Process through TTS Manager (handles dev/prod routing)
        result = await tts_manager.process_voice_clone(job_data)
        
        # Check environment for response handling
        if os.getenv("ENVIRONMENT") == "development":
            # In development, we have immediate results
            
            # Store voice profile in database if user_id provided
            if user_id and result.get("voiceId"):
                try:
                    insert_query = text("""
                        INSERT INTO voice_profiles 
                        (id, user_id, voice_name, voice_id, reference_audio_path, created_at, is_active)
                        VALUES 
                        (:id, :user_id, :voice_name, :voice_id, :reference_audio_path, :created_at, :is_active)
                    """)
                    
                    await db.execute(insert_query, {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "voice_name": voice_name or "My Voice",
                        "voice_id": result["voiceId"],
                        "reference_audio_path": f"voices/{result['voiceId']}/reference.mp3",
                        "created_at": datetime.utcnow(),
                        "is_active": True
                    })
                    await db.commit()
                    
                    logger.info(f"Stored voice profile for user {user_id}")
                except Exception as e:
                    logger.warning(f"Failed to store voice profile in DB: {str(e)}")
            
            # Read the result audio and convert to base64
            if result.get("resultUrl") and os.path.exists(result["resultUrl"]):
                with open(result["resultUrl"], 'rb') as f:
                    sample_audio_base64 = base64.b64encode(f.read()).decode('utf-8')
                
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "jobId": result["jobId"],
                        "voice_id": result["voiceId"],
                        "voice_name": voice_name or "My Voice",
                        "sample_text": sample_text,
                        "sample_audio": f"data:audio/mp3;base64,{sample_audio_base64}",
                        "processingTime": result.get("processingTime"),
                        "message": "Voice cloning completed successfully"
                    }
                )
            else:
                # Fallback if no audio file
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "jobId": result["jobId"],
                        "voice_id": result.get("voiceId"),
                        "voice_name": voice_name or "My Voice",
                        "message": "Voice cloning completed"
                    }
                )
        else:
            # In production, job is queued
            return JSONResponse(
                status_code=202,  # Accepted
                content={
                    "success": True,
                    "jobId": result["jobId"],
                    "status": result["status"],
                    "message": result["message"],
                    "statusUrl": f"/api/public/voice/onboarding/jobs/{result['jobId']}/status"
                }
            )
        
    except ValueError as e:
        logger.error(f"Validation error in voice cloning: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in voice cloning: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Voice cloning failed: {str(e)}"
        )
    finally:
        # Cleanup temporary files (keep them briefly in case needed for retry)
        if os.getenv("ENVIRONMENT") == "development":
            # Clean up after processing completes (with longer delay)
            asyncio.create_task(_delayed_cleanup(temp_files, delay=600))  # 10 minutes
        else:
            # In production, clean up after a delay
            asyncio.create_task(_delayed_cleanup(temp_files, delay=300))  # 5 minutes


async def _delayed_cleanup(files: list, delay: int):
    """Clean up temporary files after a delay"""
    await asyncio.sleep(delay)
    for file_path in files:
        await audio_processor.cleanup_temp_file(file_path)


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str) -> JSONResponse:
    """
    Get status of a voice cloning job.
    
    Args:
        job_id: The job ID to check
        
    Returns:
        Job status and metadata
    """
    try:
        job = await job_manager.get_job_status(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Prepare response based on job status
        response_data = {
            "jobId": job["jobId"],
            "status": job["status"],
            "voiceName": job.get("voiceName"),
            "createdAt": job.get("createdAt"),
            "processingTime": job.get("processingTime")
        }
        
        # Add additional data based on status
        if job["status"] == "completed":
            response_data.update({
                "voiceId": job.get("voiceId"),
                "resultUrl": job.get("resultUrl"),
                "completedAt": job.get("completedAt")
            })
        elif job["status"] == "failed":
            response_data.update({
                "error": job.get("error"),
                "errorDetails": job.get("errorDetails")
            })
        elif job["status"] == "processing":
            response_data.update({
                "startedAt": job.get("startedAt"),
                "workerInfo": job.get("workerInfo")
            })
        
        return JSONResponse(status_code=200, content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get job status")


@router.get("/status/{voice_id}")
async def get_voice_status(
    voice_id: str,
    db: AsyncSession = Depends(get_db)
) -> JSONResponse:
    """
    Get status of a voice profile.
    
    Args:
        voice_id: The voice ID to check
        
    Returns:
        Voice profile status and metadata
    """
    try:
        # Query voice profile
        query = text("""
            SELECT id, user_id, voice_name, voice_id, created_at, is_active
            FROM voice_profiles
            WHERE voice_id = :voice_id
            LIMIT 1
        """)
        
        result = await db.execute(query, {"voice_id": voice_id})
        profile = result.fetchone()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Voice profile not found")
        
        return JSONResponse(
            status_code=200,
            content={
                "voice_id": profile.voice_id,
                "voice_name": profile.voice_name,
                "created_at": profile.created_at.isoformat(),
                "is_active": profile.is_active,
                "user_id": profile.user_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting voice status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voice status")


@router.post("/test/{voice_id}")
async def test_voice_clone(
    voice_id: str,
    text: str = Form(..., description="Text to synthesize"),
    db: AsyncSession = Depends(get_db)
) -> JSONResponse:
    """
    Test a cloned voice by generating speech with custom text.
    
    Args:
        voice_id: The voice ID to use
        text: Text to synthesize
        
    Returns:
        Generated audio in base64 format
    """
    try:
        # For now, we'll use the Chatterbox default voice
        # In a full implementation, we'd store and retrieve the voice model
        
        # Generate speech using TTS manager
        audio_data = b""
        async for chunk in tts_manager.generate_speech(
            text=text,
            voice_id=voice_id,  # TODO: Map to actual cloned voice
            provider="chatterbox"
        ):
            audio_data += chunk
        
        # Convert to base64
        import base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "voice_id": voice_id,
                "text": text,
                "audio": f"data:audio/mp3;base64,{audio_base64}"
            }
        )
        
    except Exception as e:
        logger.error(f"Error testing voice clone: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate test audio: {str(e)}"
        )


@router.delete("/{voice_id}")
async def delete_voice_profile(
    voice_id: str,
    user_id: str = Form(..., description="User ID for authorization"),
    db: AsyncSession = Depends(get_db)
) -> JSONResponse:
    """
    Delete a voice profile.
    
    Args:
        voice_id: The voice ID to delete
        user_id: User ID for authorization
        
    Returns:
        Success status
    """
    try:
        # Soft delete the voice profile
        update_query = text("""
            UPDATE voice_profiles
            SET is_active = false
            WHERE voice_id = :voice_id AND user_id = :user_id
        """)
        
        result = await db.execute(update_query, {
            "voice_id": voice_id,
            "user_id": user_id
        })
        await db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Voice profile not found or unauthorized"
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Voice profile deleted successfully"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting voice profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete voice profile")