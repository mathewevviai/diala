"""
TikTok Content API - Public endpoints for fetching TikTok content.

This module provides endpoints to fetch TikTok user profiles, videos,
and download content for voice cloning purposes.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import os
import tempfile
import aiofiles
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv
from convex import ConvexClient
import httpx
import logging
from pathlib import Path
import time

# Import our TikTok service
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.services.tiktok_service import get_tiktok_service

# Setup logger
logger = logging.getLogger(__name__)

# Load environment variables from backend .env file
backend_env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(backend_env_path)

# Also try to load from frontend for Convex URL if backend doesn't have it
frontend_env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(frontend_env_path, override=False)

router = APIRouter()

# Initialize Convex client
CONVEX_URL = os.getenv("CONVEX_URL") or os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
logger.info(f"Initializing Convex client with URL: {CONVEX_URL}")
convex_client = ConvexClient(CONVEX_URL)


class UserFetchRequest(BaseModel):
    """Request model for fetching TikTok user info."""
    job_id: str = Field(..., description="Unique job identifier")
    username: str = Field(..., description="TikTok username (without @)")
    user_id: str = Field(..., description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "username": "mrbeast",
                "user_id": "user123"
            }
        }


class VideosFetchRequest(BaseModel):
    """Request model for fetching TikTok videos."""
    job_id: str = Field(..., description="Unique job identifier")
    username: str = Field(..., description="TikTok username")
    user_id: str = Field(..., description="User ID for rate limiting")
    count: int = Field(30, description="Number of videos to fetch", ge=1, le=100)
    cursor: int = Field(0, description="Pagination cursor")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "username": "mrbeast",
                "user_id": "user123",
                "count": 30,
                "cursor": 0
            }
        }


class VideoDownloadRequest(BaseModel):
    """Request model for downloading TikTok videos."""
    job_id: str = Field(..., description="Unique job identifier")
    video_ids: List[str] = Field(..., description="List of video IDs to download")
    user_id: str = Field(..., description="User ID for rate limiting")
    username: str = Field(..., description="TikTok username for organization")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "video_ids": ["7123456789012345678", "7123456789012345679"],
                "user_id": "user123",
                "username": "mrbeast"
            }
        }


class VideoPreviewResponse(BaseModel):
    """Response model for video preview data."""
    videoId: str = Field(..., description="TikTok video ID")
    title: str = Field(..., description="Video title")
    description: str = Field(..., description="Video description")
    duration: int = Field(..., description="Video duration in seconds")
    thumbnail: str = Field(..., description="Video thumbnail URL")
    streamUrl: str = Field(..., description="Direct streaming URL")
    format: str = Field(..., description="Video format (e.g., mp4)")
    width: int = Field(..., description="Video width in pixels")
    height: int = Field(..., description="Video height in pixels")
    uploader: str = Field(..., description="Video uploader name")
    uploaderId: str = Field(..., description="Video uploader ID")
    stats: Dict[str, int] = Field(..., description="Video statistics")
    timestamp: int = Field(..., description="Upload timestamp")
    hashtags: List[Dict[str, str]] = Field(..., description="Video hashtags")


class BatchPreviewRequest(BaseModel):
    """Request model for batch video preview."""
    video_ids: List[str] = Field(..., description="List of video IDs to preview", max_items=10)
    user_id: str = Field(..., description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "video_ids": ["7123456789012345678", "7123456789012345679"],
                "user_id": "user123"
            }
        }


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    status: str = Field(..., description="Job status", example="processing")
    job_id: str = Field(..., description="Job identifier")
    message: str = Field(..., description="Status message")


def send_convex_webhook(job_id: str, status: str, **kwargs):
    """Send webhook to Convex to update job status."""
    try:
        # Call the Convex mutation
        convex_client.mutation("mutations/tiktokContent/jobWebhook", {
            "jobId": job_id,
            "status": status,
            **kwargs
        })
    except Exception as e:
        print(f"Error sending webhook: {e}")


async def process_user_fetch(job_id: str, username: str, user_id: str):
    """Process user fetch job asynchronously."""
    print(f"[PRINT TASK] process_user_fetch STARTED - job_id: {job_id}, username: {username}")
    logger.info(f"[TASK] process_user_fetch STARTED - job_id: {job_id}, username: {username}, user_id: {user_id}")
    try:
        # Get TikTok service
        print(f"[PRINT TASK] Getting TikTok service...")
        tiktok_service = get_tiktok_service()
        
        # Fetch user info
        user_info = await tiktok_service.get_user_info(username)
        
        # Log the avatar URL before sending
        print(f"[TikTok] Sending user data webhook - avatar: {user_info['avatar']}")
        print(f"[TikTok] Avatar length: {len(user_info['avatar']) if user_info['avatar'] else 0}")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            userData={
                "username": user_info["username"],
                "userId": user_info["userId"],
                "secUid": user_info["secUid"],
                "nickname": user_info["nickname"],
                "avatar": user_info["avatar"],
                "signature": user_info["signature"],
                "verified": user_info["verified"],
                "followerCount": user_info["followerCount"],
                "followingCount": user_info["followingCount"],
                "videoCount": user_info["videoCount"],
                "heartCount": user_info["heartCount"],
                "privateAccount": user_info["privateAccount"]
            }
        )
        logger.info(f"process_user_fetch completed successfully for job_id: {job_id}")
        
    except Exception as e:
        logger.error(f"Error in process_user_fetch for job_id {job_id}: {str(e)}", exc_info=True)
        # Send failure webhook
        try:
            send_convex_webhook(
                job_id,
                "failed",
                error=str(e)
            )
        except Exception as webhook_error:
            logger.error(f"Failed to send failure webhook: {webhook_error}", exc_info=True)


async def process_videos_fetch(job_id: str, username: str, user_id: str, count: int, cursor: int):
    """Process videos fetch job asynchronously."""
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Fetch videos
        videos_data = await tiktok_service.get_user_videos(username, count, cursor)
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            videosData={
                "videos": videos_data["videos"],
                "count": videos_data["count"],
                "hasMore": videos_data["hasMore"],
                "cursor": videos_data["cursor"]
            }
        )
        
    except Exception as e:
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_video_download(job_id: str, video_ids: List[str], user_id: str, username: str):
    """Process video download job asynchronously."""
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Create temporary directory for downloads
        temp_dir = tempfile.mkdtemp(prefix=f"tiktok_{username}_")
        downloaded_files = []
        
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
                # Download video bytes
                video_bytes = await tiktok_service.download_video_bytes(video_id)
                
                # Save to file
                file_path = os.path.join(temp_dir, f"{video_id}.mp4")
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(video_bytes)
                
                downloaded_files.append({
                    "videoId": video_id,
                    "filePath": file_path,
                    "fileSize": len(video_bytes)
                })
                
                # Update progress
                progress = int(((i + 1) / len(video_ids)) * 100)
                send_convex_webhook(
                    job_id,
                    "downloading",
                    progress=progress,
                    totalVideos=len(video_ids),
                    completedVideos=i + 1
                )
                
            except Exception as e:
                print(f"Error downloading video {video_id}: {e}")
                # Continue with other videos
        
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
        
    except Exception as e:
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


@router.post("/user", response_model=JobStatusResponse, summary="Fetch TikTok User Info")
async def fetch_user_info(
    request: UserFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch TikTok user profile information.
    
    This endpoint initiates an asynchronous job to fetch user data including
    profile info, avatar, follower count, and video count.
    
    **Rate Limiting**: 20 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    logger.info(f"[API] /user endpoint called - job_id: {request.job_id}, username: {request.username}")
    print(f"[PRINT API] /user endpoint called - job_id: {request.job_id}, username: {request.username}")
    
    # Clean username (remove @ if present)
    username = request.username.lstrip('@')
    
    # Add a simple debug task to verify background tasks work
    def simple_debug():
        print(f"[PRINT DEBUG] Background tasks ARE executing for job {request.job_id}")
        logger.info(f"[DEBUG] Background tasks ARE executing for job {request.job_id}")
    
    background_tasks.add_task(simple_debug)
    
    logger.info(f"[API] Adding process_user_fetch task - job_id: {request.job_id}")
    print(f"[PRINT API] Adding process_user_fetch task - job_id: {request.job_id}")
    
    # Process in background
    background_tasks.add_task(
        process_user_fetch,
        request.job_id,
        username,
        request.user_id
    )
    
    logger.info(f"[API] All tasks added for job_id: {request.job_id}")
    print(f"[PRINT API] All tasks added for job_id: {request.job_id}")
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="User info fetch started"
    )


@router.post("/videos", response_model=JobStatusResponse, summary="Fetch TikTok Videos")
async def fetch_user_videos(
    request: VideosFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch TikTok user's videos.
    
    This endpoint fetches a user's public videos with metadata including
    thumbnails, views, likes, and other engagement metrics.
    
    **Rate Limiting**: 10 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    # Clean username
    username = request.username.lstrip('@')
    
    # Process in background
    background_tasks.add_task(
        process_videos_fetch,
        request.job_id,
        username,
        request.user_id,
        request.count,
        request.cursor
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="Videos fetch started"
    )


@router.post("/download", response_model=JobStatusResponse, summary="Download TikTok Videos")
async def download_videos(
    request: VideoDownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Download selected TikTok videos for processing.
    
    This endpoint downloads the selected videos to temporary storage
    for audio extraction and voice cloning processing.
    
    **Rate Limiting**: 5 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
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
        request.username
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message=f"Download started for {len(request.video_ids)} videos"
    )


@router.post("/debug/background-task", summary="Debug Background Task Execution")
async def debug_background_task(
    request: UserFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Debug endpoint to test background task execution.
    """
    logger.info(f"[DEBUG] Endpoint called with job_id: {request.job_id}")
    
    # Add a simple background task first
    def simple_task(job_id: str):
        logger.info(f"[DEBUG] Simple background task executed for job_id: {job_id}")
        print(f"[DEBUG PRINT] Simple background task executed for job_id: {job_id}")
    
    background_tasks.add_task(simple_task, request.job_id)
    
    # Also add the actual task
    username = request.username.lstrip('@')
    background_tasks.add_task(
        process_user_fetch,
        request.job_id,
        username,
        request.user_id
    )
    
    return {
        "status": "tasks_added",
        "job_id": request.job_id,
        "message": "Background tasks added for debugging"
    }


