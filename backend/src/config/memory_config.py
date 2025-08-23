# backend/src/config/memory_config.py
from dataclasses import dataclass

@dataclass
class MemoryConfig:
    """Configuration for memory-efficient speaker management."""
    max_speakers: int = 50
    memory_threshold_mb: float = 256.0  # MB
    inactive_threshold_seconds: float = 300.0  # 5 minutes
    merge_similarity_threshold: float = 0.90
    temporal_decay_factor: float = 0.995