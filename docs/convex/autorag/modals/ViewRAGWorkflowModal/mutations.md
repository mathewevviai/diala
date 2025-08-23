# ViewRAGWorkflowModal - Convex Mutations Documentation

## Overview
Mutations for exporting workflow data and integrating workflows with agents. The view modal is primarily read-only but includes export and usage actions.

## Mutation Definitions

### 1. Export Workflow Data
```typescript
// convex/ragWorkflows/mutations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const exportWorkflow = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    format: v.union(v.literal("json"), v.literal("vectors")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.userId !== args.userId) {
      throw new Error("Unauthorized access to workflow");
    }
    
    if (workflow.status !== 'completed') {
      throw new Error("Can only export completed workflows");
    }
    
    // Check user permissions for vector export
    if (args.format === 'vectors') {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("id"), args.userId))
        .first();
      
      if (!user?.isPremium) {
        throw new Error("Vector export is a premium feature");
      }
    }
    
    // Generate export data
    let exportData: any;
    let fileSize: string;
    
    if (args.format === 'json') {
      exportData = await generateJsonExport(ctx, workflow);
      fileSize = calculateJsonSize(exportData);
    } else {
      exportData = await generateVectorExport(ctx, workflow);
      fileSize = calculateVectorSize(exportData);
    }
    
    // Store export data temporarily
    const blob = new Blob([JSON.stringify(exportData)]);
    const storageId = await ctx.storage.store(blob);
    
    // Generate download URL (expires in 24 hours)
    const downloadUrl = await ctx.storage.getUrl(storageId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Record export
    const exportId = await ctx.db.insert("ragWorkflowExports", {
      workflowId: args.workflowId,
      format: args.format,
      exportedAt: new Date().toISOString(),
      exportedBy: args.userId,
      downloadUrl,
      expiresAt,
      metadata: {
        fileSize,
        recordCount: exportData.embeddings?.length || 0,
        compressionType: 'none',
      },
    });
    
    // Log event
    await ctx.db.insert("ragWorkflowEvents", {
      workflowId: args.workflowId,
      eventType: "exported",
      timestamp: new Date().toISOString(),
      description: `Exported workflow as ${args.format.toUpperCase()}`,
      metadata: { format: args.format, exportId },
      userId: args.userId,
    });
    
    return {
      exportId,
      downloadUrl,
      expiresAt,
      fileSize,
      format: args.format,
    };
  },
});

// Helper function to generate JSON export
async function generateJsonExport(ctx: any, workflow: any) {
  // Get all related data
  const sources = await ctx.db
    .query("ragSourceDetails")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflow._id))
    .collect();
  
  const steps = await ctx.db
    .query("ragWorkflowSteps")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflow._id))
    .collect();
  
  const events = await ctx.db
    .query("ragWorkflowEvents")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflow._id))
    .collect();
  
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    workflow: {
      id: workflow._id,
      name: workflow.name,
      type: workflow.type,
      status: workflow.status,
      createdAt: workflow.createdAt,
      completedAt: workflow.completedAt,
    },
    configuration: workflow.parameters,
    statistics: workflow.stats,
    sources: sources.map((s: any) => ({
      source: s.source,
      type: s.sourceType,
      metadata: s.metadata,
      stats: s.stats,
    })),
    processingSteps: steps.map((s: any) => ({
      step: s.stepName,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      duration: s.completedAt && s.startedAt 
        ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
        : null,
    })),
    timeline: events.map((e: any) => ({
      event: e.eventType,
      timestamp: e.timestamp,
      description: e.description,
    })),
  };
}

// Helper function to generate vector export
async function generateVectorExport(ctx: any, workflow: any) {
  // Get embeddings from vector store
  const embeddings = await ctx.db
    .query("ragEmbeddings")
    .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflow._id))
    .collect();
  
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    workflow: {
      id: workflow._id,
      name: workflow.name,
      embeddingModel: workflow.parameters.embeddingModel,
      vectorStore: workflow.parameters.vectorStore,
    },
    embeddings: embeddings.map((e: any) => ({
      id: e._id,
      vector: e.vector,
      text: e.text,
      metadata: {
        source: e.source,
        chunkIndex: e.chunkIndex,
        tokens: e.tokens,
      },
    })),
    dimensions: workflow.parameters.embeddingModel === 'text-embedding-3-large' ? 3072 : 1536,
    totalVectors: embeddings.length,
  };
}
```

### 2. Use Workflow in Agent
```typescript
export const useWorkflowInAgent = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    agentId: v.id("agents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify workflow
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    if (workflow.status !== 'completed') {
      throw new Error("Can only use completed workflows");
    }
    
    // Verify agent
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.userId !== args.userId) {
      throw new Error("Agent not found or unauthorized");
    }
    
    // Check agent capabilities
    if (!agent.capabilities?.includes('rag') && 
        agent.type !== 'knowledge_base' && 
        agent.type !== 'customer_support') {
      throw new Error("Agent does not support RAG integration");
    }
    
    // Store previous RAG if exists
    const previousRAG = agent.ragWorkflowId;
    
    // Update agent with new RAG workflow
    await ctx.db.patch(args.agentId, {
      ragWorkflowId: args.workflowId,
      ragConfig: {
        enabled: true,
        workflowName: workflow.name,
        embeddingModel: workflow.parameters.embeddingModel,
        vectorStore: workflow.parameters.vectorStore,
        lastUpdated: new Date().toISOString(),
      },
    });
    
    // Log events
    await ctx.db.insert("ragWorkflowEvents", {
      workflowId: args.workflowId,
      eventType: "used_in_agent",
      timestamp: new Date().toISOString(),
      description: `Integrated with agent: ${agent.name}`,
      metadata: { 
        agentId: args.agentId,
        agentName: agent.name,
        previousRAG,
      },
      userId: args.userId,
    });
    
    await ctx.db.insert("agentEvents", {
      agentId: args.agentId,
      eventType: "rag_updated",
      timestamp: new Date().toISOString(),
      description: `RAG updated to: ${workflow.name}`,
      metadata: {
        workflowId: args.workflowId,
        workflowName: workflow.name,
        previousWorkflowId: previousRAG,
      },
      userId: args.userId,
    });
    
    return {
      success: true,
      agentName: agent.name,
      workflowName: workflow.name,
      message: `Successfully integrated "${workflow.name}" with "${agent.name}"`,
    };
  },
});
```

