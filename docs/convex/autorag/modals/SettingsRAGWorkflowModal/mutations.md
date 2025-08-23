# SettingsRAGWorkflowModal - Convex Mutations Documentation

## Overview
Mutations for updating workflow settings, managing sources, handling parameter changes, and restarting workflows with new configurations.

## Mutation Definitions

### 1. Update Workflow Settings
```typescript
// convex/ragWorkflows/mutations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateWorkflowSettings = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    settings: v.object({
      name: v.string(),
      sources: v.array(v.string()),
      chunkSize: v.number(),
      overlap: v.number(),
      embeddingModel: v.string(),
      vectorStore: v.string(),
    }),
    userId: v.string(),
    forceRestart: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Acquire lock
    const lockId = await acquireWorkflowLock(ctx, args.workflowId, args.userId, 'edit');
    
    try {
      const workflow = await ctx.db.get(args.workflowId);
      if (!workflow) {
        throw new Error("Workflow not found");
      }
      
      if (workflow.userId !== args.userId) {
        throw new Error("Unauthorized to edit this workflow");
      }
      
      // Validate changes
      const validation = await ctx.runQuery(
        api.ragWorkflows.queries.validateSettingsChanges,
        { workflowId: args.workflowId, newSettings: args.settings }
      );
      
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Record changes before updating
      const changes = compareSettings(workflow, args.settings);
      
      // Record settings history
      await ctx.db.insert("ragWorkflowSettingsHistory", {
        workflowId: args.workflowId,
        changedBy: args.userId,
        changedAt: new Date().toISOString(),
        changes: changes.map(c => ({
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
          requiresRestart: c.requiresRestart,
        })),
        previousStatus: workflow.status,
        newStatus: validation.requiresRestart ? 'queued' : workflow.status,
        restartRequired: validation.requiresRestart,
        restartInitiated: args.forceRestart || false,
      });
      
      // Update workflow
      const updates: any = {
        name: args.settings.name,
        parameters: {
          sources: args.settings.sources,
          chunkSize: args.settings.chunkSize,
          overlap: args.settings.overlap,
          embeddingModel: args.settings.embeddingModel,
          vectorStore: args.settings.vectorStore,
        },
      };
      
      // Handle restart if required
      if (validation.requiresRestart && (args.forceRestart || workflow.status === 'queued')) {
        updates.status = 'queued';
        updates.progress = 0;
        updates.stats = {
          totalContent: args.settings.sources.length,
          contentProcessed: 0,
          embeddings: 0,
          indexSize: '0 MB',
        };
        
        // Clear existing processing data
        await clearWorkflowData(ctx, args.workflowId);
      }
      
      await ctx.db.patch(args.workflowId, updates);
      
      // Log event
      await ctx.db.insert("ragWorkflowEvents", {
        workflowId: args.workflowId,
        eventType: "settings_updated",
        timestamp: new Date().toISOString(),
        description: `Settings updated: ${changes.map(c => c.field).join(', ')}`,
        metadata: {
          changes: changes.length,
          restartRequired: validation.requiresRestart,
          restarted: args.forceRestart,
        },
        userId: args.userId,
      });
      
      // Start processing if restarted
      if (validation.requiresRestart && args.forceRestart) {
        await ctx.scheduler.runAfter(0, api.ragWorkflows.jobs.processWorkflow, {
          workflowId: args.workflowId,
        });
      }
      
      return {
        success: true,
        changes: changes.length,
        restarted: validation.requiresRestart && args.forceRestart,
        warnings: validation.warnings,
      };
    } finally {
      // Release lock
      await releaseWorkflowLock(ctx, lockId);
    }
  },
});

// Helper functions
async function acquireWorkflowLock(ctx: any, workflowId: string, userId: string, lockType: string) {
  // Check for existing lock
  const existingLock = await ctx.db
    .query("ragWorkflowLocks")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflowId))
    .filter((q: any) => q.gt(q.field("expiresAt"), new Date().toISOString()))
    .first();
  
  if (existingLock && existingLock.lockedBy !== userId) {
    throw new Error("Workflow is currently being edited by another user");
  }
  
  // Create or update lock
  const lockId = await ctx.db.insert("ragWorkflowLocks", {
    workflowId,
    lockedBy: userId,
    lockedAt: new Date().toISOString(),
    lockType,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minute lock
  });
  
  return lockId;
}

async function releaseWorkflowLock(ctx: any, lockId: string) {
  try {
    await ctx.db.delete(lockId);
  } catch (error) {
    // Lock may have already expired
    console.error('Failed to release lock:', error);
  }
}

function compareSettings(workflow: any, newSettings: any) {
  const changes = [];
  
  if (workflow.name !== newSettings.name) {
    changes.push({
      field: 'name',
      oldValue: workflow.name,
      newValue: newSettings.name,
      requiresRestart: false,
    });
  }
  
  // Compare arrays properly
  const sourcesChanged = 
    workflow.parameters.sources.length !== newSettings.sources.length ||
    workflow.parameters.sources.some((s: string, i: number) => s !== newSettings.sources[i]);
  
  if (sourcesChanged) {
    changes.push({
      field: 'sources',
      oldValue: workflow.parameters.sources,
      newValue: newSettings.sources,
      requiresRestart: true,
    });
  }
  
  // Compare other parameters
  const params = ['chunkSize', 'overlap', 'embeddingModel', 'vectorStore'];
  for (const param of params) {
    if (workflow.parameters[param] !== newSettings[param]) {
      changes.push({
        field: param,
        oldValue: workflow.parameters[param],
        newValue: newSettings[param],
        requiresRestart: true,
      });
    }
  }
  
  return changes;
}

async function clearWorkflowData(ctx: any, workflowId: string) {
  // Delete embeddings
  const embeddings = await ctx.db
    .query("ragEmbeddings")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const embedding of embeddings) {
    await ctx.db.delete(embedding._id);
  }
  
  // Delete source details
  const sources = await ctx.db
    .query("ragSourceDetails")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const source of sources) {
    await ctx.db.delete(source._id);
  }
  
  // Delete processing steps
  const steps = await ctx.db
    .query("ragWorkflowSteps")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const step of steps) {
    await ctx.db.delete(step._id);
  }
}
```

