# Diala Onboarding Flow Documentation

This directory contains the complete onboarding flow implementation for the Diala voice agent platform. The onboarding system guides users through setting up various AI-powered features using a distinctive Neobrutalist/Memphis design system.

## Overview

The onboarding flow consists of multiple specialized workflows, each designed to help users configure different aspects of the Diala platform:

- **Voice Agent Creation** - Set up and manage AI voice agents
- **Campaign Management** - Create and launch outbound calling campaigns  
- **Lead Generation** - Hunt for prospects using multiple data sources
- **Knowledge Base Setup** - Build RAG systems from various content sources
- **Multi-Agent Coordination** - Deploy intelligent agent swarms
- **Audio Transcription** - Convert audio files to text with voice cloning
- **YouTube Transcript Processing** - Extract and process YouTube video transcripts
- **Voice Interface** - Access the main voice interaction system

## File Structure

```
onboarding/
├── agents/page.tsx          # AI agent management interface
├── calls/page.tsx           # Campaign creation workflow (6 steps)
├── hunter/page.tsx          # Lead generation workflow (6 steps) - Enhanced with real backend
├── rag/page.tsx            # Knowledge base creation (6 steps)
├── swarms/page.tsx         # Multi-agent coordination (6 steps)
├── transcribe/page.tsx     # Audio file transcription (2 steps) - NEW
├── transcripts/page.tsx    # YouTube transcript extraction (2 steps)
└── voice/page.tsx          # Voice interface wrapper
```

## Individual Page Analysis

### Agents Page (`/onboarding/agents`)

**Purpose**: Comprehensive AI agent management and creation interface

**Key Features**:
- **Agent Overview Dashboard**: Shows total agents, active agents, total calls, and average success rate
- **Agent Creation Form**: Multi-field form for creating new agents with:
  - Agent name and purpose definition
  - Language selection (English, Spanish, French, German)
  - Voice selection (Sarah, Michael, Emma, James)
  - Personality types (Discovery Calls, Customer Support, Appointment Setting, Custom)
  - Advanced settings (voice speed, response time sliders)
- **Agent Management**: View, edit, activate/deactivate, and delete existing agents
- **Mock Data**: Pre-populated with example agents (Sales Champion, Support Star)

**Design Elements**:
- Blue color scheme (rgb(0,82,255) background)
- Neobrutalist card design with heavy borders and shadows
- Interactive elements with hover effects and animations

### Calls Page (`/onboarding/calls`) 

**Purpose**: Complete campaign creation and management workflow

**6-Step Process**:

1. **Campaign Setup**: Define campaign name, type (Sales/Follow-up/Survey), and goals
2. **Agent Selection**: Choose from available AI agents for the campaign
3. **Target Audience**: Configure contact lists via:
   - CSV upload with contact validation
   - Existing leads from Hunter results
   - Manual phone number entry
4. **Call Configuration**: Advanced settings including:
   - Schedule configuration (start/end times, timezone)
   - Capacity limits (max calls per day)
   - Retry logic (attempts and delays)
   - Features (voicemail, call recording)
5. **Preview & Launch**: Review all settings and launch campaign
6. **Campaign Active**: Real-time progress tracking and campaign management

**Key Features**:
- **Progress Tracking**: Visual progress bar and status updates during launch
- **Verification Modal**: Email/phone verification before campaign launch
- **Premium Features**: Smart scheduling and optimization options
- **Real-time Stats**: Campaign performance metrics and analytics

**Design Elements**:
- Orange color scheme (orange-500 background)
- Step-by-step navigation with visual progress indicators
- Premium feature cards with upgrade prompts

### Hunter Page (`/onboarding/hunter`) - Enhanced with Real Backend

**Purpose**: Lead generation and prospecting workflow using multiple data sources with full backend integration

**6-Step Process**:

1. **Search Definition**: Define search objectives and select lead sources:
   - Web Search (available)
   - B2B Database (premium/locked)
   - Business Directories (premium/locked)
   - **Real-time Usage Display**: Shows current subscription tier and daily/monthly limits
