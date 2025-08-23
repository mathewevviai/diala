# AutoRAG Implementation Roadmap

## Overview

This document provides a detailed implementation plan for integrating the SalesAgenttraining functionality into the Diala platform using Convex and Cloudflare.

## Phase 1: Foundation Setup (Week 1)

### 1.1 Convex Schema Implementation
```typescript
// convex/schema.ts
// Implement the complete schema from 03_convex_cloudflare_architecture.md
- ragWorkflows table
- ragKnowledgeEntries table  
- ragProcessingQueue table
```

### 1.2 Cloudflare Worker Setup
```bash
# Create new Cloudflare Worker project
wrangler init autorag-processor
cd autorag-processor

# Configure wrangler.toml
name = "autorag-processor"
main = "src/index.ts"
compatibility_date = "2024-03-15"

[vars]
CONVEX_URL = "https://your-app.convex.cloud"

[[vectorize]]
binding = "VECTORIZE"
index_name = "sales-knowledge-embeddings"
```

### 1.3 Environment Configuration
```bash
# Backend .env additions
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_WORKER_URL=https://autorag-processor.your-subdomain.workers.dev

# Cloudflare secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put CONVEX_DEPLOY_KEY
```

## Phase 2: YouTube Processing Migration (Week 2)

### 2.1 Port transcript_fetcher.py to TypeScript
```typescript
// cloudflare-worker/src/youtube/transcript-fetcher.ts
import { YouTubeTranscript } from '@distube/ytdl-core';

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptData> {
  // Implement transcript fetching logic
  // Handle multiple URL formats
  // Prioritize manual over auto-generated transcripts
}
```

### 2.2 Implement Processing Queue
```typescript
// cloudflare-worker/src/queue/processor.ts
export async function processYouTubeWorkflow(
  workflowId: string,
  sources: string[],
  env: Env
): Promise<void> {
  // 1. Extract video IDs from sources
  // 2. Queue each video for processing
  // 3. Update Convex with progress
}
```

### 2.3 Convex Actions for YouTube
```typescript
// convex/autorag/youtube.ts
export const createYouTubeWorkflow = mutation({
  args: {
    name: v.string(),
    sources: v.array(v.string()),
    parameters: v.object({...})
  },
  handler: async (ctx, args) => {
    // Create workflow in database
    // Trigger Cloudflare processing
  }
});
```

## Phase 3: Content Analysis Integration (Week 3)

### 3.1 Gemini Integration in Cloudflare
```typescript
// cloudflare-worker/src/ai/gemini-analyzer.ts
export class GeminiAnalyzer {
  constructor(private apiKey: string) {}
  
  async analyzeTranscript(
    content: string,
    focusArea: FocusArea
  ): Promise<KnowledgeEntry[]> {
    // Implement the 9 focus areas analysis
    // Return structured JSON entries
  }
}
```

### 3.2 Focus Area Processing
```typescript
// cloudflare-worker/src/analysis/focus-areas.ts
export const FOCUS_AREAS = {
  1: { 
    name: "Objection Mindset",
    description: "Objections = info requests, not rejections",
    prompt: "Extract sales knowledge about reframing objections..."
  },
  // ... implement all 9 focus areas
};
```

### 3.3 Batch Processing Implementation
```typescript
// Process videos in parallel with rate limiting
const processWithRateLimit = new RateLimiter({
  maxConcurrent: 5,
  requestsPerMinute: 30
});
```

## Phase 4: Embedding Generation & Storage (Week 4)

### 4.1 Cloudflare Vectorize Setup
```typescript
// cloudflare-worker/src/embeddings/vectorize.ts
export async function generateAndStoreEmbeddings(
  entries: KnowledgeEntry[],
  metadata: VectorMetadata,
  env: Env
): Promise<string[]> {
  // 1. Generate embeddings using OpenAI API
  // 2. Store in Cloudflare Vectorize
  // 3. Return vector IDs
}
```

### 4.2 Vector Search Implementation
```typescript
// cloudflare-worker/src/search/vector-search.ts
export async function searchKnowledge(
  query: string,
  focusAreas: number[],
  limit: number,
  env: Env
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  // 2. Search across specified focus areas
  // 3. Return ranked results with metadata
}
```

