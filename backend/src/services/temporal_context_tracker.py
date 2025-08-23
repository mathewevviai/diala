"""
Temporal Context Integration for Speaker Diarization
Implements temporal smoothing and conversation flow analysis
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from collections import deque, defaultdict
import time
import logging
from scipy.stats import entropy

logger = logging.getLogger(__name__)


@dataclass
class TemporalContext:
    """Represents temporal context for a speaker decision"""
    timestamp: float
    speaker_id: Optional[str]
    confidence: float
    embedding: np.ndarray
    quality_score: float
    segment_duration: float


@dataclass
class SpeakerTurn:
    """Represents a speaker turn in conversation"""
    speaker_id: str
    start_time: float
    end_time: float
    confidence: float
    turn_duration: float


class TemporalContextTracker:
    """
    Implements temporal context integration for speaker diarization
    
    Key features:
    - Temporal smoothing windows for decision consistency
    - Speaker turn pattern detection and validation
    - Context-aware speaker assignment using neighboring segments
    - Temporal constraint checking to prevent rapid switching
    - Conversation flow analysis and transition modeling
    """
    
    def __init__(self, smoothing_window: int = 5, max_context_seconds: float = 30.0,
                 min_turn_duration: float = 1.0, max_switch_frequency: float = 0.5):
        """
        Initialize temporal context tracker
        
        Args:
            smoothing_window: Number of segments for temporal smoothing
            max_context_seconds: Maximum context window in seconds
            min_turn_duration: Minimum duration for a valid speaker turn
            max_switch_frequency: Maximum allowed speaker switches per second
        """
        self.smoothing_window = smoothing_window
        self.max_context_seconds = max_context_seconds
        self.min_turn_duration = min_turn_duration
        self.max_switch_frequency = max_switch_frequency
        
        self.recent_contexts: deque = deque(maxlen=smoothing_window * 2)
        self.speaker_turns: List[SpeakerTurn] = []
        self.speaker_history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=smoothing_window)
        )
        
        self.transition_matrix: Dict[Tuple[str, str], int] = defaultdict(int)
        self.speaker_frequencies: Dict[str, int] = defaultdict(int)
        self.last_speaker_switch = 0.0
        
        self.context_checks = 0
        self.consistency_corrections = 0
        
        logger.info(f"Initialized TemporalContextTracker: "
                   f"smoothing_window={smoothing_window}, "
                   f"max_context={max_context_seconds}s")
    
    def add_context(self, timestamp: float, speaker_id: Optional[str], confidence: float,
                   embedding: np.ndarray, quality_score: float,
                   segment_duration: float) -> None:
        """
        Add temporal context for a segment
        
        Args:
            timestamp: Segment timestamp
            speaker_id: Assigned speaker ID (None for unknown)
            confidence: Confidence score for assignment
            embedding: Segment embedding
            quality_score: Quality score for this segment
            segment_duration: Duration of the segment
        """
        context = TemporalContext(
            timestamp=timestamp,
            speaker_id=speaker_id,
            confidence=confidence,
            embedding=embedding,
            quality_score=quality_score,
            segment_duration=segment_duration
        )
        
        # Update speaker history before adding to recent contexts
        if speaker_id:
            # Update transitions if we have a previous speaker
            if self.recent_contexts and self.recent_contexts[-1].speaker_id:
                prev_speaker = self.recent_contexts[-1].speaker_id
                if prev_speaker != speaker_id:
                    transition_key = (prev_speaker, speaker_id)
                    self.transition_matrix[transition_key] += 1
            
            self.speaker_history[speaker_id].append(context)
            self.speaker_frequencies[speaker_id] += 1
            
        self.recent_contexts.append(context)

    
    def apply_temporal_smoothing(self, current_speaker: Optional[str],
                               current_confidence: float) -> Tuple[Optional[str], float]:
        """
        Apply temporal smoothing to speaker assignment
        
        Args:
            current_speaker: Current speaker assignment
            current_confidence: Current confidence score
            
        Returns:
            Tuple of (smoothed_speaker, smoothed_confidence)
        """
        self.context_checks += 1
        
        if not self.recent_contexts:
            return current_speaker, current_confidence
        
        recent_cutoff = time.time() - self.max_context_seconds
        recent_contexts = [
            ctx for ctx in self.recent_contexts
            if ctx.timestamp >= recent_cutoff
        ]
        
        if not recent_contexts:
            return current_speaker, current_confidence
        
        speaker_probabilities = self._calculate_speaker_probabilities(
            recent_contexts, current_speaker
        )
        
        smoothed_speaker, smoothed_confidence = self._apply_smoothing(
            current_speaker, current_confidence, speaker_probabilities
        )
        
        return smoothed_speaker, smoothed_confidence
    
    def _calculate_speaker_probabilities(self, contexts: List[TemporalContext],
                                     current_speaker: Optional[str]) -> Dict[str, float]:
        """Calculate speaker probabilities based on temporal context"""
        speaker_scores = defaultdict(float)
        
        for i, context in enumerate(contexts):
            weight = np.exp(-i / self.smoothing_window)
            weight *= context.confidence * context.quality_score
            
            if context.speaker_id:
                speaker_scores[context.speaker_id] += weight
        
        total_score = sum(speaker_scores.values())
        if total_score > 0:
            return {speaker: score / total_score for speaker, score in speaker_scores.items()}
        return {}
    
    def _apply_smoothing(self, current_speaker: Optional[str], current_confidence: float,
                      probabilities: Dict[str, float]) -> Tuple[Optional[str], float]:
        """Apply temporal smoothing based on probabilities"""
        # FIX: Initialize smoothed variables to current values to prevent UnboundLocalError
        smoothed_speaker = current_speaker
        smoothed_confidence = current_confidence

        if not probabilities:
            return smoothed_speaker, smoothed_confidence
        
        best_speaker = max(probabilities, key=probabilities.get)
        best_probability = probabilities[best_speaker]
        
        if best_probability > 0.5:
            if current_speaker == best_speaker:
                smoothed_confidence = min(1.0, current_confidence + 0.1)
            else:
                if best_probability > 0.8:
                    smoothed_speaker = best_speaker
                    smoothed_confidence = best_probability
        
        return smoothed_speaker, smoothed_confidence
    
    def check_temporal_constraints(self, proposed_speaker: Optional[str],
                                 current_time: float) -> Tuple[bool, str]:
        """
        Check if speaker switch respects temporal constraints
        
        Args:
            proposed_speaker: Proposed new speaker
            current_time: Current timestamp
            
        Returns:
            Tuple of (is_valid, reason)
        """
        if not self.speaker_turns:
            return True, "First speaker"
        
        if self.recent_contexts and self.recent_contexts[-1].speaker_id != proposed_speaker:
            time_since_last_switch = current_time - self.last_speaker_switch
            if time_since_last_switch < self.min_turn_duration:
                return False, "Too frequent switching"
            self.last_speaker_switch = current_time
        
        recent_switches = [
            turn for turn in self.speaker_turns
            if current_time - turn.end_time < self.max_context_seconds
        ]
        
        if self.max_context_seconds > 0:
            switch_frequency = len(recent_switches) / self.max_context_seconds
            if switch_frequency > self.max_switch_frequency:
                return False, "Switch frequency too high"
        
        return True, "Valid switch"
    
    def detect_speaker_turns(self) -> List[SpeakerTurn]:
        """
        Detect speaker turns from historical contexts
        
        Returns:
            List of detected speaker turns
        """
        if not self.recent_contexts:
            return []
        
        turns = []
        current_turn_speaker = None
        turn_start_time = None
        
        sorted_contexts = sorted(self.recent_contexts, key=lambda x: x.timestamp)
        
        for context in sorted_contexts:
            if context.speaker_id is None:
                continue
            
            if current_turn_speaker is None:
                current_turn_speaker = context.speaker_id
                turn_start_time = context.timestamp
            elif context.speaker_id != current_turn_speaker:
                turn_end_time = context.timestamp
                turn_duration = turn_end_time - turn_start_time
                
                if turn_duration >= self.min_turn_duration:
                    turn_contexts = [c for c in sorted_contexts if turn_start_time <= c.timestamp < turn_end_time and c.speaker_id == current_turn_speaker]
                    avg_confidence = np.mean([c.confidence for c in turn_contexts]) if turn_contexts else 0.0
                    
                    turns.append(SpeakerTurn(
                        speaker_id=current_turn_speaker,
                        start_time=turn_start_time,
                        end_time=turn_end_time,
                        confidence=avg_confidence,
                        turn_duration=turn_duration
                    ))
                
                current_turn_speaker = context.speaker_id
                turn_start_time = context.timestamp
        
        if current_turn_speaker and turn_start_time:
            last_time = sorted_contexts[-1].timestamp
            turn_duration = last_time - turn_start_time
            if turn_duration >= self.min_turn_duration:
                turn_contexts = [c for c in sorted_contexts if turn_start_time <= c.timestamp and c.speaker_id == current_turn_speaker]
                avg_confidence = np.mean([c.confidence for c in turn_contexts]) if turn_contexts else 0.0
                turns.append(SpeakerTurn(
                    speaker_id=current_turn_speaker,
                    start_time=turn_start_time,
                    end_time=last_time,
                    confidence=avg_confidence,
                    turn_duration=turn_duration
                ))
        
        self.speaker_turns.extend(turns)
        return turns
    
    def calculate_transition_probabilities(self) -> Dict[Tuple[str, str], float]:
        """
        Calculate transition probabilities between speakers
        
        Returns:
            Dict mapping (from_speaker, to_speaker) to probability
        """
        if not self.transition_matrix:
            return {}
        
        speaker_totals = defaultdict(int)
        for (from_speaker, _), count in self.transition_matrix.items():
            speaker_totals[from_speaker] += count
        
        probabilities = {}
        for (from_speaker, to_speaker), count in self.transition_matrix.items():
            if speaker_totals[from_speaker] > 0:
                probabilities[(from_speaker, to_speaker)] = count / speaker_totals[from_speaker]
        
        return probabilities
    
    def get_speaker_dominance(self) -> Dict[str, float]:
        """
        Calculate speaker dominance in recent context
        
        Returns:
            Dict mapping speaker_id to dominance score
        """
        if not self.recent_contexts:
            return {}
        
        speaker_durations = defaultdict(float)
        total_duration = 0.0
        
        for context in self.recent_contexts:
            if context.speaker_id:
                speaker_durations[context.speaker_id] += context.segment_duration
            total_duration += context.segment_duration
        
        if total_duration > 0:
            return {speaker: duration / total_duration for speaker, duration in speaker_durations.items()}
        return {}
    
    def detect_inconsistencies(self) -> List[Dict[str, any]]:
        """
        Detect temporal inconsistencies in speaker assignments
        
        Returns:
            List of inconsistency reports
        """
        inconsistencies = []
        if len(self.recent_contexts) < 2:
            return inconsistencies
        
        for i in range(1, len(self.recent_contexts)):
            prev_context = self.recent_contexts[i-1]
            curr_context = self.recent_contexts[i]
            
            if (prev_context.speaker_id and curr_context.speaker_id and
                prev_context.speaker_id != curr_context.speaker_id):
                
                time_diff = curr_context.timestamp - prev_context.timestamp
                if time_diff < self.min_turn_duration:
                    inconsistencies.append({
                        'type': 'rapid_switch', 'time_diff': time_diff,
                        'from_speaker': prev_context.speaker_id, 'to_speaker': curr_context.speaker_id,
                        'timestamp': curr_context.timestamp
                    })
        
        low_confidence_threshold = 0.5
        for context in self.recent_contexts:
            if context.confidence < low_confidence_threshold:
                inconsistencies.append({
                    'type': 'low_confidence', 'speaker': context.speaker_id,
                    'confidence': context.confidence, 'timestamp': context.timestamp
                })
        
        return inconsistencies
    
    def get_context_summary(self) -> Dict[str, any]:
        """Get summary of current temporal context"""
        if not self.recent_contexts:
            return {'total_contexts': 0, 'unique_speakers': 0, 'dominant_speaker': None, 'average_confidence': 0.0, 'inconsistencies': 0}
        
        unique_speakers = {ctx.speaker_id for ctx in self.recent_contexts if ctx.speaker_id}
        dominance = self.get_speaker_dominance()
        dominant_speaker = max(dominance, key=dominance.get) if dominance else None
        avg_confidence = np.mean([ctx.confidence for ctx in self.recent_contexts])
        
        return {
            'total_contexts': len(self.recent_contexts),
            'unique_speakers': len(unique_speakers),
            'dominant_speaker': dominant_speaker,
            'average_confidence': float(avg_confidence),
            'inconsistencies': len(self.detect_inconsistencies()),
            'context_checks': self.context_checks,
            'consistency_corrections': self.consistency_corrections
        }
    
    def reset_context(self):
        """Reset temporal context (for testing/debugging)"""
        self.recent_contexts.clear()
        self.speaker_turns.clear()
        self.speaker_history.clear()
        self.transition_matrix.clear()
        self.speaker_frequencies.clear()
        self.context_checks = 0
        self.consistency_corrections = 0
