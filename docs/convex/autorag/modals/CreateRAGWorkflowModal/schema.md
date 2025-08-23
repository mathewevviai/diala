# CreateRAGWorkflowModal - Convex Schema Documentation

## Overview
This modal handles the creation of new RAG workflows through a 4-step wizard interface. It collects workflow configuration, content sources, processing parameters, and initiates the RAG pipeline.

## Data Types

### RAGWorkflowData (Input)
```typescript
interface RAGWorkflowData {
  name: string;              // Workflow name
  sources: string[];         // Array of file names/paths
  youtubeUrl: string;        // YouTube URL (premium feature)
  urls: string;              // Newline-separated URLs
  embeddingModel: string;    // Selected embedding model
  vectorStore: string;       // Selected vector store
  chunkSize: number;         // Token chunk size
  overlap: number;           // Token overlap between chunks
}
```

### File Upload Data
```typescript
interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
```

## Convex Schema Definition

```typescript
// In convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const ragWorkflows = defineTable({
  // Core fields
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
  progress: v.number(), // 0-100
  
  // Type determination
  type: v.union(
    v.literal("youtube"),
    v.literal("documents"),
    v.literal("urls"),
    v.literal("mixed")
  ),
  
  // Processing parameters
  parameters: v.object({
    sources: v.array(v.string()),
    chunkSize: v.number(),
    overlap: v.number(),
    embeddingModel: v.string(),
    vectorStore: v.string(),
  }),
  
  // Statistics
  stats: v.object({
    totalContent: v.number(),
    contentProcessed: v.number(),
    embeddings: v.number(),
    indexSize: v.string(), // e.g., "124 MB"
    processingTime: v.optional(v.string()), // e.g., "15 min"
  }),
  
  // Timestamps
  createdAt: v.string(), // ISO date string
  completedAt: v.optional(v.string()),
  estimatedTime: v.optional(v.string()),
  
  // User association
  userId: v.string(),
  organizationId: v.optional(v.string()),
})
.index("by_user", ["userId"])
.index("by_status", ["status"])
.index("by_created", ["createdAt"]);

// File uploads table
export const ragUploads = defineTable({
  workflowId: v.id("ragWorkflows"),
  fileName: v.string(),
  fileSize: v.number(),
  fileType: v.string(),
  storageId: v.string(), // Convex storage reference
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  uploadedAt: v.string(),
})
.index("by_workflow", ["workflowId"])
.index("by_status", ["status"]);
```

## Default Values

```typescript
const DEFAULT_WORKFLOW_CONFIG = {
  name: '',
  sources: [],
  youtubeUrl: '',
  urls: '',
  embeddingModel: 'text-embedding-ada-002',
  vectorStore: 'pinecone',
  chunkSize: 512,
  overlap: 50
};

const EMBEDDING_MODELS = [
  { value: 'text-embedding-ada-002', label: 'OpenAI Ada-002' },
  { value: 'text-embedding-3-small', label: 'OpenAI 3-Small' },
  { value: 'text-embedding-3-large', label: 'OpenAI 3-Large' }
];

const VECTOR_STORES = [
  { value: 'pinecone', label: 'Pinecone' },
  { value: 'chroma', label: 'ChromaDB' },
  { value: 'weaviate', label: 'Weaviate' },
  { value: 'qdrant', label: 'Qdrant' }
];
```

## Validation Rules

```typescript
const VALIDATION_RULES = {
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_]+$/
  },
  chunkSize: {
    min: 128,
    max: 1024,
    step: 64
  },
  overlap: {
    min: 0,
    max: 100,
    step: 5
  },
  fileUpload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['.pdf', '.docx', '.txt', '.csv', '.json']
  }
};
```

## State Management

```typescript
interface CreateRAGWorkflowState {
  currentStep: 1 | 2 | 3 | 4;
  formData: RAGWorkflowData;
  uploadedFiles: File[];
  isSubmitting: boolean;
  error: string | null;
}
```