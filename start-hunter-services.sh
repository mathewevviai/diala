#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Hunter Search Services ===${NC}"
echo ""

# Function to check if a service is running
check_service() {
    local name=$1
    local url=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$response" != "000" ]; then
        echo -e "${GREEN}✓ $name is already running${NC}"
        return 0
    else
        echo -e "${YELLOW}Starting $name...${NC}"
        return 1
    fi
}

# Start services in tmux or separate terminals
if command -v tmux &> /dev/null; then
    echo "Using tmux for service management..."
    
    # Create a new tmux session
    tmux new-session -d -s hunter-services
    
    # Start Backend
    if ! check_service "Backend" "http://localhost:8000/api/public/hunter/health"; then
        tmux new-window -t hunter-services -n backend
        tmux send-keys -t hunter-services:backend "cd $(pwd)/backend && source venv/bin/activate 2>/dev/null; python -m src.main" Enter
    fi
    
    # Start Frontend
    if ! check_service "Frontend" "http://localhost:3000"; then
        tmux new-window -t hunter-services -n frontend
        tmux send-keys -t hunter-services:frontend "cd $(pwd)/frontend && npm run dev" Enter
    fi
    
    # Start Convex
    if ! check_service "Convex" "http://127.0.0.1:3210"; then
        tmux new-window -t hunter-services -n convex
        tmux send-keys -t hunter-services:convex "cd $(pwd)/frontend && npx convex dev" Enter
    fi
    
    # Start Redis if not running
    if ! redis-cli ping &>/dev/null; then
        echo -e "${YELLOW}Starting Redis...${NC}"
        tmux new-window -t hunter-services -n redis
        tmux send-keys -t hunter-services:redis "redis-server" Enter
    else
        echo -e "${GREEN}✓ Redis is already running${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}All services starting in tmux session 'hunter-services'${NC}"
    echo ""
    echo "Commands:"
    echo "  View all services:    tmux attach -t hunter-services"
    echo "  Switch windows:       Ctrl+B then window number (0-4)"
    echo "  Detach from tmux:     Ctrl+B then D"
    echo "  Kill all services:    tmux kill-session -t hunter-services"
    
else
    # Fallback to manual instructions if tmux not available
    echo -e "${YELLOW}tmux not found. Please start services manually in separate terminals:${NC}"
    echo ""
    
    if ! check_service "Backend" "http://localhost:8000/api/public/hunter/health"; then
        echo "Terminal 1:"
        echo "  cd backend && python -m src.main"
    fi
    
    if ! check_service "Frontend" "http://localhost:3000"; then
        echo "Terminal 2:"
        echo "  cd frontend && npm run dev"
    fi
    
    if ! check_service "Convex" "http://127.0.0.1:3210"; then
        echo "Terminal 3:"
        echo "  cd frontend && npx convex dev"
    fi
    
    if ! redis-cli ping &>/dev/null; then
        echo "Terminal 4:"
        echo "  redis-server"
    fi
fi

echo ""
echo -e "${BLUE}=== Waiting for services to start ===${NC}"

# Wait for services to be ready
sleep 5

# Run service check
echo ""
bash check-services.sh

echo ""
echo -e "${GREEN}=== Ready to test! ===${NC}"
echo ""
echo "1. Open http://localhost:3000/dashboard/business-hunter"
echo "2. Click 'NEW HUNT' to create a search"
echo "3. Watch the progress update in real-time!"