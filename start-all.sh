#!/bin/bash

# Diala All-in-One Development Server Startup Script
# This script starts:
# 1. Backend API server (FastAPI on port 8000)
# 2. Convex development server (port 3210)
# 3. Frontend Next.js server (port 3000)

echo "🚀 Starting Diala Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s $url >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start${NC}"
    return 1
}

# Check required ports
echo "🔍 Checking ports..."
check_port 8000 || exit 1
check_port 3210 || exit 1
check_port 3000 || exit 1

# Install backend dependencies if needed
echo -e "${YELLOW}📦 Checking backend dependencies...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Check if uvicorn is available
if ! command -v uvicorn &> /dev/null; then
    echo -e "${YELLOW}Installing uvicorn...${NC}"
    pip install uvicorn[standard]
fi

cd ..

# Start all services using concurrently
echo -e "${GREEN}🎯 Starting all services...${NC}"

# Use concurrently to run all services
npx concurrently \
    --names "BACKEND,CONVEX,FRONTEND" \
    --prefix-colors "bgBlue.bold,bgMagenta.bold,bgGreen.bold" \
    --kill-others \
    "cd backend && source venv/bin/activate && PYTHONPATH=src uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" \
    "cd frontend && npx convex dev" \
    "cd frontend && npm run dev"

echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo "📋 Service URLs:"
echo "  • Backend API: http://localhost:8000"
echo "  • Convex: http://localhost:3210"
echo "  • Frontend: http://localhost:3000"
echo "  • API Docs: http://localhost:8000/docs"
echo ""
echo "🔍 To check if services are running:"
echo "  • Backend health: curl http://localhost:8000/health"
echo "  • Transcribe endpoint: curl -X POST http://localhost:8000/api/public/audio/transcribe"