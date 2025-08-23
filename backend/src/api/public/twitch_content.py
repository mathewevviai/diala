"""
Twitch Content API - Public endpoints for fetching Twitch content.

This module provides endpoints to fetch Twitch channel information, videos,
and download content for voice cloning purposes.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import os
import tempfile
import aiofiles
from datetime import datetime
import uuid
from dotenv import load_dotenv
from convex import ConvexClient
import logging

# Import our Twitch service
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from services.twitch_service import get_twitch_service

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(env_path)

router = APIRouter()

# Initialize Convex client
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
convex_client = ConvexClient(CONVEX_URL)


class ChannelFetchRequest(BaseModel):
    """Request model for fetching Twitch channel info."""
    job_id: str = Field(..., description="Unique job identifier")
    channel_url: str = Field(..., description="Twitch channel URL or username")
    user_id: str = Field(..., description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "channel_url": "https://twitch.tv/shroud",
                "user_id": "user123"
            }
        }


class VideosFetchRequest(BaseModel):
    """Request model for fetching Twitch videos."""
    job_id: str = Field(..., description="Unique job identifier")
    channel_name: str = Field(..., description="Twitch channel name")
    user_id: str = Field(..., description="User ID for rate limiting")
    count: int = Field(6, description="Number of videos to fetch", ge=1, le=6)
    video_type: str = Field("archive", description="Type of videos: archive, highlight, upload, clips")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "channel_name": "shroud",
                "user_id": "user123",
                "count": 6,
                "video_type": "archive"
            }
        }


class VideoDownloadRequest(BaseModel):
    """Request model for downloading Twitch videos."""
    job_id: str = Field(..., description="Unique job identifier")
    video_ids: List[str] = Field(..., description="List of video IDs to download")
    user_id: str = Field(..., description="User ID for rate limiting")
    channel_name: str = Field(..., description="Channel name for organization")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "video_ids": ["1234567890", "0987654321"],
                "user_id": "user123",
                "channel_name": "shroud"
            }
        }


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    status: str = Field(..., description="Job status", example="processing")
    job_id: str = Field(..., description="Job identifier")
    message: str = Field(..., description="Status message")


def clean_data_for_convex(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove None values from data to avoid Convex validation errors."""
    if isinstance(data, dict):
        return {k: clean_data_for_convex(v) for k, v in data.items() if v is not None}
    elif isinstance(data, list):
        return [clean_data_for_convex(item) for item in data]
    else:
        return data


def send_convex_webhook(job_id: str, status: str, **kwargs):
    """Send webhook to Convex to update job status."""
    try:
        logger.info(f"Sending Convex webhook - Job ID: {job_id}, Status: {status}")
        
        # Clean the data to remove None values
        cleaned_kwargs = clean_data_for_convex(kwargs)
        
        # Call the Convex mutation
        result = convex_client.mutation("mutations/twitchContent:jobWebhook", {
            "jobId": job_id,
            "status": status,
            **cleaned_kwargs
        })
        
        logger.info(f"Webhook sent successfully for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error sending webhook for job {job_id}: {e}")


