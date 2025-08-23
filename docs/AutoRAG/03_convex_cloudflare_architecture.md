# Convex + Cloudflare Architecture for AutoRAG

## Overview

This document addresses the specific implementation details for integrating the AutoRAG system with Convex (backend database) and Cloudflare Workers/Durable Objects for distributed processing.

## Current Architecture Issues & Solutions

### Issue 1: Vector Storage
**Problem**: The original docs mention Pinecone/Chroma/Weaviate, but we're using Cloudflare for vector storage.
**Solution**: Use Cloudflare Vectorize for embedding storage and similarity search.

### Issue 2: Processing Queue
**Problem**: Original uses Redis for queue management.
**Solution**: Use Convex scheduled functions and Cloudflare Durable Objects for queue management.

### Issue 3: Real-time Updates
**Problem**: WebSocket updates need to integrate with Convex's reactive system.
**Solution**: Use Convex subscriptions for real-time workflow status updates.

## Revised Architecture

### Data Flow
```
1. Frontend (Next.js) → Convex Action → Cloudflare Worker
2. Cloudflare Worker → YouTube API → Transcript Processing
3. Processing → Gemini AI → Structured Knowledge Extraction
4. Knowledge → Cloudflare Vectorize → Embedding Storage
5. Status Updates → Convex Subscription → Frontend Real-time Updates
```

### Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ragWorkflows: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("scraping"),
      v.literal("embedding"),
      v.literal("indexing"),
      v.literal("validating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.number(),
    type: v.union(
      v.literal("youtube"),
      v.literal("documents"),
      v.literal("urls"),
      v.literal("mixed")
    ),
    parameters: v.object({
      sources: v.array(v.string()),
      chunkSize: v.number(),
      overlap: v.number(),
      embeddingModel: v.string(),
      vectorStore: v.string(),
    }),
    stats: v.object({
      totalContent: v.number(),
      contentProcessed: v.number(),
      embeddings: v.number(),
      indexSize: v.string(),
      processingTime: v.optional(v.string()),
    }),
    cloudflareWorkerId: v.optional(v.string()),
    vectorIndexId: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
    estimatedTime: v.optional(v.string()),
  }),

  ragKnowledgeEntries: defineTable({
    workflowId: v.id("ragWorkflows"),
    sourceId: v.string(), // YouTube video ID or document ID
    sourceType: v.string(),
    focusArea: v.number(), // 1-9 for the focus areas
    entries: v.array(v.object({
      type: v.union(
        v.literal("technique"),
        v.literal("mindset"),
        v.literal("sales_phrase"),
        v.literal("example")
      ),
      content: v.string(),
      speakerPerspective: v.string(),
      notes: v.optional(v.string()),
    })),
    vectorIds: v.array(v.string()), // Cloudflare Vectorize IDs
    createdAt: v.string(),
  }).index("by_workflow", ["workflowId"]),

  ragProcessingQueue: defineTable({
    workflowId: v.id("ragWorkflows"),
    sourceUrl: v.string(),
    processingStatus: v.string(),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    scheduledFor: v.string(),
    completedAt: v.optional(v.string()),
  }).index("by_workflow", ["workflowId"])
    .index("by_status", ["processingStatus"]),
});
```

### Cloudflare Worker Structure

```typescript
// cloudflare-worker/src/index.ts
export interface Env {
  VECTORIZE: Vectorize;
  GEMINI_API_KEY: string;
  CONVEX_URL: string;
  CONVEX_DEPLOY_KEY: string;
  QUEUE: Queue;
  DURABLE_OBJECTS: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === "/process-youtube") {
      return handleYouTubeProcessing(request, env);
    }
    
    if (url.pathname === "/generate-embeddings") {
      return handleEmbeddingGeneration(request, env);
    }
    
    return new Response("Not found", { status: 404 });
  },
  
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await processQueueMessage(message, env);
    }
  },
};
```

### Embedding Data Structure (Based on Sample)

```typescript
interface KnowledgeEntry {
  type: "technique" | "mindset" | "sales_phrase" | "example";
  content: string;
  speaker_perspective: string;
  notes?: string;
}

interface ProcessedTranscript {
  source_video: string;
  focus_area: number;
  entries: KnowledgeEntry[];
}

// Cloudflare Vectorize metadata structure
interface VectorMetadata {
  workflowId: string;
  sourceId: string;
  focusArea: number;
  entryType: string;
  content: string;
  timestamp: number;
}
```

### Convex Actions for Processing

```typescript
// convex/autorag.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