@router.post("/debug/sync-task", summary="Debug Synchronous Task Execution")
async def debug_sync_task(request: UserFetchRequest):
    """
    Debug endpoint to test task execution synchronously.
    """
    logger.info(f"[DEBUG SYNC] Starting synchronous execution for job_id: {request.job_id}")
    
    try:
        # Clean username
        username = request.username.lstrip('@')
        
        # Execute the task synchronously
        await process_user_fetch(request.job_id, username, request.user_id)
        
        return {
            "status": "completed",
            "job_id": request.job_id,
            "message": "Task executed synchronously"
        }
    except Exception as e:
        logger.error(f"[DEBUG SYNC] Error: {str(e)}", exc_info=True)
        return {
            "status": "failed",
            "job_id": request.job_id,
            "error": str(e)
        }


@router.get("/test/{username}", summary="Test TikTok User Fetch (Direct)")
async def test_user_fetch(username: str):
    """
    Direct user fetch for testing (bypasses job queue).
    
    **Warning**: This endpoint bypasses rate limiting and caching.
    Use only for testing purposes.
    """
    try:
        logger.info(f"Test endpoint called for username: {username}")
        
        # Clean username
        username = username.lstrip('@')
        
        # Get TikTok service
        logger.info("Getting TikTok service...")
        tiktok_service = get_tiktok_service()
        logger.info(f"TikTok service type: {type(tiktok_service)}")
        
        # Fetch user info and videos
        logger.info(f"Fetching user info for: {username}")
        user_info = await tiktok_service.get_user_info(username)
        logger.info(f"User info fetched successfully: {user_info.get('username', 'unknown')}")
        
        # Also fetch videos
        logger.info(f"Fetching videos for: {username}")
        videos_data = await tiktok_service.get_user_videos(username, 25, 0)
        logger.info(f"Videos fetched successfully: {len(videos_data['videos'])} videos")
        
        # Combine user info and videos
        return {
            **user_info,
            "videos": videos_data["videos"],
            "count": videos_data["count"],
            "hasMore": videos_data["hasMore"],
            "cursor": videos_data["cursor"]
        }
        
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch user: {str(e)}"
        )

