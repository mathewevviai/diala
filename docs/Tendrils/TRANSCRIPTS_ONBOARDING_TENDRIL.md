# Transcripts Onboarding Tendril Documentation

## Overview

The Transcripts Onboarding Tendril is a specialized flow for extracting, processing, and utilizing YouTube video transcripts as training data for Diala's AI voice agents. This tendril demonstrates how real-world conversation data from YouTube videos can be leveraged to create more natural and context-aware voice agents.

### Purpose
- Extract transcripts from YouTube videos with one-click functionality
- Process bulk video content for AI training datasets
- Enable translation to 125+ languages
- Provide interactive transcript viewing and manipulation
- Connect transcript data to voice agent training pipelines

### Architecture Overview
- **Frontend**: Next.js with React components
- **Backend**: Convex for serverless transcript processing
- **Design**: Neobrutalist style with red primary color scheme
- **Processing**: Asynchronous job-based system with polling

## Flow Steps

### Step 1: Welcome & Initial Input
**Component**: `TranscriptsOnboarding` (`/src/app/onboarding/transcripts/page.tsx`) - Step 1 view

**Purpose**: Introduce the transcript extraction service and collect YouTube URL

**Key Features**:
- **Hero Section**:
  - Large YouTube icon button (red background)
  - Title: "YOUTUBE TO TRANSCRIPT"
  - Subtitle: "BULK DOWNLOAD TRANSCRIPTS"
  
- **Feature Cards** (3 yellow cards with icons):
  - One-Click Copy (copy icon)
  - Supports Translation (file icon)
  - Multiple Languages (comment icon)

- **Value Proposition Card**:
  - "Generate YouTube Transcript for FREE"
  - Bullet points:
    - Access all Transcript Languages
    - Translate to 125+ Languages
    - Easy Copy and Edit

- **URL Input**:
  - Large input field for YouTube URL
  - "CONTINUE" button with arrow icon
  - Validation requires valid YouTube URL format

- **Educational Content**:
  - **YouTube Transcript Training Data Card**:
    - Explains how transcripts create training datasets
    - Lists benefits: real conversations, industry vocabulary, speech patterns, model improvement
  - **Bulk Processing Power Card**:
    - Highlights "10,000 YouTube videos per hour" capability
    - Emphasizes comprehensive dataset creation

