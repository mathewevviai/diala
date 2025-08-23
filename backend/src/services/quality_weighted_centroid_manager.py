#!/usr/bin/env python3
"""
Quality-Weighted Centroid Management for Modern Streaming Speaker Diarization

This module implements quality-aware centroid updates following research from:
- Bredin & Laurent (2021) "Robust Speaker Embeddings for Streaming Diarization" (ICASSP 2021)

Key improvements over naive averaging:
1. Quality-weighted embedding aggregation
2. Selective centroid updates based on quality thresholds
3. Running quality statistics per speaker
4. Centroid drift prevention through quality filtering
"""

import logging
import numpy as np
from typing import Dict, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime
import time

logger = logging.getLogger(__name__)

@dataclass
class QualityWeightedSpeakerProfile:
    """
    Enhanced speaker profile with quality-aware centroid management.
    
    Following Bredin & Laurent (2021) approach for robust speaker embeddings
    with quality-weighted aggregation and drift prevention.
    """
    speaker_id: str
    centroid: np.ndarray
    quality_weighted_count: float  # Sum of quality scores instead of simple count
    total_embeddings: int          # Total number of embeddings processed
    average_quality: float         # Running average of embedding qualities
    last_updated: datetime
    creation_time: datetime = field(default_factory=datetime.now)
    
    # Quality statistics for monitoring
    quality_history: list = field(default_factory=list)
    max_history_length: int = 50  # Keep last 50 quality scores
    
    def update_quality_stats(self, quality_score: float):
        """Update running quality statistics for this speaker."""
        self.quality_history.append(quality_score)
        if len(self.quality_history) > self.max_history_length:
            self.quality_history.pop(0)
        
        # Update running average quality
        self.average_quality = np.mean(self.quality_history)

