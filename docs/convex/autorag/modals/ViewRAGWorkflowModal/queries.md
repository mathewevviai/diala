# ViewRAGWorkflowModal - Convex Queries Documentation

## Overview
Queries for fetching comprehensive workflow details, processing steps, source information, and timeline data for the view modal.

## Query Definitions

### 1. Get Workflow Details
```typescript
// convex/ragWorkflows/queries.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getWorkflowDetails = query({
  args: { 
    workflowId: v.id("ragWorkflows"),
    includeSteps: v.optional(v.boolean()),
    includeSources: v.optional(v.boolean()),
    includeEvents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // Base workflow data
    const result: any = {
      ...workflow,
      id: workflow._id,
    };
    
    // Include processing steps
    if (args.includeSteps) {
      const steps = await ctx.db
        .query("ragWorkflowSteps")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .collect();
      
      result.steps = steps.map(step => ({
        name: step.stepName,
        status: step.status,
        progress: step.progress,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        error: step.error,
      }));
    }
    
    // Include source details
    if (args.includeSources) {
      const sources = await ctx.db
        .query("ragSourceDetails")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .collect();
      
      result.sourceDetails = sources.map(source => ({
        source: source.source,
        type: source.sourceType,
        status: source.status,
        metadata: source.metadata,
        stats: source.stats,
        processedAt: source.processedAt,
        error: source.error,
      }));
    }
    
    // Include events/timeline
    if (args.includeEvents) {
      const events = await ctx.db
        .query("ragWorkflowEvents")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .order("desc")
        .take(50);
      
      result.timeline = events.map(event => ({
        type: event.eventType,
        timestamp: event.timestamp,
        description: event.description,
        metadata: event.metadata,
      }));
    }
    
    return result;
  },
});
```

### 2. Get Processing Statistics
```typescript
export const getWorkflowStatistics = query({
  args: { workflowId: v.id("ragWorkflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // Get detailed source statistics
    const sources = await ctx.db
      .query("ragSourceDetails")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    const stats = {
      overview: {
        totalSources: workflow.parameters.sources.length,
        processedSources: sources.filter(s => s.status === 'completed').length,
        failedSources: sources.filter(s => s.status === 'failed').length,
        totalTokens: sources.reduce((sum, s) => sum + (s.stats?.tokens || 0), 0),
        totalChunks: sources.reduce((sum, s) => sum + (s.stats?.chunks || 0), 0),
        totalEmbeddings: sources.reduce((sum, s) => sum + (s.stats?.embeddings || 0), 0),
      },
      byType: {
        youtube: {
          count: sources.filter(s => s.sourceType === 'youtube').length,
          tokens: sources.filter(s => s.sourceType === 'youtube')
            .reduce((sum, s) => sum + (s.stats?.tokens || 0), 0),
        },
        documents: {
          count: sources.filter(s => s.sourceType === 'document').length,
          tokens: sources.filter(s => s.sourceType === 'document')
            .reduce((sum, s) => sum + (s.stats?.tokens || 0), 0),
        },
        urls: {
          count: sources.filter(s => s.sourceType === 'url').length,
          tokens: sources.filter(s => s.sourceType === 'url')
            .reduce((sum, s) => sum + (s.stats?.tokens || 0), 0),
        },
      },
      performance: {
        avgTokensPerSource: Math.round(
          sources.reduce((sum, s) => sum + (s.stats?.tokens || 0), 0) / sources.length
        ),
        avgChunksPerSource: Math.round(
          sources.reduce((sum, s) => sum + (s.stats?.chunks || 0), 0) / sources.length
        ),
        processingRate: workflow.stats.processingTime 
          ? `${Math.round(workflow.stats.embeddings / parseInt(workflow.stats.processingTime))} embeddings/min`
          : 'N/A',
      },
      costs: {
        embeddingCost: calculateEmbeddingCost(
          workflow.parameters.embeddingModel,
          sources.reduce((sum, s) => sum + (s.stats?.tokens || 0), 0)
        ),
        storageCost: calculateStorageCost(workflow.stats.indexSize),
      },
    };
    
    return stats;
  },
});

// Helper functions
function calculateEmbeddingCost(model: string, tokens: number): string {
  const costs: Record<string, number> = {
    'text-embedding-ada-002': 0.0001,
    'text-embedding-3-small': 0.00002,
    'text-embedding-3-large': 0.00013,
  };
  
  const costPer1k = costs[model] || 0.0001;
  const totalCost = (tokens / 1000) * costPer1k;
  return `$${totalCost.toFixed(4)}`;
}

function calculateStorageCost(indexSize: string): string {
  // Parse size string (e.g., "124 MB")
  const match = indexSize.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
  if (!match) return '$0.00';
  
  const [, sizeStr, unit] = match;
  const size = parseFloat(sizeStr);
  
  // Convert to GB
  let sizeInGB = size;
  switch (unit.toUpperCase()) {
    case 'MB': sizeInGB = size / 1024; break;
    case 'KB': sizeInGB = size / (1024 * 1024); break;
    case 'TB': sizeInGB = size * 1024; break;
  }
  
  // $0.10 per GB per month
  const monthlyCost = sizeInGB * 0.10;
  return `$${monthlyCost.toFixed(2)}/month`;
}
```

