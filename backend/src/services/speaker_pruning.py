"""
Speaker pruning strategies for memory-efficient speaker management
"""
import time
from typing import Dict, List

def get_inactive_speaker_ids(
    profiles: Dict[str, object], 
    inactivity_threshold_seconds: float
) -> List[str]:
    """
    Identifies speakers who haven't been seen recently.
    
    Args:
        profiles: Dictionary of speaker profiles
        inactivity_threshold_seconds: Time threshold for inactivity
        
    Returns:
        List of speaker IDs that are inactive
    """
    inactive_ids = []
    current_time = time.time()
    for speaker_id, profile in profiles.items():
        # Note: This assumes profile has last_seen_timestamp attribute
        # If using SpeakerProfile from speaker_profile.py, use last_seen instead
        if hasattr(profile, 'last_seen'):
            last_seen = profile.last_seen
        elif hasattr(profile, 'last_seen_timestamp'):
            last_seen = profile.last_seen_timestamp
        else:
            continue
            
        if current_time - last_seen > inactivity_threshold_seconds:
            inactive_ids.append(speaker_id)
    return inactive_ids


def should_prune_speaker(profile: object, inactivity_threshold: float) -> bool:
    """
    Determine if a speaker should be pruned based on inactivity.
    
    Args:
        profile: Speaker profile object
        inactivity_threshold: Time threshold in seconds
        
    Returns:
        True if speaker should be pruned
    """
    current_time = time.time()
    if hasattr(profile, 'last_seen'):
        last_seen = profile.last_seen
    elif hasattr(profile, 'last_seen_timestamp'):
        last_seen = profile.last_seen_timestamp
    else:
        return False
        
    return current_time - last_seen > inactivity_threshold