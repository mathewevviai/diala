# Voice Cloning Integration

This document describes the voice cloning feature integrated into the Diala backend for the onboarding process.

## Overview

The voice cloning feature allows users to clone their voice during the onboarding process by uploading an audio or video file. The system extracts audio, processes it, and creates a voice profile that can be used for text-to-speech generation.

## Architecture

### Components

1. **Audio Processor Service** (`src/services/audio_processor.py`)
   - Extracts audio from video files
   - Converts audio to MP3 format (24kHz, mono)
   - Validates audio duration and file size
   - Handles temporary file management

2. **Voice Onboarding API** (`src/api/public/voice_onboarding.py`)
   - `/api/public/voice/onboarding/clone` - Main cloning endpoint
   - `/api/public/voice/onboarding/status/{voice_id}` - Check voice status
   - `/api/public/voice/onboarding/test/{voice_id}` - Test cloned voice
   - `/api/public/voice/onboarding/{voice_id}` - Delete voice profile

3. **Chatterbox Client** (`src/services/chatterbox_client.py`)
   - Enhanced to support voice cloning with audio data
   - Added streaming support for real-time TTS
   - Handles communication with Chatterbox TTS service

4. **Database Models** (`src/core/models/voice_profile.py`)
   - `VoiceProfile` - Stores voice profile metadata
   - `VoiceCloneSession` - Tracks cloning sessions

## Setup

### 1. Start Chatterbox TTS Service

The Chatterbox service must be running for voice cloning to work:

```bash
# For CUDA environments
cd backend/src/chatterbox/streaming
python main.py

# For Docker with CUDA
docker-compose -f docker-compose.yml -f docker-compose.cuda.yml up chatterbox-streaming
```

The service will run on port 8001 by default.

### 2. Install Dependencies

Ensure ffmpeg is installed for audio processing:

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

### 3. Run Database Migration

Create the voice profiles tables:

```bash
# Run the migration script
mysql -u root -p < backend/migrations/create_voice_profiles_table.sql
```

## Usage

### Voice Cloning Endpoint

**POST** `/api/public/voice/onboarding/clone`

**Form Data:**
- `audio_file` (required): Audio or video file (mp3, wav, mp4, etc.)
- `user_id` (optional): User identifier
- `voice_name` (optional): Name for the voice profile
- `sample_text` (optional): Text to generate with cloned voice

**Example using curl:**
```bash
curl -X POST http://localhost:8000/api/public/voice/onboarding/clone \
  -F "audio_file=@recording.mp3" \
  -F "user_id=user123" \
  -F "voice_name=My Voice" \
  -F "sample_text=Hello, this is my cloned voice"
```

**Response:**
```json
{
  "success": true,
  "voice_id": "voice_a1b2c3d4e5f6",
  "voice_name": "My Voice",
  "sample_text": "Hello, this is my cloned voice",
  "sample_audio": "data:audio/mp3;base64,..."
}
```

### Testing

Use the provided test script:

```bash
cd backend
python test_voice_cloning.py path/to/audio/file.mp3

# With custom API URLs
python test_voice_cloning.py recording.mp4 \
  --api-url http://localhost:8000 \
  --chatterbox-url http://localhost:8001
```

## Integration with Frontend

The frontend should integrate this in the final onboarding step:

1. User records verification audio
2. Frontend sends audio file to `/api/public/voice/onboarding/clone`
3. Backend processes and returns voice ID
4. Voice ID is stored for future use

Example frontend code:
```javascript
const formData = new FormData();
formData.append('audio_file', audioBlob, 'recording.webm');
formData.append('user_id', userId);
formData.append('voice_name', 'My Voice');

const response = await fetch('/api/public/voice/onboarding/clone', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Voice ID:', result.voice_id);
```

## Audio Requirements

- **Formats**: MP3, WAV, M4A, AAC, OGG, FLAC (audio), MP4, MOV, AVI, WebM, MKV, FLV (video)
- **Duration**: 2 seconds minimum, 5 minutes maximum
- **File Size**: 50MB maximum
- **Quality**: Mono audio at 24kHz is optimal for voice cloning

## Error Handling

Common errors and solutions:

1. **"Chatterbox service not available"**
   - Ensure Chatterbox is running on port 8001
   - Check `CHATTERBOX_API_URL` environment variable

2. **"Audio too short"**
   - Audio must be at least 2 seconds long
   - Record a longer sample

3. **"File too large"**
   - Maximum file size is 50MB
   - Compress or trim the audio

4. **"GPU out of memory"**
   - Restart Chatterbox service
   - Reduce batch size in Chatterbox settings

## Performance Considerations

- Voice cloning typically takes 5-30 seconds depending on audio length
- First request may be slower due to model loading
- GPU acceleration (CUDA) significantly improves performance
- Audio is processed to mono 24kHz for optimal results

## Security Notes

- Implement rate limiting to prevent abuse
- Validate file types and sizes
- Store audio files securely
- Consider adding user authentication
- Clean up temporary files after processing

## Future Enhancements

1. **Real-time Streaming**: Implement streaming TTS generation
2. **Voice Gallery**: Allow users to manage multiple voice profiles
3. **Voice Customization**: Adjust pitch, speed, emotion
4. **Batch Processing**: Clone multiple voices at once
5. **Voice Verification**: Add speaker verification for security