2. **Search Criteria**: Configure targeting parameters:
   - Industry selection (Technology, Healthcare, Finance, etc.)
   - Geographic location
   - Company size (1-10, 11-50, 51-200, 201-1000, 1000+ employees)
   - Job titles (CEO, CTO, VP Sales, etc.)
   - Keywords (optional)
3. **Contact Preferences**: Choose data types to include:
   - Email addresses (verified business emails)
   - Phone numbers (direct dial and mobile)
   - LinkedIn integration (premium feature)
4. **Search Preview**: Review search parameters and estimated results with rate limit checks
5. **Search Progress**: Real-time search execution with actual backend processing and status polling
6. **Results Display**: Search completion with live data from Convex backend

**Enhanced Features**:
- **User Authentication**: Full Clerk integration for user management
- **Real Backend Integration**: Convex database operations for actual lead searches
- **Usage Tracking**: Live subscription tier display (Free/Premium/Enterprise)
- **Rate Limiting**: Real-time usage validation with search/lead limits
- **Live Data**: Actual search creation and progress polling from backend
- **Usage Statistics**: Daily searches and monthly lead usage with remaining quotas
- **Smart Validation**: Prevents searches when limits are exceeded

**Backend Integration**:
- **Convex Actions**: `createLeadSearch`, `getSearchStatus` for real operations
- **Convex Queries**: `getUserUsageStats` for live usage tracking
- **Search Polling**: 10-second intervals with 5-minute timeout for real-time updates
- **Error Handling**: Comprehensive error states and user feedback

**Design Elements**:
- Violet color scheme (violet-400 background)
- Source selection cards with locked/unlocked states
- Progress visualization for search stages
- Usage statistics cards with subscription tier badges

### RAG Page (`/onboarding/rag`)

**Purpose**: Knowledge base creation from various content sources for AI agent training

**6-Step Process**:

1. **Welcome**: Name collection using WelcomeCard component
2. **Source Selection**: Choose knowledge source type:
   - YouTube videos (channel/playlist URLs)
   - Documents (PDF, Word, text files)
   - Web pages (URL scraping)
   - Structured data (CSV, knowledge base files)
3. **Source Input**: Provide specific source details:
   - YouTube URLs with processing up to 100 videos
   - File upload with drag-and-drop interface
   - URL list input (up to 20 URLs)
4. **Processing Configuration**: Advanced settings with accordion interface:
   - Chunk size (256-1024 tokens)
   - Overlap settings (0 to chunk_size/4 words)
   - Embedding model selection (openai-ada)
   - Vector store configuration (pinecone)
5. **Processing Progress**: Real-time processing with 4-stage pipeline:
   - Content fetching
   - Text extraction
   - Embedding generation
   - Vector index building
6. **Completion**: Knowledge base ready with comprehensive statistics

**Key Features**:
- **Multi-format Support**: Videos, documents, web content, structured data
- **Advanced Configuration**: Customizable chunking and embedding parameters
- **Processing Pipeline**: Automated content extraction and indexing
- **Statistics Dashboard**: Processing metrics and knowledge base analytics

**Design Elements**:
- Yellow color scheme (yellow-400 background)
- Accordion interface for advanced settings
- Progress visualization with stage indicators

### Swarms Page (`/onboarding/swarms`)

**Purpose**: Multi-agent coordination system for deploying intelligent agent networks

**6-Step Process**:

1. **Swarm Definition**: Define swarm name and objectives for agent collaboration
2. **Workflow Templates**: Choose from pre-built collaboration patterns:
   - Sales Pipeline (Research → Qualify → Schedule → Follow-up)
   - Support Escalation (Triage → Resolve → Escalate → Analyze)
   - Lead Nurturing (Discover → Engage → Educate → Convert)
   - Custom Workflow (build your own)
3. **Agent Selection**: Choose from specialized agents (minimum 2 required):
   - Research Agent (information gathering)
   - Sales Agent (lead engagement)
   - Support Agent (customer service)
   - Scheduling Agent (calendar management)
   - Analytics Agent (performance analysis)
   - Coordinator Agent (workflow management)