@router.get("/preview/{video_id}", response_model=VideoPreviewResponse, summary="Get TikTok Video Preview")
async def get_video_preview(
    video_id: str,
    user_id: str = Query(..., description="User ID for rate limiting")
):
    """
    Get preview information for a TikTok video including streaming URL.
    
    This endpoint retrieves video metadata and a direct streaming URL
    without downloading the video file. Perfect for preview functionality.
    
    **Rate Limiting**: 30 requests per hour per user
    
    Returns:
        Video preview data with streaming URL
    """
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Get video preview
        preview_data = await tiktok_service.get_video_preview(video_id)
        
        return VideoPreviewResponse(**preview_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to get video preview: {str(e)}"
        )


@router.post("/preview-batch", summary="Get Batch TikTok Video Previews")
async def get_batch_video_previews(
    request: BatchPreviewRequest
):
    """
    Get preview information for multiple TikTok videos at once.
    
    This endpoint retrieves metadata and streaming URLs for up to 10 videos
    in a single request. Useful for showing multiple video previews efficiently.
    
    **Rate Limiting**: 10 requests per hour per user
    
    Returns:
        List of video preview data
    """
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Fetch previews concurrently
        preview_tasks = []
        for video_id in request.video_ids:
            preview_tasks.append(tiktok_service.get_video_preview(video_id))
        
        # Wait for all previews
        previews = await asyncio.gather(*preview_tasks, return_exceptions=True)
        
        # Process results
        successful_previews = []
        failed_previews = []
        
        for i, preview in enumerate(previews):
            if isinstance(preview, Exception):
                failed_previews.append({
                    "videoId": request.video_ids[i],
                    "error": str(preview)
                })
            else:
                successful_previews.append(preview)
        
        return {
            "previews": successful_previews,
            "failed": failed_previews,
            "totalRequested": len(request.video_ids),
            "totalSuccessful": len(successful_previews)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to get batch previews: {str(e)}"
        )


