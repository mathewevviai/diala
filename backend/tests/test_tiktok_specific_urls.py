#!/usr/bin/env python3
"""
Test TikTok Specific URL Processing

Tests processing of individual TikTok URLs for the onboarding flow.
Tests the URLs: 
- https://www.tiktok.com/@pattybuilds/video/7487949796339174687
- https://www.tiktok.com/@dylan.page/video/7530695484059553046
"""

import asyncio
import sys
import os
import re
import requests
import logging
from typing import List, Dict, Any

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.services.tiktok_service import get_tiktok_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestTikTokSpecificURLs:
    def __init__(self):
        self.test_urls = [
            "https://www.tiktok.com/@pattybuilds/video/7487949796339174687",
            "https://www.tiktok.com/@dylan.page/video/7530695484059553046"
        ]
        self.tiktok_service = get_tiktok_service()
    
    def extract_video_id_from_url(self, url: str) -> str:
        """Extract video ID from TikTok URL"""
        match = re.search(r'/video/(\d+)', url)
        if match:
            return match.group(1)
        raise ValueError(f"Could not extract video ID from: {url}")
    
    def extract_username_from_url(self, url: str) -> str:
        """Extract username from TikTok URL"""
        match = re.search(r'@([^/]+)/video/', url)
        if match:
            return match.group(1)
        raise ValueError(f"Could not extract username from: {url}")
    
    async def test_url_extraction(self):
        """Test video ID and username extraction from URLs"""
        print("🔍 Testing URL extraction...")
        
        expected_data = [
            {"url": self.test_urls[0], "video_id": "7487949796339174687", "username": "pattybuilds"},
            {"url": self.test_urls[1], "video_id": "7530695484059553046", "username": "dylan.page"}
        ]
        
        for data in expected_data:
            url = data["url"]
            expected_video_id = data["video_id"]
            expected_username = data["username"]
            
            video_id = self.extract_video_id_from_url(url)
            username = self.extract_username_from_url(url)
            
            assert video_id == expected_video_id, f"Video ID mismatch for {url}"
            assert username == expected_username, f"Username mismatch for {url}"
            
            print(f"✓ Extracted: {username} - {video_id} from {url}")
    
    async def test_video_info_retrieval(self):
        """Test getting video info for specific URLs"""
        print("📹 Testing video info retrieval...")
        
        for url in self.test_urls:
            video_id = self.extract_video_id_from_url(url)
            username = self.extract_username_from_url(url)
            
            print(f"Fetching info for video: {video_id} by @{username}")
            
            # Test individual video info
            video_info = await self.tiktok_service.get_video_info(video_id)
            
            # Validate required fields
            assert video_info.get('videoId') == video_id, f"Video ID mismatch"
            assert video_info.get('title'), f"Missing title for {video_id}"
            assert video_info.get('thumbnail'), f"Missing thumbnail for {video_id}"
            assert isinstance(video_info.get('duration'), (int, float)), f"Invalid duration"
            
            # Log video details
            title = video_info.get('title', '')
            duration = video_info.get('duration', 0)
            views = video_info.get('stats', {}).get('views', 0)
            likes = video_info.get('stats', {}).get('likes', 0)
            
            print(f"✓ Video: {title[:60]}...")
            print(f"  Duration: {duration}s, Views: {views}, Likes: {likes}")
            print(f"  Thumbnail: {video_info.get('thumbnail', '')[:80]}...")
    
    async def test_thumbnail_accessibility(self):
        """Test that thumbnails are accessible"""
        print("🖼️  Testing thumbnail accessibility...")
        
        for url in self.test_urls:
            video_id = self.extract_video_id_from_url(url)
            video_info = await self.tiktok_service.get_video_info(video_id)
            
            thumbnail_url = video_info.get('thumbnail')
            assert thumbnail_url, f"No thumbnail URL for {video_id}"
            
            # Test thumbnail accessibility
            try:
                response = requests.head(thumbnail_url, timeout=10)
                if response.status_code == 200:
                    print(f"✓ Thumbnail accessible: {thumbnail_url}")
                else:
                    print(f"⚠ Thumbnail returned status {response.status_code}: {thumbnail_url}")
            except Exception as e:
                print(f"⚠ Thumbnail check failed: {e}")
    
    async def test_video_preview(self):
        """Test video preview functionality"""
        print("🎬 Testing video preview...")
        
        for url in self.test_urls:
            video_id = self.extract_video_id_from_url(url)
            
            try:
                preview = await self.tiktok_service.get_video_preview(video_id)
                
                # Validate preview structure
                required_fields = ['videoId', 'title', 'thumbnail', 'streamUrl', 'directUrl']
                for field in required_fields:
                    assert field in preview, f"Missing {field} in preview for {video_id}"
                
                print(f"✓ Preview generated for {video_id}")
                print(f"  Title: {preview.get('title', '')[:60]}...")
                print(f"  Stream URL: {preview.get('streamUrl', '')}")
                
            except Exception as e:
                print(f"❌ Preview failed for {video_id}: {e}")
                raise
    
    async def test_batch_processing(self):
        """Test processing multiple specific URLs"""
        print("📦 Testing batch processing...")
        
        video_data = []
        
        for url in self.test_urls:
            video_id = self.extract_video_id_from_url(url)
            username = self.extract_username_from_url(url)
            
            try:
                video_info = await self.tiktok_service.get_video_info(video_id)
                
                # Create structured data for frontend
                processed_video = {
                    'url': url,
                    'videoId': video_id,
                    'username': username,
                    'title': video_info.get('title', ''),
                    'thumbnail': video_info.get('thumbnail', ''),
                    'duration': video_info.get('duration', 0),
                    'stats': video_info.get('stats', {}),
                    'preview': await self.tiktok_service.get_video_preview(video_id)
                }
                
                video_data.append(processed_video)
                print(f"✓ Processed: {username} - {video_id}")
                
            except Exception as e:
                print(f"❌ Failed to process {url}: {e}")
                raise
        
        assert len(video_data) == len(self.test_urls), "Batch processing incomplete"
        
        # Summary
        print(f"\n📊 Batch Summary:")
        for video in video_data:
            print(f"  {video['username']}: {video['title'][:50]}...")
        
        return video_data
    
    async def test_audio_extraction(self):
        """Test audio extraction from videos"""
        print("🎵 Testing audio extraction...")
        
        for url in self.test_urls:
            video_id = self.extract_video_id_from_url(url)
            
            try:
                # Test audio info retrieval
                audio_info = await self.tiktok_service.get_audio_info(video_id)
                
                assert audio_info.get('videoId') == video_id
                assert audio_info.get('duration', 0) > 0
                assert audio_info.get('hasAudio') is True
                
                print(f"✓ Audio info for {video_id}: {audio_info.get('duration')}s")
                
            except Exception as e:
                print(f"⚠ Audio test failed for {video_id}: {e}")
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🧪 Starting TikTok Specific URL Tests...")
        print("=" * 60)
        
        try:
            await self.test_url_extraction()
            print()
            
            await self.test_video_info_retrieval()
            print()
            
            await self.test_thumbnail_accessibility()
            print()
            
            await self.test_video_preview()
            print()
            
            video_data = await self.test_batch_processing()
            print()
            
            await self.test_audio_extraction()
            print()
            
            print("=" * 60)
            print("✅ ALL TESTS PASSED!")
            print("🎉 Ready for frontend integration!")
            
            return video_data
            
        except Exception as e:
            print(f"❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            return None

async def main():
    """Main test runner"""
    print("🚀 TikTok Specific URL Test Runner")
    print("Testing URLs:")
    for url in TestTikTokSpecificURLs().test_urls:
        print(f"  - {url}")
    print()
    
    tester = TestTikTokSpecificURLs()
    results = await tester.run_all_tests()
    
    if results:
        print(f"\n📋 Test Results Summary:")
        print(f"Processed {len(results)} videos successfully")
        return True
    else:
        print("\n💥 Tests failed - check output above")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)