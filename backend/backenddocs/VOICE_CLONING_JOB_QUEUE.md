# Voice Cloning Job Queue System

This document describes the job queue system implemented for voice cloning, designed to efficiently manage GPU resources across development and production environments.

## Overview

The job queue system provides:
- **Development**: Immediate local processing with CUDA
- **Production**: Queued remote processing with ROCm on DigitalOcean droplets
- **Unified API**: Same endpoints work for both environments
- **Cost Optimization**: GPU droplets run only when needed

## Architecture

### Components

1. **TTSManager** (`src/services/tts_manager.py`)
   - Unified interface for all TTS operations
   - Routes jobs based on environment
   - Handles provider abstraction (Chatterbox, future: ElevenLabs, Kokoro)

2. **VoiceCloneJobManager** (`src/services/voice_clone_jobs.py`)
   - Creates and manages jobs in Convex
   - Tracks job status and metadata
   - Provides job statistics

3. **DropletManager** (`src/services/droplet_manager.py`)
   - Manages GPU droplets in production
   - Handles auto-start/stop based on queue
   - Monitors idle timeout

4. **Convex Integration**
   - `voiceCloneJobs` table for job tracking
   - Real-time status updates
   - Job history and analytics

## API Flow

### Development Mode (Local CUDA)

```
1. POST /api/public/voice/onboarding/clone
2. Create job in Convex (status: pending)
3. Process immediately with local Chatterbox
4. Update job status to completed
5. Return results immediately (200 OK)
```

### Production Mode (Remote ROCm)

```
1. POST /api/public/voice/onboarding/clone
2. Create job in Convex (status: pending)
3. Upload audio to cloud storage
4. Queue job and ensure GPU worker running
5. Return job ID immediately (202 Accepted)
6. GPU worker polls and processes job
7. Client polls GET /jobs/{job_id}/status
8. GPU worker updates Convex when complete
```

## Configuration

### Environment Variables

```bash
# Common
ENVIRONMENT=development|production
CONVEX_URL=http://127.0.0.1:3210

# Development
CHATTERBOX_MODE=local
CHATTERBOX_API_URL=http://localhost:8001

# Production
CHATTERBOX_MODE=remote
DO_API_TOKEN=your_digitalocean_token
DO_DROPLET_ID=your_droplet_id
GPU_WORKER_URL=http://droplet_ip:8001
S3_BUCKET=voice-clones
```

## API Endpoints

### Create Voice Clone

**POST** `/api/public/voice/onboarding/clone`

**Request:**
```multipart/form-data
audio_file: (binary)
user_id: test_user_123
voice_name: My Voice
sample_text: Hello, this is my cloned voice
```

**Response (Development):**
```json
{
  "success": true,
  "jobId": "uuid",
  "voice_id": "voice_abc123",
  "voice_name": "My Voice",
  "sample_audio": "data:audio/mp3;base64,...",
  "processingTime": 15.2,
  "message": "Voice cloning completed successfully"
}
```

**Response (Production):**
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "queued",
  "message": "Voice cloning job queued for processing",
  "statusUrl": "/api/public/voice/onboarding/jobs/uuid/status"
}
```

### Get Job Status

**GET** `/api/public/voice/onboarding/jobs/{job_id}/status`

**Response:**
```json
{
  "jobId": "uuid",
  "status": "completed",
  "voiceName": "My Voice",
  "voiceId": "voice_abc123",
  "processingTime": 18.5,
  "createdAt": 1234567890,
  "completedAt": 1234567908,
  "workerInfo": {
    "environment": "production",
    "gpuType": "rocm"
  }
}
```

## Testing

### Test Script

Use the provided test script to verify the system:

```bash
cd backend

# Test with default settings (development)
python test_voice_cloning_queue.py path/to/audio.mp3

# Test with custom API URL
python test_voice_cloning_queue.py audio.mp3 --api-url http://localhost:8000

# Skip service checks
python test_voice_cloning_queue.py audio.mp3 --skip-checks
```

### Manual Testing

1. **Start required services:**
```bash
# Terminal 1: Convex
cd frontend && npm run dev

