#!/usr/bin/env python3
"""
Test runner for modern diarization system
Runs all E2E tests and provides summary
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

import pytest
import asyncio
import numpy as np
from tests.test_modern_diarization_e2e import TestModernDiarizationE2E
from tests.modern_stream_simulation import run_modern_stream

async def run_all_tests():
    """Run all modern diarization tests"""
    print("🚀 Running Modern Diarization E2E Tests...")
    
    # Run pytest tests
    result = pytest.main([
        "tests/test_modern_diarization_e2e.py",
        "-v",
        "--tb=short"
    ])
    
    # Run additional integration tests
    print("\n🔧 Running Integration Tests...")
    
    # Test basic functionality
    try:
        from tests.modern_stream_simulation import ModernStreamProcessor
        
        # Test with synthetic data
        processor = ModernStreamProcessor()
        
        # Test component initialization
        processor.initialize_models()
        
        # Test speaker identifier
        identifier = processor.speaker_identifier
        
        # Test basic identification
        audio = np.random.randn(1600)
        embedding = np.random.randn(192)
        
        speaker, confidence = identifier.identify_speaker(audio, embedding)
        assert speaker is not None
        assert 0.0 <= confidence <= 1.0
        
        print("✅ Basic integration test passed")
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return 1
    
    return result

def main():
    """Main test runner"""
    print("=== Modern Streaming Diarization System Test Suite ===\n")
    
    # Check dependencies
    try:
        import torch
        import numpy as np
        from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier
        
        print("✅ Dependencies available")
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        return 1
    
    # Run tests
    result = asyncio.run(run_all_tests())
    
    if result == 0:
        print("\n🎉 All tests passed! Modern diarization system is ready.")
    else:
        print(f"\n❌ Tests failed with code: {result}")
    
    return result

if __name__ == "__main__":
    sys.exit(main())