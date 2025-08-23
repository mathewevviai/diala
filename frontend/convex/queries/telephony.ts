import { query } from "../_generated/server";
import { v } from "convex/values";

// Get call by ID
export const getCall = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    return call;
  },
});

// Get calls for user
export const getUserCalls = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("telephonyCalls");
    
    if (args.status) {
      query = query.withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", args.status)
      );
    } else {
      query = query.withIndex("by_user", (q) => q.eq("userId", args.userId));
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.order("desc").collect();
  },
});

// Get active calls
export const getActiveCalls = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("telephonyCalls")
      .withIndex("by_status", (q) => q.eq("status", "connected"));

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get audio chunks for call
export const getAudioChunks = query({
  args: { 
    callId: v.string(),
    limit: v.optional(v.number()),
    processed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("audioChunks");
    
    if (args.processed !== undefined) {
      query = query.withIndex("by_processed", (q) => 
        q.eq("callId", args.callId).eq("processed", args.processed)
      );
    } else {
      query = query.withIndex("by_call", (q) => q.eq("callId", args.callId));
    }

    if (args.limit) {
      return await query.order("desc").take(args.limit);
    }

    return await query.order("desc").collect();
  },
});

// Get real-time transcript
export const getRealtimeTranscript = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      return null;
    }

    const chunks = await ctx.db
      .query("audioChunks")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .order("desc")
      .take(10);

    return {
      call,
      currentTranscript: call.currentTranscript,
      currentSentiment: call.currentSentiment,
      speakerLabels: call.speakerLabels,
      recentChunks: chunks,
    };
  },
});

// Get telephony job
export const getJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("telephonyJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    return job;
  },
});

// Get jobs for call
export const getCallJobs = query({
  args: { 
    callId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("telephonyJobs");
    
    if (args.status) {
      query = query.withIndex("by_call", (q) => 
        q.eq("callId", args.callId)
      );
      // Filter by status in memory since we can't use compound indexes
      const jobs = await query.collect();
      return jobs.filter(job => job.status === args.status);
    } else {
      query = query.withIndex("by_call", (q) => q.eq("callId", args.callId));
    }

    if (args.limit) {
      return await query.order("desc").take(args.limit);
    }

    return await query.order("desc").collect();
  },
});

// Get GStreamer job
export const getGStreamerJob = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("gstreamerJobs")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    return job;
  },
});

// Get call statistics
export const getCallStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === "completed").length;
    const failedCalls = calls.filter(c => c.status === "failed").length;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      totalDuration,
      averageDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
    };
  },
});

// Get recent calls with transcripts
export const getRecentCallsWithTranscripts = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const calls = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const callsWithTranscripts = [];
    
    for (const call of calls) {
      const chunks = await ctx.db
        .query("audioChunks")
        .withIndex("by_call", (q) => q.eq("callId", call.callId))
        .order("desc")
        .take(5);

      callsWithTranscripts.push({
        ...call,
        recentChunks: chunks,
      });
    }

    return callsWithTranscripts;
  },
});