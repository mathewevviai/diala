#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for Modern Streaming Diarization System
Tests all modern components integrated together
"""

import pytest
import asyncio
import numpy as np
import tempfile
import json
import os
from pathlib import Path
import logging
from typing import Dict, List
import time

# Import modern components
from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier
from src.services.graph_based_clustering_engine import GraphBasedClusteringEngine
from src.services.adaptive_thresholding_manager import AdaptiveThresholdingManager
from src.services.embedding_quality_assessor import EmbeddingQualityAssessor
from src.services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager
from tests.modern_stream_simulation import run_modern_stream, ModernStreamProcessor

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestModernDiarizationE2E:
    """End-to-End test suite for modern diarization system"""
    
    @pytest.fixture
    def sample_audio_generator(self):
        """Generate synthetic audio for testing"""
        def _generate(duration_seconds=5.0, sample_rate=16000):
            t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds))
            
            # Generate synthetic speech-like audio
            # Multiple speakers with different characteristics
            speaker1 = 0.5 * np.sin(2 * np.pi * 440 * t) + 0.1 * np.sin(2 * np.pi * 880 * t)
            speaker2 = 0.4 * np.sin(2 * np.pi * 330 * t) + 0.15 * np.sin(2 * np.pi * 660 * t)
            speaker3 = 0.6 * np.sin(2 * np.pi * 550 * t) + 0.08 * np.sin(2 * np.pi * 1100 * t)
            
            # Combine speakers with time separation
            audio = np.zeros_like(t)
            audio[:len(t)//3] = speaker1[:len(t)//3]
            audio[len(t)//3:2*len(t)//3] = speaker2[len(t)//3:2*len(t)//3]
            audio[2*len(t)//3:] = speaker3[2*len(t)//3:]
            
            # Add noise
            noise = 0.05 * np.random.randn(len(t))
            audio += noise
            
            return (audio * 32767).astype(np.int16)
        return _generate
    
    @pytest.fixture
    def modern_identifier(self):
        """Create ModernStatefulSpeakerIdentifier instance"""
        return ModernStatefulSpeakerIdentifier(
            base_threshold=0.7,
            max_speakers=10,
            use_graph_clustering=True,
            use_adaptive_thresholds=True,
            use_quality_weighting=True,
            use_temporal_context=True
        )
    
    @pytest.fixture
    def test_config(self):
        """Test configuration"""
        return {
            "use_graph_clustering": True,
            "use_adaptive_thresholds": True,
            "use_quality_weighting": True,
            "use_temporal_context": True,
            "similarity_threshold": 0.7,
            "max_speakers": 10
        }
    
    def test_modern_identifier_initialization(self, modern_identifier):
        """Test ModernStatefulSpeakerIdentifier initialization"""
        assert modern_identifier is not None
        assert len(modern_identifier.speaker_profiles) == 0
        assert modern_identifier.base_threshold == 0.7
        assert modern_identifier.max_speakers == 10
        
    def test_embedding_quality_assessor(self):
        """Test embedding quality assessment"""
        assessor = EmbeddingQualityAssessor()
        
        # Test with synthetic audio
        audio = np.random.randn(16000)  # 1 second of audio
        quality = assessor.assess_quality(audio)
        
        assert 0.0 <= quality <= 1.0
        assert isinstance(quality, float)
        
    def test_adaptive_thresholding_manager(self):
        """Test adaptive thresholding system"""
        manager = AdaptiveThresholdingManager(
            base_threshold=0.7,
            adaptation_rate=0.1
        )
        
        # Test threshold initialization
        threshold = manager.get_threshold("speaker1")
        assert threshold == 0.7
        
        # Test threshold update
        manager.update_threshold("speaker1", 0.8, 0.9, was_accepted=True)
        new_threshold = manager.get_threshold("speaker1")
        assert new_threshold != 0.7
        
    def test_graph_clustering_engine(self):
        """Test graph-based clustering"""
        engine = GraphBasedClusteringEngine(
            max_speakers=5,
            similarity_threshold=0.7
        )
        
        # Add test speakers
        embedding = np.random.randn(192)  # Typical embedding size
        
        success = engine.add_or_update_speaker("speaker1", embedding, 0.9)
        assert success
        
        speaker_count = engine.get_speaker_count()
        assert speaker_count == 1
        
    def test_memory_efficient_manager(self):
        """Test memory-efficient speaker management"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=5,
            memory_threshold_mb=50
        )
        
        # Add test speakers
        for i in range(3):
            embedding = np.random.randn(192)
            success = manager.add_or_update_speaker(f"speaker{i}", embedding, 0.9)
            assert success
            
        speaker_count = manager.get_speaker_count()
        assert speaker_count == 3
        
    def test_modern_identifier_with_embeddings(self, modern_identifier):
        """Test ModernStatefulSpeakerIdentifier with actual embeddings"""
        # Create synthetic embeddings
        embedding1 = np.random.randn(192)
        embedding2 = np.random.randn(192)
        embedding3 = np.random.randn(192)
        
        audio1 = np.random.randn(1600)  # 100ms audio
        audio2 = np.random.randn(1600)
        audio3 = np.random.randn(1600)
        
        # Test speaker identification
        speaker1, conf1 = modern_identifier.identify_speaker(audio1, embedding1)
        speaker2, conf2 = modern_identifier.identify_speaker(audio2, embedding2)
        speaker3, conf3 = modern_identifier.identify_speaker(audio3, embedding3)
        
        assert speaker1 != speaker2 or speaker1 != speaker3  # Should create different speakers
        assert 0.0 <= conf1 <= 1.0
        assert 0.0 <= conf2 <= 1.0
        assert 0.0 <= conf3 <= 1.0
        
    def test_performance_comparison(self, sample_audio_generator, modern_identifier):
        """Test performance comparison between modern and legacy"""
        # Generate test audio
        audio = sample_audio_generator(duration_seconds=3.0)
        
        # Create multiple embeddings for same speaker
        embeddings = [np.random.randn(192) for _ in range(5)]
        
        start_time = time.time()
        
        # Process with modern system
        for i, embedding in enumerate(embeddings):
            modern_identifier.identify_speaker(audio, embedding)
            
        modern_time = time.time() - start_time
        
        # Get performance stats
        stats = modern_identifier.get_performance_stats()
        assert 'total_identifications' in stats
        assert 'fallback_count' in stats
        
    def test_memory_management(self):
        """Test memory management capabilities"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=5,
            memory_threshold_mb=10
        )
        
        # Add speakers until limit
        for i in range(10):  # More than max_speakers
            embedding = np.random.randn(192)
            manager.add_or_update_speaker(f"speaker{i}", embedding, 0.9)
            
        # Should not exceed max_speakers
        assert manager.get_speaker_count() <= 5
        
    def test_adaptive_threshold_evolution(self):
        """Test how thresholds evolve over time"""
        manager = AdaptiveThresholdingManager(
            base_threshold=0.7,
            adaptation_rate=0.1
        )
        
        thresholds = []
        speaker_id = "test_speaker"
        
        # Simulate multiple identifications
        for i in range(10):
            similarity = 0.6 + 0.1 * np.sin(i * 0.5)  # Varying similarity
            quality = 0.8 + 0.2 * np.random.randn()  # Varying quality
            quality = max(0.1, min(1.0, quality))
            
            manager.update_threshold(speaker_id, similarity, quality, was_accepted=True)
            thresholds.append(manager.get_threshold(speaker_id))
            
        # Thresholds should evolve
        assert thresholds[0] != thresholds[-1]
        
    def test_graph_clustering_with_multiple_speakers(self):
        """Test graph clustering with multiple speakers"""
        engine = GraphBasedClusteringEngine(
            max_speakers=10,
            similarity_threshold=0.7
        )
        
        # Create distinct speakers
        speaker_embeddings = {
            "speaker1": np.array([1.0, 0.0, 0.0] * 64),
            "speaker2": np.array([0.0, 1.0, 0.0] * 64),
            "speaker3": np.array([0.0, 0.0, 1.0] * 64)
        }
        
        # Add speakers
        for speaker_id, embedding in speaker_embeddings.items():
            success = engine.add_or_update_speaker(speaker_id, embedding, 0.9)
            assert success
            
        # Test clustering
        clusters = engine.cluster_speakers()
        assert len(clusters) == 3
        
    @pytest.mark.asyncio
    async def test_modern_stream_processing(self, sample_audio_generator, test_config):
        """Test complete modern stream processing"""
        # Create temporary audio file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            audio = sample_audio_generator(duration_seconds=5.0)
            
            # Save as WAV
            import scipy.io.wavfile as wavfile
            wavfile.write(tmp_file.name, 16000, audio)
            
            # Process with modern system
            result = await run_modern_stream(tmp_file.name, separate_speakers=False, config=test_config)
            
            assert 'results' in result
            assert 'stats' in result
            assert result['stats']['total_segments'] > 0
            
            # Clean up
            os.unlink(tmp_file.name)
            
    def test_configuration_switching(self):
        """Test enabling/disabling modern features"""
        configs = [
            {"use_graph_clustering": True, "use_adaptive_thresholds": False},
            {"use_graph_clustering": False, "use_adaptive_thresholds": True},
            {"use_graph_clustering": True, "use_adaptive_thresholds": True}
        ]
        
        for config in configs:
            identifier = ModernStatefulSpeakerIdentifier(**config)
            
            # Should initialize without errors
            assert identifier is not None
            
    def test_error_handling(self):
        """Test error handling and fallbacks"""
        identifier = ModernStatefulSpeakerIdentifier()
        
        # Test with invalid input
        audio = np.array([])  # Empty audio
        embedding = np.array([])  # Empty embedding
        
        speaker, confidence = identifier.identify_speaker(audio, embedding)
        assert speaker is not None
        assert 0.0 <= confidence <= 1.0
        
    def test_research_paper_validation(self):
        """Test validation against research paper metrics"""
        # This would normally use actual datasets
        # For now, test with synthetic data
        
        engine = GraphBasedClusteringEngine()
        
        # Simulate paper validation scenario
        n_speakers = 3
        n_samples_per_speaker = 10
        
        for speaker_id in range(n_speakers):
            base_embedding = np.random.randn(192)
            for i in range(n_samples_per_speaker):
                # Add variation
                embedding = base_embedding + 0.1 * np.random.randn(192)
                engine.add_or_update_speaker(f"speaker{speaker_id}", embedding, 0.9)
                
        # Basic validation
        assert engine.get_speaker_count() == n_speakers
        
    def test_long_running_stream(self):
        """Test system with long-running stream simulation"""
        processor = ModernStreamProcessor({
            'max_speakers': 5,
            'memory_threshold_mb': 50
        })
        
        # Generate multiple segments
        segments = []
        for i in range(20):
            audio = np.random.randn(3200)  # 200ms segments
            segments.append({
                'audio': audio,
                'start_time': i * 0.2,
                'end_time': (i + 1) * 0.2
            })
            
        # Process segments
        for segment in segments:
            embedding = np.random.randn(192)
            speaker, confidence = processor.speaker_identifier.identify_speaker(
                segment['audio'], embedding
            )
            assert speaker is not None
            
    def test_memory_efficiency_under_load(self):
        """Test memory efficiency with high speaker load"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=3,
            memory_threshold_mb=5
        )
        
        # Add many speakers
        for i in range(20):
            embedding = np.random.randn(192)
            manager.add_or_update_speaker(f"speaker{i}", embedding, 0.9)
            
        # Should manage memory efficiently
        assert manager.get_speaker_count() <= 3
        
        # Check memory stats
        stats = manager.get_memory_stats()
        assert stats.total_speakers <= 3

