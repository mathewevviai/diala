#!/usr/bin/env python3
"""
Test script for audio transcription API
"""

import requests
import os
import sys
from pathlib import Path

# API endpoint
API_URL = "http://localhost:8000/api/public/audio/transcribe"

def test_transcription():
    """Test the audio transcription endpoint"""
    
    # Create a test audio file path (you'll need to provide an actual audio file)
    test_file_path = "test_audio.mp3"  # Replace with actual audio file
    
    if not os.path.exists(test_file_path):
        print(f"Error: Test audio file '{test_file_path}' not found!")
        print("Please provide a test audio file (mp3, wav, etc.)")
        return
    
    # Prepare the request
    with open(test_file_path, 'rb') as f:
        files = {'file': (os.path.basename(test_file_path), f, 'audio/mpeg')}
        data = {
            'job_id': 'test-job-123',
            'user_id': 'test-user-123',
            'language': 'en'  # Optional
        }
        
        print(f"Sending transcription request to {API_URL}")
        print(f"File: {test_file_path}")
        print(f"Job ID: {data['job_id']}")
        
        try:
            response = requests.post(API_URL, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print("\nSuccess! Response:")
                print(f"Status: {result.get('status')}")
                print(f"Job ID: {result.get('job_id')}")
                print(f"Message: {result.get('message')}")
                print("\nThe transcription is being processed in the background.")
                print("Check Convex dashboard or poll the job status to see results.")
            else:
                print(f"\nError: {response.status_code}")
                print(response.text)
                
        except requests.exceptions.ConnectionError:
            print("\nError: Could not connect to the API.")
            print("Make sure the backend server is running:")
            print("  cd backend")
            print("  python -m src.main")
        except Exception as e:
            print(f"\nUnexpected error: {e}")

def check_health():
    """Check if the audio transcription service is healthy"""
    health_url = "http://localhost:8000/api/public/audio/health"
    
    try:
        response = requests.get(health_url)
        if response.status_code == 200:
            result = response.json()
            print("Audio Transcription Service Health Check:")
            print(f"Status: {result.get('status')}")
            print(f"Service: {result.get('service')}")
            print(f"OpenAI Configured: {result.get('openai_configured')}")
            return True
        else:
            print(f"Health check failed: {response.status_code}")
            return False
    except:
        print("Could not reach the audio transcription service")
        return False

if __name__ == "__main__":
    print("Testing Audio Transcription API")
    print("=" * 40)
    
    # First check health
    if check_health():
        print("\n" + "=" * 40)
        # Then test transcription
        test_transcription()
    else:
        print("\nPlease start the backend server first!")