### 3. Preview Workflow Results
```typescript
export const previewWorkflowQuery = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    query: v.string(),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.status !== 'completed') {
      throw new Error("Workflow not available for preview");
    }
    
    const maxResults = args.maxResults || 5;
    
    // Simulate vector search (in production, this would query the actual vector DB)
    const embeddings = await ctx.db
      .query("ragEmbeddings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .take(100);
    
    // Simple text matching for preview (replace with actual vector search)
    const results = embeddings
      .filter(e => e.text.toLowerCase().includes(args.query.toLowerCase()))
      .slice(0, maxResults)
      .map(e => ({
        id: e._id,
        text: e.text,
        source: e.source,
        score: Math.random(), // Simulated relevance score
        metadata: e.metadata,
      }))
      .sort((a, b) => b.score - a.score);
    
    return {
      query: args.query,
      results,
      totalFound: results.length,
      searchTime: Math.random() * 100 + 50, // Simulated search time in ms
    };
  },
});
```

### 4. Share Workflow
```typescript
export const shareWorkflow = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    shareWith: v.array(v.string()), // User IDs
    permissions: v.union(v.literal("view"), v.literal("use"), v.literal("clone")),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // Create share records
    const shares = await Promise.all(
      args.shareWith.map(userId => 
        ctx.db.insert("ragWorkflowShares", {
          workflowId: args.workflowId,
          sharedBy: workflow.userId,
          sharedWith: userId,
          permissions: args.permissions,
          sharedAt: new Date().toISOString(),
          expiresAt: args.expiresAt,
        })
      )
    );
    
    // Log event
    await ctx.db.insert("ragWorkflowEvents", {
      workflowId: args.workflowId,
      eventType: "shared",
      timestamp: new Date().toISOString(),
      description: `Shared with ${args.shareWith.length} user(s)`,
      metadata: {
        shareIds: shares,
        permissions: args.permissions,
      },
      userId: workflow.userId,
    });
    
    return {
      shareIds: shares,
      sharedWith: args.shareWith.length,
      permissions: args.permissions,
    };
  },
});
```

### 5. Generate Public Link
```typescript
export const generatePublicLink = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    expiresIn: v.optional(v.number()), // Hours
    allowClone: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.status !== 'completed') {
      throw new Error("Can only share completed workflows");
    }
    
    // Generate unique token
    const token = generateSecureToken();
    const expiresAt = args.expiresIn 
      ? new Date(Date.now() + args.expiresIn * 60 * 60 * 1000).toISOString()
      : null;
    
    // Create public link record
    const linkId = await ctx.db.insert("ragWorkflowPublicLinks", {
      workflowId: args.workflowId,
      token,
      createdBy: workflow.userId,
      createdAt: new Date().toISOString(),
      expiresAt,
      allowClone: args.allowClone || false,
      views: 0,
      lastViewedAt: null,
    });
    
    const publicUrl = `${process.env.APP_URL}/rag/public/${token}`;
    
    return {
      linkId,
      url: publicUrl,
      token,
      expiresAt,
      allowClone: args.allowClone || false,
    };
  },
});

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
```

## Error Handling

```typescript
// Export-specific errors
export class ExportQuotaExceededError extends Error {
  constructor(limit: number) {
    super(`Export quota exceeded. Maximum ${limit} exports per month.`);
    this.name = "ExportQuotaExceededError";
  }
}

export class ExportNotReadyError extends Error {
  constructor(status: string) {
    super(`Cannot export workflow in ${status} status. Workflow must be completed.`);
    this.name = "ExportNotReadyError";
  }
}

export class AgentIntegrationError extends Error {
  constructor(reason: string) {
    super(`Cannot integrate with agent: ${reason}`);
    this.name = "AgentIntegrationError";
  }
}
```

## Usage in Component

```typescript
// In the ViewRAGWorkflowModal component
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function ViewRAGWorkflowModal({ workflow, onExport, onUse }) {
  const exportWorkflow = useMutation(api.ragWorkflows.mutations.exportWorkflow);
  const useInAgent = useMutation(api.ragWorkflows.mutations.useWorkflowInAgent);
  const previewQuery = useMutation(api.ragWorkflows.mutations.previewWorkflowQuery);
  
  const handleExport = async (format: 'json' | 'vectors') => {
    try {
      const result = await exportWorkflow({
        workflowId: workflow.id,
        format,
        userId: currentUser.id,
      });
      
      // Trigger download
      window.open(result.downloadUrl, '_blank');
      
      toast.success(`Export started! Link expires at ${new Date(result.expiresAt).toLocaleString()}`);
      
      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleUseInAgent = async () => {
    try {
      // Show agent selection modal
      const selectedAgentId = await showAgentSelectionModal();
      
      if (selectedAgentId) {
        const result = await useInAgent({
          workflowId: workflow.id,
          agentId: selectedAgentId,
          userId: currentUser.id,
        });
        
        toast.success(result.message);
        
        if (onUse) {
          onUse();
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
}
```