### 4.3 Convex Integration for Embeddings
```typescript
// convex/autorag/embeddings.ts
export const storeEmbeddingReferences = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    knowledgeEntries: v.array(...)
  },
  handler: async (ctx, args) => {
    // Store knowledge entries with vector IDs
    // Update workflow stats
  }
});
```

## Phase 5: Frontend Integration (Week 5)

### 5.1 Update Auto-RAG Page
```typescript
// frontend/src/app/dashboard/auto-rag/page.tsx
// Add Convex hooks for real-time updates
const workflows = useQuery(api.autorag.listWorkflows);
const workflowStatus = useQuery(
  api.autorag.workflowStatus,
  { workflowId: selectedWorkflow?.id }
);
```

### 5.2 Create Workflow Modal Updates
```typescript
// frontend/src/components/custom/create-rag-workflow-modal.tsx
// Add YouTube channel URL parsing
// Add focus area selection
// Add Cloudflare-specific options
```

### 5.3 Real-time Progress Updates
```typescript
// Use Convex subscriptions for live updates
const progress = useSubscription(
  api.autorag.subscribeToProgress,
  { workflowId }
);
```

## Phase 6: Testing & Optimization (Week 6)

### 6.1 End-to-End Testing
- Test YouTube URL parsing and validation
- Test transcript fetching with various video types
- Test all 9 focus areas extraction
- Test embedding generation and storage
- Test vector search accuracy

### 6.2 Performance Optimization
- Implement caching for processed videos
- Optimize batch sizes for API calls
- Add request deduplication
- Implement smart retry logic

### 6.3 Error Handling & Recovery
- Add comprehensive error logging
- Implement dead letter queues
- Add manual retry options
- Create admin debugging tools

## Migration Checklist

### Pre-Migration
- [ ] Backup existing embedding_data directories
- [ ] Document current API keys and configurations
- [ ] Create Cloudflare account and worker
- [ ] Set up Convex project and schema

### Migration Steps
- [ ] Port Python code to TypeScript
- [ ] Test YouTube transcript fetching
- [ ] Verify Gemini AI integration
- [ ] Test embedding generation
- [ ] Validate vector storage
- [ ] Test search functionality

### Post-Migration
- [ ] Verify all workflows complete successfully
- [ ] Compare output quality with original
- [ ] Performance benchmarking
- [ ] Update documentation

## Key Differences from Original

### Architecture Changes
1. **Queue System**: Redis → Cloudflare Queues + Durable Objects
2. **Vector Storage**: Multiple providers → Cloudflare Vectorize
3. **Real-time Updates**: WebSocket → Convex Subscriptions
4. **File Storage**: Local filesystem → Cloudflare R2

### API Changes
1. **Processing Trigger**: Python CLI → Convex Actions
2. **Status Updates**: Polling → Real-time subscriptions
3. **Error Handling**: Logs → Structured error tracking

### Data Flow Changes
1. **Transcript Storage**: JSON files → Convex database
2. **Embedding References**: File paths → Vector IDs
3. **Progress Tracking**: File markers → Database status

## Success Metrics

### Performance Targets
- Process 10 YouTube videos per minute
- Generate 1000 embeddings per minute  
- Vector search latency < 100ms
- 99.9% processing success rate

### Quality Metrics
- 95% relevant knowledge extraction
- < 5% duplicate entries
- 100% focus area coverage
- Accurate vector similarity scores

## Risk Mitigation

### Technical Risks
1. **API Rate Limits**: Implement adaptive rate limiting
2. **Large Video Channels**: Add pagination and resumable processing
3. **Embedding Quality**: A/B test different models
4. **Storage Costs**: Monitor and optimize vector storage

### Operational Risks
1. **Service Outages**: Multi-region failover
2. **Data Loss**: Regular backups to R2
3. **Cost Overruns**: Set spending alerts
4. **Security Breaches**: Regular security audits

This roadmap ensures a systematic migration while maintaining the quality and functionality of the original SalesAgenttraining system.