# Hunter Search Integration Guide

## Current Status
The hunter search backend is working correctly and generating search results, but the frontend is not receiving progress updates because the Convex dev server is not running.

## Required Services

### 1. Backend Service ✅ (Running)
- **Status**: Running on http://localhost:8000
- **Health Check**: http://localhost:8000/api/public/hunter/health
- Successfully processing searches and getting results from Jina AI

### 2. Frontend Service ✅ (Running)  
- **Status**: Running on http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard/business-hunter

### 3. Convex Service ❌ (Not Running)
- **Status**: NOT RUNNING - This is causing the webhook 404 errors
- **Expected URL**: http://127.0.0.1:3210
- **Purpose**: Handles real-time updates between backend and frontend

### 4. Redis Service ✅ (Running)
- **Status**: Running on localhost:6379
- **Purpose**: Rate limiting and caching

## How to Start Convex

Open a new terminal and run:
```bash
cd frontend
npx convex dev
```

This will:
1. Start the Convex dev server on port 3210
2. Enable HTTP endpoints for webhook communication
3. Allow real-time progress updates to flow to the frontend

## What's Working

### Backend Processing ✅
- Query formatting with AI (DeepSeek/OpenAI)
- Jina AI search integration
- Rate limiting with token bucket algorithm
- Concurrent request handling
- Result caching
- All 6 phases of lead generation

### Frontend Display ✅
- Dashboard UI
- Search creation modal
- Progress visualization
- Result display

### What's Not Working ❌
- Progress updates (because Convex is not running)
- Real-time status changes
- Search completion notifications

## Testing the Integration

1. **Start Convex** (REQUIRED):
   ```bash
   cd frontend
   npx convex dev
   ```

2. **Verify All Services**:
   ```bash
   bash check-services.sh
   ```

3. **Create a Test Search**:
   - Go to http://localhost:3000/dashboard/business-hunter
   - Click "NEW HUNT"
   - Enter search parameters
   - Watch the progress update in real-time

## Example Search Configuration

```json
{
  "name": "Belfast Roofing Companies",
  "businessType": "Roofing and Construction",
  "location": "Belfast, Northern Ireland, UK", 
  "keywords": ["roofing", "contractor", "repair"],
  "includeLinkedIn": false,
  "searchDepth": 3
}
```

## Monitoring

### Backend Logs
Watch the terminal running `python -m src.main` for:
- Search query generation
- Jina AI API calls
- Progress updates
- Results processing

### Convex Logs
Watch the terminal running `npx convex dev` for:
- Webhook receives
- Database updates
- Real-time sync events

### Frontend Console
Open browser DevTools to see:
- Convex subscriptions
- Real-time updates
- API responses

## Troubleshooting

### "Webhook 404 Error"
- **Cause**: Convex dev server not running
- **Fix**: Start Convex with `npx convex dev`

### "Search Stuck at Initializing"
- **Cause**: Webhooks not reaching Convex
- **Fix**: Ensure Convex is running and check the URL in backend .env

### "No Progress Updates"
- **Cause**: Convex HTTP endpoints not available
- **Fix**: Restart Convex dev server

## Architecture Flow

```
User Creates Search
       ↓
Frontend (Next.js)
       ↓
Convex Action (createLeadSearch)
       ↓
Backend API (POST /api/public/hunter/search)
       ↓
Background Job Processing:
  - Phase 1: AI Query Formatting + Jina Search
  - Phase 2: URL Extraction
  - Phase 3: Content Extraction (Jina Reader)
  - Phase 4: Data Combination
  - Phase 5: Validation
  - Phase 6: Final Report
       ↓
Progress Updates via Webhooks
       ↓
Convex HTTP Endpoints (/updateSearchProgress)
       ↓
Database Updates
       ↓
Real-time Updates to Frontend
```

## Next Steps

1. **Start Convex Dev Server** - This will fix the immediate issue
2. **Run a test search** to verify end-to-end flow
3. **Monitor all service logs** to ensure smooth operation

The backend implementation is solid and working correctly. The only missing piece is the Convex dev server for real-time communication.