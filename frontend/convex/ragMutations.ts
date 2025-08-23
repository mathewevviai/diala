import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new RAG workflow
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    sourceType: v.union(
      v.literal("youtube"),
      v.literal("documents"),
      v.literal("urls"),
      v.literal("mixed")
    ),
    chunkSize: v.number(),
    overlap: v.number(),
    embeddingModel: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Get user tier
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    const userTier = subscription?.tier || "free";
    
    // Calculate expiry for free tier
    let expiresAt = undefined;
    if (userTier === "free") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days retention
      expiresAt = expiryDate.toISOString();
    }
    
    await ctx.db.insert("ragWorkflows", {
      workflowId,
      userId: args.userId,
      name: args.name,
      description: args.description,
      sourceType: args.sourceType,
      embeddingModel: "jina-clip-v2",
      chunkSize: args.chunkSize,
      overlap: args.overlap,
      status: "pending",
      progress: 0,
      totalSources: 0,
      processedSources: 0,
      totalChunks: 0,
      totalEmbeddings: 0,
      totalTokens: 0,
      indexSize: "0 MB",
      userTier,
      totalFileSize: 0,
      createdAt: new Date().toISOString(),
      expiresAt,
      estimatedCost: 0,
    });
    
    return { workflowId };
  },
});

// Update workflow progress
export const updateWorkflowProgress = internalMutation({
  args: {
    workflowId: v.string(),
    progress: v.number(),
    stage: v.string(),
    processedSources: v.optional(v.number()),
    totalSources: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    await ctx.db.patch(workflow._id, {
      progress: args.progress,
      currentStage: args.stage,
      processedSources: args.processedSources || 0,
    });
  },
});

// Update workflow status (internal)
export const updateWorkflowStatus = internalMutation({
  args: {
    workflowId: v.string(),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("embedding"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired")
    )),
    progress: v.optional(v.number()),
    currentStage: v.optional(v.string()),
    error: v.optional(v.string()),
    stats: v.optional(v.object({
      totalSources: v.number(),
      processedSources: v.number(),
      totalChunks: v.number(),
      totalEmbeddings: v.number(),
      totalTokens: v.number(),
      indexSize: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    const updates: any = {};
    
    if (args.status !== undefined) {
      updates.status = args.status;
      
      if (args.status === "processing" && !workflow.startedAt) {
        updates.startedAt = new Date().toISOString();
      } else if (args.status === "completed" || args.status === "failed") {
        updates.completedAt = new Date().toISOString();
      }
    }
    
    if (args.progress !== undefined) {
      updates.progress = args.progress;
    }
    
    if (args.currentStage !== undefined) {
      updates.currentStage = args.currentStage;
    }
    
    if (args.error !== undefined) {
      updates.error = args.error;
    }
    
    if (args.stats !== undefined) {
      updates.totalSources = args.stats.totalSources;
      updates.processedSources = args.stats.processedSources;
      updates.totalChunks = args.stats.totalChunks;
      updates.totalEmbeddings = args.stats.totalEmbeddings;
      updates.totalTokens = args.stats.totalTokens;
      updates.indexSize = args.stats.indexSize;
    }
    
    await ctx.db.patch(workflow._id, updates);
  },
});

// Update workflow progress

// Create a source
export const createSource = internalMutation({
  args: {
    sourceId: v.string(),
    workflowId: v.string(),
    userId: v.string(),
    sourceType: v.union(
      v.literal("youtube_video"),
      v.literal("youtube_channel"),
      v.literal("document"),
      v.literal("url")
    ),
    sourceUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ragSources", {
      sourceId: args.sourceId,
      workflowId: args.workflowId,
      userId: args.userId,
      sourceType: args.sourceType,
      sourceUrl: args.sourceUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      status: "pending",
      chunkCount: 0,
      tokenCount: 0,
      createdAt: new Date().toISOString(),
    });
    
    // Update workflow total file size if applicable
    if (args.fileSize) {
      const workflow = await ctx.db
        .query("ragWorkflows")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .first();
      
      if (workflow) {
        await ctx.db.patch(workflow._id, {
          totalFileSize: workflow.totalFileSize + args.fileSize,
        });
      }
    }
  },
});

// Update workflow progress

// Update source content
export const updateSourceContent = internalMutation({
  args: {
    sourceId: v.string(),
    content: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("ragSources")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .first();
    
    if (!source) {
      throw new Error("Source not found");
    }
    
    await ctx.db.patch(source._id, {
      content: args.content,
      metadata: args.metadata,
      status: "extracting",
      processedAt: new Date().toISOString(),
    });
  },
});

// Update workflow progress