async def process_channel_fetch(job_id: str, channel_url: str, user_id: str):
    """Process channel fetch job asynchronously."""
    try:
        print(f"\n=== Processing Twitch Channel Fetch ===")
        print(f"Channel URL: {channel_url}")
        print(f"Job ID: {job_id}")
        print(f"User ID: {user_id}")
        print(f"=====================================")
        
        logger.info(f"Processing Twitch channel fetch for: {channel_url}")
        
        # Get Twitch service
        twitch_service = get_twitch_service()
        
        # Fetch channel info
        channel_info = await twitch_service.get_channel_info(channel_url)
        
        print(f"\n[Twitch] Channel Data Retrieved:")
        print(f"  - Username: {channel_info.get('username')}")
        print(f"  - Display Name: {channel_info.get('displayName')}")
        print(f"  - Followers: {channel_info.get('followerCount')}")
        print(f"  - Videos: {channel_info.get('videoCount')}")
        print(f"  - Live: {channel_info.get('isLive')}")
        print(f"  - Verified: {channel_info.get('isVerified')}")
        print(f"  - Partner: {channel_info.get('isPartner')}")
        print(f"  - Profile Image: {channel_info.get('profileImage')[:50]}..." if channel_info.get('profileImage') else "  - Profile Image: None")
        print(f"=====================================\n")
        
        logger.info(f"Successfully fetched channel info for: {channel_info.get('username')}")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            channelData={
                "username": channel_info["username"],
                "displayName": channel_info["displayName"],
                "profileImage": channel_info["profileImage"],
                "bio": channel_info["bio"],
                "isVerified": channel_info["isVerified"],
                "isPartner": channel_info["isPartner"],
                "followerCount": channel_info["followerCount"],
                "videoCount": channel_info["videoCount"],
                "isLive": channel_info["isLive"],
                "channelUrl": channel_info["channelUrl"]
            }
        )
        
        print(f"✓ Webhook sent for job {job_id}")
        
    except Exception as e:
        print(f"\n!!! Error in process_channel_fetch !!!")
        print(f"Error: {str(e)}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        
        logger.error(f"Error in process_channel_fetch: {str(e)}")
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_videos_fetch(job_id: str, channel_name: str, user_id: str, count: int, video_type: str):
    """Process videos fetch job asynchronously."""
    try:
        print(f"\n=== Processing Twitch Videos Fetch ===")
        print(f"Channel: {channel_name}")
        print(f"Type: {video_type}")
        print(f"Count: {count}")
        print(f"Job ID: {job_id}")
        print(f"=====================================")
        
        logger.info(f"Processing Twitch videos fetch for: {channel_name}, type: {video_type}, count: {count}")
        
        # Get Twitch service
        twitch_service = get_twitch_service()
        
        # Fetch videos
        videos_data = await twitch_service.get_channel_videos(channel_name, count, video_type)
        
        print(f"\n[Twitch] Videos Data Retrieved:")
        print(f"  - Total videos fetched: {videos_data['count']}")
        print(f"  - Video type: {videos_data['videoType']}")
        print(f"  - Has more: {videos_data['hasMore']}")
        
        if videos_data['videos']:
            print(f"\n  Video List:")
            for idx, video in enumerate(videos_data['videos'][:5]):  # Show first 5
                print(f"    {idx + 1}. {video.get('title', 'Untitled')[:50]}...")
                print(f"       - ID: {video.get('videoId')}")
                print(f"       - Type: {video.get('type')}")
                print(f"       - Duration: {video.get('duration', 0)} seconds")
                print(f"       - Views: {video.get('viewCount', 0)}")
        
        print(f"=====================================\n")
        
        logger.info(f"Successfully fetched {videos_data['count']} videos for: {channel_name}")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            videosData={
                "videos": videos_data["videos"],
                "count": videos_data["count"],
                "videoType": videos_data["videoType"],
                "hasMore": videos_data["hasMore"]
            }
        )
        
        print(f"✓ Webhook sent for job {job_id}")
        
    except Exception as e:
        print(f"\n!!! Error in process_videos_fetch !!!")
        print(f"Error: {str(e)}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        
        logger.error(f"Error in process_videos_fetch: {str(e)}")
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_video_download(job_id: str, video_ids: List[str], user_id: str, channel_name: str):
    """Process video download job asynchronously."""
    try:
        print(f"\n=== Processing Twitch Video Download ===")
        print(f"Channel: {channel_name}")
        print(f"Videos to download: {len(video_ids)}")
        print(f"Job ID: {job_id}")
        print(f"Video IDs: {video_ids[:3]}..." if len(video_ids) > 3 else f"Video IDs: {video_ids}")
        print(f"======================================")
        
        logger.info(f"Processing Twitch video download for {len(video_ids)} videos")
        
        # Get Twitch service
        twitch_service = get_twitch_service()
        
        # Create temporary directory for downloads
        temp_dir = tempfile.mkdtemp(prefix=f"twitch_{channel_name}_")
        downloaded_files = []
        
        print(f"\n[Twitch] Download directory: {temp_dir}")
        
        # Update status to downloading
        send_convex_webhook(
            job_id,
            "downloading",
            progress=0,
            totalVideos=len(video_ids)
        )
        
        # Download each video
        for i, video_id in enumerate(video_ids):
            try:
                print(f"\n[Twitch] Downloading video {i+1}/{len(video_ids)}: {video_id}")
                logger.info(f"Downloading video {i+1}/{len(video_ids)}: {video_id}")
                
                # Download video bytes
                video_bytes = await twitch_service.download_video_bytes(video_id)
                
                # Save to file
                file_path = os.path.join(temp_dir, f"{video_id}.mp4")
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(video_bytes)
                
                downloaded_files.append({
                    "videoId": video_id,
                    "filePath": file_path,
                    "fileSize": len(video_bytes)
                })
                
                print(f"  ✓ Downloaded: {file_path}")
                print(f"  File size: {len(video_bytes)} bytes")
                
                # Update progress
                progress = int(((i + 1) / len(video_ids)) * 100)
                send_convex_webhook(
                    job_id,
                    "downloading",
                    progress=progress,
                    totalVideos=len(video_ids),
                    completedVideos=i + 1
                )
                
                print(f"  Progress: {progress}%")
                
            except Exception as e:
                print(f"  ✗ Error downloading video {video_id}: {e}")
                logger.error(f"Error downloading video {video_id}: {e}")
                # Continue with other videos
        
        print(f"\n[Twitch] Download Summary:")
        print(f"  - Total requested: {len(video_ids)}")
        print(f"  - Successfully downloaded: {len(downloaded_files)}")
        print(f"  - Failed: {len(video_ids) - len(downloaded_files)}")
        print(f"======================================\n")
        
        logger.info(f"Successfully downloaded {len(downloaded_files)} videos")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            downloadData={
                "totalVideos": len(video_ids),
                "successfulDownloads": len(downloaded_files),
                "tempDirectory": temp_dir,
                "files": downloaded_files
            }
        )
        
        print(f"✓ Webhook sent for job {job_id}")
        
    except Exception as e:
        print(f"\n!!! Error in process_video_download !!!")
        print(f"Error: {str(e)}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        
        logger.error(f"Error in process_video_download: {str(e)}")
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


@router.post("/channel", response_model=JobStatusResponse, summary="Fetch Twitch Channel Info")
async def fetch_channel_info(
    request: ChannelFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch Twitch channel information including metadata and profile image.
    
    This endpoint initiates an asynchronous job to fetch channel data including
    display name, follower count, video count, and live status.
    
    **Rate Limiting**: 20 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    print(f"\n=== Twitch Channel Fetch Request ===")
    print(f"Job ID: {request.job_id}")
    print(f"Channel URL: {request.channel_url}")
    print(f"User ID: {request.user_id}")
    print(f"===================================\n")
    
    logger.info(f"Twitch channel fetch request - Job ID: {request.job_id}, Channel: {request.channel_url}")
    
    # Process in background
    background_tasks.add_task(
        process_channel_fetch,
        request.job_id,
        request.channel_url,
        request.user_id
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="Channel info fetch started"
    )


@router.post("/videos", response_model=JobStatusResponse, summary="Fetch Twitch Videos")
async def fetch_videos_endpoint(
    request: VideosFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch Twitch channel's videos with metadata.
    
    This endpoint fetches a channel's videos including VODs, highlights, uploads,
    or clips with metadata needed for voice cloning selection.
    
    **Rate Limiting**: 10 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    print(f"\n=== Twitch Videos Fetch Request ===")
    print(f"Job ID: {request.job_id}")
    print(f"Channel: {request.channel_name}")
    print(f"Count: {request.count}")
    print(f"Type: {request.video_type}")
    print(f"User ID: {request.user_id}")
    print(f"==================================\n")
    
    logger.info(f"Twitch videos fetch request - Job ID: {request.job_id}, Channel: {request.channel_name}")
    
    # Validate video type
    valid_types = ["archive", "highlight", "upload", "clips"]
    if request.video_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid video type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Process in background
    background_tasks.add_task(
        process_videos_fetch,
        request.job_id,
        request.channel_name,
        request.user_id,
        request.count,
        request.video_type
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="Videos fetch started"
    )


@router.post("/download", response_model=JobStatusResponse, summary="Download Twitch Videos")
async def download_videos(
    request: VideoDownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Download selected Twitch videos for voice cloning processing.
    
    This endpoint downloads the selected videos to temporary storage
    for audio extraction and voice cloning processing.
    
    **Rate Limiting**: 5 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    logger.info(f"Twitch video download request - Job ID: {request.job_id}, Videos: {len(request.video_ids)}")
    
    # Validate video count
    if len(request.video_ids) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 videos can be downloaded at once"
        )
    
    # Process in background
    background_tasks.add_task(
        process_video_download,
        request.job_id,
        request.video_ids,
        request.user_id,
        request.channel_name
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message=f"Download started for {len(request.video_ids)} videos"
    )


@router.get("/test/{channel_name}", summary="Test Twitch Channel Fetch (Direct)")
async def test_channel_fetch(channel_name: str):
    """
    Direct channel fetch for testing (bypasses job queue).
    
    **Warning**: This endpoint bypasses rate limiting and caching.
    Use only for testing purposes.
    """
    try:
        logger.info(f"Test fetch for Twitch channel: {channel_name}")
        
        # Get Twitch service
        twitch_service = get_twitch_service()
        
        # Fetch channel info
        channel_info = await twitch_service.get_channel_info(channel_name)
        
        # Fetch some videos (limited to 6)
        videos_data = await twitch_service.get_channel_videos(
            channel_info.get('username', channel_name), 
            count=6,
            video_type="archive"
        )
        
        return {
            "channel": channel_info,
            "videos": videos_data["videos"],
            "videoCount": videos_data["count"]
        }
        
    except Exception as e:
        logger.error(f"Test fetch error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch channel: {str(e)}"
        )