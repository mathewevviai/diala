import { query } from "../_generated/server";
import { v } from "convex/values";

// Get a transcription job by ID
export const getJob = query({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    return job;
  },
});

// Get all jobs for a user
export const getUserJobs = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const jobs = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return jobs;
  },
});

// Get user's active jobs
export const getActiveJobs = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      )
      .order("desc")
      .collect();
    
    return jobs;
  },
});

// Get transcription statistics for a user
export const getUserStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const stats = {
      total: jobs.length,
      completed: jobs.filter(j => j.status === "completed").length,
      failed: jobs.filter(j => j.status === "failed").length,
      processing: jobs.filter(j => j.status === "processing" || j.status === "pending").length,
      totalSize: jobs.reduce((sum, j) => sum + (j.fileSize || 0), 0),
    };
    
    return stats;
  },
});

// Check if user can create a new transcription (rate limiting)
export const canCreateTranscription = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get jobs created in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentJobs = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.gte(q.field("createdAt"), oneHourAgo.toISOString())
      )
      .collect();
    
    // Free tier limit: 10 transcriptions per hour
    const limit = 10;
    const remaining = Math.max(0, limit - recentJobs.length);
    
    return {
      canCreate: recentJobs.length < limit,
      remaining,
      limit,
      resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000).toISOString(),
    };
  },
});