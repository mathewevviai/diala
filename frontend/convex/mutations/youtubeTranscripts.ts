import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// Public mutation that can be called from Python backend
export const transcriptWebhook = mutation({
  args: {
    jobId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    transcript: v.optional(v.string()),
    videoId: v.optional(v.string()),
    language: v.optional(v.string()),
    userId: v.optional(v.string()),
    error: v.optional(v.string()),
    // New metadata fields
    videoTitle: v.optional(v.string()),
    videoAuthor: v.optional(v.string()),
    videoDuration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status === "completed" && args.transcript && args.videoId && args.userId) {
      // First, update job with metadata
      const job = await ctx.db
        .query("transcriptJobs")
        .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
        .first();
      
      if (job) {
        // Update job with metadata
        await ctx.db.patch(job._id, {
          videoTitle: args.videoTitle,
          videoAuthor: args.videoAuthor,
        });
      }

      // Store the transcript with metadata
      await ctx.scheduler.runAfter(0, internal.youtubeTranscripts.storeTranscript, {
        jobId: args.jobId,
        videoId: args.videoId,
        youtubeUrl: "", // This will be retrieved from the job
        transcript: args.transcript,
        language: args.language || "en",
        userId: args.userId,
        videoTitle: args.videoTitle,
        videoAuthor: args.videoAuthor,
        videoDuration: args.videoDuration,
        thumbnailUrl: args.thumbnailUrl,
      });
    } else if (args.status === "failed") {
      // Update job status to failed
      await ctx.scheduler.runAfter(0, internal.youtubeTranscripts.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        error: args.error || "Unknown error",
      });
    }

    return { success: true };
  },
});