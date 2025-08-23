import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get user workflows
export const getUserWorkflows = query({
  args: {
    userId: v.string(),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("embedding"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("ragWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    const workflows = await query.collect();
    
    // Filter by status if provided
    const filteredWorkflows = args.status 
      ? workflows.filter(w => w.status === args.status)
      : workflows;
    
    // Sort by creation date (newest first)
    return filteredWorkflows.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});

// Get workflow details
export const getWorkflow = query({
  args: {
    workflowId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    return workflow;
  },
});

// Get workflow sources
export const getWorkflowSources = query({
  args: {
    workflowId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify workflow ownership
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    const sources = await ctx.db
      .query("ragSources")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    return sources;
  },
});

// Get workflow stats (internal)
export const getWorkflowStats = internalQuery({
  args: {
    workflowId: v.string(),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("ragSources")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    const embeddings = await ctx.db
      .query("ragEmbeddings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    const totalSources = sources.length;
    const processedSources = sources.filter(s => s.status === "completed").length;
    const totalChunks = embeddings.length;
    const totalEmbeddings = embeddings.length;
    const totalTokens = embeddings.reduce((sum, e) => sum + e.chunkTokens, 0);
    
    // Calculate index size (approximate)
    const embeddingSize = embeddings.length > 0 ? embeddings[0].dimensions * 4 : 0; // 4 bytes per float
    const indexSizeBytes = totalEmbeddings * embeddingSize;
    
    return {
      totalSources,
      processedSources,
      totalChunks,
      totalEmbeddings,
      totalTokens,
      indexSizeBytes,
    };
  },
});

// Get workflow embeddings
export const getWorkflowEmbeddings = internalQuery({
  args: {
    workflowId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("ragEmbeddings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId));
    
    const embeddings = await query.collect();
    
    // Apply limit if specified
    if (args.limit && args.limit > 0) {
      return embeddings.slice(0, args.limit);
    }
    
    return embeddings;
  },
});

// Get user tier (internal)
export const getUserTier = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return subscription?.tier || "free";
  },
});

// Get expired workflows (internal)
export const getExpiredWorkflows = internalQuery({
  args: {
    currentTime: v.string(),
  },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_expiry")
      .collect();
    
    // Filter workflows that have expired
    const expiredWorkflows = workflows.filter(w => 
      w.expiresAt && new Date(w.expiresAt) < new Date(args.currentTime)
    );
    
    return expiredWorkflows;
  },
});

// Check workflow file size limit
export const checkWorkflowSizeLimit = query({
  args: {
    userId: v.string(),
    additionalSize: v.number(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    const userTier = subscription?.tier || "free";
    
    // Get tier limits
    const limits = {
      free: 10 * 1024 * 1024, // 10MB
      premium: 100 * 1024 * 1024, // 100MB
      enterprise: -1, // unlimited
    };
    
    const maxSize = limits[userTier];
    
    // For enterprise, always allow
    if (maxSize === -1) {
      return { allowed: true, userTier };
    }
    
    // Get current total size across all workflows
    const workflows = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const currentTotalSize = workflows.reduce((sum, w) => sum + w.totalFileSize, 0);
    const newTotalSize = currentTotalSize + args.additionalSize;
    
    if (newTotalSize > maxSize) {
      return {
        allowed: false,
        error: `File size limit exceeded. ${userTier} tier allows ${maxSize / 1024 / 1024}MB total.`,
        currentSize: currentTotalSize,
        maxSize,
        userTier,
      };
    }
    
    return {
      allowed: true,
      currentSize: currentTotalSize,
      maxSize,
      remainingSize: maxSize - currentTotalSize,
      userTier,
    };
  },
});

// Search embeddings (for testing/demo)
export const searchEmbeddings = query({
  args: {
    workflowId: v.string(),
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify workflow ownership
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    // Get embeddings
    const embeddings = await ctx.db
      .query("ragEmbeddings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    // In a real implementation, we would:
    // 1. Generate embedding for the query using Jina
    // 2. Calculate cosine similarity with all embeddings
    // 3. Return top k results
    
    // For now, return a simple text match
    const results = embeddings
      .filter(e => e.chunkText.toLowerCase().includes(args.query.toLowerCase()))
      .slice(0, args.limit || 10)
      .map(e => ({
        embeddingId: e.embeddingId,
        chunkText: e.chunkText,
        sourceId: e.sourceId,
        score: 0.9, // Mock similarity score
      }));
    
    return results;
  },
});

// Get export job status
export const getExportJob = query({
  args: {
    exportId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const exportJob = await ctx.db
      .query("ragExportJobs")
      .withIndex("by_export", (q) => q.eq("exportId", args.exportId))
      .first();
    
    if (!exportJob || exportJob.userId !== args.userId) {
      throw new Error("Export job not found or unauthorized");
    }
    
    return exportJob;
  },
});

// Get user's recent exports
export const getUserExports = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const exports = await ctx.db
      .query("ragExportJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort by creation date (newest first) and apply limit
    return exports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, args.limit || 10);
  },
});

// Get workflow processing statistics
export const getWorkflowProcessingStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const stats = {
      total: workflows.length,
      pending: workflows.filter(w => w.status === "pending").length,
      processing: workflows.filter(w => w.status === "processing" || w.status === "embedding").length,
      completed: workflows.filter(w => w.status === "completed").length,
      failed: workflows.filter(w => w.status === "failed").length,
      expired: workflows.filter(w => w.status === "expired").length,
      totalEmbeddings: 0,
      totalStorage: 0,
    };
    
    // Calculate total embeddings and storage
    for (const workflow of workflows) {
      stats.totalEmbeddings += workflow.totalEmbeddings;
      stats.totalStorage += workflow.totalFileSize;
    }
    
    return stats;
  },
});