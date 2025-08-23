"""
Comprehensive tests for temporal context integration (Task 7)
Validates conversation flow analysis, re-evaluation triggers, and temporal smoothing
"""

import unittest
import numpy as np
import time
from unittest.mock import Mock, patch
import tempfile
import os

from src.services.temporal_context_tracker import TemporalContextTracker, TemporalContext, SpeakerTurn
from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier


class TestTemporalContextIntegration(unittest.TestCase):
    """Test temporal context integration for Task 7 completion"""
    
    def setUp(self):
        self.identifier = ModernStatefulSpeakerIdentifier(
            base_threshold=0.7,
            max_speakers=10,
            use_temporal_context=True
        )
        self.embedding_dim = 192
        
    def test_temporal_context_tracker_initialization(self):
        """Test TemporalContextTracker initialization"""
        tracker = TemporalContextTracker(
            smoothing_window=5,
            max_context_seconds=30.0
        )
        
        self.assertEqual(tracker.smoothing_window, 5)
        self.assertEqual(tracker.max_context_seconds, 30.0)
        self.assertEqual(len(tracker.recent_contexts), 0)
    
    def test_conversation_flow_analysis(self):
        """Test conversation flow analysis with transition probabilities"""
        # Add context for multiple speakers
        base_time = time.time()
        
        # Speaker 1 speaks
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time,
            speaker_id="speaker_1",
            confidence=0.9,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=1.0
        )
        
        # Speaker 2 speaks
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time + 2.0,
            speaker_id="speaker_2",
            confidence=0.8,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.8,
            segment_duration=1.0
        )
        
        # Speaker 1 speaks again
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time + 4.0,
            speaker_id="speaker_1",
            confidence=0.85,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=1.0
        )
        
        # Calculate transition probabilities
        transition_probs = self.identifier.temporal_tracker.calculate_transition_probabilities()
        
        # Should have transitions
        self.assertIsInstance(transition_probs, dict)
        self.assertGreater(len(transition_probs), 0)
        
        # Check specific transitions
        key = ("speaker_1", "speaker_2")
        self.assertIn(key, transition_probs)
        self.assertEqual(transition_probs[key], 1.0)
    
    def test_re_evaluation_triggers(self):
        """Test re-evaluation triggers for ambiguous assignments"""
        # Add ambiguous context
        base_time = time.time()
        
        # Add low-confidence contexts
        for i in range(3):
            self.identifier.temporal_tracker.add_context(
                timestamp=base_time + i * 0.1,
                speaker_id=f"speaker_{i % 2 + 1}",
                confidence=0.4,  # Low confidence
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.5,
                segment_duration=0.1
            )
        
        # Check for inconsistencies
        inconsistencies = self.identifier.temporal_tracker.detect_inconsistencies()
        self.assertGreater(len(inconsistencies), 0)
        
        # Check that we have rapid switches
        rapid_switches = [inc for inc in inconsistencies if inc['type'] == 'rapid_switch']
        self.assertGreater(len(rapid_switches), 0)
    
    def test_temporal_smoothing_integration(self):
        """Test integration of temporal smoothing with identification"""
        # Add consistent context for speaker 1
        base_time = time.time()
        
        for i in range(5):
            self.identifier.temporal_tracker.add_context(
                timestamp=base_time + i,
                speaker_id="speaker_1",
                confidence=0.9,
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.9,
                segment_duration=1.0
            )
        
        # Test identification with temporal smoothing
        audio_chunk = np.random.randn(16000)
        embedding = np.random.randn(self.embedding_dim)
        
        speaker_id, confidence = self.identifier.identify_speaker(audio_chunk, embedding)
        
        # Should return a speaker ID
        self.assertIsInstance(speaker_id, str)
        self.assertIsInstance(confidence, float)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)
    
    def test_speaker_turn_detection_integration(self):
        """Test speaker turn detection integration"""
        # Add contexts with speaker turns
        base_time = time.time()
        
        # Speaker 1 turn
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time,
            speaker_id="speaker_1",
            confidence=0.9,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=2.0
        )
        
        # Speaker 2 turn
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time + 3.0,
            speaker_id="speaker_2",
            confidence=0.8,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.8,
            segment_duration=2.0
        )
        
        # Speaker 1 turn again
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time + 6.0,
            speaker_id="speaker_1",
            confidence=0.85,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=2.0
        )
        
        # Detect turns
        turns = self.identifier.temporal_tracker.detect_speaker_turns()
        
        self.assertGreater(len(turns), 0)
        for turn in turns:
            self.assertIsInstance(turn, SpeakerTurn)
            self.assertIn(turn.speaker_id, ["speaker_1", "speaker_2"])
    
    def test_context_aware_decision_making(self):
        """Test context-aware decision making"""
        # Add contexts to establish dominance
        base_time = time.time()
        
        # Speaker 1 is dominant (3 contexts)
        for i in range(3):
            self.identifier.temporal_tracker.add_context(
                timestamp=base_time + i,
                speaker_id="speaker_1",
                confidence=0.9,
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.9,
                segment_duration=1.0
            )
        
        # Speaker 2 is less dominant (1 context)
        self.identifier.temporal_tracker.add_context(
            timestamp=base_time + 4.0,
            speaker_id="speaker_2",
            confidence=0.7,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.8,
            segment_duration=1.0
        )
        
        # Check dominance
        dominance = self.identifier.temporal_tracker.get_speaker_dominance()
        self.assertGreater(dominance.get("speaker_1", 0), dominance.get("speaker_2", 0))
    
    def test_temporal_constraints_enforcement(self):
        """Test temporal constraints enforcement"""
        # Add rapid switches
        base_time = time.time()
        
        # Rapid speaker switches (should violate constraints)
        for i in range(5):
            speaker = "speaker_1" if i % 2 == 0 else "speaker_2"
            self.identifier.temporal_tracker.add_context(
                timestamp=base_time + i * 0.1,  # Very close timestamps
                speaker_id=speaker,
                confidence=0.8,
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.9,
                segment_duration=0.1
            )
        
        # Check constraints
        is_valid, reason = self.identifier.temporal_tracker.check_temporal_constraints(
            "speaker_2", base_time + 0.4
        )
        
        # Should detect rapid switching
        self.assertFalse(is_valid)
        self.assertIn("rapid", reason.lower())
    
    def test_integration_with_modern_identifier(self):
        """Test complete integration with modern identifier"""
        # Add some context
        base_time = time.time()
        
        embeddings = []
        for i in range(5):
            embedding = np.random.randn(self.embedding_dim)
            embeddings.append(embedding)
            
            self.identifier.identify_speaker(
                np.random.randn(16000),  # Mock audio
                embedding
            )
        
        # Check performance stats
        stats = self.identifier.get_performance_stats()
        self.assertIn('temporal_context', stats)
        self.assertIsNotNone(stats['temporal_context'])
    
    def test_edge_cases(self):
        """Test edge cases for temporal context"""
        # Empty context
        self.identifier.temporal_tracker.reset_context()
        
        # Should handle empty context gracefully
        summary = self.identifier.temporal_tracker.get_context_summary()
        self.assertEqual(summary['total_contexts'], 0)
        
        # Single context
        self.identifier.temporal_tracker.add_context(
            timestamp=time.time(),
            speaker_id="single_speaker",
            confidence=0.9,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.9,
            segment_duration=1.0
        )
        
        summary = self.identifier.temporal_tracker.get_context_summary()
        self.assertEqual(summary['total_contexts'], 1)
        self.assertEqual(summary['unique_speakers'], 1)
    
    def test_memory_efficiency_with_temporal_context(self):
        """Test memory efficiency with temporal context enabled"""
        # Process many segments
        for i in range(50):
            audio_chunk = np.random.randn(16000)
            embedding = np.random.randn(self.embedding_dim)
            
            speaker_id, confidence = self.identifier.identify_speaker(audio_chunk, embedding)
            
            # Should not crash
            self.assertIsInstance(speaker_id, str)
            self.assertIsInstance(confidence, float)
        
        # Check memory usage
        stats = self.identifier.get_performance_stats()
        self.assertIn('temporal_context', stats)


