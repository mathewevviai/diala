#!/usr/bin/env python3
"""
Performance Benchmarks for Task 5: Fast Graph Optimization
Validates real-time performance against Landini et al. (2023) requirements
"""

import time
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple
import json
from src.services.fast_graph_optimizer import FastGraphOptimizer


class FastGraphOptimizerBenchmark:
    """Comprehensive performance benchmarking for FastGraphOptimizer"""
    
    def __init__(self):
        self.embedding_dim = 192
        self.results = {}
        
    def generate_test_data(self, n_speakers: int) -> Dict[int, np.ndarray]:
        """Generate realistic test embeddings"""
        # Create speaker clusters with realistic variations
        base_embeddings = []
        for i in range(n_speakers):
            # Create base speaker embedding
            base = np.random.randn(self.embedding_dim) * 0.1
            base_embeddings.append(base)
        
        # Add variations to create realistic speaker embeddings
        embeddings = {}
        for i in range(n_speakers):
            variation = np.random.randn(self.embedding_dim) * 0.01
            embeddings[i] = base_embeddings[i] + variation
            
        return embeddings
    
    def benchmark_latency_scaling(self) -> Dict[str, List[float]]:
        """Benchmark latency scaling with speaker count"""
        speaker_counts = [5, 10, 20, 30, 50, 75, 100]
        latencies = []
        memory_usage = []
        
        for count in speaker_counts:
            optimizer = FastGraphOptimizer(
                max_speakers=count + 10,
                latency_constraint_ms=100.0
            )
            
            # Generate test data
            embeddings = self.generate_test_data(count)
            
            # Measure latency for single updates
            update_latencies = []
            for speaker_id, embedding in embeddings.items():
                start_time = time.time()
                optimizer.add_or_update_embedding(speaker_id, embedding)
                latency = (time.time() - start_time) * 1000  # ms
                update_latencies.append(latency)
            
            # Record average latency
            avg_latency = np.mean(update_latencies)
            latencies.append(avg_latency)
            
            # Record memory usage
            memory_stats = optimizer.get_memory_usage()
            memory_usage.append(memory_stats['total_memory_mb'])
        
        self.results['latency_scaling'] = {
            'speaker_counts': speaker_counts,
            'latencies': latencies,
            'memory_usage': memory_usage
        }
        
        return self.results['latency_scaling']
    
    def benchmark_batch_processing(self) -> Dict[str, float]:
        """Benchmark batch processing performance"""
        optimizer = FastGraphOptimizer(max_speakers=50)
        embeddings = self.generate_test_data(30)
        
        # Test different batch sizes
        batch_sizes = [1, 5, 10, 20, 30]
        batch_times = []
        
        for batch_size in batch_sizes:
            # Create batch updates
            updates = [
                (i, embeddings[i], 1.0)
                for i in range(min(batch_size, len(embeddings)))
            ]
            
            # Measure batch processing time
            start_time = time.time()
            results = optimizer.batch_update_embeddings(updates)
            batch_time = (time.time() - start_time) * 1000
            
            batch_times.append(batch_time)
        
        self.results['batch_processing'] = {
            'batch_sizes': batch_sizes,
            'batch_times': batch_times,
            'efficiency_gain': batch_times[0] / batch_times[-1] if batch_times[-1] > 0 else 1.0
        }
        
        return self.results['batch_processing']
    
    def benchmark_cache_performance(self) -> Dict[str, float]:
        """Benchmark caching performance"""
        optimizer = FastGraphOptimizer(max_speakers=20)
        embeddings = self.generate_test_data(10)
        
        # Add speakers
        for speaker_id, embedding in embeddings.items():
            optimizer.add_or_update_embedding(speaker_id, embedding)
        
        # Test cache performance
        cache_hits = 0
        cache_misses = 0
        
        # Warm up cache
        for _ in range(50):
            optimizer._calculate_similarity_cached(
                0, 1, embeddings[0]
            )
        
        # Measure cache performance
        initial_stats = optimizer.stats
        for _ in range(100):
            optimizer._calculate_similarity_cached(
                np.random.randint(0, 10), 
                np.random.randint(0, 10),
                embeddings[0]
            )
        
        final_stats = optimizer.stats
        total_queries = final_stats.cache_hits + final_stats.cache_misses - \
                       (initial_stats.cache_hits + initial_stats.cache_misses)
        
        hit_rate = (final_stats.cache_hits - initial_stats.cache_hits) / max(1, total_queries)
        
        self.results['cache_performance'] = {
            'hit_rate': hit_rate,
            'total_queries': total_queries,
            'cache_size': len(optimizer.similarity_cache)
        }
        
        return self.results['cache_performance']
    
    def benchmark_memory_efficiency(self) -> Dict[str, List[float]]:
        """Benchmark memory efficiency scaling"""
        speaker_counts = [5, 10, 20, 30, 50]
        memory_per_speaker = []
        
        for count in speaker_counts:
            optimizer = FastGraphOptimizer(max_speakers=count)
            embeddings = self.generate_test_data(count)
            
            # Add all speakers
            for speaker_id, embedding in embeddings.items():
                optimizer.add_or_update_embedding(speaker_id, embedding)
            
            # Calculate memory per speaker
            memory_stats = optimizer.get_memory_usage()
            memory_per_speaker.append(memory_stats['total_memory_mb'] / count)
        
        self.results['memory_efficiency'] = {
            'speaker_counts': speaker_counts,
            'memory_per_speaker': memory_per_speaker
        }
        
        return self.results['memory_efficiency']
    
    def benchmark_real_time_constraints(self) -> Dict[str, float]:
        """Benchmark real-time processing constraints"""
        optimizer = FastGraphOptimizer(
            max_speakers=50,
            latency_constraint_ms=100.0
        )
        
        # Simulate real-time processing
        embeddings = self.generate_test_data(50)
        violations = 0
        total_updates = 100
        
        start_time = time.time()
        
        for i in range(total_updates):
            speaker_id = i % 50
            update_start = time.time()
            
            optimizer.add_or_update_embedding(
                speaker_id, embeddings[speaker_id]
            )
            
            update_time = (time.time() - update_start) * 1000
            if update_time > 100.0:
                violations += 1
        
        total_time = (time.time() - start_time) * 1000
        
        self.results['real_time_constraints'] = {
            'total_updates': total_updates,
            'violations': violations,
            'violation_rate': violations / total_updates,
            'total_time_ms': total_time,
            'avg_time_per_update_ms': total_time / total_updates
        }
        
        return self.results['real_time_constraints']
    
    def run_all_benchmarks(self) -> Dict[str, any]:
        """Run all benchmarks and return comprehensive results"""
        print("Running Fast Graph Optimizer Benchmarks...")
        print("=" * 50)
        
        # Run individual benchmarks
        print("1. Testing latency scaling...")
        self.benchmark_latency_scaling()
        
        print("2. Testing batch processing...")
        self.benchmark_batch_processing()
        
        print("3. Testing cache performance...")
        self.benchmark_cache_performance()
        
        print("4. Testing memory efficiency...")
        self.benchmark_memory_efficiency()
        
        print("5. Testing real-time constraints...")
        self.benchmark_real_time_constraints()
        
        # Summary
        print("\n" + "=" * 50)
        print("Benchmark Results Summary:")
        print("=" * 50)
        
        # Check against Landini et al. (2023) requirements
        latency_scaling = self.results['latency_scaling']
        real_time = self.results['real_time_constraints']
        
        print(f"✓ Latency scaling: {np.mean(latency_scaling['latencies']):.2f}ms avg")
        print(f"✓ Real-time violation rate: {real_time['violation_rate']:.2%}")
        print(f"✓ Cache hit rate: {self.results['cache_performance']['hit_rate']:.2%}")
        print(f"✓ Batch processing efficiency: {self.results['batch_processing']['efficiency_gain']:.2f}x")
        
        # Validation against requirements
        avg_latency = np.mean(latency_scaling['latencies'])
        violation_rate = real_time['violation_rate']
        
        print("\nValidation against Landini et al. (2023):")
        print(f"  Sub-100ms latency: {'✓ PASS' if avg_latency < 100 else '✗ FAIL'}")
        print(f"  Low violation rate: {'✓ PASS' if violation_rate < 0.05 else '✗ FAIL'}")
        print(f"  Memory scaling: {'✓ PASS' if np.std(latency_scaling['memory_usage']) < 50 else '✗ FAIL'}")
        
        return self.results
    
    def save_results(self, filename: str = "benchmark_results.json"):
        """Save benchmark results to file"""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\nBenchmark results saved to {filename}")


