#!/usr/bin/env python3
"""
Test script for enhanced transcription with audio separation and speaker diarization
"""

import asyncio
import os
import sys
import json
from pathlib import Path

# Add backend src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.services.audio_preparation_service import audio_preparation_service
from src.services.audio_separation_service import audio_separation_service


async def test_enhanced_transcription():
    """Test the enhanced transcription workflow"""
    
    print("Testing Enhanced Transcription with Audio Separation")
    print("=" * 60)
    
    # Test configuration
    test_config = {
        "use_whisper": True,
        "segment_audio": True,
        "max_segment_duration": 30,
        "transcribe": True,
        "clean_silence": True,
        "separate_voices": True,
        "identify_speakers": True,
        "min_speakers": 1,
        "max_speakers": 5,
        "min_speaker_duration": 1.0,
        "provider_specific": {}
    }
    
    # Find a test audio file
    test_audio_paths = [
        "/tmp/test_interview.mp3",  # Multi-speaker audio
        "/tmp/test_music_speech.mp3",  # Audio with background music
        "/tmp/test_meeting.mp3",  # Meeting recording
        "/tmp/test_audio.mp3",
        "/tmp/voice_sample.mp3",
        "/tmp/sample.wav"
    ]
    
    test_audio = None
    for path in test_audio_paths:
        if os.path.exists(path):
            test_audio = path
            break
    
    if not test_audio:
        print("ERROR: No test audio file found. Please provide an audio file at one of:")
        for path in test_audio_paths:
            print(f"  - {path}")
        print("\nFor best results, use:")
        print("  - Multi-speaker audio (interview, meeting)")
        print("  - Audio with background music")
        return
    
    print(f"\nUsing test audio: {test_audio}")
    print(f"File size: {os.path.getsize(test_audio) / 1024:.2f} KB")
    
    try:
        # Test 1: Audio separation only
        print("\n1. Testing Audio Separation (Demucs)...")
        vocals_path = await audio_separation_service.extract_vocals(test_audio)
        print(f"   ✓ Extracted vocals: {vocals_path}")
        print(f"   ✓ Vocals file size: {os.path.getsize(vocals_path) / 1024:.2f} KB")
        
        # Test 2: Speaker diarization only
        print("\n2. Testing Speaker Diarization (pyannote)...")
        diarization = await audio_separation_service.diarize_speakers(
            vocals_path,
            min_speakers=1,
            max_speakers=5
        )
        print(f"   ✓ Identified {diarization['speakers']} speaker(s)")
        print(f"   ✓ Total segments: {len(diarization['segments'])}")
        if diarization['segments']:
            print("   ✓ First few segments:")
            for seg in diarization['segments'][:3]:
                print(f"     - {seg['speaker']}: {seg['start']:.1f}s - {seg['end']:.1f}s")
        
        # Test 3: Full enhanced transcription
        print("\n3. Testing Full Enhanced Transcription...")
        result = await audio_preparation_service.prepare_audio(
            audio_path=test_audio,
            provider="transcription",
            config=test_config
        )
        
        print(f"   ✓ Transcription completed")
        print(f"   ✓ Language: {result['metadata'].get('language', 'unknown')}")
        print(f"   ✓ Speakers identified: {result['metadata'].get('speakers_identified', 1)}")
        print(f"   ✓ Total segments: {len(result.get('segments', []))}")
        
        # Display transcript preview
        if result.get('transcription'):
            print(f"\n   Transcript preview:")
            print(f"   {result['transcription'][:200]}...")
        
        # Display speaker segments
        if result.get('segments_by_speaker'):
            print(f"\n   Segments by speaker:")
            for speaker, segments in result['segments_by_speaker'].items():
                print(f"   - {speaker}: {len(segments)} segments")
                if segments:
                    print(f"     First segment: \"{segments[0]['text'][:50]}...\"")
        
        # Test 4: Without separation (for comparison)
        print("\n4. Testing without audio separation (baseline)...")
        test_config['separate_voices'] = False
        test_config['identify_speakers'] = False
        
        baseline_result = await audio_preparation_service.prepare_audio(
            audio_path=test_audio,
            provider="transcription",
            config=test_config
        )
        
        print(f"   ✓ Baseline transcription completed")
        print(f"   ✓ Comparing quality...")
        
        # Save results for analysis
        results_file = "/tmp/transcription_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "enhanced": {
                    "transcription": result.get('transcription', ''),
                    "speakers": result['metadata'].get('speakers_identified', 1),
                    "segments_count": len(result.get('segments', [])),
                    "has_speaker_labels": bool(result.get('segments_by_speaker'))
                },
                "baseline": {
                    "transcription": baseline_result.get('transcription', ''),
                    "segments_count": len(baseline_result.get('segments', []))
                }
            }, f, indent=2)
        
        print(f"\n✅ All tests completed! Results saved to: {results_file}")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        audio_preparation_service.cleanup()
        audio_separation_service.cleanup()
        print("\n✓ Cleanup completed")


async def test_api_endpoint():
    """Test the transcription API endpoint"""
    
    print("\n\nTesting Transcription API Endpoint")
    print("=" * 60)
    
    print("To test the API endpoint with enhanced features:")
    print("1. Start the backend server: cd backend && python -m src.main")
    print("2. Use curl to test transcription:")
    print("""
    curl -X POST http://localhost:8000/api/public/audio-transcripts/transcribe \\
      -F 'file=@/path/to/audio.mp3' \\
      -F 'job_id=test_job_123' \\
      -F 'user_id=test_user' \\
      -F 'separate_voices=true' \\
      -F 'identify_speakers=true' \\
      -F 'min_speakers=1' \\
      -F 'max_speakers=5'
    """)
    print("\n3. The response will include:")
    print("   - Transcript with speaker labels")
    print("   - Speaker segments with timestamps")
    print("   - Audio quality metrics")


if __name__ == "__main__":
    print("Enhanced Transcription Test")
    print("This test requires:")
    print("- Demucs for audio separation")
    print("- pyannote.audio for speaker diarization")
    print("- HuggingFace token in HUGGINGFACE_TOKEN or HF_TOKEN env var")
    print("")
    
    # Check for HF token
    hf_token = os.getenv("HUGGINGFACE_TOKEN", os.getenv("HF_TOKEN"))
    if not hf_token:
        print("WARNING: No HuggingFace token found. Speaker diarization will be limited.")
        print("Set HUGGINGFACE_TOKEN or HF_TOKEN environment variable for full functionality.")
    
    # Run tests
    asyncio.run(test_enhanced_transcription())
    asyncio.run(test_api_endpoint())