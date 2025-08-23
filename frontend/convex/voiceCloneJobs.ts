import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new voice clone job
export const create = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    voiceName: v.string(),
    audioFileUrl: v.optional(v.string()),
    audioFileName: v.optional(v.string()),
    audioFileSize: v.optional(v.number()),
    sampleText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.insert("voiceCloneJobs", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return job;
  },
});

// Update job status
export const updateStatus = mutation({
  args: {
    jobId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    voiceId: v.optional(v.string()),
    resultUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    errorDetails: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      stack: v.optional(v.string()),
    })),
    workerInfo: v.optional(v.object({
      environment: v.string(),
      gpuType: v.string(),
      dropletId: v.optional(v.string()),
      ip: v.optional(v.string()),
    })),
    // Additional fields for voice cloning details
    apiJobId: v.optional(v.string()),
    sampleText: v.optional(v.string()),
    settings: v.optional(v.object({
      exaggeration: v.number(),
      cfgWeight: v.number(),
      chunkSize: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    
    // Find the job
    const job = await ctx.db
      .query("voiceCloneJobs")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Update the job
    await ctx.db.patch(job._id, updates);
    
    return { success: true };
  },
});

// Get job by ID
export const getJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceCloneJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

// Get jobs by user
export const getUserJobs = query({
  args: { 
    userId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("voiceCloneJobs");
    
    if (args.status) {
      query = query.withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", args.status as any)
      );
    } else {
      query = query.withIndex("by_user", (q) => q.eq("userId", args.userId));
    }
    
    const jobs = await query
      .order("desc")
      .take(args.limit || 10);
    
    return jobs;
  },
});

// Get pending jobs (for worker polling)
export const getPendingJobs = query({
  args: { 
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("voiceCloneJobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(args.limit || 10);
    
    return jobs;
  },
});

// Claim a job for processing
export const claimJob = mutation({
  args: {
    jobId: v.string(),
    workerInfo: v.object({
      environment: v.string(),
      gpuType: v.string(),
      dropletId: v.optional(v.string()),
      ip: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("voiceCloneJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job ${args.jobId} not found`);
    }
    
    if (job.status !== "pending") {
      throw new Error(`Job ${args.jobId} is not pending (status: ${job.status})`);
    }
    
    // Update job to processing
    await ctx.db.patch(job._id, {
      status: "processing",
      startedAt: Date.now(),
      workerInfo: args.workerInfo,
    });
    
    return { success: true };
  },
});

// Get job statistics
export const getStats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("voiceCloneJobs");
    
    if (args.userId) {
      // Get user-specific stats
      const jobs = await query
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      const stats = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === "pending").length,
        processing: jobs.filter(j => j.status === "processing").length,
        completed: jobs.filter(j => j.status === "completed").length,
        failed: jobs.filter(j => j.status === "failed").length,
        avgProcessingTime: 0,
      };
      
      // Calculate average processing time
      const completedJobs = jobs.filter(j => j.status === "completed" && j.processingTime);
      if (completedJobs.length > 0) {
        const totalTime = completedJobs.reduce((sum, j) => sum + (j.processingTime || 0), 0);
        stats.avgProcessingTime = totalTime / completedJobs.length;
      }
      
      return stats;
    } else {
      // Get global stats
      const allJobs = await query.collect();
      
      return {
        total: allJobs.length,
        pending: allJobs.filter(j => j.status === "pending").length,
        processing: allJobs.filter(j => j.status === "processing").length,
        completed: allJobs.filter(j => j.status === "completed").length,
        failed: allJobs.filter(j => j.status === "failed").length,
      };
    }
  },
});