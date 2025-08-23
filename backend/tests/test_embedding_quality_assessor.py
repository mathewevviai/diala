#!/usr/bin/env python3
"""
Unit tests for EmbeddingQualityAssessor module.
"""

import sys
import unittest
import numpy as np
from pathlib import Path

# Assuming the class is in the services directory as specified
# Add project root to path if necessary
# project_root = Path(__file__).resolve().parent.parent
# sys.path.insert(0, str(project_root))
# from services.embedding_quality_assessor import EmbeddingQualityAssessor

# For standalone execution, include the class directly
class EmbeddingQualityAssessor:
    def __init__(self, 
                 sample_rate: int = 16000,
                 snr_weight: float = 0.5,
                 duration_weight: float = 0.3,
                 spectral_weight: float = 0.2,
                 min_quality_threshold: float = 0.3):
        self.sample_rate = sample_rate
        self.snr_weight = snr_weight
        self.duration_weight = duration_weight
        self.spectral_weight = spectral_weight
        self.min_quality_threshold = min_quality_threshold
        total_weight = snr_weight + duration_weight + spectral_weight
        if abs(total_weight - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total_weight}")
    
    def assess_quality(self, audio: np.ndarray) -> float:
        if len(audio) == 0:
            return 0.0
        if audio.dtype != np.float32:
            if audio.dtype == np.int16:
                audio = audio.astype(np.float32) / 32768.0
            elif audio.dtype == np.int32:
                audio = audio.astype(np.float32) / 2147483648.0
            else:
                audio = audio.astype(np.float32)
        
        snr_quality = self._calculate_snr_quality(audio)
        duration_quality = self._calculate_duration_quality(audio)
        spectral_quality = self._calculate_spectral_quality(audio)
        
        composite_quality = (
            self.snr_weight * snr_quality +
            self.duration_weight * duration_quality +
            self.spectral_weight * spectral_quality
        )
        return float(np.clip(composite_quality, 0.0, 1.0))
    
    def _calculate_snr_quality(self, audio: np.ndarray) -> float:
        try:
            if len(audio) < self.sample_rate * 0.1:
                return 0.1

            frame_length = 512
            hop_length = 256
            
            frames = self._frame_audio(audio, frame_length, hop_length)
            
            if frames.shape[0] < 5:
                return 0.1 
                
            frame_energies = np.sqrt(np.mean(frames**2, axis=1))
            
            noise_power = np.percentile(frame_energies, 20)
            signal_power = np.percentile(frame_energies, 95)
            
            if noise_power < 1e-9:
                snr_db = 80.0
            else:
                snr = (signal_power / noise_power)**2
                snr_db = 10 * np.log10(snr)

            if snr_db < 5:
                quality = 0.3 * (snr_db / 5)
            elif snr_db < 15:
                quality = 0.3 + 0.4 * ((snr_db - 5) / 10)
            elif snr_db < 30:
                quality = 0.7 + 0.2 * ((snr_db - 15) / 15)
            else:
                quality = 0.9 + 0.1 * (min(snr_db - 30, 10) / 10)

            return float(np.clip(quality, 0.0, 1.0))
        except Exception:
            return 0.2

    def _frame_audio(self, audio: np.ndarray, frame_length: int, hop_length: int) -> np.ndarray:
        n_frames = 1 + (len(audio) - frame_length) // hop_length
        padded_audio = np.pad(audio, (0, max(0, (n_frames - 1) * hop_length + frame_length - len(audio))))
        shape = (n_frames, frame_length)
        strides = (hop_length * padded_audio.strides[0], padded_audio.strides[0])
        return np.lib.stride_tricks.as_strided(padded_audio, shape=shape, strides=strides)

    def _calculate_duration_quality(self, audio: np.ndarray) -> float:
        duration = len(audio) / self.sample_rate
        if duration < 0.25:
            quality = duration * 1.6
        elif 0.25 <= duration <= 1.0:
            quality = 0.4 + 0.4 * ((duration - 0.25) / 0.75)
        elif 1.0 < duration <= 3.0:
            quality = 0.8 + 0.2 * ((duration - 1.0) / 2.0)
        elif 3.0 < duration <= 5.0:
            quality = 1.0 - 0.3 * ((duration - 3.0) / 2.0)
        else:
            quality = max(0.0, 0.7 - 0.1 * (duration - 5.0))
        return float(np.clip(quality, 0.0, 1.0))
    
    def _calculate_spectral_quality(self, audio: np.ndarray) -> float:
        try:
            if len(audio) < 256: return 0.5
            import scipy.fft
            fft = np.abs(scipy.fft.fft(audio))
            freqs = scipy.fft.fftfreq(len(audio), 1/self.sample_rate)
            mask = (freqs >= 80) & (freqs <= 4000)
            speech_fft = fft[mask]
            speech_freqs = freqs[mask]
            if len(speech_fft) == 0: return 0.5
            total_energy = np.sum(speech_fft)
            if total_energy < 1e-10: return 0.0
            spectral_centroid = np.sum(speech_freqs * speech_fft) / total_energy
            spectral_spread = np.sqrt(np.sum(((speech_freqs - spectral_centroid) ** 2) * speech_fft) / total_energy)
            geometric_mean = np.exp(np.mean(np.log(speech_fft + 1e-10)))
            arithmetic_mean = np.mean(speech_fft)
            spectral_flatness = geometric_mean / (arithmetic_mean + 1e-10)
            peak_threshold = np.max(speech_fft) * 0.1
            significant_peaks = np.sum(speech_fft > peak_threshold)
            peak_score = min(1.0, significant_peaks / 10.0)
            centroid_score = 1.0 - min(1.0, abs(spectral_centroid - 1500) / 1500)
            spread_score = min(1.0, spectral_spread / 1000)
            flatness_score = min(1.0, spectral_flatness * 10)
            spectral_quality = (0.2*centroid_score + 0.3*spread_score + 0.3*flatness_score + 0.2*peak_score)
            return float(np.clip(spectral_quality, 0.0, 1.0))
        except Exception: return 0.5
    
    def should_update_centroid(self, quality_score: float) -> bool:
        return quality_score >= self.min_quality_threshold
    
    def get_quality_weight(self, quality_score: float) -> float:
        weight = 0.1 + 0.9 * quality_score ** 2
        return float(np.clip(weight, 0.01, 1.0))


