# SettingsRAGWorkflowModal - Convex Schema Documentation

## Overview
This modal allows users to edit workflow settings including name, sources, processing parameters, and model configuration. It includes warnings for active workflows and tracks changes.

## Data Types

### Settings Form Data
```typescript
interface WorkflowSettingsData {
  name: string;
  sources: string[];
  chunkSize: number;
  overlap: number;
  embeddingModel: string;
  vectorStore: string;
}

interface SettingsChange {
  field: string;
  oldValue: any;
  newValue: any;
  requiresRestart: boolean;
}
```

### Source Types
```typescript
interface WorkflowSource {
  source: string;
  type: 'youtube' | 'document' | 'url';
  addedAt: string;
  processedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
```

## Extended Convex Schema

```typescript
// Settings change tracking
export const ragWorkflowSettingsHistory = defineTable({
  workflowId: v.id("ragWorkflows"),
  changedBy: v.string(),
  changedAt: v.string(),
  changes: v.array(v.object({
    field: v.string(),
    oldValue: v.any(),
    newValue: v.any(),
    requiresRestart: v.boolean(),
  })),
  previousStatus: v.string(),
  newStatus: v.string(),
  restartRequired: v.boolean(),
  restartInitiated: v.boolean(),
})
.index("by_workflow", ["workflowId"])
.index("by_user", ["changedBy"])
.index("by_timestamp", ["changedAt"]);

// Parameter constraints
export const ragParameterConstraints = defineTable({
  parameterName: v.string(),
  modelType: v.optional(v.string()),
  minValue: v.optional(v.number()),
  maxValue: v.optional(v.number()),
  allowedValues: v.optional(v.array(v.string())),
  defaultValue: v.any(),
  isPremium: v.boolean(),
  description: v.string(),
  validationRules: v.optional(v.array(v.object({
    rule: v.string(),
    message: v.string(),
  }))),
})
.index("by_parameter", ["parameterName"]);

// Workflow locks (prevent concurrent edits)
export const ragWorkflowLocks = defineTable({
  workflowId: v.id("ragWorkflows"),
  lockedBy: v.string(),
  lockedAt: v.string(),
  lockType: v.union(v.literal("edit"), v.literal("process")),
  expiresAt: v.string(),
})
.index("by_workflow", ["workflowId"])
.index("by_user", ["lockedBy"]);
```

## Configuration Constants

```typescript
// Slider configurations
export const CHUNK_SIZE_CONFIG = {
  min: 128,
  max: 1024,
  step: 64,
  default: 512,
  labels: {
    128: 'Small (Precise)',
    256: 'Medium-Small',
    512: 'Medium (Balanced)',
    768: 'Medium-Large',
    1024: 'Large (Context)'
  },
  description: 'Smaller chunks = more precise retrieval, Larger chunks = more context'
};

export const OVERLAP_CONFIG = {
  min: 0,
  max: 100,
  step: 5,
  default: 50,
  labels: {
    0: 'None',
    25: 'Light',
    50: 'Medium',
    75: 'Heavy',
    100: 'Maximum'
  },
  description: 'Overlap between chunks to maintain context continuity'
};

// Model configurations
export const EMBEDDING_MODEL_CONFIG = {
  'text-embedding-ada-002': {
    name: 'OpenAI Ada-002',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1k: 0.0001,
    tier: 'free',
    pros: ['Cost-effective', 'Fast', 'Good general performance'],
    cons: ['Older model', 'Lower quality than newer models']
  },
  'text-embedding-3-small': {
    name: 'OpenAI 3-Small',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1k: 0.00002,
    tier: 'premium',
    pros: ['5x cheaper than Ada', 'Better performance', 'Same dimensions'],
    cons: ['Requires premium']
  },
  'text-embedding-3-large': {
    name: 'OpenAI 3-Large',
    dimensions: 3072,
    maxTokens: 8191,
    costPer1k: 0.00013,
    tier: 'premium',
    pros: ['Best quality', 'Double dimensions', 'State-of-the-art'],
    cons: ['More expensive', 'Larger storage']
  },
  'sentence-transformers': {
    name: 'Sentence Transformers',
    dimensions: 768,
    maxTokens: 512,
    costPer1k: 0,
    tier: 'premium',
    pros: ['Free/self-hosted', 'Privacy', 'Customizable'],
    cons: ['Requires infrastructure', 'Lower quality']
  }
};

// Vector store configurations
export const VECTOR_STORE_CONFIG = {
  'pinecone': {
    name: 'Pinecone',
    description: 'Fully managed vector database',
    features: ['Real-time updates', 'Metadata filtering', 'Hybrid search'],
    tier: 'free',
    limits: { freeVectors: 100000, freeIndexes: 1 }
  },
  'chroma': {
    name: 'ChromaDB',
    description: 'Open-source embedding database',
    features: ['Self-hosted', 'Simple API', 'Local development'],
    tier: 'free',
    limits: { selfHosted: true }
  },
  'weaviate': {
    name: 'Weaviate',
    description: 'AI-native vector database',
    features: ['GraphQL', 'Modules', 'Multi-tenancy'],
    tier: 'premium',
    limits: { cloudOnly: true }
  },
  'qdrant': {
    name: 'Qdrant',
    description: 'Neural search engine',
    features: ['Advanced filtering', 'Payload storage', 'Distributed'],
    tier: 'premium',
    limits: { minNodes: 1 }
  },
  'redis': {
    name: 'Redis Vector',
    description: 'Redis with vector search',
    features: ['Low latency', 'Existing Redis', 'Hybrid data'],
    tier: 'premium',
    limits: { requiresRedisStack: true }
  }
};
```