### 3. Get Processing Timeline
```typescript
export const getProcessingTimeline = query({
  args: { 
    workflowId: v.id("ragWorkflows"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    const events = await ctx.db
      .query("ragWorkflowEvents")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("asc")
      .take(limit);
    
    // Group events by type and enhance with calculated data
    const timeline = events.map((event, index) => {
      const previousEvent = index > 0 ? events[index - 1] : null;
      const duration = previousEvent 
        ? new Date(event.timestamp).getTime() - new Date(previousEvent.timestamp).getTime()
        : 0;
      
      return {
        id: event._id,
        type: event.eventType,
        timestamp: event.timestamp,
        description: event.description,
        metadata: event.metadata,
        duration: duration > 0 ? formatDuration(duration) : null,
        icon: getEventIcon(event.eventType),
        color: getEventColor(event.eventType),
      };
    });
    
    // Add summary statistics
    const totalDuration = timeline.length > 1
      ? new Date(timeline[timeline.length - 1].timestamp).getTime() - 
        new Date(timeline[0].timestamp).getTime()
      : 0;
    
    return {
      events: timeline,
      summary: {
        totalEvents: timeline.length,
        totalDuration: formatDuration(totalDuration),
        startTime: timeline[0]?.timestamp,
        endTime: timeline[timeline.length - 1]?.timestamp,
      },
    };
  },
});

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    created: 'UilPlay',
    started: 'UilSync',
    step_completed: 'UilCheckCircle',
    source_processed: 'UilFile',
    error: 'UilExclamationTriangle',
    completed: 'UilCheckCircle',
    exported: 'UilFileExport',
    used_in_agent: 'UilRobot',
  };
  return icons[eventType] || 'UilInfoCircle';
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    created: 'blue',
    started: 'purple',
    step_completed: 'green',
    source_processed: 'cyan',
    error: 'red',
    completed: 'green',
    exported: 'orange',
    used_in_agent: 'pink',
  };
  return colors[eventType] || 'gray';
}
```

