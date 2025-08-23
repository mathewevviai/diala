import os
import torch
import numpy as np
from scipy.io.wavfile import write as write_wav
from pathlib import Path
import logging

# --- START OF ROBUST MONKEY-PATCH ---
original_torch_load = torch.load
def patched_torch_load(f, map_location, **kwargs):
    if isinstance(f, str) and f.endswith(".pt"):
        logging.info(f"Applying robust patch: Intercepted torch.load for '{os.path.basename(f)}'. Setting weights_only=False.")
        return original_torch_load(f, map_location=map_location, weights_only=False)
    return original_torch_load(f, map_location=map_location, **kwargs)
torch.load = patched_torch_load
logging.info("Robust monkey-patch for torch.load is active.")
# --- END OF ROBUST MONKEY-PATCH ---

from bark import SAMPLE_RATE, generate_audio, save_as_prompt

# --- Service Configuration ---
logger = logging.getLogger(__name__)
RESULTS_DIR = Path(__file__).resolve().parent.parent.parent / "results" / "procedural_audio"
MODELS_CACHE_DIR = "./bark_models_cache"

class ProceduralSoundService:
    def __init__(self):
        self.sample_rate = SAMPLE_RATE
        os.makedirs(RESULTS_DIR, exist_ok=True)
        os.environ["XDG_CACHE_HOME"] = MODELS_CACHE_DIR
        self.load_model()

    def load_model(self):
        """Pre-loads the Bark model."""
        logger.info("Initializing Bark model. This may trigger a download on first run.")
        _ = generate_audio("[silence]", silent=True)
        logger.info("Bark models are loaded and ready.")

    def generate_scene(self, prompt: str, duration_seconds: int = 30) -> str:
        """Generates a long-form audio scene and saves it to a file."""
        logger.info(f"Starting procedural generation for prompt: '{prompt}'")
        
        num_continuations = max(0, (duration_seconds // 12) - 1)
        
        # ====================================================================
        # === START OF DEFINITIVE FIX ===
        # ====================================================================
        
        # MODIFIED: Unpack the tuple returned by generate_audio with output_full=True.
        # It returns (full_generation_dict, audio_array).
        logger.info("Generating initial audio chunk and history prompt...")
        full_generation_dict, audio_array = generate_audio(prompt, silent=True, output_full=True)
        
        # MODIFIED: Initialize the main audio track with the unpacked audio array.
        total_scene_audio = audio_array
        
        # ====================================================================
        # ===  END OF DEFINITIVE FIX  ===
        # ====================================================================

        logger.info("Generated initial audio chunk.")

        temp_prompt_filename = "temp_history_prompt.npz"

        for i in range(num_continuations):
            logger.info(f"Continuation loop {i+1}/{num_continuations}...")
            
            # ====================================================================
            # === START OF DEFINITIVE FIX ===
            # ====================================================================

            # MODIFIED: Pass the unpacked dictionary to save_as_prompt.
            save_as_prompt(temp_prompt_filename, full_generation_dict)
            
            # MODIFIED: Unpack the tuple again for the continued generation.
            # We update the dictionary for the next loop and get the new audio chunk.
            full_generation_dict, new_audio_chunk = generate_audio(
                "[silence]", 
                history_prompt=temp_prompt_filename, 
                silent=True, 
                output_full=True
            )
            
            # ====================================================================
            # ===  END OF DEFINITIVE FIX  ===
            # ====================================================================

            # Append the new audio array to our main track
            total_scene_audio = np.concatenate([total_scene_audio, new_audio_chunk])

        sanitized_prompt = "".join(filter(str.isalnum, prompt))[:30]
        final_filename = f"scene_{sanitized_prompt}_{duration_seconds}s.wav"
        output_path = RESULTS_DIR / final_filename

        logger.info(f"Saving final soundscape to '{output_path}'")
        write_wav(output_path, self.sample_rate, total_scene_audio)
        
        if os.path.exists(temp_prompt_filename):
            os.remove(temp_prompt_filename)
        
        return str(output_path)

# Singleton instance to ensure the model is loaded only once
_procedural_sound_service_instance = None

def get_procedural_sound_service() -> ProceduralSoundService:
    global _procedural_sound_service_instance
    if _procedural_sound_service_instance is None:
        _procedural_sound_service_instance = ProceduralSoundService()
    return _procedural_sound_service_instance
