#!/usr/bin/env python3
"""
Comprehensive tests for Task 5: Fast Graph Optimization
Based on Landini et al. (2023) "Fast Online Speaker Diarization with Graph Clustering"

This test suite validates the FastGraphOptimizer implementation including:
- Sparse matrix operations for large speaker populations
- Incremental graph updates with dirty node tracking
- Real-time performance optimizations (< 100ms latency)
- Vectorized similarity calculations
- Memory-efficient operations
"""

import unittest
import numpy as np
import time
import tempfile
import os
from unittest.mock import Mock, patch
import scipy.sparse as sp

from src.services.fast_graph_optimizer import FastGraphOptimizer, OptimizationStats


class TestFastGraphOptimizer(unittest.TestCase):
    """Test suite for Fast Graph Optimization (Task 5)"""

    def setUp(self):
        """Set up test environment"""
        self.embedding_dim = 192
        self.max_speakers = 50
        self.latency_constraint = 100.0  # 100ms
        
        self.optimizer = FastGraphOptimizer(
            max_speakers=self.max_speakers,
            latency_constraint_ms=self.latency_constraint,
            cache_size=1000,
            pruning_threshold=0.3,
            vectorization_threshold=5
        )
        
        # Generate test embeddings
        self.test_embeddings = {
            i: np.random.randn(self.embedding_dim).astype(np.float32)
            for i in range(10)
        }

    def test_initialization(self):
        """Test optimizer initialization"""
        self.assertEqual(self.optimizer.max_speakers, self.max_speakers)
        self.assertEqual(self.optimizer.latency_constraint_ms, self.latency_constraint)
        self.assertEqual(self.optimizer.pruning_threshold, 0.3)
        self.assertEqual(len(self.optimizer.processing_times), 0)

    def test_sparse_matrix_operations(self):
        """Test 5.1.1: Sparse matrix operations for large speaker populations"""
        # Test with varying speaker counts
        for speaker_count in [5, 20, 50]:
            optimizer = FastGraphOptimizer(max_speakers=speaker_count)
            
            # Add speakers
            for i in range(speaker_count):
                embedding = np.random.randn(self.embedding_dim)
                optimizer.add_or_update_embedding(i, embedding)
            
            # Verify sparse matrix properties
            self.assertIsInstance(optimizer.adjacency_matrix, sp.lil_matrix)
            self.assertIsInstance(optimizer.adjacency_matrix_csr, sp.csr_matrix)
            
            # Check matrix dimensions
            self.assertEqual(optimizer.adjacency_matrix.shape, (speaker_count, speaker_count))
            
            # Verify sparsity (should be sparse for large populations)
            density = optimizer.get_graph_density()
            self.assertLess(density, 0.5)  # Should remain sparse

    def test_incremental_updates(self):
        """Test 5.1.2: Incremental graph update tracking with dirty node sets"""
        # Add initial speakers
        for i in range(3):
            self.optimizer.add_or_update_embedding(i, self.test_embeddings[i])
        
        # Verify dirty nodes tracking
        initial_dirty_count = len(self.optimizer.dirty_nodes)
        
        # Add new speaker
        result = self.optimizer.add_or_update_embedding(3, self.test_embeddings[3])
        self.assertTrue(result)
        
        # Check that node was marked as dirty
        self.assertIn(3, self.optimizer.dirty_nodes)
        
        # Verify processing time is tracked
        self.assertGreater(len(self.optimizer.processing_times), 0)

    def test_edge_pruning(self):
        """Test 5.1.3: Edge pruning for maintaining graph sparsity"""
        # Add multiple speakers
        for i in range(10):
            self.optimizer.add_or_update_embedding(i, self.test_embeddings[i])
        
        # Get initial edge count
        initial_edges = self.optimizer.adjacency_matrix.nnz
        
        # Prune edges
        pruned_count = self.optimizer.prune_graph(min_edge_weight=0.5)
        
        # Verify pruning occurred
        self.assertGreaterEqual(pruned_count, 0)
        
        # Check final edge count
        final_edges = self.optimizer.adjacency_matrix.nnz
        self.assertLessEqual(final_edges, initial_edges)
        
        # Verify graph density is maintained
        density = self.optimizer.get_graph_density()
        self.assertLessEqual(density, 1.0)

    def test_vectorized_calculations(self):
        """Test 5.1.4: Vectorized similarity calculations for performance"""
        # Add speakers
        speakers = list(range(5))
        for i in speakers:
            self.optimizer.add_or_update_embedding(i, self.test_embeddings[i])
        
        # Test vectorized similarity calculation
        embeddings_dict = {i: self.test_embeddings[i] for i in speakers}
        
        start_time = time.time()
        similarity_matrix = self.optimizer.calculate_similarity_matrix(embeddings_dict)
        vectorized_time = time.time() - start_time
        
        # Verify matrix properties
        self.assertIsInstance(similarity_matrix, sp.csr_matrix)
        self.assertEqual(similarity_matrix.shape, (len(speakers), len(speakers)))
        
        # Test performance (should be fast)
        self.assertLess(vectorized_time, 1.0)  # Less than 1 second

    def test_latency_constraints(self):
        """Test 5.2.1: Sub-100ms processing latency constraints"""
        # Test with strict latency constraint
        strict_optimizer = FastGraphOptimizer(latency_constraint_ms=10.0)
        
        latencies = []
        for i in range(20):
            start_time = time.time()
            result = strict_optimizer.add_or_update_embedding(
                i, self.test_embeddings[i % 10]
            )
            
            latency = time.time() - start_time
            latencies.append(latency * 1000)  # Convert to ms
            
            # Check if operation completed
            self.assertIsInstance(result, bool)
        
        # Verify average latency is below constraint
        avg_latency = np.mean(latencies)
        self.assertLess(avg_latency, 100.0)  # Should be well under 100ms

    def test_caching_mechanism(self):
        """Test 5.2.2: Caching for frequently accessed similarity computations"""
        # Add speakers
        for i in range(5):
            self.optimizer.add_or_update_embedding(i, self.test_embeddings[i])
        
        # Perform multiple similarity calculations
        for _ in range(10):
            similarity = self.optimizer._calculate_similarity_cached(
                0, 1, self.test_embeddings[0]
            )
            self.assertIsInstance(similarity, float)
            self.assertGreaterEqual(similarity, 0.0)
            self.assertLessEqual(similarity, 1.0)
        
        # Verify cache statistics
        stats = self.optimizer.stats
        self.assertGreater(stats.cache_hits + stats.cache_misses, 0)
        
        # Calculate cache hit rate
        hit_rate = stats.cache_hits / max(1, stats.cache_hits + stats.cache_misses)
        self.assertGreaterEqual(hit_rate, 0.0)

    def test_batch_processing(self):
        """Test 5.2.3: Batch processing for multiple embedding updates"""
        # Create batch updates
        batch_updates = [
            (i, self.test_embeddings[i % 10], 1.0)
            for i in range(20)
        ]
        
        # Process batch
        start_time = time.time()
        results = self.optimizer.batch_update_embeddings(batch_updates)
        batch_time = time.time() - start_time
        
        # Verify batch results
        self.assertIsInstance(results, dict)
        self.assertEqual(results['processed'], 20)
        self.assertEqual(results['failed'], 0)
        self.assertLess(results['avg_time_ms'], 100.0)
        
        # Verify batch processing is efficient
        self.assertLess(batch_time, 2.0)  # Should be very fast

    def test_memory_efficiency(self):
        """Test memory usage scaling with speaker count"""
        memory_usage = []
        
        # Test scaling from 5 to 50 speakers
        for speaker_count in [5, 10, 20, 30, 50]:
            optimizer = FastGraphOptimizer(max_speakers=speaker_count)
            
            for i in range(speaker_count):
                optimizer.add_or_update_embedding(i, self.test_embeddings[i % 10])
            
            memory_stats = optimizer.get_memory_usage()
            memory_usage.append(memory_stats['total_memory_mb'])
        
        # Verify memory scales reasonably (should be roughly linear)
        memory_increase = np.diff(memory_usage)
        self.assertLess(np.max(memory_increase), 50.0)  # Reasonable increase per speaker

    def test_performance_benchmarks(self):
        """Test 5.2.4: Performance benchmarks and latency measurements"""
        # Add speakers for testing
        for i in range(10):
            self.optimizer.add_or_update_embedding(i, self.test_embeddings[i])
        
        # Run benchmarks
        benchmark_results = self.optimizer.benchmark_performance(n_iterations=50)
        
        # Verify benchmark results
        self.assertIn('mean_time_ms', benchmark_results)
        self.assertIn('target_latency', benchmark_results)
        self.assertLess(benchmark_results['mean_time_ms'], self.latency_constraint)
        
        # Check performance metrics
        metrics = self.optimizer.get_performance_metrics()
        self.assertIn('avg_latency_ms', metrics)
        self.assertIn('graph_density', metrics)
        self.assertIn('memory_usage_mb', metrics)

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        # Test empty embedding
        result = self.optimizer.add_or_update_embedding(0, np.array([]))
        self.assertFalse(result)
        
        # Test None embedding
        result = self.optimizer.add_or_update_embedding(0, None)
        self.assertFalse(result)
        
        # Test node ID out of bounds
        result = self.optimizer.add_or_update_embedding(
            self.max_speakers + 1, self.test_embeddings[0]
        )
        self.assertFalse(result)
        
        # Test with single speaker
        optimizer = FastGraphOptimizer(max_speakers=1)
        result = optimizer.add_or_update_embedding(0, self.test_embeddings[0])
        self.assertTrue(result)
        
        # Test graph density for single speaker
        density = optimizer.get_graph_density()
        self.assertEqual(density, 0.0)

    def test_integration_with_clustering_engine(self):
        """Test integration with clustering components"""
        # Simulate integration with graph clustering engine
        speaker_embeddings = {}
        
        # Add speakers with realistic embeddings
        for speaker_id in range(8):
            # Create more realistic speaker embeddings
            base = np.random.randn(self.embedding_dim) * 0.1
            variation = np.random.randn(self.embedding_dim) * 0.01
            speaker_embeddings[speaker_id] = base + variation
        
        # Test similarity matrix calculation
        similarity_matrix = self.optimizer.calculate_similarity_matrix(speaker_embeddings)
        
        # Verify matrix properties
        self.assertEqual(similarity_matrix.shape, (8, 8))
        
        # Check sparsity (should be sparse)
        density = similarity_matrix.nnz / (8 * 8)
        self.assertLess(density, 0.5)

    def test_cache_performance(self):
        """Test cache performance under load"""
        # Add speakers
        for i in range(5):
            self.optimizer.add_or_update_embedding(i, self.test_embeddings[i])
        
        # Perform many similarity calculations
        for _ in range(100):
            similarity = self.optimizer._calculate_similarity_cached(
                np.random.randint(0, 5), np.random.randint(0, 5),
                self.test_embeddings[0]
            )
        
        # Check cache statistics
        stats = self.optimizer.stats
        self.assertGreater(stats.cache_hits + stats.cache_misses, 50)

    def test_real_time_constraints(self):
        """Test real-time processing constraints"""
        # Test with realistic load
        load_optimizer = FastGraphOptimizer(
            max_speakers=20,
            latency_constraint_ms=50.0
        )
        
        # Simulate real-time processing
        start_time = time.time()
        violations = 0
        
        for i in range(100):
            update_start = time.time()
            result = load_optimizer.add_or_update_embedding(
                i % 20, self.test_embeddings[i % 10]
            )
            update_time = (time.time() - update_start) * 1000
            
            if update_time > 50.0:
                violations += 1
        
        total_time = time.time() - start_time
        
        # Verify real-time constraints
        self.assertLess(total_time, 10.0)  # Should complete quickly
        self.assertLess(violations, 10)  # Few violations expected