4. **Swarm Configuration**: Advanced settings with tooltips:
   - Collaboration mode (Sequential/Parallel/Adaptive)
   - Max concurrent agents (2-10)
   - Communication protocol (Direct/Broadcast/Hierarchical)
   - Auto-scaling and performance optimization
   - Error handling strategies
5. **Review & Deploy**: Comprehensive swarm summary and deployment preparation
6. **Deployment**: Real-time deployment with progress tracking and final statistics

**Key Features**:
- **Template System**: Pre-configured workflows for common use cases
- **Agent Specialization**: Role-specific capabilities and training
- **Advanced Configuration**: Fine-tuned collaboration and communication settings
- **Deployment Infrastructure**: Global deployment with automatic failover
- **Premium Features**: Enterprise swarm capabilities and unlimited scaling

**Design Elements**:
- Cyan color scheme (cyan-500 background)
- Template selection cards with agent badges
- Tooltip system for complex configuration options

### Transcribe Page (`/onboarding/transcribe`) - NEW

**Purpose**: Audio file transcription service with voice cloning capabilities

**2-Step Process**:

1. **File Upload**: Audio file selection and upload:
   - **Drag-and-Drop Interface**: Interactive file drop zone with visual feedback
   - **Multi-format Support**: MP3, WAV, OGG, M4A, FLAC audio files
   - **File Validation**: Real-time format and size validation
   - **Upload Progress**: Visual progress tracking during file processing
   - **File Metadata**: Display of file name, size, and format

2. **Transcription & Actions**: Audio player and transcript processing:
   - **Audio Player**: Built-in HTML5 audio player for file playback
   - **Real-time Transcription**: Progress tracking with percentage completion
   - **Transcript Display**: Interactive text output with chunked formatting
   - **Action Grid**: 2x2 grid layout with specialized actions:
     - **Copy Transcript**: One-click clipboard functionality
     - **Voice Clone**: AI voice cloning from audio sample
     - **Bulk Process**: Batch transcription capabilities
     - **Chat with Diala**: Integration with AI chat system

**Key Features**:
- **Advanced File Handling**: Drag-and-drop with visual drag states and animations
- **Multiple Audio Formats**: Support for all major audio file types
- **Voice Cloning Integration**: Create AI voice models from uploaded audio
- **Professional Interface**: Clean, intuitive design for serious audio work
- **Progress Tracking**: Real-time feedback during transcription process
- **Interactive Transcript**: Chunked text display for easy reading and editing

**Technical Implementation**:
- **File Upload**: HTML5 FileReader API with drag-and-drop event handling
- **Audio Processing**: Web Audio API integration for playback
- **Progress Simulation**: Interval-based progress updates (placeholder for real API)
- **Modals Integration**: Voice cloning, bulk processing, and chat modals
- **Responsive Design**: Mobile-friendly layout with adaptive grid

**Design Elements**:
- **Blue Color Scheme**: Blue-500 background with matching accents
- **Audio-focused Icons**: Microphone, music note, and volume icons
- **Interactive Drop Zone**: Animated drag states with pulsing effects
- **2x2 Action Grid**: Organized button layout with hover transformations
- **Clean Typography**: Professional text hierarchy for audio transcription work

### Transcripts Page (`/onboarding/transcripts`)

**Purpose**: YouTube transcript extraction and processing tool

**2-Step Process**:

1. **URL Input**: YouTube URL entry with feature showcase:
   - Free transcript generation
   - Multi-language support (125+ languages)
   - One-click copy functionality
   - Translation capabilities
2. **Processing & Display**: Video player and transcript interaction:
   - Embedded YouTube player
   - Real-time transcript fetching with job polling
   - Interactive transcript with chunked display
   - Action buttons (Copy, Bulk Download, Chat with Diala)
   - Social sharing integration

**Key Features**:
- **Free Service**: No cost transcript generation
- **Multi-language**: Support for 125+ languages with translation
- **Real-time Processing**: Job-based processing with status polling
- **Interactive Interface**: Chunked transcript display with hover effects
- **Integration Options**: Bulk download and Diala chat integration
- **Social Features**: Like, subscribe, and sharing buttons

**Design Elements**:
- Red color scheme (red-500 background)
- YouTube branding integration
- Social media button stack
- Video player embedding with responsive design