## Validation Rules

```typescript
// Change impact assessment
export const assessChangeImpact = (
  oldParams: WorkflowParameters,
  newParams: WorkflowParameters,
  workflowStatus: string
): ChangeImpact => {
  const changes: SettingsChange[] = [];
  let requiresRestart = false;
  let dataLoss = false;
  
  // Name change - no impact on processing
  if (oldParams.name !== newParams.name) {
    changes.push({
      field: 'name',
      oldValue: oldParams.name,
      newValue: newParams.name,
      requiresRestart: false
    });
  }
  
  // Source changes - requires full restart
  const sourcesChanged = 
    oldParams.sources.length !== newParams.sources.length ||
    oldParams.sources.some((s, i) => s !== newParams.sources[i]);
    
  if (sourcesChanged) {
    changes.push({
      field: 'sources',
      oldValue: oldParams.sources,
      newValue: newParams.sources,
      requiresRestart: true
    });
    requiresRestart = true;
  }
  
  // Embedding model change - requires complete re-embedding
  if (oldParams.embeddingModel !== newParams.embeddingModel) {
    changes.push({
      field: 'embeddingModel',
      oldValue: oldParams.embeddingModel,
      newValue: newParams.embeddingModel,
      requiresRestart: true
    });
    requiresRestart = true;
    dataLoss = true;
  }
  
  // Vector store change - requires re-indexing
  if (oldParams.vectorStore !== newParams.vectorStore) {
    changes.push({
      field: 'vectorStore',
      oldValue: oldParams.vectorStore,
      newValue: newParams.vectorStore,
      requiresRestart: true
    });
    requiresRestart = true;
    dataLoss = true;
  }
  
  // Chunk size/overlap changes - requires re-chunking
  if (oldParams.chunkSize !== newParams.chunkSize || 
      oldParams.overlap !== newParams.overlap) {
    changes.push({
      field: 'chunkSize',
      oldValue: oldParams.chunkSize,
      newValue: newParams.chunkSize,
      requiresRestart: true
    });
    changes.push({
      field: 'overlap',
      oldValue: oldParams.overlap,
      newValue: newParams.overlap,
      requiresRestart: true
    });
    requiresRestart = true;
  }
  
  const isActive = ['scraping', 'embedding', 'indexing', 'validating'].includes(workflowStatus);
  
  return {
    changes,
    requiresRestart,
    dataLoss,
    estimatedDowntime: requiresRestart ? '15-30 minutes' : '0 minutes',
    warnings: [
      ...(requiresRestart && isActive ? ['Active processing will be stopped'] : []),
      ...(dataLoss ? ['All existing embeddings will be deleted'] : []),
      ...(sourcesChanged ? ['New sources will need to be processed'] : [])
    ]
  };
};

// Source validation
export const validateSource = (source: string): ValidationResult => {
  // URL validation
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      const url = new URL(source);
      // Check for YouTube
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        return {
          valid: true,
          type: 'youtube',
          requiresPremium: true
        };
      }
      return {
        valid: true,
        type: 'url'
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  }
  
  // File validation
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv', '.json', '.md'];
  const extension = source.substring(source.lastIndexOf('.')).toLowerCase();
  
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type: ${extension}`
    };
  }
  
  return {
    valid: true,
    type: 'document'
  };
};
```

## State Management

```typescript
interface SettingsModalState {
  formData: WorkflowSettingsData;
  originalData: WorkflowSettingsData;
  sourceInput: string;
  showRestartWarning: boolean;
  changes: SettingsChange[];
  isValidating: boolean;
  validationErrors: Record<string, string>;
  hasUnsavedChanges: boolean;
}

interface ChangeImpact {
  changes: SettingsChange[];
  requiresRestart: boolean;
  dataLoss: boolean;
  estimatedDowntime: string;
  warnings: string[];
}
```