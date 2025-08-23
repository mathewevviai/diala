"""
YouTube Transcript API - Public endpoints for fetching YouTube video transcripts.

This module provides endpoints to fetch transcripts from YouTube videos
and integrates with Convex for job management and rate limiting.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from youtube_transcript_api import YouTubeTranscriptApi
import yt_dlp
import re
from typing import Optional, List, Dict
import asyncio
import os
from dotenv import load_dotenv
from convex import ConvexClient
from datetime import datetime

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(env_path)

router = APIRouter()

# Initialize Convex client
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
convex_client = ConvexClient(CONVEX_URL)

class TranscriptRequest(BaseModel):
    """Request model for fetching YouTube transcripts."""
    job_id: str = Field(..., description="Unique job identifier for tracking")
    youtube_url: str = Field(..., description="YouTube video URL", example="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    user_id: str = Field(..., description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "user_id": "user123"
            }
        }

class TranscriptEntry(BaseModel):
    """Individual transcript segment with timing information."""
    text: str = Field(..., description="Transcript text segment")
    start: float = Field(..., description="Start time in seconds")
    duration: float = Field(..., description="Duration in seconds")

class VideoMetadata(BaseModel):
    """Video metadata information."""
    title: str = Field(..., description="Video title")
    author: str = Field(..., description="Channel/Author name")
    duration: Optional[int] = Field(None, description="Video duration in seconds")
    thumbnail_url: Optional[str] = Field(None, description="Video thumbnail URL")
    view_count: Optional[int] = Field(None, description="View count")
    upload_date: Optional[str] = Field(None, description="Upload date")

class TranscriptResponse(BaseModel):
    """Response model for transcript data."""
    transcript: str = Field(..., description="Full transcript text")
    video_id: str = Field(..., description="YouTube video ID")
    entries: List[TranscriptEntry] = Field(..., description="Transcript segments with timing")
    metadata: Optional[VideoMetadata] = Field(None, description="Video metadata")

class JobStatusResponse(BaseModel):
    """Response model for job status."""
    status: str = Field(..., description="Job status", example="processing")
    job_id: str = Field(..., description="Job identifier")
    message: str = Field(..., description="Status message")

def extract_video_id(url: str) -> Optional[str]:
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
        r'youtube\.com\/embed\/([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def fetch_video_metadata(video_url: str) -> Optional[VideoMetadata]:
    """Fetch video metadata using yt-dlp"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Extract metadata
            metadata = VideoMetadata(
                title=info.get('title', 'Unknown Title'),
                author=info.get('uploader', 'Unknown Author'),
                duration=info.get('duration'),
                thumbnail_url=info.get('thumbnail'),
                view_count=info.get('view_count'),
                upload_date=info.get('upload_date')
            )
            
            return metadata
    except Exception as e:
        print(f"Error fetching video metadata: {e}")
        return None

def send_convex_webhook(job_id: str, status: str, **kwargs):
    """Send webhook to Convex to update job status"""
    try:
        # Call the Convex mutation
        convex_client.mutation("mutations/youtubeTranscripts:transcriptWebhook", {
            "jobId": job_id,
            "status": status,
            **kwargs
        })
    except Exception as e:
        print(f"Error sending webhook: {e}")

async def process_transcript_job(job_id: str, youtube_url: str, user_id: str):
    """Process transcript job asynchronously"""
    try:
        # Extract video ID
        video_id = extract_video_id(youtube_url)
        if not video_id:
            send_convex_webhook(
                job_id, 
                "failed", 
                error="Invalid YouTube URL"
            )
            return
        
        # Fetch video metadata
        metadata = fetch_video_metadata(youtube_url)
        
        # Fetch transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Convert to our format
        entries = [
            TranscriptEntry(
                text=entry['text'],
                start=entry['start'],
                duration=entry['duration']
            )
            for entry in transcript_list
        ]
        
        # Combine all text
        full_transcript = ' '.join([entry.text for entry in entries])
        
        # Send success webhook with metadata
        webhook_data = {
            "jobId": job_id,
            "status": "completed",
            "transcript": full_transcript,
            "videoId": video_id,
            "language": "en",
            "userId": user_id
        }
        
        # Add metadata if available
        if metadata:
            webhook_data.update({
                "videoTitle": metadata.title,
                "videoAuthor": metadata.author,
                "videoDuration": metadata.duration,
                "thumbnailUrl": metadata.thumbnail_url
            })
        
        # Send webhook using dictionary unpacking
        convex_client.mutation("mutations/youtubeTranscripts:transcriptWebhook", webhook_data)
        
    except Exception as e:
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )

@router.post("/transcript", response_model=JobStatusResponse, summary="Fetch YouTube Transcript")
async def fetch_transcript(
    request: TranscriptRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch transcript from a YouTube video.
    
    This endpoint initiates an asynchronous job to fetch the transcript.
    The transcript is processed in the background and the status is updated
    via Convex webhooks.
    
    **Rate Limiting**: 10 requests per hour per user (enforced by Convex)
    
    **Process Flow**:
    1. Job is created and queued
    2. YouTube transcript is fetched in background
    3. Result is stored in Convex database
    4. Client polls for completion using job_id
    
    Returns:
        Job status with processing message
    """
    # Process in background
    background_tasks.add_task(
        process_transcript_job,
        request.job_id,
        request.youtube_url,
        request.user_id
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="Transcript processing started"
    )

@router.get(
    "/transcript/{video_id}",
    response_model=TranscriptResponse,
    summary="Get Transcript Direct (Testing)",
    tags=["Testing"]
)
async def get_transcript_direct(
    video_id: str
):
    """
    Directly fetch transcript without job queue (for testing).
    
    **Warning**: This endpoint bypasses rate limiting and caching.
    Use only for testing purposes.
    
    Args:
        video_id: YouTube video ID (not full URL)
    
    Returns:
        Complete transcript with timing information
    
    Raises:
        HTTPException: If transcript is not available or video not found
    """
    try:
        # Construct URL for metadata fetching
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Fetch metadata
        metadata = fetch_video_metadata(video_url)
        
        # Fetch transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        entries = [
            TranscriptEntry(
                text=entry['text'],
                start=entry['start'],
                duration=entry['duration']
            )
            for entry in transcript_list
        ]
        
        full_transcript = ' '.join([entry.text for entry in entries])
        
        return TranscriptResponse(
            transcript=full_transcript,
            video_id=video_id,
            entries=entries,
            metadata=metadata
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch transcript: {str(e)}"
        )