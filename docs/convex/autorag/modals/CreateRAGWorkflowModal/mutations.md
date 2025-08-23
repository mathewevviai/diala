# CreateRAGWorkflowModal - Convex Mutations Documentation

## Overview
Mutations for creating RAG workflows, handling file uploads, and initiating processing pipelines.

## Mutation Definitions

### 1. Create RAG Workflow
```typescript
// convex/ragWorkflows/mutations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createWorkflow = mutation({
  args: {
    name: v.string(),
    sources: v.array(v.string()),
    youtubeUrl: v.string(),
    urls: v.string(),
    embeddingModel: v.string(),
    vectorStore: v.string(),
    chunkSize: v.number(),
    overlap: v.number(),
    userId: v.string(),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate user quota
    const existingWorkflows = await ctx.db
      .query("ragWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "scraping"),
          q.eq(q.field("status"), "embedding"),
          q.eq(q.field("status"), "indexing"),
          q.eq(q.field("status"), "validating")
        )
      )
      .collect();
    
    if (existingWorkflows.length >= 3) {
      throw new Error("Maximum concurrent workflows limit reached");
    }
    
    // Determine workflow type
    const allSources = [
      ...args.sources,
      ...(args.youtubeUrl ? [args.youtubeUrl] : []),
      ...(args.urls ? args.urls.split('\n').filter(u => u.trim()) : [])
    ];
    
    let workflowType: "youtube" | "documents" | "urls" | "mixed";
    const hasYoutube = allSources.some(s => s.includes('youtube'));
    const hasUrls = allSources.some(s => s.startsWith('http') && !s.includes('youtube'));
    const hasDocs = args.sources.length > 0;
    
    if (hasYoutube && !hasUrls && !hasDocs) {
      workflowType = "youtube";
    } else if (hasUrls && !hasYoutube && !hasDocs) {
      workflowType = "urls";
    } else if (hasDocs && !hasYoutube && !hasUrls) {
      workflowType = "documents";
    } else {
      workflowType = "mixed";
    }
    
    // Create workflow
    const workflowId = await ctx.db.insert("ragWorkflows", {
      name: args.name,
      status: "queued",
      progress: 0,
      type: workflowType,
      parameters: {
        sources: allSources,
        chunkSize: args.chunkSize,
        overlap: args.overlap,
        embeddingModel: args.embeddingModel,
        vectorStore: args.vectorStore,
      },
      stats: {
        totalContent: allSources.length,
        contentProcessed: 0,
        embeddings: 0,
        indexSize: "0 MB",
      },
      createdAt: new Date().toISOString(),
      estimatedTime: "15-30 min",
      userId: args.userId,
      organizationId: args.organizationId,
    });
    
    // Schedule processing job
    await ctx.scheduler.runAfter(0, api.ragWorkflows.jobs.processWorkflow, {
      workflowId,
    });
    
    return { workflowId };
  },
});
```

### 2. Upload Files for Workflow
```typescript
export const uploadFiles = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    files: v.array(v.object({
      name: v.string(),
      size: v.number(),
      type: v.string(),
      content: v.string(), // Base64 encoded
    })),
  },
  handler: async (ctx, args) => {
    // Verify workflow exists and belongs to user
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    const uploadPromises = args.files.map(async (file) => {
      // Store file in Convex storage
      const blob = new Blob([Buffer.from(file.content, 'base64')]);
      const storageId = await ctx.storage.store(blob);
      
      // Create upload record
      return ctx.db.insert("ragUploads", {
        workflowId: args.workflowId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storageId,
        status: "pending",
        uploadedAt: new Date().toISOString(),
      });
    });
    
    const uploadIds = await Promise.all(uploadPromises);
    
    // Update workflow sources
    const currentSources = workflow.parameters.sources;
    const newSources = [...currentSources, ...args.files.map(f => f.name)];
    
    await ctx.db.patch(args.workflowId, {
      parameters: {
        ...workflow.parameters,
        sources: newSources,
      },
      stats: {
        ...workflow.stats,
        totalContent: newSources.length,
      },
    });
    
    return { uploadIds };
  },
});
```

### 3. Start Workflow Processing
```typescript
export const startWorkflowProcessing = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.status !== "queued") {
      throw new Error("Workflow is already processing or completed");
    }
    
    // Update status to scraping
    await ctx.db.patch(args.workflowId, {
      status: "scraping",
      progress: 5,
    });
    
    // Trigger async processing
    await ctx.scheduler.runAfter(0, api.ragWorkflows.jobs.startScraping, {
      workflowId: args.workflowId,
    });
    
    return { 
      success: true,
      message: "Workflow processing started"
    };
  },
});
```

