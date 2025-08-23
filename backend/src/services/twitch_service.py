"""
Twitch Service - Wrapper for Twitch API functionality using yt-dlp.

This module provides a service layer for interacting with Twitch
to fetch channel information, videos, and download content.
"""

from typing import Optional, List, Dict, Any
import asyncio
import os
import logging
from datetime import datetime
import json
import yt_dlp
from pprint import pformat

logger = logging.getLogger(__name__)


class TwitchService:
    """Service for interacting with Twitch using yt-dlp."""
    
    def __init__(self):
        """
        Initialize Twitch service with yt-dlp.
        """
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'force_generic_extractor': False,
            'ignoreerrors': True,
            'no_color': True,
            'no_check_certificate': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
        
    def _extract_channel_info_from_data(self, info_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Extract channel information from yt-dlp info."""
        # Get username and basic info
        username = info_dict.get('uploader_id') or info_dict.get('channel_id') or ''
        uploader = info_dict.get('uploader') or info_dict.get('channel') or username
        
        # Extract from URL if needed
        webpage_url = info_dict.get('webpage_url', '')
        if not username and 'twitch.tv' in webpage_url:
            import re
            match = re.search(r'twitch\.tv/([^/?]+)', webpage_url)
            if match:
                username = match.group(1)
        
        # Get description/bio
        description = info_dict.get('description', '')
        
        # Get thumbnail/avatar
        thumbnail = info_dict.get('thumbnail') or ''
        
        # Try to get follower count and video count from entries
        entries = info_dict.get('entries', [])
        follower_count = 0
        video_count = len(entries) if entries else 0
        
        # If we have entries, try to extract more info from first video
        if entries and len(entries) > 0:
            first_entry = entries[0]
            if isinstance(first_entry, dict):
                # Try to get uploader info from video
                if not uploader and first_entry.get('uploader'):
                    uploader = first_entry.get('uploader')
                if not username and first_entry.get('uploader_id'):
                    username = first_entry.get('uploader_id')
                if not thumbnail and first_entry.get('uploader_thumbnail'):
                    thumbnail = first_entry.get('uploader_thumbnail')
                    
                # Try to get follower count if available
                if 'channel_follower_count' in first_entry:
                    follower_count = first_entry.get('channel_follower_count', 0)
        
        # Get live status - check if channel is currently live
        is_live = info_dict.get('is_live', False)
        
        # Generate fallback avatar if none found
        if not thumbnail and (uploader or username):
            display_name = uploader or username
            thumbnail = f"https://ui-avatars.com/api/?name={display_name}&size=512&background=9146FF&color=ffffff&bold=true"
        
        logger.info(f"Extracted Twitch channel info - username: {username}, name: {uploader}")
        
        return {
            'username': username or 'unknown',
            'displayName': uploader or username or 'Unknown Channel',
            'profileImage': thumbnail,
            'bio': description[:200] if description else '',
            'isVerified': False,  # Not available via yt-dlp
            'isPartner': False,  # Not available via yt-dlp
            'followerCount': follower_count,
            'videoCount': video_count,
            'isLive': is_live,
            'channelUrl': webpage_url or f"https://www.twitch.tv/{username}"
        }
    
    async def get_channel_info(self, username: str) -> Dict[str, Any]:
        """
        Fetch channel information from Twitch using yt-dlp.
        
        Args:
            username: Twitch username or channel URL
            
        Returns:
            Dictionary containing channel information
            
        Raises:
            Exception: If channel not found or API error
        """
        try:
            # Extract username from URL if provided
            if username.startswith('http'):
                import re
                match = re.search(r'twitch\.tv/([^/?]+)', username)
                if match:
                    username = match.group(1)
                else:
                    raise ValueError(f"Invalid Twitch URL: {username}")
            
            # Clean username
            username = username.strip().lower()
            
            # Twitch channel URL - use videos page to get channel info
            url = f'https://www.twitch.tv/{username}/videos'
            
            logger.info(f"Fetching Twitch channel info for: {username}")
            
            # Create yt-dlp instance with options
            ydl_opts = {
                **self.ydl_opts,
                'extract_flat': 'in_playlist',  # Get list of videos without full extraction
                'playlistend': 12,  # Get some videos to extract channel info
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
                raise Exception(f"Could not fetch channel info for {username}")
            
            # Log available data
            logger.info(f"Twitch channel data keys: {list(info_dict.keys())}")
            
            # Extract channel information from the data
            channel_info = self._extract_channel_info_from_data(info_dict)
            
            # Ensure username matches input
            channel_info['username'] = username
            
            return channel_info
            
        except Exception as e:
            logger.error(f"Error fetching Twitch channel info for {username}: {str(e)}")
            raise Exception(f"Failed to fetch channel info: {str(e)}")
    
    async def get_channel_videos(
        self, 
        username: str, 
        count: int = 6,
        video_type: str = "archive"  # archive (VODs), highlight, upload, past_premiere
    ) -> Dict[str, Any]:
        """
        Fetch channel's videos from Twitch using yt-dlp.
        
        Args:
            username: Twitch username
            count: Number of videos to fetch (default 6, max 6)
            video_type: Type of videos to fetch (archive/highlight/upload)
            
        Returns:
            Dictionary containing videos and pagination info
        """
        try:
            # Clean username
            username = username.strip().lower()
            
            # Limit count to 6
            count = min(count, 6)
            
            # Twitch videos URL with filter
            if video_type == "clips":
                url = f'https://www.twitch.tv/{username}/clips'
            else:
                url = f'https://www.twitch.tv/{username}/videos?filter={video_type}'
            
            logger.info(f"Fetching Twitch videos for: {username}, type: {video_type}, count: {count}")
            
            # Create yt-dlp instance with options
            ydl_opts = {
                **self.ydl_opts,
                'extract_flat': False,  # We want full video extraction
                'playlist_items': f'1-{count}',  # Limit to first N videos
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
                raise Exception(f"Could not fetch videos for {username}")
            
            videos_data = []
            
            # Process entries (videos)
            entries = info_dict.get('entries', [])
            logger.info(f"Found {len(entries)} Twitch videos")
            
            for entry in entries[:count]:
                if not entry:
                    continue
                    
                # Determine video type
                if video_type == "clips":
                    v_type = "clip"
                elif 'highlight' in entry.get('title', '').lower():
                    v_type = "highlight"
                else:
                    v_type = "vod"
                
                # Extract video information
                video_info = {
                    "videoId": entry.get('id', ''),
                    "title": entry.get('title', ''),
                    "thumbnail": entry.get('thumbnail', ''),
                    "duration": entry.get('duration', 0),
                    "viewCount": entry.get('view_count', 0),
                    "createdAt": entry.get('timestamp', 0),
                    "url": entry.get('webpage_url', '') or entry.get('url', ''),
                    "type": v_type,
                    "game": entry.get('game', ''),  # Game/category if available
                    "language": entry.get('language', 'en'),
                    "description": entry.get('description', '')[:200] if entry.get('description') else ''
                }
                
                videos_data.append(video_info)
            
            return {
                "videos": videos_data,
                "count": len(videos_data),
                "videoType": video_type,
                "hasMore": len(entries) > count  # Simplified pagination
            }
            
        except Exception as e:
            logger.error(f"Error fetching videos for {username}: {str(e)}")
            raise Exception(f"Failed to fetch videos: {str(e)}")
        
    async def get_video_info(self, video_id: str) -> Dict[str, Any]:
        """
        Fetch detailed information about a specific video using yt-dlp.
        
        Args:
            video_id: Twitch video ID
            
        Returns:
            Dictionary containing video information
        """
        try:
            # Twitch video URL
            url = f'https://www.twitch.tv/videos/{video_id}'
            
            logger.info(f"Fetching Twitch video info for: {video_id}")
            
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
                "title": info_dict.get('title', ''),
                "thumbnail": info_dict.get('thumbnail', ''),
                "duration": info_dict.get('duration', 0),
                "viewCount": info_dict.get('view_count', 0),
                "createdAt": info_dict.get('timestamp', 0),
                "uploader": info_dict.get('uploader', ''),
                "uploaderId": info_dict.get('uploader_id', ''),
                "game": info_dict.get('game', ''),
                "description": info_dict.get('description', ''),
                "url": info_dict.get('webpage_url', '')
            }
            
        except Exception as e:
            logger.error(f"Error fetching video info for {video_id}: {str(e)}")
            raise Exception(f"Failed to fetch video info: {str(e)}")
    
    async def download_video_bytes(self, video_id: str) -> bytes:
        """
        Download video bytes from Twitch using yt-dlp.
        
        Args:
            video_id: Twitch video ID
            
        Returns:
            Video bytes
        """
        try:
            # Twitch video URL
            url = f'https://www.twitch.tv/videos/{video_id}'
            
            logger.info(f"Download requested for Twitch video {video_id}")
            
            # For now, return a placeholder
            # In production, you would implement actual download using yt-dlp
            # with proper file handling and quality selection
            
            return f"Twitch video URL: {url}".encode()
            
        except Exception as e:
            logger.error(f"Error downloading video {video_id}: {str(e)}")
            raise Exception(f"Failed to download video: {str(e)}")
    
    async def close(self):
        """Close the service (no cleanup needed for yt-dlp)."""
        pass


# Singleton instance
_twitch_service: Optional[TwitchService] = None


def get_twitch_service() -> TwitchService:
    """
    Get or create Twitch service instance.
        
    Returns:
        TwitchService instance
    """
    global _twitch_service
    
    if _twitch_service is None:
        _twitch_service = TwitchService()
    
    return _twitch_service