export const startYouTubeProcessing = action({
  args: {
    workflowId: v.id("ragWorkflows"),
    sources: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Queue processing in Cloudflare
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/process-youtube`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({
        workflowId: args.workflowId,
        sources: args.sources,
        convexUrl: process.env.CONVEX_URL,
      }),
    });
    
    // 2. Update workflow status
    await ctx.runMutation(internal.autorag.updateWorkflowStatus, {
      workflowId: args.workflowId,
      status: "scraping",
      cloudflareWorkerId: await response.json().workerId,
    });
  },
});
```

### Real-time Updates via Convex

```typescript
// convex/subscriptions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const workflowStatus = query({
  args: { workflowId: v.id("ragWorkflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    const entries = await ctx.db
      .query("ragKnowledgeEntries")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    return {
      workflow,
      entriesCount: entries.length,
      latestEntries: entries.slice(-5),
    };
  },
});
```

### Cloudflare Vectorize Integration

```typescript
// cloudflare-worker/src/embeddings.ts
export async function generateAndStoreEmbeddings(
  entries: KnowledgeEntry[],
  metadata: VectorMetadata,
  env: Env
): Promise<string[]> {
  const vectorIds: string[] = [];
  
  for (const entry of entries) {
    // 1. Generate embedding using OpenAI/Cohere
    const embedding = await generateEmbedding(entry.content);
    
    // 2. Store in Cloudflare Vectorize
    const vectorId = crypto.randomUUID();
    await env.VECTORIZE.insert([{
      id: vectorId,
      values: embedding,
      metadata: {
        ...metadata,
        entryType: entry.type,
        content: entry.content,
        notes: entry.notes,
      },
    }]);
    
    vectorIds.push(vectorId);
  }
  
  // 3. Update Convex with vector IDs
  await updateConvexVectorIds(metadata.workflowId, vectorIds, env);
  
  return vectorIds;
}
```

## Processing Pipeline

### 1. YouTube Processing Flow
```
User Input → Convex Action → Cloudflare Queue → YouTube Transcript API
→ Chunking → Gemini Analysis (9 focus areas) → Structured JSON
→ Embedding Generation → Cloudflare Vectorize → Convex Update
```

### 2. Status Update Flow
```
Cloudflare Worker → Convex HTTP Endpoint → Database Update
→ Subscription Trigger → Real-time Frontend Update
```

### 3. Error Handling Flow
```
Processing Error → Retry with Backoff → Max Retries Reached
→ Update Convex Status → Notify User → Manual Intervention Option
```

## API Endpoints

### Convex HTTP Endpoints
```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Webhook for Cloudflare to update processing status
http.route({
  path: "/webhook/processing-update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { workflowId, status, progress, stats } = await request.json();
    
    await ctx.runMutation(internal.autorag.updateWorkflowProgress, {
      workflowId,
      status,
      progress,
      stats,
    });
    
    return new Response(null, { status: 200 });
  }),
});

export default http;
```

## Security Considerations

1. **API Key Management**
   - Store Gemini API key in Cloudflare secrets
   - Use Convex environment variables for sensitive data
   - Implement key rotation strategy

2. **Rate Limiting**
   - Cloudflare Worker rate limits per IP
   - Convex action rate limiting per user
   - Gemini API quota management

3. **Data Validation**
   - Validate YouTube URLs before processing
   - Sanitize extracted content
   - Verify embedding dimensions

## Performance Optimizations

1. **Batch Processing**
   - Process multiple videos in parallel (max 5)
   - Batch embedding generation (50 entries at once)
   - Bulk Convex mutations

2. **Caching Strategy**
   - Cache YouTube metadata in Cloudflare KV
   - Store processed transcripts temporarily
   - Reuse embeddings for duplicate content

3. **Queue Management**
   - Priority queues for smaller workflows
   - Dead letter queue for failed items
   - Automatic retry with exponential backoff

## Monitoring & Observability

1. **Cloudflare Analytics**
   - Worker execution time
   - Queue depth metrics
   - Error rates by type

2. **Convex Logs**
   - Action execution traces
   - Database query performance
   - Subscription update frequency

3. **User-Facing Metrics**
   - Processing speed (videos/minute)
   - Embedding quality scores
   - Storage utilization

## Migration Path

1. **Phase 1**: Set up Convex schema and basic CRUD operations
2. **Phase 2**: Deploy Cloudflare Worker with YouTube processing
3. **Phase 3**: Implement embedding generation and storage
4. **Phase 4**: Add real-time status updates
5. **Phase 5**: Performance optimization and monitoring

This architecture ensures scalability, real-time updates, and proper integration between Convex and Cloudflare services.