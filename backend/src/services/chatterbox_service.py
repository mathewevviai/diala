"""
Chatterbox TTS Service

Singleton service for managing the Chatterbox TTS model and providing
TTS operations within the main application process.
"""

import os
import torch
import tempfile
import subprocess
import asyncio
from typing import Optional, Dict, Any, Callable
import logging
import threading
import time
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

# Enable TunableOp for optimal kernel selection
os.environ["PYTORCH_TUNABLEOP_ENABLED"] = "1"


class ChatterboxService:
    """Singleton service for Chatterbox TTS operations"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the service (only runs once due to singleton)"""
        if self._initialized:
            return
            
        self.model = None
        self.device = None
        self.backend = None
        self.model_loaded = False
        self.loading_error = None
        self.loading_progress = 0
        self.loading_stage = ""
        self.download_progress = {}
        
        # Configuration
        self.preload_model = os.getenv("CHATTERBOX_PRELOAD_MODEL", "false").lower() == "true"
        
        # Check for Flash Attention 2 support
        try:
            import flash_attn
            self.flash_attention_available = True
            logger.info("Flash Attention 2 is available")
        except ImportError:
            self.flash_attention_available = False
            logger.warning("Flash Attention 2 not available")
        
        # Detect GPU backend
        self._detect_gpu_backend()
        
        # Optionally preload model
        if self.preload_model:
            try:
                self._load_model()
            except Exception as e:
                logger.error(f"Failed to preload model: {str(e)}")
                self.loading_error = str(e)
        
        self._initialized = True
    
    def _detect_gpu_backend(self):
        """Detect whether we're using ROCm or CUDA"""
        if torch.cuda.is_available():
            if hasattr(torch.version, 'hip') and torch.version.hip is not None:
                self.backend = "rocm"
            else:
                self.backend = "cuda"
            self.device = "cuda"
        else:
            self.backend = "cpu"
            self.device = "cpu"
        
        logger.info(f"Detected GPU backend: {self.backend}")
        
        # Log GPU information if available
        if self.device == "cuda":
            props = torch.cuda.get_device_properties(0)
            logger.info(f"GPU detected: {props.name}")
            logger.info(f"GPU memory: {props.total_memory / 1024**3:.2f} GB")
    
    def _download_with_progress(self, repo_id: str, filename: str, max_retries: int = 3) -> str:
        """Download model file with progress tracking and retries"""
        from huggingface_hub import hf_hub_download
        import requests
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        
        # Setup retry strategy
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=2,  # 2, 4, 8 seconds
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        
        # Create session with retry
        session = requests.Session()
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set longer timeout
        session.timeout = 300  # 5 minutes
        
        attempt = 0
        last_error = None
        
        while attempt < max_retries:
            try:
                attempt += 1
                logger.info(f"Downloading {filename} (attempt {attempt}/{max_retries})")
                
                # Update progress
                self.download_progress[filename] = {
                    "status": "downloading",
                    "progress": 0,
                    "attempt": attempt
                }
                
                # Try to download with progress callback
                def progress_callback(block_num, block_size, total_size):
                    if total_size > 0:
                        progress = min(100, (block_num * block_size) / total_size * 100)
                        self.download_progress[filename]["progress"] = progress
                        if progress % 10 == 0:  # Log every 10%
                            logger.info(f"{filename}: {progress:.1f}% downloaded")
                
                # Download with huggingface_hub (it handles caching)
                local_path = hf_hub_download(
                    repo_id=repo_id,
                    filename=filename,
                    local_dir_use_symlinks=False,
                    resume_download=True,  # Resume partial downloads
                )
                
                self.download_progress[filename] = {
                    "status": "completed",
                    "progress": 100,
                    "path": local_path
                }
                
                logger.info(f"Successfully downloaded {filename}")
                return local_path
                
            except Exception as e:
                last_error = e
                logger.warning(f"Download attempt {attempt} failed for {filename}: {str(e)}")
                
                self.download_progress[filename] = {
                    "status": "failed",
                    "progress": 0,
                    "error": str(e),
                    "attempt": attempt
                }
                
                if attempt < max_retries:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                
        # All retries exhausted
        raise Exception(f"Failed to download {filename} after {max_retries} attempts. Last error: {last_error}")
    
    def _load_model(self, progress_callback: Optional[Callable[[str, float], None]] = None):
        """Load the Chatterbox TTS model with progress tracking"""
        if self.model_loaded:
            return
        
        try:
            self.loading_stage = "Initializing"
            self.loading_progress = 0
            logger.info("Loading Chatterbox TTS model...")
            
            if progress_callback:
                progress_callback("Initializing", 0)
            
            # Import here to avoid loading at module level
            from chatterbox.tts import ChatterboxTTS
            
            # Download model files with retry logic
            self.loading_stage = "Downloading model files"
            self.loading_progress = 10
            
            if progress_callback:
                progress_callback("Downloading model files", 10)
            
            # Model files to download
            model_files = ["ve.pt", "t3_cfg.pt", "s3gen.pt", "tokenizer.json", "conds.pt"]
            repo_id = "ResembleAI/chatterbox"
            
            downloaded_files = {}
            for i, filename in enumerate(model_files):
                self.loading_stage = f"Downloading {filename}"
                progress = 10 + (i * 15)  # 10-85% for downloads
                self.loading_progress = progress
                
                if progress_callback:
                    progress_callback(self.loading_stage, progress)
                
                try:
                    local_path = self._download_with_progress(repo_id, filename)
                    downloaded_files[filename] = local_path
                except Exception as e:
                    logger.error(f"Failed to download {filename}: {str(e)}")
                    raise
            
            # Load model from downloaded files
            self.loading_stage = "Loading model into memory"
            self.loading_progress = 85
            
            if progress_callback:
                progress_callback("Loading model into memory", 85)
            
            # Get directory of first downloaded file
            model_dir = Path(downloaded_files["ve.pt"]).parent
            
            # Load model using the local files
            self.model = ChatterboxTTS.from_local(model_dir, device=self.device)
            
            self.loading_stage = "Model ready"
            self.loading_progress = 100
            self.model_loaded = True
            self.loading_error = None
            
            if progress_callback:
                progress_callback("Model ready", 100)
            
            logger.info("Model loaded successfully!")
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self.loading_error = str(e)
            self.loading_stage = "Failed"
            
            if progress_callback:
                progress_callback(f"Failed: {str(e)}", self.loading_progress)
            
            raise
    
    async def ensure_model_loaded(self, progress_callback: Optional[Callable[[str, float], None]] = None):
        """Ensure model is loaded before using it"""
        if not self.model_loaded:
            # Run model loading in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_model, progress_callback)
    
    async def get_health_info(self) -> Dict[str, Any]:
        """Get health and status information"""
        return {
            "status": "healthy" if self.model_loaded or not self.loading_error else "degraded",
            "model_loaded": self.model_loaded,
            "loading_error": self.loading_error,
            "loading_progress": self.loading_progress,
            "loading_stage": self.loading_stage,
            "device": self.device,
            "gpu_available": torch.cuda.is_available(),
            "gpu_backend": self.backend,
            "flash_attention": self.flash_attention_available,
            "download_status": self.download_progress
        }
    
    async def get_gpu_metrics(self) -> Dict[str, Any]:
        """Get GPU utilization metrics"""
        metrics = {
            "gpu_available": torch.cuda.is_available(),
            "gpu_backend": self.backend,
            "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
        }
        
        if torch.cuda.is_available():
            metrics.update({
                "gpu_name": torch.cuda.get_device_name(0),
                "gpu_memory_used_gb": torch.cuda.memory_allocated() / 1024**3,
                "gpu_memory_cached_gb": torch.cuda.memory_reserved() / 1024**3,
                "gpu_memory_total_gb": torch.cuda.get_device_properties(0).total_memory / 1024**3,
                "gpu_utilization": torch.cuda.utilization() if hasattr(torch.cuda, 'utilization') else "N/A"
            })
            
            # Backend-specific metrics
            if self.backend == "rocm":
                metrics["rocm_version"] = torch.version.hip if hasattr(torch.version, 'hip') else "N/A"
                # Try to get temperature from rocm-smi
                try:
                    result = subprocess.run(['rocm-smi', '--showtemp'], capture_output=True, text=True)
                    if result.returncode == 0:
                        metrics["gpu_temperature"] = "See rocm-smi output"
                except:
                    pass
            elif self.backend == "cuda":
                metrics["cuda_version"] = torch.version.cuda
                metrics["cudnn_version"] = torch.backends.cudnn.version()
                # Try to get temperature from nvidia-smi
                try:
                    result = subprocess.run(['nvidia-smi', '--query-gpu=temperature.gpu', '--format=csv,noheader,nounits'], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        metrics["gpu_temperature_c"] = int(result.stdout.strip())
                except:
                    pass
        
        return metrics
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str = "default",
        chunk_size: int = 2048,
        exaggeration: float = 1.0,
        cfg_weight: float = 1.7
    ) -> str:
        """
        Generate speech from text
        
        Returns:
            Path to generated audio file
        """
        # Ensure model is loaded
        await self.ensure_model_loaded()
        
        # Generate in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._generate_speech_sync,
            text, voice_id, chunk_size, exaggeration, cfg_weight
        )
        
        return result
    
    def _generate_speech_sync(
        self,
        text: str,
        voice_id: str,
        chunk_size: int,
        exaggeration: float,
        cfg_weight: float
    ) -> str:
        """Synchronous speech generation"""
        # For default voice, generate without audio prompt
        if voice_id == "default":
            # Note: chunk_size is not used by ChatterboxTTS.generate()
            audio = self.model.generate(
                text=text,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight
            )
        else:
            # For custom voice, would need audio_prompt_path
            raise ValueError("Custom voice requires audio file upload")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            # Save audio tensor to file
            import torchaudio
            torchaudio.save(tmp_file.name, audio.cpu(), 24000)  # Assuming 24kHz sample rate
            return tmp_file.name
    
    async def generate_with_voice_cloning(
        self,
        text: str,
        audio_prompt_path: str,
        chunk_size: int = 2048,
        exaggeration: float = 1.0,
        cfg_weight: float = 1.7,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> str:
        """
        Generate speech with voice cloning
        
        Returns:
            Path to generated audio file
        """
        # Ensure model is loaded with progress tracking
        await self.ensure_model_loaded(progress_callback)
        
        # Generate in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._generate_with_voice_cloning_sync,
            text, audio_prompt_path, chunk_size, exaggeration, cfg_weight
        )
        
        return result
    
    def _generate_with_voice_cloning_sync(
        self,
        text: str,
        audio_prompt_path: str,
        chunk_size: int,
        exaggeration: float,
        cfg_weight: float
    ) -> str:
        """Synchronous speech generation with voice cloning"""
        # Generate audio with voice cloning
        # Note: chunk_size is not used by ChatterboxTTS.generate()
        audio = self.model.generate(
            text=text,
            audio_prompt_path=audio_prompt_path,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight
        )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            import torchaudio
            torchaudio.save(tmp_file.name, audio.cpu(), 24000)
            return tmp_file.name