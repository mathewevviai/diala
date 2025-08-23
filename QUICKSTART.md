# Diala Quick Start Guide

## 🚀 Quick Start (One Command)

```bash
./START_ALL_SERVICES.sh
```

This will start:
- Redis (if installed)
- Python backend on port 8000
- Convex dev server
- Next.js frontend on port 3000

## 📋 Manual Start (If script doesn't work)

### Terminal 1: Start Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 run_server.py
```

### Terminal 2: Start Frontend + Convex
```bash
cd frontend
npm install
npm run dev:all
```

## 🧪 Test YouTube Transcript Feature

1. Open http://localhost:3000/onboarding/transcripts
2. Enter a YouTube URL (e.g., https://youtube.com/watch?v=dQw4w9WgXcQ)
3. Click "CONTINUE"
4. Wait for transcript to load

## ⚠️ Common Issues

### "Connection refused" error
- Make sure Python backend is running on port 8000
- Check: http://localhost:8000/health

### "Module not found: @convex/_generated/api"
- Convex dev server is not running
- Run: `npm run convex:dev` in frontend directory

### "Could not find Convex client!"
- Page needs refresh after starting Convex
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Rate limit exceeded
- You're limited to 10 transcripts per hour
- Wait or use a different userId

## 📁 Project Structure
```
diala/
├── frontend/          # Next.js + Convex
│   ├── convex/       # Convex functions
│   └── src/          # React components
├── backend/          # Python FastAPI
│   └── src/api/      # API endpoints
└── START_ALL_SERVICES.sh  # Startup script
```