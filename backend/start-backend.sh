#!/bin/bash

# Backend startup script for Diala
echo "🚀 Starting Diala Backend API..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set Python path to include src directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Start the backend server using our controlled script
# This ensures that the `reload=False` setting in `run_server.py` is used,
# preventing multiple processes from loading the ASR models.
echo "📡 Starting FastAPI server on http://localhost:8000 via run_server.py"
python run_server.py
