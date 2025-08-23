# SettingsRAGWorkflowModal - Convex Queries Documentation

## Overview
Queries for validating settings changes, checking constraints, and retrieving configuration options for the settings modal.

## Query Definitions

### 1. Get Workflow Settings
```typescript
// convex/ragWorkflows/queries.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getWorkflowSettings = query({
  args: { 
    workflowId: v.id("ragWorkflows"),
    includeHistory: v.optional(v.boolean()),
    includeLocks: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    const result: any = {
      current: {
        name: workflow.name,
        sources: workflow.parameters.sources,
        chunkSize: workflow.parameters.chunkSize,
        overlap: workflow.parameters.overlap,
        embeddingModel: workflow.parameters.embeddingModel,
        vectorStore: workflow.parameters.vectorStore,
      },
      status: workflow.status,
      progress: workflow.progress,
      stats: workflow.stats,
      isActive: ['scraping', 'embedding', 'indexing', 'validating'].includes(workflow.status),
    };
    
    // Include change history
    if (args.includeHistory) {
      const history = await ctx.db
        .query("ragWorkflowSettingsHistory")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .order("desc")
        .take(10);
      
      result.history = history.map(h => ({
        changedBy: h.changedBy,
        changedAt: h.changedAt,
        changes: h.changes,
        restartRequired: h.restartRequired,
      }));
    }
    
    // Check for locks
    if (args.includeLocks) {
      const lock = await ctx.db
        .query("ragWorkflowLocks")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .filter((q) => q.gt(q.field("expiresAt"), new Date().toISOString()))
        .first();
      
      result.lock = lock ? {
        lockedBy: lock.lockedBy,
        lockType: lock.lockType,
        expiresAt: lock.expiresAt,
      } : null;
    }
    
    return result;
  },
});
```

### 2. Validate Settings Changes
```typescript
export const validateSettingsChanges = query({
  args: {
    workflowId: v.id("ragWorkflows"),
    newSettings: v.object({
      name: v.string(),
      sources: v.array(v.string()),
      chunkSize: v.number(),
      overlap: v.number(),
      embeddingModel: v.string(),
      vectorStore: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      requiresRestart: false,
      dataLoss: false,
      changes: [] as any[],
    };
    
    // Validate name
    if (!args.newSettings.name || args.newSettings.name.length < 3) {
      validation.errors.push("Workflow name must be at least 3 characters");
      validation.valid = false;
    }
    
    // Check for duplicate name
    if (args.newSettings.name !== workflow.name) {
      const duplicate = await ctx.db
        .query("ragWorkflows")
        .withIndex("by_user", (q) => q.eq("userId", workflow.userId))
        .filter((q) => 
          q.and(
            q.eq(q.field("name"), args.newSettings.name),
            q.neq(q.field("_id"), args.workflowId)
          )
        )
        .first();
      
      if (duplicate) {
        validation.errors.push("A workflow with this name already exists");
        validation.valid = false;
      }
    }
    
    // Validate sources
    if (args.newSettings.sources.length === 0) {
      validation.errors.push("At least one source is required");
      validation.valid = false;
    }
    
    // Validate each source
    for (const source of args.newSettings.sources) {
      const sourceValidation = await validateSource(source);
      if (!sourceValidation.valid) {
        validation.errors.push(`Invalid source "${source}": ${sourceValidation.error}`);
        validation.valid = false;
      }
    }
    
    // Check for parameter changes that require restart
    const paramChanges = checkParameterChanges(workflow, args.newSettings);
    validation.changes = paramChanges.changes;
    validation.requiresRestart = paramChanges.requiresRestart;
    validation.dataLoss = paramChanges.dataLoss;
    
    if (validation.requiresRestart && workflow.status !== 'completed' && workflow.status !== 'failed') {
      validation.warnings.push("Changes will require restarting the workflow and losing current progress");
    }
    
    if (validation.dataLoss) {
      validation.warnings.push("Changes will delete all existing embeddings and require complete reprocessing");
    }
    
    // Validate parameter constraints
    const constraints = await getParameterConstraints(ctx);
    
    if (args.newSettings.chunkSize < constraints.chunkSize.min || 
        args.newSettings.chunkSize > constraints.chunkSize.max) {
      validation.errors.push(`Chunk size must be between ${constraints.chunkSize.min} and ${constraints.chunkSize.max}`);
      validation.valid = false;
    }
    
    if (args.newSettings.overlap < constraints.overlap.min || 
        args.newSettings.overlap > constraints.overlap.max) {
      validation.errors.push(`Overlap must be between ${constraints.overlap.min} and ${constraints.overlap.max}`);
      validation.valid = false;
    }
    
    return validation;
  },
});

// Helper functions
async function validateSource(source: string) {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      new URL(source);
      return { valid: true, type: 'url' };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
  
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv', '.json', '.md'];
  const extension = source.substring(source.lastIndexOf('.')).toLowerCase();
  
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: `Unsupported file type: ${extension}` };
  }
  
  return { valid: true, type: 'document' };
}

function checkParameterChanges(workflow: any, newSettings: any) {
  const changes = [];
  let requiresRestart = false;
  let dataLoss = false;
  
  // Check each parameter
  if (workflow.name !== newSettings.name) {
    changes.push({ field: 'name', old: workflow.name, new: newSettings.name });
  }
  
  if (JSON.stringify(workflow.parameters.sources) !== JSON.stringify(newSettings.sources)) {
    changes.push({ field: 'sources', type: 'array' });
    requiresRestart = true;
  }
  
  if (workflow.parameters.embeddingModel !== newSettings.embeddingModel) {
    changes.push({ field: 'embeddingModel', old: workflow.parameters.embeddingModel, new: newSettings.embeddingModel });
    requiresRestart = true;
    dataLoss = true;
  }
  
  if (workflow.parameters.vectorStore !== newSettings.vectorStore) {
    changes.push({ field: 'vectorStore', old: workflow.parameters.vectorStore, new: newSettings.vectorStore });
    requiresRestart = true;
    dataLoss = true;
  }
  
  if (workflow.parameters.chunkSize !== newSettings.chunkSize) {
    changes.push({ field: 'chunkSize', old: workflow.parameters.chunkSize, new: newSettings.chunkSize });
    requiresRestart = true;
  }
  
  if (workflow.parameters.overlap !== newSettings.overlap) {
    changes.push({ field: 'overlap', old: workflow.parameters.overlap, new: newSettings.overlap });
    requiresRestart = true;
  }
  
  return { changes, requiresRestart, dataLoss };
}

async function getParameterConstraints(ctx: any) {
  return {
    chunkSize: { min: 128, max: 1024 },
    overlap: { min: 0, max: 100 },
  };
}
```