def main():
    """Main benchmarking function"""
    benchmark = FastGraphOptimizerBenchmark()
    
    # Run all benchmarks
    results = benchmark.run_all_benchmarks()
    
    # Save results
    benchmark.save_results()
    
    return results


if __name__ == "__main__":
    results = main()
    
    # Optional: Create visualizations
    try:
        import matplotlib.pyplot as plt
        
        # Create latency scaling plot
        plt.figure(figsize=(12, 8))
        
        # Subplot 1: Latency scaling
        plt.subplot(2, 2, 1)
        speaker_counts = results['latency_scaling']['speaker_counts']
        latencies = results['latency_scaling']['latencies']
        plt.plot(speaker_counts, latencies, 'bo-')
        plt.axhline(y=100, color='r', linestyle='--', label='100ms constraint')
        plt.xlabel('Number of Speakers')
        plt.ylabel('Average Latency (ms)')
        plt.title('Latency Scaling Performance')
        plt.grid(True)
        plt.legend()
        
        # Subplot 2: Memory usage
        plt.subplot(2, 2, 2)
        memory_usage = results['latency_scaling']['memory_usage']
        plt.plot(speaker_counts, memory_usage, 'go-')
        plt.xlabel('Number of Speakers')
        plt.ylabel('Memory Usage (MB)')
        plt.title('Memory Usage Scaling')
        plt.grid(True)
        
        # Subplot 3: Batch processing efficiency
        plt.subplot(2, 2, 3)
        batch_sizes = results['batch_processing']['batch_sizes']
        batch_times = results['batch_processing']['batch_times']
        plt.plot(batch_sizes, batch_times, 'ro-')
        plt.xlabel('Batch Size')
        plt.ylabel('Processing Time (ms)')
        plt.title('Batch Processing Performance')
        plt.grid(True)
        
        # Subplot 4: Cache performance
        plt.subplot(2, 2, 4)
        cache_performance = results['cache_performance']
        labels = ['Cache Hits', 'Cache Misses']
        sizes = [cache_performance['hit_rate'], 1 - cache_performance['hit_rate']]
        plt.pie(sizes, labels=labels, autopct='%1.1f%%')
        plt.title('Cache Performance')
        
        plt.tight_layout()
        plt.savefig('fast_graph_optimizer_benchmarks.png', dpi=300, bbox_inches='tight')
        print("\nBenchmark visualizations saved to fast_graph_optimizer_benchmarks.png")
        
    except ImportError:
        print("\nMatplotlib not available for visualization")
    
    print("\nTask 5 Fast Graph Optimization benchmarks completed successfully!")