# FILE: src/services/audio_separation_service.py

"""
Audio Separation Service

Provides audio source separation using Demucs and speaker diarization using pyannote.audio
to improve transcription quality by isolating vocals and identifying multiple speakers.
"""

import os
import logging
import tempfile
import asyncio
import subprocess
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import uuid
import json
import torch
import torchaudio
from pyannote.audio import Pipeline

logger = logging.getLogger(__name__)


class AudioSeparationService:
    """Service for audio source separation and speaker diarization"""
    
    def __init__(self):
        """Initialize the audio separation service"""
        self.demucs_model = None
        self.diarization_pipeline = None
        self.temp_dir = tempfile.mkdtemp(prefix="audio_sep_")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Get HuggingFace token for pyannote - load dynamically when needed
        self._hf_token = None
        
        logger.info(f"Audio Separation Service initialized - Device: {self.device}")
    
    @property
    def hf_token(self):
        """Lazy load the HuggingFace token when needed"""
        if self._hf_token is None:
            self._hf_token = os.getenv("HUGGINGFACE_TOKEN", os.getenv("HF_TOKEN"))
            if not self._hf_token:
                logger.warning("No HuggingFace token found. Speaker diarization will be limited.")
        return self._hf_token
            
    def _load_diarization_pipeline(self):
        """Loads the pyannote pipeline if not already loaded."""
        if self.diarization_pipeline is None:
            logger.info("Loading pyannote speaker diarization pipeline...")
            self.diarization_pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=self.hf_token
            ).to(torch.device(self.device))
            logger.info("Diarization pipeline loaded.")

    async def extract_vocals(
        self,
        audio_path: str,
        model_name: str = "htdemucs"
    ) -> str:
        """
        Extract vocals from audio using Demucs
        
        Args:
            audio_path: Path to input audio file
            model_name: Demucs model to use (htdemucs, htdemucs_ft, etc.)
            
        Returns:
            Path to extracted vocals audio file
        """
        try:
            logger.info(f"Extracting vocals from: {audio_path}")
            
            # Create output directory for separated tracks
            output_dir = os.path.join(self.temp_dir, f"separated_{uuid.uuid4().hex}")
            os.makedirs(output_dir, exist_ok=True)
            
            cmd = [
                "python", "-m", "demucs",
                "--two-stems=vocals",
                "-n", model_name,
                "-o", output_dir,
                "--device", self.device,
                audio_path
            ]
            
            if audio_path.lower().endswith('.mp3'):
                cmd.extend(["--mp3", "--mp3-bitrate", "320"])
            
            logger.info(f"Running Demucs: {' '.join(cmd)}")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"Demucs failed: {error_msg}")
                raise RuntimeError(f"Demucs separation failed: {error_msg}")
            
            vocals_path = None
            for root, _, files in os.walk(output_dir):
                for file in files:
                    if file.startswith("vocals"):
                        vocals_path = os.path.join(root, file)
                        break
                if vocals_path:
                    break
            
            if not vocals_path or not os.path.exists(vocals_path):
                raise FileNotFoundError(f"Vocals file not found in {output_dir}")
            
            logger.info(f"Successfully extracted vocals: {vocals_path}")
            return vocals_path
            
        except Exception as e:
            logger.error(f"Error extracting vocals: {str(e)}")
            raise

    async def diarize_from_waveform(
        self,
        waveform: torch.Tensor,
        sample_rate: int,
        min_speakers: int = 1,
        max_speakers: int = 10,
        min_duration: float = 1.0
    ) -> Dict[str, Any]:
        """
        Perform speaker diarization on an in-memory waveform.
        Expects a 16kHz mono waveform.
        """
        if sample_rate != 16000:
            raise ValueError(f"Diarization expects 16000 Hz, but received {sample_rate} Hz.")
            
        try:
            logger.info(f"Performing speaker diarization on waveform of shape {waveform.shape}")

            if not self.hf_token:
                logger.warning("No HuggingFace token available. Returning single speaker. Set HUGGINGFACE_TOKEN or HF_TOKEN environment variable.")
                duration = waveform.shape[1] / sample_rate
                return {
                    "speakers": 1,
                    "segments": [{"speaker": "SPEAKER_00", "start": 0.0, "end": float(duration), "confidence": 1.0}]
                }

            self._load_diarization_pipeline()

            logger.info("Running speaker diarization...")
            audio_data_dict = {'waveform': waveform, 'sample_rate': sample_rate}
            diarization = self.diarization_pipeline(
                audio_data_dict,
                min_speakers=min_speakers,
                max_speakers=max_speakers
            )

            segments, speakers = [], set()
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                if turn.duration < min_duration:
                    continue
                segments.append({
                    "speaker": speaker, "start": float(turn.start), "end": float(turn.end),
                    "duration": float(turn.duration), "confidence": 0.95
                })
                speakers.add(speaker)
            
            segments.sort(key=lambda x: x["start"])
            
            result = {
                "speakers": len(speakers), "speaker_labels": sorted(list(speakers)),
                "segments": segments, "total_segments": len(segments)
            }
            
            logger.info(f"Diarization complete: {len(speakers)} speakers, {len(segments)} segments")
            return result

        except Exception as e:
            logger.error(f"Error in speaker diarization from waveform: {str(e)}", exc_info=True)
            duration = waveform.shape[1] / sample_rate
            return {
                "speakers": 1, "segments": [{"speaker": "SPEAKER_00", "start": 0.0, "end": float(duration), "confidence": 0.5}]
            }

    async def separate_and_diarize(
        self,
        audio_path: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Combined audio separation and speaker diarization
        
        Args:
            audio_path: Path to input audio file
            config: Configuration dict with options:
                - extract_vocals: Whether to extract vocals (default: True)
                - min_speakers: Minimum speakers to detect
                - max_speakers: Maximum speakers to detect
                - min_duration: Minimum speaker segment duration
        
        Returns:
            Dict containing vocals_path, diarization results, and metadata
        """
        try:
            # Default configuration
            default_config = {
                "extract_vocals": True,
                "min_speakers": 1,
                "max_speakers": 10,
                "min_duration": 1.0
            }
            
            if config:
                default_config.update(config)
            config = default_config
            
            result = {
                "vocals_path": None,
                "diarization": None,
                "metadata": {}
            }
            
            # Step 1: Extract vocals if requested
            if config.get("extract_vocals", True):
                logger.info("Extracting vocals for cleaner processing")
                vocals_path = await self.extract_vocals(audio_path)
                result["vocals_path"] = vocals_path
                result["metadata"]["vocals_extracted"] = True
                audio_for_diarization = vocals_path
            else:
                audio_for_diarization = audio_path
            
            # Step 2: Perform speaker diarization
            logger.info("Performing speaker diarization")
            diarization_result = await self.diarize_speakers(
                audio_for_diarization,
                min_speakers=config.get("min_speakers", 1),
                max_speakers=config.get("max_speakers", 10),
                min_duration=config.get("min_duration", 1.0)
            )
            
            result["diarization"] = diarization_result
            result["metadata"]["speakers_identified"] = diarization_result.get("speakers", 1)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in separate_and_diarize: {str(e)}")
            raise

    # The original diarize_speakers can now be a simple wrapper for backwards compatibility
    async def diarize_speakers(
        self,
        audio_path: str,
        min_speakers: int = 1,
        max_speakers: int = 10,
        min_duration: float = 1.0
    ) -> Dict[str, Any]:
        """
        Perform speaker diarization on audio from a file path.
        """
        waveform, sample_rate = torchaudio.load(audio_path)
        # Resample to 16kHz for the pipeline
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = resampler(waveform)
        
        # Ensure mono
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
            
        return await self.diarize_from_waveform(waveform, 16000, min_speakers, max_speakers, min_duration)

    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            logger.warning(f"Error cleaning up temp files: {str(e)}")

    def __del__(self):
        """Cleanup on deletion"""
        self.cleanup()

# Global instance
audio_separation_service = AudioSeparationService()
