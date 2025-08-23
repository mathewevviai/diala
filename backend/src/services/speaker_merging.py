"""
Hierarchical clustering for merging similar speakers
"""
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import pdist
from typing import Dict, List, Tuple


def merge_similar_speakers(
    profiles: Dict[str, object],
    inactive_ids: List[str],
    merge_similarity_threshold: float
) -> Tuple[Dict[str, object], List[str]]:
    """
    Merges highly similar inactive speakers using hierarchical clustering.
    
    Args:
        profiles: Dictionary of speaker profiles
        inactive_ids: List of inactive speaker IDs to consider for merging
        merge_similarity_threshold: Similarity threshold for merging
        
    Returns:
        Tuple of (updated profiles, list of merged speaker IDs)
    """
    if len(inactive_ids) < 2:
        return profiles, []

    # Get centroids of inactive speakers
    try:
        inactive_centroids = np.array([profiles[sid].centroid for sid in inactive_ids])
    except (KeyError, AttributeError):
        # Fallback if some speakers don't exist or don't have centroids
        return profiles, []

    try:
        # Calculate pairwise distances and perform clustering
        # 'pdist' calculates condensed distance matrix, 'linkage' performs clustering
        distance_matrix = pdist(inactive_centroids, metric='cosine')
        linkage_matrix = linkage(distance_matrix, method='average')
        
        # Form flat clusters based on the similarity threshold
        cluster_labels = fcluster(
            linkage_matrix, 
            1 - merge_similarity_threshold, # fcluster uses distance, not similarity
            criterion='distance'
        )

        # Group speaker IDs by their new cluster label
        merge_groups: Dict[int, List[str]] = {}
        for i, speaker_id in enumerate(inactive_ids):
            label = cluster_labels[i]
            if label not in merge_groups:
                merge_groups[label] = []
            merge_groups[label].append(speaker_id)

        merged_ids = []
        for label, group in merge_groups.items():
            if len(group) > 1:
                # Merge the profiles within this group
                profiles, removed_ids = _perform_merge(profiles, group)
                merged_ids.extend(removed_ids)
                
        return profiles, merged_ids
        
    except Exception:
        # Fallback if clustering fails
        return profiles, []


def _perform_merge(
    profiles: Dict[str, object], 
    group_to_merge: List[str]
) -> Tuple[Dict[str, object], List[str]]:
    """
    Helper function to merge a group of speaker profiles into one.
    
    Args:
        profiles: Dictionary of speaker profiles
        group_to_merge: List of speaker IDs to merge
        
    Returns:
        Tuple of (updated profiles, list of removed speaker IDs)
    """
    if len(group_to_merge) < 2:
        return profiles, []
    
    try:
        # Select the profile with the highest update count as the base
        base_speaker_id = max(group_to_merge, key=lambda sid: 
                             getattr(profiles[sid], 'update_count', 1))
        
        removed_ids = []
        for speaker_id in group_to_merge:
            if speaker_id != base_speaker_id:
                # Merge other profiles into the base profile
                base_profile = profiles[base_speaker_id]
                source_profile = profiles[speaker_id]
                
                # Calculate weights based on activity
                base_weight = getattr(base_profile, 'update_count', 1)
                source_weight = getattr(source_profile, 'update_count', 1)
                total_weight = base_weight + source_weight
                
                # Merge centroids
                base_profile.centroid = (
                    (base_weight * base_profile.centroid + 
                     source_weight * source_profile.centroid) / total_weight
                )
                
                # Update metadata
                if hasattr(base_profile, 'update_count'):
                    base_profile.update_count += getattr(source_profile, 'update_count', 1)
                
                removed_ids.append(speaker_id)
                del profiles[speaker_id]
                
        return profiles, removed_ids
        
    except Exception:
        # Fallback if merging fails
        return profiles, []


def calculate_similarity_score(profile1: object, profile2: object) -> float:
    """
    Calculate similarity score between two speaker profiles.
    
    Args:
        profile1: First speaker profile
        profile2: Second speaker profile
        
    Returns:
        Similarity score between 0 and 1
    """
    try:
        # Calculate cosine similarity
        centroid1 = profile1.centroid
        centroid2 = profile2.centroid
        
        norm1 = np.linalg.norm(centroid1)
        norm2 = np.linalg.norm(centroid2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        dot_product = np.dot(centroid1, centroid2)
        similarity = dot_product / (norm1 * norm2)
        
        return max(0.0, min(1.0, similarity))
        
    except Exception:
        return 0.0