### 2. Add Sources to Workflow
```typescript
export const addSourcesToWorkflow = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    sources: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    // Validate new sources
    const validSources = [];
    const invalidSources = [];
    
    for (const source of args.sources) {
      const validation = await validateSource(source);
      if (validation.valid) {
        validSources.push(source);
      } else {
        invalidSources.push({ source, error: validation.error });
      }
    }
    
    if (invalidSources.length > 0) {
      throw new Error(
        `Invalid sources: ${invalidSources.map(s => `${s.source} (${s.error})`).join(', ')}`
      );
    }
    
    // Check for duplicates
    const currentSources = workflow.parameters.sources;
    const newUniqueSources = validSources.filter(s => !currentSources.includes(s));
    
    if (newUniqueSources.length === 0) {
      return {
        added: 0,
        message: "All sources already exist in the workflow",
      };
    }
    
    // Update workflow
    const updatedSources = [...currentSources, ...newUniqueSources];
    
    await ctx.db.patch(args.workflowId, {
      parameters: {
        ...workflow.parameters,
        sources: updatedSources,
      },
      stats: {
        ...workflow.stats,
        totalContent: updatedSources.length,
      },
    });
    
    // Create source detail records
    for (const source of newUniqueSources) {
      await ctx.db.insert("ragSourceDetails", {
        workflowId: args.workflowId,
        source,
        sourceType: getSourceType(source),
        status: "pending",
        metadata: {},
        stats: {
          tokens: 0,
          chunks: 0,
          embeddings: 0,
        },
      });
    }
    
    // Log event
    await ctx.db.insert("ragWorkflowEvents", {
      workflowId: args.workflowId,
      eventType: "sources_added",
      timestamp: new Date().toISOString(),
      description: `Added ${newUniqueSources.length} new source(s)`,
      metadata: { sources: newUniqueSources },
      userId: args.userId,
    });
    
    return {
      added: newUniqueSources.length,
      total: updatedSources.length,
      message: `Successfully added ${newUniqueSources.length} source(s)`,
    };
  },
});

function getSourceType(source: string): 'youtube' | 'document' | 'url' {
  if (source.includes('youtube.com') || source.includes('youtu.be')) {
    return 'youtube';
  }
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return 'url';
  }
  return 'document';
}
```

