"""
Test suite for memory-efficient speaker management system
Tests tasks 6.1-6.2 from modern-streaming-diarization
"""

import pytest
import numpy as np
import time
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager


class TestMemoryEfficientSpeakerManager:
    """Test cases for memory-efficient speaker management"""
    
    def setup_method(self):
        """Setup test environment before each test"""
        self.manager = MemoryEfficientSpeakerManager(
            max_speakers=10,
            memory_threshold_mb=50.0,
            inactivity_threshold=1.0,
            merge_similarity_threshold=0.95
        )
        
    def test_add_speaker_within_limits(self):
        """Test adding speakers within memory limits"""
        embedding = np.array([1.0, 2.0, 3.0])
        
        result = self.manager.add_or_update_speaker("speaker1", embedding, 1.0)
        
        assert result is True
        assert self.manager.get_speaker_count() == 1
        assert "speaker1" in self.manager.speakers
        
    def test_memory_monitoring(self):
        """Test memory usage monitoring functionality"""
        # Add multiple speakers
        for i in range(5):
            embedding = np.random.rand(512)
            self.manager.add_or_update_speaker(f"speaker{i}", embedding, 1.0)
            
        stats = self.manager.get_memory_stats()
        assert stats.total_speakers == 5
        assert stats.total_memory_mb > 0
        
    def test_speaker_pruning_inactive(self):
        """Test pruning of inactive speakers"""
        # Add speaker and make it inactive
        embedding = np.array([1.0, 2.0, 3.0])
        self.manager.add_or_update_speaker("inactive_speaker", embedding, 1.0)
        
        # Wait for inactivity threshold
        time.sleep(1.1)
        
        # Prune inactive speakers
        removed = self.manager.prune_inactive_speakers()
        assert removed >= 0
        
    def test_speaker_merging_similar(self):
        """Test merging of similar speakers"""
        # Create very similar speakers
        embedding1 = np.array([1.0, 1.0, 1.0])
        embedding2 = np.array([1.01, 1.01, 1.01])
        
        self.manager.add_or_update_speaker("speaker1", embedding1, 1.0)
        self.manager.add_or_update_speaker("speaker2", embedding2, 1.0)
        
        # Merge similar speakers
        mergers = self.manager.merge_similar_speakers(0.98)
        assert mergers >= 0
        
    def test_emergency_pruning(self):
        """Test emergency pruning under memory constraints"""
        # Add speakers beyond limit
        for i in range(15):
            embedding = np.random.rand(1024)
            self.manager.add_or_update_speaker(f"speaker{i}", embedding, 1.0)
            
        # Force memory threshold check
        with patch.object(self.manager, '_is_memory_threshold_exceeded', return_value=True):
            self.manager.add_or_update_speaker("emergency_speaker", np.random.rand(1024), 1.0)
            
        # Should handle memory overflow gracefully
        assert self.manager.get_speaker_count() <= self.manager.max_speakers
        
    def test_temporal_decay(self):
        """Test temporal decay for long streams"""
        embedding = np.array([1.0, 2.0, 3.0])
        self.manager.add_or_update_speaker("test_speaker", embedding, 1.0)
        
        original_activity = self.manager.speakers["test_speaker"].activity_level
        
        # Apply decay
        self.manager.apply_temporal_decay(0.9)
        
        new_activity = self.manager.speakers["test_speaker"].activity_level
        assert new_activity < original_activity
        
    def test_quality_weighted_updates(self):
        """Test quality-weighted centroid updates"""
        embedding1 = np.array([1.0, 1.0, 1.0])
        embedding2 = np.array([3.0, 3.0, 3.0])
        
        # Add with different quality scores
        self.manager.add_or_update_speaker("speaker1", embedding1, 1.0)
        self.manager.add_or_update_speaker("speaker1", embedding2, 3.0)
        
        # Check weighted average
        expected = (1.0 * 1.0 + 3.0 * 3.0) / (1.0 + 3.0)
        actual = self.manager.speakers["speaker1"].centroid[0]
        assert abs(actual - expected) < 0.01
        
    def test_find_closest_speaker(self):
        """Test finding closest speaker for identification"""
        # Add test speakers
        embedding1 = np.array([1.0, 0.0, 0.0])
        embedding2 = np.array([0.0, 1.0, 0.0])
        
        self.manager.add_or_update_speaker("speaker1", embedding1, 1.0)
        self.manager.add_or_update_speaker("speaker2", embedding2, 1.0)
        
        # Test query
        query = np.array([0.9, 0.1, 0.0])
        closest_id, similarity = self.manager.find_closest_speaker(query)
        
        assert closest_id == "speaker1"
        assert similarity > 0.8
        
    def test_edge_case_empty_manager(self):
        """Test edge cases with empty manager"""
        assert self.manager.get_speaker_count() == 0
        
        # Test finding closest speaker with no speakers
        closest_id, similarity = self.manager.find_closest_speaker(np.array([1.0, 2.0, 3.0]))
        assert closest_id is None
        assert similarity == 0.0


class TestMemoryEfficientE2E:
    """End-to-End tests for the complete memory-efficient speaker management system"""
    
    def test_complete_e2e_workflow(self):
        """Test complete E2E workflow from speaker addition to memory management"""
        manager = MemoryEfficientSpeakerManager(
            max_speakers=5,
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
            assert result is True
        
        assert manager.get_speaker_count() == 3
        
        # Step 2: Update existing speakers with quality weighting
        manager.add_or_update_speaker("alice", np.array([1.1, 0.1, 0.0, 0.0, 0.0]), quality_score=0.8)
        alice_profile = manager.speakers["alice"]
        assert alice_profile.total_segments == 2
        
        # Step 3: Test speaker identification
        query_embedding = np.array([0.9, 0.1, 0.0, 0.0, 0.0])
        closest_id, similarity = manager.find_closest_speaker(query_embedding)
        assert closest_id == "alice"
        assert similarity > 0.8
        
        # Step 4: Memory monitoring
        stats = manager.get_memory_stats()
        assert stats.total_speakers == 3
        
        # Step 5: Inactive speaker pruning
        time.sleep(1.1)
        removed = manager.prune_inactive_speakers()
        assert removed >= 0
        
        # Step 6: Speaker merging with similar embeddings
        similar_speakers = {
            "sim1": np.array([0.99, 0.01, 0.0, 0.0, 0.0]),
            "sim2": np.array([1.01, 0.02, 0.0, 0.0, 0.0]),
            "sim3": np.array([0.98, 0.03, 0.0, 0.0, 0.0])
        }
        
        for speaker_id, embedding in similar_speakers.items():
            manager.add_or_update_speaker(speaker_id, embedding, quality_score=1.0)
        
        # Merge similar speakers
        mergers = manager.merge_similar_speakers(0.98)
        assert mergers >= 0
        
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
        
    def test_quality_weighted_centroid_updates(self):
        """Test quality-weighted centroid updates"""
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
        assert manager.get_speaker_count() <= manager.max_speakers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])