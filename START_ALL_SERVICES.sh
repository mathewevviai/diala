#!/bin/bash
# Start all services for Diala application

echo "=== Starting Diala Services ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists redis-server; then
    echo -e "${RED}Warning: Redis is not installed (required for full functionality)${NC}"
fi

echo -e "${GREEN}Prerequisites check passed!${NC}"
echo ""

# Start Redis if available
if command_exists redis-server; then
    echo -e "${BLUE}Starting Redis...${NC}"
    redis-server --daemonize yes
    echo -e "${GREEN}Redis started${NC}"
    echo ""
fi

# Create Python virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}Virtual environment created${NC}"
    echo ""
fi

# Start Python backend
echo -e "${BLUE}Starting Python backend...${NC}"
cd backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo -e "${RED}Warning: Running without virtual environment${NC}"
fi

# Start backend in background
python3 run_server.py &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
echo ""

# Start frontend services
echo -e "${BLUE}Starting frontend services (Convex + Next.js)...${NC}"
cd frontend
npm run dev:all &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Frontend services started with PID: $FRONTEND_PID${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    if command_exists redis-cli; then
        redis-cli shutdown 2>/dev/null
    fi
    echo -e "${GREEN}All services stopped${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Show status
echo ""
echo -e "${GREEN}=== All Services Started ===${NC}"
echo ""
echo "Services running at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Backend Health: http://localhost:8000/health"
echo "- Convex Dashboard: http://127.0.0.1:6790/?d=anonymous-Diala"
echo ""
echo "YouTube Transcript feature available at:"
echo "http://localhost:3000/onboarding/transcripts"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
wait