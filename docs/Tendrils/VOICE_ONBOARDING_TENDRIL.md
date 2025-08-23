# Voice Onboarding Tendril Documentation

## Overview

The Voice Onboarding Tendril is the primary user flow for setting up and initiating voice conversations with Diala's AI agents. This tendril represents a complete end-to-end experience from initial user introduction through to live voice conversation, either via phone call or web browser.

### Purpose
- Guide new users through a 5-step configuration process
- Collect necessary preferences for personalized voice interactions
- Establish secure communication channels for voice conversations
- Provide both telephony (PSTN) and web-based voice options

### Architecture Overview
- **Frontend**: Next.js 14 with React components
- **Design System**: Neobrutalist/Memphis style with bold borders and vibrant colors
- **Communication**: WebSocket protocol for real-time audio streaming
- **Audio Processing**: GStreamer pipeline for encoding/decoding

## Flow Steps

### Step 1: Welcome & Name Entry
**Component**: `WelcomeCard` (`/src/components/custom/welcome-card.tsx`)

**Purpose**: Introduce users to Diala and collect their name

**Key Features**:
- Animated welcome message with 3 phases
- "DIALA" branding with bold typography
- Name input field with validation
- Icons indicating voice capabilities (microphone, chat)
- Blue gradient background with geometric patterns

**User Action**: Enter name and click "Get Started"

---

### Step 2: Customization
**Components**: 
- `AudioCard` (`/src/components/custom/audio-card.tsx`)
- `LanguageCard` (`/src/components/custom/language-card.tsx`)
- `FileUploadCard` (`/src/components/custom/file-upload-card.tsx`)

**Purpose**: Configure background audio environment and language preferences

**Audio Selection**:
- Pre-defined options: Crowded Office, Café Ambience, Co-Working Space, Train Station, Library
- Interactive audio player with:
  - Play/pause controls
  - Volume adjustment (vertical slider on hover)
  - Timeline scrubber
  - 10-second skip forward/backward
- Custom audio upload option
- Auto-play on selection

**Language Selection**:
- 6 language options with regional accents:
  - English (American)
  - Mandarin (Beijing)
  - Spanish (Spain)
  - French (Parisian)
  - German (Berlin)
  - Japanese (Tokyo)
- Flag emoji visual indicators
- Card-based selection UI

**Quick Demo Option**: Button to skip customization with default settings

---

### Step 3: Voice & Pitch Selection
**Components**:
- `VoiceAgentCard` (`/src/components/custom/voice-agent-card.tsx`)
- `PitchCard` (`/src/components/custom/pitch-card.tsx`)
- `PremiumFeatureCard` (`/src/components/custom/premium-feature-card.tsx`)

**Purpose**: Select AI voice personality and conversation purpose

**Voice Agent Selection**:
- 6 pre-configured voice agents:
  - Diala-Tone: "Your harmonious vocal guide"
  - Echo-Diala: "Resonating with clarity and charm"
  - Diala-Belle: "The beautiful voice for every call"
  - Voice-Diala: "Speak clearly, listen intently"
  - Diala-Muse: "Inspiring conversations, always"
  - Chat-Diala: "Friendly and fluent, ready to chat"
- Dynamic Unsplash images for each agent
- Premium voice cloning feature promotion

**Pitch Selection**:
- 4 pitch types with distinct colors and icons:
  - **Discovery Calls** (Purple/Briefcase): Book qualified discovery calls
  - **Customer Support** (Green/Headphones): Handle customer queries
  - **Appointment Setter** (Orange/Calendar): Book appointments
  - **Custom Pitch** (Pink/Edit): Create custom business pitch
- Each pitch includes backstory/behavior description
- Custom pitch opens modal for detailed configuration

---

### Step 4: Ready to Dial
**Component**: Main `App` component summary view

**Purpose**: Confirm configuration and initiate voice session

**Features**:
- Configuration summary cards showing:
  - Selected audio environment
  - Chosen language with flag
  - Voice agent selection
  - Pitch type
- Animated celebration elements (rotating stars, pulsing squares)
- "START DIALING NOW" call-to-action button
- Full configuration summary text

---

### Step 5: Loading & Initialization
**Component**: `LoadingScreen` (`/src/components/custom/loading-screen.tsx`)

**Purpose**: Initialize voice agent infrastructure

**Loading Steps** (with progress indicators):
1. Initializing Voice Agent
2. Loading Audio Environment
3. Configuring Text-to-Speech
4. Establishing Connection
5. Finalizing Setup

**Visual Features**:
- Displays user configuration during loading
- Step-by-step progress with checkmarks
- Smooth transitions between steps
- Maintains user engagement during setup

---

### Step 6: User Verification
**Component**: `VerificationModal` (`/src/components/custom/modals/verification-modal.tsx`)

**Purpose**: Authenticate user and collect contact information

**Two-Step Process**:
1. **Information Collection**:
   - Email address input
   - Phone number input
   - Terms of service agreement checkbox
   - Privacy policy and terms links

2. **OTP Verification**:
   - 6-digit verification code input
   - Auto-focus and tab between digits
   - Demo mode accepts "000000"
   - Resend code option

**Design**: Modal overlay with gradient background

---