### Voice Page (`/onboarding/voice`)

**Purpose**: Simple wrapper for the main voice interface application

**Implementation**:
- Minimal wrapper component that renders the main `App` component
- Centered layout with responsive design
- Direct integration with the core voice interface system

**Design Elements**:
- Clean, minimal layout
- Full-width responsive container
- Integration point for the main application

## Technical Implementation Details

### Common Design Patterns

**Neobrutalist/Memphis Design System**:
- **Heavy Borders**: 3-4px black borders on all major elements
- **Bold Shadows**: Box-shadow effects with offset positioning
- **Vibrant Colors**: High-contrast color palette (pink, yellow, cyan, violet, orange, red, blue)
- **Geometric Elements**: Rotated cards and decorative shapes
- **Typography**: Noyh-Bold font family with uppercase text styling

**Component Architecture**:
- **Step-based Navigation**: Most flows use multi-step progression
- **Progress Indicators**: Visual step tracking and completion states
- **Modal Integration**: Verification and configuration modals
- **Responsive Design**: Mobile-first approach with breakpoint handling

**State Management**:
- **React Hooks**: useState for local component state
- **Convex Integration**: useAction and useQuery hooks for backend operations
- **Authentication**: Clerk integration for user management and session handling
- **Real-time Updates**: Polling mechanisms for job status tracking
- **Form Validation**: Client-side validation with disabled states
- **File Handling**: HTML5 FileReader API for drag-and-drop functionality

**Backend Integration**:
- **Real Database Operations**: Live data persistence and retrieval via Convex
- **Usage Tracking**: Subscription tier management and rate limiting
- **Job Processing**: Asynchronous task handling with progress updates
- **Error Handling**: Comprehensive error states and user feedback systems

### Common Components Used

- **UI Components**: Card, Button, Input, Badge, Slider, Switch, Select
- **Custom Components**: OnboardingNav, PremiumFeatureCard, VerificationModal
- **Modal Components**: Voice cloning, bulk processing, and chat integration modals
- **Icons**: Iconscout Unicons React library for consistent iconography
- **Navigation**: Step-based progression with back/continue buttons
- **File Upload**: Drag-and-drop zones with visual feedback and validation

### Premium Feature Integration

Most workflows include premium feature cards that showcase:
- Advanced capabilities available with upgrades
- Feature comparison between basic and premium plans
- Upgrade prompts and pricing information
- Feature locking with visual indicators

## User Flow Summary

### Primary Onboarding Paths

1. **Voice Agent Setup** → Agents → Voice → Calls (agent creation to campaign deployment)
2. **Lead Generation** → Hunter → Calls (prospect discovery to outreach with real backend)
3. **Knowledge Enhancement** → RAG → Agents (content ingestion to smarter agents)
4. **Scale Operations** → Swarms → Calls (multi-agent deployment to campaign execution)
5. **Audio Content Processing** → Transcribe → Voice Cloning → Agents (audio transcription to voice modeling)
6. **Video Content Processing** → Transcripts → RAG (YouTube content extraction to knowledge base)

### Cross-workflow Integration

- **Agent Reuse**: Agents created in the Agents flow are available in Calls and Swarms
- **Lead Integration**: Hunter results feed directly into Calls workflows with real backend data
- **Knowledge Sharing**: RAG knowledge bases enhance all agent capabilities
- **Voice Cloning**: Audio transcriptions can generate custom voice models for agents
- **Content Pipeline**: Audio/video content flows through transcription to knowledge bases
- **Swarm Coordination**: Multi-agent setups can be used across all campaign types
- **Usage Tracking**: Real-time subscription and rate limiting across all premium features

### Verification and Launch Patterns

Most workflows include:
1. **Configuration Phase**: Step-by-step setup with validation
2. **Review Phase**: Comprehensive settings summary
3. **Verification Phase**: Email/phone verification modal
4. **Launch Phase**: Real-time progress tracking
5. **Completion Phase**: Success confirmation with next steps

This comprehensive onboarding system provides users with multiple entry points and workflow options while maintaining consistent design patterns and user experience throughout the platform.