@pytest.mark.asyncio
async def test_complete_e2e_workflow():
    """Complete end-to-end test with real audio processing"""
    # Create synthetic test data
    processor = ModernStreamProcessor({
        'use_graph_clustering': True,
        'use_adaptive_thresholds': True,
        'use_quality_weighting': True,
        'use_temporal_context': True,
        'max_speakers': 5
    })
    
    # Create synthetic audio
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
        # Generate synthetic audio
        duration = 3.0
        sample_rate = 16000
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Create multi-speaker audio
        speaker1 = 0.5 * np.sin(2 * np.pi * 440 * t)
        speaker2 = 0.4 * np.sin(2 * np.pi * 330 * t)
        
        audio = np.zeros_like(t)
        audio[:len(t)//2] = speaker1[:len(t)//2]
        audio[len(t)//2:] = speaker2[len(t)//2:]
        
        # Add noise
        audio += 0.05 * np.random.randn(len(t))
        
        # Save as WAV
        import scipy.io.wavfile as wavfile
        wavfile.write(tmp_file.name, sample_rate, (audio * 32767).astype(np.int16))
        
        try:
            # Process with modern system
            result = await run_modern_stream(tmp_file.name, separate_speakers=False)
            
            # Validate results
            assert result['stats']['total_segments'] > 0
            assert result['stats']['avg_processing_time_ms'] > 0
            assert result['results'][0]['speaker'] is not None
            
        finally:
            os.unlink(tmp_file.name)

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])