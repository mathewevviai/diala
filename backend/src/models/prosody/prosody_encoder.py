# File: src/models/prosody/prosody_encoder.py (Definitive Version)

import numpy as np
import librosa
import torch
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

try:
    from transformers import Wav2Vec2FeatureExtractor, WavLMModel
except ImportError:
    Wav2Vec2FeatureExtractor = None
    WavLMModel = None


class ProsodyEncoder:
    def __init__(self, use_pretrained=True, device="cpu"):
        self.device = device
        self.use_pretrained = use_pretrained and (WavLMModel is not None)
        if self.use_pretrained:
            logger.info(f"Loading WavLMModel to {device} for prosody encoding...")
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(
                "microsoft/wavlm-base-plus"
            )
            self.prosody_model = WavLMModel.from_pretrained(
                "microsoft/wavlm-base-plus"
            ).to(device)
            logger.info("WavLMModel loaded successfully.")
        else:
            self.feature_extractor = None
            self.prosody_model = None

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------
    def extract_features(self, audio_path: str) -> dict:
        y, sr = librosa.load(audio_path, sr=16000, mono=True)
        return self.get_features_from_waveform(y, sr)

    def extract_features_batch(
        self, audio_chunks: List[np.ndarray], sample_rate: int
    ) -> List[Dict[str, Any]]:
        """
        Accepts *already-resampled* 16 kHz mono waveforms (CPU NumPy arrays)
        and returns a list of feature dicts – each containing both low-level
        features and WavLM embeddings when the model is enabled.
        """
        if sample_rate != 16000:
            raise ValueError(
                f"ProsodyEncoder expects 16000 Hz, got {sample_rate} Hz."
            )

        # 1. Low-level features (fast, always available)
        low_level = [
            self._get_low_level_features(chunk, sample_rate)
            for chunk in audio_chunks
        ]

        # 2. WavLM embeddings (optional, GPU-safe)
        if self.prosody_model:
            try:
                # Ensure everything is on CPU for the feature extractor
                if any(isinstance(c, torch.Tensor) for c in audio_chunks):
                    raise TypeError(
                        "audio_chunks must be CPU NumPy arrays, not torch tensors"
                    )

                inputs = self.feature_extractor(
                    audio_chunks,
                    sampling_rate=sample_rate,
                    padding=True,  # <- fixes the padding warning
                    return_tensors="pt",
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

                with torch.no_grad():
                    outputs = self.prosody_model(**inputs)
                    # mean over time dimension
                    embeddings = outputs.last_hidden_state.mean(dim=1).cpu().numpy()

                for feat, emb in zip(low_level, embeddings):
                    feat["prosody_embedding"] = emb
            except Exception as e:
                logger.error(f"Batch embedding failed: {e}")
                for feat in low_level:
                    feat["prosody_embedding"] = None
        return low_level

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _get_low_level_features(
        self, y: np.ndarray, sr: int
    ) -> Dict[str, float]:
        """
        Compute pitch, energy, voiced ratio, etc. for a single waveform.
        """
        duration_sec = len(y) / sr

        # Pitch
        f0, voiced_flags, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            frame_length=1024,
        )
        f0_values = f0[~np.isnan(f0)]
        if len(f0_values) > 0:
            avg_pitch = float(np.nanmean(f0_values))
            pitch_std = float(np.nanstd(f0_values))
            voiced_ratio = float(np.sum(voiced_flags) / len(voiced_flags))
        else:
            avg_pitch = pitch_std = voiced_ratio = 0.0

        # Energy
        hop_length = 512
        y_squared = y ** 2
        padding_needed = hop_length - (len(y_squared) % hop_length)
        if padding_needed != hop_length:
            y_squared = np.pad(y_squared, (0, padding_needed), mode="constant")
        energy_frames = y_squared.reshape(-1, hop_length).sum(axis=1)

        return {
            "duration_sec": duration_sec,
            "avg_pitch": avg_pitch,
            "pitch_std": pitch_std,
            "avg_energy": float(np.mean(energy_frames)),
            "energy_std": float(np.std(energy_frames)),
            "voiced_ratio": voiced_ratio,
        }

    def get_features_from_waveform(
        self, y: np.ndarray, sr: int
    ) -> Dict[str, Any]:
        """
        Unified entry point for a single waveform (NumPy, CPU).
        """
        if sr != 16000:
            raise ValueError(
                f"ProsodyEncoder expects 16000 Hz, got {sr} Hz."
            )

        if isinstance(y, torch.Tensor):
            y = y.cpu().numpy()
        if y.ndim > 1:
            y = y.squeeze()

        features = self._get_low_level_features(y, sr)
        if self.prosody_model:
            try:
                inputs = self.feature_extractor(
                    y,
                    sampling_rate=sr,
                    return_tensors="pt",
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                with torch.no_grad():
                    outputs = self.prosody_model(**inputs)
                    features["prosody_embedding"] = (
                        outputs.last_hidden_state.squeeze(0)
                        .mean(dim=0)
                        .cpu()
                        .numpy()
                    )
            except Exception as e:
                logger.error(f"Waveform embedding failed: {e}")
                features["prosody_embedding"] = None
        return features
