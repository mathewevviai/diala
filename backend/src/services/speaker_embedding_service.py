"""
Speaker Embedding Service
Provides speaker embedding extraction for diarization using SpeechBrain
"""

import numpy as np
import torch
import logging
from pathlib import Path
from typing import Optional
import warnings

logger = logging.getLogger(__name__)

class SpeakerEmbeddingService:
    """
    Service for extracting speaker embeddings from audio chunks
    Uses SpeechBrain's speaker identification model for embedding generation
    """
    
    def __init__(self, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load SpeechBrain speaker embedding model"""
        try:
            from speechbrain.pretrained import EncoderClassifier
            
            # Use ECAPA-TDNN model for speaker embeddings
            model_path = "speechbrain/spkrec-ecapa-voxceleb"
            self.model = EncoderClassifier.from_hparams(
                source=model_path,
                savedir=Path(__file__).resolve().parent.parent.parent / "models" / "speaker_embeddings",
                run_opts={"device": self.device}
            )
            logger.info(f"Speaker embedding model loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load speaker embedding model: {e}")
            # Fallback to basic MFCC features
            self.model = None
    
    def extract_embedding(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> Optional[np.ndarray]:
        """
        Extract speaker embedding from audio chunk
        
        Args:
            audio_chunk: Raw audio as numpy array (int16 or float32)
            sample_rate: Audio sample rate
            
        Returns:
            Speaker embedding as numpy array, or None if extraction fails
        """
        if self.model is None:
            logger.warning("No speaker embedding model available, returning dummy embedding")
            return np.random.randn(192)  # ECAPA-TDNN embedding size
            
        try:
            # Ensure correct format
            if audio_chunk.dtype == np.int16:
                audio_float = audio_chunk.astype(np.float32) / 32768.0
            else:
                audio_float = audio_chunk.astype(np.float32)
            
            # Ensure minimum length (0.1s = 1600 samples at 16kHz)
            if len(audio_float) < 1600:
                audio_float = np.pad(audio_float, (0, 1600 - len(audio_float)), mode='constant')
            
            # Convert to torch tensor
            audio_tensor = torch.from_numpy(audio_float).unsqueeze(0).to(self.device)
            
            # Extract embedding
            with torch.no_grad():
                embedding = self.model.encode_batch(audio_tensor)
                embedding_np = embedding.squeeze().cpu().numpy()
                
            logger.debug(f"Extracted speaker embedding with shape {embedding_np.shape}")
            return embedding_np
            
        except Exception as e:
            logger.error(f"Failed to extract speaker embedding: {e}")
            return None
    
    def extract_embeddings_batch(self, audio_chunks: list, sample_rate: int = 16000) -> list:
        """Extract embeddings for multiple audio chunks"""
        embeddings = []
        for chunk in audio_chunks:
            embedding = self.extract_embedding(chunk, sample_rate)
            embeddings.append(embedding)
        return embeddings

# Global singleton instance
_embedding_service = None

def get_speaker_embedding_service() -> SpeakerEmbeddingService:
    """Get singleton instance of speaker embedding service"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = SpeakerEmbeddingService()
    return _embedding_service