@router.get("/stream/{video_id}", summary="Stream TikTok Video")
async def stream_video(
    video_id: str,
    user_id: str = Query(default="stream-user", description="User ID for rate limiting (optional)")
):
    """
    Stream a TikTok video preview through the backend.
    
    This endpoint downloads a preview of the video (first 15 seconds) and
    caches it locally to bypass CORS restrictions and CDN authentication issues.
    
    **Rate Limiting**: 50 requests per hour per user
    
    Returns:
        Video file stream with appropriate content type
    """
    try:
        # Create cache directory if it doesn't exist
        cache_dir = Path("/tmp/tiktok_preview_cache")
        cache_dir.mkdir(exist_ok=True)
        
        # Cache file path
        cache_path = cache_dir / f"{video_id}.mp4"
        
        # Check if video is already cached and not expired (1 hour cache)
        if cache_path.exists():
            file_size = cache_path.stat().st_size
            file_age = time.time() - cache_path.stat().st_mtime
            
            # Check if file has content and is not expired
            if file_size > 0 and file_age < 3600:  # Has content and less than 1 hour old
                logger.info(f"Serving cached preview for video {video_id}, size: {file_size} bytes")
                return FileResponse(
                    path=str(cache_path),
                    media_type="video/mp4",
                    headers={
                        "Accept-Ranges": "bytes",
                        "Cache-Control": "public, max-age=3600",
                        "Access-Control-Allow-Origin": "*",
                    }
                )
            else:
                # Remove expired or empty cache
                cache_path.unlink()
                if file_size == 0:
                    logger.info(f"Removed empty cache file for video {video_id}")
                else:
                    logger.info(f"Removed expired cache for video {video_id}")
        
        # Download video preview using yt-dlp
        logger.info(f"Downloading preview for video {video_id}")
        
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Use yt-dlp to download the video
        video_bytes = await tiktok_service.download_video_bytes(video_id)
        
        # Validate video bytes
        if not video_bytes or len(video_bytes) == 0:
            raise Exception(f"Downloaded video is empty for {video_id}")
        
        # Save to cache
        async with aiofiles.open(cache_path, 'wb') as f:
            await f.write(video_bytes)
        
        # Verify the cached file
        if not cache_path.exists() or cache_path.stat().st_size == 0:
            raise Exception(f"Failed to cache video {video_id}")
        
        logger.info(f"Cached preview for video {video_id}, size: {len(video_bytes)} bytes")
        
        # Return the cached file
        return FileResponse(
            path=str(cache_path),
            media_type="video/mp4",
            headers={
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error streaming video {video_id}: {error_msg}")
        
        # Check for DNS/network errors and provide user-friendly message
        if "Failed to resolve" in error_msg or "Temporary failure in name resolution" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="Video temporarily unavailable. This may be due to network issues or the video being region-locked. Please try again later."
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stream video: {error_msg}"
        )


@router.get("/proxy-simple/{video_id}", summary="Simple Proxy TikTok Video Stream")
async def simple_proxy_video_stream(
    video_id: str,
    user_id: str = Query(default="proxy-user", description="User ID for rate limiting (optional)")
):
    """
    Simple proxy for TikTok video stream without pre-flight checks.
    
    This endpoint extracts the direct video URL using yt-dlp and proxies
    the request to avoid CORS issues. No HEAD requests are made.
    
    **Rate Limiting**: 100 requests per hour per user
    
    Returns:
        Proxied video stream with appropriate headers
    """
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Get the direct stream URL using yt-dlp
        logger.info(f"Getting stream URL for video {video_id}")
        stream_url = await tiktok_service.get_video_stream_url(video_id)
        
        if not stream_url:
            raise HTTPException(
                status_code=404,
                detail=f"Could not find stream URL for video {video_id}"
            )
        
        logger.info(f"Got stream URL for video {video_id}, starting simple proxy")
        
        # Prepare headers for the request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
            "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "identity",
            "Referer": "https://www.tiktok.com/",
        }
        
        # Stream the video content directly
        async def stream_generator():
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0),
                follow_redirects=True
            ) as client:
                try:
                    async with client.stream('GET', stream_url, headers=headers) as response:
                        logger.info(f"Streaming response status: {response.status_code}")
                        
                        # Stream all content regardless of status
                        async for chunk in response.aiter_bytes(chunk_size=8192):
                            if chunk:
                                yield chunk
                except Exception as e:
                    logger.error(f"Streaming error: {str(e)}")
                    # Just stop streaming, don't raise
                    return
        
        # Return streaming response
        return StreamingResponse(
            stream_generator(),
            media_type="video/mp4",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            }
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simple proxy for video {video_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to proxy video stream: {str(e)}"
        )


