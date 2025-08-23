import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Create a new procedural audio generation job
export const createJob = mutation({
  args: {
    config: v.object({
      prompt: v.string(),
      duration: v.number(),
      intensity: v.number(), // 0-1 for ambiance intensity
      name: v.string()
    }),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const jobId = `proc-audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("proceduralAudioJobs", {
      jobId,
      userId: args.userId,
      config: args.config,
      status: "pending",
      createdAt: Date.now()
    });
    
    // Trigger background processing (reference action via API path)
    await ctx.scheduler.runAfter(0, api.proceduralAudio.processAudioJob, { jobId });
    
    return jobId;
  }
});

// Process the audio generation job
export const processAudioJob = action({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.query("proceduralAudioJobs")
      .filter(q => q.eq(q.field("jobId"), args.jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job ${args.jobId} not found`);
    }
    
    // Update status to processing
    await ctx.db.patch(job._id, {
      status: "processing",
      startedAt: Date.now()
    });
    
    try {
      // Call the procedural audio service
      const audioServiceUrl = "http://localhost:8001"; // Can be made configurable
      const response = await fetch(`${audioServiceUrl}/api/public/procedural-audio/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job.config),
      });
      
      if (!response.ok) {
        throw new Error(`Audio service error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update job with results
      await ctx.db.patch(job._id, {
        status: "completed",
        audioUrl: result.url,
        audioId: result.id,
        fileName: `${job.config.name.replace(/\s+/g, '-').toLowerCase()}.wav`,
        fileSize: result.metadata?.size ? parseInt(result.metadata.size) : undefined,
        metadata: {
          size: result.metadata?.size || "Unknown",
          duration: `${job.config.duration}s`,
          quality: result.metadata?.quality || "44.1kHz/16-bit",
          format: "WAV"
        },
        completedAt: Date.now(),
        processingTime: Math.floor((Date.now() - job.startedAt) / 1000)
      });
      
      return { success: true, jobId: args.jobId };
      
    } catch (error) {
      // Update job with error
      await ctx.db.patch(job._id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now()
      });
      
      throw error;
    }
  }
});

// Get job status
export const getJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.query("proceduralAudioJobs")
      .filter(q => q.eq(q.field("jobId"), args.jobId))
      .first();
    
    return job;
  }
});

// Get user's jobs
export const getUserJobs = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const jobs = await ctx.db.query("proceduralAudioJobs")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
    
    return jobs;
  }
});

// Get active jobs
export const getActiveJobs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const jobs = await ctx.db.query("proceduralAudioJobs")
      .filter(q => q.and(
        q.eq(q.field("userId"), args.userId),
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      ))
      .order("desc");
    
    return jobs;
  }
});

// Delete job
export const deleteJob = mutation({
  args: { jobId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.query("proceduralAudioJobs")
      .filter(q => q.and(
        q.eq(q.field("jobId"), args.jobId),
        q.eq(q.field("userId"), args.userId)
      ))
      .first();
    
    if (job) {
      await ctx.db.delete(job._id);
      return { success: true };
    }
    
    return { success: false, error: "Job not found" };
  }
});