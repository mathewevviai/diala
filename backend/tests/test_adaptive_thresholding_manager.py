import unittest
import numpy as np
import time
from collections import deque
import logging

# To run this test standalone, we include the class definition.
# In a real project, this would be `from services.adaptive_thresholding_manager import AdaptiveThresholdingManager`
class AdaptiveThresholdingManager:
    def __init__(self,
                 base_threshold: float = 0.7, adaptation_rate: float = 0.1, smoothing_window: int = 5,
                 min_threshold: float = 0.4, max_threshold: float = 0.9, confidence_decay: float = 0.95,
                 temporal_smoothing_alpha: float = 0.3):
        self.base_threshold = base_threshold
        self.adaptation_rate = adaptation_rate
        self.smoothing_window = smoothing_window
        self.min_threshold = min_threshold
        self.max_threshold = max_threshold
        self.confidence_decay = confidence_decay
        self.temporal_smoothing_alpha = temporal_smoothing_alpha
        self.speaker_thresholds = {}
        self.confidence_history = {}
        self.threshold_history = {}
        self.speaker_stats = {}
        self.quality_weight_factor = 0.5
    
    def get_threshold(self, speaker_id: str) -> float:
        if speaker_id not in self.speaker_thresholds: self._initialize_speaker(speaker_id)
        return self.speaker_thresholds[speaker_id]
    
    def update_threshold(self, speaker_id: str, similarity: float, quality_score: float, was_accepted: bool = True):
        if speaker_id not in self.speaker_thresholds: self._initialize_speaker(speaker_id)
        current_threshold = self.speaker_thresholds[speaker_id]
        confidence_weight = self._calculate_confidence_weight(speaker_id, similarity, quality_score, was_accepted)
        threshold_adjustment = self._calculate_threshold_adjustment(similarity, quality_score, was_accepted, confidence_weight)
        raw_new_threshold = current_threshold + (self.adaptation_rate * confidence_weight * threshold_adjustment)
        smoothed_threshold = self._apply_temporal_smoothing(speaker_id, raw_new_threshold)
        final_threshold = np.clip(smoothed_threshold, self.min_threshold, self.max_threshold)
        self.speaker_thresholds[speaker_id] = final_threshold
        self._update_speaker_statistics(speaker_id, similarity, quality_score, was_accepted)

    def should_accept_assignment(self, speaker_id: str, similarity: float, quality_score: float) -> bool:
        threshold = self.get_threshold(speaker_id)
        quality_adjusted_threshold = self._get_quality_adjusted_threshold(threshold, quality_score)
        return similarity >= quality_adjusted_threshold

    def _initialize_speaker(self, speaker_id: str):
        self.speaker_thresholds[speaker_id] = self.base_threshold
        self.confidence_history[speaker_id] = deque(maxlen=self.smoothing_window)
        self.threshold_history[speaker_id] = deque(maxlen=self.smoothing_window)
        self.speaker_stats[speaker_id] = {'total_comparisons': 0, 'accepted_comparisons': 0, 'avg_similarity': 0.0, 'avg_quality': 0.0, 'last_update_time': time.time()}

    def _calculate_confidence_weight(self, speaker_id: str, similarity: float, quality_score: float, was_accepted: bool) -> float:
        quality_confidence = quality_score
        history_confidence = self._calculate_history_confidence(speaker_id, was_accepted)
        similarity_confidence = min(1.0, similarity / self.base_threshold)
        confidence_weight = (0.4 * quality_confidence + 0.3 * history_confidence + 0.3 * similarity_confidence)
        return np.clip(confidence_weight, 0.1, 1.0)

    def _calculate_history_confidence(self, speaker_id: str, was_accepted: bool) -> float:
        history = self.confidence_history.get(speaker_id)
        if not history: return 0.5
        recent_decisions = list(history)
        recent_decisions.append(1.0 if was_accepted else 0.0)
        weights = np.array([self.confidence_decay ** i for i in range(len(recent_decisions))])[::-1]
        return np.average(recent_decisions, weights=weights)

    def _calculate_threshold_adjustment(self, similarity: float, quality_score: float, was_accepted: bool, confidence_weight: float) -> float:
        base_adjustment = 0.0
        if was_accepted:
            if quality_score > 0.8 and similarity > 0.9: base_adjustment = 0.02
            elif quality_score < 0.4: base_adjustment = 0.01
        else:
            if quality_score > 0.7 and similarity >= 0.6:
                base_adjustment = -0.05
            elif quality_score < 0.3:
                base_adjustment = 0.01
        return base_adjustment * confidence_weight

    def _apply_temporal_smoothing(self, speaker_id: str, new_threshold: float) -> float:
        history = self.threshold_history[speaker_id]
        if not history:
            history.append(new_threshold)
            return new_threshold
        last_smoothed = history[-1]
        smoothed = (self.temporal_smoothing_alpha * new_threshold + (1 - self.temporal_smoothing_alpha) * last_smoothed)
        history.append(smoothed)
        return smoothed

    def _get_quality_adjusted_threshold(self, threshold: float, quality_score: float) -> float:
        if quality_score < 0.3: adjustment = -0.1
        elif quality_score < 0.5: adjustment = -0.05
        elif quality_score > 0.8: adjustment = 0.02
        else: adjustment = 0.0
        adjusted_threshold = threshold + (adjustment * self.quality_weight_factor)
        return np.clip(adjusted_threshold, self.min_threshold, self.max_threshold)
    
    def _update_speaker_statistics(self, speaker_id: str, similarity: float, quality_score: float, was_accepted: bool):
        stats = self.speaker_stats[speaker_id]
        stats['total_comparisons'] += 1
        if was_accepted: stats['accepted_comparisons'] += 1
        n = stats['total_comparisons']
        stats['avg_similarity'] = ((stats['avg_similarity'] * (n - 1) + similarity) / n)
        stats['avg_quality'] = ((stats['avg_quality'] * (n - 1) + quality_score) / n)
        self.confidence_history[speaker_id].append(1.0 if was_accepted else 0.0)
        stats['last_update_time'] = time.time()


