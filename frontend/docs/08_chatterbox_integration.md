# Chatterbox Integration

## Overview

The Voice Agent Application now supports Chatterbox as an alternative Text-to-Speech (TTS) provider alongside ElevenLabs. Chatterbox offers a self-hosted, open-source TTS solution that provides greater control over voice synthesis while maintaining compatibility with the existing application architecture.

## Architecture

### Integration Points

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Orchestrator  │────▶│  TTS Interface   │────▶│   Chatterbox    │
│                 │     │                  │     │   TTS Engine    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   ElevenLabs     │
                        │   TTS Engine     │
                        └──────────────────┘
```

### Components

#### 1. Chatterbox Client (`services/chatterbox_client.py`)
- Manages HTTP communication with Chatterbox API
- Handles authentication and request formatting
- Implements retry logic and error handling
- Converts text to speech using Chatterbox models

#### 2. TTS Interface (`chatterbox/tts.py`)
- Provides unified interface for multiple TTS providers
- Implements provider selection logic
- Handles audio format conversion if needed
- Manages provider-specific configurations

#### 3. Chatterbox Models (`chatterbox/models/`)
- Data models for Chatterbox API requests/responses
- Voice configuration models
- Audio format specifications

## Configuration

### Environment Variables

```bash
# Chatterbox Configuration
CHATTERBOX_API_URL=http://localhost:5000
CHATTERBOX_API_KEY=your_api_key_here
CHATTERBOX_VOICE_ID=voice_1
CHATTERBOX_MODEL_ID=model_1

# TTS Provider Selection
TTS_PROVIDER=chatterbox  # Options: chatterbox, elevenlabs
```

### Voice Configuration

```python
CHATTERBOX_CONFIG = {
    "voice_settings": {
        "speed": 1.0,
        "pitch": 1.0,
        "volume": 1.0,
        "emotion": "neutral"
    },
    "audio_format": {
        "sample_rate": 16000,
        "bit_depth": 16,
        "channels": 1,
        "codec": "pcm_s16le"
    }
}
```

## API Integration

### Chatterbox API Endpoints

#### Text-to-Speech Conversion
```http
POST /api/v1/tts
Content-Type: application/json

{
    "text": "Hello, how can I help you today?",
    "voice_id": "voice_1",
    "model_id": "model_1",
    "settings": {
        "speed": 1.0,
        "pitch": 1.0
    }
}
```

#### Voice Management
```http
GET /api/v1/voices
Authorization: Bearer {api_key}

Response:
{
    "voices": [
        {
            "id": "voice_1",
            "name": "Assistant",
            "language": "en-US",
            "gender": "neutral"
        }
    ]
}
```

## Implementation Guide

### 1. Setting Up Chatterbox

```bash
# Clone Chatterbox repository
git clone https://github.com/chatterbox/chatterbox.git
cd chatterbox

# Install dependencies
pip install -r requirements.txt

# Start Chatterbox server
python -m chatterbox.server --port 5000
```

### 2. Configuring the Voice Agent

```python
# In your .env file
TTS_PROVIDER=chatterbox
CHATTERBOX_API_URL=http://localhost:5000
CHATTERBOX_API_KEY=your_api_key
```

### 3. Using Chatterbox in Code

```python
from src.chatterbox.tts import TTSInterface

# Initialize TTS interface
tts = TTSInterface(provider="chatterbox")

# Convert text to speech
audio_data = await tts.convert_text_to_speech(
    text="Hello, this is a test message.",
    voice_id="voice_1"
)

# Stream audio for real-time playback
async for chunk in tts.stream_text_to_speech(text, voice_id):
    await audio_player.play_chunk(chunk)
```

## Performance Optimization

### 1. Caching
- Implement Redis caching for frequently used phrases
- Cache voice model data to reduce API calls
- Store pre-generated audio for common responses

### 2. Streaming
- Use chunked transfer encoding for real-time synthesis
- Implement buffer management for smooth playback
- Handle network interruptions gracefully

### 3. Resource Management
```python
# Example: Connection pooling
class ChatterboxConnectionPool:
    def __init__(self, max_connections=10):
        self.pool = []
        self.max_connections = max_connections
    
    async def get_connection(self):
        # Implementation details
        pass
```

## Troubleshooting

### Common Issues

#### 1. Connection Errors
```python
# Error: Failed to connect to Chatterbox API
# Solution: Check if Chatterbox server is running
systemctl status chatterbox

# Verify API endpoint
curl http://localhost:5000/health
```

#### 2. Audio Quality Issues
- Adjust voice settings (speed, pitch, volume)
- Check audio format compatibility
- Verify network bandwidth for streaming

#### 3. Latency Problems
- Enable connection pooling
- Implement pre-fetching for predictable responses
- Use local Chatterbox deployment for minimal latency

### Debug Logging

```python
# Enable debug logging for Chatterbox
import logging
logging.getLogger('chatterbox').setLevel(logging.DEBUG)

# Log all TTS requests
@log_tts_request
async def convert_text_to_speech(self, text, voice_id):
    # Implementation
    pass
```

## Migration from ElevenLabs

### Step-by-Step Migration

1. **Install Chatterbox**
   ```bash
   pip install chatterbox-tts
   ```

2. **Update Environment Variables**
   ```bash
   # Comment out ElevenLabs
   # TTS_PROVIDER=elevenlabs
   # ELEVEN_LABS_API_KEY=...
   
   # Add Chatterbox
   TTS_PROVIDER=chatterbox
   CHATTERBOX_API_URL=http://localhost:5000
   ```

3. **Test Voice Quality**
   ```python
   # Test script
   from src.chatterbox.tts import TTSInterface
   
   tts = TTSInterface(provider="chatterbox")
   audio = await tts.convert_text_to_speech("Test message")
   # Play audio and verify quality
   ```

4. **Update Voice Mappings**
   - Map ElevenLabs voice IDs to Chatterbox equivalents
   - Adjust voice settings for similar sound profiles

### Rollback Strategy

```python
# Implement fallback mechanism
class TTSProviderManager:
    def __init__(self):
        self.primary = ChatterboxClient()
        self.fallback = ElevenLabsClient()
    
    async def synthesize(self, text):
        try:
            return await self.primary.convert(text)
        except Exception as e:
            logger.warning(f"Primary TTS failed: {e}")
            return await self.fallback.convert(text)
```

## Best Practices

### 1. Security
- Use API keys for authentication
- Implement rate limiting
- Validate and sanitize input text
- Use HTTPS for production deployments

### 2. Monitoring
- Track TTS latency metrics
- Monitor API usage and costs
- Set up alerts for service failures
- Log all TTS requests for debugging

### 3. Scalability
- Deploy multiple Chatterbox instances
- Use load balancing for high availability
- Implement queue-based processing for bulk requests
- Consider GPU acceleration for faster synthesis

## Future Enhancements

### Planned Features
1. **Multi-language Support**
   - Add voice models for additional languages
   - Implement language detection
   - Support for regional accents

2. **Advanced Voice Customization**
   - Emotion control
   - Speaking style variations
   - Custom voice training

3. **Performance Improvements**
   - GPU acceleration
   - Model optimization
   - Reduced latency streaming

### Integration Roadmap
- Q1: Basic Chatterbox integration
- Q2: Advanced voice features
- Q3: Multi-language support
- Q4: Custom voice training

## Conclusion

The Chatterbox integration provides a flexible, self-hosted alternative to cloud-based TTS services. With proper configuration and optimization, it can deliver high-quality voice synthesis while maintaining full control over the infrastructure and data privacy.