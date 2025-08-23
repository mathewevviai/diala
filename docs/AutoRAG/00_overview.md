# AutoRAG System Overview

## Executive Summary

The AutoRAG (Retrieval-Augmented Generation) system automates the process of converting YouTube videos, documents, and web content into intelligent knowledge bases for voice agents. This document outlines the integration of the existing SalesAgenttraining functionality into the Diala platform's backend and frontend dashboard.

## System Components

### 1. Source Material Processing
- **YouTube Video Transcription**: Uses `youtube-transcript-api` to extract transcripts from video URLs
- **Document Processing**: Supports PDF, TXT, JSON, CSV, and DOCX formats
- **Web Scraping**: Extracts content from web URLs

### 2. Content Analysis & Embedding Generation
- **Gemini AI Integration**: Uses Google's Gemini models for content analysis and structuring
- **Focused Extraction**: Targets specific sales knowledge areas (objection handling, techniques, etc.)
- **Embedding Creation**: Generates vector embeddings for similarity search

### 3. Vector Storage & Retrieval
- **Multiple Vector Stores**: Support for Pinecone, Chroma, Weaviate, Qdrant
- **Configurable Parameters**: Chunk size, overlap, embedding models
- **Scalable Architecture**: Handles large volumes of content

## Current Implementation (SalesAgenttraining)

### File Structure
```
SalesAgenttraining/
├── src/
│   ├── transcript_fetcher.py      # YouTube transcript extraction
│   └── __init__.py
├── cli_sales_agent.py             # WebSocket sales agent server
├── outbound_agent_logic.py        # Sales conversation logic
├── generate_sales_script.py       # Script generation from context
├── preprocess_transcripts.py      # Content analysis & structuring
├── data/                          # Training data and embeddings
├── audio_outputs/                 # Generated audio files
└── .env.local                     # Environment configuration
```

### Key Processes

#### 1. YouTube Transcript Fetching (`src/transcript_fetcher.py`)
- Extracts video IDs from YouTube URLs
- Prioritizes manually created transcripts over auto-generated
- Saves transcripts as JSON files
- Handles errors gracefully (disabled transcripts, unavailable videos)

#### 2. Content Processing (`preprocess_transcripts.py`)
- Analyzes transcripts using Gemini AI
- Extracts focused sales knowledge in 9 specialized areas:
  - Objection mindset and handling
  - Discovery techniques
  - Frameworks (Feel-Felt-Found, LAARC, AAA)
  - Price objection handling
  - "Think about it" responses
  - "Not interested" handling
  - Competitive positioning
  - Time & budget objections
  - Advanced layering techniques
- Generates structured JSON embeddings for each focus area

#### 3. Sales Agent Logic (`outbound_agent_logic.py`)
- Loads condensed sales context
- Generates contextual responses using Gemini
- Integrates with regional data and prospect information

## Frontend Integration (Dashboard)

### Auto-RAG Page (`frontend/src/app/dashboard/auto-rag/page.tsx`)
- **Workflow Management**: Create, view, edit, and delete RAG workflows
- **Real-time Status Tracking**: Progress monitoring for active workflows
- **Multiple Source Types**: YouTube, documents, URLs, and mixed workflows
- **Vector Store Configuration**: Support for various embedding providers
- **Export Capabilities**: Download workflows and embeddings

### Modal Components
- `CreateRAGWorkflowModal`: New workflow creation with source selection
- `ViewRAGWorkflowModal`: Detailed workflow information and statistics
- `SettingsRAGWorkflowModal`: Parameter adjustment for existing workflows
- `DeleteConfirmationModal`: Safe deletion with data loss warnings

## Integration Architecture

### Backend Services Required
1. **Transcript Processing Service**: Handles YouTube video processing
2. **Document Processing Service**: Manages file uploads and parsing
3. **Embedding Generation Service**: Creates vector embeddings
4. **Vector Store Management**: Handles storage and retrieval
5. **Workflow Orchestration**: Manages processing pipelines

### API Endpoints Needed
- `POST /api/autorag/workflows` - Create new workflow
- `GET /api/autorag/workflows` - List all workflows
- `GET /api/autorag/workflows/{id}` - Get workflow details
- `PUT /api/autorag/workflows/{id}` - Update workflow settings
- `DELETE /api/autorag/workflows/{id}` - Delete workflow
- `POST /api/autorag/workflows/{id}/start` - Start processing
- `POST /api/autorag/workflows/{id}/stop` - Stop processing
- `GET /api/autorag/workflows/{id}/status` - Get processing status
- `POST /api/autorag/workflows/{id}/export` - Export workflow data

### Required Environment Variables
```
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_key
CHROMA_API_URL=your_chroma_endpoint
WEAVIATE_API_KEY=your_weaviate_key
QDRANT_API_URL=your_qdrant_endpoint
```

## Next Steps

1. **Backend Service Development**: Implement FastAPI endpoints for workflow management
2. **Queue System Integration**: Use Redis for managing processing queues
3. **WebSocket Integration**: Real-time progress updates to frontend
4. **File Upload Handling**: Secure document upload and processing
5. **Vector Store Integration**: Connect to various vector database providers
6. **Agent Integration**: Enable RAG workflows to be used by voice agents

## Security Considerations

- API key management for external services
- File upload validation and scanning
- Rate limiting for AI model calls
- Data encryption for stored embeddings
- User access control for workflows

## Performance Considerations

- Async processing for large content volumes
- Chunking strategies for memory efficiency
- Caching for frequently accessed embeddings
- Connection pooling for database operations
- Queue management for processing priorities