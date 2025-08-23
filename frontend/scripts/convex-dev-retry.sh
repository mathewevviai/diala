#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Maximum number of retries
MAX_RETRIES=5
RETRY_COUNT=0

echo -e "${YELLOW}Starting Convex dev server with auto-retry...${NC}"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo -e "${GREEN}Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: Starting convex dev...${NC}"
    
    # Run convex dev and capture output
    npm run convex:dev:base 2>&1 | while IFS= read -r line; do
        echo "$line"
        
        # Check for the specific error patterns
        if [[ "$line" == *"Local backend did not start on port 3210 within 10 seconds"* ]] || \
           [[ "$line" == *"Hit an error while running local deployment"* ]] || \
           [[ "$line" == *"npm run convex:dev exited with code 1"* ]]; then
            echo -e "${RED}Detected Convex startup failure. Killing process and retrying...${NC}"
            
            # Kill any existing convex processes
            pkill -f "convex dev" 2>/dev/null || true
            sleep 2
            
            # Exit this subshell to trigger retry
            exit 1
        fi
    done
    
    # Check the exit code of the convex dev command
    CONVEX_EXIT_CODE=$?
    
    if [ $CONVEX_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}Convex dev server started successfully!${NC}"
        exit 0
    else
        echo -e "${RED}Convex dev failed with exit code $CONVEX_EXIT_CODE${NC}"
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}Retrying in 3 seconds... (Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)${NC}"
            
            # Kill any hanging processes
            pkill -f "convex dev" 2>/dev/null || true
            sleep 3
        else
            echo -e "${RED}Max retries ($MAX_RETRIES) reached. Convex dev server failed to start.${NC}"
            echo -e "${YELLOW}You may want to try running: npx convex disable-local-deployments${NC}"
            exit 1
        fi
    fi
done