# backend/src/services/speaker_profile.py
import numpy as np
import time
from dataclasses import dataclass, field
from typing import List

@dataclass
class SpeakerProfile:
    """Optimized data model for a single speaker."""
    speaker_id: str
    centroid: np.ndarray
    
    # Activity and Quality Tracking
    last_seen_timestamp: float = field(default_factory=time.time)
    update_count: int = 1
    total_quality: float = 0.0

    def update(self, embedding: np.ndarray, quality_score: float):
        """Update the speaker's profile with a new embedding."""
        # Weighted average to update the centroid
        new_weight = quality_score
        old_weight = self.update_count
        self.centroid = ((self.centroid * old_weight) + (embedding * new_weight)) / (old_weight + new_weight)
        
        self.update_count += 1
        self.last_seen_timestamp = time.time()
        self.total_quality += quality_score

    @property
    def average_quality(self) -> float:
        """Calculate the average quality of embeddings for this speaker."""
        return self.total_quality / self.update_count if self.update_count > 0 else 0