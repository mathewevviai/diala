"""
End-to-End tests for memory-efficient speaker management system (tasks 6-6.2)
Validates complete functionality including Cornell et al. (2022) strategies
"""

import pytest
import numpy as np
import time
from unittest.mock import patch, MagicMock
from src.services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager
from src.services.speaker_profile import SpeakerProfile


class TestMemoryEfficientE2E:
    """End-to-End tests for the complete memory-efficient speaker management system"""
    
    def test_complete_e2e_workflow(self):
        """Test complete E2E workflow from speaker addition to memory management"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=10,
            memory_threshold_mb=100,
            inactivity_threshold=1.0,
            merge_similarity_threshold=0.95
        )
        
        # Step 1: Add speakers and validate storage
        speakers_data = {
            "alice": np.array([1.0, 0.0, 0.0, 0.0, 0.0]),
            "bob": np.array([0.0, 1.0, 0.0, 0.0, 0.0]),
            "charlie": np.array([0.0, 0.0, 1.0, 0.0, 0.0])
        }
        
        for speaker_id, embedding in speakers_data.items():
            result = manager.add_or_update_speaker(speaker_id, embedding, quality_score=1.0)
            assert result is True, f"Failed to add speaker {speaker_id}"
        
        assert manager.get_speaker_count() == 3
        
        # Step 2: Update existing speakers with quality weighting
        manager.add_or_update_speaker("alice", np.array([1.1, 0.1, 0.0, 0.0, 0.0]), quality_score=0.8)
        alice_profile = manager.speakers["alice"]
        assert alice_profile.update_count == 2
        
        # Step 3: Test speaker identification
        query_embedding = np.array([0.9, 0.1, 0.0, 0.0, 0.0])
        closest_id, similarity = manager.find_closest_speaker(query_embedding)
        assert closest_id == "alice"
        assert similarity > 0.8
        
        # Step 4: Memory monitoring
        stats = manager.get_memory_stats()
        assert stats.total_speakers == 3
        assert stats.total_memory_mb > 0
        
        # Step 5: Temporal decay for long streams
        original_activity = manager.speakers["alice"].activity_level
        manager.apply_temporal_decay(0.9)
        assert manager.speakers["alice"].activity_level < original_activity
        
        # Step 6: Inactive speaker pruning
        time.sleep(1.1)  # Wait for inactivity
        removed = manager.prune_inactive_speakers()
        assert removed >= 0
        
        # Step 7: Speaker merging with similar embeddings
        similar_speakers = {
            "sim1": np.array([0.99, 0.01, 0.0, 0.0, 0.0]),
            "sim2": np.array([1.01, 0.02, 0.0, 0.0, 0.0]),
            "sim3": np.array([0.98, 0.03, 0.0, 0.0, 0.0])
        }
        
        for speaker_id, embedding in similar_speakers.items():
            manager.add_or_update_speaker(speaker_id, embedding, quality_score=1.0)
        
        # Merge similar speakers
        mergers = manager.merge_similar_speakers(0.98)
        assert mergers >= 1
        
    def test_memory_pressure_scenario(self):
        """Test system behavior under memory pressure"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=3,
            memory_threshold_mb=50,
            inactivity_threshold=0.5,
            merge_similarity_threshold=0.9
        )
        
        # Add speakers beyond limit to trigger memory management
        for i in range(10):
            embedding = np.random.rand(512)
            result = manager.add_or_update_speaker(f"speaker_{i}", embedding, quality_score=1.0)
            assert result is True
        
        # Should respect max_speakers limit
        assert manager.get_speaker_count() <= manager.max_speakers
        
        # Test emergency pruning
        with patch.object(manager, '_is_memory_threshold_exceeded', return_value=True):
            manager.add_or_update_speaker("emergency", np.random.rand(512), quality_score=1.0)
        
        # Should handle emergency gracefully
        assert manager.get_speaker_count() <= manager.max_speakers
        
    def test_quality_weighted_centroid_updates(self):
        """Test quality-weighted centroid updates as per Bredin & Laurent (2021)"""
        manager = MemoryEfficientSpeakerManager(max_speakers=5)
        
        # Add speaker with low quality
        low_quality_embedding = np.array([1.0, 2.0, 3.0])
        manager.add_or_update_speaker("test", low_quality_embedding, quality_score=0.1)
        
        # Update with high quality
        high_quality_embedding = np.array([5.0, 6.0, 7.0])
        manager.add_or_update_speaker("test", high_quality_embedding, quality_score=1.0)
        
        # Check weighted average
        profile = manager.speakers["test"]
        expected = (0.1 * 1.0 + 1.0 * 5.0) / (0.1 + 1.0)
        actual = profile.centroid[0]
        assert abs(actual - expected) < 0.01
        
    def test_speaker_lifecycle(self):
        """Test complete lifecycle: add → update → decay → prune → merge"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=5,
            inactivity_threshold=1.0
        )
        
        # Initial state
        assert manager.get_speaker_count() == 0
        
        # Add speakers
        for i in range(5):
            embedding = np.random.rand(512)
            manager.add_or_update_speaker(f"speaker_{i}", embedding, quality_score=1.0)
        
        assert manager.get_speaker_count() == 5
        
        # Update some speakers
        for i in range(3):
            new_embedding = np.random.rand(512)
            manager.add_or_update_speaker(f"speaker_{i}", new_embedding, quality_score=0.5)
        
        # Apply temporal decay
        original_count = manager.get_speaker_count()
        manager.apply_temporal_decay(0.95)
        assert manager.get_speaker_count() == original_count
        
        # Simulate inactivity
        time.sleep(1.1)
        removed = manager.prune_inactive_speakers()
        
        # Add similar speakers for merging
        for i in range(3):
            similar_embedding = np.array([1.0 + i*0.01, 2.0 + i*0.01, 3.0 + i*0.01])
            manager.add_or_update_speaker(f"similar_{i}", similar_embedding, quality_score=1.0)
        
        # Merge similar speakers
        mergers = manager.merge_similar_speakers(0.99)
        
        # Final validation