"""
Instagram Content API - Public endpoints for fetching Instagram content.

This module provides endpoints to fetch Instagram user profiles, posts,
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

# Import our Instagram service
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from services.instagram_service import get_instagram_service

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(env_path)

router = APIRouter()

# Initialize Convex client
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
convex_client = ConvexClient(CONVEX_URL)


class UserFetchRequest(BaseModel):
    """Request model for fetching Instagram user info."""
    job_id: str = Field(..., description="Unique job identifier")
    username: str = Field(..., description="Instagram username (without @) or profile URL")
    user_id: str = Field(..., description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "username": "cristiano",
                "user_id": "user123"
            }
        }


class PostsFetchRequest(BaseModel):
    """Request model for fetching Instagram posts."""
    job_id: str = Field(..., description="Unique job identifier")
    username: str = Field(..., description="Instagram username")
    user_id: str = Field(..., description="User ID for rate limiting")
    count: int = Field(6, description="Number of posts to fetch", ge=1, le=6)

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "username": "cristiano",
                "user_id": "user123",
                "count": 6
            }
        }


class MediaDownloadRequest(BaseModel):
    """Request model for downloading Instagram media."""
    job_id: str = Field(..., description="Unique job identifier")
    post_ids: List[str] = Field(..., description="List of post IDs/shortcodes to download")
    user_id: str = Field(..., description="User ID for rate limiting")
    username: str = Field(..., description="Instagram username for organization")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "post_ids": ["CaBC123defg", "CbDE456hijk"],
                "user_id": "user123",
                "username": "cristiano"
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
        result = convex_client.mutation("mutations/instagramContent:jobWebhook", {
            "jobId": job_id,
            "status": status,
            **cleaned_kwargs
        })
        
        logger.info(f"Webhook sent successfully for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error sending webhook for job {job_id}: {e}")


async def process_user_fetch(job_id: str, username: str, user_id: str):
    """Process user fetch job asynchronously."""
    try:
        logger.info(f"Processing Instagram user fetch for: {username}")
        
        # Get Instagram service
        instagram_service = get_instagram_service()
        
        # Fetch user info
        user_info = await instagram_service.get_user_info(username)
        
        logger.info(f"Successfully fetched user info for: {user_info.get('username')}")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            userData={
                "username": user_info["username"],
                "fullName": user_info["fullName"],
                "profilePicture": user_info["profilePicture"],
                "bio": user_info["bio"],
                "isVerified": user_info["isVerified"],
                "followerCount": user_info["followerCount"],
                "followingCount": user_info["followingCount"],
                "postCount": user_info["postCount"],
                "isPrivate": user_info["isPrivate"],
                "profileUrl": user_info["profileUrl"]
            }
        )
        
    except Exception as e:
        logger.error(f"Error in process_user_fetch: {str(e)}")
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_posts_fetch(job_id: str, username: str, user_id: str, count: int):
    """Process posts fetch job asynchronously."""
    try:
        logger.info(f"Processing Instagram posts fetch for: {username}, count: {count}")
        
        # Get Instagram service
        instagram_service = get_instagram_service()
        
        # Fetch posts
        posts_data = await instagram_service.get_user_posts(username, count)
        
        logger.info(f"Successfully fetched {posts_data['count']} posts for: {username}")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            postsData={
                "posts": posts_data["posts"],
                "count": posts_data["count"],
                "hasMore": posts_data["hasMore"],
                "nextCursor": posts_data["nextCursor"]
            }
        )
        
    except Exception as e:
        logger.error(f"Error in process_posts_fetch: {str(e)}")
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_media_download(job_id: str, post_ids: List[str], user_id: str, username: str):
    """Process media download job asynchronously."""
    try:
        logger.info(f"Processing Instagram media download for {len(post_ids)} posts")
        
        # Get Instagram service
        instagram_service = get_instagram_service()
        
        # Create temporary directory for downloads
        temp_dir = tempfile.mkdtemp(prefix=f"instagram_{username}_")
        downloaded_files = []
        
        # Update status to downloading
        send_convex_webhook(
            job_id,
            "downloading",
            progress=0,
            totalMedia=len(post_ids)
        )
        
        # Download each media file
        for i, post_id in enumerate(post_ids):
            try:
                logger.info(f"Downloading post {i+1}/{len(post_ids)}: {post_id}")
                
                # Download media bytes
                media_bytes = await instagram_service.download_media_bytes(post_id)
                
                # Save to file (using .mp4 extension as default, adjust based on media type in production)
                file_path = os.path.join(temp_dir, f"{post_id}.mp4")
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(media_bytes)
                
                downloaded_files.append({
                    "postId": post_id,
                    "filePath": file_path,
                    "fileSize": len(media_bytes)
                })
                
                # Update progress
                progress = int(((i + 1) / len(post_ids)) * 100)
                send_convex_webhook(
                    job_id,
                    "downloading",
                    progress=progress,
                    totalMedia=len(post_ids),
                    completedMedia=i + 1
                )
                
            except Exception as e:
                logger.error(f"Error downloading post {post_id}: {e}")
                # Continue with other posts
        
        logger.info(f"Successfully downloaded {len(downloaded_files)} media files")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            downloadData={
                "totalMedia": len(post_ids),
                "successfulDownloads": len(downloaded_files),
                "tempDirectory": temp_dir,
                "files": downloaded_files
            }
        )
        
    except Exception as e:
        logger.error(f"Error in process_media_download: {str(e)}")
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


@router.post("/user", response_model=JobStatusResponse, summary="Fetch Instagram User Info")
async def fetch_user_info(
    request: UserFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch Instagram user profile information.
    
    This endpoint initiates an asynchronous job to fetch user data including
    profile info, bio, follower count, and post count.
    
    **Rate Limiting**: 20 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    logger.info(f"Instagram user fetch request - Job ID: {request.job_id}, Username: {request.username}")
    
    # Clean username (remove @ if present)
    username = request.username.lstrip('@')
    
    # Process in background
    background_tasks.add_task(
        process_user_fetch,
        request.job_id,
        username,
        request.user_id
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="User info fetch started"
    )


@router.post("/posts", response_model=JobStatusResponse, summary="Fetch Instagram Posts")
async def fetch_user_posts(
    request: PostsFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch Instagram user's posts.
    
    This endpoint fetches a user's public posts with metadata including
    captions, likes, comments, and media URLs.
    
    **Rate Limiting**: 10 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    logger.info(f"Instagram posts fetch request - Job ID: {request.job_id}, Username: {request.username}")
    
    # Clean username
    username = request.username.lstrip('@')
    
    # Process in background
    background_tasks.add_task(
        process_posts_fetch,
        request.job_id,
        username,
        request.user_id,
        request.count
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="Posts fetch started"
    )


@router.post("/download", response_model=JobStatusResponse, summary="Download Instagram Media")
async def download_media(
    request: MediaDownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Download selected Instagram media for processing.
    
    This endpoint downloads the selected posts/reels to temporary storage
    for audio extraction and voice cloning processing.
    
    **Rate Limiting**: 5 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    logger.info(f"Instagram media download request - Job ID: {request.job_id}, Posts: {len(request.post_ids)}")
    
    # Validate post count
    if len(request.post_ids) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 posts can be downloaded at once"
        )
    
    # Process in background
    background_tasks.add_task(
        process_media_download,
        request.job_id,
        request.post_ids,
        request.user_id,
        request.username
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message=f"Download started for {len(request.post_ids)} media files"
    )


@router.get("/test/{username}", summary="Test Instagram User Fetch (Direct)")
async def test_user_fetch(username: str):
    """
    Direct user fetch for testing (bypasses job queue).
    
    **Warning**: This endpoint bypasses rate limiting and caching.
    Use only for testing purposes.
    """
    try:
        # Clean username
        username = username.lstrip('@')
        
        logger.info(f"Test fetch for Instagram user: {username}")
        
        # Get Instagram service
        instagram_service = get_instagram_service()
        
        # Fetch user info
        user_info = await instagram_service.get_user_info(username)
        
        # Fetch some posts (limited to 6)
        posts_data = await instagram_service.get_user_posts(username, count=6)
        
        return {
            "user": user_info,
            "posts": posts_data["posts"],
            "postCount": posts_data["count"]
        }
        
    except Exception as e:
        logger.error(f"Test fetch error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch user: {str(e)}"
        )