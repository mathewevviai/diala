#!/bin/bash
# Build script for Chatterbox streaming service with GPU backend selection

# Default to ROCm
BACKEND=${1:-rocm}

echo "Building Chatterbox streaming service for $BACKEND backend..."

case $BACKEND in
    rocm)
        echo "Using ROCm Dockerfile..."
        docker build -f Dockerfile -t chatterbox-streaming:rocm .
        ;;
    cuda)
        echo "Using CUDA Dockerfile..."
        docker build -f Dockerfile.cuda -t chatterbox-streaming:cuda .
        ;;
    universal)
        echo "Building universal image with $BACKEND backend..."
        docker build -f Dockerfile.universal \
            --build-arg GPU_BACKEND=$BACKEND \
            -t chatterbox-streaming:$BACKEND .
        ;;
    *)
        echo "Unknown backend: $BACKEND"
        echo "Usage: $0 [rocm|cuda|universal]"
        exit 1
        ;;
esac

echo "Build complete!"