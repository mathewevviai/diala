# YouTube Transcript Integration

## Overview
This feature allows users to fetch YouTube video transcripts with rate limiting to prevent abuse. It uses Convex actions with a Python backend for transcript extraction.

## Features
- Rate limiting: 10 transcripts per hour per user
- Caching: Transcripts are cached to avoid duplicate fetches
- Async processing: Jobs are queued and processed in the background
- Real-time updates: Frontend polls for job completion

## Setup

### Frontend Setup
1. The Convex rate limiter is already installed
2. Schema has been updated with transcript tables
3. Actions are in `convex/youtubeTranscriptActions.ts`
4. Run `npm run convex:dev` to start Convex development server

### Backend Setup
1. Install dependencies:
```bash
pip install youtube-transcript-api convex python-dotenv
```

2. The backend automatically loads Convex URL from frontend's `.env.local`

3. The YouTube transcript API endpoint is available at `/api/youtube/transcript`

## Usage

### Frontend
```typescript
// Import the actions
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";

// In your component
const fetchYoutubeTranscript = useAction(api.youtubeTranscriptActions.fetchYoutubeTranscript);
const getJobStatus = useAction(api.youtubeTranscriptActions.getJobStatus);

// Fetch a transcript
const result = await fetchYoutubeTranscript({
  youtubeUrl: "https://youtube.com/watch?v=...",
  userId: "user123"
});

// Poll for status
const status = await getJobStatus({ jobId: result.jobId });
```

### Python Backend Integration
```python
from convex import ConvexClient

# Initialize client
client = ConvexClient("http://127.0.0.1:3210")  # or your production URL

# Call a mutation
client.mutation("mutations/youtubeTranscripts:transcriptWebhook", {
    "jobId": "job123",
    "status": "completed",
    "transcript": "Full transcript text...",
    "videoId": "abc123",
    "userId": "user123"
})
```

### Rate Limiting
Users are limited to 10 transcript fetches per hour. The rate limiter uses a token bucket algorithm with a capacity of 3, allowing short bursts.

## API Endpoints

### POST /api/youtube/transcript
Fetches a YouTube transcript asynchronously.

Request:
```json
{
  "job_id": "unique-job-id",
  "youtube_url": "https://youtube.com/watch?v=...",
  "user_id": "user123"
}
```

Response:
```json
{
  "status": "processing",
  "job_id": "unique-job-id",
  "message": "Transcript processing started"
}
```

## Database Schema

### transcriptJobs
- Tracks job status and metadata
- Indexes: by_job, by_user, by_status

### youtubeTranscripts  
- Stores cached transcripts
- Indexes: by_video, by_user

## Error Handling
- Invalid YouTube URLs return clear error messages
- Rate limit exceeded shows user-friendly message
- Failed jobs are marked with error details
- 60-second timeout for polling