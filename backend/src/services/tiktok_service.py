"""
TikTok Service - Wrapper for TikTok API functionality.

This module provides a service layer for interacting with TikTok's API
to fetch user information, videos, and download content.
"""

from typing import Optional, List, Dict, Any
import asyncio
import os
import logging
from datetime import datetime
import json
import yt_dlp
from pprint import pformat
import aiofiles

logger = logging.getLogger(__name__)


class TikTokService:
    """Service for interacting with TikTok API."""
    
    def __init__(self):
        """
        Initialize TikTok service with yt-dlp.
        """
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,  # We want full extraction
            'force_generic_extractor': False,
            'ignoreerrors': True,
            'no_color': True,
            'no_check_certificate': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
    
    def _extract_info_with_retry(self, url: str, ydl_opts: dict, max_retries: int = 3):
        """Extract info with retry logic and exponential backoff."""
        retry_delay = 1  # Start with 1 second delay
        
        for attempt in range(max_retries):
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                try:
                    info = ydl.extract_info(url, download=False)
                    if info:
                        return info
                except Exception as e:
                    error_msg = str(e).lower()
                    logger.error(f"yt-dlp extraction error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                    
                    # Don't retry for certain permanent errors
                    if any(term in error_msg for term in [
                        'video unavailable', 'private', 'deleted', 'not found',
                        'does not exist', 'removed', 'blocked'
                    ]):
                        logger.warning(f"Permanent error detected, not retrying: {str(e)}")
                        return None
                    
                    # If this is the last attempt, return None
                    if attempt == max_retries - 1:
                        return None
                    
                    # Wait before retrying with exponential backoff
                    import time
                    time.sleep(retry_delay * (2 ** attempt))
        
        return None
        
    def _extract_user_info_from_data(self, info_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user information from yt-dlp info."""
        # Get username from title field first (most reliable for TikTok)
        username = info_dict.get('title', '')
        
        # Get uploader info from the data - check multiple possible fields
        uploader = (info_dict.get('uploader') or 
                   info_dict.get('channel') or 
                   info_dict.get('creator') or
                   info_dict.get('playlist_uploader') or 
                   username)  # Use title as fallback
        
        uploader_id = (info_dict.get('uploader_id') or 
                      info_dict.get('channel_id') or
                      info_dict.get('playlist_uploader_id') or 
                      info_dict.get('id', ''))
        
        # Try to get profile URL
        uploader_url = (info_dict.get('uploader_url') or 
                       info_dict.get('channel_url') or
                       info_dict.get('webpage_url', ''))
        
        # For user pages, use playlist_count for accurate video count
        entries = info_dict.get('entries', [])
        playlist_count = info_dict.get('playlist_count')
        
        # Ensure video_count is always a number, never None
        if playlist_count is not None and isinstance(playlist_count, (int, float)):
            video_count = int(playlist_count)
        else:
            video_count = len(entries) if entries else 0
        
        # Try to extract avatar from various sources
        avatar = (info_dict.get('uploader_thumbnail') or 
                 info_dict.get('channel_thumbnail') or
                 info_dict.get('thumbnail') or '')
        
        # Initialize follower count
        follower_count = 0
        
        # If no avatar from main dict, try first video entry
        if not avatar and entries and len(entries) > 0:
            first_entry = entries[0]
            if isinstance(first_entry, dict):
                # Try to get uploader thumbnail from video - check multiple possible fields
                possible_avatar_fields = [
                    'uploader_thumbnail',
                    'channel_thumbnail', 
                    'uploader_avatar',
                    'channel_avatar',
                    'author_thumbnail',
                    'creator_thumbnail'
                ]
                
                for field in possible_avatar_fields:
                    if first_entry.get(field):
                        avatar = first_entry[field]
                        logger.info(f"Found avatar in field: {field}")
                        break
                
                # If still no avatar, try thumbnail as last resort
                if not avatar and first_entry.get('thumbnail'):
                    avatar = first_entry['thumbnail']
                
                # Also update uploader info if not found
                if not uploader and first_entry.get('uploader'):
                    uploader = first_entry.get('uploader')
                if not uploader_id and first_entry.get('uploader_id'):
                    uploader_id = first_entry.get('uploader_id')
                    
                # Try to get follower count from video entry
                if 'channel_follower_count' in first_entry:
                    follower_count = first_entry.get('channel_follower_count', 0)
                elif 'follower_count' in first_entry:
                    follower_count = first_entry.get('follower_count', 0)
        
        # Try to get follower count from main dict if not found in entries
        follower_count = (info_dict.get('channel_follower_count') or
                         info_dict.get('follower_count') or 0)        
        # Extract description/bio
        description = info_dict.get('description', '')
        if not description and entries and len(entries) > 0:
            # Try to get from playlist description
            description = info_dict.get('playlist_description', '')
        
        # Generate fallback avatar if none found
        if not avatar and uploader:
            # Use ui-avatars.com as fallback
            avatar = f"https://ui-avatars.com/api/?name={uploader}&size=512&background=FF0050&color=ffffff&bold=true"
        
        # Log what we extracted
        logger.info(f"Extracted user info - uploader: {uploader}, avatar: {avatar[:50]}...")
        
        # Extract nickname - for TikTok, often the display name is different from username
        nickname = uploader or username
        # If we have entries, check if the channel name from videos is different
        if entries and len(entries) > 0 and isinstance(entries[0], dict):
            video_channel = entries[0].get('channel', '')
            if video_channel and video_channel != username:
                nickname = video_channel
        
        return {
            'username': username or uploader or 'unknown',
            'userId': uploader_id or 'unknown',
            'secUid': uploader_id or 'unknown',  # TikTok uses secUid, we'll use uploader_id
            'nickname': nickname or 'Unknown User',
            'avatar': avatar,
            'signature': description[:200] if description else '',
            'verified': bool(info_dict.get('verified', False)),
            'followerCount': int(follower_count) if follower_count else 0,
            'followingCount': 0,  # Not available via yt-dlp
            'videoCount': int(video_count) if video_count else 0,
            'heartCount': 0,  # Not available via yt-dlp
            'privateAccount': False,

        }
    
    async def get_user_info(self, username: str) -> Dict[str, Any]:
        """
        Fetch user information from TikTok using yt-dlp.
        
        Args:
            username: TikTok username (without @)
            
        Returns:
            Dictionary containing user information
            
        Raises:
            Exception: If user not found or API error
        """
        try:
            # Extract username from URL if provided
            if username.startswith('http'):
                # Extract username from URL like https://www.tiktok.com/@zachking or https://www.tiktok.com/zachking
                import re
                match = re.search(r'tiktok\.com/@?([^/?]+)', username)
                if match:
                    username = match.group(1)
                else:
                    raise ValueError(f"Invalid TikTok URL: {username}")
            
            # Clean username
            username = username.replace('@', '')
            
            # TikTok user URL
            url = f'https://www.tiktok.com/@{username}'
            
            # Create yt-dlp instance with options
            ydl_opts = {
                **self.ydl_opts,
                'extract_flat': False,  # Get full data for first video to extract user info
                'playlistend': 25,  # Get more videos for user info
                'quiet': False,  # Show output for debugging
            }            
            # Run extraction in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            def extract_info():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    try:
                        info = ydl.extract_info(url, download=False)
                        return info
                    except Exception as e:
                        logger.error(f"yt-dlp extraction error: {str(e)}")
                        return None
                        
            info_dict = await loop.run_in_executor(None, extract_info)
            
            if not info_dict:
                raise Exception(f"Could not fetch user info for {username}")
            
            # Log the full info_dict to understand available fields
            logger.info(f"\n{'='*50}")
            logger.info(f"TikTok User Info Dict for @{username}:")
            logger.info(f"{'='*50}")
            
            # Log all top-level keys
            logger.info(f"Available keys: {list(info_dict.keys())}")
            
            # Log specific fields we're interested in
            fields_to_log = [
                'uploader', 'uploader_id', 'uploader_url', 'uploader_thumbnail',
                'channel', 'channel_id', 'channel_url', 'channel_thumbnail',
                'thumbnail', 'thumbnails', 'creator', 'channel_follower_count', 'follower_count',
                'description', 'title', 'webpage_url', 'playlist_title', 'playlist_uploader',
                'playlist_uploader_id', 'entries'
            ]
            
            for field in fields_to_log:
                if field in info_dict:
                    value = info_dict[field]
                    if field == 'entries' and isinstance(value, list):
                        logger.info(f"{field}: {len(value)} entries")
                        if value and len(value) > 0:
                            logger.info(f"First entry keys: {list(value[0].keys()) if isinstance(value[0], dict) else 'Not a dict'}")
                            # Log specific fields from first entry
                            if isinstance(value[0], dict):
                                first_entry = value[0]
                                entry_fields = ['uploader', 'channel', 'uploader_id', 'channel_id', 
                                              'uploader_url', 'channel_url', 'uploader_thumbnail',
                                              'channel_thumbnail', 'uploader_avatar', 'channel_avatar',
                                              'author_thumbnail', 'creator_thumbnail',
                                              'channel_follower_count', 'follower_count']
                                for ef in entry_fields:
                                    if ef in first_entry:
                                        logger.info(f"  First entry {ef}: {first_entry[ef]}")
                    elif isinstance(value, (dict, list)) and len(str(value)) > 200:
                        logger.info(f"{field}: {type(value).__name__} with {len(value)} items")
                    else:
                        logger.info(f"{field}: {value}")
            
            # Also log playlist_count if available
            if 'playlist_count' in info_dict:
                logger.info(f"playlist_count: {info_dict['playlist_count']}")
            
            logger.info(f"{'='*50}\n")
            
            # Extract user information from the data
            user_info = self._extract_user_info_from_data(info_dict)
            
            # Update username to match input
            user_info['username'] = username
            
            return user_info
            
        except Exception as e:
            logger.error(f"Error fetching user info for {username}: {str(e)}")
            raise Exception(f"Failed to fetch user info: {str(e)}")
    
    async def get_user_videos(
        self, 
        username: str, 
        count: int = 6,  # Default 6 for cloning, up to 25 for bulk processing
        cursor: int = 0
    ) -> Dict[str, Any]:
        """
        Fetch user's videos from TikTok using yt-dlp.
        
        Args:
            username: TikTok username
            count: Number of videos to fetch (default 6, max 25 for bulk processing)
            cursor: Pagination cursor (not used with yt-dlp)
            
        Returns:
            Dictionary containing videos and pagination info
        """
        try:
            # Extract username from URL if provided
            if username.startswith('http'):
                # Extract username from URL like https://www.tiktok.com/@zachking or https://www.tiktok.com/zachking
                import re
                match = re.search(r'tiktok\.com/@?([^/?]+)', username)
                if match:
                    username = match.group(1)
                else:
                    raise ValueError(f"Invalid TikTok URL: {username}")
            
            # Clean username
            username = username.replace('@', '')
            
            # Limit count to 25 for bulk processing (increased from 6 for cloning)
            count = min(count, 25)
            
            # TikTok user URL
            url = f'https://www.tiktok.com/@{username}'
            
            # Create yt-dlp instance with options
            ydl_opts = {
                **self.ydl_opts,
                'extract_flat': False,  # We want full video extraction
                'playlist_items': f'1-{count}',  # Limit to first N videos
                'quiet': False,  # Enable debug output
            }            
            # Run extraction in thread pool to avoid blocking with retry logic
            loop = asyncio.get_event_loop()
            info_dict = await loop.run_in_executor(None, self._extract_info_with_retry, url, ydl_opts)
            
            if not info_dict:
                raise Exception(f"Could not fetch videos for {username}")
            
            # Log video extraction info
            logger.info(f"\n{'='*50}")
            logger.info(f"TikTok Videos Info Dict for @{username}:")
            logger.info(f"Available keys: {list(info_dict.keys())[:20]}...")
            if 'entries' in info_dict and info_dict['entries']:
                logger.info(f"Found {len(info_dict['entries'])} video entries")
                first_video = info_dict['entries'][0]
                if isinstance(first_video, dict):
                    logger.info(f"First video keys: {list(first_video.keys())[:15]}...")
                    # Log uploader info from video
                    if 'uploader' in first_video:
                        logger.info(f"Video uploader: {first_video['uploader']}")
                    if 'uploader_thumbnail' in first_video:
                        logger.info(f"Uploader thumbnail: {first_video['uploader_thumbnail']}")
            logger.info(f"{'='*50}\n")
            
            videos_data = []
            
            # Process entries (videos)
            for entry in info_dict.get('entries', [])[:count]:
                if not entry:
                    continue
                    
                # Extract video information
                video_info = {
                    "videoId": entry.get('id', ''),
                    "title": entry.get('title', '') or entry.get('description', ''),
                    "createTime": entry.get('timestamp', 0),
                    "duration": entry.get('duration', 0),
                    "thumbnail": entry.get('thumbnail') or (entry.get('thumbnails', [{}])[0].get('url') if entry.get('thumbnails') else ''),
                    "dynamicCover": entry.get('thumbnail') or (entry.get('thumbnails', [{}])[0].get('url') if entry.get('thumbnails') else ''),                    "playAddr": entry.get('url', '') or entry.get('webpage_url', ''),
                    "downloadAddr": entry.get('url', ''),
                    "stats": {
                        "views": entry.get('view_count', 0),
                        "likes": entry.get('like_count', 0),
                        "comments": entry.get('comment_count', 0),
                        "shares": entry.get('repost_count', 0),
                        "saves": 0  # Not provided by yt-dlp
                    },
                    "music": {
                        "id": entry.get('track', ''),
                        "title": entry.get('track', 'Original Sound'),
                        "author": entry.get('artist', '') or entry.get('uploader', ''),
                        "original": True
                    },
                    "hashtags": self._extract_hashtags(entry.get('description', ''))
                }
                
                videos_data.append(video_info)
            
            return {
                "videos": videos_data,
                "count": len(videos_data),
                "hasMore": False,  # We're limiting to 6 videos
                "cursor": cursor + len(videos_data)
            }
            
        except Exception as e:
            logger.error(f"Error fetching videos for {username}: {str(e)}")
            # Don't re-raise if it's a specific video ID error - allow bulk processing to continue
            if "Could not fetch videos for" in str(e) and username.isdigit():
                logger.warning(f"Single video fetch failed for ID {username}, this may be due to video unavailability")
                return {
                    "videos": [],
                    "count": 0,
                    "hasMore": False,
                    "cursor": cursor,
                    "error": f"Video {username} is not available"
                }
            raise Exception(f"Failed to fetch videos: {str(e)}")
    
    def _extract_hashtags(self, description: str) -> List[Dict[str, str]]:
        """Extract hashtags from video description."""
        import re
        hashtags = []
        if description:
            # Find all hashtags in the description
            tags = re.findall(r'#(\w+)', description)
            for tag in tags[:5]:  # Limit to first 5 hashtags
                hashtags.append({
                    "id": tag.lower(),
                    "name": tag,
                    "title": tag
                })
        return hashtags
        
    async def get_video_info(self, video_id: str) -> Dict[str, Any]:
        """
        Fetch detailed information about a specific video using yt-dlp.
        
        Args:
            video_id: TikTok video ID
            
        Returns:
            Dictionary containing video information
        """
        try:
            # TikTok video URL
            url = f'https://www.tiktok.com/@_/video/{video_id}'
            
            # Run extraction in thread pool
            loop = asyncio.get_event_loop()
            
            def extract_info():
                with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                    try:
                        info = ydl.extract_info(url, download=False)
                        return info
                    except Exception as e:
                        logger.error(f"yt-dlp extraction error: {str(e)}")
                        return None
                        
            info_dict = await loop.run_in_executor(None, extract_info)
            
            if not info_dict:
                raise Exception(f"Could not fetch video info for {video_id}")
            
            # Extract video information
            return {
                "videoId": info_dict.get('id', video_id),
                "title": info_dict.get('title', '') or info_dict.get('description', ''),
                "createTime": info_dict.get('timestamp', 0),
                "duration": info_dict.get('duration', 0),
                "thumbnail": info_dict.get('thumbnail', ''),
                "stats": {
                    "views": info_dict.get('view_count', 0),
                    "likes": info_dict.get('like_count', 0),
                    "comments": info_dict.get('comment_count', 0),
                    "shares": info_dict.get('repost_count', 0),
                    "saves": 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching video info for {video_id}: {str(e)}")
            raise Exception(f"Failed to fetch video info: {str(e)}")
    
    async def get_video_preview(self, video_id: str) -> Dict[str, Any]:
        """
        Get video preview information including streaming URL without downloading.
        
        Args:
            video_id: TikTok video ID
            
        Returns:
            Dictionary containing video preview data with streaming URL
        """
        try:
            # TikTok video URL
            url = f'https://www.tiktok.com/@_/video/{video_id}'
            
            # Create yt-dlp instance with options for extraction only
            ydl_opts = {
                **self.ydl_opts,
                'format': 'best[ext=mp4]/best',  # Prefer MP4 format
                'quiet': True,
                'no_warnings': True,
            }
            
            # Run extraction in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            def extract_info():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    try:
                        info = ydl.extract_info(url, download=False)
                        return info
                    except Exception as e:
                        logger.error(f"yt-dlp extraction error: {str(e)}")
                        return None
                        
            info_dict = await loop.run_in_executor(None, extract_info)
            
            if not info_dict:
                raise Exception(f"Could not fetch video info for {video_id}")
            
            # Extract preview information
            # Use proxy URL instead of direct TikTok URL to avoid CORS issues
            preview_data = {
                "videoId": video_id,
                "title": info_dict.get('title', '') or info_dict.get('description', ''),
                "description": info_dict.get('description', ''),
                "duration": info_dict.get('duration', 0),
                "thumbnail": info_dict.get('thumbnail', ''),
                "streamUrl": f"{os.getenv('BACKEND_BASE_URL', 'http://localhost:8001')}/api/public/tiktok/stream/{video_id}",  # Use absolute stream endpoint
                "fallbackUrl": f"{os.getenv('BACKEND_BASE_URL', 'http://localhost:8001')}/api/public/tiktok/download/{video_id}",  # Absolute fallback download endpoint                "directUrl": info_dict.get('url', ''),  # Keep direct URL for backend use
                "format": info_dict.get('ext', 'mp4'),
                "width": info_dict.get('width', 0),
                "height": info_dict.get('height', 0),
                "uploader": info_dict.get('uploader', ''),
                "uploaderId": info_dict.get('uploader_id', ''),
                "stats": {
                    "views": info_dict.get('view_count', 0),
                    "likes": info_dict.get('like_count', 0),
                    "comments": info_dict.get('comment_count', 0),
                    "shares": info_dict.get('repost_count', 0),
                },
                "timestamp": info_dict.get('timestamp', 0),
                "hashtags": self._extract_hashtags(info_dict.get('description', ''))
            }
            
            logger.info(f"Successfully extracted preview for video {video_id}")
            return preview_data
            
        except Exception as e:
            logger.error(f"Error getting video preview for {video_id}: {str(e)}")
            raise Exception(f"Failed to get video preview: {str(e)}")
    
    async def download_video_bytes(self, video_id: str) -> bytes:
        """
        Download video bytes from TikTok using yt-dlp.
        
        Args:
            video_id: TikTok video ID
            
        Returns:
            Video bytes
        """
        try:
            # TikTok video URL
            url = f'https://www.tiktok.com/@_/video/{video_id}'
            
            # Create temporary file for download
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_file:
                tmp_path = tmp_file.name
            
            # Configure yt-dlp for downloading
            ydl_opts = {
                **self.ydl_opts,
                'outtmpl': tmp_path,
                'format': 'best[ext=mp4]/best',
                'verbose': True,  # Enable verbose logging to debug issues
                'overwrites': True,  # Force overwrite existing files
                'no_overwrites': False,
                'continuedl': False,  # Don't continue partial downloads
            }
            
            # Run download in thread pool
            loop = asyncio.get_event_loop()
            
            def download_video():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    try:
                        logger.info(f"Starting download for URL: {url}")
                        result = ydl.download([url])
                        logger.info(f"Download result: {result}")
                        
                        # Check if the file was created
                        if os.path.exists(tmp_path):
                            size = os.path.getsize(tmp_path)
                            logger.info(f"Downloaded file exists at {tmp_path}, size: {size} bytes")
                        else:
                            logger.error(f"Downloaded file not found at {tmp_path}")
                            
                        return True
                    except Exception as e:
                        error_msg = str(e)
                        logger.error(f"yt-dlp download error for {url}: {error_msg}")
                        logger.error(f"Error type: {type(e).__name__}")
                        
                        # Check for DNS resolution errors
                        if "Failed to resolve" in error_msg or "Temporary failure in name resolution" in error_msg:
                            logger.error(f"DNS resolution failed for video {video_id}. The video URL may be expired or region-locked.")
                        
                        return False
                        
            success = await loop.run_in_executor(None, download_video)
            
            if not success:
                raise Exception(f"Could not download video {video_id}")
            
            # Read the downloaded file
            try:
                # Check if file exists and has content
                if not os.path.exists(tmp_path):
                    raise Exception(f"Downloaded file not found at {tmp_path}")
                
                file_size = os.path.getsize(tmp_path)
                if file_size == 0:
                    raise Exception(f"Downloaded file is empty (0 bytes)")
                
                logger.info(f"Downloaded video {video_id}, size: {file_size} bytes")
                
                async with aiofiles.open(tmp_path, 'rb') as f:
                    video_bytes = await f.read()
                
                if len(video_bytes) == 0:
                    raise Exception(f"Failed to read video bytes from file")
                    
                return video_bytes
            finally:
                # Clean up temporary file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            
        except Exception as e:
            logger.error(f"Error downloading video {video_id}: {str(e)}")
            raise Exception(f"Failed to download video: {str(e)}")
    
    async def download_video_preview(self, video_id: str, duration_limit: int = 15) -> bytes:
        """
        Download a preview of the video (limited duration) using yt-dlp.
        
        Args:
            video_id: TikTok video ID
            duration_limit: Maximum duration in seconds (default 15)
            
        Returns:
            Video preview bytes
        """
        try:
            # For now, use the full download method
            # In a production environment, you would use ffmpeg to trim the video
            # or use yt-dlp's download_ranges option when it's available for TikTok
            
            # Download the full video first
            video_bytes = await self.download_video_bytes(video_id)
            
            # TODO: Implement video trimming using ffmpeg to limit duration
            # For now, return the full video (TikTok videos are usually short anyway)
            logger.info(f"Downloaded preview for video {video_id}, size: {len(video_bytes)} bytes")
            
            return video_bytes
            
        except Exception as e:
            logger.error(f"Error downloading video preview {video_id}: {str(e)}")
            raise Exception(f"Failed to download video preview: {str(e)}")
    
    async def get_video_stream_url(self, video_id: str) -> str:
        """
        Get the direct streaming URL for a video.
        Used by the streaming proxy endpoint.
        
        Args:
            video_id: TikTok video ID
            
        Returns:
            Direct video URL for streaming
        """
        try:
            # TikTok video URL
            url = f'https://www.tiktok.com/@_/video/{video_id}'
            
            # Use minimal options for faster extraction
            ydl_opts = {
                **self.ydl_opts,
                'format': 'best[ext=mp4]/best',
                'quiet': True,
                'no_warnings': True,
            }
            
            # Run extraction in thread pool
            loop = asyncio.get_event_loop()
            
            def extract_info():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    try:
                        info = ydl.extract_info(url, download=False)
                        return info
                    except Exception as e:
                        logger.error(f"yt-dlp extraction error: {str(e)}")
                        return None
                        
            info_dict = await loop.run_in_executor(None, extract_info)
            
            if not info_dict:
                raise Exception(f"Could not fetch video info for {video_id}")
            
            # Return the direct URL
            stream_url = info_dict.get('url', '')
            if not stream_url:
                raise Exception(f"No stream URL found for video {video_id}")
                
            return stream_url
            
        except Exception as e:
            logger.error(f"Error getting video stream URL for {video_id}: {str(e)}")
            raise Exception(f"Failed to get video stream URL: {str(e)}")
    
    async def download_audio_bytes(self, video_id: str, format: str = 'mp3') -> bytes:
        """
        Download audio only from TikTok video using yt-dlp.
        
        Args:
            video_id: TikTok video ID
            format: Audio format (mp3, m4a, etc.)
            
        Returns:
            Audio bytes
        """
        try:
            # TikTok video URL
            url = f'https://www.tiktok.com/@_/video/{video_id}'
            
            # Create temporary file for download
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as tmp_file:
                tmp_path = tmp_file.name
            
            # Configure yt-dlp for audio extraction
            ydl_opts = {
                **self.ydl_opts,
                'format': 'bestaudio/best',  # Download best audio quality
                'outtmpl': tmp_path.replace(f'.{format}', '.%(ext)s'),  # Let yt-dlp handle extension
                'verbose': True,
                'overwrites': True,
                'no_overwrites': False,
                'continuedl': False,
                # Post-processor for audio extraction if ffmpeg is available
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': format,
                    'preferredquality': '192',
                }] if format != 'original' else [],
                'prefer_ffmpeg': True,
            }
            
            # Try with audio extraction first, fallback to video download
            loop = asyncio.get_event_loop()
            
            def download_audio():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    try:
                        logger.info(f"Starting audio download for URL: {url}")
                        result = ydl.download([url])
                        logger.info(f"Audio download result: {result}")
                        
                        # Find the downloaded file (might have different extension)
                        import glob
                        pattern = tmp_path.replace(f'.{format}', '.*')
                        files = glob.glob(pattern)
                        if files:
                            actual_path = files[0]
                            logger.info(f"Downloaded audio file: {actual_path}")
                            return actual_path
                        else:
                            logger.error(f"No files found matching pattern: {pattern}")
                            return None
                    except Exception as e:
                        logger.error(f"yt-dlp audio download error: {str(e)}")
                        return None
                        
            downloaded_path = await loop.run_in_executor(None, download_audio)
            
            if not downloaded_path:
                # Fallback: Download video and return as is
                logger.warning(f"Audio extraction failed, downloading full video for {video_id}")
                video_bytes = await self.download_video_bytes(video_id)
                return video_bytes
            
            # Read the downloaded file
            try:
                if not os.path.exists(downloaded_path):
                    raise Exception(f"Downloaded file not found at {downloaded_path}")
                
                file_size = os.path.getsize(downloaded_path)
                if file_size == 0:
                    raise Exception(f"Downloaded file is empty (0 bytes)")
                
                logger.info(f"Downloaded audio {video_id}, size: {file_size} bytes")
                
                async with aiofiles.open(downloaded_path, 'rb') as f:
                    audio_bytes = await f.read()
                
                if len(audio_bytes) == 0:
                    raise Exception(f"Failed to read audio bytes from file")
                    
                return audio_bytes
            finally:
                # Clean up temporary file
                if os.path.exists(downloaded_path):
                    os.unlink(downloaded_path)
                # Also clean up base path if different
                if os.path.exists(tmp_path) and tmp_path != downloaded_path:
                    os.unlink(tmp_path)
            
        except Exception as e:
            logger.error(f"Error downloading audio {video_id}: {str(e)}")
            raise Exception(f"Failed to download audio: {str(e)}")
    
    async def get_audio_info(self, video_id: str) -> Dict[str, Any]:
        """
        Get audio stream information for a video.
        
        Args:
            video_id: TikTok video ID
            
        Returns:
            Dictionary containing audio stream information
        """
        try:
            # TikTok video URL
            url = f'https://www.tiktok.com/@_/video/{video_id}'
            
            # Extract info without downloading
            loop = asyncio.get_event_loop()
            
            def extract_info():
                with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                    try:
                        info = ydl.extract_info(url, download=False)
                        return info
                    except Exception as e:
                        logger.error(f"yt-dlp extraction error: {str(e)}")
                        return None
                        
            info_dict = await loop.run_in_executor(None, extract_info)
            
            if not info_dict:
                raise Exception(f"Could not fetch audio info for {video_id}")
            
            # Extract audio-specific information
            audio_info = {
                "videoId": video_id,
                "duration": info_dict.get('duration', 0),
                "hasAudio": True,  # TikTok videos always have audio
                "audioCodec": info_dict.get('acodec', 'unknown'),
                "audioBitrate": info_dict.get('abr', 0),
                "audioSampleRate": info_dict.get('asr', 0),
                "format": info_dict.get('ext', 'mp4'),
                "filesize": info_dict.get('filesize', 0),
            }
            
            # Try to find audio-only formats
            formats = info_dict.get('formats', [])
            audio_formats = [f for f in formats if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
            
            if audio_formats:
                # Use best audio-only format
                best_audio = max(audio_formats, key=lambda f: f.get('abr', 0) or 0)
                audio_info.update({
                    "audioOnlyUrl": best_audio.get('url'),
                    "audioOnlyFormat": best_audio.get('ext', 'unknown'),
                    "audioOnlySize": best_audio.get('filesize', 0),
                })
            
            return audio_info
            
        except Exception as e:
            logger.error(f"Error getting audio info for {video_id}: {str(e)}")
            raise Exception(f"Failed to get audio info: {str(e)}")
    
    async def close(self):
        """Close the service (no cleanup needed for yt-dlp)."""
        pass


# Singleton instance
_tiktok_service: Optional[TikTokService] = None


def get_tiktok_service() -> TikTokService:
    """
    Get or create TikTok service instance.
        
    Returns:
        TikTokService instance
    """
    global _tiktok_service
    
    if _tiktok_service is None:
        _tiktok_service = TikTokService()
    
    return _tiktok_service