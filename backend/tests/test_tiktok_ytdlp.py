#!/usr/bin/env python3
"""
Test script for TikTok service using yt-dlp
Tests user info and video fetching functionality
"""

import asyncio
import json
from src.services.tiktok_service import TikTokService

async def test_tiktok_service():
    """Test TikTok service functionality"""
    service = TikTokService()
    
    # Test accounts
    test_usernames = [
        "zachking",      # Popular creator
        "khaby.lame",    # Another popular creator
        # "invalid_user_12345"  # Invalid user for error testing
    ]
    
    for username in test_usernames:
        print(f"\n{'='*60}")
        print(f"Testing TikTok user: @{username}")
        print('='*60)
        
        try:
            # Test 1: Get user info
            print("\n1. Fetching user info...")
            user_info = await service.get_user_info(username)
            print(f"✓ User info retrieved successfully")
            print(f"  - Username: {user_info.get('username')}")
            print(f"  - Nickname: {user_info.get('nickname')}")
            print(f"  - User ID: {user_info.get('userId')}")
            print(f"  - Avatar: {user_info.get('avatar', 'N/A')[:50]}...")
            print(f"  - Video Count: {user_info.get('videoCount', 0)}")
            
            # Test 2: Get user videos
            print("\n2. Fetching user videos (max 6)...")
            videos_response = await service.get_user_videos(username)
            videos = videos_response.get('videos', [])
            
            print(f"✓ Retrieved {len(videos)} videos")
            
            for i, video in enumerate(videos, 1):
                print(f"\n  Video {i}:")
                print(f"    - ID: {video.get('videoId')}")
                print(f"    - Title: {video.get('title', 'N/A')[:50]}...")
                print(f"    - Duration: {video.get('duration', 0)}s")
                print(f"    - Views: {video.get('stats', {}).get('views', 0):,}")
                print(f"    - Likes: {video.get('stats', {}).get('likes', 0):,}")
                print(f"    - Comments: {video.get('stats', {}).get('comments', 0):,}")
                print(f"    - Thumbnail: {video.get('thumbnail', 'N/A')[:50]}...")
                
            # Test 3: Get specific video info (if we have videos)
            if videos:
                print("\n3. Testing specific video info...")
                first_video_id = videos[0].get('videoId')
                if first_video_id:
                    video_info = await service.get_video_info(first_video_id)
                    print(f"✓ Video info retrieved for ID: {first_video_id}")
                    print(f"  - Title: {video_info.get('title', 'N/A')[:50]}...")
                    print(f"  - Duration: {video_info.get('duration', 0)}s")
                    
        except Exception as e:
            print(f"✗ Error testing {username}: {str(e)}")
            
    await service.close()
    print(f"\n{'='*60}")
    print("Test completed!")
    print('='*60)

async def test_api_endpoints():
    """Test the API endpoints directly"""
    import httpx
    
    print("\n" + "="*60)
    print("Testing API Endpoints")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        base_url = "http://localhost:8000"
        
        # Test TikTok user endpoint
        username = "zachking"
        print(f"\nTesting /api/public/tiktok/user endpoint with @{username}")
        
        try:
            response = await client.post(
                f"{base_url}/api/public/tiktok/user",
                json={
                    "job_id": "test-job-1",
                    "username": username,
                    "user_id": "test-user"
                }
            )
            print(f"Response status: {response.status_code}")
            if response.status_code == 200:
                print("✓ User endpoint working")
            else:
                print(f"✗ Error: {response.text}")
                
        except Exception as e:
            print(f"✗ Error calling API: {e}")

if __name__ == "__main__":
    print("TikTok Service Test (using yt-dlp)")
    print("==================================")
    
    # Run the tests
    asyncio.run(test_tiktok_service())
    
    # Optionally test API endpoints
    # asyncio.run(test_api_endpoints())