### 3. Remove Sources from Workflow
```typescript
export const removeSourcesFromWorkflow = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    sources: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    // Filter out sources to remove
    const currentSources = workflow.parameters.sources;
    const remainingSources = currentSources.filter(s => !args.sources.includes(s));
    
    if (remainingSources.length === currentSources.length) {
      return {
        removed: 0,
        message: "No matching sources found to remove",
      };
    }
    
    if (remainingSources.length === 0) {
      throw new Error("Cannot remove all sources. At least one source is required.");
    }
    
    // Update workflow
    await ctx.db.patch(args.workflowId, {
      parameters: {
        ...workflow.parameters,
        sources: remainingSources,
      },
      stats: {
        ...workflow.stats,
        totalContent: remainingSources.length,
      },
    });
    
    // Delete associated data
    const sourceDetails = await ctx.db
      .query("ragSourceDetails")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.or(...args.sources.map(s => q.eq(q.field("source"), s))))
      .collect();
    
    for (const detail of sourceDetails) {
      // Delete embeddings for this source
      const embeddings = await ctx.db
        .query("ragEmbeddings")
        .withIndex("by_source", (q) => 
          q.eq("workflowId", args.workflowId).eq("source", detail.source)
        )
        .collect();
      
      for (const embedding of embeddings) {
        await ctx.db.delete(embedding._id);
      }
      
      // Delete source detail
      await ctx.db.delete(detail._id);
    }
    
    // Log event
    const removedCount = currentSources.length - remainingSources.length;
    await ctx.db.insert("ragWorkflowEvents", {
      workflowId: args.workflowId,
      eventType: "sources_removed",
      timestamp: new Date().toISOString(),
      description: `Removed ${removedCount} source(s)`,
      metadata: { 
        sources: args.sources,
        embeddingsDeleted: sourceDetails.reduce((sum, d) => sum + d.stats.embeddings, 0),
      },
      userId: args.userId,
    });
    
    return {
      removed: removedCount,
      remaining: remainingSources.length,
      message: `Successfully removed ${removedCount} source(s)`,
    };
  },
});
```

### 4. Restart Workflow with New Settings
```typescript
export const restartWorkflow = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    userId: v.string(),
    preserveProgress: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    const wasActive = ['scraping', 'embedding', 'indexing', 'validating'].includes(workflow.status);
    const previousProgress = workflow.progress;
    const previousStats = { ...workflow.stats };
    
    if (!args.preserveProgress) {
      // Full restart - clear all data
      await clearWorkflowData(ctx, args.workflowId);
      
      // Reset workflow
      await ctx.db.patch(args.workflowId, {
        status: 'queued',
        progress: 0,
        stats: {
          totalContent: workflow.parameters.sources.length,
          contentProcessed: 0,
          embeddings: 0,
          indexSize: '0 MB',
        },
        estimatedTime: '15-30 min',
      });
      
      // Reset all source details
      const sources = await ctx.db
        .query("ragSourceDetails")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .collect();
      
      for (const source of sources) {
        await ctx.db.patch(source._id, {
          status: 'pending',
          stats: { tokens: 0, chunks: 0, embeddings: 0 },
          processedAt: undefined,
          error: undefined,
        });
      }
    } else {
      // Soft restart - preserve completed work
      await ctx.db.patch(args.workflowId, {
        status: 'scraping',
        estimatedTime: calculateRemainingTime(workflow),
      });
    }
    
    // Log restart event
    await ctx.db.insert("ragWorkflowEvents", {
      workflowId: args.workflowId,
      eventType: "restarted",
      timestamp: new Date().toISOString(),
      description: args.preserveProgress 
        ? `Resumed workflow from ${previousProgress}%`
        : 'Workflow restarted from beginning',
      metadata: {
        wasActive,
        previousProgress,
        previousStats,
        preservedProgress: args.preserveProgress || false,
      },
      userId: args.userId,
    });
    
    // Schedule processing
    await ctx.scheduler.runAfter(0, api.ragWorkflows.jobs.processWorkflow, {
      workflowId: args.workflowId,
      resumeFrom: args.preserveProgress ? workflow.status : undefined,
    });
    
    return {
      success: true,
      message: args.preserveProgress 
        ? `Workflow resumed from ${previousProgress}%`
        : 'Workflow restarted successfully',
      wasActive,
    };
  },
});

function calculateRemainingTime(workflow: any): string {
  const remaining = 100 - workflow.progress;
  const estimatedMinutes = Math.ceil(remaining / 2); // 2% per minute estimate
  
  if (estimatedMinutes < 60) {
    return `${estimatedMinutes} min remaining`;
  } else {
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return `${hours}h ${minutes}m remaining`;
  }
}
```

