#!/usr/bin/env python3
"""
Test script for TikTok video preview functionality.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.services.tiktok_service import get_tiktok_service


async def test_video_preview():
    """Test the video preview functionality."""
    print("Testing TikTok Video Preview Functionality\n")
    print("=" * 50)
    
    # Get TikTok service
    service = get_tiktok_service()
    
    # Test video IDs (you can replace these with actual TikTok video IDs)
    test_video_ids = [
        "7274327037519932715",  # Example video ID
    ]
    
    for video_id in test_video_ids:
        print(f"\nTesting video ID: {video_id}")
        print("-" * 30)
        
        try:
            # Get video preview
            preview = await service.get_video_preview(video_id)
            
            # Display results
            print(f"Title: {preview['title']}")
            print(f"Duration: {preview['duration']} seconds")
            print(f"Resolution: {preview['width']}x{preview['height']}")
            print(f"Format: {preview['format']}")
            print(f"Uploader: {preview['uploader']}")
            print(f"Views: {preview['stats']['views']:,}")
            print(f"Likes: {preview['stats']['likes']:,}")
            print(f"Stream URL: {preview['streamUrl'][:100]}...")
            print(f"Thumbnail: {preview['thumbnail'][:100]}...")
            
        except Exception as e:
            print(f"Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Test completed!")


if __name__ == "__main__":
    asyncio.run(test_video_preview())