# ViewRAGWorkflowModal - Convex Schema Documentation

## Overview
This modal displays comprehensive details about a RAG workflow including its status, progress, configuration, sources, statistics, and timeline. It's a read-only view with export and usage actions.

## Data Types

### RAGWorkflow (Display)
```typescript
interface RAGWorkflow {
  id: string;
  name: string;
  status: 'queued' | 'scraping' | 'embedding' | 'indexing' | 'validating' | 'completed' | 'failed';
  progress: number; // 0-100
  type: 'youtube' | 'documents' | 'urls' | 'mixed';
  parameters: {
    sources: string[];
    chunkSize: number;
    overlap: number;
    embeddingModel: string;
    vectorStore: string;
  };
  stats: {
    totalContent: number;
    contentProcessed: number;
    embeddings: number;
    indexSize: string;
    processingTime?: string;
  };
  createdAt: string;
  completedAt?: string;
  estimatedTime?: string;
}
```

### Processing Steps
```typescript
interface ProcessingStep {
  name: string;
  status: boolean;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}
```

### Export Formats
```typescript
type ExportFormat = 'json' | 'vectors';

interface ExportData {
  format: ExportFormat;
  workflow: RAGWorkflow;
  embeddings?: number;
  timestamp: string;
}
```

## Extended Convex Schema

```typescript
// Additional tables for detailed workflow tracking

// Processing steps tracking
export const ragWorkflowSteps = defineTable({
  workflowId: v.id("ragWorkflows"),
  stepName: v.union(
    v.literal("scrape"),
    v.literal("embed"),
    v.literal("index"),
    v.literal("validate"),
    v.literal("complete")
  ),
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("failed")
  ),
  progress: v.number(), // 0-100 for the step
  startedAt: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  error: v.optional(v.string()),
  metadata: v.optional(v.any()), // Step-specific data
})
.index("by_workflow", ["workflowId"])
.index("by_status", ["status"]);

// Source processing details
export const ragSourceDetails = defineTable({
  workflowId: v.id("ragWorkflows"),
  source: v.string(),
  sourceType: v.union(
    v.literal("youtube"),
    v.literal("document"),
    v.literal("url")
  ),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  metadata: v.object({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    contentLength: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
  }),
  stats: v.object({
    tokens: v.number(),
    chunks: v.number(),
    embeddings: v.number(),
  }),
  processedAt: v.optional(v.string()),
  error: v.optional(v.string()),
})
.index("by_workflow", ["workflowId"])
.index("by_status", ["status"]);

// Workflow events/timeline
export const ragWorkflowEvents = defineTable({
  workflowId: v.id("ragWorkflows"),
  eventType: v.union(
    v.literal("created"),
    v.literal("started"),
    v.literal("step_completed"),
    v.literal("source_processed"),
    v.literal("error"),
    v.literal("completed"),
    v.literal("exported"),
    v.literal("used_in_agent")
  ),
  timestamp: v.string(),
  description: v.string(),
  metadata: v.optional(v.any()),
  userId: v.optional(v.string()),
})
.index("by_workflow", ["workflowId"])
.index("by_timestamp", ["timestamp"]);

// Export records
export const ragWorkflowExports = defineTable({
  workflowId: v.id("ragWorkflows"),
  format: v.union(v.literal("json"), v.literal("vectors")),
  exportedAt: v.string(),
  exportedBy: v.string(),
  downloadUrl: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  metadata: v.object({
    fileSize: v.optional(v.string()),
    recordCount: v.optional(v.number()),
    compressionType: v.optional(v.string()),
  }),
})
.index("by_workflow", ["workflowId"])
.index("by_user", ["exportedBy"]);
```

## View Configuration

```typescript
// Constants for view display
export const WORKFLOW_STATUS_CONFIG = {
  queued: {
    label: 'Queued',
    color: 'gray',
    icon: 'UilClock',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-400'
  },
  scraping: {
    label: 'Scraping Content',
    color: 'purple',
    icon: 'UilLink',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-400',
    animated: true
  },
  embedding: {
    label: 'Generating Embeddings',
    color: 'green',
    icon: 'UilBrain',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-400',
    animated: true
  },
  indexing: {
    label: 'Building Index',
    color: 'orange',
    icon: 'UilDatabase',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-400',
    animated: true
  },
  validating: {
    label: 'Validating',
    color: 'pink',
    icon: 'UilCheckCircle',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-400',
    animated: true
  },
  completed: {
    label: 'Completed',
    color: 'green',
    icon: 'UilCheckCircle',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-400'
  },
  failed: {
    label: 'Failed',
    color: 'red',
    icon: 'UilExclamationTriangle',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-400'
  }
};

export const PROCESSING_STEPS = [
  { 
    id: 'scrape',
    name: 'Scrape Content', 
    progressRange: [0, 20],
    description: 'Extracting content from sources'
  },
  { 
    id: 'embed',
    name: 'Generate Embeddings', 
    progressRange: [20, 50],
    description: 'Converting text to vector embeddings'
  },
  { 
    id: 'index',
    name: 'Build Index', 
    progressRange: [50, 80],
    description: 'Storing embeddings in vector database'
  },
  { 
    id: 'validate',
    name: 'Validate', 
    progressRange: [80, 95],
    description: 'Verifying index integrity'
  },
  { 
    id: 'complete',
    name: 'Complete', 
    progressRange: [95, 100],
    description: 'Finalizing workflow'
  }
];
```

## Display Calculations

```typescript
// Helper functions for view display
export const calculateStepProgress = (
  workflowProgress: number, 
  step: ProcessingStep
): number => {
  const [min, max] = step.progressRange;
  if (workflowProgress < min) return 0;
  if (workflowProgress >= max) return 100;
  
  const stepRange = max - min;
  const progressInStep = workflowProgress - min;
  return Math.round((progressInStep / stepRange) * 100);
};

export const formatIndexSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const estimateTimeRemaining = (
  progress: number,
  startTime: string,
  avgProcessingRate: number = 1 // % per minute
): string => {
  const elapsed = Date.now() - new Date(startTime).getTime();
  const elapsedMinutes = elapsed / 60000;
  const currentRate = progress / elapsedMinutes;
  const remainingProgress = 100 - progress;
  const estimatedMinutes = remainingProgress / currentRate;
  
  if (estimatedMinutes < 1) return 'Less than 1 minute';
  if (estimatedMinutes < 60) return `${Math.ceil(estimatedMinutes)} minutes`;
  
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = Math.ceil(estimatedMinutes % 60);
  return `${hours}h ${minutes}m`;
};
```