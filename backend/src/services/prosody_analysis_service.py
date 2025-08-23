# File: services/prosody_analysis_service.py

import torch
from src.models.prosody.prosody_encoder import ProsodyEncoder

# --- FIX: Singleton Pattern ---
# Detect device once at the module level
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Create a single, global instance of the encoder when the module is first imported.
# This ensures the large WavLM model is loaded into memory only ONCE.
print(f"Initializing singleton ProsodyEncoder on device: {DEVICE}")
prosody_encoder_instance = ProsodyEncoder(device=DEVICE)
# --- END FIX ---

def analyze(path: str) -> dict:
    """
    Analyzes an audio file using the GLOBAL prosody_encoder_instance.
    This function no longer creates a new encoder on every call.
    """
    # Use the pre-loaded singleton instance
    return prosody_encoder_instance.extract_features(path)
