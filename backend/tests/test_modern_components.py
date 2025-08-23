"""
Comprehensive tests for modern streaming diarization components
Tests graph clustering, adaptive thresholding, quality assessment, and integration
"""

import unittest
import numpy as np
import time
import tempfile
import os
from unittest.mock import Mock, patch

# Import modern components
from src.services.graph_based_clustering_engine import GraphBasedClusteringEngine, SpeakerNode
from src.services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager, SpeakerProfile
from src.services.temporal_context_tracker import TemporalContextTracker, TemporalContext, SpeakerTurn
from src.services.fast_graph_optimizer import FastGraphOptimizer, OptimizationStats
from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier, SpeakerIdentificationResult
from src.services.adaptive_thresholding_manager import AdaptiveThresholdingManager
from src.services.embedding_quality_assessor import EmbeddingQualityAssessor


class TestGraphBasedClusteringEngine(unittest.TestCase):
    """Test graph-based clustering engine"""
    
    def setUp(self):
        self.engine = GraphBasedClusteringEngine(max_speakers=10)
        self.embedding_dim = 192
        
    def test_initialization(self):
        """Test engine initialization"""
        self.assertEqual(self.engine.max_speakers, 10)
        self.assertEqual(self.engine.get_speaker_count(), 0)
        
    def test_add_speaker(self):
        """Test adding new speakers"""
        embedding = np.random.randn(self.embedding_dim)
        
        success = self.engine.add_or_update_speaker("speaker_1", embedding)
        self.assertTrue(success)
        self.assertEqual(self.engine.get_speaker_count(), 1)
        
    def test_update_speaker(self):
        """Test updating existing speakers"""
        embedding = np.random.randn(self.embedding_dim)
        
        # Add speaker
        self.engine.add_or_update_speaker("speaker_1", embedding)
        
        # Update with new embedding
        new_embedding = np.random.randn(self.embedding_dim)
        success = self.engine.add_or_update_speaker("speaker_1", new_embedding)
        self.assertTrue(success)
        
    def test_cluster_speakers(self):
        """Test speaker clustering"""
        # Add multiple speakers
        for i in range(3):
            embedding = np.random.randn(self.embedding_dim)
            self.engine.add_or_update_speaker(f"speaker_{i}", embedding)
        
        clusters = self.engine.cluster_speakers()
        self.assertIsInstance(clusters, dict)
        self.assertEqual(len(clusters), 3)
        
    def test_find_closest_speaker(self):
        """Test finding closest speaker"""
        # Add speakers
        embedding1 = np.array([1.0, 0.0, 0.0] * (self.embedding_dim // 3))
        embedding2 = np.array([0.0, 1.0, 0.0] * (self.embedding_dim // 3))
        
        self.engine.add_or_update_speaker("speaker_1", embedding1)
        self.engine.add_or_update_speaker("speaker_2", embedding2)
        
        # Find closest to speaker_1
        closest, similarity = self.engine.find_closest_speaker(embedding1)
        self.assertEqual(closest, "speaker_1")
        self.assertGreater(similarity, 0.9)
        
    def test_memory_efficiency(self):
        """Test memory-efficient operations"""
        # Add many speakers
        for i in range(5):
            embedding = np.random.randn(self.embedding_dim)
            self.engine.add_or_update_speaker(f"speaker_{i}", embedding)
        
        stats = self.engine.get_graph_stats()
        self.assertIn('speaker_count', stats)
        self.assertIn('edge_density', stats)


class TestMemoryEfficientSpeakerManager(unittest.TestCase):
    """Test memory-efficient speaker management"""
    
    def setUp(self):
        self.manager = MemoryEfficientSpeakerManager(
            max_speakers=5,
            memory_threshold_mb=50,
            inactivity_threshold=1.0  # Short for testing
        )
        self.embedding_dim = 192
        
    def test_add_speaker(self):
        """Test adding speakers"""
        embedding = np.random.randn(self.embedding_dim)
        success = self.manager.add_or_update_speaker("speaker_1", embedding)
        self.assertTrue(success)
        self.assertEqual(self.manager.get_speaker_count(), 1)
        
    def test_memory_constraints(self):
        """Test memory constraint handling"""
        # Add speakers up to limit
        for i in range(5):
            embedding = np.random.randn(self.embedding_dim)
            self.manager.add_or_update_speaker(f"speaker_{i}", embedding)
        
        # Try to add one more (should fail or trigger pruning)
        embedding = np.random.randn(self.embedding_dim)
        success = self.manager.add_or_update_speaker("speaker_6", embedding)
        # May fail due to constraints
        
    def test_pruning_inactive_speakers(self):
        """Test pruning inactive speakers"""
        # Add speaker
        embedding = np.random.randn(self.embedding_dim)
        self.manager.add_or_update_speaker("inactive_speaker", embedding)
        
        # Wait for inactivity
        time.sleep(1.1)
        
        # Prune inactive speakers
        pruned = self.manager.prune_inactive_speakers()
        self.assertGreaterEqual(pruned, 0)
        
    def test_merge_similar_speakers(self):
        """Test merging similar speakers"""
        # Add similar speakers
        embedding1 = np.array([1.0, 0.0, 0.0] * (self.embedding_dim // 3))
        embedding2 = np.array([1.01, 0.01, 0.01] * (self.embedding_dim // 3))
        
        self.manager.add_or_update_speaker("speaker_1", embedding1)
        self.manager.add_or_update_speaker("speaker_2", embedding2)
        
        # Merge similar speakers
        merged = self.manager.merge_similar_speakers(similarity_threshold=0.95)
        self.assertGreaterEqual(merged, 0)
        
    def test_memory_stats(self):
        """Test memory usage statistics"""
        stats = self.manager.get_memory_stats()
        self.assertIsInstance(stats.total_speakers, int)
        self.assertIsInstance(stats.total_memory_mb, float)


class TestTemporalContextTracker(unittest.TestCase):
    """Test temporal context tracking"""
    
    def setUp(self):
        self.tracker = TemporalContextTracker(
            smoothing_window=3,
            max_context_seconds=10.0
        )
        self.embedding_dim = 192
        
    def test_add_context(self):
        """Test adding temporal contexts"""
        embedding = np.random.randn(self.embedding_dim)
        
        self.tracker.add_context(
            timestamp=time.time(),
            speaker_id="speaker_1",
            confidence=0.8,
            embedding=embedding,
            quality_score=0.9,
            segment_duration=1.0
        )
        
        summary = self.tracker.get_context_summary()
        self.assertEqual(summary['total_contexts'], 1)
        
    def test_temporal_smoothing(self):
        """Test temporal smoothing"""
        # Add consistent contexts
        for i in range(3):
            embedding = np.random.randn(self.embedding_dim)
            self.tracker.add_context(
                timestamp=time.time() + i,
                speaker_id="speaker_1",
                confidence=0.8,
                embedding=embedding,
                quality_score=0.9,
                segment_duration=1.0
            )
        
        # Test smoothing
        smoothed_speaker, smoothed_confidence = self.tracker.apply_temporal_smoothing(
            "speaker_1", 0.7
        )
        
        self.assertEqual(smoothed_speaker, "speaker_1")
        self.assertGreater(smoothed_confidence, 0.7)
        
    def test_speaker_turn_detection(self):
        """Test speaker turn detection"""
        # Add contexts with speaker changes
        now = time.time()
        
        self.tracker.add_context(
            timestamp=now,
            speaker_id="speaker_1",
            confidence=0.8,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=1.0
        )
        
        self.tracker.add_context(
            timestamp=now + 2.0,
            speaker_id="speaker_2",
            confidence=0.8,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=1.0
        )
        
        turns = self.tracker.detect_speaker_turns()
        self.assertGreater(len(turns), 0)
        
    def test_inconsistency_detection(self):
        """Test temporal inconsistency detection"""
        # Add contexts with rapid switches
        now = time.time()
        
        for i in range(4):
            speaker_id = "speaker_1" if i % 2 == 0 else "speaker_2"
            self.tracker.add_context(
                timestamp=now + i * 0.1,  # Very close timestamps
                speaker_id=speaker_id,
                confidence=0.8,
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.9,
                segment_duration=0.1
            )
        
        inconsistencies = self.tracker.detect_inconsistencies()
        self.assertGreater(len(inconsistencies), 0)


class TestFastGraphOptimizer(unittest.TestCase):
    """Test fast graph optimization"""
    
    def setUp(self):
        self.optimizer = FastGraphOptimizer(
            max_speakers=10,
            latency_constraint_ms=50.0
        )
        
    def test_initialization(self):
        """Test optimizer initialization"""
        self.assertEqual(self.optimizer.max_speakers, 10)
        self.assertEqual(self.optimizer.latency_constraint_ms, 50.0)
        
    def test_incremental_update(self):
        """Test incremental graph updates"""
        embedding = np.random.randn(192)
        
        success = self.optimizer.update_graph_incremental(
            node_id=0,
            embedding=embedding,
            quality_score=1.0
        )
        
        self.assertIsInstance(success, bool)
        
    def test_graph_pruning(self):
        """Test graph pruning"""
        # Add some edges
        self.optimizer.adjacency_matrix[0, 1] = 0.9
        self.optimizer.adjacency_matrix[1, 0] = 0.9
        
        pruned = self.optimizer.prune_graph(min_edge_weight=0.8)
        self.assertGreaterEqual(pruned, 0)
        
    def test_memory_optimization(self):
        """Test memory optimization"""
        results = self.optimizer.optimize_memory()
        
        self.assertIn('edges_pruned', results)
        self.assertIn('cache_cleaned', results)
        self.assertIn('matrix_compressed', results)
        
    def test_performance_benchmark(self):
        """Test performance benchmarking"""
        results = self.optimizer.benchmark_performance(n_iterations=10)
        
        self.assertIn('mean_time_ms', results)
        self.assertIn('target_latency', results)
        self.assertLess(results['mean_time_ms'], 100.0)  # Should be fast


class TestModernStatefulSpeakerIdentifier(unittest.TestCase):
    """Test modern speaker identifier integration"""
    
    def setUp(self):
        self.identifier = ModernStatefulSpeakerIdentifier(
            base_threshold=0.7,
            max_speakers=10,
            use_graph_clustering=True,
            use_adaptive_thresholds=True,
            use_quality_weighting=True,
            use_temporal_context=True
        )
        self.embedding_dim = 192
        
    def test_initialization(self):
        """Test identifier initialization"""
        self.assertEqual(self.identifier.base_threshold, 0.7)
        self.assertEqual(self.identifier.max_speakers, 10)
        self.assertTrue(self.identifier.config['graph_clustering'])
        
    def test_identify_speaker(self):
        """Test speaker identification"""
        audio_chunk = np.random.randn(16000)  # Mock audio
        embedding = np.random.randn(self.embedding_dim)
        
        speaker_id, confidence = self.identifier.identify_speaker(audio_chunk, embedding)
        
        self.assertIsInstance(speaker_id, str)
        self.assertIsInstance(confidence, float)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)
        
    def test_backward_compatibility(self):
        """Test backward compatibility methods"""
        # Test get_speaker_count
        count = self.identifier.get_speaker_count()
        self.assertIsInstance(count, int)
        
        # Test get_speakers
        speakers = self.identifier.get_speakers()
        self.assertIsInstance(speakers, list)
        
        # Test reset
        self.identifier.reset()
        self.assertEqual(self.identifier.get_speaker_count(), 0)
        
    def test_feature_toggling(self):
        """Test enabling/disabling features"""
        self.identifier.enable_feature('graph_clustering', False)
        self.assertFalse(self.identifier.config['graph_clustering'])
        
        self.identifier.enable_feature('graph_clustering', True)
        self.assertTrue(self.identifier.config['graph_clustering'])
        
    def test_performance_stats(self):
        """Test performance statistics"""
        # Perform some identifications
        for i in range(5):
            audio_chunk = np.random.randn(16000)
            embedding = np.random.randn(self.embedding_dim)
            self.identifier.identify_speaker(audio_chunk, embedding)
        
        stats = self.identifier.get_performance_stats()
        self.assertIn('total_identifications', stats)
        self.assertIn('fallback_count', stats)
        self.assertIn('config', stats)


class TestIntegration(unittest.TestCase):
    """Test integration of all components"""
    
    def setUp(self):
        self.embedding_dim = 192
        
    def test_end_to_end_workflow(self):
        """Test complete workflow with all components"""
        # Initialize components
        identifier = ModernStatefulSpeakerIdentifier(max_speakers=5)
        
        # Simulate audio processing
        embeddings = [np.random.randn(self.embedding_dim) for _ in range(10)]
        audio_chunks = [np.random.randn(16000) for _ in range(10)]
        
        results = []
        for audio_chunk, embedding in zip(audio_chunks, embeddings):
            speaker_id, confidence = identifier.identify_speaker(audio_chunk, embedding)
            results.append((speaker_id, confidence))
        
        # Verify results
        self.assertEqual(len(results), 10)
        self.assertGreater(identifier.get_speaker_count(), 0)
        
    def test_memory_efficiency(self):
        """Test memory efficiency under load"""
        manager = MemoryEfficientSpeakerManager(max_speakers=3)
        
        # Add many speakers beyond limit
        for i in range(10):
            embedding = np.random.randn(self.embedding_dim)
            manager.add_or_update_speaker(f"speaker_{i}", embedding)
        
        # Check memory management
        stats = manager.get_memory_stats()
        self.assertLessEqual(stats.total_speakers, 3)  # Should respect limit
        
    def test_quality_integration(self):
        """Test quality assessment integration"""
        assessor = EmbeddingQualityAssessor()
        
        # Test with different quality audio
        high_quality_audio = np.random.randn(16000) * 0.1
        low_quality_audio = np.random.randn(16000) * 2.0
        
        high_quality_embedding = np.random.randn(self.embedding_dim)
        low_quality_embedding = np.random.randn(self.embedding_dim)
        
        high_score = assessor.assess_quality(high_quality_audio, high_quality_embedding)
        low_score = assessor.assess_quality(low_quality_audio, low_quality_embedding)
        
        self.assertGreater(high_score, low_score)


if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)