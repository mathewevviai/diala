// frontend/convex/mutations/audioTranscripts.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Creates a new placeholder job record before the file is uploaded.
 * Called by the frontend to initiate the workflow.
 */
export const createJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileFormat: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audioTranscripts", {
      ...args,
      status: "pending",
    });
    console.log(`Created new transcription job: ${args.jobId}`);
  },
});

/**
 * Updates the job status to 'processing'.
 * Called by the backend immediately upon receiving the file upload.
 */
export const startProcessing = mutation({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      console.error(`[startProcessing] Job ${args.jobId} not found`);
      return; // Do not throw error to prevent backend crash
    }

    await ctx.db.patch(job._id, {
      status: "processing",
      processingStartedAt: Date.now(),
    });
  },
});

/**
 * Updates the job with the final result (success or failure).
 * Called by the backend webhook when the transcription task is finished.
 */
export const updateResult = mutation({
  args: {
    jobId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    transcript: v.optional(v.string()),
    error: v.optional(v.string()),
    speakers: v.optional(v.array(v.object({
      speaker: v.string(),
      start: v.number(),
      end: v.number(),
      duration: v.number()
    }))),
    langextract: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("audioTranscripts")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      console.error(`[updateResult] Job ${args.jobId} not found`);
      throw new Error(`Job ${args.jobId} not found`);
    }

    await ctx.db.patch(job._id, {
      status: args.status,
      transcript: args.transcript,
      error: args.error,
      speakers: args.speakers,
      langextract: args.langextract,
      completedAt: Date.now(),
    });

    console.log(`Updated job ${args.jobId} with final result: ${args.status}`);
  },
});
