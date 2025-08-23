# Dual GPU Backend Support (ROCm and CUDA)

This implementation supports both AMD GPUs (via ROCm) and NVIDIA GPUs (via CUDA) for maximum flexibility.

## Quick Start

### For ROCm (Production - AMD MI300X)
```bash
# Build and run with ROCm
docker-compose up chatterbox-streaming
```

### For CUDA (Local Development - NVIDIA GPUs)
```bash
# Build and run with CUDA
docker-compose -f docker-compose.yml -f docker-compose.cuda.yml up chatterbox-streaming
```

## Backend Detection

The service automatically detects the GPU backend at runtime:
- **ROCm**: Detected when PyTorch has HIP support
- **CUDA**: Detected when PyTorch has CUDA support
- **CPU**: Fallback when no GPU is available

## Building Images

### Using the build script:
```bash
# Build for ROCm (default)
./build.sh

# Build for CUDA
./build.sh cuda

# Build universal image
./build.sh universal
```

### Manual Docker builds:
```bash
# ROCm build
docker build -f Dockerfile -t chatterbox-streaming:rocm .

# CUDA build
docker build -f Dockerfile.cuda -t chatterbox-streaming:cuda .
```

## Environment Variables

### Common Variables (Both Backends)
- `PYTORCH_TUNABLEOP_ENABLED=1` - Enable kernel optimization
- `LOG_LEVEL=INFO` - Logging level

### ROCm-Specific
- `HSA_OVERRIDE_GFX_VERSION=11.0.0` - MI300X compatibility
- `ROCM_PATH=/opt/rocm` - ROCm installation path
- `HIP_VISIBLE_DEVICES=0` - GPU selection
- `PYTORCH_HIP_ALLOC_CONF` - Memory configuration

### CUDA-Specific
- `CUDA_VISIBLE_DEVICES=0` - GPU selection

## API Endpoints

All endpoints work identically regardless of backend:
- `/health` - Shows detected backend in response
- `/metrics` - Returns backend-specific GPU metrics

## Testing

The test script automatically detects and validates the GPU backend:
```bash
python test_api.py
```

Output will show:
- "Backend: ROCm" with ROCm version
- "Backend: CUDA" with CUDA/cuDNN versions

## Performance Considerations

### ROCm (AMD GPUs)
- TunableOp optimizes for rocBLAS/hipBLASLt kernels
- Optimized for MI300X series
- Flash Attention 2 available via CK implementation

### CUDA (NVIDIA GPUs)
- TunableOp optimizes for cuBLAS/cuBLASLt kernels
- Standard PyTorch CUDA optimizations apply
- Flash Attention 2 available via standard implementation

## Troubleshooting

### Backend Detection Issues
Check the `/health` endpoint:
```json
{
  "status": "healthy",
  "gpu_backend": "rocm|cuda|cpu"
}
```

### Wrong Backend Detected
1. Check PyTorch installation:
   ```python
   import torch
   print(torch.version.cuda)  # CUDA version
   print(torch.version.hip)   # ROCm version
   ```

2. Verify Docker runtime:
   - ROCm: Requires `runtime: nvidia` (compatible)
   - CUDA: Requires `runtime: nvidia`

### Performance Differences
- ROCm: Check `tunableop_results.csv` for kernel selection
- CUDA: Ensure cuDNN is properly configured
- Both: Monitor via `/metrics` endpoint

## Development Workflow

1. **Local Development (CUDA)**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.cuda.yml up
   ```

2. **Test on ROCm**:
   ```bash
   docker-compose up chatterbox-streaming
   ```

3. **Switch backends without rebuild**:
   - Stop containers
   - Switch docker-compose files
   - Start with new backend

This dual-backend approach ensures seamless development on NVIDIA GPUs while maintaining production readiness for AMD MI300X GPUs.