#!/usr/bin/env python3
"""
Unit tests for Quality-Weighted Centroid Update Module

Tests the implementation of Bredin & Laurent (2021) quality-aware embedding aggregation
and Park et al. (2022) embedding quality assessment.
"""

import unittest
import numpy as np
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from src.services.embedding_quality_assessor import EmbeddingQualityAssessor
from src.services.quality_weighted_centroid import QualityWeightedCentroidManager, QualityWeightedProfile

class TestEmbeddingQualityAssessor(unittest.TestCase):
    """Test cases for EmbeddingQualityAssessor following Park et al. (2022) methodology."""
    
    def setUp(self):
        self.assessor = EmbeddingQualityAssessor(sample_rate=16000)
        self.sample_rate = 16000
    
    def test_snr_calculation(self):
        """Test SNR calculation with known signal characteristics."""
        # Create clean sine wave (high SNR)
        duration = 1.0
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)
        clean_signal = np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave
        
        snr_clean = self.assessor._calculate_snr(clean_signal)
        self.assertGreater(snr_clean, 0.7, "Clean signal should have high SNR quality")
        
        # Add noise to reduce SNR
        noise = np.random.normal(0, 0.5, samples)
        noisy_signal = clean_signal + noise
        
        snr_noisy = self.assessor._calculate_snr(noisy_signal)
        self.assertLess(snr_noisy, snr_clean, "Noisy signal should have lower SNR quality")
    
    def test_duration_quality(self):
        """Test duration-based quality scoring."""
        # Very short segment (poor quality)
        short_audio = np.random.randn(int(0.1 * self.sample_rate))
        short_quality = self.assessor._calculate_duration_quality(short_audio)
        self.assertLess(short_quality, 0.5, "Very short segments should have low quality")
        
        # Optimal duration segment (good quality)
        optimal_audio = np.random.randn(int(2.0 * self.sample_rate))
        optimal_quality = self.assessor._calculate_duration_quality(optimal_audio)
        self.assertGreater(optimal_quality, 0.6, "Optimal duration should have good quality")
        
        # Very long segment (diminishing returns)
        long_audio = np.random.randn(int(15.0 * self.sample_rate))
        long_quality = self.assessor._calculate_duration_quality(long_audio)
        self.assertLess(long_quality, optimal_quality, "Very long segments should have diminishing quality")
    
    def test_spectral_clarity(self):
        """Test spectral clarity calculation."""
        # Create speech-like signal with harmonic structure
        duration = 1.0
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)
        
        # Fundamental + harmonics (speech-like)
        speech_like = (np.sin(2 * np.pi * 200 * t) + 
                      0.5 * np.sin(2 * np.pi * 400 * t) + 
                      0.25 * np.sin(2 * np.pi * 600 * t))
        
        speech_clarity = self.assessor._calculate_spectral_clarity(speech_like)
        
        # White noise (poor spectral structure)
        noise = np.random.randn(samples)
        noise_clarity = self.assessor._calculate_spectral_clarity(noise)
        
        self.assertGreater(speech_clarity, noise_clarity, 
                          "Speech-like signal should have better spectral clarity than noise")
    
    def test_composite_quality_assessment(self):
        """Test overall quality assessment combining all metrics."""
        # High quality: clean, optimal duration, speech-like
        duration = 2.0
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)
        high_quality_audio = np.sin(2 * np.pi * 440 * t) + 0.3 * np.sin(2 * np.pi * 880 * t)
        
        high_quality_score = self.assessor.assess_quality(high_quality_audio)
        self.assertGreater(high_quality_score, 0.5, "High quality audio should score well")
        
        # Low quality: short, noisy
        low_quality_audio = np.random.randn(int(0.1 * self.sample_rate)) * 0.1
        low_quality_score = self.assessor.assess_quality(low_quality_audio)
        
        self.assertLess(low_quality_score, high_quality_score, 
                       "Low quality audio should score lower than high quality")
    
    def test_centroid_update_decision(self):
        """Test quality-based centroid update decisions."""
        # High quality should allow updates
        self.assertTrue(self.assessor.should_update_centroid(0.8))
        
        # Low quality should reject updates
        self.assertFalse(self.assessor.should_update_centroid(0.2))
        
        # Borderline quality
        self.assertTrue(self.assessor.should_update_centroid(0.3))  # At threshold
        self.assertFalse(self.assessor.should_update_centroid(0.29))  # Below threshold