class TestAdaptiveThresholdingManager(unittest.TestCase):
    def setUp(self):
        self.manager = AdaptiveThresholdingManager(base_threshold=0.7, adaptation_rate=0.1)
        self.test_speaker_id = "speaker_001"

    def test_update_threshold_rejected_assignment_lowers_threshold(self):
        """Tests that rejecting a high-quality match lowers the threshold."""
        initial_threshold = self.manager.get_threshold(self.test_speaker_id)
        self.manager.update_threshold(self.test_speaker_id, similarity=0.6, quality_score=0.8, was_accepted=False)
        updated_threshold = self.manager.get_threshold(self.test_speaker_id)
        self.assertLess(updated_threshold, initial_threshold)

    def test_threshold_adapts_correctly_on_low_quality_acceptance(self):
        """
        Tests the critical bug fix: accepting a low-quality match should INCREASE
        the threshold to make the system more skeptical in the future.
        """
        initial_threshold = self.manager.get_threshold(self.test_speaker_id)
        self.manager.update_threshold(self.test_speaker_id, similarity=0.8, quality_score=0.2, was_accepted=True)
        updated_threshold = self.manager.get_threshold(self.test_speaker_id)
        self.assertGreater(updated_threshold, initial_threshold)

    def test_initialization(self):
        """Tests that the manager initializes with the correct base threshold."""
        self.assertEqual(self.manager.base_threshold, 0.7)

    def test_get_threshold_new_speaker(self):
        """Tests that a new speaker is assigned the base threshold."""
        self.assertEqual(self.manager.get_threshold(self.test_speaker_id), 0.7)
    
    def test_should_accept_assignment_quality_adjustment(self):
        """Tests that low quality lowers the effective threshold for one decision."""
        similarity = 0.66  # Below base threshold
        low_quality = 0.2
        # Should be accepted because low quality makes the system more tolerant
        self.assertTrue(self.manager.should_accept_assignment(self.test_speaker_id, similarity, low_quality))

if __name__ == '__main__':
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    suite.addTests(loader.loadTestsFromTestCase(TestAdaptiveThresholdingManager))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\nAll tests passed successfully!")