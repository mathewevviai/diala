import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation to create a job
export const createJob = internalMutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    youtubeUrl: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("transcriptJobs", {
      jobId: args.jobId,
      userId: args.userId,
      youtubeUrl: args.youtubeUrl,
      videoId: args.videoId,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

// Internal mutation to update job status
export const updateJobStatus = internalMutation({
  args: {
    jobId: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("transcriptJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error("Job not found");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.error) {
      updates.error = args.error;
    }

    if (args.status === "completed") {
      updates.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(job._id, updates);
  },
});

// Internal mutation to store transcript
export const storeTranscript = internalMutation({
  args: {
    jobId: v.string(),
    videoId: v.string(),
    youtubeUrl: v.string(),
    transcript: v.string(),
    language: v.string(),
    userId: v.string(),
    // New metadata fields
    videoTitle: v.optional(v.string()),
    videoAuthor: v.optional(v.string()),
    videoDuration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate word count
    const wordCount = args.transcript.split(/\s+/).filter(word => word.length > 0).length;

    // Get the job to get the URL
    const job = await ctx.db
      .query("transcriptJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    // Store transcript with metadata
    await ctx.db.insert("youtubeTranscripts", {
      videoId: args.videoId,
      youtubeUrl: job?.youtubeUrl || args.youtubeUrl,
      transcript: args.transcript,
      language: args.language,
      wordCount,
      createdAt: new Date().toISOString(),
      userId: args.userId,
      videoTitle: args.videoTitle,
      videoAuthor: args.videoAuthor,
      videoDuration: args.videoDuration,
      thumbnailUrl: args.thumbnailUrl,
    });

    // Update job status
    await updateJobStatus(ctx, {
      jobId: args.jobId,
      status: "completed",
    });
  },
});

// Internal query to get transcript by video ID
export const getTranscriptByVideoId = internalQuery({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("youtubeTranscripts")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .first();
  },
});

// Internal query to get job
export const getJob = internalQuery({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcriptJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});