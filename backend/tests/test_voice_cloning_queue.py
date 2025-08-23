#!/usr/bin/env python3
"""
Test script for voice cloning with job queue system

This script tests the complete voice cloning flow with the new job queue:
1. Upload a test audio/video file
2. Create a job in Convex
3. Process locally (development) or queue (production)
4. Monitor job status
5. Retrieve results
"""

import asyncio
import aiohttp
import os
import sys
import argparse
from pathlib import Path
import json
import time


async def test_voice_cloning_queue(file_path: str, api_url: str = "http://localhost:8000"):
    """Test the voice cloning endpoint with job queue."""
    
    print(f"\n{'='*60}")
    print("Voice Cloning Job Queue Test")
    print(f"{'='*60}")
    print(f"File: {file_path}")
    print(f"API: {api_url}")
    print(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"{'='*60}\n")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        return False
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Submit voice cloning job
            print("📤 Submitting voice cloning job...")
            
            data = aiohttp.FormData()
            with open(file_path, 'rb') as f:
                data.add_field('audio_file',
                             f,
                             filename=os.path.basename(file_path),
                             content_type='application/octet-stream')
            
            data.add_field('user_id', 'test_user_123')
            data.add_field('voice_name', 'Test Voice Queue')
            data.add_field('sample_text', 'Hello, this is a test of the voice cloning job queue system.')
            
            async with session.post(
                f"{api_url}/api/public/voice/onboarding/clone",
                data=data,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                
                result = await response.json()
                status_code = response.status
                
                print(f"📨 Response Status: {status_code}")
                print(f"📋 Response: {json.dumps(result, indent=2)}")
                
                if status_code not in [200, 202]:
                    print(f"\n❌ Voice cloning failed")
                    return False
                
                job_id = result.get('jobId')
                if not job_id:
                    print(f"\n❌ No job ID in response")
                    return False
                
                print(f"\n✅ Job created: {job_id}")
                
                # Step 2: Check if immediate result (development) or queued (production)
                if status_code == 200 and result.get('voice_id'):
                    # Development mode - immediate result
                    print(f"\n🚀 Development Mode - Immediate Processing")
                    print(f"✅ Voice ID: {result.get('voice_id')}")
                    print(f"⏱️  Processing Time: {result.get('processingTime', 'N/A')}s")
                    
                    if result.get('sample_audio'):
                        print(f"🎵 Sample audio included in response")
                    
                    return True
                
                elif status_code == 202:
                    # Production mode - job queued
                    print(f"\n📋 Production Mode - Job Queued")
                    status_url = result.get('statusUrl', f"/api/public/voice/onboarding/jobs/{job_id}/status")
                    
                    # Step 3: Poll for job completion
                    print(f"\n⏳ Monitoring job status...")
                    
                    max_attempts = 60  # 2 minutes max
                    attempt = 0
                    
                    while attempt < max_attempts:
                        await asyncio.sleep(2)  # Poll every 2 seconds
                        
                        async with session.get(f"{api_url}{status_url}") as status_response:
                            if status_response.status == 200:
                                job_status = await status_response.json()
                                
                                current_status = job_status.get('status')
                                print(f"\r📊 Status: {current_status} (attempt {attempt + 1}/{max_attempts})", end='', flush=True)
                                
                                if current_status == 'completed':
                                    print(f"\n\n✅ Job completed!")
                                    print(f"📋 Job Details:")
                                    print(f"  - Voice ID: {job_status.get('voiceId')}")
                                    print(f"  - Processing Time: {job_status.get('processingTime', 'N/A')}s")
                                    print(f"  - Result URL: {job_status.get('resultUrl', 'N/A')}")
                                    return True
                                
                                elif current_status == 'failed':
                                    print(f"\n\n❌ Job failed!")
                                    print(f"📋 Error: {job_status.get('error', 'Unknown error')}")
                                    if job_status.get('errorDetails'):
                                        print(f"📋 Details: {json.dumps(job_status['errorDetails'], indent=2)}")
                                    return False
                        
                        attempt += 1
                    
                    print(f"\n\n⏱️  Timeout: Job did not complete within 2 minutes")
                    return False
                
        except asyncio.TimeoutError:
            print("\n❌ Request timed out")
            return False
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            return False


async def check_services(api_url: str = "http://localhost:8000"):
    """Check if required services are running."""
    
    print("\n🔍 Checking services...")
    
    services_ok = True
    
    # Check backend API
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{api_url}/health") as response:
                if response.status == 200:
                    print("✅ Backend API is running")
                else:
                    print("❌ Backend API returned non-200 status")
                    services_ok = False
    except:
        print("❌ Cannot connect to Backend API")
        services_ok = False
    
    # Check Chatterbox (local development)
    if os.getenv("ENVIRONMENT", "development") == "development":
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:8001/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Chatterbox is running (GPU: {data.get('gpu_backend', 'unknown')})")
                    else:
                        print("❌ Chatterbox returned non-200 status")
                        services_ok = False
        except:
            print("❌ Cannot connect to Chatterbox (port 8001)")
            print("   Run: cd backend/src/chatterbox/streaming && python main.py")
            services_ok = False
    
    # Check Convex
    convex_url = os.getenv("CONVEX_URL", "http://127.0.0.1:3210")
    print(f"ℹ️  Convex URL: {convex_url}")
    
    return services_ok


async def main():
    """Main test function."""
    
    parser = argparse.ArgumentParser(description="Test voice cloning with job queue")
    parser.add_argument("file", help="Path to audio or video file for voice cloning")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--skip-checks", action="store_true", help="Skip service checks")
    
    args = parser.parse_args()
    
    # Check services first
    if not args.skip_checks:
        services_ok = await check_services(args.api_url)
        if not services_ok:
            print("\n⚠️  Some services are not running properly.")
            response = input("\nContinue anyway? (y/N): ")
            if response.lower() != 'y':
                return
    
    # Run test
    start_time = time.time()
    success = await test_voice_cloning_queue(args.file, args.api_url)
    elapsed_time = time.time() - start_time
    
    print(f"\n{'='*60}")
    if success:
        print(f"✅ Test completed successfully in {elapsed_time:.2f}s")
    else:
        print(f"❌ Test failed after {elapsed_time:.2f}s")
        sys.exit(1)


if __name__ == "__main__":
    # Set environment to development if not set
    if not os.getenv("ENVIRONMENT"):
        os.environ["ENVIRONMENT"] = "development"
        print("ℹ️  ENVIRONMENT not set, defaulting to 'development'")
    
    asyncio.run(main())