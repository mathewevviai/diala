# Audio Transcription API Documentation

## Overview

The Audio Transcription API allows users to transcribe audio files using OpenAI's Whisper model. This feature is integrated into the onboarding flow and provides high-quality transcriptions with support for multiple audio formats.

## Features

- **Supported Formats**: MP3, WAV, OGG, M4A, FLAC, MP4, MPEG, WEBM
- **File Size Limit**: 25MB (OpenAI limit)
- **Language Support**: Auto-detection or specify ISO-639-1 language code
- **Rate Limiting**: 
  - Free tier: 10 transcriptions/hour
  - Premium tier: 50 transcriptions/hour
  - Enterprise tier: Unlimited
- **Data Retention**:
  - Free tier: 7 days
  - Premium tier: 30 days
  - Enterprise tier: Permanent

## API Endpoint

### Transcribe Audio

```
POST /api/public/audio/transcribe
```

#### Request

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): Audio file to transcribe
- `job_id` (required): Unique job identifier for tracking
- `user_id` (required): User ID for rate limiting
- `language` (optional): ISO-639-1 language code (e.g., "en", "es", "fr")
- `prompt` (optional): Text to guide transcription style

#### Response

```json
{
  "status": "processing",
  "job_id": "unique-job-id",
  "message": "Audio transcription started"
}
```

### Health Check

```
GET /api/public/audio/health
```

#### Response

```json
{
  "status": "healthy",
  "service": "audio-transcription",
  "openai_configured": true
}
```

## Integration with Frontend

The transcription feature is integrated into the onboarding flow at `/onboarding/transcribe`. The frontend:

1. Accepts audio file uploads via drag-and-drop or file selection
2. Validates file type and size
3. Creates a unique job ID
4. Uploads the file to the backend API
5. Polls Convex for job status updates
6. Displays the transcription when complete

## Convex Integration

### Schema

The `audioTranscripts` table stores transcription jobs with the following fields:
- `jobId`: Unique job identifier
- `userId`: User ID for ownership
- `fileName`: Original file name
- `fileSize`: File size in bytes
- `fileFormat`: Audio format (mp3, wav, etc.)
- `language`: Language code (optional)
- `prompt`: Transcription prompt (optional)
- `status`: Job status (pending, processing, completed, failed)
- `transcript`: The transcribed text (when completed)
- `createdAt`: Job creation timestamp
- `completedAt`: Job completion timestamp
- `error`: Error message (if failed)
- `expiresAt`: Data expiration date

### Mutations

- `createJob`: Creates a new transcription job
- `updateJobStatus`: Updates job status
- `transcriptWebhook`: Handles webhook updates from backend
- `deleteExpiredJobs`: Cleans up expired transcriptions

### Queries

- `getJob`: Get a specific job by ID
- `getUserJobs`: Get all jobs for a user
- `getActiveJobs`: Get pending/processing jobs
- `getUserStats`: Get transcription statistics
- `canCreateTranscription`: Check rate limit status

## Backend Implementation

The backend service (`/backend/src/api/public/audio_transcripts.py`) handles:

1. File upload validation
2. OpenAI Whisper API integration
3. Asynchronous processing with background tasks
4. Webhook notifications to Convex
5. Error handling and retries

## Environment Variables

Required in `/backend/.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Testing

Use the provided test script:
```bash
cd backend
python test_audio_transcription.py
```

Make sure you have:
1. Backend server running (`python -m src.main`)
2. Convex dev server running (`npm run convex:dev`)
3. A test audio file available
4. Valid OpenAI API key configured

## Error Handling

Common errors and solutions:

1. **Rate limit exceeded**: Wait for the reset time or upgrade tier
2. **File too large**: Ensure file is under 25MB
3. **Invalid format**: Use supported audio formats only
4. **API key missing**: Configure OPENAI_API_KEY in backend .env
5. **Network errors**: Check backend and Convex services are running

## Future Enhancements

- Support for batch transcriptions
- Real-time transcription progress
- Multiple language transcriptions
- Custom vocabulary support
- Speaker diarization
- Timestamp extraction