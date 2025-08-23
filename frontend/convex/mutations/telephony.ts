import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a new telephony call
export const createCall = mutation({
  args: {
    callId: v.string(),
    userId: v.string(),
    phoneNumber: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
  },
  handler: async (ctx, args) => {
    const callId = await ctx.db.insert("telephonyCalls", {
      callId: args.callId,
      userId: args.userId,
      phoneNumber: args.phoneNumber,
      direction: args.direction,
      status: "connecting",
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return callId;
  },
});

// Update call status
export const updateCallStatus = mutation({
  args: {
    callId: v.string(),
    status: v.string(),
    updates: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      throw new Error(`Call ${args.callId} not found`);
    }

    const updateData: any = {
      status: args.status,
      updatedAt: new Date().toISOString(),
    };

    if (args.updates) {
      Object.assign(updateData, args.updates);
    }

    await ctx.db.patch(call._id, updateData);
    return { success: true };
  },
});

// Update call with real-time transcript
export const updateCallTranscript = mutation({
  args: {
    callId: v.string(),
    transcript: v.string(),
    sentiment: v.string(),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      throw new Error(`Call ${args.callId} not found`);
    }

    await ctx.db.patch(call._id, {
      currentTranscript: args.transcript,
      currentSentiment: args.sentiment,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Complete call with final results
export const completeCall = mutation({
  args: {
    callId: v.string(),
    finalTranscript: v.string(),
    sentimentAnalysis: v.any(),
    speakerDiarization: v.any(),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      throw new Error(`Call ${args.callId} not found`);
    }

    const startTime = new Date(call.startTime);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await ctx.db.patch(call._id, {
      status: "completed",
      fullTranscript: args.finalTranscript,
      sentimentAnalysis: args.sentimentAnalysis,
      speakerDiarization: args.speakerDiarization,
      endTime: endTime.toISOString(),
      duration,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Create telephony job
export const createJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    callId: v.string(),
    jobType: v.union(
      v.literal("call_start"),
      v.literal("call_process"),
      v.literal("call_end"),
      v.literal("asr_analysis"),
      v.literal("sentiment_analysis")
    ),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    progress: v.object({
      overall: v.number(),
      currentStage: v.number(),
      itemsTotal: v.number(),
      itemsCompleted: v.number(),
      itemsFailed: v.number()
    }),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("telephonyJobs", {
      jobId: args.jobId,
      userId: args.userId,
      callId: args.callId,
      jobType: args.jobType,
      status: args.status,
      progress: args.progress,
      createdAt: new Date().toISOString(),
    });

    return jobId;
  },
});

// Update telephony job
export const updateJob = mutation({
  args: {
    jobId: v.string(),
    status: v.string(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    progress: v.optional(v.object({
      overall: v.number(),
      currentStage: v.number(),
      itemsTotal: v.number(),
      itemsCompleted: v.number(),
      itemsFailed: v.number()
    })),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("telephonyJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Job ${args.jobId} not found`);
    }

    const updateData: any = {
      status: args.status,
    };

    if (args.result !== undefined) {
      updateData.result = args.result;
    }

    if (args.error !== undefined) {
      updateData.error = args.error;
    }

    if (args.progress !== undefined) {
      updateData.progress = args.progress;
    }

    if (args.status === "completed" || args.status === "failed") {
      updateData.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(job._id, updateData);
    return { success: true };
  },
});

// Ingest audio chunk
export const ingestAudioChunk = mutation({
  args: {
    callId: v.string(),
    chunkId: v.string(),
    sequence: v.number(),
    audioData: v.string(),
    format: v.string(),
    sampleRate: v.number(),
    duration: v.number(),
    processed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const chunkId = await ctx.db.insert("audioChunks", {
      callId: args.callId,
      chunkId: args.chunkId,
      sequence: args.sequence,
      audioData: args.audioData,
      format: args.format,
      sampleRate: args.sampleRate,
      duration: args.duration,
      processed: args.processed,
      timestamp: new Date().toISOString(),
    });

    return chunkId;
  },
});

// Update audio chunk
export const updateChunk = mutation({
  args: {
    callId: v.string(),
    chunkId: v.string(),
    transcript: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    speaker: v.optional(v.string()),
    processed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const chunk = await ctx.db
      .query("audioChunks")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("chunkId"), args.chunkId))
      .first();

    if (!chunk) {
      throw new Error(`Chunk ${args.chunkId} not found`);
    }

    const updateData: any = {
      processed: args.processed,
    };

    if (args.transcript !== undefined) {
      updateData.transcript = args.transcript;
    }

    if (args.sentiment !== undefined) {
      updateData.sentiment = args.sentiment;
    }

    if (args.speaker !== undefined) {
      updateData.speaker = args.speaker;
    }

    await ctx.db.patch(chunk._id, updateData);
    return { success: true };
  },
});

// Create GStreamer job
export const createGStreamerJob = mutation({
  args: {
    jobId: v.string(),
    callId: v.string(),
    userId: v.string(),
    pipeline: v.string(),
    port: v.number(),
    codec: v.string(),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("gstreamerJobs", {
      jobId: args.jobId,
      callId: args.callId,
      userId: args.userId,
      pipeline: args.pipeline,
      port: args.port,
      codec: args.codec,
      status: "starting",
      bytesProcessed: 0,
      packetsReceived: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    });

    return jobId;
  },
});

// Update GStreamer job
export const updateGStreamerJob = mutation({
  args: {
    jobId: v.string(),
    status: v.string(),
    bytesProcessed: v.optional(v.number()),
    packetsReceived: v.optional(v.number()),
    errors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("gstreamerJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`GStreamer job ${args.jobId} not found`);
    }

    const updateData: any = {
      status: args.status,
    };

    if (args.bytesProcessed !== undefined) {
      updateData.bytesProcessed = args.bytesProcessed;
    }

    if (args.packetsReceived !== undefined) {
      updateData.packetsReceived = args.packetsReceived;
    }

    if (args.errors !== undefined) {
      updateData.errors = args.errors;
    }

    if (args.status === "completed" || args.status === "error") {
      updateData.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(job._id, updateData);
    return { success: true };
  },
});