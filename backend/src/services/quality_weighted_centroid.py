#!/usr/bin/env python3
"""
Quality-Weighted Centroid Update Module for Modern Streaming Speaker Diarization

This module implements quality-aware centroid updates following research from:
- Bredin & Laurent (2021) "Robust Speaker Embeddings for Streaming Diarization" (ICASSP 2021)

The implementation uses quality-weighted aggregation instead of naive averaging:
new_centroid = (old_centroid * old_weight + current_embedding * quality_score) / (old_weight + quality_score)
"""

import numpy as np
import logging
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class QualityWeightedProfile:
    """
    Enhanced speaker profile with quality-weighted centroid management.
    
    Following Bredin & Laurent (2021) approach for robust speaker embeddings
    with quality-aware aggregation and confidence tracking.
    """
    speaker_id: str
    centroid: np.ndarray
    quality_weighted_count: float  # Sum of quality weights, not just sample count
    total_samples: int             # Actual number of samples for statistics
    confidence_score: float        # Overall profile confidence
    last_seen: datetime
    creation_time: datetime
    
    # Quality statistics for monitoring
    avg_quality: float = 0.0
    min_quality: float = 1.0
    max_quality: float = 0.0

class QualityWeightedCentroidManager:
    """
    Manages speaker centroids with quality-weighted updates following
    Bredin & Laurent (2021) robust embedding aggregation methodology.
    """
    
    def __init__(self, min_quality_threshold: float = 0.3, confidence_decay: float = 0.95):
        """
        Initialize quality-weighted centroid manager.
        
        Args:
            min_quality_threshold: Minimum quality for centroid updates (Bredin & Laurent 2021)
            confidence_decay: Decay factor for confidence over time
        """
        self.min_quality_threshold = min_quality_threshold
        self.confidence_decay = confidence_decay
        self.speaker_profiles: Dict[str, QualityWeightedProfile] = {}
        
        logger.info(f"QualityWeightedCentroidManager initialized with quality threshold: {min_quality_threshold}")
    
    def should_update_centroid(self, quality_score: float) -> bool:
        """
        Determine if embedding quality is sufficient for centroid updates.
        
        Following Bredin & Laurent (2021) quality-aware aggregation approach.
        
        Args:
            quality_score: Quality score from EmbeddingQualityAssessor
            
        Returns:
            True if quality meets threshold for centroid update
        """
        return quality_score >= self.min_quality_threshold
    
    def create_speaker_profile(self, speaker_id: str, embedding: np.ndarray, quality_score: float) -> QualityWeightedProfile:
        """
        Create new speaker profile with initial embedding and quality.
        
        Args:
            speaker_id: Unique speaker identifier
            embedding: Initial speaker embedding
            quality_score: Quality score for initial embedding
            
        Returns:
            New QualityWeightedProfile instance
        """
        current_time = datetime.now()
        
        profile = QualityWeightedProfile(
            speaker_id=speaker_id,
            centroid=embedding.copy(),
            quality_weighted_count=quality_score,
            total_samples=1,
            confidence_score=quality_score,
            last_seen=current_time,
            creation_time=current_time,
            avg_quality=quality_score,
            min_quality=quality_score,
            max_quality=quality_score
        )
        
        self.speaker_profiles[speaker_id] = profile
        logger.info(f"Created speaker profile: {speaker_id} with quality: {quality_score:.3f}")
        
        return profile
    
    def update_centroid(self, speaker_id: str, new_embedding: np.ndarray, quality_score: float) -> bool:
        """
        Update speaker centroid using quality-weighted aggregation.
        
        Implements Bredin & Laurent (2021) formula:
        new_centroid = (old_centroid * old_weight + current_embedding * quality_score) / (old_weight + quality_score)
        
        Args:
            speaker_id: Speaker to update
            new_embedding: New embedding to incorporate
            quality_score: Quality score for new embedding
            
        Returns:
            True if update was performed, False if rejected due to quality
        """
        if not self.should_update_centroid(quality_score):
            logger.debug(f"Rejecting centroid update for {speaker_id}: quality {quality_score:.3f} below threshold {self.min_quality_threshold}")
            return False
        
        if speaker_id not in self.speaker_profiles:
            self.create_speaker_profile(speaker_id, new_embedding, quality_score)
            return True
        
        profile = self.speaker_profiles[speaker_id]
        
        # Quality-weighted centroid update following Bredin & Laurent (2021)
        old_centroid = profile.centroid
        old_weight = profile.quality_weighted_count
        
        # Calculate new centroid with quality weighting
        new_centroid = (old_centroid * old_weight + new_embedding * quality_score) / (old_weight + quality_score)
        
        # Update profile with new centroid and statistics
        profile.centroid = new_centroid
        profile.quality_weighted_count += quality_score
        profile.total_samples += 1
        profile.last_seen = datetime.now()
        
        # Update quality statistics
        profile.avg_quality = ((profile.avg_quality * (profile.total_samples - 1)) + quality_score) / profile.total_samples
        profile.min_quality = min(profile.min_quality, quality_score)
        profile.max_quality = max(profile.max_quality, quality_score)
        
        # Update confidence score with quality weighting
        # Higher quality samples increase confidence more
        confidence_boost = quality_score * 0.1  # Moderate boost for high quality
        profile.confidence_score = min(1.0, profile.confidence_score + confidence_boost)
        
        logger.debug(f"Updated centroid for {speaker_id}: quality={quality_score:.3f}, "
                    f"weighted_count={profile.quality_weighted_count:.2f}, confidence={profile.confidence_score:.3f}")
        
        return True
    
    def get_centroid(self, speaker_id: str) -> Optional[np.ndarray]:
        """
        Get current centroid for speaker.
        
        Args:
            speaker_id: Speaker identifier
            
        Returns:
            Current centroid or None if speaker not found
        """
        if speaker_id in self.speaker_profiles:
            return self.speaker_profiles[speaker_id].centroid.copy()
        return None
    
    def get_profile_confidence(self, speaker_id: str) -> float:
        """
        Get confidence score for speaker profile.
        
        Args:
            speaker_id: Speaker identifier
            
        Returns:
            Confidence score [0, 1] or 0.0 if speaker not found
        """
        if speaker_id in self.speaker_profiles:
            return self.speaker_profiles[speaker_id].confidence_score
        return 0.0
    
    def get_profile_statistics(self, speaker_id: str) -> Optional[Dict]:
        """
        Get detailed statistics for speaker profile.
        
        Args:
            speaker_id: Speaker identifier
            
        Returns:
            Dictionary with profile statistics or None if not found
        """
        if speaker_id not in self.speaker_profiles:
            return None
        
        profile = self.speaker_profiles[speaker_id]
        
        return {
            "speaker_id": profile.speaker_id,
            "total_samples": profile.total_samples,
            "quality_weighted_count": profile.quality_weighted_count,
            "confidence_score": profile.confidence_score,
            "avg_quality": profile.avg_quality,
            "min_quality": profile.min_quality,
            "max_quality": profile.max_quality,
            "last_seen": profile.last_seen.isoformat(),
            "creation_time": profile.creation_time.isoformat(),
            "age_seconds": (datetime.now() - profile.creation_time).total_seconds()
        }
    
    def apply_temporal_decay(self, decay_factor: float = None) -> None:
        """
        Apply temporal decay to confidence scores for aging profiles.
        
        Following Bredin & Laurent (2021) approach for handling temporal drift.
        
        Args:
            decay_factor: Optional decay factor, uses default if None
        """
        if decay_factor is None:
            decay_factor = self.confidence_decay
        
        current_time = datetime.now()
        
        for speaker_id, profile in self.speaker_profiles.items():
            # Calculate time since last update
            time_since_update = (current_time - profile.last_seen).total_seconds()
            
            # Apply decay based on time elapsed (more decay for older profiles)
            if time_since_update > 60:  # Start decay after 1 minute of inactivity
                time_decay = np.exp(-time_since_update / 300)  # 5-minute half-life
                profile.confidence_score *= (decay_factor * time_decay)
                
                logger.debug(f"Applied temporal decay to {speaker_id}: "
                           f"confidence={profile.confidence_score:.3f}, inactive_time={time_since_update:.1f}s")
    
    def prune_low_confidence_profiles(self, min_confidence: float = 0.1) -> int:
        """
        Remove speaker profiles with very low confidence scores.
        
        Args:
            min_confidence: Minimum confidence to retain profile
            
        Returns:
            Number of profiles removed
        """
        to_remove = []
        
        for speaker_id, profile in self.speaker_profiles.items():
            if profile.confidence_score < min_confidence:
                to_remove.append(speaker_id)
        
        for speaker_id in to_remove:
            del self.speaker_profiles[speaker_id]
            logger.info(f"Pruned low-confidence profile: {speaker_id}")
        
        return len(to_remove)
    
    def get_all_centroids(self) -> Dict[str, np.ndarray]:
        """
        Get all current speaker centroids.
        
        Returns:
            Dictionary mapping speaker_id to centroid
        """
        return {speaker_id: profile.centroid.copy() 
                for speaker_id, profile in self.speaker_profiles.items()}
    
    def get_speaker_count(self) -> int:
        """
        Get current number of active speaker profiles.
        
        Returns:
            Number of speaker profiles
        """
        return len(self.speaker_profiles)
    
    def clear_all_profiles(self) -> None:
        """
        Clear all speaker profiles (for testing or reset).
        """
        count = len(self.speaker_profiles)
        self.speaker_profiles.clear()
        logger.info(f"Cleared {count} speaker profiles")