# Terminal 2: Chatterbox (for development)
cd backend/src/chatterbox/streaming && python main.py

# Terminal 3: Backend API
cd backend && python -m src.main
```

2. **Submit a job:**
```bash
curl -X POST http://localhost:8000/api/public/voice/onboarding/clone \
  -F "audio_file=@test.mp3" \
  -F "user_id=test123" \
  -F "voice_name=Test Voice"
```

3. **Check job status:**
```bash
curl http://localhost:8000/api/public/voice/onboarding/jobs/{job_id}/status
```

## Convex Integration

### Schema

The `voiceCloneJobs` table tracks all jobs:

```typescript
{
  jobId: string,
  userId: string,
  status: "pending" | "processing" | "completed" | "failed",
  voiceName: string,
  audioFileUrl?: string,
  voiceId?: string,
  resultUrl?: string,
  workerInfo?: {
    environment: string,
    gpuType: string,
    dropletId?: string,
  },
  error?: string,
  createdAt: number,
  completedAt?: number,
  processingTime?: number,
}
```

### Queries

Monitor jobs in Convex:

```javascript
// Get pending jobs
convex.query("voiceCloneJobs:getPendingJobs", { limit: 10 })

// Get user jobs
convex.query("voiceCloneJobs:getUserJobs", { userId: "test123" })

// Get job stats
convex.query("voiceCloneJobs:getStats", { userId: "test123" })
```

## Production Deployment

### GPU Worker Setup

The GPU worker (future implementation) will:

1. **Poll for jobs:**
```python
while True:
    jobs = await get_pending_jobs()
    for job in jobs:
        await process_job(job)
    await asyncio.sleep(5)
```

2. **Process with ROCm:**
```python
# Claim job
await claim_job(job_id, worker_info)

# Download audio from S3
audio_data = await download_from_s3(job.audioFileUrl)

# Process with Chatterbox
result = await chatterbox.clone_voice(audio_data)

# Upload result
result_url = await upload_to_s3(result)

# Update job
await update_job_status(job_id, "completed", {
    "voiceId": voice_id,
    "resultUrl": result_url
})
```

3. **Auto-shutdown:**
```python
if idle_time > 5_minutes:
    await shutdown_droplet()
```

## Cost Optimization

### Strategies

1. **Batch Processing**: Queue multiple jobs before starting droplet
2. **Idle Timeout**: Shutdown after 5 minutes of inactivity
3. **Job Grouping**: Process all pending jobs in one session
4. **Preemptible Instances**: Use spot/preemptible GPU instances

### Monitoring

Track GPU usage and costs:

```python
# Get job statistics
stats = await job_manager.get_job_stats()
print(f"Total jobs: {stats['total']}")
print(f"Avg processing time: {stats['avgProcessingTime']}s")

# Calculate estimated costs
gpu_hours = stats['total'] * stats['avgProcessingTime'] / 3600
cost = gpu_hours * 1.77  # $1.77 per hour
print(f"Estimated cost: ${cost:.2f}")
```

## Future Enhancements

1. **Multi-Model Support**
   - Add ElevenLabs provider
   - Integrate Kokoro and other models
   - Dynamic model selection based on job

2. **Advanced Queue Features**
   - Priority queues
   - Job dependencies
   - Retry mechanisms
   - Dead letter queue

3. **Optimization**
   - Model caching on droplets
   - Warm standby instances
   - Predictive scaling
   - Regional deployment

4. **Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Cost tracking
   - Performance analytics

## Troubleshooting

### Common Issues

1. **"Convex not reachable"**
   - Ensure Convex is running: `cd frontend && npm run dev`
   - Check CONVEX_URL environment variable

2. **"Chatterbox not running"**
   - Start Chatterbox: `cd backend/src/chatterbox/streaming && python main.py`
   - Check GPU availability

3. **"Job stuck in pending"**
   - Check if GPU worker is running (production)
   - Check Convex logs for errors
   - Verify job data in Convex dashboard

4. **"Processing timeout"**
   - Increase timeout in TTSManager
   - Check GPU memory usage
   - Verify audio file format