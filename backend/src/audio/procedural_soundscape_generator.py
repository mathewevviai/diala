import os
import torch
import numpy as np
from scipy.io.wavfile import write as write_wav
from pathlib import Path
import logging

# --- START OF MONKEY-PATCH ---
# This patch is critical for compatibility with recent PyTorch versions.
from bark.generation import _load_model as bark_original_load_model, MODELS

def patched_load_model(ckpt_path, device):
    """Patched version of bark's model loader to set weights_only=False."""
    logging.info(f"Applying patch: Loading {os.path.basename(ckpt_path)} with weights_only=False")
    checkpoint = torch.load(ckpt_path, map_location=device, weights_only=False)
    model = MODELS[checkpoint["model_type"]](**checkpoint["model_args"])
    model.load_state_dict(checkpoint["model"])
    model.to(device)
    model.eval()
    return model

# Replace the function in the loaded Bark library with our patched version
import bark.generation
bark.generation._load_model = patched_load_model
# --- END OF MONKEY-PATCH ---

from bark import SAMPLE_RATE, generate_audio, save_as_prompt

# --- Service Configuration ---
logger = logging.getLogger(__name__)
RESULTS_DIR = Path(__file__).resolve().parent.parent.parent / "results" / "procedural_audio"
MODELS_CACHE_DIR = "./bark_models_cache"

class ProceduralSoundService:
    def __init__(self):
        self.sample_rate = SAMPLE_RATE
        # Ensure the results directory exists
        os.makedirs(RESULTS_DIR, exist_ok=True)
        # Set environment variable for model cache
        os.environ["XDG_CACHE_HOME"] = MODELS_CACHE_DIR
        self.load_model()

    def load_model(self):
        """
        Pre-loads the Bark model. The first call to generate_audio will trigger
        the download if models are not in the cache.
        """
        logger.info("Initializing Bark model. Models will be downloaded if not cached.")
        # A small, silent generation task to ensure models are loaded and ready.
        _ = generate_audio("[silence]", silent=True)
        logger.info("Bark models are loaded and ready.")

    def generate_scene(self, prompt: str, duration_seconds: int = 30) -> str:
        """
        Generates a long-form audio scene based on a text prompt and saves it to a file.

        Args:
            prompt (str): A text description of the scene, using Bark's non-speech tags.
            duration_seconds (int): The target duration of the final audio file.

        Returns:
            str: The absolute path to the generated .wav file.
        """
        logger.info(f"Starting procedural generation for prompt: '{prompt}'")
        
        # Bark generates in ~12-14 second chunks. Calculate how many continuations we need.
        num_continuations = max(0, (duration_seconds // 12) - 1)
        
        # 1. Generate the initial seed chunk from the text prompt
        total_scene_audio = generate_audio(prompt, silent=True)
        logger.info("Generated initial audio chunk.")

        # 2. Use a temporary file for the history prompt for continuation loops
        temp_prompt_filename = "temp_history_prompt.npz"

        for i in range(num_continuations):
            logger.info(f"Continuation loop {i+1}/{num_continuations}...")
            save_as_prompt(temp_prompt_filename, total_scene_audio)
            
            # Generate the next chunk based on the audio history
            new_audio_chunk = generate_audio("[silence]", history_prompt=temp_prompt_filename, silent=True)
            
            # Append the new chunk to the main audio track
            total_scene_audio = np.concatenate([total_scene_audio, new_audio_chunk])

        # 3. Save the final audio file to the results directory
        sanitized_prompt = "".join(filter(str.isalnum, prompt))[:30]
        final_filename = f"scene_{sanitized_prompt}_{duration_seconds}s.wav"
        output_path = RESULTS_DIR / final_filename

        logger.info(f"Saving final soundscape to '{output_path}'")
        write_wav(output_path, self.sample_rate, total_scene_audio)
        
        # Clean up the temporary file
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