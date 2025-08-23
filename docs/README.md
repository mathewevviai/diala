# Voice Agent Application Documentation

## Overview

The Voice Agent Application is a comprehensive real-time voice communication system that integrates multiple services including Telnyx for telephony, Deepgram for speech recognition, OpenAI for natural language processing, and multiple TTS providers (ElevenLabs and Chatterbox) for voice synthesis.

## Documentation Structure

### Core Documentation

1. **[01_project_overview.md](01_project_overview.md)**
   - System architecture
   - Technology stack
   - Key features and capabilities
   - High-level component interactions

2. **[02_development_setup.md](02_development_setup.md)**
   - Prerequisites and requirements
   - Environment configuration
   - Local development setup
   - Docker deployment instructions

3. **[03_api_documentation.md](03_api_documentation.md)**
   - REST API endpoints
   - WebSocket connections
   - Request/response formats
   - Authentication and authorization

4. **[04_websocket_protocol.md](04_websocket_protocol.md)**
   - WebSocket message types
   - Event handling
   - Real-time communication flow
   - Error handling and reconnection

5. **[05_audio_processing.md](05_audio_processing.md)**
   - GStreamer pipeline configuration
   - Audio format specifications
   - Real-time processing techniques
   - Performance optimization

6. **[06_security_considerations.md](06_security_considerations.md)**
   - Authentication mechanisms
   - API key management
   - Network security
   - Data privacy and compliance

7. **[07_deployment_guide.md](07_deployment_guide.md)**
   - Production deployment steps
   - Infrastructure requirements
   - Scaling considerations
   - Monitoring and maintenance

8. **[08_chatterbox_integration.md](08_chatterbox_integration.md)**
   - Chatterbox TTS integration
   - Configuration and setup
   - Migration from ElevenLabs
   - Performance optimization

## Recent Updates

### Frontend Onboarding Flow (December 2024)
- **Welcome Screen Integration**: Added a personalized welcome screen that collects user name before starting the voice agent setup
- **5-Step Onboarding Process**:
  1. **Welcome** - Animated greeting with name collection
  2. **Audio Selection** - Choose background ambient sounds
  3. **Language Selection** - Pick preferred conversation language
  4. **Voice Agent Selection** - Select AI voice personality
  5. **Completion** - Summary and call initiation
- **Design Implementation**: Neobrutalist/Memphis design with bold borders, vibrant colors, and playful animations
- **Smooth Navigation**: Step-by-step progression with visual indicators and ability to navigate back/forward

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Redis
- GStreamer
- Docker (optional)

### Basic Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voice-agent-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Start the services**
   ```bash
   # Start Redis
   redis-server
   
   # Start backend
   cd backend
   python -m src.main
   
   # Start frontend
   cd frontend
   npm run dev
   ```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                      WebSocket Connection                        │
├─────────────────────────────────────────────────────────────────┤
│                    Backend (FastAPI + Python)                    │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│   Telnyx     │   Deepgram   │    OpenAI    │  TTS Providers   │
│  (Telephony) │    (STT)     │    (LLM)     │ (ElevenLabs/     │
│              │              │              │  Chatterbox)     │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

## Key Features

### Real-Time Communication
- WebSocket-based bidirectional communication
- Low-latency audio streaming
- Real-time transcription and synthesis

### Voice Processing
- Speech-to-Text with Deepgram
- Natural language understanding with OpenAI
- Text-to-Speech with multiple provider support
- Audio processing with GStreamer

### Telephony Integration
- Inbound and outbound call handling
- Call control (mute, hold, transfer)
- PSTN connectivity via Telnyx

### Security
- JWT-based authentication
- API key management
- Secure WebSocket connections
- Rate limiting and DDoS protection

## API Reference

### WebSocket Events

#### Client to Server
- `audio_stream` - Stream audio data
- `call_control` - Control call operations
- `configuration` - Update settings

#### Server to Client
- `transcription` - Real-time transcription
- `ai_response` - AI-generated responses
- `call_status` - Call state updates
- `error` - Error notifications

### REST Endpoints

#### Call Management
```http
POST   /api/v1/calls/initiate
GET    /api/v1/calls/{call_id}
POST   /api/v1/calls/{call_id}/end
PUT    /api/v1/calls/{call_id}/control
```

#### Configuration
```http
GET    /api/v1/config
PUT    /api/v1/config
GET    /api/v1/config/voices
```

## Configuration

### Environment Variables

```bash
# Core Services
TELNYX_API_KEY=your_telnyx_key
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=your_openai_key

# TTS Configuration
TTS_PROVIDER=chatterbox  # or elevenlabs
ELEVEN_LABS_API_KEY=your_elevenlabs_key
CHATTERBOX_API_URL=http://localhost:5000
CHATTERBOX_API_KEY=your_chatterbox_key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET_KEY=your_secret_key
API_KEY=your_api_key
```

## Development Guidelines

### Code Structure
```
voice-agent-app/
├── backend/
│   ├── src/
│   │   ├── api/          # REST API endpoints
│   │   ├── services/     # External service clients
│   │   ├── core/         # Core business logic
│   │   ├── middleware/   # Request processing
│   │   └── utils/        # Utility functions
│   └── tests/            # Test suites
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
└── docs/                 # Documentation
```

### Testing
- Unit tests for individual components
- Integration tests for service interactions
- End-to-end tests for complete workflows
- Performance benchmarking

### Contributing
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request
5. Ensure CI checks pass

## Troubleshooting

### Common Issues

#### Audio Quality Problems
- Check microphone permissions
- Verify audio format settings
- Ensure sufficient bandwidth
- Test with different browsers

#### Connection Issues
- Verify WebSocket URL
- Check firewall settings
- Validate API credentials
- Review CORS configuration

#### Performance Issues
- Monitor CPU/memory usage
- Check network latency
- Review GStreamer pipeline
- Optimize audio buffer sizes

## Support and Resources

### Documentation
- API Reference: `/docs/03_api_documentation.md`
- WebSocket Protocol: `/docs/04_websocket_protocol.md`
- Security Guide: `/docs/06_security_considerations.md`

### Community
- GitHub Issues: Report bugs and request features
- Discord: Join our community chat
- Stack Overflow: Tag questions with `voice-agent-app`

### Commercial Support
- Email: support@voiceagent.app
- Enterprise plans available
- Custom development services

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- Telnyx for telephony infrastructure
- Deepgram for speech recognition
- OpenAI for language models
- ElevenLabs for voice synthesis
- Chatterbox for open-source TTS
- GStreamer for audio processing

---

For detailed information on specific topics, please refer to the individual documentation files listed above.