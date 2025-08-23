# Use specific ROCm PyTorch version for stability
FROM rocm/pytorch:rocm6.2.3_ubuntu22.04_py3.10_pytorch_release_2.3.0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3-pip \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1

# Set working directory
WORKDIR /app

# Copy the chatterbox-streaming code
COPY . .

# Upgrade pip
RUN python -m pip install --upgrade pip

# Install PyTorch with ROCm support
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.2

# Install chatterbox-streaming package
RUN pip install -e .

# Install additional dependencies for API server
RUN pip install fastapi uvicorn pydantic python-multipart

# Set environment variables for ROCm MI300X optimization
ENV HSA_OVERRIDE_GFX_VERSION=11.0.0
ENV ROCM_PATH=/opt/rocm
ENV HIP_VISIBLE_DEVICES=0
# Memory management for MI300X
ENV PYTORCH_HIP_ALLOC_CONF=garbage_collection_threshold:0.9,max_split_size_mb:512
# Enable TunableOp for automatic GEMM kernel optimization
ENV PYTORCH_TUNABLEOP_ENABLED=1
ENV PYTORCH_TUNABLEOP_TUNING=1
# Disable NUMA balancing for optimal performance
ENV NUMA_BALANCING=0

# Create directory for model weights
RUN mkdir -p /app/models

# Expose API port
EXPOSE 8001

# Run the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]