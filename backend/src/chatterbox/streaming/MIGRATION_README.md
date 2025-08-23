# Chatterbox-Streaming Migration with ROCm Support

This directory contains the migrated chatterbox-streaming service configured to run on AMD GPUs using ROCm, following AMD's official best practices for MI300X series GPUs.

**Note**: This implementation also supports NVIDIA GPUs (CUDA) for local development. See [README_DUAL_BACKEND.md](README_DUAL_BACKEND.md) for details on using both backends.

## Overview

The service has been containerized and configured to:
- Use AMD ROCm instead of CUDA for GPU acceleration
- Run as an isolated FastAPI service on port 8001
- Support both default TTS and voice cloning
- Integrate with the main Diala backend

## Architecture

```
backend/
├── src/
│   ├── chatterbox/
│   │   └── streaming/          # This directory
│   │       ├── main.py         # FastAPI server
│   │       ├── Dockerfile      # ROCm-enabled container
│   │       └── ...            # Chatterbox-streaming code
│   └── services/
│       └── chatterbox_client.py  # Client for API communication
```

## ROCm Configuration

The service is configured to use AMD GPUs (MI300X series) with:
- ROCm PyTorch 2.3.0 with ROCm 6.2.3 base image for stability
- Device mappings for `/dev/kfd` and `/dev/dri`
- Environment variables for optimal MI300X performance
- TunableOp enabled for automatic GEMM kernel optimization
- Flash Attention 2 support (when available)
- NUMA balancing disabled for optimal performance
- GPU metrics monitoring endpoint

## API Endpoints

- `GET /health` - Health check with GPU status
- `GET /voices` - List available voices
- `POST /generate` - Generate speech from text
- `POST /generate_with_voice` - Generate speech with voice cloning
- `POST /generate_stream` - Streaming generation (Phase 2)
- `GET /metrics` - GPU utilization metrics

## Running the Service

### Using Docker Compose (Recommended)

From the project root:
```bash
docker-compose up chatterbox-streaming
```

### Standalone Docker

```bash
cd backend/src/chatterbox/streaming
docker build -t chatterbox-rocm .
docker run --runtime=nvidia \
  --device=/dev/kfd --device=/dev/dri \
  --group-add video \
  -e HSA_OVERRIDE_GFX_VERSION=11.0.0 \
  -p 8001:8001 \
  chatterbox-rocm
```

### Testing

Run the test script:
```bash
cd backend/src/chatterbox/streaming
python test_api.py
```

## Environment Variables

- `HSA_OVERRIDE_GFX_VERSION=11.0.0` - AMD MI300X GPU compatibility
- `ROCM_PATH=/opt/rocm` - ROCm installation path
- `HIP_VISIBLE_DEVICES=0` - GPU device selection
- `PYTORCH_HIP_ALLOC_CONF=garbage_collection_threshold:0.9,max_split_size_mb:512` - Memory management
- `PYTORCH_TUNABLEOP_ENABLED=1` - Enable automatic kernel optimization
- `PYTORCH_TUNABLEOP_TUNING=1` - Enable kernel tuning
- `NUMA_BALANCING=0` - Disable NUMA balancing for performance

## GPU Verification

Inside the container:
```bash
# Check ROCm installation
rocm-smi

# Verify PyTorch GPU access
python -c "import torch; print(torch.cuda.is_available())"
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

## Client Usage

### Async Client
```python
from services.chatterbox_client import ChatterboxClient

async with ChatterboxClient() as client:
    audio = await client.generate_speech("Hello world")
    await client.save_audio(audio, "output.wav")
```

### Sync Client
```python
from services.chatterbox_client import ChatterboxClientSync

client = ChatterboxClientSync()
audio = client.generate_speech("Hello world")
```

## Next Steps

- Phase 2: Implement streaming generation
- Phase 3: Integrate with main orchestrator
- Phase 4: Add voice management UI
- Phase 5: Performance optimization

## Performance Optimizations

1. **TunableOp**: Automatically selects optimal GEMM kernels from rocBLAS and hipBLASLt
2. **Flash Attention 2**: Reduces memory movements for attention modules (install separately)
3. **Memory Management**: Optimized HIP allocation settings for MI300X
4. **NUMA Balancing**: Disabled to prevent GPU hangs during periodic balancing

## ROCm Best Practices Applied

Based on official ROCm documentation:
- Using specific ROCm version for stability (6.2.3)
- TunableOp enabled for automatic performance optimization
- Proper memory allocation configuration for large models
- System health checks integrated (rocm-smi validation)
- GPU metrics monitoring for production deployment

## Troubleshooting

1. **GPU not detected**: 
   - Ensure ROCm drivers are installed on host
   - Check `rocm-smi` output
   - Verify device permissions for /dev/kfd and /dev/dri

2. **Memory errors**: 
   - Adjust `PYTORCH_HIP_ALLOC_CONF` settings
   - Monitor GPU memory usage via `/metrics` endpoint
   - Consider reducing batch size or model size

3. **Performance issues**: 
   - Verify TunableOp is enabled (`PYTORCH_TUNABLEOP_ENABLED=1`)
   - Check TunableOp results in `/app/tunableop_results.csv`
   - Consider installing Flash Attention 2 for attention-heavy models

4. **ROCm validation**:
   - Run `python test_api.py` to validate ROCm setup
   - Check `/health` and `/metrics` endpoints
   - Review container logs for startup validation