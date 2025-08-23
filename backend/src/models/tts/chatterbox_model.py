# File: models/tts/chatterbox_model.py

import torch
from chatterbox.tts import ChatterboxTTS

class ChatterboxModel:
    def __init__(self, device: str = "cuda"):
        """Wrapper for Resemble AI's Chatterbox TTS model."""
        self.device = device if torch.cuda.is_available() else "cpu"
        # Load the pretrained Chatterbox model
        self.model = ChatterboxTTS.from_pretrained(device=self.device)
        # The model has an attribute for sample rate (usually 24000 Hz for Chatterbox)
        self.sample_rate = getattr(self.model, "sr", 24000)

    def generate(self, text: str, audio_prompt_path: str = None, 
                 exaggeration: float = 1.0, cfg_weight: float = 1.0) -> torch.Tensor:
        """
        Generate speech audio for the given text.
        If audio_prompt_path is provided, uses it for zero-shot voice cloning.
        - exaggeration: controls expressiveness (higher = more exaggerated prosody)
        - cfg_weight: classifier-free guidance weight (how strongly to adhere to the voice prompt)
        Returns a waveform tensor (1D).
        """
        if audio_prompt_path:
            # Zero-shot voice cloning with a reference audio
            wav_tensor = self.model.generate(text, audio_prompt_path=audio_prompt_path, 
                                             exaggeration=exaggeration, cfg_weight=cfg_weight)
        else:
            # TTS without cloning (use default voice)
            wav_tensor = self.model.generate(text)
        return wav_tensor

