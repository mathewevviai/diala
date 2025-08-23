"""
Integrated Modern Speaker Identifier
Complete drop-in replacement that handles audio input and embedding extraction
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
from .speaker_embedding_service import get_speaker_embedding_service

logger = logging.getLogger(__name__)


@dataclass
class SpeakerIdentificationResult:
    """Result of speaker identification"""
    speaker_id: str
    confidence: float
    quality_score: float
    processing_time_ms: float
    method: str
    adaptive_threshold: float


class IntegratedSpeakerIdentifier:
    """
    Complete drop-in replacement for StatefulSpeakerIdentifier that handles
    both audio input and embedding extraction internally
    """
    
    def __init__(self, base_threshold: float = 0.7, max_speakers: int = 50,
                 use_graph_clustering: bool = True, use_adaptive_thresholds: bool = True,
                 use_quality_weighting: bool = True, use_temporal_context: bool = True):
        """
        Initialize integrated speaker identifier
        
        Args:
            base_threshold: Base similarity threshold
            max_speakers: Maximum speakers to track
            use_graph_clustering: Enable graph-based clustering (Landini et al., 2022)
            use_adaptive_thresholds: Enable adaptive thresholding (Park et al., 2022)
            use_quality_weighting: Enable quality-aware embedding updates (Bredin & Laurent, 2021)
            use_temporal_context: Enable temporal context smoothing
        """
        self.base_threshold = base_threshold
        self.max_speakers = max_speakers
        
        self.config = {
            'graph_clustering': use_graph_clustering,
            'adaptive_thresholds': use_adaptive_thresholds,
            'quality_weighting': use_quality_weighting,
            'temporal_context': use_temporal_context
        }
        
        # Landini et al. (2022) - Graph-based clustering implementation
        self.clustering_engine = GraphBasedClusteringEngine(
            max_speakers=max_speakers,
            similarity_threshold=base_threshold
        )
        
        # Park et al. (2022) - Adaptive thresholding implementation
        self.adaptive_manager = AdaptiveThresholdingManager(
            base_threshold=base_threshold,
            adaptation_rate=0.1
        )
        
        # Bredin & Laurent (2021) - Quality-aware assessment
        self.quality_assessor = EmbeddingQualityAssessor()
        
        # Cornell et al. (2022) - Memory-efficient profile management
        self.memory_manager = MemoryEfficientSpeakerManager(
            max_speakers=max_speakers,
            memory_threshold_mb=100
        )
        
        self.temporal_tracker = TemporalContextTracker(
            smoothing_window=5,
            max_context_seconds=30.0
        )
        
        # Landini et al. (2023) - Fast graph optimization techniques
        self.graph_optimizer = FastGraphOptimizer(
            max_speakers=max_speakers,
            latency_constraint_ms=100.0
        )
        
        self.embedding_service = get_speaker_embedding_service()
        
        self.speaker_profiles: Dict[str, Dict] = {}
        self.speaker_lock = threading.RLock()
        
        self.identification_count = 0
        self.fallback_count = 0
        
        logger.info("Initialized IntegratedSpeakerIdentifier")
    
    def identify_speaker(self, audio_chunk_np: np.ndarray, 
                        embedding: np.ndarray = None,
                        sample_rate: int = 16000) -> Tuple[str, float]:
        """
        Identify speaker from audio chunk, extracting embedding if necessary.
        This method will always return a speaker ID (either existing or new) and will not return "Unknown".
        """
        start_time = time.time()
        
        try:
            if embedding is None:
                embedding = self.embedding_service.extract_embedding(audio_chunk_np, sample_rate)
                if embedding is None:
                    # Fallback to creating a new speaker if embedding extraction fails
                    logger.warning("Failed to extract embedding, creating new speaker profile.")
                    new_speaker_id = f"speaker_{len(self.speaker_profiles)}"
                    self.memory_manager.add_or_update_speaker(new_speaker_id, np.zeros(192), 0.1)
                    return new_speaker_id, 0.1

            # Bredin & Laurent (2021) - Assess embedding quality before use
            quality_score = self.quality_assessor.assess_quality(audio_chunk_np)
            
            # If quality is too low, treat as a new speaker to avoid corrupting existing profiles
            if not self.quality_assessor.should_update_centroid(quality_score):
                logger.debug(f"Low quality embedding (score: {quality_score:.2f}), creating new speaker profile.")
                new_speaker_id = f"speaker_{len(self.speaker_profiles)}"
                self.memory_manager.add_or_update_speaker(new_speaker_id, embedding, quality_score)
                return new_speaker_id, quality_score

            result = self._modern_identification(embedding, quality_score, audio_chunk_np)
            
            self._update_components(result.speaker_id, embedding, quality_score, result.confidence)
            
            processing_time = (time.time() - start_time) * 1000
            logger.debug(f"Identified speaker {result.speaker_id} with confidence {result.confidence:.3f} ({processing_time:.1f}ms)")
            
            return result.speaker_id, result.confidence
            
        except Exception as e:
            logger.error(f"Error in modern identification: {e}", exc_info=True)
            return self._fallback_identification(embedding, 0.5)
    
    def _modern_identification(self, embedding: np.ndarray,
                             quality_score: float, audio_chunk_np: np.ndarray) -> SpeakerIdentificationResult:
        """Perform modern speaker identification using all components"""
        start_time = time.time()
        
        # Landini et al. (2022) - Use graph-based or memory-based identification
        if self.config['graph_clustering']:
            speaker_id, confidence = self._graph_based_identification(embedding, quality_score)
            method = "graph"
        else:
            speaker_id, confidence = self._memory_based_identification(embedding, quality_score)
            method = "memory"
        
        # Park et al. (2022) - Apply per-speaker adaptive thresholding
        if self.config['adaptive_thresholds']:
            threshold = self.adaptive_manager.get_threshold(speaker_id)
            if confidence < threshold:
                better_speaker, better_confidence = self._find_better_match(embedding, quality_score, threshold)
                speaker_id, confidence = better_speaker, better_confidence
        
        if self.config['temporal_context']:
            transition_probs = self.temporal_tracker.calculate_transition_probabilities()
            context_summary = self.temporal_tracker.get_context_summary()
            speaker_id, confidence = self._apply_conversation_flow_analysis(speaker_id, confidence, transition_probs, context_summary)
            speaker_id, confidence = self.temporal_tracker.apply_temporal_smoothing(speaker_id, confidence)
        
        processing_time = (time.time() - start_time) * 1000
        
        return SpeakerIdentificationResult(
            speaker_id=speaker_id,
            confidence=confidence,
            quality_score=quality_score,
            processing_time_ms=processing_time,
            method=method,
            adaptive_threshold=self.adaptive_manager.get_threshold(speaker_id) if speaker_id else self.base_threshold
        )
    
    def _apply_conversation_flow_analysis(self, speaker_id: str, confidence: float,
                                        transition_probs: dict, context_summary: dict) -> Tuple[str, float]:
        """Apply conversation flow analysis and re-evaluation triggers"""
        if confidence < 0.6 or context_summary.get('inconsistencies', 0) > 0:
            dominant_speaker = self._find_best_speaker_from_context(speaker_id, confidence, transition_probs, context_summary)
            if dominant_speaker:
                speaker_id, confidence = dominant_speaker[0], dominant_speaker[1]
        
        is_valid, reason = self.temporal_tracker.check_temporal_constraints(speaker_id, time.time())
        if not is_valid:
            speaker_id, confidence = self._resolve_temporal_violation(speaker_id, confidence, context_summary)
        
        return speaker_id, confidence
    
    def _find_best_speaker_from_context(self, current_speaker: str, current_confidence: float,
                                     transition_probs: dict, context_summary: dict) -> Optional[Tuple[str, float]]:
        """Find best speaker based on conversation flow and context"""
        if not transition_probs: return None
        dominance = self.temporal_tracker.get_speaker_dominance()
        if not dominance: return None
        
        best_speaker = None
        best_score = 0.0
        
        for speaker, dom_score in dominance.items():
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
        dominance = self.temporal_tracker.get_speaker_dominance()
        if dominance:
            dominant_speaker = max(dominance.keys(), key=lambda x: dominance[x])
            if dominance[dominant_speaker] > 0.3:
                return dominant_speaker, max(0.5, confidence * 0.8)
        
        return speaker_id, max(0.3, confidence * 0.7)
    
    def _graph_based_identification(self, embedding: np.ndarray,
                                  quality_score: float) -> Tuple[str, float]:
        """Landini et al. (2022) - Use graph-based clustering for identification"""
        closest_speaker, similarity = self.clustering_engine.find_closest_speaker(embedding, quality_score)
        
        if closest_speaker is None:
            speaker_id = f"speaker_{len(self.speaker_profiles)}"
            confidence = 0.5  # Initial confidence for a new speaker
        else:
            speaker_id = closest_speaker
            confidence = similarity
        
        return speaker_id, confidence
    
    def _memory_based_identification(self, embedding: np.ndarray,
                                   quality_score: float) -> Tuple[str, float]:
        """Cornell et al. (2022) - Use memory-efficient speaker matching"""
        closest_speaker, similarity = self.memory_manager.find_closest_speaker(embedding, quality_score)
        
        if closest_speaker is None:
            speaker_id = f"speaker_{len(self.speaker_profiles)}"
            confidence = 0.5
        else:
            speaker_id = closest_speaker
            confidence = similarity
        
        return speaker_id, confidence
    
    def _find_better_match(self, embedding: np.ndarray, quality_score: float,
                          threshold: float) -> Tuple[str, float]:
        """Find better speaker match when confidence is low"""
        candidates = []
        
        # Graph-based approach from Landini et al. (2022)
        graph_speaker, graph_conf = self.clustering_engine.find_closest_speaker(embedding, quality_score)
        if graph_conf >= threshold:
            candidates.append((graph_speaker, graph_conf, "graph"))
        
        # Memory-based approach from Cornell et al. (2022)
        mem_speaker, mem_conf = self.memory_manager.find_closest_speaker(embedding, quality_score)
        if mem_conf >= threshold:
            candidates.append((mem_speaker, mem_conf, "memory"))
        
        if candidates:
            return max(candidates, key=lambda x: x[1])[:2]
        
        # If no suitable match is found, create a new speaker profile
        speaker_id = f"speaker_{len(self.speaker_profiles)}"
        return speaker_id, 0.5
    
    def _fallback_identification(self, embedding: np.ndarray,
                               quality_score: float) -> Tuple[str, float]:
        """Fallback to simple centroid-based identification, ensuring a new speaker is created if no match"""
        self.fallback_count += 1
        
        if embedding is None:
             new_speaker_id = f"speaker_{len(self.speaker_profiles)}"
             self.memory_manager.add_or_update_speaker(new_speaker_id, np.zeros(192), 0.1)
             return new_speaker_id, 0.1

        best_speaker = None
        best_distance = float('inf')
        
        with self.speaker_lock:
            for speaker_id, profile in self.speaker_profiles.items():
                if 'centroid' in profile:
                    distance = np.linalg.norm(embedding - profile['centroid'])
                    if distance < best_distance:
                        best_distance = distance
                        best_speaker = speaker_id
        
        if best_speaker is None or (1 - best_distance) < self.base_threshold:
            speaker_id = f"speaker_{len(self.speaker_profiles)}"
            self.memory_manager.add_or_update_speaker(speaker_id, embedding, quality_score)
            confidence = max(0.0, 1.0 - best_distance) if best_speaker else 0.5
        else:
            speaker_id = best_speaker
            confidence = max(0.0, 1.0 - best_distance)
        
        return speaker_id, confidence
    
    def _update_components(self, speaker_id: str, embedding: np.ndarray,
                        quality_score: float, confidence: float):
        """Update all modern components with new data"""
        if self.config['graph_clustering']:
            self.clustering_engine.add_or_update_speaker(speaker_id, embedding, quality_score)
        
        if self.config['adaptive_thresholds']:
            similarity = self._calculate_similarity(embedding, speaker_id)
            self.adaptive_manager.update_threshold(speaker_id, similarity, quality_score, was_accepted=True)
        
        self.memory_manager.add_or_update_speaker(speaker_id, embedding, quality_score)
        
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
            # Use the memory manager's profiles for consistency
            profile = self.memory_manager.speakers.get(speaker_id)
            if profile:
                centroid = profile.centroid
                norm_emb = np.linalg.norm(embedding)
                norm_centroid = np.linalg.norm(centroid)
                if norm_emb > 0 and norm_centroid > 0:
                    return np.dot(embedding, centroid) / (norm_emb * norm_centroid)
            return 0.0

    def get_speaker_count(self) -> int:
        """Get number of tracked speakers"""
        return self.memory_manager.get_speaker_count()
    
    def get_speakers(self) -> List[str]:
        """Get list of speaker IDs"""
        return self.memory_manager.get_speaker_ids()
    
    def reset(self):
        """Reset all components (for testing)"""
        with self.speaker_lock:
            self.speaker_profiles.clear()
            self.clustering_engine = GraphBasedClusteringEngine(max_speakers=self.max_speakers, similarity_threshold=self.base_threshold)
            self.adaptive_manager = AdaptiveThresholdingManager(base_threshold=self.base_threshold)
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
            'temporal_context': self.temporal_tracker.get_context_summary() if self.config['temporal_context'] else None,
            'memory_stats': self.memory_manager.get_memory_stats(),
            'adaptive_thresholds_count': len(self.adaptive_manager.speaker_thresholds)
        }
        
        if self.config['graph_clustering']:
            stats['clustering_stats'] = self.clustering_engine.get_graph_stats()
        
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