@router.get("/proxy/{video_id}", summary="Proxy TikTok Video Stream")
async def proxy_video_stream(
    video_id: str,
    user_id: str = Query(default="proxy-user", description="User ID for rate limiting (optional)")
):
    """
    Proxy a TikTok video stream without downloading.
    
    This endpoint extracts the direct video URL using yt-dlp and proxies
    the request to avoid CORS issues. The video is streamed directly from
    TikTok's CDN without storing on our server.
    
    **Rate Limiting**: 100 requests per hour per user
    
    Returns:
        Proxied video stream with appropriate headers
    """
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Get the direct stream URL using yt-dlp
        logger.info(f"Getting stream URL for video {video_id}")
        stream_url = await tiktok_service.get_video_stream_url(video_id)
        
        if not stream_url:
            raise HTTPException(
                status_code=404,
                detail=f"Could not find stream URL for video {video_id}"
            )
        
        logger.info(f"Got stream URL for video {video_id}, proxying request")
        
        # Prepare headers for the request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
            "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "identity",  # Avoid compression for streaming
            "Referer": "https://www.tiktok.com/",
            "Origin": "https://www.tiktok.com",
            "Sec-Fetch-Dest": "video",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "cross-site",
        }
        
        # Pre-flight check to verify URL is accessible
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            follow_redirects=True,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        ) as client:
            try:
                # Make a HEAD request first to check if URL is accessible
                head_response = await client.head(stream_url, headers=headers)
                
                if head_response.status_code == 403:
                    logger.warning(f"TikTok returned 403 for video {video_id}, suggesting fallback")
                    raise HTTPException(
                        status_code=403,
                        detail="TikTok blocked the request. Please use the fallback URL."
                    )
                elif head_response.status_code != 200:
                    logger.error(f"Pre-flight check failed with status {head_response.status_code}")
                    raise HTTPException(
                        status_code=head_response.status_code,
                        detail=f"Video not accessible: {head_response.status_code}"
                    )
            except httpx.ConnectTimeout:
                logger.error(f"Connection timeout during pre-flight for video {video_id}")
                raise HTTPException(status_code=504, detail="Connection timeout")
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Pre-flight check error: {str(e)}")
                # Continue anyway, as HEAD might not be supported
                pass
        
        # Stream the video content
        async def stream_generator():
            # Create client inside the generator
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0),
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            ) as client:
                try:
                    async with client.stream('GET', stream_url, headers=headers) as response:
                        # Just log the status, don't raise exceptions here
                        if response.status_code != 200:
                            logger.error(f"Streaming failed with status {response.status_code}")
                            # Return empty response to trigger frontend fallback
                            return
                        
                        # Stream chunks
                        async for chunk in response.aiter_bytes(chunk_size=8192):
                            if chunk:  # Only yield non-empty chunks
                                yield chunk
                except Exception as e:
                    logger.error(f"Streaming error for video {video_id}: {str(e)}")
                    # Don't raise, just stop streaming
                    return
        
        # Return streaming response without Content-Length to avoid mismatch
        return StreamingResponse(
            stream_generator(),
            media_type="video/mp4",
            headers={
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
                # Don't include Content-Length for streaming response
            }
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying video {video_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to proxy video stream: {str(e)}"
        )


@router.get("/download/{video_id}", summary="Download TikTok Video Preview")
async def download_video_preview(
    video_id: str,
    user_id: str = Query(default="download-user", description="User ID for rate limiting (optional)")
):
    """
    Download and serve a TikTok video preview.
    
    This is a fallback endpoint when proxy streaming fails due to TikTok blocking.
    Downloads the video temporarily and serves it.
    
    **Rate Limiting**: 20 requests per hour per user
    
    Returns:
        Video file response
    """
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Create temporary file for download
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            # Download video using yt-dlp
            logger.info(f"Downloading video {video_id} for preview")
            video_bytes = await tiktok_service.download_video_bytes(video_id)
            
            if not video_bytes or len(video_bytes) == 0:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to download video"
                )
            
            # Write to temporary file
            async with aiofiles.open(tmp_path, 'wb') as f:
                await f.write(video_bytes)
            
            # Create background task for cleanup
            background_tasks = BackgroundTasks()
            background_tasks.add_task(os.unlink, tmp_path)
            
            # Return file response
            return FileResponse(
                path=tmp_path,
                media_type="video/mp4",
                headers={
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                },
                background=background_tasks  # Delete after serving
            )
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading video preview {video_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download video preview: {str(e)}"
        )


