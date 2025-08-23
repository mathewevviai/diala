# Convex HTTP Endpoints Fix

## Problem
HTTP endpoints were returning 404 errors even though Convex was running.

## Solution
In local development, Convex HTTP endpoints are served on **port 3211**, not the main Convex port 3210.

### URLs:
- **Convex Client/WebSocket**: `http://127.0.0.1:3210` (for ConvexClient)
- **HTTP Endpoints**: `http://localhost:3211` (for webhooks)

### Fixed Configuration:
```python
# backend/src/api/public/hunter_leadgen.py
CONVEX_URL = "http://127.0.0.1:3210"      # For ConvexClient
CONVEX_HTTP_URL = "http://localhost:3211"  # For HTTP endpoints
```

### Working Webhook URLs:
- `http://localhost:3211/updateSearchProgress`
- `http://localhost:3211/updateSearchStatus`
- `http://localhost:3211/updateSearchResults`

## Testing
```bash
# Test webhook endpoint
curl -X POST http://localhost:3211/updateSearchProgress \
  -H "Content-Type: application/json" \
  -d '{"searchId": "test_123", "progress": 50, "currentStage": "Testing"}'
```

## Important Notes
1. The main Convex dev server runs on port 3210
2. HTTP endpoints are proxied through port 3211
3. This is specific to local development with `npx convex dev`
4. In production, HTTP endpoints would be at `https://<deployment>.convex.site`

The backend is now correctly configured to send webhooks to the right port!