class QualityWeightedCentroidManager:
    """
    Manages speaker centroids with quality-aware updates following Bredin & Laurent (2021).
    
    Key features:
    - Quality-weighted centroid aggregation: new_centroid = (old_centroid * old_weight + current_embedding * quality_score) / (old_weight + quality_score)
    - Selective updates based on quality thresholds
    - Centroid drift prevention through quality filtering
    - Running quality statistics per speaker
    """
    
    def __init__(self, 
                 min_quality_threshold: float = 0.3,
                 quality_decay_factor: float = 0.95,
                 max_quality_weight: float = 10.0):
        """
        Initialize quality-weighted centroid manager.
        
        Args:
            min_quality_threshold: Minimum quality score for centroid updates
            quality_decay_factor: Decay factor for older quality weights (0.95 = 5% decay)
            max_quality_weight: Maximum weight for any single embedding to prevent dominance
        """
        self.speaker_profiles: Dict[str, QualityWeightedSpeakerProfile] = {}
        self.min_quality_threshold = min_quality_threshold
        self.quality_decay_factor = quality_decay_factor
        self.max_quality_weight = max_quality_weight
        
        # Statistics tracking
        self.total_updates_attempted = 0
        self.total_updates_accepted = 0
        self.total_updates_rejected = 0
        
        logger.info(f"QualityWeightedCentroidManager initialized with threshold={min_quality_threshold}, "
                   f"decay_factor={quality_decay_factor}, max_weight={max_quality_weight}")

    def create_speaker_profile(self, speaker_id: str, embedding: np.ndarray, quality_score: float) -> QualityWeightedSpeakerProfile:
        """
        Create new speaker profile with initial embedding and quality score.
        
        Args:
            speaker_id: Unique identifier for the speaker
            embedding: Initial speaker embedding vector
            quality_score: Quality score for the initial embedding
            
        Returns:
            Newly created speaker profile
        """
        # Ensure embedding is properly normalized
        if np.linalg.norm(embedding) > 0:
            embedding = embedding / np.linalg.norm(embedding)
        
        profile = QualityWeightedSpeakerProfile(
            speaker_id=speaker_id,
            centroid=embedding.copy(),
            quality_weighted_count=quality_score,
            total_embeddings=1,
            average_quality=quality_score,
            last_updated=datetime.now()
        )
        
        profile.update_quality_stats(quality_score)
        self.speaker_profiles[speaker_id] = profile
        
        logger.info(f"Created speaker profile for {speaker_id} with initial quality {quality_score:.3f}")
        return profile

    def should_update_centroid(self, quality_score: float, speaker_profile: Optional[QualityWeightedSpeakerProfile] = None) -> Tuple[bool, str]:
        """
        Determine if centroid should be updated based on quality score and speaker history.
        
        Following Bredin & Laurent (2021) methodology for quality-based update decisions.
        
        Args:
            quality_score: Quality score of the new embedding
            speaker_profile: Existing speaker profile (if any)
            
        Returns:
            Tuple of (should_update: bool, reason: str)
        """
        self.total_updates_attempted += 1
        
        # Basic quality threshold check
        if quality_score < self.min_quality_threshold:
            self.total_updates_rejected += 1
            return False, f"Quality {quality_score:.3f} below threshold {self.min_quality_threshold}"
        
        # Additional checks for existing speakers
        if speaker_profile is not None:
            # Prevent updates that would significantly degrade average quality
            quality_degradation_threshold = 0.2  # Don't allow >20% quality drop
            if (speaker_profile.average_quality - quality_score) > quality_degradation_threshold:
                self.total_updates_rejected += 1
                return False, f"Quality {quality_score:.3f} would degrade average {speaker_profile.average_quality:.3f}"
            
            # Check for very low quality compared to speaker's history
            if len(speaker_profile.quality_history) > 5:
                min_historical_quality = np.min(speaker_profile.quality_history[-10:])  # Last 10 samples
                if quality_score < min_historical_quality * 0.7:  # 30% below historical minimum
                    self.total_updates_rejected += 1
                    return False, f"Quality {quality_score:.3f} significantly below historical minimum {min_historical_quality:.3f}"
        
        self.total_updates_accepted += 1
        return True, "Quality acceptable for centroid update"

    def update_centroid(self, speaker_id: str, embedding: np.ndarray, quality_score: float) -> Tuple[bool, str]:
        """
        Update speaker centroid using quality-weighted aggregation.
        
        Implements Bredin & Laurent (2021) quality-weighted centroid update:
        new_centroid = (old_centroid * old_weight + current_embedding * quality_score) / (old_weight + quality_score)
        
        Args:
            speaker_id: Speaker identifier
            embedding: New embedding vector
            quality_score: Quality score for the new embedding
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        # Normalize embedding
        if np.linalg.norm(embedding) > 0:
            embedding = embedding / np.linalg.norm(embedding)
        else:
            return False, "Zero-norm embedding c    t be used for centroid update"
        
        # Get or create speaker profile
        if speaker_id not in self.speaker_profiles:
            self.create_speaker_profile(speaker_id, embedding, quality_score)
            return True, f"Created new speaker profile for {speaker_id}"
        
        profile = self.speaker_profiles[speaker_id]
        
        # Check if update should proceed
        should_update, reason = self.should_update_centroid(quality_score, profile)
        if not should_update:
            logger.debug(f"Rejecting centroid update for {speaker_id}: {reason}")
            return False, reason
        
        # Apply quality decay to existing weight (Bredin & Laurent 2021 temporal weighting)
        decayed_old_weight = profile.quality_weighted_count * self.quality_decay_factor
        
        # Limit maximum weight to prevent single embedding dominance
        effective_quality_score = min(quality_score, self.max_quality_weight)
        
        # Quality-weighted centroid update following Bredin & Laurent (2021)
        old_centroid = profile.centroid
        new_weight = decayed_old_weight + effective_quality_score
        
        updated_centroid = (old_centroid * decayed_old_weight + embedding * effective_quality_score) / new_weight
        
        # Normalize the updated centroid
        if np.linalg.norm(updated_centroid) > 0:
            updated_centroid = updated_centroid / np.linalg.norm(updated_centroid)
        
        # Update profile
        profile.centroid = updated_centroid
        profile.quality_weighted_count = new_weight
        profile.total_embeddings += 1
        profile.last_updated = datetime.now()
        profile.update_quality_stats(quality_score)
        
        logger.debug(f"Updated centroid for {speaker_id}: quality={quality_score:.3f}, "
                    f"new_weight={new_weight:.2f}, avg_quality={profile.average_quality:.3f}")
        
        return True, f"Successfully updated centroid for {speaker_id}"

    def get_centroid(self, speaker_id: str) -> Optional[np.ndarray]:
        """
        Get current centroid for a speaker.
        
        Args:
            speaker_id: Speaker identifier
            
        Returns:
            Centroid vector or None if speaker doesn't exist
        """
        if speaker_id in self.speaker_profiles:
            return self.speaker_profiles[speaker_id].centroid.copy()
        return None

    def get_speaker_quality_stats(self, speaker_id: str) -> Optional[Dict]:
        """
        Get quality statistics for a speaker.
        
        Args:
            speaker_id: Speaker identifier
            
        Returns:
            Dictionary with quality statistics or None if speaker doesn't exist
        """
        if speaker_id not in self.speaker_profiles:
            return None
        
        profile = self.speaker_profiles[speaker_id]
        return {
            'speaker_id': speaker_id,
            'total_embeddings': profile.total_embeddings,
            'quality_weighted_count': profile.quality_weighted_count,
            'average_quality': profile.average_quality,
            'recent_qualities': profile.quality_history[-10:],  # Last 10 quality scores
            'last_updated': profile.last_updated.isoformat(),
            'age_seconds': (datetime.now() - profile.creation_time).total_seconds()
        }

    def get_all_speakers(self) -> list:
        """Get list of all known speaker IDs."""
        return list(self.speaker_profiles.keys())

    def remove_speaker(self, speaker_id: str) -> bool:
        """
        Remove a speaker profile.
        
        Args:
            speaker_id: Speaker identifier to remove
            
        Returns:
            True if speaker was removed, False if not found
        """
        if speaker_id in self.speaker_profiles:
            del self.speaker_profiles[speaker_id]
            logger.info(f"Removed speaker profile for {speaker_id}")
            return True
        return False

    def get_manager_statistics(self) -> Dict:
        """
        Get overall manager statistics for monitoring and debugging.
        
        Returns:
            Dictionary with manager performance statistics
        """
        total_speakers = len(self.speaker_profiles)
        avg_quality = 0.0
        total_embeddings = 0
        
        if total_speakers > 0:
            qualities = [profile.average_quality for profile in self.speaker_profiles.values()]
            avg_quality = np.mean(qualities)
            total_embeddings = sum(profile.total_embeddings for profile in self.speaker_profiles.values())
        
        acceptance_rate = 0.0
        if self.total_updates_attempted > 0:
            acceptance_rate = self.total_updates_accepted / self.total_updates_attempted
        
        return {
            'total_speakers': total_speakers,
            'total_embeddings_processed': total_embeddings,
            'average_speaker_quality': avg_quality,
            'updates_attempted': self.total_updates_attempted,
            'updates_accepted': self.total_updates_accepted,
            'updates_rejected': self.total_updates_rejected,
            'acceptance_rate': acceptance_rate,
            'quality_threshold': self.min_quality_threshold
        }