### 4. Get Export Options
```typescript
export const getExportOptions = query({
  args: { workflowId: v.id("ragWorkflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.status !== 'completed') {
      return {
        available: false,
        reason: 'Workflow must be completed before exporting',
      };
    }
    
    // Check previous exports
    const previousExports = await ctx.db
      .query("ragWorkflowExports")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .take(5);
    
    // Estimate export sizes
    const jsonSize = estimateJsonExportSize(workflow);
    const vectorSize = estimateVectorExportSize(workflow);
    
    return {
      available: true,
      formats: [
        {
          format: 'json',
          name: 'JSON Export',
          description: 'Complete workflow configuration and metadata',
          estimatedSize: jsonSize,
          includes: [
            'Workflow configuration',
            'Source metadata',
            'Processing statistics',
            'Embedding parameters'
          ],
        },
        {
          format: 'vectors',
          name: 'Vector Export',
          description: 'Raw embeddings for direct integration',
          estimatedSize: vectorSize,
          includes: [
            'Vector embeddings',
            'Chunk text',
            'Source references',
            'Metadata mappings'
          ],
          premium: true,
        },
      ],
      previousExports: previousExports.map(exp => ({
        format: exp.format,
        exportedAt: exp.exportedAt,
        downloadUrl: exp.downloadUrl,
        expiresAt: exp.expiresAt,
        size: exp.metadata.fileSize,
      })),
    };
  },
});

function estimateJsonExportSize(workflow: any): string {
  // Rough estimation based on content
  const baseSize = 1024; // 1KB base
  const perSource = 512; // 512B per source
  const perEmbedding = 20; // 20B per embedding metadata
  
  const totalBytes = baseSize + 
    (workflow.parameters.sources.length * perSource) +
    (workflow.stats.embeddings * perEmbedding);
  
  return formatFileSize(totalBytes);
}

function estimateVectorExportSize(workflow: any): string {
  // Each embedding is ~6KB (1536 dimensions * 4 bytes)
  const embeddingSize = 6 * 1024;
  const totalBytes = workflow.stats.embeddings * embeddingSize;
  
  return formatFileSize(totalBytes);
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
```

### 5. Get Available Agents for Integration
```typescript
export const getAvailableAgentsForRAG = query({
  args: { 
    workflowId: v.id("ragWorkflows"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.status !== 'completed') {
      return { available: false, agents: [] };
    }
    
    // Get user's agents
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Check which agents can use this RAG
    const compatibleAgents = agents.filter(agent => {
      // Check if agent supports RAG
      return agent.capabilities?.includes('rag') || 
             agent.type === 'knowledge_base' ||
             agent.type === 'customer_support';
    });
    
    return {
      available: true,
      agents: compatibleAgents.map(agent => ({
        id: agent._id,
        name: agent.name,
        type: agent.type,
        currentRAG: agent.ragWorkflowId,
        canReplace: !agent.ragWorkflowId || agent.ragWorkflowId !== args.workflowId,
      })),
      recommendation: workflow.type === 'documents' 
        ? 'Best for customer support agents'
        : workflow.type === 'youtube'
        ? 'Ideal for training and onboarding agents'
        : 'Suitable for general knowledge agents',
    };
  },
});
```

## Usage in Component

```typescript
// In the ViewRAGWorkflowModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function ViewRAGWorkflowModal({ workflow }) {
  // Get comprehensive workflow details
  const workflowDetails = useQuery(
    api.ragWorkflows.queries.getWorkflowDetails,
    workflow ? {
      workflowId: workflow.id,
      includeSteps: true,
      includeSources: true,
      includeEvents: true,
    } : "skip"
  );
  
  // Get statistics
  const statistics = useQuery(
    api.ragWorkflows.queries.getWorkflowStatistics,
    workflow ? { workflowId: workflow.id } : "skip"
  );
  
  // Get timeline
  const timeline = useQuery(
    api.ragWorkflows.queries.getProcessingTimeline,
    workflow ? { workflowId: workflow.id, limit: 20 } : "skip"
  );
  
  // Get export options
  const exportOptions = useQuery(
    api.ragWorkflows.queries.getExportOptions,
    workflow ? { workflowId: workflow.id } : "skip"
  );
  
  // Get available agents
  const availableAgents = useQuery(
    api.ragWorkflows.queries.getAvailableAgentsForRAG,
    workflow ? { 
      workflowId: workflow.id, 
      userId: currentUser.id 
    } : "skip"
  );
}
```