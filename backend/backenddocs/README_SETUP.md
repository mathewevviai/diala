# Backend Setup Guide

## Prerequisites

### System Dependencies

1. **Python 3.12+**
   ```bash
   python3 --version
   ```

2. **FFmpeg** (Required for audio/video processing)
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install ffmpeg

   # macOS
   brew install ffmpeg

   # Verify installation
   ffmpeg -version
   ```

3. **Redis** (Required for session management)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server

   # macOS
   brew install redis

   # Start Redis
   redis-server
   ```

4. **PostgreSQL** (Optional, for voice profiles)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

## Python Environment Setup

1. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# API Keys
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
TELNYX_API_KEY=your_telnyx_key
ELEVEN_LABS_API_KEY=your_elevenlabs_key

# Service URLs
CHATTERBOX_API_URL=http://localhost:5000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/diala

# TTS Configuration
TTS_PROVIDER=chatterbox
ENVIRONMENT=development

# Security
JWT_SECRET_KEY=your_secret_key
API_KEY=your_api_key
```

## Running the Backend

1. **Start required services**
   ```bash
   # Terminal 1: Redis
   redis-server

   # Terminal 2: PostgreSQL (if using)
   sudo service postgresql start
   ```

2. **Run database migrations** (if using PostgreSQL)
   ```bash
   python -m src.core.init_db
   ```

3. **Start the backend server**
   ```bash
   python -m src.main
   ```

   The server will start on `http://localhost:8000`

## Troubleshooting

### FFmpeg Not Found
If you get `ffprobe and ffmpeg not found` errors:
1. Ensure FFmpeg is installed: `ffmpeg -version`
2. Add FFmpeg to PATH if needed
3. Restart your terminal/IDE

### Database Connection Issues
If you get `asyncpg` errors:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env
3. Create database if needed: `createdb diala`

### Port Already in Use
If port 8000 is in use:
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
# Or use different port
uvicorn src.main:app --port 8001
```