class TestQualityWeightedCentroidManager(unittest.TestCase):
    """Test cases for QualityWeightedCentroidManager following Bredin & Laurent (2021)."""
    
    def setUp(self):
        self.manager = QualityWeightedCentroidManager(min_quality_threshold=0.3)
        self.embedding_dim = 192  # Typical speaker embedding dimension
    
    def test_speaker_profile_creation(self):
        """Test creation of new speaker profiles."""
        embedding = np.random.randn(self.embedding_dim)
        quality = 0.8
        
        profile = self.manager.create_speaker_profile("Speaker_1", embedding, quality)
        
        self.assertEqual(profile.speaker_id, "Speaker_1")
        self.assertEqual(profile.total_samples, 1)
        self.assertEqual(profile.quality_weighted_count, quality)
        self.assertAlmostEqual(profile.confidence_score, quality)
        np.testing.assert_array_equal(profile.centroid, embedding)
    
    def test_quality_weighted_centroid_update(self):
        """Test Bredin & Laurent (2021) quality-weighted centroid updates."""
        # Create initial profile
        initial_embedding = np.ones(self.embedding_dim)
        initial_quality = 0.5
        
        self.manager.create_speaker_profile("Speaker_1", initial_embedding, initial_quality)
        
        # Add second embedding with different quality
        second_embedding = np.ones(self.embedding_dim) * 2
        second_quality = 0.8
        
        success = self.manager.update_centroid("Speaker_1", second_embedding, second_quality)
        self.assertTrue(success, "High quality update should succeed")
        
        # Verify quality-weighted averaging
        profile = self.manager.speaker_profiles["Speaker_1"]
        expected_centroid = (initial_embedding * initial_quality + second_embedding * second_quality) / (initial_quality + second_quality)
        
        np.testing.assert_array_almost_equal(profile.centroid, expected_centroid, decimal=6)
        self.assertEqual(profile.total_samples, 2)
        self.assertAlmostEqual(profile.quality_weighted_count, initial_quality + second_quality)
    
    def test_low_quality_rejection(self):
        """Test rejection of low-quality embeddings."""
        # Create profile
        embedding = np.random.randn(self.embedding_dim)
        self.manager.create_speaker_profile("Speaker_1", embedding, 0.8)
        
        original_centroid = self.manager.get_centroid("Speaker_1").copy()
        
        # Try to update with low quality embedding
        low_quality_embedding = np.random.randn(self.embedding_dim)
        success = self.manager.update_centroid("Speaker_1", low_quality_embedding, 0.2)
        
        self.assertFalse(success, "Low quality update should be rejected")
        
        # Centroid should remain unchanged
        current_centroid = self.manager.get_centroid("Speaker_1")
        np.testing.assert_array_equal(original_centroid, current_centroid)
    
    def test_confidence_evolution(self):
        """Test confidence score evolution with quality updates."""
        embedding = np.random.randn(self.embedding_dim)
        initial_quality = 0.4
        
        profile = self.manager.create_speaker_profile("Speaker_1", embedding, initial_quality)
        initial_confidence = profile.confidence_score
        
        # Add high quality update
        high_quality_embedding = np.random.randn(self.embedding_dim)
        self.manager.update_centroid("Speaker_1", high_quality_embedding, 0.9)
        
        updated_confidence = self.manager.get_profile_confidence("Speaker_1")
        self.assertGreater(updated_confidence, initial_confidence