#!/usr/bin/env python3
"""
Embedding Quality Assessor for Speaker Diarization

Implements quality-aware embedding assessment following:
- Bredin & Laurent (2021) "Robust Speaker Embeddings for Streaming Diarization"
- Park et al. (2022) "Adaptive Clustering for Online Speaker Diarization"

This module provides quality assessment for audio embeddings used in speaker
diarization, ensuring robust centroid updates in streaming scenarios.
"""

import numpy as np
from typing import Dict, Any
import scipy.signal
import scipy.fft


class EmbeddingQualityAssessor:
    """
    Quality assessment for speaker embeddings in streaming diarization.
    
    Evaluates audio quality using three complementary metrics:
    1. Signal-to-Noise Ratio (SNR) quality
    2. Duration-based quality (following Bredin & Laurent 2021)
    3. Spectral clarity quality
    
    The composite quality score is used to make informed decisions about
    whether to update speaker centroids in streaming scenarios.
    """
    
    def __init__(self, 
                 sample_rate: int = 16000,
                 snr_weight: float = 0.5,
                 duration_weight: float = 0.3,
                 spectral_weight: float = 0.2,
                 min_quality_threshold: float = 0.3):
        """
        Initialize the quality assessor.
        
        Args:
            sample_rate: Audio sample rate in Hz
            snr_weight: Weight for SNR quality in composite score (0-1)
            duration_weight: Weight for duration quality (0-1)
            spectral_weight: Weight for spectral quality (0-1)
            min_quality_threshold: Minimum quality threshold for centroid updates
        """
        self.sample_rate = sample_rate
        self.snr_weight = snr_weight
        self.duration_weight = duration_weight
        self.spectral_weight = spectral_weight
        self.min_quality_threshold = min_quality_threshold
        
        # Validate weights sum to 1.0 (within tolerance)
        total_weight = snr_weight + duration_weight + spectral_weight
        if abs(total_weight - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total_weight}")
    
    def assess_quality(self, audio: np.ndarray) -> float:
        """
        Assess the overall quality of audio for embedding generation.
        
        Args:
            audio: Raw audio data as numpy array
            
        Returns:
            Composite quality score between 0.0 and 1.0
        """
        if len(audio) == 0:
            return 0.0
            
        # Ensure float32 format
        if audio.dtype != np.float32:
            if audio.dtype == np.int16:
                audio = audio.astype(np.float32) / 32768.0
            elif audio.dtype == np.int32:
                audio = audio.astype(np.float32) / 2147483648.0
            else:
                audio = audio.astype(np.float32)
        
        # Calculate individual quality metrics
        snr_quality = self._calculate_snr_quality(audio)
        duration_quality = self._calculate_duration_quality(audio)
        spectral_quality = self._calculate_spectral_quality(audio)
        
        # Weighted aggregation
        composite_quality = (
            self.snr_weight * snr_quality +
            self.duration_weight * duration_quality +
            self.spectral_weight * spectral_quality
        )
        
        return float(np.clip(composite_quality, 0.0, 1.0))
    
    def _calculate_snr_quality(self, audio: np.ndarray) -> float:
        """
        Calculate signal-to-noise ratio based quality using frame energy distribution.
        This method is robust against absolute volume changes and identifies noise
        based on the energy difference between quiet and loud segments.
        """
        try:
            # Require at least 100ms of audio for a meaningful estimation
            if len(audio) < self.sample_rate * 0.1:
                return 0.1

            frame_length = 512
            hop_length = 256
            
            frames = self._frame_audio(audio, frame_length, hop_length)
            
            # Require a minimum number of frames to estimate distribution
            if frames.shape[0] < 5:
                return 0.1 
                
            frame_energies = np.sqrt(np.mean(frames**2, axis=1))
            
            # Estimate noise power from the 20th percentile (quieter parts)
            noise_power = np.percentile(frame_energies, 20)
            
            # Estimate signal power from the 95th percentile (louder parts)
            signal_power = np.percentile(frame_energies, 95)
            
            if noise_power < 1e-9:
                # If noise is practically zero, SNR is very high
                snr_db = 80.0
            else:
                # Calculate SNR and convert to dB
                snr = (signal_power / noise_power)**2
                snr_db = 10 * np.log10(snr)

            # Map SNR in dB to a quality score (0-1) using a calibrated piecewise function.
            # This mapping is crucial for providing a predictable quality score.
            if snr_db < 5:
                quality = 0.3 * (snr_db / 5) # Smooth ramp up from 0 for very noisy audio
            elif snr_db < 15:
                quality = 0.3 + 0.4 * ((snr_db - 5) / 10)
            elif snr_db < 30:
                quality = 0.7 + 0.2 * ((snr_db - 15) / 15)
            else: # snr_db >= 30
                quality = 0.9 + 0.1 * (min(snr_db - 30, 10) / 10) # Cap at 40dB

            return float(np.clip(quality, 0.0, 1.0))

        except Exception:
            # Return a default low-to-moderate score in case of unexpected errors
            return 0.2

    def _frame_audio(self, audio: np.ndarray, frame_length: int, hop_length: int) -> np.ndarray:
        """Frame audio into overlapping windows."""
        n_frames = 1 + (len(audio) - frame_length) // hop_length
        padded_audio = np.pad(audio, (0, max(0, (n_frames - 1) * hop_length + frame_length - len(audio))))
        shape = (n_frames, frame_length)
        strides = (hop_length * padded_audio.strides[0], padded_audio.strides[0])
        return np.lib.stride_tricks.as_strided(padded_audio, shape=shape, strides=strides)

    def _calculate_duration_quality(self, audio: np.ndarray) -> float:
        """
        Calculate duration-based quality following Bredin & Laurent (2021).
        
        Optimal duration for speaker embeddings is around 2 seconds,
        with penalties for both very short and very long segments.
        """
        duration = len(audio) / self.sample_rate
        
        if duration < 0.25:
            quality = duration * 1.6 # Linear ramp for very short audio
        elif 0.25 <= duration <= 1.0:
            quality = 0.4 + 0.4 * ((duration - 0.25) / 0.75)
        elif 1.0 < duration <= 3.0:
            quality = 0.8 + 0.2 * ((duration - 1.0) / 2.0)
        elif 3.0 < duration <= 5.0:
            quality = 1.0 - 0.3 * ((duration - 3.0) / 2.0)
        else: # duration > 5.0
            quality = max(0.0, 0.7 - 0.1 * (duration - 5.0))
            
        return float(np.clip(quality, 0.0, 1.0))
    
    def _calculate_spectral_quality(self, audio: np.ndarray) -> float:
        """
        Calculate spectral clarity quality using FFT analysis.
        
        Speech signals should have energy distributed across multiple
        frequency bands rather than concentrated in narrow bands.
        """
        try:
            if len(audio) < 256:
                return 0.5
                
            fft = np.abs(scipy.fft.fft(audio))
            freqs = scipy.fft.fftfreq(len(audio), 1/self.sample_rate)
            
            mask = (freqs >= 80) & (freqs <= 4000)
            speech_fft = fft[mask]
            speech_freqs = freqs[mask]
            
            if len(speech_fft) == 0:
                return 0.5
            
            total_energy = np.sum(speech_fft)
            if total_energy < 1e-10:
                return 0.0
            
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
            
            spectral_quality = (
                0.2 * centroid_score + 0.3 * spread_score +
                0.3 * flatness_score + 0.2 * peak_score
            )
            
            return float(np.clip(spectral_quality, 0.0, 1.0))
            
        except Exception:
            return 0.5
    
    def should_update_centroid(self, quality_score: float) -> bool:
        """
        Determine if centroid should be updated based on quality score.
        """
        return quality_score >= self.min_quality_threshold
    
    def get_quality_weight(self, quality_score: float) -> float:
        """
        Get quality-based weight for centroid aggregation.
        """
        weight = 0.1 + 0.9 * quality_score ** 2
        return float(np.clip(weight, 0.01, 1.0))

    def get_quality_metrics(self, audio: np.ndarray) -> Dict[str, Any]:
        """
        Get detailed quality metrics for analysis and debugging.
        """
        if len(audio) == 0:
            return {
                'snr_quality': 0.0, 'duration_quality': 0.0, 'spectral_quality': 0.0,
                'composite_quality': 0.0, 'duration_sec': 0.0,
                'should_update': False, 'quality_weight': 0.01
            }
        
        composite_quality = self.assess_quality(audio)
        duration_sec = len(audio) / self.sample_rate
        
        return {
            'snr_quality': self._calculate_snr_quality(audio),
            'duration_quality': self._calculate_duration_quality(audio),
            'spectral_quality': self._calculate_spectral_quality(audio),
            'composite_quality': composite_quality,
            'duration_sec': duration_sec,
            'should_update': self.should_update_centroid(composite_quality),
            'quality_weight': self.get_quality_weight(composite_quality)
        }