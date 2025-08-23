# CreateRAGWorkflowModal - Convex Queries Documentation

## Overview
Queries needed for the CreateRAGWorkflowModal to validate inputs and check for existing workflows.

## Query Definitions

### 1. Check Workflow Name Availability
```typescript
// convex/ragWorkflows/queries.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkWorkflowNameExists = query({
  args: { 
    name: v.string(),
    userId: v.string() 
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    return {
      exists: !!existing,
      workflowId: existing?._id
    };
  },
});
```

### 2. Get User's Workflow Quota
```typescript
export const getUserWorkflowQuota = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const activeWorkflows = workflows.filter(
      w => w.status !== 'completed' && w.status !== 'failed'
    );
    
    return {
      total: workflows.length,
      active: activeWorkflows.length,
      completed: workflows.filter(w => w.status === 'completed').length,
      failed: workflows.filter(w => w.status === 'failed').length,
      quotaLimit: 10, // Could come from user subscription
      activeLimit: 3, // Max concurrent workflows
      canCreateNew: activeWorkflows.length < 3
    };
  },
});
```

### 3. Get Available Vector Stores
```typescript
export const getAvailableVectorStores = query({
  args: { 
    userId: v.string(),
    tier: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    // Base vector stores available to all
    const baseStores = [
      {
        id: 'pinecone',
        name: 'Pinecone',
        description: 'High-performance vector database',
        features: ['Real-time updates', 'Metadata filtering'],
        tier: 'free'
      },
      {
        id: 'chroma',
        name: 'ChromaDB',
        description: 'Open-source embedding database',
        features: ['Local storage', 'Simple API'],
        tier: 'free'
      }
    ];
    
    // Premium vector stores
    const premiumStores = [
      {
        id: 'weaviate',
        name: 'Weaviate',
        description: 'AI-native vector database',
        features: ['GraphQL API', 'Hybrid search'],
        tier: 'premium'
      },
      {
        id: 'qdrant',
        name: 'Qdrant',
        description: 'Neural search engine',
        features: ['Advanced filtering', 'Payload storage'],
        tier: 'premium'
      }
    ];
    
    const userTier = args.tier || 'free';
    return userTier === 'premium' 
      ? [...baseStores, ...premiumStores]
      : baseStores;
  },
});
```

### 4. Get Embedding Models
```typescript
export const getAvailableEmbeddingModels = query({
  args: { 
    userId: v.string(),
    tier: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const models = [
      {
        id: 'text-embedding-ada-002',
        name: 'OpenAI Ada-002',
        dimensions: 1536,
        costPer1kTokens: 0.0001,
        tier: 'free'
      },
      {
        id: 'text-embedding-3-small',
        name: 'OpenAI 3-Small',
        dimensions: 1536,
        costPer1kTokens: 0.00002,
        tier: 'premium'
      },
      {
        id: 'text-embedding-3-large',
        name: 'OpenAI 3-Large',
        dimensions: 3072,
        costPer1kTokens: 0.00013,
        tier: 'premium'
      }
    ];
    
    const userTier = args.tier || 'free';
    return models.filter(m => 
      m.tier === 'free' || userTier === 'premium'
    );
  },
});
```

### 5. Estimate Processing Costs
```typescript
export const estimateProcessingCost = query({
  args: {
    sources: v.array(v.string()),
    urls: v.string(),
    embeddingModel: v.string(),
    chunkSize: v.number()
  },
  handler: async (ctx, args) => {
    // Rough estimates
    const avgTokensPerFile = 5000;
    const avgTokensPerUrl = 2000;
    
    const fileCount = args.sources.length;
    const urlCount = args.urls.split('\n').filter(u => u.trim()).length;
    
    const totalTokens = (fileCount * avgTokensPerFile) + 
                       (urlCount * avgTokensPerUrl);
    
    const chunks = Math.ceil(totalTokens / args.chunkSize);
    
    // Get model cost
    const modelCosts: Record<string, number> = {
      'text-embedding-ada-002': 0.0001,
      'text-embedding-3-small': 0.00002,
      'text-embedding-3-large': 0.00013
    };
    
    const costPer1k = modelCosts[args.embeddingModel] || 0.0001;
    const estimatedCost = (totalTokens / 1000) * costPer1k;
    
    return {
      estimatedTokens: totalTokens,
      estimatedChunks: chunks,
      estimatedCost: estimatedCost.toFixed(4),
      estimatedTime: Math.ceil(chunks / 10) + ' minutes', // 10 chunks/min
      breakdown: {
        files: fileCount,
        urls: urlCount,
        tokensPerChunk: args.chunkSize
      }
    };
  },
});
```

### 6. Validate YouTube URL
```typescript
export const validateYouTubeUrl = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/@[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/
    ];
    
    const isValid = patterns.some(p => p.test(args.url));
    
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid YouTube URL format'
      };
    }
    
    // Extract video/channel ID
    let resourceId = '';
    let resourceType: 'video' | 'channel' = 'video';
    
    if (args.url.includes('@') || args.url.includes('/channel/')) {
      resourceType = 'channel';
      resourceId = args.url.split('/').pop() || '';
    } else if (args.url.includes('watch?v=')) {
      resourceId = args.url.split('v=')[1].split('&')[0];
    } else if (args.url.includes('youtu.be/')) {
      resourceId = args.url.split('/').pop() || '';
    }
    
    return {
      valid: true,
      resourceType,
      resourceId,
      estimatedVideos: resourceType === 'channel' ? 10 : 1
    };
  },
});
```

## Usage in Component

```typescript
// In the CreateRAGWorkflowModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateRAGWorkflowModal() {
  const [formData, setFormData] = useState<RAGWorkflowData>({...});
  
  // Check name availability
  const nameCheck = useQuery(
    api.ragWorkflows.queries.checkWorkflowNameExists,
    formData.name ? { 
      name: formData.name, 
      userId: currentUser.id 
    } : "skip"
  );
  
  // Get user quota
  const quota = useQuery(
    api.ragWorkflows.queries.getUserWorkflowQuota,
    { userId: currentUser.id }
  );
  
  // Get available models and stores
  const vectorStores = useQuery(
    api.ragWorkflows.queries.getAvailableVectorStores,
    { userId: currentUser.id, tier: userTier }
  );
  
  const embeddingModels = useQuery(
    api.ragWorkflows.queries.getAvailableEmbeddingModels,
    { userId: currentUser.id, tier: userTier }
  );
  
  // Estimate costs
  const costEstimate = useQuery(
    api.ragWorkflows.queries.estimateProcessingCost,
    hasContentSources ? {
      sources: formData.sources,
      urls: formData.urls,
      embeddingModel: formData.embeddingModel,
      chunkSize: formData.chunkSize
    } : "skip"
  );
}
```