class TestFastGraphOptimizerIntegration(unittest.TestCase):
    """Integration tests for FastGraphOptimizer"""

    def setUp(self):
        self.embedding_dim = 192
        self.optimizer = FastGraphOptimizer(max_speakers=10)

    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow"""
        # Step 1: Initialize speakers
        speakers = {
            0: np.random.randn(self.embedding_dim) * 0.1,
            1: np.random.randn(self.embedding_dim) * 0.1,
            2: np.random.randn(self.embedding_dim) * 0.1
        }
        
        # Step 2: Add speakers incrementally
        for speaker_id, embedding in speakers.items():
            self.optimizer.add_or_update_embedding(speaker_id, embedding)
        
        # Step 3: Verify graph construction
        self.assertEqual(len(self.optimizer.embeddings), 3)
        self.assertGreater(self.optimizer.adjacency_matrix.nnz, 0)
        
        # Step 4: Test similarity calculations
        similarity = self.optimizer.calculate_cosine_similarity(
            speakers[0], speakers[1]
        )
        self.assertGreaterEqual(similarity, 0.0)
        self.assertLessEqual(similarity, 1.0)
        
        # Step 5: Test performance metrics
        metrics = self.optimizer.get_performance_metrics()
        self.assertIsInstance(metrics, dict)
        self.assertIn('avg_latency_ms', metrics)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)