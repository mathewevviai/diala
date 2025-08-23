"""
Memory-Efficient Speaker Management System
Based on Cornell et al. (2022) "Memory-Efficient Streaming Speaker Diarization"
"""

import numpy as np
import time
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import deque, defaultdict
import threading
import psutil
import gc

logger = logging.getLogger(__name__)


@dataclass
class SpeakerProfile:
    """Enhanced speaker profile with memory tracking"""
    speaker_id: str
    centroid: np.ndarray
    embedding_history: deque  # Limited history for memory efficiency
    quality_weighted_count: float
    confidence_score: float
    last_seen: float
    activity_level: float
    total_segments: int
    memory_usage: int  # Track memory usage in bytes
    
    def __post_init__(self):
        # Calculate memory usage
        self.memory_usage = (
            self.centroid.nbytes +
            sum(emb.nbytes for emb in self.embedding_history) +
            100  # Overhead for other fields
        )


@dataclass
class MemoryUsageStats:
    """Memory usage statistics"""
    total_speakers: int
    total_memory_mb: float
    peak_memory_mb: float
    inactive_speakers: int
    avg_speaker_memory_mb: float
    memory_threshold_exceeded: bool


class MemoryEfficientSpeakerManager:
    """
    Implements memory-efficient speaker management strategies following Cornell et al. (2022)
    
    Key features:
    - Speaker profile storage with activity tracking
    - Memory usage monitoring and threshold detection
    - Sliding window management for long audio streams
    - Temporal decay for inactive speaker centroids
    - Hierarchical clustering for merging similar speakers
    - Emergency pruning for memory overflow situations
    """
    
    def __init__(self, max_speakers: int = 50, memory_threshold_mb: int = 100,
                 inactivity_threshold: float = 300.0, merge_similarity_threshold: float = 0.9,
                 embedding_history_size: int = 10):
        """
        Initialize memory-efficient speaker manager
        
        Args:
            max_speakers: Maximum number of speakers to track
            memory_threshold_mb: Memory threshold in MB
            inactivity_threshold: Time in seconds after which speaker is inactive
            merge_similarity_threshold: Similarity threshold for merging speakers
            embedding_history_size: Maximum embeddings to store per speaker
        """
        self.max_speakers = max_speakers
        self.memory_threshold_mb = memory_threshold_mb
        self.inactivity_threshold = inactivity_threshold
        self.merge_similarity_threshold = merge_similarity_threshold
        self.embedding_history_size = embedding_history_size
        
        # Speaker storage
        self.speakers: Dict[str, SpeakerProfile] = {}
        self.speaker_lock = threading.RLock()
        
        # Memory tracking
        self.memory_stats = MemoryUsageStats(0, 0.0, 0.0, 0, 0.0, False)
        self.last_memory_check = 0
        self.memory_check_interval = 30  # seconds
        
        # Performance metrics
        self.pruning_count = 0
        self.merging_count = 0
        self.emergency_pruning_count = 0
        
        logger.info(f"Initialized MemoryEfficientSpeakerManager: "
                   f"max_speakers={max_speakers}, "
                   f"memory_threshold={memory_threshold_mb}MB")
    
    def add_or_update_speaker(self, speaker_id: str, embedding: np.ndarray,
                            quality_score: float = 1.0) -> bool:
        """
        Add or update a speaker with memory-efficient storage
        
        Args:
            speaker_id: Unique speaker identifier
            embedding: Speaker embedding vector
            quality_score: Quality score for this embedding
            
        Returns:
            bool: True if speaker was added/updated successfully
        """
        with self.speaker_lock:
            try:
                # Check memory before adding
                self._check_memory_usage()
                
                if speaker_id in self.speakers:
                    return self._update_existing_speaker(speaker_id, embedding, quality_score)
                else:
                    return self._add_new_speaker(speaker_id, embedding, quality_score)
                    
            except Exception as e:
                logger.error(f"Error adding/updating speaker {speaker_id}: {e}")
                return False
    
    def _add_new_speaker(self, speaker_id: str, embedding: np.ndarray,
                       quality_score: float) -> bool:
        """Add a new speaker with memory checks"""
        if len(self.speakers) >= self.max_speakers:
            logger.warning("Max speakers reached, attempting to prune inactive speakers")
            self.prune_inactive_speakers()
            
            if len(self.speakers) >= self.max_speakers:
                logger.warning("Cannot add new speaker, max speakers limit reached")
                return False
        
        # Check memory threshold
        if self._is_memory_threshold_exceeded():
            logger.warning("Memory threshold exceeded, triggering emergency pruning")
            self._emergency_pruning()
        
        # Create new speaker profile
        speaker_profile = SpeakerProfile(
            speaker_id=speaker_id,
            centroid=embedding.copy(),
            embedding_history=deque(maxlen=self.embedding_history_size),
            quality_weighted_count=quality_score,
            confidence_score=quality_score,
            last_seen=time.time(),
            activity_level=quality_score,
            total_segments=1,
            memory_usage=0
        )
        
        # Add first embedding to history
        speaker_profile.embedding_history.append(embedding)
        
        self.speakers[speaker_id] = speaker_profile
        logger.debug(f"Added new speaker {speaker_id}")
        
        return True
    
    def _update_existing_speaker(self, speaker_id: str, embedding: np.ndarray,
                               quality_score: float) -> bool:
        """Update an existing speaker with quality-weighted updates"""
        speaker_profile = self.speakers[speaker_id]
        
        # Quality-weighted centroid update
        old_weight = speaker_profile.quality_weighted_count
        new_weight = quality_score
        
        speaker_profile.centroid = (
            (old_weight * speaker_profile.centroid + new_weight * embedding) /
            (old_weight + new_weight)
        )
        
        # Update history
        speaker_profile.embedding_history.append(embedding.copy())
        
        # Update metadata
        speaker_profile.quality_weighted_count += quality_score
        speaker_profile.last_seen = time.time()
        speaker_profile.activity_level = min(1.0, speaker_profile.activity_level + 0.1)
        speaker_profile.total_segments += 1
        
        return True
    
    def find_closest_speaker(self, embedding: np.ndarray,
                           quality_score: float = 1.0) -> Tuple[Optional[str], float]:
        """
        Find the closest speaker using memory-efficient similarity search
        
        Args:
            embedding: Query embedding
            quality_score: Quality score for the query
            
        Returns:
            Tuple of (speaker_id, similarity_score)
        """
        with self.speaker_lock:
            if not self.speakers:
                return None, 0.0
            
            best_speaker = None
            best_similarity = 0.0
            
            for speaker_id, speaker_profile in self.speakers.items():
                similarity = self._calculate_similarity(embedding, speaker_profile.centroid)
                weighted_similarity = similarity * quality_score * speaker_profile.confidence_score
                
                if weighted_similarity > best_similarity:
                    best_similarity = weighted_similarity
                    best_speaker = speaker_id
            
            return best_speaker, best_similarity
    
    def _calculate_similarity(self, embedding1: np.ndarray,
                            embedding2: np.ndarray) -> float:
        """Calculate cosine similarity between embeddings"""
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        dot_product = np.dot(embedding1, embedding2)
        similarity = dot_product / (norm1 * norm2)
        
        return max(0.0, min(1.0, similarity))
    
    def prune_inactive_speakers(self) -> int:
        """
        Remove speakers that haven't been active recently
        
        Returns:
            int: Number of speakers removed
        """
        with self.speaker_lock:
            current_time = time.time()
            inactive_speakers = []
            
            for speaker_id, speaker_profile in self.speakers.items():
                if current_time - speaker_profile.last_seen > self.inactivity_threshold:
                    inactive_speakers.append(speaker_id)
            
            for speaker_id in inactive_speakers:
                self._remove_speaker(speaker_id)
            
            self.pruning_count += len(inactive_speakers)
            logger.info(f"Pruned {len(inactive_speakers)} inactive speakers")
            
            return len(inactive_speakers)
    
    def merge_similar_speakers(self, similarity_threshold: Optional[float] = None) -> int:
        """
        Merge highly similar speakers to reduce memory usage
        
        Args:
            similarity_threshold: Override for merge threshold
            
        Returns:
            int: Number of mergers performed
        """
        if similarity_threshold is None:
            similarity_threshold = self.merge_similarity_threshold
            
        with self.speaker_lock:
            if len(self.speakers) < 2:
                return 0
            
            mergers = 0
            speakers_to_merge = []
            
            # Find similar speaker pairs
            speaker_list = list(self.speakers.items())
            for i, (id1, profile1) in enumerate(speaker_list):
                for j in range(i + 1, len(speaker_list)):
                    id2, profile2 = speaker_list[j]
                    
                    similarity = self._calculate_similarity(
                        profile1.centroid, profile2.centroid
                    )
                    
                    if similarity >= similarity_threshold:
                        # Prefer to merge less active speaker into more active one
                        if profile1.activity_level >= profile2.activity_level:
                            speakers_to_merge.append((id1, id2, similarity))
                        else:
                            speakers_to_merge.append((id2, id1, similarity))
            
            # Perform mergers
            for target_id, source_id, similarity in speakers_to_merge:
                if source_id in self.speakers and target_id in self.speakers:
                    self._merge_speakers(target_id, source_id, similarity)
                    mergers += 1
            
            self.merging_count += mergers
            logger.info(f"Merged {mergers} similar speakers")
            return mergers
    
    def _merge_speakers(self, target_id: str, source_id: str, similarity: float):
        """Merge source speaker into target speaker"""
        target_profile = self.speakers[target_id]
        source_profile = self.speakers[source_id]
        
        # Weighted merge based on activity levels
        target_weight = target_profile.activity_level
        source_weight = source_profile.activity_level
        
        total_weight = target_weight + source_weight
        
        # Merge centroids
        target_profile.centroid = (
            (target_weight * target_profile.centroid + 
             source_weight * source_profile.centroid) / total_weight
        )
        
        # Update metadata
        target_profile.quality_weighted_count += source_profile.quality_weighted_count
        target_profile.total_segments += source_profile.total_segments
        target_profile.activity_level = min(1.0, target_profile.activity_level + 0.1)
        
        # Merge embedding histories
        for emb in source_profile.embedding_history:
            if len(target_profile.embedding_history) < self.embedding_history_size:
                target_profile.embedding_history.append(emb)
        
        # Remove source speaker
        self._remove_speaker(source_id)
        
        logger.debug(f"Merged speaker {source_id} into {target_id} "
                    f"(similarity={similarity:.3f})")
    
    def apply_temporal_decay(self, decay_factor: float = 0.95):
        """
        Apply temporal decay to speaker centroids for long streams
        
        Args:
            decay_factor: Decay factor (0.95 = 5% decay per application)
        """
        with self.speaker_lock:
            decayed_speakers = 0
            
            for speaker_profile in self.speakers.values():
                # Decay activity level
                speaker_profile.activity_level *= decay_factor
                
                # Decay confidence score
                speaker_profile.confidence_score *= decay_factor
                
                # Update last seen to prevent immediate pruning
                speaker_profile.last_seen = time.time()
                
                decayed_speakers += 1
            
            logger.debug(f"Applied temporal decay to {decayed_speakers} speakers")
    
    def _emergency_pruning(self):
        """Emergency pruning when memory threshold is exceeded"""
        logger.warning("Emergency pruning triggered due to memory threshold")
        
        # Remove least active speakers first
        sorted_speakers = sorted(
            self.speakers.items(),
            key=lambda x: (x[1].activity_level, x[1].last_seen)
        )
        
        # Remove 20% of speakers or until memory is acceptable
        to_remove = max(1, len(sorted_speakers) // 5)
        
        for i in range(min(to_remove, len(sorted_speakers))):
            speaker_id, _ = sorted_speakers[i]
            self._remove_speaker(speaker_id)
        
        self.emergency_pruning_count += to_remove
        logger.warning(f"Emergency pruning removed {to_remove} speakers")
    
    def _remove_speaker(self, speaker_id: str):
        """Remove a speaker from storage"""
        if speaker_id in self.speakers:
            del self.speakers[speaker_id]
            logger.debug(f"Removed speaker {speaker_id}")
    
    def _check_memory_usage(self):
        """Check current memory usage"""
        current_time = time.time()
        
        if current_time - self.last_memory_check < self.memory_check_interval:
            return
            
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            current_memory_mb = memory_info.rss / 1024 / 1024
            
            # Calculate speaker memory usage
            speaker_memory_mb = 0
            for speaker_profile in self.speakers.values():
                speaker_memory_mb += speaker_profile.memory_usage / 1024 / 1024
            
            self.memory_stats = MemoryUsageStats(
                total_speakers=len(self.speakers),
                total_memory_mb=current_memory_mb,
                peak_memory_mb=max(self.memory_stats.peak_memory_mb, current_memory_mb),
                inactive_speakers=self._count_inactive_speakers(),
                avg_speaker_memory_mb=speaker_memory_mb / max(1, len(self.speakers)),
                memory_threshold_exceeded=current_memory_mb > self.memory_threshold_mb
            )
            
            self.last_memory_check = current_time
            
        except Exception as e:
            logger.error(f"Error checking memory usage: {e}")
    
    def _is_memory_threshold_exceeded(self) -> bool:
        """Check if memory threshold is exceeded"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            current_memory_mb = memory_info.rss / 1024 / 1024
            return current_memory_mb > self.memory_threshold_mb
        except:
            return False
    
    def _count_inactive_speakers(self) -> int:
        """Count inactive speakers"""
        current_time = time.time()
        inactive_count = 0
        
        for speaker_profile in self.speakers.values():
            if current_time - speaker_profile.last_seen > self.inactivity_threshold:
                inactive_count += 1
        
        return inactive_count
    
    def get_memory_stats(self) -> MemoryUsageStats:
        """Get current memory usage statistics"""
        self._check_memory_usage()
        return self.memory_stats
    
    def get_speaker_count(self) -> int:
        """Get current number of speakers"""
        return len(self.speakers)
    
    def get_speaker_ids(self) -> List[str]:
        """Get list of all speaker IDs"""
        return list(self.speakers.keys())
    
    def reset_statistics(self):
        """Reset performance counters"""
        self.pruning_count = 0
        self.merging_count = 0
        self.emergency_pruning_count = 0
    
    def clear_all_speakers(self):
        """Clear all speakers (for testing/debugging)"""
        with self.speaker_lock:
            self.speakers.clear()
            logger.info("Cleared all speakers")