// Update source status
export const updateSourceStatus = internalMutation({
  args: {
    sourceId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("downloading"),
      v.literal("extracting"),
      v.literal("chunking"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("ragSources")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .first();
    
    if (!source) {
      throw new Error("Source not found");
    }
    
    const updates: any = {
      status: args.status,
    };
    
    if (args.error) {
      updates.error = args.error;
    }
    
    if (args.status === "completed") {
      updates.processedAt = new Date().toISOString();
    }
    
    await ctx.db.patch(source._id, updates);
  },
});

// Update workflow progress

// Store embedding
export const storeEmbedding = internalMutation({
  args: {
    embeddingId: v.string(),
    workflowId: v.string(),
    sourceId: v.string(),
    userId: v.string(),
    chunkIndex: v.number(),
    chunkText: v.string(),
    chunkTokens: v.number(),
    embedding: v.array(v.float64()),
    embeddingModel: v.string(),
    dimensions: v.number(),
  },
  handler: async (ctx, args) => {
    // Get workflow to check expiry
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    await ctx.db.insert("ragEmbeddings", {
      embeddingId: args.embeddingId,
      workflowId: args.workflowId,
      sourceId: args.sourceId,
      userId: args.userId,
      chunkIndex: args.chunkIndex,
      chunkText: args.chunkText,
      chunkTokens: args.chunkTokens,
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
      dimensions: args.dimensions,
      createdAt: new Date().toISOString(),
      expiresAt: workflow.expiresAt,
    });
  },
});

// Update workflow progress

// Create export job
export const createExportJob = internalMutation({
  args: {
    exportId: v.string(),
    workflowId: v.string(),
    userId: v.string(),
    format: v.union(
      v.literal("json"),
      v.literal("jsonl"),
      v.literal("csv"),
      v.literal("parquet"),
      v.literal("pinecone"),
      v.literal("weaviate")
    ),
    includeMetadata: v.boolean(),
    includeChunks: v.boolean(),
  },
  handler: async (ctx, args) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry for download
    
    await ctx.db.insert("ragExportJobs", {
      exportId: args.exportId,
      workflowId: args.workflowId,
      userId: args.userId,
      format: args.format,
      includeMetadata: args.includeMetadata,
      includeChunks: args.includeChunks,
      status: "processing",
      progress: 0,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  },
});

// Update workflow progress

// Update export job
export const updateExportJob = internalMutation({
  args: {
    exportId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    recordCount: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const exportJob = await ctx.db
      .query("ragExportJobs")
      .withIndex("by_export", (q) => q.eq("exportId", args.exportId))
      .first();
    
    if (!exportJob) {
      throw new Error("Export job not found");
    }
    
    const updates: any = {
      status: args.status,
    };
    
    if (args.progress !== undefined) updates.progress = args.progress;
    if (args.fileUrl !== undefined) updates.fileUrl = args.fileUrl;
    if (args.fileSize !== undefined) updates.fileSize = args.fileSize;
    if (args.recordCount !== undefined) updates.recordCount = args.recordCount;
    if (args.error !== undefined) updates.error = args.error;
    
    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = new Date().toISOString();
    }
    
    await ctx.db.patch(exportJob._id, updates);
  },
});

// Update workflow progress

// Delete workflow embeddings
export const deleteWorkflowEmbeddings = internalMutation({
  args: {
    workflowId: v.string(),
  },
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("ragEmbeddings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    for (const embedding of embeddings) {
      await ctx.db.delete(embedding._id);
    }
    
    return embeddings.length;
  },
});

// Update workflow progress

// Delete workflow sources
export const deleteWorkflowSources = internalMutation({
  args: {
    workflowId: v.string(),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("ragSources")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    for (const source of sources) {
      await ctx.db.delete(source._id);
    }
    
    return sources.length;
  },
});

// Update workflow progress

// Add source to workflow
export const addSourceToWorkflow = mutation({
  args: {
    workflowId: v.string(),
    source: v.object({
      type: v.union(v.literal("youtube"), v.literal("document"), v.literal("url")),
      value: v.string(),
      metadata: v.optional(v.any()),
    }),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check workflow ownership
    const workflow = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!workflow || workflow.userId !== args.userId) {
      throw new Error("Workflow not found or unauthorized");
    }
    
    // Check if workflow is in a state that allows adding sources
    if (workflow.status !== "pending" && workflow.status !== "failed") {
      throw new Error("Cannot add sources to a workflow in progress");
    }
    
    // Create source
    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    let sourceType: "youtube_video" | "youtube_channel" | "document" | "url";
    if (args.source.type === "youtube") {
      sourceType = args.source.value.includes("/channel/") || args.source.value.includes("/@") 
        ? "youtube_channel" 
        : "youtube_video";
    } else if (args.source.type === "document") {
      sourceType = "document";
    } else {
      sourceType = "url";
    }
    
    await ctx.db.insert("ragSources", {
      sourceId,
      workflowId: args.workflowId,
      userId: args.userId,
      sourceType,
      sourceUrl: args.source.type !== "document" ? args.source.value : undefined,
      fileName: args.source.type === "document" ? args.source.metadata?.fileName : undefined,
      fileSize: args.source.type === "document" ? args.source.metadata?.fileSize : undefined,
      status: "pending",
      chunkCount: 0,
      tokenCount: 0,
      createdAt: new Date().toISOString(),
    });
    
    // Update workflow source count
    await ctx.db.patch(workflow._id, {
      totalSources: workflow.totalSources + 1,
    });
    
    return { sourceId };
  },
});

// Update workflow progress
/**
 * Mark a document as processed with timestamp
 */
export const markDocumentProcessedWithTimestamp = internalMutation({
  args: {
    documentId: v.id("webDocuments"),
    processedAt: v.number(),
  },
  handler: async (ctx, { documentId, processedAt }) => {
    await ctx.db.patch(documentId, { 
      processed: true, 
      processedAt 
    });
  },
});

// Update workflow progress

/**
 * Mark a document as processed (simple version)
 */
export const markDocumentProcessed = internalMutation({
  args: {
    documentId: v.id("webDocuments"),
  },
  handler: async (ctx, { documentId }) => {
    await ctx.db.patch(documentId, { 
      processed: true, 
      processedAt: Date.now()
    });
  },
});

// Update workflow progress
