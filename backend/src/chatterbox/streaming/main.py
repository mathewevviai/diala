"""
FastAPI server for Chatterbox TTS with ROCm support
"""
import os
import torch
import tempfile
import asyncio
import subprocess
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import uvicorn
import logging

# Import Chatterbox TTS
from chatterbox.tts import ChatterboxTTS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable TunableOp for optimal kernel selection
os.environ["PYTORCH_TUNABLEOP_ENABLED"] = "1"

# Check for Flash Attention 2 support
try:
    import flash_attn
    USE_FLASH_ATTENTION = True
    logger.info("Flash Attention 2 is available")
except ImportError:
    USE_FLASH_ATTENTION = False
    logger.warning("Flash Attention 2 not available")

# Initialize FastAPI app
app = FastAPI(
    title="Chatterbox TTS API",
    description="Text-to-Speech API with voice cloning support on ROCm",
    version="1.0.0"
)

# Global model instance
model = None

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "default"
    chunk_size: Optional[int] = 2048
    exaggeration: Optional[float] = 1.0
    cfg_weight: Optional[float] = 1.7

class VoiceInfo(BaseModel):
    id: str
    name: str
    description: str

def detect_gpu_backend():
    """Detect whether we're using ROCm or CUDA"""
    if torch.cuda.is_available():
        if hasattr(torch.version, 'hip') and torch.version.hip is not None:
            return "rocm"
        else:
            return "cuda"
    return "cpu"

@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup with GPU validation"""
    global model
    
    # Detect GPU backend
    backend = detect_gpu_backend()
    logger.info(f"Detected GPU backend: {backend}")
    
    # Backend-specific validation
    if backend == "rocm":
        # ROCm system validation
        try:
            result = subprocess.run(['rocm-smi'], capture_output=True, text=True)
            logger.info("ROCm SMI output:")
            logger.info(result.stdout)
        except Exception as e:
            logger.warning(f"Could not run rocm-smi: {e}")
    elif backend == "cuda":
        # CUDA system validation
        try:
            result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
            logger.info("NVIDIA SMI output:")
            logger.info(result.stdout)
        except Exception as e:
            logger.warning(f"Could not run nvidia-smi: {e}")
    
    # Check for GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    if device == "cuda":
        # Detailed GPU information
        props = torch.cuda.get_device_properties(0)
        logger.info(f"GPU detected: {props.name}")
        logger.info(f"GPU memory: {props.total_memory / 1024**3:.2f} GB")
        logger.info(f"Compute capability: {props.major}.{props.minor}")
        logger.info(f"Multi-processor count: {props.multi_processor_count}")
        
        # Backend version info
        if backend == "rocm":
            logger.info(f"ROCm version: {torch.version.hip}")
        elif backend == "cuda":
            logger.info(f"CUDA version: {torch.version.cuda}")
            logger.info(f"cuDNN version: {torch.backends.cudnn.version()}")
        
        # Log TunableOp status
        logger.info(f"TunableOp enabled: {os.environ.get('PYTORCH_TUNABLEOP_ENABLED', 'False')}")
    
    # Initialize model
    try:
        logger.info("Loading Chatterbox TTS model...")
        model = ChatterboxTTS.from_pretrained(device=device)
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    backend = detect_gpu_backend()
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "gpu_available": torch.cuda.is_available(),
        "gpu_backend": backend
    }

@app.get("/voices", response_model=List[VoiceInfo])
async def list_voices():
    """List available voices"""
    # For now, return default voices
    # This can be extended to load custom voice models
    return [
        VoiceInfo(
            id="default",
            name="Default Voice",
            description="Default Chatterbox TTS voice"
        ),
        VoiceInfo(
            id="custom",
            name="Custom Voice",
            description="Upload audio for voice cloning"
        )
    ]

@app.post("/generate")
async def generate_speech(request: TTSRequest):
    """Generate speech from text (non-streaming)"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Generate audio
        logger.info(f"Generating speech for text: {request.text[:50]}...")
        
        # For default voice, generate without audio prompt
        if request.voice_id == "default":
            audio = model.generate(
                text=request.text,
                chunk_size=request.chunk_size,
                exaggeration=request.exaggeration,
                cfg_weight=request.cfg_weight
            )
        else:
            # For custom voice, would need audio_prompt_path
            # This would be handled in a separate endpoint with file upload
            raise HTTPException(
                status_code=400, 
                detail="Custom voice requires audio file upload"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            # Save audio tensor to file
            import torchaudio
            torchaudio.save(tmp_file.name, audio.cpu(), 24000)  # Assuming 24kHz sample rate
            
            # Return audio file
            return StreamingResponse(
                open(tmp_file.name, "rb"),
                media_type="audio/wav",
                headers={"Content-Disposition": f"attachment; filename=speech.wav"}
            )
            
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_with_voice")
async def generate_with_voice_cloning(
    text: str = Form(...),
    voice_audio: UploadFile = File(...),
    chunk_size: int = Form(2048),
    exaggeration: float = Form(1.0),
    cfg_weight: float = Form(1.7)
):
    """Generate speech with voice cloning from uploaded audio"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
            content = await voice_audio.read()
            tmp_audio.write(content)
            tmp_audio.flush()
            
            logger.info(f"Generating speech with voice cloning...")
            
            # Generate audio with voice cloning
            audio = model.generate(
                text=text,
                audio_prompt_path=tmp_audio.name,
                chunk_size=chunk_size,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight
            )
            
            # Save generated audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_output:
                import torchaudio
                torchaudio.save(tmp_output.name, audio.cpu(), 24000)
                
                # Return audio file
                return StreamingResponse(
                    open(tmp_output.name, "rb"),
                    media_type="audio/wav",
                    headers={"Content-Disposition": f"attachment; filename=cloned_speech.wav"}
                )
                
    except Exception as e:
        logger.error(f"Error in voice cloning: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temporary file
        if 'tmp_audio' in locals():
            os.unlink(tmp_audio.name)

@app.post("/generate_stream")
async def generate_speech_stream(request: TTSRequest):
    """Generate speech from text (streaming) - placeholder for future implementation"""
    raise HTTPException(
        status_code=501, 
        detail="Streaming generation not implemented in Phase 1"
    )

async def get_gpu_metrics() -> Dict[str, Any]:
    """Get GPU utilization metrics"""
    backend = detect_gpu_backend()
    metrics = {
        "gpu_available": torch.cuda.is_available(),
        "gpu_backend": backend,
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
        if backend == "rocm":
            metrics["rocm_version"] = torch.version.hip if hasattr(torch.version, 'hip') else "N/A"
            # Try to get temperature from rocm-smi
            try:
                result = subprocess.run(['rocm-smi', '--showtemp'], capture_output=True, text=True)
                if result.returncode == 0:
                    metrics["gpu_temperature"] = "See rocm-smi output"
            except:
                pass
        elif backend == "cuda":
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

@app.get("/metrics")
async def metrics():
    """Endpoint for monitoring GPU metrics"""
    return await get_gpu_metrics()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)