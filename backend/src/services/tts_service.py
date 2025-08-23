# File: services/tts_service.py

import asyncio
from typing import Optional, Callable
from models.tts.chatterbox_model import ChatterboxModel
from models.tts.fishspeech_model import FishSpeechModel
from models.prosody.prosody_encoder import ProsodyEncoder

class TTSService:
    def __init__(self, model_name: str = "chatterbox", device: str = "cuda"):
        """
        Text-to-Speech Service with optional voice cloning.
        model_name: which TTS model backend to use ("chatterbox", "fishspeech", etc.)
        """
        self.model_name = model_name.lower()
        self.device = device
        self.model = None
        self.prosody_encoder = None

    async def ensure_model_loaded(self, progress_callback: Optional[Callable] = None):
        """Asynchronously load the TTS model (and prosody encoder) if not already loaded."""
        if self.model is not None:
            return  # already loaded
        if progress_callback:
            progress_callback(f"Loading TTS model: {self.model_name} ...")
        # Load the requested TTS model
        if self.model_name == "chatterbox":
            self.model = ChatterboxModel(device=self.device)
        elif self.model_name == "fishspeech":
            self.model = FishSpeechModel(device=self.device)
        else:
            raise ValueError(f"Unknown TTS model: {self.model_name}")
        # Initialize the ProsodyEncoder
        self.prosody_encoder = ProsodyEncoder(use_pretrained=True, device=self.device)
        if progress_callback:
            progress_callback("Models loaded successfully.")

    async def generate_speech(self, text: str, voice_sample_path: Optional[str] = None, 
                               exaggeration: float = 1.0, cfg_weight: float = 1.0) -> str:
        """
        Generate speech audio for the given text. If voice_sample_path is provided, clones that voice.
        Returns the path to a generated audio WAV file.
        """
        await self.ensure_model_loaded()
        adjusted_exaggeration = exaggeration
        adjusted_cfg = cfg_weight
        if voice_sample_path:
            # Analyze the reference audio prosody (offload to thread to avoid blocking event loop)
            loop = asyncio.get_event_loop()
            prosody_feats = await loop.run_in_executor(None, self.prosody_encoder.extract_features, voice_sample_path)
            if prosody_feats:
                pitch_std = prosody_feats.get("pitch_std", 0.0)
                voiced_ratio = prosody_feats.get("voiced_ratio", 0.0)
                # If reference has very flat prosody (low pitch variance), increase exaggeration a bit for liveliness
                if pitch_std < 5.0:
                    adjusted_exaggeration = min(1.3, exaggeration * 1.1)  # up to 30% more
                # If reference speaking style is extremely fast or highly expressive, we might reduce CFG weight slightly
                if voiced_ratio > 0.9 and pitch_std > 20:
                    adjusted_cfg = min(cfg_weight, 0.8)
                # (Above thresholds are heuristic; e.g., a very high voiced_ratio ~0.95 with huge pitch_std might indicate shouting or very energetic speech)
        else:
            prosody_feats = None

        # Generate audio with the selected model
        if self.model_name == "chatterbox":
            # Chatterbox uses internal voice conversion with prompt
            audio_tensor = await asyncio.get_event_loop().run_in_executor(
                None, 
                self.model.generate, 
                text, 
                voice_sample_path, 
                adjusted_exaggeration, 
                adjusted_cfg
            )
        else:
            # FishSpeech or others will use our wrapper (which may call ProsodyEncoder inside)
            audio_tensor = await asyncio.get_event_loop().run_in_executor(
                None,
                self.model.generate,
                text,
                voice_sample_path
            )
        # Save the waveform to a temporary WAV file
        import tempfile, torchaudio
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        torchaudio.save(tmp_file.name, audio_tensor.unsqueeze(0), self.model.sample_rate)
        return tmp_file.name

    async def label_prosody(self, audio_path: str) -> dict:
        """
        Analyze an audio file and return its prosodic features and estimated emotion.
        """
        await self.ensure_model_loaded()
        loop = asyncio.get_event_loop()
        features = await loop.run_in_executor(None, self.prosody_encoder.extract_features, audio_path)
        if features and "prosody_embedding" in features:
            features["estimated_emotion"] = self.prosody_encoder.estimate_emotion(features["prosody_embedding"])
        return features