### 4. Cancel Workflow Creation
```typescript
export const cancelWorkflowCreation = mutation({
  args: {
    workflowId: v.optional(v.id("ragWorkflows")),
    uploadIds: v.optional(v.array(v.id("ragUploads"))),
  },
  handler: async (ctx, args) => {
    // Clean up any uploaded files
    if (args.uploadIds) {
      for (const uploadId of args.uploadIds) {
        const upload = await ctx.db.get(uploadId);
        if (upload) {
          // Delete from storage
          await ctx.storage.delete(upload.storageId);
          // Delete record
          await ctx.db.delete(uploadId);
        }
      }
    }
    
    // Delete workflow if it was created
    if (args.workflowId) {
      const workflow = await ctx.db.get(args.workflowId);
      if (workflow && workflow.status === "queued") {
        await ctx.db.delete(args.workflowId);
      }
    }
    
    return { success: true };
  },
});
```

### 5. Validate and Process URLs
```typescript
export const validateAndAddUrls = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    urls: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // Parse and validate URLs
    const urlList = args.urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
    
    const validUrls: string[] = [];
    const invalidUrls: string[] = [];
    
    for (const url of urlList) {
      try {
        new URL(url); // Validates URL format
        validUrls.push(url);
      } catch {
        invalidUrls.push(url);
      }
    }
    
    if (invalidUrls.length > 0) {
      throw new Error(`Invalid URLs: ${invalidUrls.join(', ')}`);
    }
    
    // Update workflow sources
    const currentSources = workflow.parameters.sources;
    const newSources = [...currentSources, ...validUrls];
    
    await ctx.db.patch(args.workflowId, {
      parameters: {
        ...workflow.parameters,
        sources: newSources,
      },
      stats: {
        ...workflow.stats,
        totalContent: newSources.length,
      },
    });
    
    return {
      added: validUrls.length,
      total: newSources.length,
    };
  },
});
```

### 6. Add YouTube Content
```typescript
export const addYouTubeContent = mutation({
  args: {
    workflowId: v.id("ragWorkflows"),
    youtubeUrl: v.string(),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.isPremium) {
      throw new Error("YouTube embedding is a premium feature");
    }
    
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // Validate YouTube URL
    const validation = await ctx.runQuery(
      api.ragWorkflows.queries.validateYouTubeUrl,
      { url: args.youtubeUrl }
    );
    
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid YouTube URL");
    }
    
    // Add to sources
    const currentSources = workflow.parameters.sources;
    const newSources = [...currentSources, args.youtubeUrl];
    
    await ctx.db.patch(args.workflowId, {
      parameters: {
        ...workflow.parameters,
        sources: newSources,
      },
      stats: {
        ...workflow.stats,
        totalContent: workflow.stats.totalContent + validation.estimatedVideos,
      },
      type: workflow.type === "documents" || workflow.type === "urls" 
        ? "mixed" 
        : "youtube",
    });
    
    return {
      resourceType: validation.resourceType,
      resourceId: validation.resourceId,
      estimatedVideos: validation.estimatedVideos,
    };
  },
});
```

## Error Handling

```typescript
// Common error types
export class WorkflowQuotaExceededError extends Error {
  constructor(limit: number) {
    super(`Workflow quota exceeded. Maximum ${limit} concurrent workflows allowed.`);
    this.name = "WorkflowQuotaExceededError";
  }
}

export class InvalidSourceError extends Error {
  constructor(source: string, reason: string) {
    super(`Invalid source "${source}": ${reason}`);
    this.name = "InvalidSourceError";
  }
}

export class PremiumFeatureError extends Error {
  constructor(feature: string) {
    super(`${feature} is a premium feature. Please upgrade your plan.`);
    this.name = "PremiumFeatureError";
  }
}
```

## Usage in Component

```typescript
// In the CreateRAGWorkflowModal component
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateRAGWorkflowModal() {
  const createWorkflow = useMutation(api.ragWorkflows.mutations.createWorkflow);
  const uploadFiles = useMutation(api.ragWorkflows.mutations.uploadFiles);
  const startProcessing = useMutation(api.ragWorkflows.mutations.startWorkflowProcessing);
  
  const handleSubmit = async () => {
    try {
      // Create workflow
      const { workflowId } = await createWorkflow({
        name: formData.name,
        sources: formData.sources,
        youtubeUrl: formData.youtubeUrl,
        urls: formData.urls,
        embeddingModel: formData.embeddingModel,
        vectorStore: formData.vectorStore,
        chunkSize: formData.chunkSize,
        overlap: formData.overlap,
        userId: currentUser.id,
      });
      
      // Upload files if any
      if (uploadedFiles.length > 0) {
        const fileData = await Promise.all(
          uploadedFiles.map(async (file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            content: await fileToBase64(file),
          }))
        );
        
        await uploadFiles({
          workflowId,
          files: fileData,
        });
      }
      
      // Start processing
      await startProcessing({ workflowId });
      
      toast.success("Workflow created successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };
}
```