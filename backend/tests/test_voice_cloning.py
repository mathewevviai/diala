#!/usr/bin/env python3
"""
Test script for voice cloning functionality

This script tests the complete voice cloning flow:
1. Upload a test audio/video file
2. Process it through the voice cloning endpoint
3. Generate sample speech with the cloned voice
"""

import asyncio
import aiohttp
import os
import sys
import argparse
from pathlib import Path
import base64
import json


async def test_voice_cloning(file_path: str, api_url: str = "http://localhost:8000"):
    """Test the voice cloning endpoint with a file."""
    
    print(f"Testing voice cloning with file: {file_path}")
    print(f"API URL: {api_url}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return False
    
    # Prepare the form data
    async with aiohttp.ClientSession() as session:
        try:
            # Create form data
            data = aiohttp.FormData()
            
            # Add file
            with open(file_path, 'rb') as f:
                data.add_field('audio_file',
                             f,
                             filename=os.path.basename(file_path),
                             content_type='application/octet-stream')
            
            # Add optional fields
            data.add_field('user_id', 'test_user_123')
            data.add_field('voice_name', 'Test Voice')
            data.add_field('sample_text', 'Hello, this is a test of my cloned voice. I can now speak with my own voice characteristics.')
            
            # Make request
            print("\nSending request to voice cloning endpoint...")
            async with session.post(
                f"{api_url}/api/public/voice/onboarding/clone",
                data=data,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                
                # Check response
                if response.status == 200:
                    result = await response.json()
                    print("\n✅ Voice cloning successful!")
                    print(f"Voice ID: {result.get('voice_id')}")
                    print(f"Voice Name: {result.get('voice_name')}")
                    print(f"Sample Text: {result.get('sample_text')}")
                    
                    # Save sample audio if provided
                    if result.get('sample_audio'):
                        audio_data = result['sample_audio'].split(',')[1]  # Remove data:audio/mp3;base64,
                        audio_bytes = base64.b64decode(audio_data)
                        
                        output_path = f"test_voice_clone_{result.get('voice_id')}.mp3"
                        with open(output_path, 'wb') as f:
                            f.write(audio_bytes)
                        
                        print(f"\n📁 Sample audio saved to: {output_path}")
                    
                    return True
                else:
                    error_text = await response.text()
                    print(f"\n❌ Voice cloning failed with status {response.status}")
                    print(f"Error: {error_text}")
                    return False
                    
        except asyncio.TimeoutError:
            print("\n❌ Request timed out after 120 seconds")
            return False
        except Exception as e:
            print(f"\n❌ Error during voice cloning: {str(e)}")
            return False


async def test_chatterbox_health(api_url: str = "http://localhost:8001"):
    """Test if Chatterbox service is running."""
    
    print(f"\nChecking Chatterbox service at {api_url}...")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{api_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Chatterbox service is healthy")
                    print(f"   Model loaded: {data.get('model_loaded')}")
                    print(f"   GPU available: {data.get('gpu_available')}")
                    print(f"   GPU backend: {data.get('gpu_backend')}")
                    return True
                else:
                    print(f"❌ Chatterbox service returned status {response.status}")
                    return False
        except aiohttp.ClientConnectorError:
            print("❌ Could not connect to Chatterbox service")
            print("   Make sure the service is running on port 8001")
            print("   Run: cd backend/src/chatterbox/streaming && python main.py")
            return False
        except Exception as e:
            print(f"❌ Error checking Chatterbox health: {str(e)}")
            return False


async def main():
    """Main test function."""
    
    parser = argparse.ArgumentParser(description="Test voice cloning functionality")
    parser.add_argument("file", help="Path to audio or video file for voice cloning")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--chatterbox-url", default="http://localhost:8001", help="Chatterbox API URL")
    parser.add_argument("--skip-health-check", action="store_true", help="Skip Chatterbox health check")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Voice Cloning Test Script")
    print("=" * 60)
    
    # Check Chatterbox health first
    if not args.skip_health_check:
        chatterbox_healthy = await test_chatterbox_health(args.chatterbox_url)
        if not chatterbox_healthy:
            print("\n⚠️  Chatterbox service is not running properly.")
            print("Voice cloning will fail without it.")
            response = input("\nContinue anyway? (y/N): ")
            if response.lower() != 'y':
                return
    
    # Test voice cloning
    success = await test_voice_cloning(args.file, args.api_url)
    
    if success:
        print("\n✅ Voice cloning test completed successfully!")
    else:
        print("\n❌ Voice cloning test failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())