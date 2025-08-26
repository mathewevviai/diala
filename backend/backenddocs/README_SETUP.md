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

## HuggingFace Models

The backend uses several pre-trained models from HuggingFace for audio processing, speech recognition, and text generation. These models are automatically downloaded and cached when first used.

### Cached Models

The following models are currently cached in the system:

1. **distil-whisper/distil-large-v3** (1.5GB)
   - **Purpose**: Speech-to-text transcription
   - **Use Case**: Transcribing audio files and real-time speech
   - **Installation**: Automatically downloaded via `transformers` library

2. **distilbert-base-uncased-finetuned-sst-2-english** (268MB)
   - **Purpose**: Sentiment analysis
   - **Use Case**: Analyzing sentiment in transcribed text
   - **Installation**: Automatically downloaded via `transformers` library

3. **emotion2vec/emotion2vec_plus_large** (1.9GB)
   - **Purpose**: Emotion recognition from speech
   - **Use Case**: Detecting emotions in voice recordings
   - **Installation**: Automatically downloaded via `transformers` library

4. **facebook/wav2vec2-large-960h-lv60-self** (2.5GB)
   - **Purpose**: Speech recognition
   - **Use Case**: Converting speech to text with high accuracy
   - **Installation**: Automatically downloaded via `transformers` library

5. **speechbrain/spkrec-ecapa-voxceleb** (89MB)
   - **Purpose**: Speaker recognition/verification
   - **Use Case**: Identifying and verifying speakers in audio
   - **Installation**: Automatically downloaded via `speechbrain` library

6. **t5-large** (3.0GB)
   - **Purpose**: Text-to-text generation
   - **Use Case**: Text processing and generation tasks
   - **Installation**: Automatically downloaded via `transformers` library

### Model Management

**Total Cache Size**: ~9.3GB

**To scan current cache:**
```bash
cd backend
source venv/bin/activate
hf cache scan
```

**To clear cache** (if needed):
```bash
cd backend
source venv/bin/activate
hf cache clean
```

**To pre-download all models** (optional):
```bash
cd backend
source venv/bin/activate
python -c "
from transformers import pipeline
import speechbrain
# This will trigger downloads
whisper = pipeline('automatic-speech-recognition', model='distil-whisper/distil-large-v3')
sentiment = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
t5 = pipeline('text2text-generation', model='t5-large')
wav2vec = pipeline('automatic-speech-recognition', model='facebook/wav2vec2-large-960h-lv60-self')
# SpeechBrain models download automatically when used
"
```

### Cache Location
Models are cached in: `~/.cache/huggingface/hub/`

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