class TestEmbeddingQualityAssessor(unittest.TestCase):
    """Test cases for EmbeddingQualityAssessor functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.assessor = EmbeddingQualityAssessor(sample_rate=16000)
        self.sample_rate = 16000
    
    def test_initialization(self):
        """Test proper initialization of quality assessor"""
        assessor = EmbeddingQualityAssessor(
            sample_rate=16000, snr_weight=0.5, duration_weight=0.3,
            spectral_weight=0.2, min_quality_threshold=0.4)
        self.assertEqual(assessor.sample_rate, 16000)
        self.assertEqual(assessor.snr_weight, 0.5)
        self.assertEqual(assessor.duration_weight, 0.3)
        self.assertEqual(assessor.spectral_weight, 0.2)
        self.assertEqual(assessor.min_quality_threshold, 0.4)
    
    def test_empty_audio_handling(self):
        """Test handling of empty audio chunks"""
        empty_audio = np.array([])
        quality = self.assessor.assess_quality(empty_audio)
        self.assertEqual(quality, 0.0)
        should_update = self.assessor.should_update_centroid(quality)
        self.assertFalse(should_update)
    
    def test_high_quality_audio(self):
        """Test quality assessment for high-quality audio"""
        duration = 2.0
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)
        signal = (0.5 * np.sin(2 * np.pi * 150 * t) + 
                  0.3 * np.sin(2 * np.pi * 800 * t) + 
                  0.2 * np.sin(2 * np.pi * 1200 * t))
        noise = np.random.normal(0, 0.01, samples)
        audio = (signal + noise).astype(np.float32)
        quality = self.assessor.assess_quality(audio)
        self.assertGreater(quality, 0.6, f"High quality audio failed with score: {quality}")
        self.assertTrue(self.assessor.should_update_centroid(quality))
    
    def test_low_quality_audio(self):
        """Test quality assessment for low-quality audio"""
        duration = 0.1
        samples = int(duration * self.sample_rate)
        signal = 0.1 * np.sin(2 * np.pi * 200 * np.linspace(0, duration, samples))
        noise = np.random.normal(0, 0.2, samples)
        audio = (signal + noise).astype(np.float32)
        quality = self.assessor.assess_quality(audio)
        self.assertLess(quality, 0.4, f"Low quality audio failed with score: {quality}")
        self.assertFalse(self.assessor.should_update_centroid(quality))
    
    def test_snr_quality_assessment(self):
        """Test SNR-based quality assessment following Park et al. (2022)"""
        duration = 1.0
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)
        
        clean_signal = 0.5 * np.sin(2 * np.pi * 440 * t)
        minimal_noise = np.random.normal(0, 0.01, samples)
        high_snr_audio = (clean_signal + minimal_noise).astype(np.float32)
        high_snr_quality = self.assessor._calculate_snr_quality(high_snr_audio)
        
        noisy_signal = 0.1 * np.sin(2 * np.pi * 440 * t)
        heavy_noise = np.random.normal(0, 0.3, samples)
        low_snr_audio = (noisy_signal + heavy_noise).astype(np.float32)
        low_snr_quality = self.assessor._calculate_snr_quality(low_snr_audio)
        
        self.assertGreater(high_snr_quality, low_snr_quality)
        self.assertGreater(high_snr_quality, 0.5)
        self.assertLess(low_snr_quality, 0.5)

if __name__ == '__main__':
    unittest.main(argv=['first-arg-is-ignored'], exit=False)