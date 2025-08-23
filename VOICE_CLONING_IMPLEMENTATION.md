# Voice Cloning Implementation Guide

## Overview

This document describes the complete voice cloning implementation flow from the frontend onboarding interface to the backend Chatterbox streaming service.

## Architecture Flow

```
Frontend (Next.js) → Backend API (FastAPI) → TTS Manager → Chatterbox Streaming → GPU Processing
                  ↓                       ↓              ↓
                  Convex (Job Tracking) ← Job Queue ← Voice Profile Storage
```

## Frontend Implementation

### 1. Main Components

- **`/app/onboarding/cloning/page.tsx`**: Main orchestrator for the 7-step cloning flow
- **`/hooks/useVoiceCloning.ts`**: Custom hook managing voice cloning API calls and job status
- **`/lib/api.ts`**: API client with voice cloning endpoints

### 2. Voice Cloning Steps

1. **Platform Selection**: Choose YouTube, TikTok, Twitch, or direct upload
2. **Channel Setup**: Enter channel name or upload file
3. **Content Selection**: Select videos for voice extraction
4. **Voice Settings**: Configure voice parameters
   - Exaggeration (0.25-2.0): Controls expressiveness
   - CFG Weight (0.5-3.0): Controls generation consistency
   - Chunk Size (512-4096): Audio generation chunk size
5. **Text Input**: Enter sample text (max 60 chars) for testing
6. **Identity Verification**: Confirm user identity
7. **Review & Complete**: Process voice clone and test results

### 3. Data Flow

1. **Audio Collection**:
   - Direct upload: Use uploaded file as-is
   - Platform content: Extract audio from first selected video
   - TikTok: Uses dedicated audio extraction endpoint
   - YouTube/Twitch: Submit video file directly (backend extracts audio)

2. **Voice Clone Creation**:
   ```typescript
   await createClone(
     audioFile,      // File object (audio or video)
     voiceName,      // Display name for voice
     testText,       // Sample text for testing
     voiceSettings   // Voice parameters
   );
   ```

3. **Job Tracking**:
   - Creates job in Convex database
   - Monitors status: pending → processing → completed/failed
   - Real-time updates via Convex subscriptions
   - Fallback polling if Convex unavailable

## Backend Implementation

### 1. API Endpoints

- **`POST /api/public/voice/onboarding/clone`**: Create voice clone
  - Accepts audio/video files up to 50MB
  - Duration: 2 seconds to 5 minutes
  - Auto-extracts audio from video files
  
- **`GET /api/public/voice/onboarding/jobs/{job_id}/status`**: Check job status
- **`POST /api/public/voice/onboarding/test/{voice_id}`**: Test cloned voice
- **`DELETE /api/public/voice/onboarding/{voice_id}`**: Delete voice profile

### 2. Processing Pipeline

1. **File Validation**:
   - Size limit: 50MB
   - Duration: 2s-5min
   - Formats: MP3, WAV, MP4, MOV, AVI, WebM

2. **Audio Processing** (`AudioProcessor`):
   - Extract audio from video using FFmpeg
   - Convert to MP3: 24kHz, mono, 192kbps
   - Optimized for voice cloning

3. **TTS Manager**:
   - Routes to appropriate environment:
     - Development: Direct CUDA processing
     - Production: Queue for ROCm GPU workers
   - Manages multiple TTS providers (currently Chatterbox)

4. **Chatterbox Integration**:
   - Voice conversion using S3Gen model
   - Supports streaming and non-streaming generation
   - GPU-optimized with Flash Attention 2

### 3. Job Queue System

- **Development Mode**: Immediate processing with CUDA
- **Production Mode**: 
  - Jobs queued in Convex
  - Workers poll for pending jobs
  - Process on available GPU resources
  - Update job status on completion

## Database Schema

### Convex (Real-time Job Tracking)
```typescript
voiceCloneJobs: {
  jobId: string,
  userId: string,
  status: "pending" | "processing" | "completed" | "failed",
  voiceName: string,
  audioFileUrl?: string,
  voiceId?: string,
  resultUrl?: string,
  error?: string,
  processingTime?: number,
  workerInfo?: object
}
```

### PostgreSQL (Voice Profiles)
```sql
voice_profiles: {
  id: UUID,
  user_id: string,
  voice_name: string,
  voice_id: string,
  reference_audio_path: string,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Configuration

### Environment Variables

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your-api-key
```

**Backend (.env)**:
```bash
CHATTERBOX_API_URL=http://localhost:5000
TTS_PROVIDER=chatterbox
ENVIRONMENT=development  # or production
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

## Testing the Implementation

1. **Start Required Services**:
   ```bash
   # Terminal 1: Redis
   redis-server
   
   # Terminal 2: Backend
   cd backend
   python -m src.main
   
   # Terminal 3: Chatterbox (if local)
   cd backend/src/chatterbox/streaming
   python main.py
   
   # Terminal 4: Frontend
   cd frontend
   npm run dev
   ```

2. **Test Voice Cloning**:
   - Navigate to `/onboarding/cloning`
   - Select platform or upload audio
   - Configure voice settings
   - Enter test text
   - Complete verification
   - Test generated voice

## Common Issues & Solutions

1. **Audio Extraction Fails**:
   - Ensure FFmpeg is installed
   - Check file format compatibility
   - Verify duration limits (2s-5min)

2. **Job Stuck in Processing**:
   - Check GPU availability
   - Verify Chatterbox service is running
   - Check Convex connection

3. **Voice Test Fails**:
   - Ensure voice_id is valid
   - Check TTS service connectivity
   - Verify API keys are set

## Future Enhancements

1. **Multi-file Voice Training**: Combine multiple audio sources
2. **Voice Fine-tuning**: Allow parameter adjustment after creation
3. **Batch Processing**: Create multiple voices simultaneously
4. **Voice Library**: Save and manage multiple voice profiles
5. **Advanced Settings**: Expose temperature, speaking rate, etc.