@router.delete("/stream/cache", summary="Clean TikTok Preview Cache")
async def clean_preview_cache(
    max_age_hours: int = Query(default=1, description="Remove files older than this many hours"),
    remove_empty: bool = Query(default=True, description="Remove empty files regardless of age")
):
    """
    Clean up old preview cache files.
    
    This endpoint can be called periodically to remove old cached preview files
    and free up disk space.
    
    Returns:
        Number of files cleaned
    """
    try:
        cache_dir = Path("/tmp/tiktok_preview_cache")
        if not cache_dir.exists():
            return {"message": "Cache directory does not exist", "files_removed": 0}
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        files_removed = 0
        empty_files_removed = 0
        
        for cache_file in cache_dir.glob("*.mp4"):
            file_size = cache_file.stat().st_size
            file_age = current_time - cache_file.stat().st_mtime
            
            # Remove empty files regardless of age
            if remove_empty and file_size == 0:
                cache_file.unlink()
                empty_files_removed += 1
                logger.info(f"Removed empty cache file: {cache_file.name}")
            # Remove old files
            elif file_age > max_age_seconds:
                cache_file.unlink()
                files_removed += 1
                logger.info(f"Removed old cache file: {cache_file.name} (age: {file_age/3600:.1f} hours)")
        
        return {
            "message": f"Cleaned cache files",
            "old_files_removed": files_removed,
            "empty_files_removed": empty_files_removed,
            "total_removed": files_removed + empty_files_removed
        }
        
    except Exception as e:
        logger.error(f"Error cleaning cache: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clean cache: {str(e)}"
        )