### 5. Preview Settings Changes
```typescript
export const previewSettingsChanges = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    settings: v.object({
      chunkSize: v.number(),
      overlap: v.number(),
    }),
    sampleSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // Get a sample source
    const source = args.sampleSource || workflow.parameters.sources[0];
    if (!source) {
      throw new Error("No sources available for preview");
    }
    
    // Get source content (simplified for example)
    const sourceDetail = await ctx.db
      .query("ragSourceDetails")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.eq(q.field("source"), source))
      .first();
    
    if (!sourceDetail || !sourceDetail.metadata.content) {
      return {
        error: "Source content not available for preview",
      };
    }
    
    // Simulate chunking with new settings
    const content = sourceDetail.metadata.content;
    const words = content.split(' ');
    const wordsPerToken = 0.75; // Rough estimate
    
    const currentChunks = calculateChunks(
      words,
      workflow.parameters.chunkSize,
      workflow.parameters.overlap,
      wordsPerToken
    );
    
    const newChunks = calculateChunks(
      words,
      args.settings.chunkSize,
      args.settings.overlap,
      wordsPerToken
    );
    
    return {
      source,
      preview: {
        current: {
          chunkSize: workflow.parameters.chunkSize,
          overlap: workflow.parameters.overlap,
          chunkCount: currentChunks.length,
          samples: currentChunks.slice(0, 3).map(c => ({
            text: c.text.substring(0, 100) + '...',
            tokens: c.tokens,
          })),
        },
        new: {
          chunkSize: args.settings.chunkSize,
          overlap: args.settings.overlap,
          chunkCount: newChunks.length,
          samples: newChunks.slice(0, 3).map(c => ({
            text: c.text.substring(0, 100) + '...',
            tokens: c.tokens,
          })),
        },
        difference: {
          chunkCount: newChunks.length - currentChunks.length,
          percentage: ((newChunks.length - currentChunks.length) / currentChunks.length * 100).toFixed(1),
        },
      },
    };
  },
});

function calculateChunks(words: string[], chunkSize: number, overlap: number, wordsPerToken: number) {
  const chunks = [];
  const chunkSizeWords = Math.floor(chunkSize * wordsPerToken);
  const overlapWords = Math.floor(overlap * wordsPerToken);
  const step = chunkSizeWords - overlapWords;
  
  for (let i = 0; i < words.length; i += step) {
    const chunkWords = words.slice(i, i + chunkSizeWords);
    chunks.push({
      text: chunkWords.join(' '),
      tokens: Math.ceil(chunkWords.length / wordsPerToken),
      index: chunks.length,
    });
    
    if (i + chunkSizeWords >= words.length) break;
  }
  
  return chunks;
}
```

## Error Handling

```typescript
// Settings-specific errors
export class WorkflowActiveError extends Error {
  constructor(status: string) {
    super(`Cannot modify settings while workflow is ${status}. Please stop the workflow first.`);
    this.name = "WorkflowActiveError";
  }
}

export class InvalidParameterError extends Error {
  constructor(parameter: string, value: any, constraint: string) {
    super(`Invalid ${parameter}: ${value}. ${constraint}`);
    this.name = "InvalidParameterError";
  }
}

export class SourceValidationError extends Error {
  constructor(sources: string[]) {
    super(`Invalid sources: ${sources.join(', ')}`);
    this.name = "SourceValidationError";
  }
}
```

## Usage in Component

```typescript
// In the SettingsRAGWorkflowModal component
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function SettingsRAGWorkflowModal({ workflow, onSave }) {
  const updateSettings = useMutation(api.ragWorkflows.mutations.updateWorkflowSettings);
  const addSources = useMutation(api.ragWorkflows.mutations.addSourcesToWorkflow);
  const removeSources = useMutation(api.ragWorkflows.mutations.removeSourcesFromWorkflow);
  const restartWorkflow = useMutation(api.ragWorkflows.mutations.restartWorkflow);
  const previewChanges = useMutation(api.ragWorkflows.mutations.previewSettingsChanges);
  
  const handleSave = async () => {
    try {
      const result = await updateSettings({
        workflowId: workflow.id,
        settings: formData,
        userId: currentUser.id,
        forceRestart: showRestartWarning && userConfirmedRestart,
      });
      
      if (result.warnings.length > 0) {
        toast.warning(result.warnings.join('\n'));
      }
      
      toast.success(
        result.restarted 
          ? 'Settings saved and workflow restarted'
          : 'Settings saved successfully'
      );
      
      onSave(formData);
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleAddSource = async () => {
    if (!sourceInput.trim()) return;
    
    try {
      const result = await addSources({
        workflowId: workflow.id,
        sources: [sourceInput.trim()],
        userId: currentUser.id,
      });
      
      toast.success(result.message);
      setSourceInput('');
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        sources: [...prev.sources, sourceInput.trim()]
      }));
    } catch (error) {
      toast.error(error.message);
    }
  };
}
```