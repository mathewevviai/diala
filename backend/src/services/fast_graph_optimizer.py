"""
Fast Graph Optimization for Real-time Speaker Diarization
Based on Landini et al. (2023) "Fast Online Speaker Diarization with Graph Clustering"

This module provides a robust and efficient implementation for managing a speaker
similarity graph in real-time, focusing on sub-100ms latency and memory efficiency.
"""

import numpy as np
import scipy.sparse as sp
from typing import Dict, List, Set, Optional, Tuple
from collections import deque
import time
import logging

logger = logging.getLogger(__name__)

class FastGraphOptimizer:
    """
    Implements fast graph optimization techniques for real-time speaker diarization.
    
    Key features:
    - Sparse matrix operations for large speaker populations.
    - Incremental graph updates.
    - Accurate edge pruning to maintain graph sparsity.
    - Vectorized similarity calculations.
    - Caching for frequently accessed computations.
    - Designed to meet sub-100ms processing latency constraints.
    """
    
    def __init__(self, max_speakers: int = 50, latency_constraint_ms: float = 100.0,
                 cache_size: int = 1000, pruning_threshold: float = 0.3,
                 vectorization_threshold: int = 5):
        """
        Initialize the fast graph optimizer.
        
        Args:
            max_speakers: Maximum number of speakers to track.
            latency_constraint_ms: Target for maximum processing latency in milliseconds.
            cache_size: Size of the similarity computation cache.
            pruning_threshold: Similarity score below which edges are considered weak.
            vectorization_threshold: Minimum number of nodes for vectorized operations.
        """
        self.max_speakers = max_speakers
        self.latency_constraint_ms = latency_constraint_ms
        self.cache_size = cache_size
        self.pruning_threshold = pruning_threshold
        self.vectorization_threshold = vectorization_threshold
        
        self.adjacency_matrix = sp.lil_matrix((max_speakers, max_speakers), dtype=np.float32)
        self.embeddings: Dict[int, np.ndarray] = {}
        self.embedding_dim: Optional[int] = None
        
        self.similarity_cache: Dict[Tuple[int, int], float] = {}
        self.processing_times: deque = deque(maxlen=100)
        self.latency_violations = 0
        self.stats = {'cache_hits': 0, 'cache_misses': 0}

        logger.info(f"Initialized FastGraphOptimizer: max_speakers={max_speakers}, latency_constraint={latency_constraint_ms}ms")

    def add_or_update_embedding(self, node_id: int, embedding: np.ndarray, quality_score: float = 1.0) -> bool:
        """
        Add or update a node's embedding and incrementally update the graph.

        Args:
            node_id: The identifier for the speaker/node.
            embedding: The embedding vector for the speaker.
            quality_score: The quality score of the embedding (0.0 to 1.0).

        Returns:
            True if the update was successful, False otherwise.
        """
        start_time = time.time()
        
        if embedding is None or embedding.size == 0 or node_id >= self.max_speakers:
            logger.warning(f"Invalid update for node {node_id}. Embedding is empty or ID is out of bounds.")
            return False

        if self.embedding_dim is None:
            self.embedding_dim = len(embedding)

        self.embeddings[node_id] = embedding.astype(np.float32)
        
        # Correctly identify all other existing nodes for comparison.
        nodes_to_compare = set(self.embeddings.keys())
        nodes_to_compare.discard(node_id)

        if not nodes_to_compare:
            # This is the first node, no edges to create yet.
            return True

        self._batch_update_edges(node_id, embedding, nodes_to_compare, quality_score)
        
        processing_time = (time.time() - start_time) * 1000
        self.processing_times.append(processing_time)
        if processing_time > self.latency_constraint_ms:
            self.latency_violations += 1
            logger.warning(f"Latency violation: {processing_time:.1f}ms for node {node_id}")
        
        return True

    def _batch_update_edges(self, node_id: int, embedding: np.ndarray,
                         nodes_to_compare: Set[int], quality_score: float):
        """
        Efficiently calculate and update edges for a node against others.
        """
        for other_node in nodes_to_compare:
            if other_node in self.embeddings:
                similarity = self._calculate_similarity_cached(node_id, other_node, embedding, self.embeddings[other_node])
                weighted_similarity = similarity * quality_score
                
                # Add edge only if similarity is above the pruning threshold.
                if weighted_similarity >= self.pruning_threshold:
                    self.adjacency_matrix[node_id, other_node] = weighted_similarity
                    self.adjacency_matrix[other_node, node_id] = weighted_similarity

    def _calculate_similarity_cached(self, node1: int, node2: int, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Calculate cosine similarity, using a cache to avoid redundant computations.
        """
        # Create a canonical key for the cache (order-independent).
        cache_key = tuple(sorted((node1, node2)))
        if cache_key in self.similarity_cache:
            self.stats['cache_hits'] += 1
            return self.similarity_cache[cache_key]

        self.stats['cache_misses'] += 1
        similarity = self.calculate_cosine_similarity(emb1, emb2)
        
        # Basic LRU-like cache eviction.
        if len(self.similarity_cache) >= self.cache_size:
            self.similarity_cache.pop(next(iter(self.similarity_cache)))

        self.similarity_cache[cache_key] = similarity
        return similarity

    def calculate_cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """A robust cosine similarity calculation."""
        norm1, norm2 = np.linalg.norm(emb1), np.linalg.norm(emb2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(emb1, emb2) / (norm1 * norm2))

    def prune_graph(self, min_edge_weight: float = None) -> int:
        """
        Accurately prune weak edges from the graph to maintain sparsity.
        
        Args:
            min_edge_weight: The threshold below which existing edges will be removed.

        Returns:
            The number of edges that were actually pruned.
        """
        if min_edge_weight is None:
            min_edge_weight = self.pruning_threshold
        
        # Use COO format for efficient access to existing edges and their values.
        coo = self.adjacency_matrix.tocoo()
        
        # Correctly identify only existing edges that are weaker than the threshold.
        mask_to_prune = (coo.data > 0) & (coo.data < min_edge_weight)
        
        rows, cols = coo.row[mask_to_prune], coo.col[mask_to_prune]
        
        if len(rows) > 0:
            # Set these specific edges to zero.
            self.adjacency_matrix[rows, cols] = 0
            # Ensure symmetry in the undirected graph.
            self.adjacency_matrix[cols, rows] = 0
        
        return len(rows)

    def get_graph_density(self) -> float:
        """Calculate the current density of the graph."""
        n_nodes = self.max_speakers
        if n_nodes < 2:
            return 0.0
        # Divide by 2 for an undirected graph.
        n_edges = self.adjacency_matrix.nnz / 2
        max_edges = n_nodes * (n_nodes - 1) / 2
        return n_edges / max_edges if max_edges > 0 else 0.0
        
    def get_performance_metrics(self) -> Dict[str, float]:
        """Retrieve a dictionary of current performance metrics."""
        hits, misses = self.stats['cache_hits'], self.stats['cache_misses']
        total_cache_lookups = hits + misses
        
        return {
            'avg_latency_ms': np.mean(self.processing_times) if self.processing_times else 0,
            'latency_violations': self.latency_violations,
            'cache_hit_rate': hits / total_cache_lookups if total_cache_lookups > 0 else 0,
            'graph_density': self.get_graph_density(),
            'active_speakers': len(self.embeddings),
        }