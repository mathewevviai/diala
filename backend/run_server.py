#!/usr/bin/env python3
"""
Script to run the Diala Backend Server with full API documentation.
"""

import uvicorn
from src.main import app

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Diala Backend Server")
    print("="*60)
    print("\n📍 API Endpoints:")
    print("   - Documentation: http://localhost:8001/docs")
    print("   - ReDoc: http://localhost:8001/redoc")
    print("   - Health Check: http://localhost:8001/health")
    print("\n📚 Public APIs:")
    print("   - YouTube Transcript: POST http://localhost:8001/api/public/youtube/transcript")
    print("   - Direct Transcript: GET http://localhost:8001/api/public/youtube/transcript/{video_id}")
    print("\n🔒 Protected APIs (require authentication):")
    print("   - Example endpoints at /api/protected/*")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )