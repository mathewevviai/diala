"""
Modern Stateful Speaker Identifier
Drop-in replacement for StatefulSpeakerIdentifier with modern graph-based clustering
Integrates all modern components: graph clustering, adaptive thresholding, quality assessment
"""

import numpy as np
from typing import Tuple, Optional, Dict, List
import time
import logging
from dataclasses import dataclass
import threading

# Import modern components
from .graph_based_clustering_engine import GraphBasedClusteringEngine
from .adaptive_thresholding_manager import AdaptiveThresholdingManager
from .embedding_quality_assessor import EmbeddingQualityAssessor
from .memory_efficient_speaker_manager import MemoryEfficientSpeakerManager
from .temporal_context_tracker import TemporalContextTracker
from .fast_graph_optimizer import FastGraphOptimizer

logger = logging.getLogger(__name__)


@dataclass
class SpeakerIdentificationResult:
    """Result of speaker identification"""
    speaker_id: str
    confidence: float
    quality_score: float
    processing_time_ms: float
    method: str  # "graph", "fallback", "new"
    adaptive_threshold: float


class ModernStatefulSpeakerIdentifier:
    """
    Drop-in replacement for StatefulSpeakerIdentifier using modern research-based approaches
    
    This class integrates:
    - Graph-based clustering (Landini et al. 2022)
    - Adaptive thresholding (Park et al. 2022)
    - Quality-aware embedding aggregation (Bredin & Laurent 2021)
    - Memory-efficient speaker management (Cornell et al. 2022)
    - Temporal context integration
    - Fast graph optimization (Landini et al. 2023)
    
    Maintains backward compatibility with existing API while providing significant
    improvements in accuracy, efficiency, and scalability.
    """
    
    def __init__(self, base_threshold: float = 0.7, max_speakers: int = 50,
                 use_graph_clustering: bool = True, use_adaptive_thresholds: bool = True,
                 use_quality_weighting: bool = True, use_temporal_context: bool = True):
        """
        Initialize modern speaker identifier
        
        Args:
            base_threshold: Base similarity threshold
            max_speakers: Maximum speakers to track
            use_graph_clustering: Enable graph-based clustering
            use_adaptive_thresholds: Enable adaptive thresholding
            use_quality_weighting: Enable quality-aware embedding updates
            use_temporal_context: Enable temporal context smoothing
        """
        self.base_threshold = base_threshold
        self.max_speakers = max_speakers
        
        # Configuration flags
        self.config = {
            'graph_clustering': use_graph_clustering,
            'adaptive_thresholds': use_adaptive_thresholds,
            'quality_weighting': use_quality_weighting,
            'temporal_context': use_temporal_context
        }
        
        # Initialize modern components
        self.clustering_engine = GraphBasedClusteringEngine(
            max_speakers=max_speakers,
            similarity_threshold=base_threshold
        )
        
        self.adaptive_manager = AdaptiveThresholdingManager(
            base_threshold=base_threshold,
            adaptation_rate=0.1
        )
        
        self.quality_assessor = EmbeddingQualityAssessor()
        
        self.memory_manager = MemoryEfficientSpeakerManager(
            max_speakers=max_speakers,
            memory_threshold_mb=100
        )
        
        self.temporal_tracker = TemporalContextTracker(
            smoothing_window=5,
            max_context_seconds=30.0
        )
        
        self.graph_optimizer = FastGraphOptimizer(
            max_speakers=max_speakers,
            latency_constraint_ms=100.0
        )
        
        # Speaker storage for backward compatibility
        self.speaker_profiles: Dict[str, Dict] = {}
        self.speaker_lock = threading.RLock()
        
        # Performance tracking
        self.identification_count = 0
        self.fallback_count = 0
        
        logger.info("Initialized ModernStatefulSpeakerIdentifier")
    
    def identify_speaker(self, audio_chunk_np: np.ndarray, 
                         embedding: np.ndarray) -> Tuple[str, float]:
        """
        Identify speaker using modern approaches
        
        Args:
            audio_chunk_np: Audio chunk (for backward compatibility)
            embedding: Speaker embedding vector
            
        Returns:
            Tuple of (speaker_id, confidence)
        """
        start_time = time.time()
        
        try:
            # Step 1: Assess embedding quality
            quality_score = self.quality_assessor.assess_quality(audio_chunk_np, embedding)
            
            # Step 2: Check if quality is sufficient
            if quality_score < 0.3:
                logger.debug("Low quality embedding, using fallback")
                return self._fallback_identification(embedding, quality_score)
            
            # Step 3: Apply modern identification
            result = self._modern_identification(embedding, quality_score, audio_chunk_np)
            
            # Step 4: Update components
            self._update_components(result.speaker_id, embedding, quality_score, result.confidence)
            
            # Step 5: Return backward-compatible format
            processing_time = (time.time() - start_time) * 1000
            logger.debug(f"Identified speaker {result.speaker_id} "
                        f"with confidence {result.confidence:.3f} "
                        f"({processing_time:.1f}ms)")
            
            return result.speaker_id, result.confidence
            
        except Exception as e:
            logger.error(f"Error in modern identification: {e}")
            return self._fallback_identification(embedding, 0.5)
    
    def _modern_identification(self, embedding: np.ndarray,
                             quality_score: float, audio_chunk_np: np.ndarray) -> SpeakerIdentificationResult:
        """Perform modern speaker identification using all components"""
        start_time = time.time()
        
        # Use graph clustering if enabled
        if self.config['graph_clustering']:
            speaker_id, confidence = self._graph_based_identification(embedding, quality_score)
            method = "graph"
        else:
            speaker_id, confidence = self._memory_based_identification(embedding, quality_score)
            method = "memory"
        
        # Apply adaptive thresholding
        if self.config['adaptive_thresholds']:
            threshold = self.adaptive_manager.get_threshold(speaker_id)
            if confidence < threshold:
                # Try to find better match
                better_speaker, better_confidence = self._find_better_match(
                    embedding, quality_score, threshold
                )
                if better_confidence > confidence:
                    speaker_id, confidence = better_speaker, better_confidence
        
        # Apply conversation flow analysis and temporal context
        if self.config['temporal_context']:
            # Get transition probabilities for conversation flow analysis
            transition_probs = self.temporal_tracker.calculate_transition_probabilities()
            
            # Get current context summary
            context_summary = self.temporal_tracker.get_context_summary()
            
            # Apply conversation flow analysis
            speaker_id, confidence = self._apply_conversation_flow_analysis(
                speaker_id, confidence, transition_probs, context_summary
            )
            
            # Apply temporal smoothing
            speaker_id, confidence = self.temporal_tracker.apply_temporal_smoothing(
                speaker_id, confidence
            )
        
        processing_time = (time.time() - start_time) * 1000
        
        return SpeakerIdentificationResult(
            speaker_id=speaker_id,
            confidence=confidence,
            quality_score=quality_score,
            processing_time_ms=processing_time,
            method=method,
            adaptive_threshold=self.adaptive_manager.get_threshold(speaker_id)
        )
    
    def _apply_conversation_flow_analysis(self, speaker_id: str, confidence: float,
                                        transition_probs: dict, context_summary: dict) -> Tuple[str, float]:
        """Apply conversation flow analysis and re-evaluation triggers"""
        # Check for ambiguous assignments
        if confidence < 0.6 or context_summary.get('inconsistencies', 0) > 0:
            # Use transition probabilities to resolve ambiguity
            dominant_speaker = self._find_best_speaker_from_context(
                speaker_id, confidence, transition_probs, context_summary
            )
            if dominant_speaker:
                speaker_id = dominant_speaker[0]
                confidence = dominant_speaker[1]
        
        # Check temporal constraints
        is_valid, reason = self.temporal_tracker.check_temporal_constraints(
            speaker_id, time.time()
        )
        if not is_valid:
            # Re-evaluate based on temporal constraints
            speaker_id, confidence = self._resolve_temporal_violation(
                speaker_id, confidence, context_summary
            )
        
        return speaker_id, confidence
    
    def _find_best_speaker_from_context(self, current_speaker: str, current_confidence: float,
                                     transition_probs: dict, context_summary: dict) -> Optional[Tuple[str, float]]:
        """Find best speaker based on conversation flow and context"""
        if not transition_probs:
            return None
        
        # Get speaker dominance scores
        dominance = self.temporal_tracker.get_speaker_dominance()
        if not dominance:
            return None
        
        # Find most probable speaker based on transition probabilities and dominance
        best_speaker = None
        best_score = 0.0
        
        for speaker, dom_score in dominance.items():
            # Calculate combined score
            transition_score = transition_probs.get((current_speaker, speaker), 0.0)
            combined_score = 0.7 * dom_score + 0.3 * transition_score
            
            if combined_score > best_score:
                best_score = combined_score
                best_speaker = speaker
        
        if best_speaker and best_score > 0.5:
            return (best_speaker, min(0.9, current_confidence + 0.1))
        
        return None
    
    def _resolve_temporal_violation(self, speaker_id: str, confidence: float,
                                    context_summary: dict) -> Tuple[str, float]:
        """Resolve temporal violations by finding consistent speaker"""
        # Use speaker dominance to find consistent assignment
        dominance = self.temporal_tracker.get_speaker_dominance()
        if dominance:
            # Find most dominant speaker
            dominant_speaker = max(dominance.keys(), key=lambda x: dominance[x])
            if dominance[dominant_speaker] > 0.3:  # Threshold for dominance
                return dominant_speaker, max(0.5, confidence * 0.8)
        
        # Fallback: keep current speaker with reduced confidence
        return speaker_id, max(0.3, confidence * 0.7)
    
    def _graph_based_identification(self, embedding: np.ndarray,
                                  quality_score: float) -> Tuple[str, float]:
        """Use graph-based clustering for identification"""
        # Find closest speaker using graph
        closest_speaker, similarity = self.clustering_engine.find_closest_speaker(
            embedding, quality_score
        )
        
        if closest_speaker is None:
            # New speaker
            speaker_id = f"speaker_{len(self.speaker_profiles) + 1}"
            confidence = similarity
        else:
            speaker_id = closest_speaker
            confidence = similarity
        
        return speaker_id, confidence
    
    def _memory_based_identification(self, embedding: np.ndarray,
                                   quality_score: float) -> Tuple[str, float]:
        """Use memory-efficient speaker matching"""
        closest_speaker, similarity = self.memory_manager.find_closest_speaker(
            embedding, quality_score
        )
        
        if closest_speaker is None:
            # New speaker
            speaker_id = f"speaker_{len(self.speaker_profiles) + 1}"
            confidence = similarity
        else:
            speaker_id = closest_speaker
            confidence = similarity
        
        return speaker_id, confidence
    
    def _find_better_match(self, embedding: np.ndarray, quality_score: float,
                          threshold: float) -> Tuple[str, float]:
        """Find better speaker match when confidence is low"""
        # Try multiple approaches
        candidates = []
        
        # Graph-based approach
        graph_speaker, graph_conf = self.clustering_engine.find_closest_speaker(
            embedding, quality_score
        )
        if graph_conf >= threshold:
            candidates.append((graph_speaker, graph_conf, "graph"))
        
        # Memory-based approach
        mem_speaker, mem_conf = self.memory_manager.find_closest_speaker(
            embedding, quality_score
        )
        if mem_conf >= threshold:
            candidates.append((mem_speaker, mem_conf, "memory"))
        
        # Return best candidate
        if candidates:
            best = max(candidates, key=lambda x: x[1])
            return best[0], best[1]
        
        # Create new speaker
        speaker_id = f"speaker_{len(self.speaker_profiles) + 1}"
        return speaker_id, 0.5  # Default confidence for new speaker
    
    def _fallback_identification(self, embedding: np.ndarray,
                               quality_score: float) -> Tuple[str, float]:
        """Fallback to simple centroid-based identification"""
        self.fallback_count += 1
        
        # Simple distance-based matching
        best_speaker = None
        best_distance = float('inf')
        
        with self.speaker_lock:
            for speaker_id, profile in self.speaker_profiles.items():
                if 'centroid' in profile:
                    centroid = profile['centroid']
                    distance = np.linalg.norm(embedding - centroid)
                    if distance < best_distance:
                        best_distance = distance
                        best_speaker = speaker_id
        
        if best_speaker is None or best_distance > self.base_threshold:
            # New speaker
            speaker_id = f"speaker_{len(self.speaker_profiles) + 1}"
            confidence = max(0.0, 1.0 - best_distance)
        else:
            speaker_id = best_speaker
            confidence = max(0.0, 1.0 - best_distance)
        
        return speaker_id, confidence
    
    def _update_components(self, speaker_id: str, embedding: np.ndarray,
                        quality_score: float, confidence: float):
        """Update all modern components with new data"""
        
        # Update clustering engine
        if self.config['graph_clustering']:
            self.clustering_engine.add_or_update_speaker(
                speaker_id, embedding, quality_score
            )
        
        # Update adaptive thresholding
        if self.config['adaptive_thresholds']:
            similarity = self._calculate_similarity(embedding, speaker_id)
            self.adaptive_manager.update_threshold(
                speaker_id, similarity, quality_score, was_accepted=True
            )
        
        # Update memory manager
        self.memory_manager.add_or_update_speaker(
            speaker_id, embedding, quality_score
        )
        
        # Update temporal tracker
        self.temporal_tracker.add_context(
            timestamp=time.time(),
            speaker_id=speaker_id,
            confidence=confidence,
            embedding=embedding,
            quality_score=quality_score,
            segment_duration=1.0
        )
    
    def _calculate_similarity(self, embedding: np.ndarray,
                            speaker_id: str) -> float:
        """Calculate similarity with speaker centroid"""
        with self.speaker_lock:
            if speaker_id in self.speaker_profiles and 'centroid' in self.speaker_profiles[speaker_id]:
                centroid = self.speaker_profiles[speaker_id]['centroid']
                return np.dot(embedding, centroid) / (
                    np.linalg.norm(embedding) * np.linalg.norm(centroid)
                )
            return 0.0
    
    # Backward compatibility methods
    def get_speaker_count(self) -> int:
        """Get number of tracked speakers"""
        return len(self.speaker_profiles)
    
    def get_speakers(self) -> List[str]:
        """Get list of speaker IDs"""
        return list(self.speaker_profiles.keys())
    
    def reset(self):
        """Reset all components (for testing)"""
        with self.speaker_lock:
            self.speaker_profiles.clear()
            self.clustering_engine = GraphBasedClusteringEngine(
                max_speakers=self.max_speakers,
                similarity_threshold=self.base_threshold
            )
            self.adaptive_manager = AdaptiveThresholdingManager(
                base_threshold=self.base_threshold
            )
            self.memory_manager.clear_all_speakers()
            self.temporal_tracker.reset_context()
            self.identification_count = 0
            self.fallback_count = 0
    
    def get_performance_stats(self) -> Dict[str, any]:
        """Get performance statistics"""
        stats = {
            'total_identifications': self.identification_count,
            'fallback_count': self.fallback_count,
            'fallback_rate': self.fallback_count / max(1, self.identification_count),
            'config': self.config,
            'temporal_context': self.temporal_tracker.get_context_summary() if self.config['temporal_context'] else None
        }
        
        if self.config['graph_clustering']:
            stats['clustering_stats'] = self.clustering_engine.get_graph_stats()
        
        if hasattr(self.memory_manager, 'get_memory_stats'):
            stats['memory_stats'] = self.memory_manager.get_memory_stats()
        
        if hasattr(self.adaptive_manager, 'speaker_thresholds'):
            stats['adaptive_thresholds'] = len(self.adaptive_manager.speaker_thresholds)
        
        return stats
    
    def enable_feature(self, feature: str, enabled: bool = True):
        """Enable/disable specific features"""
        if feature in self.config:
            self.config[feature] = enabled
            logger.info(f"Feature {feature} {'enabled' if enabled else 'disabled'}")
        else:
            logger.warning(f"Unknown feature: {feature}")
    
    def get_speaker_profile(self, speaker_id: str) -> Optional[Dict]:
        """Get speaker profile (backward compatibility)"""
        return self.speaker_profiles.get(speaker_id)