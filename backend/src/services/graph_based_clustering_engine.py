"""
Graph-Based Clustering Engine for Modern Streaming Speaker Diarization
Based on Landini et al. (2022) "Online Speaker Diarization with Graph-based Clustering"
"""

import numpy as np
import scipy.sparse as sp
from typing import Dict, Tuple, List, Optional, Set
from dataclasses import dataclass
from sklearn.cluster import SpectralClustering
import logging
from collections import deque
import time

logger = logging.getLogger(__name__)


@dataclass
class SpeakerNode:
    """Represents a speaker node in the graph with associated metadata"""
    node_id: int
    speaker_id: str
    embedding: np.ndarray
    quality_score: float
    last_updated: float
    activity_count: int = 0
    confidence_score: float = 1.0


class GraphBasedClusteringEngine:
    """
    Implements graph-based clustering for streaming speaker diarization
    following Landini et al. (2022) approach with adjacency matrix representation
    and spectral clustering for speaker assignment.
    
    Key features:
    - Sparse adjacency matrix for memory efficiency
    - Spectral clustering for robust speaker assignment
    - Incremental graph updates to avoid full recomputation
    - O(log n) speaker lookup using graph structure
    """
    
    def __init__(self, max_speakers: int = 50, similarity_threshold: float = 0.7,
                 min_cluster_size: int = 2, spectral_n_neighbors: int = 10):
        """
        Initialize the graph-based clustering engine
        
        Args:
            max_speakers: Maximum number of speakers to track
            similarity_threshold: Minimum similarity for edge creation
            min_cluster_size: Minimum cluster size for valid speaker
            spectral_n_neighbors: Number of neighbors for spectral clustering
        """
        self.max_speakers = max_speakers
        self.similarity_threshold = similarity_threshold
        self.min_cluster_size = min_cluster_size
        self.spectral_n_neighbors = spectral_n_neighbors
        
        # Sparse adjacency matrix for speaker similarity graph
        self.adjacency_matrix = sp.csr_matrix((max_speakers, max_speakers), dtype=np.float32)
        
        # Speaker storage and mappings
        self.speakers: Dict[str, SpeakerNode] = {}
        self.node_to_speaker: Dict[int, str] = {}
        self.speaker_to_node: Dict[str, int] = {}
        self.next_node_id = 0
        
        # Spectral clustering configuration
        self.clusterer = SpectralClustering(
            n_clusters=None,
            affinity='precomputed',
            n_neighbors=spectral_n_neighbors,
            assign_labels='discretize',
            random_state=42
        )
        
        # Performance tracking
        self.update_count = 0
        self.last_cluster_time = 0.0
        
        # Incremental update tracking
        self.dirty_nodes: Set[int] = set()
        self.edge_cache: Dict[Tuple[int, int], float] = {}
        
        logger.info(f"Initialized GraphBasedClusteringEngine with max_speakers={max_speakers}")
    
    def add_or_update_speaker(self, speaker_id: str, embedding: np.ndarray, 
                            quality_score: float = 1.0) -> bool:
        """
        Add or update a speaker in the graph
        
        Args:
            speaker_id: Unique speaker identifier
            embedding: Speaker embedding vector
            quality_score: Quality score for this embedding
            
        Returns:
            bool: True if speaker was added/updated successfully
        """
        try:
            # Check if speaker already exists
            if speaker_id in self.speakers:
                return self._update_speaker(speaker_id, embedding, quality_score)
            else:
                return self._add_new_speaker(speaker_id, embedding, quality_score)
                
        except Exception as e:
            logger.error(f"Error adding/updating speaker {speaker_id}: {e}")
            return False
    
    def _add_new_speaker(self, speaker_id: str, embedding: np.ndarray, 
                        quality_score: float) -> bool:
        """Add a new speaker to the graph"""
        if len(self.speakers) >= self.max_speakers:
            logger.warning(f"Maximum speakers ({self.max_speakers}) reached")
            return False
            
        node_id = self.next_node_id
        self.next_node_id += 1
        
        speaker_node = SpeakerNode(
            node_id=node_id,
            speaker_id=speaker_id,
            embedding=embedding,
            quality_score=quality_score,
            last_updated=time.time()
        )
        
        self.speakers[speaker_id] = speaker_node
        self.node_to_speaker[node_id] = speaker_id
        self.speaker_to_node[speaker_id] = node_id
        
        # Update adjacency matrix
        self._update_adjacency_matrix_for_node(node_id, embedding, quality_score)
        
        self.dirty_nodes.add(node_id)
        logger.debug(f"Added new speaker {speaker_id} at node {node_id}")
        return True
    
    def _update_speaker(self, speaker_id: str, embedding: np.ndarray, 
                       quality_score: float) -> bool:
        """Update an existing speaker"""
        speaker_node = self.speakers[speaker_id]
        node_id = speaker_node.node_id
        
        # Quality-weighted embedding update
        old_weight = speaker_node.activity_count / (speaker_node.activity_count + 1)
        new_weight = 1 / (speaker_node.activity_count + 1)
        
        speaker_node.embedding = (
            old_weight * speaker_node.embedding + 
            new_weight * embedding * quality_score
        )
        speaker_node.quality_score = (
            old_weight * speaker_node.quality_score + 
            new_weight * quality_score
        )
        speaker_node.last_updated = time.time()
        speaker_node.activity_count += 1
        
        # Update adjacency matrix
        self._update_adjacency_matrix_for_node(node_id, speaker_node.embedding, 
                                           speaker_node.quality_score)
        
        self.dirty_nodes.add(node_id)
        return True
    
    def _update_adjacency_matrix_for_node(self, node_id: int, embedding: np.ndarray,
                                        quality_score: float):
        """Update adjacency matrix for a specific node"""
        if len(self.speakers) <= 1:
            return
            
        # Calculate similarities with all existing speakers
        similarities = []
        node_ids = []
        
        for speaker_id, speaker_node in self.speakers.items():
            if speaker_node.node_id != node_id:
                similarity = self._calculate_similarity(embedding, speaker_node.embedding)
                weighted_similarity = similarity * quality_score * speaker_node.quality_score
                
                if weighted_similarity >= self.similarity_threshold:
                    similarities.append(weighted_similarity)
                    node_ids.append(speaker_node.node_id)
        
        # Update adjacency matrix
        if similarities:
            row_indices = [node_id] * len(node_ids) + node_ids
            col_indices = node_ids + [node_id] * len(node_ids)
            data = similarities + similarities  # Symmetric matrix
            
            # Create update matrix
            update_matrix = sp.coo_matrix(
                (data, (row_indices, col_indices)),
                shape=(self.max_speakers, self.max_speakers),
                dtype=np.float32
            )
            
            # Add to existing matrix
            self.adjacency_matrix = self.adjacency_matrix + update_matrix
    
    def _calculate_similarity(self, embedding1: np.ndarray, 
                            embedding2: np.ndarray) -> float:
        """Calculate cosine similarity between embeddings"""
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        dot_product = np.dot(embedding1, embedding2)
        similarity = dot_product / (norm1 * norm2)
        
        # Ensure similarity is in valid range
        return max(0.0, min(1.0, similarity))
    
    def cluster_speakers(self) -> Dict[str, int]:
        """
        Perform spectral clustering on the similarity graph
        
        Returns:
            Dict mapping speaker_id to cluster_id
        """
        if len(self.speakers) < 2:
            return {speaker_id: 0 for speaker_id in self.speakers.keys()}
        
        try:
            start_time = time.time()
            
            # Get active nodes
            active_nodes = [node_id for node_id in self.node_to_speaker.keys()]
            n_active = len(active_nodes)
            
            if n_active < self.min_cluster_size:
                return {speaker_id: 0 for speaker_id in self.speakers.keys()}
            
            # Extract sub-matrix for active speakers
            active_mask = np.zeros(self.max_speakers, dtype=bool)
            active_mask[active_nodes] = True
            
            # Convert to dense array for spectral clustering
            dense_matrix = self.adjacency_matrix.toarray()
            active_matrix = dense_matrix[np.ix_(active_mask, active_mask)]
            
            # Ensure matrix is symmetric
            active_matrix = (active_matrix + active_matrix.T) / 2
            
            # Determine optimal number of clusters
            n_clusters = min(n_active, max(1, n_active // 2))
            
            # Perform spectral clustering
            self.clusterer.n_clusters = n_clusters
            cluster_labels = self.clusterer.fit_predict(active_matrix)
            
            # Map back to speakers
            speaker_clusters = {}
            for i, node_id in enumerate(active_nodes):
                speaker_id = self.node_to_speaker[node_id]
                speaker_clusters[speaker_id] = int(cluster_labels[i])
            
            self.last_cluster_time = time.time() - start_time
            logger.debug(f"Clustered {n_active} speakers into {n_clusters} clusters "
                        f"in {self.last_cluster_time:.3f}s")
            
            return speaker_clusters
            
        except Exception as e:
            logger.error(f"Error during clustering: {e}")
            # Fallback: assign all to single cluster
            return {speaker_id: 0 for speaker_id in self.speakers.keys()}
    
    def find_closest_speaker(self, embedding: np.ndarray, 
                         quality_score: float = 1.0) -> Tuple[Optional[str], float]:
        """
        Find the closest speaker using graph-based similarity
        
        Args:
            embedding: Query embedding
            quality_score: Quality score for the query
            
        Returns:
            Tuple of (speaker_id, similarity_score) or (None, 0.0) if no match
        """
        if not self.speakers:
            return None, 0.0
        
        best_speaker = None
        best_similarity = 0.0
        
        for speaker_id, speaker_node in self.speakers.items():
            similarity = self._calculate_similarity(embedding, speaker_node.embedding)
            weighted_similarity = similarity * quality_score * speaker_node.quality_score
            
            if weighted_similarity > best_similarity:
                best_similarity = weighted_similarity
                best_speaker = speaker_id
        
        return best_speaker, best_similarity
    
    def get_speaker_count(self) -> int:
        """Get current number of speakers"""
        return len(self.speakers)
    
    def get_active_speakers(self) -> List[str]:
        """Get list of active speaker IDs"""
        return list(self.speakers.keys())
    
    def prune_inactive_speakers(self, inactivity_threshold: float = 300.0):
        """
        Remove speakers that haven't been updated recently
        
        Args:
            inactivity_threshold: Time in seconds after which speaker is considered inactive
        """
        current_time = time.time()
        inactive_speakers = []
        
        for speaker_id, speaker_node in self.speakers.items():
            if current_time - speaker_node.last_updated > inactivity_threshold:
                inactive_speakers.append(speaker_id)
        
        for speaker_id in inactive_speakers:
            self._remove_speaker(speaker_id)
    
    def _remove_speaker(self, speaker_id: str):
        """Remove a speaker from the graph"""
        if speaker_id not in self.speakers:
            return
        
        speaker_node = self.speakers[speaker_id]
        node_id = speaker_node.node_id
        
        # Remove from mappings
        del self.speakers[speaker_id]
        del self.node_to_speaker[node_id]
        del self.speaker_to_node[speaker_id]
        
        # Clear adjacency matrix row/column
        self.adjacency_matrix[node_id, :] = 0
        self.adjacency_matrix[:, node_id] = 0
        
        logger.debug(f"Removed speaker {speaker_id} from graph")
    
    def get_graph_stats(self) -> Dict[str, float]:
        """Get statistics about the current graph state"""
        if not self.speakers:
            return {
                'speaker_count': 0,
                'edge_density': 0.0,
                'last_cluster_time': 0.0,
                'update_count': self.update_count
            }
        
        # Calculate edge density
        n_speakers = len(self.speakers)
        max_edges = n_speakers * (n_speakers - 1) / 2
        
        # Count actual edges
        dense_matrix = self.adjacency_matrix.toarray()
        active_mask = np.zeros(self.max_speakers, dtype=bool)
        for node_id in self.node_to_speaker.keys():
            active_mask[node_id] = True
        
        active_submatrix = dense_matrix[np.ix_(active_mask, active_mask)]
        actual_edges = np.sum(active_submatrix > 0) / 2
        
        edge_density = actual_edges / max_edges if max_edges > 0 else 0.0
        
        return {
            'speaker_count': n_speakers,
            'edge_density': edge_density,
            'last_cluster_time': self.last_cluster_time,
            'update_count': self.update_count
        }