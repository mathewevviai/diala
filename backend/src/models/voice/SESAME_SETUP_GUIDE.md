# Sesame CSM-1B Setup Guide

## Overview
This guide provides the exact same smart strategy used by Kokoro to set up Sesame CSM-1B without creating multiple virtual environments or reinstalling PyTorch.

## Prerequisites
- Backend virtual environment already exists at `backend/venv/`
- PyTorch is already installed in the backend environment
- Hugging Face CLI is available

## Step 1: Download Model Using Hugging Face CLI

```bash
# Navigate to backend directory
cd /home/bozo/projects/projectBozo/diala/backend/

# Activate backend environment
source venv/bin/activate

# Install Hugging Face CLI if not already installed
pip install huggingface_hub

# Download CSM-1B model to shared cache
huggingface-cli download eustlb/csm-1b --local-dir ./src/models/voice/csm-1b-model --local-dir-use-symlinks False
```

## Step 2: Install Sesame Dependencies (Shared Environment)

```bash
# Ensure we're in the backend environment
cd /home/bozo/projects/projectBozo/diala/backend/
source venv/bin/activate

# Navigate to CSM Sesame directory
cd src/models/voice/csm-streaming-tf/

# Install dependencies using shared backend environment
pip install -r requirements.txt --no-deps  # Skip PyTorch since it exists

# Install additional dependencies if needed
pip install transformers torchaudio
```

## Step 3: Create Sesame Service Script (Kokoro Pattern)

Create `start-sesame.sh` in the CSM directory:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Ensure we run from the CSM project directory
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

# Use backend's existing venv (same as Kokoro)
BACKEND_VENV_REL="../../../../venv"
if [ -d "$BACKEND_VENV_REL" ]; then
    echo "Using backend venv at $BACKEND_VENV_REL"
    source "$BACKEND_VENV_REL/bin/activate"
else
    echo "Backend venv not found, using system Python"
fi

# Set environment variables
export PYTHONPATH="$PROJECT_ROOT:$PROJECT_ROOT"
export MODEL_PATH="$PROJECT_ROOT/../../../models/voice/csm-1b-model"

# Start Sesame service on port 8883
python -m uvicorn generator:app --host 0.0.0.0 --port 8883 --reload
```

Make it executable:
```bash
chmod +x start-sesame.sh
```

## Step 4: Update Backend Configuration

Add to backend `.env`:
```bash
SESAME_API_URL=http://localhost:8883/v1
```

## Step 5: Update Package.json (Kokoro Pattern)

Add to root `package.json`:
```json
"sesame": "cd backend/src/models/voice/csm-streaming-tf && ./start-sesame.sh",
"sesame:setup": "cd backend && source venv/bin/activate && pip install -r src/models/voice/csm-streaming-tf/requirements.txt"
```

## Step 6: Verification Commands

```bash
# Test Sesame service
npm run sesame:setup
npm run sesame

# Check if running
curl http://localhost:8883/v1/audio/speech -X POST -H "Content-Type: application/json" -d '{"text":"Hello world", "model":"csm-1b"}'
```

## Environment Variables

```bash
# Add to backend .env
SESAME_API_URL=http://localhost:8883/v1
```

## Troubleshooting

### Model Not Found
```bash
# Ensure model is downloaded
ls -la backend/src/models/voice/csm-1b-model/
```

### Port Already in Use
```bash
# Kill port 8883
lsof -ti:8883 | xargs kill -9
```

### Dependencies Issues
```bash
# Reinstall in shared environment
cd backend && source venv/bin/activate
cd src/models/voice/csm-streaming-tf/
pip install -r requirements.txt --force-reinstall
```

## Key Benefits (Same as Kokoro)
- ✅ **No new venv creation** - uses existing backend environment
- ✅ **No PyTorch reinstall** - leverages existing installation
- ✅ **Shared model cache** - models downloaded once, reused
- ✅ **Consistent startup pattern** - same as Kokoro service
- ✅ **Persistent environment** - survives restarts