class TestConversationFlowAnalysis(unittest.TestCase):
    """Test conversation flow analysis specifically"""
    
    def setUp(self):
        self.tracker = TemporalContextTracker(
            smoothing_window=3,
            max_context_seconds=10.0
        )
        self.embedding_dim = 192
    
    def test_transition_probability_calculation(self):
        """Test transition probability calculation"""
        # Add sequential contexts
        base_time = time.time()
        
        # Speaker 1 -> Speaker 2 -> Speaker 1
        contexts = [
            ("speaker_1", base_time),
            ("speaker_2", base_time + 1.0),
            ("speaker_1", base_time + 2.0),
            ("speaker_2", base_time + 3.0),
            ("speaker_1", base_time + 4.0)
        ]
        
        for speaker, timestamp in contexts:
            self.tracker.add_context(
                timestamp=timestamp,
                speaker_id=speaker,
                confidence=0.9,
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.9,
                segment_duration=1.0
            )
        
        # Calculate probabilities
        probs = self.tracker.calculate_transition_probabilities()
        
        # Should have transitions from speaker_1 to speaker_2 and vice versa
        self.assertIn(("speaker_1", "speaker_2"), probs)
        self.assertIn(("speaker_2", "speaker_1"), probs)
        self.assertAlmostEqual(probs[("speaker_1", "speaker_2")], 0.5, places=2)
        self.assertAlmostEqual(probs[("speaker_2", "speaker_1")], 1.0, places=2)
    
    def test_speaker_dominance_calculation(self):
        """Test speaker dominance calculation"""
        # Add contexts with different speakers
        base_time = time.time()
        
        # Speaker 1 dominates (3 contexts, 3 seconds)
        for i in range(3):
            self.tracker.add_context(
                timestamp=base_time + i,
                speaker_id="speaker_1",
                confidence=0.9,
                embedding=np.random.randn(self.embedding_dim),
                quality_score=0.9,
                segment_duration=1.0
            )
        
        # Speaker 2 less dominant (1 context, 1 second)
        self.tracker.add_context(
            timestamp=base_time + 4.0,
            speaker_id="speaker_2",
            confidence=0.8,
            embedding=np.random.randn(self.embedding_dim),
            quality_score=0.8,
            segment_duration=1.0
        )
        
        # Check dominance
        dominance = self.tracker.get_speaker_dominance()
        
        self.assertEqual(len(dominance), 2)
        self.assertGreater(dominance["speaker_1"], dominance["speaker_2"])
        self.assertAlmostEqual(sum(dominance.values()), 1.0, places=2)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)