#!/usr/bin/env python3
"""
Test script for Chatterbox TTS API with ROCm validation
"""
import asyncio
import sys
import os
import torch
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.chatterbox_client import ChatterboxClient, ChatterboxClientSync

async def test_async_client():
    """Test the async client"""
    print("Testing Async Client...")
    
    async with ChatterboxClient() as client:
        # Test health check
        print("\n1. Health Check:")
        health = await client.health_check()
        print(f"   Status: {health}")
        
        # Test list voices
        print("\n2. List Voices:")
        voices = await client.list_voices()
        for voice in voices:
            print(f"   - {voice['id']}: {voice['name']}")
        
        # Test speech generation
        print("\n3. Generate Speech:")
        text = "Hello, this is a test of the Chatterbox TTS system running on AMD ROCm."
        audio_data = await client.generate_speech(text)
        
        # Save audio
        output_path = "test_output.wav"
        await client.save_audio(audio_data, output_path)
        print(f"   Audio saved to: {output_path}")
        print(f"   Audio size: {len(audio_data)} bytes")

def test_sync_client():
    """Test the sync client"""
    print("\n\nTesting Sync Client...")
    
    client = ChatterboxClientSync()
    
    # Test health check
    print("\n1. Health Check:")
    health = client.health_check()
    print(f"   Status: {health}")
    
    # Test speech generation
    print("\n2. Generate Speech:")
    text = "This is a test using the synchronous client."
    audio_data = client.generate_speech(text)
    
    print(f"   Audio size: {len(audio_data)} bytes")
    
    # Save audio
    with open("test_output_sync.wav", "wb") as f:
        f.write(audio_data)
    print(f"   Audio saved to: test_output_sync.wav")

async def validate_gpu_setup():
    """Validate GPU setup on the host system"""
    print("\nGPU Validation:")
    print("-" * 30)
    
    # Check PyTorch support
    print(f"PyTorch version: {torch.__version__}")
    print(f"GPU available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"GPU device name: {torch.cuda.get_device_name(0)}")
        print(f"GPU count: {torch.cuda.device_count()}")
        
        # Detect backend
        if hasattr(torch.version, 'hip') and torch.version.hip is not None:
            print(f"Backend: ROCm")
            print(f"ROCm version: {torch.version.hip}")
        else:
            print(f"Backend: CUDA")
            print(f"CUDA version: {torch.version.cuda}")
            print(f"cuDNN version: {torch.backends.cudnn.version()}")
        
        # Memory info
        props = torch.cuda.get_device_properties(0)
        print(f"Total GPU memory: {props.total_memory / 1024**3:.2f} GB")
        print(f"GPU compute capability: {props.major}.{props.minor}")
    else:
        print("No GPU detected on host system")
    
    # Test API metrics endpoint
    print("\nTesting API metrics endpoint:")
    async with ChatterboxClient() as client:
        if client.session:
            try:
                async with client.session.get(f"{client.base_url}/metrics") as response:
                    if response.status == 200:
                        metrics = await response.json()
                        print("GPU Metrics from API:")
                        for key, value in metrics.items():
                            print(f"  {key}: {value}")
            except Exception as e:
                print(f"Could not fetch metrics: {e}")

if __name__ == "__main__":
    print("Chatterbox TTS API Test")
    print("=" * 50)
    
    # Validate GPU setup
    asyncio.run(validate_gpu_setup())
    
    # Run async tests
    asyncio.run(test_async_client())
    
    # Run sync tests
    test_sync_client()
    
    print("\n\nTests completed!")