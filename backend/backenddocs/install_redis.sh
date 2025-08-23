#!/bin/bash
# Install redis Python package in the virtual environment

echo "Installing redis Python package..."

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    echo "Error: Please run this script from the backend directory"
    exit 1
fi

# Check if venv is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Install redis
pip install redis>=4.0.0

echo "Redis package installed successfully!"
echo "You can now restart the server with: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"