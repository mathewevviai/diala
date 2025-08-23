// frontend/convex/bulkJobs.ts
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Internal mutation to create a new bulk processing job.
 * This is designed to be called from the frontend hook.
 */
export const createJobMutation = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("bulkJobs", {
      jobId: `bulk-${Date.now()}`,
      userId: args.userId,
      jobType: "document-rag",
      status: "pending",
      statusMessage: "Job created. Awaiting file upload.",
      fileName: args.fileName,
      fileSize: args.fileSize,
      createdAt: Date.now(),
    });
    return jobId;
  },
});

/**
 * Internal mutation to update the status and details of a bulk job.
 * This is called by the RAG actions during the processing pipeline.
 */
export const updateStatusMutation = internalMutation({
  args: {
    jobId: v.id("bulkJobs"),
    status: v.union(v.literal("pending"), v.literal("uploading"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    statusMessage: v.optional(v.string()),
    ragEntryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      statusMessage: args.statusMessage,
      ragEntryId: args.ragEntryId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Query to get the status of a specific bulk job.
 * The frontend can subscribe to this query for real-time updates.
 */
export const getJobStatus = query({
  args: { jobId: v.id("bulkJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    return job;
  },
});

/**
 * Query to get all jobs for a specific user.
 */
export const getJobsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bulkJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
