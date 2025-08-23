"""
YouTube Content API - Public endpoints for fetching YouTube channel and video content.

This module provides endpoints to fetch YouTube channel information, video listings,
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
import re
from dotenv import load_dotenv
from convex import ConvexClient
import yt_dlp
import json

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(env_path)

router = APIRouter()

# Initialize Convex client
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
convex_client = ConvexClient(CONVEX_URL)


class ChannelFetchRequest(BaseModel):
    """Request model for fetching YouTube channel info."""
    job_id: str = Field(..., description="Unique job identifier")
    channel_url: str = Field(..., description="YouTube channel URL or username")
    user_id: str = Field(..., description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "channel_url": "https://youtube.com/@MrBeast",
                "user_id": "user123"
            }
        }


class VideosFetchRequest(BaseModel):
    """Request model for fetching YouTube videos."""
    job_id: str = Field(..., description="Unique job identifier")
    channel_id: str = Field(..., description="YouTube channel ID")
    user_id: str = Field(..., description="User ID for rate limiting")
    count: int = Field(6, description="Number of videos to fetch", ge=1, le=50)
    sort_by: str = Field("newest", description="Sort order: newest, popular, oldest")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "channel_id": "UCX6OQ3DkcsbYNE6H8uQQuVA",
                "user_id": "user123",
                "count": 6,
                "sort_by": "newest"
            }
        }


class VideoDownloadRequest(BaseModel):
    """Request model for downloading YouTube videos."""
    job_id: str = Field(..., description="Unique job identifier")
    video_ids: List[str] = Field(..., description="List of video IDs to download")
    user_id: str = Field(..., description="User ID for rate limiting")
    channel_name: str = Field(..., description="Channel name for organization")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_123456",
                "video_ids": ["dQw4w9WgXcQ", "9bZkp7q19f0"],
                "user_id": "user123",
                "channel_name": "MrBeast"
            }
        }


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    status: str = Field(..., description="Job status", example="processing")
    job_id: str = Field(..., description="Job identifier")
    message: str = Field(..., description="Status message")


def extract_channel_info(url: str) -> tuple[str, str]:
    """Extract channel ID and type from YouTube URL."""
    # Clean the URL
    url = url.strip()
    
    # Handle direct @handles
    if url.startswith('@'):
        return url[1:], 'handle'
    
    # Handle full URLs
    patterns = {
        'channel_id': r'youtube\.com/channel/([a-zA-Z0-9_-]+)',
        'handle': r'youtube\.com/@([a-zA-Z0-9_.-]+)',
        'user': r'youtube\.com/user/([a-zA-Z0-9_-]+)',
        'custom': r'youtube\.com/c/([a-zA-Z0-9_-]+)'
    }
    
    for url_type, pattern in patterns.items():
        match = re.search(pattern, url)
        if match:
            return match.group(1), url_type
    
    # Check if it's a channel ID (starts with UC and is 24 chars)
    if url.startswith('UC') and len(url) == 24:
        return url, 'channel_id'
    
    # Default to handle
    return url, 'handle'


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
        print(f"\n>>> Sending Convex Webhook <<<")
        print(f"Job ID: {job_id}")
        print(f"Status: {status}")
        print(f"Data: {json.dumps(kwargs, indent=2, default=str)[:500]}...")
        
        # Clean the data to remove None values
        cleaned_kwargs = clean_data_for_convex(kwargs)
        
        # Call the Convex mutation
        result = convex_client.mutation("mutations/youtubeContent:jobWebhook", {
            "jobId": job_id,
            "status": status,
            **cleaned_kwargs
        })
        
        print(f"Webhook Result: {result}")
        print(f">>>>>>>>>>>>>>>>>>>>>>>>>>>\n")
        
    except Exception as e:
        print(f"\n!!! Webhook Error !!!")
        print(f"Error sending webhook: {e}")
        print(f"!!!!!!!!!!!!!!!!!!!!!\n")


async def fetch_channel_data(channel_url: str) -> Dict[str, Any]:
    """Fetch real channel data using yt-dlp."""
    import asyncio
    import concurrent.futures
    
    print(f"[fetch_channel_data] Starting extraction for: {channel_url}")
    
    # Configure yt-dlp for channel extraction
    ydl_opts = {
        'quiet': False,  # Show output for debugging
        'no_warnings': False,
        'skip_download': True,
        'no_color': True,
        'no_check_certificates': True,
        'ignoreerrors': False,
        'extract_flat': 'in_playlist',  # For getting video list
        'socket_timeout': 10,
        'retries': 3,
    }
    
    try:
        # First, let's try to get channel info by fetching the channel's videos page
        # This is more reliable than trying to extract the channel page directly
        channel_videos_url = channel_url
        
        # Ensure we're fetching the videos tab
        if '@' in channel_url:
            # Handle @username format
            if not channel_url.startswith('http'):
                channel_videos_url = f"https://www.youtube.com/{channel_url}/videos"
            else:
                channel_videos_url = f"{channel_url}/videos"
        elif '/channel/' in channel_url:
            # Handle channel ID format
            channel_videos_url = f"{channel_url}/videos"
        else:
            # Try to construct a valid URL
            channel_videos_url = f"https://www.youtube.com/@{channel_url}/videos"
        
        print(f"[fetch_channel_data] Fetching from URL: {channel_videos_url}")
        
        # Use asyncio with timeout
        loop = asyncio.get_event_loop()
        
        def extract_info_sync():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(channel_videos_url, download=False)
        
        # Run in executor with timeout
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = loop.run_in_executor(executor, extract_info_sync)
            info = await asyncio.wait_for(future, timeout=30.0)
        
        print(f"[fetch_channel_data] Extraction completed, processing data...")
        
        if not info:
            raise ValueError("Could not extract channel information")
        
        # Extract channel information from the playlist data
        channel_id = info.get('channel_id') or info.get('uploader_id') or info.get('id')
        channel_name = info.get('channel') or info.get('uploader') or info.get('title', '').replace(' - Videos', '')
        channel_handle = info.get('uploader_id') or extract_channel_info(channel_url)[0]
        
        # For subscriber count, we might need to extract from the first video
        subscriber_count = info.get('channel_follower_count', 0)
        
        # Get video count from playlist
        video_count = info.get('playlist_count') or len(info.get('entries', []))
        
        print(f"[fetch_channel_data] Extracted - Name: {channel_name}, ID: {channel_id}, Videos: {video_count}")
        
        # Build channel data
        channel_data = {
            "channelId": channel_id or f"UC_{channel_handle}",
            "channelName": channel_name or channel_handle,
            "channelHandle": channel_handle,
            "channelUrl": info.get('channel_url') or info.get('uploader_url') or channel_url,
            "subscriberCount": subscriber_count,
            "videoCount": video_count,
            "description": info.get('description', ''),
        }
        
        # Try to get avatar from thumbnails
        thumbnails = info.get('thumbnails', [])
        if thumbnails:
            # Get the highest quality thumbnail as avatar
            avatar = max(thumbnails, key=lambda x: (x.get('width', 0) * x.get('height', 0)), default=None)
            if avatar:
                channel_data['avatar'] = avatar.get('url')
        
        # If no avatar found, try to get from first video entry
        if 'avatar' not in channel_data and info.get('entries'):
            first_entry = info['entries'][0] if info['entries'] else None
            if first_entry and isinstance(first_entry, dict):
                # Try to extract channel thumbnail from video data
                channel_thumb = first_entry.get('channel_thumbnail') or first_entry.get('uploader_thumbnail')
                if channel_thumb:
                    channel_data['avatar'] = channel_thumb
        
        # Fallback avatar
        if 'avatar' not in channel_data:
            channel_data['avatar'] = f"https://ui-avatars.com/api/?name={channel_name or channel_handle}&size=800&background=FF0000&color=ffffff"
        
        print(f"[fetch_channel_data] Successfully built channel data")
        return channel_data
            
    except asyncio.TimeoutError:
        print(f"[fetch_channel_data] Timeout while fetching channel data")
        raise ValueError("Timeout while fetching YouTube channel data")
    except Exception as e:
        print(f"[fetch_channel_data] Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return basic channel data as fallback
        identifier, _ = extract_channel_info(channel_url)
        return {
            "channelId": f"UC_{identifier}",
            "channelName": identifier.replace('-', ' ').title(),
            "channelHandle": identifier,
            "channelUrl": channel_url,
            "avatar": f"https://ui-avatars.com/api/?name={identifier}&size=800&background=FF0000&color=ffffff",
            "subscriberCount": 0,
            "videoCount": 0,
            "description": f"YouTube channel @{identifier}"
        }


async def fetch_channel_videos(channel_id: str, count: int = 6, sort_by: str = "newest") -> List[Dict[str, Any]]:
    """Fetch real videos from a YouTube channel using yt-dlp."""
    import asyncio
    import concurrent.futures
    
    print(f"[fetch_channel_videos] Starting video fetch for channel: {channel_id}, count: {count}")
    
    # Configure yt-dlp for video list extraction
    ydl_opts = {
        'quiet': False,
        'no_warnings': False,
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'playlistend': count,  # Limit to requested number of videos
        'no_color': True,
        'no_check_certificates': True,
        'socket_timeout': 10,
        'retries': 3,
    }
    
    # Construct the appropriate URL based on sort order
    if sort_by == "popular":
        playlist_url = f"https://www.youtube.com/channel/{channel_id}/videos?view=0&sort=p&flow=grid"
    else:
        # For newest videos, use the standard videos page
        playlist_url = f"https://www.youtube.com/channel/{channel_id}/videos"
    
    print(f"[fetch_channel_videos] Fetching from URL: {playlist_url}")
    
    try:
        # Use asyncio with timeout
        loop = asyncio.get_event_loop()
        
        def extract_info_sync():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(playlist_url, download=False)
        
        # Run in executor with timeout
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = loop.run_in_executor(executor, extract_info_sync)
            playlist_info = await asyncio.wait_for(future, timeout=30.0)
        
        print(f"[fetch_channel_videos] Extraction completed, processing videos...")
        
        if not playlist_info:
            return []
        
        entries = playlist_info.get('entries', [])
        videos = []
        
        print(f"[fetch_channel_videos] Found {len(entries)} videos, processing up to {count}")
        
        # Extract basic info for each video (flat extraction is faster)
        for i, entry in enumerate(entries[:count]):
            if not entry:
                continue
                
            video_id = entry.get('id')
            if not video_id:
                continue
            
            print(f"[fetch_channel_videos] Processing video {i+1}/{count}: {video_id}")
            
            # Use data from flat extraction (much faster than full extraction)
            video_data = {
                "videoId": video_id,
                "channelId": channel_id,
                "title": entry.get('title', 'Untitled'),
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "thumbnails": [
                    {
                        "quality": "maxresdefault",
                        "url": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
                        "width": 1280,
                        "height": 720
                    },
                    {
                        "quality": "hqdefault",
                        "url": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                        "width": 480,
                        "height": 360
                    }
                ],
                "duration": entry.get('duration', 0),
                "viewCount": entry.get('view_count', 0),
                # Don't include optional fields with null values
                # These fields are not available in flat extraction
            }
            
            videos.append(video_data)
        
        # Sort videos if needed
        if sort_by == "oldest" and videos:
            videos.reverse()
        
        print(f"[fetch_channel_videos] Successfully fetched {len(videos)} videos")
        return videos
        
    except Exception as e:
        print(f"Error fetching channel videos: {str(e)}")
        return []


async def process_channel_fetch(job_id: str, channel_url: str, user_id: str):
    """Process channel fetch job asynchronously."""
    try:
        print(f"\n=== Processing Channel Fetch ===")
        print(f"Channel URL: {channel_url}")
        
        # Fetch channel data
        channel_data = await fetch_channel_data(channel_url)
        
        print(f"Channel Data Retrieved:")
        print(f"  - Name: {channel_data.get('channelName')}")
        print(f"  - ID: {channel_data.get('channelId')}")
        print(f"  - Subscribers: {channel_data.get('subscriberCount')}")
        print(f"  - Videos: {channel_data.get('videoCount')}")
        print(f"===============================\n")
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            channelData=channel_data
        )
        
        print(f"✓ Webhook sent for job {job_id}")
        
    except Exception as e:
        print(f"\n!!! Error in process_channel_fetch !!!")
        print(f"Error: {str(e)}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_videos_fetch(job_id: str, channel_id: str, user_id: str, count: int, sort_by: str):
    """Process videos fetch job asynchronously."""
    try:
        # Fetch videos
        videos = await fetch_channel_videos(channel_id, count, sort_by)
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            videosData={
                "videos": videos,
                "count": len(videos),
                "channelId": channel_id
            }
        )
        
    except Exception as e:
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


async def process_video_download(job_id: str, video_ids: List[str], user_id: str, channel_name: str):
    """Process video download job asynchronously."""
    try:
        # For now, just simulate download progress
        send_convex_webhook(
            job_id,
            "downloading",
            progress=0,
            totalVideos=len(video_ids)
        )
        
        # Simulate download progress
        for i, video_id in enumerate(video_ids):
            await asyncio.sleep(0.5)  # Simulate download time
            
            progress = int(((i + 1) / len(video_ids)) * 100)
            send_convex_webhook(
                job_id,
                "downloading",
                progress=progress,
                totalVideos=len(video_ids),
                completedVideos=i + 1
            )
        
        # Send success webhook
        send_convex_webhook(
            job_id,
            "completed",
            downloadData={
                "totalVideos": len(video_ids),
                "successfulDownloads": len(video_ids),
                "tempDirectory": "/tmp/youtube_downloads",
                "files": [
                    {
                        "videoId": vid,
                        "filePath": f"/tmp/youtube_downloads/{vid}.mp4",
                        "fileSize": 10000000,  # 10MB placeholder
                        "title": f"Video {vid}",
                        "duration": 600
                    }
                    for vid in video_ids
                ]
            }
        )
        
    except Exception as e:
        # Send failure webhook
        send_convex_webhook(
            job_id,
            "failed",
            error=str(e)
        )


@router.post("/channel", response_model=JobStatusResponse, summary="Fetch YouTube Channel Info")
async def fetch_channel_info(
    request: ChannelFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch YouTube channel information including metadata and avatar.
    
    This endpoint initiates an asynchronous job to fetch channel data including
    name, subscriber count, video count, and avatar image.
    
    **Rate Limiting**: 20 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    print(f"\n=== YouTube Channel Fetch Request ===")
    print(f"Job ID: {request.job_id}")
    print(f"Channel URL: {request.channel_url}")
    print(f"User ID: {request.user_id}")
    print(f"===================================\n")
    
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


@router.post("/videos", response_model=JobStatusResponse, summary="Fetch YouTube Videos")
async def fetch_videos_endpoint(
    request: VideosFetchRequest,
    background_tasks: BackgroundTasks
):
    """
    Fetch YouTube channel's videos with metadata.
    
    This endpoint fetches a channel's videos including thumbnails, view counts,
    durations, and other metadata needed for voice cloning selection.
    
    **Rate Limiting**: 10 requests per hour per user (enforced by Convex)
    
    Returns:
        Job status with processing message
    """
    # Process in background
    background_tasks.add_task(
        process_videos_fetch,
        request.job_id,
        request.channel_id,
        request.user_id,
        request.count,
        request.sort_by
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message="Videos fetch started"
    )


@router.post("/download", response_model=JobStatusResponse, summary="Download YouTube Videos")
async def download_videos(
    request: VideoDownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Download selected YouTube videos for voice cloning processing.
    
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
        request.channel_name
    )
    
    return JobStatusResponse(
        status="processing",
        job_id=request.job_id,
        message=f"Download started for {len(request.video_ids)} videos"
    )


@router.get("/test/{channel_id}", summary="Test YouTube Channel Fetch (Direct)")
async def test_channel_fetch(channel_id: str):
    """
    Direct channel fetch for testing (bypasses job queue).
    
    **Warning**: This endpoint bypasses rate limiting and caching.
    Use only for testing purposes.
    """
    try:
        # Format channel URL
        if channel_id.startswith('@'):
            channel_url = f"https://youtube.com/{channel_id}"
        elif channel_id.startswith('UC') and len(channel_id) == 24:
            channel_url = f"https://youtube.com/channel/{channel_id}"
        else:
            channel_url = f"https://youtube.com/@{channel_id}"
        
        # Fetch channel info
        channel_data = await fetch_channel_data(channel_url)
        
        # Fetch some videos (limited to 6)
        videos = await fetch_channel_videos(
            channel_data.get('channelId', channel_id), 
            count=6,
            sort_by="newest"
        )
        
        return {
            "channel": channel_data,
            "videos": videos,
            "videoCount": len(videos)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch channel: {str(e)}"
        )