#!/bin/bash

# Diala Setup Script - Install all dependencies
echo "🔧 Setting up Diala Development Environment..."

# Frontend setup
echo "📦 Setting up frontend dependencies..."
cd frontend
npm install
cd ..

# Backend setup
echo "📦 Setting up backend dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "🚀 To start all services:"
echo "  cd frontend && npm run dev"
echo ""
echo "📋 This will start:"
echo "  • Backend API: http://localhost:8000"
echo "  • Convex: http://localhost:3210"  
echo "  • Frontend: http://localhost:3000"