### 3. Get Available Configuration Options
```typescript
export const getAvailableConfigurations = query({
  args: { 
    userId: v.string(),
    workflowId: v.optional(v.id("ragWorkflows")),
  },
  handler: async (ctx, args) => {
    // Get user tier
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
    
    const userTier = user?.tier || 'free';
    
    // Get embedding models based on tier
    const embeddingModels = await ctx.db
      .query("ragParameterConstraints")
      .filter((q) => q.eq(q.field("parameterName"), "embeddingModel"))
      .collect();
    
    const availableModels = embeddingModels.filter(m => 
      !m.isPremium || userTier === 'premium'
    );
    
    // Get vector stores based on tier
    const vectorStores = await ctx.db
      .query("ragParameterConstraints")
      .filter((q) => q.eq(q.field("parameterName"), "vectorStore"))
      .collect();
    
    const availableStores = vectorStores.filter(s => 
      !s.isPremium || userTier === 'premium'
    );
    
    // Get current usage if workflow provided
    let currentUsage = null;
    if (args.workflowId) {
      const workflow = await ctx.db.get(args.workflowId);
      if (workflow) {
        currentUsage = {
          embeddings: workflow.stats.embeddings,
          indexSize: workflow.stats.indexSize,
          sources: workflow.parameters.sources.length,
        };
      }
    }
    
    return {
      embeddingModels: availableModels.map(m => ({
        value: m.allowedValues?.[0] || m.defaultValue,
        label: m.description,
        isPremium: m.isPremium,
        metadata: m.metadata,
      })),
      vectorStores: availableStores.map(s => ({
        value: s.allowedValues?.[0] || s.defaultValue,
        label: s.description,
        isPremium: s.isPremium,
        metadata: s.metadata,
      })),
      parameterLimits: {
        chunkSize: { min: 128, max: 1024, step: 64 },
        overlap: { min: 0, max: 100, step: 5 },
        maxSources: userTier === 'premium' ? 1000 : 100,
      },
      currentUsage,
      userTier,
    };
  },
});
```

