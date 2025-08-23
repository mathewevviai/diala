"""
Instagram Service - Wrapper for Instagram API functionality using yt-dlp.

This module provides a service layer for interacting with Instagram
to fetch user information, posts, and download content.
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


class InstagramService:
    """Service for interacting with Instagram using yt-dlp."""
    
    def __init__(self):
        """
        Initialize Instagram service with yt-dlp.
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
            'http_headers': {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        }
        
    def _extract_user_info_from_data(self, info_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user information from yt-dlp info."""
        # Get username and basic info
        username = info_dict.get('uploader_id') or info_dict.get('channel_id') or ''
        uploader = info_dict.get('uploader') or info_dict.get('channel') or username
        
        # Extract from URL if needed
        webpage_url = info_dict.get('webpage_url', '')
        if not username and 'instagram.com' in webpage_url:
            import re
            match = re.search(r'instagram\.com/([^/?]+)', webpage_url)
            if match:
                username = match.group(1)
        
        # Get description/bio
        description = info_dict.get('description', '')
        
        # Get thumbnail/avatar
        thumbnail = info_dict.get('thumbnail') or ''
        
        # Try to get follower count and post count from entries
        entries = info_dict.get('entries', [])
        follower_count = 0
        post_count = len(entries) if entries else 0
        
        # If we have entries, try to extract more info from first post
        if entries and len(entries) > 0:
            first_entry = entries[0]
            if isinstance(first_entry, dict):
                # Try to get uploader info from post
                if not uploader and first_entry.get('uploader'):
                    uploader = first_entry.get('uploader')
                if not username and first_entry.get('uploader_id'):
                    username = first_entry.get('uploader_id')
                if not thumbnail and first_entry.get('thumbnail'):
                    thumbnail = first_entry.get('thumbnail')
        
        # Generate fallback avatar if none found
        if not thumbnail and (uploader or username):
            display_name = uploader or username
            thumbnail = f"https://ui-avatars.com/api/?name={display_name}&size=512&background=E1306C&color=ffffff&bold=true"
        
        logger.info(f"Extracted Instagram user info - username: {username}, name: {uploader}")
        
        return {
            'username': username or 'unknown',
            'fullName': uploader or username or 'Unknown User',
            'profilePicture': thumbnail,
            'bio': description[:150] if description else '',
            'isVerified': False,  # Not available via yt-dlp
            'followerCount': follower_count,
            'followingCount': 0,  # Not available via yt-dlp
            'postCount': post_count,
            'isPrivate': False,  # If we can access, it's not private
            'profileUrl': webpage_url or f"https://www.instagram.com/{username}/"
        }
    
    async def get_user_info(self, username: str) -> Dict[str, Any]:
        """
        Fetch user information from Instagram using yt-dlp.
        
        Args:
            username: Instagram username (without @) or profile URL
            
        Returns:
            Dictionary containing user information
            
        Raises:
            Exception: If user not found or API error
        """
        try:
            # Extract username from URL if provided
            if username.startswith('http'):
                import re
                match = re.search(r'instagram\.com/([^/?]+)', username)
                if match:
                    username = match.group(1)
                else:
                    raise ValueError(f"Invalid Instagram URL: {username}")
            
            # Clean username
            username = username.replace('@', '').strip()
            
            # Instagram user URL
            url = f'https://www.instagram.com/{username}/'
            
            logger.info(f"Fetching Instagram user info for: {username}")
            
            # Create yt-dlp instance with options
            ydl_opts = {
                **self.ydl_opts,
                'extract_flat': 'in_playlist',  # Get list of posts without full extraction
                'playlistend': 12,  # Get some posts to extract user info
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
            
            # Log available data
            logger.info(f"Instagram user data keys: {list(info_dict.keys())}")
            
            # Extract user information from the data
            user_info = self._extract_user_info_from_data(info_dict)
            
            # Ensure username matches input
            user_info['username'] = username
            
            return user_info
            
        except Exception as e:
            logger.error(f"Error fetching Instagram user info for {username}: {str(e)}")
            raise Exception(f"Failed to fetch user info: {str(e)}")
    
    async def get_user_posts(
        self, 
        username: str, 
        count: int = 6,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch user's posts from Instagram using yt-dlp.
        
        Args:
            username: Instagram username
            count: Number of posts to fetch (default 6, max 6)
            cursor: Pagination cursor (not used with yt-dlp)
            
        Returns:
            Dictionary containing posts and pagination info
        """
        try:
            # Clean username
            username = username.replace('@', '').strip()
            
            # Limit count to 6
            count = min(count, 6)
            
            # Instagram user URL
            url = f'https://www.instagram.com/{username}/'
            
            logger.info(f"Fetching Instagram posts for: {username}, count: {count}")
            
            # Create yt-dlp instance with options
            ydl_opts = {
                **self.ydl_opts,
                'extract_flat': False,  # We want full post extraction
                'playlist_items': f'1-{count}',  # Limit to first N posts
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
                raise Exception(f"Could not fetch posts for {username}")
            
            posts_data = []
            
            # Process entries (posts)
            entries = info_dict.get('entries', [])
            logger.info(f"Found {len(entries)} Instagram posts")
            
            for entry in entries[:count]:
                if not entry:
                    continue
                    
                # Determine media type
                media_type = 'photo'  # Default
                if entry.get('duration'):
                    media_type = 'video'
                elif 'reel' in entry.get('webpage_url', '').lower():
                    media_type = 'reel'
                
                # Extract post information
                post_info = {
                    "postId": entry.get('id', ''),
                    "shortcode": entry.get('display_id') or entry.get('id', ''),
                    "caption": entry.get('description', '') or entry.get('title', ''),
                    "mediaType": media_type,
                    "mediaUrl": entry.get('url', '') or entry.get('webpage_url', ''),
                    "thumbnailUrl": entry.get('thumbnail', ''),
                    "timestamp": entry.get('timestamp', 0),
                    "likeCount": entry.get('like_count', 0),
                    "commentCount": entry.get('comment_count', 0),
                    "viewCount": entry.get('view_count', 0) if media_type in ['video', 'reel'] else None,
                    "duration": entry.get('duration', 0) if media_type in ['video', 'reel'] else None,
                    "isVideo": media_type in ['video', 'reel'],
                    "hashtags": self._extract_hashtags(entry.get('description', ''))
                }
                
                posts_data.append(post_info)
            
            return {
                "posts": posts_data,
                "count": len(posts_data),
                "hasMore": len(entries) > count,  # Simplified pagination
                "nextCursor": None  # yt-dlp doesn't support cursor-based pagination
            }
            
        except Exception as e:
            logger.error(f"Error fetching posts for {username}: {str(e)}")
            raise Exception(f"Failed to fetch posts: {str(e)}")
    
    def _extract_hashtags(self, caption: str) -> List[str]:
        """Extract hashtags from post caption."""
        import re
        hashtags = []
        if caption:
            # Find all hashtags in the caption
            tags = re.findall(r'#(\w+)', caption)
            hashtags = tags[:10]  # Limit to first 10 hashtags
        return hashtags
        
    async def get_post_info(self, post_id: str) -> Dict[str, Any]:
        """
        Fetch detailed information about a specific post using yt-dlp.
        
        Args:
            post_id: Instagram post ID or shortcode
            
        Returns:
            Dictionary containing post information
        """
        try:
            # Instagram post URL - try both formats
            if len(post_id) > 15:  # Likely a full ID
                url = f'https://www.instagram.com/p/{post_id[:11]}/'  # Use shortcode portion
            else:
                url = f'https://www.instagram.com/p/{post_id}/'
            
            logger.info(f"Fetching Instagram post info for: {post_id}")
            
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
                raise Exception(f"Could not fetch post info for {post_id}")
            
            # Determine media type
            media_type = 'photo'
            if info_dict.get('duration'):
                media_type = 'video'
            elif 'reel' in info_dict.get('webpage_url', '').lower():
                media_type = 'reel'
            
            # Extract post information
            return {
                "postId": info_dict.get('id', post_id),
                "shortcode": info_dict.get('display_id') or post_id,
                "caption": info_dict.get('description', '') or info_dict.get('title', ''),
                "mediaType": media_type,
                "mediaUrl": info_dict.get('url', ''),
                "thumbnailUrl": info_dict.get('thumbnail', ''),
                "timestamp": info_dict.get('timestamp', 0),
                "likeCount": info_dict.get('like_count', 0),
                "commentCount": info_dict.get('comment_count', 0),
                "viewCount": info_dict.get('view_count', 0) if media_type in ['video', 'reel'] else None,
                "duration": info_dict.get('duration', 0) if media_type in ['video', 'reel'] else None,
                "uploader": info_dict.get('uploader', ''),
                "uploaderId": info_dict.get('uploader_id', '')
            }
            
        except Exception as e:
            logger.error(f"Error fetching post info for {post_id}: {str(e)}")
            raise Exception(f"Failed to fetch post info: {str(e)}")
    
    async def download_media_bytes(self, post_id: str) -> bytes:
        """
        Download media bytes from Instagram using yt-dlp.
        
        Args:
            post_id: Instagram post ID or shortcode
            
        Returns:
            Media bytes
        """
        try:
            # Instagram post URL
            if len(post_id) > 15:  # Likely a full ID
                url = f'https://www.instagram.com/p/{post_id[:11]}/'
            else:
                url = f'https://www.instagram.com/p/{post_id}/'
            
            logger.info(f"Download requested for Instagram post {post_id}")
            
            # For now, return a placeholder
            # In production, you would implement actual download using yt-dlp
            # with proper file handling and format selection
            
            return f"Instagram media URL: {url}".encode()
            
        except Exception as e:
            logger.error(f"Error downloading media {post_id}: {str(e)}")
            raise Exception(f"Failed to download media: {str(e)}")
    
    async def close(self):
        """Close the service (no cleanup needed for yt-dlp)."""
        pass


# Singleton instance
_instagram_service: Optional[InstagramService] = None


def get_instagram_service() -> InstagramService:
    """
    Get or create Instagram service instance.
        
    Returns:
        InstagramService instance
    """
    global _instagram_service
    
    if _instagram_service is None:
        _instagram_service = InstagramService()
    
    return _instagram_service