### Step 7a: Phone Call Flow
**Component**: `CallingScreen` (`/src/components/custom/calling-screen.tsx`)

**Purpose**: Initiate outbound phone call to user

**Features**:
- Full-screen "DIALA IS CALLING" interface
- Animated phone icon with vibration effect
- Call timer (counts up from 00:00)
- "Continue on Web" option (first 4 seconds)
- 30-second timeout with retry options
- Neobrutalist design with geometric decorations

**User Experience**:
- Dramatic visual feedback during call placement
- Clear indication of call status
- Alternative web option for flexibility

---

### Step 7b: Web Interface Flow
**Component**: `WebVoiceInterface` (`/src/components/custom/web-voice-interface.tsx`)

**Purpose**: In-browser voice conversation interface

**Layout**:
- **Desktop**: Horizontal split screen
- **Mobile**: Vertical split screen

**Left Panel - Transcript**:
- Real-time conversation transcript
- Speaker identification (You/Agent)
- Timestamp for each message
- Auto-scroll to latest message
- Loading states for agent responses

**Right Panel - Audio Visualization**:
- Microphone permission request flow
- Real-time audio level meters:
  - User's audio (green bars)
  - Agent's audio (blue bars)
- Visual feedback for active speaker
- Responsive bar heights based on volume

**Controls**:
- Mute/unmute toggle
- End call button
- Permission status indicators

---

## Technical Implementation

### State Management
The main `App` component manages flow state through React hooks:
```typescript
- currentStep: Navigation through steps 1-4
- userName: User's entered name
- selectedAudio: Chosen background audio
- selectedLanguage: Selected language/accent
- selectedVoiceAgent: Chosen AI voice personality
- selectedPitch: Selected conversation purpose
- showLoading/showVerification/showCalling/showWebInterface: Flow control states
```

### Component Communication
- Props drilling for configuration data
- Callback functions for user selections
- Conditional rendering based on flow state

### Navigation
- `OnboardingNav` component shows progress
- Arrow buttons for step navigation
- Validation prevents advancing without required selections
- Back navigation always available

### WebSocket Integration
The `WebVoiceInterface` establishes real-time communication:
- Bidirectional audio streaming
- Text transcript updates
- Connection state management
- Audio level data for visualizations

---

## Design System Integration

### Visual Language
- **Borders**: Bold 4px black borders on all interactive elements
- **Shadows**: 4px offset shadows (8px when selected)
- **Colors**: 
  - Primary: RGB(0,82,255) blue
  - Accent: Yellow (#FFD700), Orange, Pink, Cyan
  - Backgrounds: Gradient overlays and patterns
- **Typography**: "Noyh-Bold" custom font, uppercase headers

### Animations
- **Selection**: Rotating gold star badge
- **Hover**: Shadow depth increase
- **Loading**: Step-by-step progress animations
- **Calling**: Phone vibration effect
- **Audio**: Real-time level meter updates

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly tap targets
- Adaptive layouts for different screen sizes

---

## User Experience Flow

### Decision Points
1. **Quick Demo vs Full Customization**: Skip to defaults or configure
2. **Custom Pitch**: Open modal for business-specific configuration
3. **Phone vs Web**: After verification, choose communication channel

### Error Handling
- Form validation on name entry
- Required selection validation before advancing
- Timeout handling on phone calls
- Microphone permission denial handling

### Accessibility
- Keyboard navigation support
- Focus management between steps
- Clear visual selection indicators
- Alternative text for images

---

## Integration Points

### Backend APIs
- User verification endpoint
- Phone call initiation (Telnyx)
- WebSocket connection establishment
- Configuration persistence

### External Services
- **Telnyx**: PSTN telephony
- **Deepgram**: Speech-to-text
- **OpenAI**: Conversation AI
- **ElevenLabs/Chatterbox**: Text-to-speech

### Audio Architecture
- GStreamer pipeline for processing
- Mulaw encoding for telephony
- Real-time streaming protocols
- Audio level analysis for visualizations

### Security
- JWT authentication post-verification
- Secure WebSocket connections
- Phone number validation
- Rate limiting on verification attempts

---

## Future Enhancements

### Planned Features
- Voice cloning integration ($49/month premium)
- Additional language support
- Custom audio environment creation
- Advanced pitch customization
- Call recording and playback

### Scalability Considerations
- CDN for audio file delivery
- WebSocket connection pooling
- Horizontal scaling for concurrent calls
- Cache optimization for repeated flows

---

## Maintenance Notes

### Key Files
- `/src/app/onboarding/voice/page.tsx`: Entry point
- `/src/components/custom/app.tsx`: Main flow orchestrator
- `/src/hooks/useWebSocket.ts`: WebSocket management
- `/src/lib/audio-utils.ts`: Audio processing utilities

### Testing Checklist
- [ ] Name validation edge cases
- [ ] Audio playback across browsers
- [ ] Language selection persistence
- [ ] Verification code handling
- [ ] Call timeout scenarios
- [ ] Microphone permission flows
- [ ] Mobile responsive layouts
- [ ] WebSocket reconnection logic

### Common Issues
- **Audio not playing**: Check browser autoplay policies
- **Verification failing**: Ensure backend services running
- **Call not connecting**: Verify Telnyx configuration
- **Transcript delays**: Check WebSocket connection stability