### 4. Estimate Impact of Changes
```typescript
export const estimateChangeImpact = query({
  args: {
    workflowId: v.id("ragWorkflows"),
    changes: v.object({
      sources: v.optional(v.array(v.string())),
      chunkSize: v.optional(v.number()),
      overlap: v.optional(v.number()),
      embeddingModel: v.optional(v.string()),
      vectorStore: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    const impact = {
      processingTime: '0 minutes',
      additionalCost: '$0.00',
      tokensToProcess: 0,
      embeddingsToGenerate: 0,
      storageImpact: '0 MB',
      actions: [] as string[],
    };
    
    // Calculate source changes impact
    if (args.changes.sources) {
      const currentSources = workflow.parameters.sources;
      const newSources = args.changes.sources;
      
      const addedSources = newSources.filter(s => !currentSources.includes(s));
      const removedSources = currentSources.filter(s => !newSources.includes(s));
      
      if (addedSources.length > 0) {
        impact.actions.push(`Process ${addedSources.length} new source(s)`);
        impact.tokensToProcess += addedSources.length * 5000; // Estimate
      }
      
      if (removedSources.length > 0) {
        impact.actions.push(`Remove embeddings from ${removedSources.length} source(s)`);
      }
    }
    
    // Calculate chunking changes impact
    if (args.changes.chunkSize || args.changes.overlap) {
      const oldChunkSize = workflow.parameters.chunkSize;
      const newChunkSize = args.changes.chunkSize || oldChunkSize;
      const oldOverlap = workflow.parameters.overlap;
      const newOverlap = args.changes.overlap || oldOverlap;
      
      // Estimate new chunk count
      const totalTokens = workflow.stats.embeddings * oldChunkSize; // Rough estimate
      const newChunkCount = Math.ceil(totalTokens / (newChunkSize - newOverlap));
      
      impact.embeddingsToGenerate = newChunkCount;
      impact.actions.push('Re-chunk all content');
      impact.actions.push('Regenerate all embeddings');
    }
    
    // Calculate model change impact
    if (args.changes.embeddingModel) {
      impact.actions.push('Delete all existing embeddings');
      impact.actions.push('Generate new embeddings with new model');
      impact.embeddingsToGenerate = workflow.stats.embeddings;
      
      // Calculate cost difference
      const modelCosts: Record<string, number> = {
        'text-embedding-ada-002': 0.0001,
        'text-embedding-3-small': 0.00002,
        'text-embedding-3-large': 0.00013,
      };
      
      const oldCost = modelCosts[workflow.parameters.embeddingModel] || 0.0001;
      const newCost = modelCosts[args.changes.embeddingModel] || 0.0001;
      const costDiff = (newCost - oldCost) * (impact.tokensToProcess / 1000);
      
      impact.additionalCost = `$${Math.abs(costDiff).toFixed(4)}`;
      if (costDiff < 0) {
        impact.additionalCost += ' (savings)';
      }
    }
    
    // Calculate vector store change impact
    if (args.changes.vectorStore) {
      impact.actions.push('Export embeddings from current store');
      impact.actions.push('Import embeddings to new store');
      impact.actions.push('Rebuild search index');
    }
    
    // Estimate total processing time
    const actionsTime = impact.actions.length * 5; // 5 min per major action
    const embeddingTime = Math.ceil(impact.embeddingsToGenerate / 100); // 100 embeddings/min
    impact.processingTime = `${actionsTime + embeddingTime} minutes`;
    
    // Estimate storage impact
    if (args.changes.embeddingModel === 'text-embedding-3-large') {
      impact.storageImpact = `+${Math.round(workflow.stats.embeddings * 0.012)} MB`; // Larger dimensions
    }
    
    return impact;
  },
});
```

### 5. Get Settings Lock Status
```typescript
export const getSettingsLockStatus = query({
  args: { 
    workflowId: v.id("ragWorkflows"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for existing lock
    const lock = await ctx.db
      .query("ragWorkflowLocks")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.gt(q.field("expiresAt"), new Date().toISOString()))
      .first();
    
    if (!lock) {
      return {
        isLocked: false,
        canEdit: true,
      };
    }
    
    const isOwnLock = lock.lockedBy === args.userId;
    const lockUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), lock.lockedBy))
      .first();
    
    return {
      isLocked: true,
      canEdit: isOwnLock,
      lockedBy: lockUser?.name || 'Unknown user',
      lockType: lock.lockType,
      expiresAt: lock.expiresAt,
      remainingTime: Math.max(0, 
        new Date(lock.expiresAt).getTime() - Date.now()
      ),
    };
  },
});
```

## Usage in Component

```typescript
// In the SettingsRAGWorkflowModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function SettingsRAGWorkflowModal({ workflow }) {
  const [formData, setFormData] = useState<WorkflowSettingsData>({...});
  
  // Get current settings and history
  const settings = useQuery(
    api.ragWorkflows.queries.getWorkflowSettings,
    workflow ? {
      workflowId: workflow.id,
      includeHistory: true,
      includeLocks: true,
    } : "skip"
  );
  
  // Get available configurations
  const configurations = useQuery(
    api.ragWorkflows.queries.getAvailableConfigurations,
    { userId: currentUser.id, workflowId: workflow?.id }
  );
  
  // Validate changes in real-time
  const validation = useQuery(
    api.ragWorkflows.queries.validateSettingsChanges,
    hasChanges ? {
      workflowId: workflow.id,
      newSettings: formData,
    } : "skip"
  );
  
  // Estimate impact of changes
  const changeImpact = useQuery(
    api.ragWorkflows.queries.estimateChangeImpact,
    hasChanges ? {
      workflowId: workflow.id,
      changes: getChangedFields(settings?.current, formData),
    } : "skip"
  );
  
  // Check lock status
  const lockStatus = useQuery(
    api.ragWorkflows.queries.getSettingsLockStatus,
    workflow ? {
      workflowId: workflow.id,
      userId: currentUser.id,
    } : "skip"
  );
}
```