**Design Elements**:
- Red background (#FF0000) with grid pattern
- Yellow accent cards
- 4px black borders throughout
- Rotating card animations (-1 degree rotation)

---

### Step 2: Transcript Display & Processing
**Component**: `TranscriptsOnboarding` - Step 2 view

**Purpose**: Display video, fetch transcript, and provide interaction options

**Layout Structure**:
- URL input remains at top for new searches
- Main content area with social media sidebar
- Educational content repeated at bottom

**Social Media Sidebar** (left side):
- 7 vertical buttons with brand colors:
  - YouTube (red)
  - Twitter (blue)
  - Facebook (blue)
  - Instagram (pink)
  - LinkedIn (blue)
  - Share (purple)
  - WhatsApp (green)

**Main Content Card**:
1. **Video Information**:
   - "TRANSCRIPT" badge
   - Video title (fetched from metadata)
   - Author with clickable YouTube channel link
   - Like button (links to video)
   - Subscribe button (links to channel with subscription prompt)

2. **Video Embed**:
   - Responsive YouTube iframe
   - 16:9 aspect ratio container
   - Loading skeleton while fetching

3. **Action Buttons** (full width):
   - **COPY TRANSCRIPT** (white background)
   - **WANT TO BULK DOWNLOAD?** (yellow background)
   - **CHAT WITH IN DIALA** (blue background)

4. **Transcript Display**:
   - Yellow background container
   - Text chunked into 3-word segments
   - Hover effect on each chunk
   - Loading skeleton with animated bars

**Technical Process**:
1. Initiates async job via Convex action
2. Polls job status every 2 seconds
3. Handles cached vs. new transcript requests
4. 60-second timeout with error handling
5. Extracts video metadata (title, author, duration)

---

## Modal Interactions

### CopyTranscriptModal
**Purpose**: Confirms successful clipboard copy and educates on usage

**Content**:
- Success message: "TRANSCRIPT COPIED!"
- Three use case cards:
  1. **Voice Agent Training**: Train conversational AI
  2. **Dataset Creation**: Build dialogue datasets
  3. **Model Fine-tuning**: Improve AI accuracy

**Design**: Yellow theme with icon-based feature display

---

### BulkDownloadModal
**Purpose**: Promotes bulk processing capabilities

**Content**:
- Title: "BULK DOWNLOAD AVAILABLE"
- Three capability cards:
  1. **Process Thousands**: Handle videos at scale
  2. **Training Datasets**: Extract for AI training
  3. **Smart Filtering**: By channel/playlist/keywords

**Call-to-Action**: Encourages users to explore bulk features

---

### ChatWithDialaModal
**Purpose**: Introduces AI-powered transcript analysis

**Content**:
- Title: "CHAT WITH DIALA AI"
- Three feature cards:
  1. **Ask Questions**: Query any transcript
  2. **Get Insights**: AI-powered analysis
  3. **Train Agents**: Use conversation data

**Integration**: Links transcript data to voice agent capabilities

---

## Technical Implementation

### State Management
```typescript
- currentStep: Controls view (1 or 2)
- youtubeUrl: Current video URL
- transcript: Fetched transcript text
- isLoading: Loading state
- jobId: Async job identifier
- videoMetadata: Title, author, duration
- Modal states: showCopyModal, showBulkModal, showChatModal
```

### Convex Integration
**Actions Used**:
- `fetchYoutubeTranscript`: Initiates transcript extraction
- `getJobStatus`: Polls for completion

**Job Flow**:
1. Submit URL with user ID
2. Receive job ID (or cached result)
3. Poll status endpoint until completed/failed
4. Display transcript or error message

### Transcript Processing
- **Chunking**: Splits text into 3-word segments for interactivity
- **Caching**: Returns immediate results for previously processed videos
- **Metadata**: Extracts video title, author, and duration

### Error Handling
- Invalid URL validation
- Network error recovery
- Timeout after 60 seconds
- Failed job status handling
- User-friendly error messages

---

## Design System Integration

### Color Palette
- **Primary**: Red (#FF0000) - YouTube brand alignment
- **Secondary**: Yellow (#FFD700) - CTAs and highlights
- **Accent**: Blue (rgb(0,82,255)) - Diala brand
- **Social Colors**: Platform-specific brand colors

### Visual Elements
- **Borders**: Consistent 4px black borders
- **Shadows**: 4px offset shadow effect
- **Rotation**: Cards at -1/+1 degree angles
- **Grid Background**: 60px grid pattern
- **Typography**: "Noyh-Bold" uppercase headers

### Loading States
- **TranscriptSkeleton**: 
  - 8 animated yellow bars
  - Random widths (40-90%)
  - Pulse animation
  - "Fetching transcript..." message

### Responsive Design
- Mobile-first approach
- Stacked layout on small screens
- Hidden social sidebar on mobile
- Full-width buttons and inputs

---

## Training Data Focus

### Educational Messaging
The tendril emphasizes how YouTube transcripts power AI training:

1. **Scale**: "10,000 videos per hour" processing capability
2. **Quality**: Real conversations with natural speech patterns
3. **Diversity**: Industry-specific vocabulary and terminology
4. **Authenticity**: Actual dialogue flow and interruptions

### FAQ Section
**Accordion-based FAQ** addressing:
- How bulk downloads work
- Why YouTube transcripts are valuable
- Types of content downloaded
- Data requirements for training (1,000-10,000 hours)

Each FAQ item includes:
- Icon in black square with yellow border
- Expandable content area
- Technical yet accessible explanations

---

## User Experience Flow

### Happy Path
1. User enters YouTube URL → clicks Continue
2. System fetches video metadata and transcript
3. User views embedded video with transcript below
4. User can:
   - Copy transcript (with success modal)
   - Explore bulk download options
   - Chat with AI about the content

### Alternative Paths
- **Cached Content**: Instant display without loading
- **Long Videos**: Progress indication during processing
- **Failed Extraction**: Clear error message with retry option
- **Timeout**: Suggestion to try again or contact support

### Interaction Patterns
- **Hover States**: Transcript chunks highlight on hover
- **Click Actions**: All buttons have clear purposes
- **Modal Flow**: Educational content in overlay modals
- **Social Sharing**: Direct links to social platforms

---

## Integration Points

### Backend Services
- **Convex Functions**:
  - `fetchYoutubeTranscript`: Main extraction endpoint
  - `getJobStatus`: Polling endpoint
  - Caching layer for repeated requests

### External APIs
- **YouTube**: 
  - oEmbed API for metadata
  - Video embedding via iframe
  - Channel linking for subscriptions

### Data Flow
1. **Input**: YouTube URL
2. **Processing**: Async job creation
3. **Storage**: Transcript caching in Convex
4. **Output**: Interactive transcript display
5. **Usage**: Training data for voice agents

---

## Future Enhancements

### Planned Features
- **Batch URL Processing**: Multiple videos at once
- **Translation Interface**: In-app language conversion
- **Export Options**: Various file formats (TXT, SRT, JSON)
- **Playlist Support**: Entire channel/playlist extraction
- **Search & Filter**: Find specific content types
- **Analytics**: Usage tracking and insights

### Technical Improvements
- **Real-time Progress**: Percentage-based loading
- **Chunked Streaming**: Display partial transcripts
- **Advanced Caching**: Predictive pre-fetching
- **Error Recovery**: Automatic retry mechanisms

---

## Maintenance Notes

### Key Files
- `/src/app/onboarding/transcripts/page.tsx`: Main component
- `/src/components/onboarding/modals/`: Modal components
- `/src/components/custom/transcript-skeleton.tsx`: Loading state
- Convex functions in backend for processing

### Common Issues
- **Transcript Not Loading**: Check Convex function logs
- **Video Not Found**: Validate YouTube URL format
- **Timeout Errors**: Consider increasing poll timeout
- **Metadata Missing**: Fallback to generic values

### Testing Checklist
- [ ] Valid YouTube URL formats (short, long, with parameters)
- [ ] Invalid URL error handling
- [ ] Cached vs. fresh transcript fetching
- [ ] All modal interactions
- [ ] Social media button links
- [ ] Responsive layout on mobile
- [ ] Loading states and skeletons
- [ ] Copy to clipboard functionality
- [ ] Video embedding across browsers

---

## Connection to Voice Agents

This tendril directly supports the voice agent training pipeline by:

1. **Data Collection**: Gathering real conversation transcripts
2. **Quality Training**: Using authentic dialogue for natural speech
3. **Domain Expertise**: Industry-specific content for specialized agents
4. **Continuous Learning**: Ongoing transcript collection for improvements

The transcripts collected here feed into the voice agent's knowledge base, enabling more natural and contextually appropriate conversations during phone calls and web interactions.