@router.delete("/stream/cache/all", summary="Clear All TikTok Preview Cache")
async def clear_all_cache():
    """
    Remove all files from the preview cache.
    
    This is useful for forcing fresh downloads of all videos.
    
    Returns:
        Number of files removed
    """
    try:
        cache_dir = Path("/tmp/tiktok_preview_cache")
        if not cache_dir.exists():
            return {"message": "Cache directory does not exist", "files_removed": 0}
        
        files_removed = 0
        
        for cache_file in cache_dir.glob("*.mp4"):
            cache_file.unlink()
            files_removed += 1
            logger.info(f"Removed cache file: {cache_file.name}")
        
        return {
            "message": "Cleared all cache files",
            "files_removed": files_removed
        }
        
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/audio/{video_id}", summary="Extract Audio from TikTok Video")
async def extract_audio(
    video_id: str,
    format: str = Query(default="mp3", description="Audio format (mp3, m4a, wav, original)"),
    user_id: str = Query(default="audio-user", description="User ID for rate limiting (optional)")
):
    """
    Extract and serve audio from a TikTok video.
    
    This endpoint extracts audio from the video and returns it in the requested format.
    If FFmpeg is not available, it returns the original video file.
    
    **Rate Limiting**: 30 requests per hour per user
    
    Returns:
        Audio file response
    """
    try:
        # Validate format
        valid_formats = ["mp3", "m4a", "wav", "aac", "original"]
        if format not in valid_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}"
            )
        
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Create temporary file for download
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            # Download audio
            logger.info(f"Extracting audio from video {video_id} in {format} format")
            audio_bytes = await tiktok_service.download_audio_bytes(video_id, format)
            
            if not audio_bytes or len(audio_bytes) == 0:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to extract audio"
                )
            
            # Write to temporary file
            async with aiofiles.open(tmp_path, 'wb') as f:
                await f.write(audio_bytes)
            
            # Determine media type
            media_types = {
                "mp3": "audio/mpeg",
                "m4a": "audio/mp4",
                "wav": "audio/wav",
                "aac": "audio/aac",
                "original": "video/mp4"  # Fallback to video
            }
            media_type = media_types.get(format, "audio/mpeg")
            
            # Create background task for cleanup
            background_tasks = BackgroundTasks()
            background_tasks.add_task(os.unlink, tmp_path)
            
            # Return file response
            return FileResponse(
                path=tmp_path,
                media_type=media_type,
                headers={
                    "Content-Disposition": f'attachment; filename="tiktok_{video_id}.{format}"',
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                },
                background=background_tasks  # Delete after serving
            )
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting audio from {video_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract audio: {str(e)}"
        )


@router.get("/audio-info/{video_id}", summary="Get Audio Information")
async def get_audio_info(
    video_id: str,
    user_id: str = Query(default="audio-user", description="User ID for rate limiting (optional)")
):
    """
    Get audio stream information for a TikTok video.
    
    This endpoint returns information about the audio streams available in the video
    without downloading the content.
    
    **Rate Limiting**: 50 requests per hour per user
    
    Returns:
        Audio stream information
    """
    try:
        # Get TikTok service
        tiktok_service = get_tiktok_service()
        
        # Get audio info
        audio_info = await tiktok_service.get_audio_info(video_id)
        
        return audio_info
        
    except Exception as e:
        logger.error(f"Error getting audio info for {video_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get audio info: {str(e)}"
        )