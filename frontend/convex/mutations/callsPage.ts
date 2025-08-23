import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Update agent status
export const updateAgentStatus = mutation({
  args: {
    agentId: v.id("voiceAgents"),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("offline"),
      v.literal("configuring"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(args.agentId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
      ...(args.status === "active" ? { lastActiveAt: new Date().toISOString() } : {}),
    });

    return { success: true };
  },
});

// Create a new live call entry
export const createLiveCall = mutation({
  args: {
    callId: v.string(),
    agentId: v.id("voiceAgents"),
    customerName: v.string(),
    customerPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const liveCallId = await ctx.db.insert("liveCalls", {
      callId: args.callId,
      agentId: args.agentId,
      agentName: agent.name,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      startTime: new Date().toISOString(),
      duration: "0s",
      status: "connecting",
      sentiment: "neutral",
      lastTranscriptUpdate: new Date().toISOString(),
      isRecording: true,
    });

    // Update agent status to active
    await ctx.db.patch(args.agentId, {
      status: "active",
      lastActiveAt: new Date().toISOString(),
    });

    return { liveCallId };
  },
});

// Update live call status
export const updateLiveCall = mutation({
  args: {
    callId: v.string(),
    status: v.optional(v.union(
      v.literal("connecting"),
      v.literal("active"),
      v.literal("hold"),
      v.literal("transferring")
    )),
    sentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    )),
    duration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("callId"), args.callId))
      .first();

    if (!liveCall) {
      throw new Error("Live call not found");
    }

    const updates: any = {
      lastTranscriptUpdate: new Date().toISOString(),
    };

    if (args.status) updates.status = args.status;
    if (args.sentiment) updates.sentiment = args.sentiment;
    if (args.duration) updates.duration = args.duration;

    await ctx.db.patch(liveCall._id, updates);

    return { success: true };
  },
});

// End a live call and create analytics record
export const endLiveCall = mutation({
  args: {
    callId: v.string(),
    status: v.union(
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("TRANSFERRED"),
      v.literal("ABANDONED")
    ),
    resolution: v.union(
      v.literal("RESOLVED"),
      v.literal("UNRESOLVED"),
      v.literal("ESCALATED"),
      v.literal("TRANSFERRED")
    ),
    sentiment: v.union(
      v.literal("POSITIVE"),
      v.literal("NEGATIVE"),
      v.literal("NEUTRAL"),
      v.literal("MIXED")
    ),
    qualityScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Find and remove the live call
    const liveCall = await ctx.db
      .query("liveCalls")
      .filter(q => q.eq(q.field("callId"), args.callId))
      .first();

    if (!liveCall) {
      throw new Error("Live call not found");
    }

    // Create call analytics record
    const analyticsId = await ctx.db.insert("callAnalytics", {
      callId: args.callId,
      agentName: liveCall.agentName,
      agentId: liveCall.agentId,
      customerName: liveCall.customerName,
      customerPhone: liveCall.customerPhone,
      status: args.status,
      startTime: liveCall.startTime,
      endTime: new Date().toISOString(),
      duration: liveCall.duration,
      queueTime: "0s", // This would be calculated from actual queue time
      holdTime: "0s", // This would be calculated from hold events
      resolution: args.resolution,
      hasTransfer: args.resolution === "TRANSFERRED",
      sentiment: args.sentiment,
      qualityScore: `${args.qualityScore}/10`,
      campaignName: "General", // This would come from actual campaign assignment
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create agent call log
    await ctx.db.insert("agentCallLogs", {
      agentId: liveCall.agentId,
      callId: args.callId,
      phoneNumber: liveCall.customerPhone,
      direction: "inbound", // This would be determined by actual call direction
      startTime: liveCall.startTime,
      endTime: new Date().toISOString(),
      duration: parseDurationToSeconds(liveCall.duration),
      status: args.status === "COMPLETED" ? "completed" : "failed",
      sentimentScore: sentimentToScore(args.sentiment),
      satisfactionRating: args.qualityScore,
      webhookSent: false,
    });

    // Delete the live call record
    await ctx.db.delete(liveCall._id);

    // Update agent metrics
    const agent = await ctx.db.get(liveCall.agentId);
    if (agent) {
      const newTotalCalls = agent.totalCalls + 1;
      const newSuccessRate = args.status === "COMPLETED" 
        ? ((agent.successRate * agent.totalCalls + 100) / newTotalCalls)
        : ((agent.successRate * agent.totalCalls) / newTotalCalls);

      await ctx.db.patch(liveCall.agentId, {
        totalCalls: newTotalCalls,
        successRate: Math.round(newSuccessRate),
        updatedAt: new Date().toISOString(),
      });
    }

    return { analyticsId };
  },
});

// Add transcript entry
export const addTranscriptEntry = mutation({
  args: {
    callId: v.string(),
    speaker: v.union(v.literal("agent"), v.literal("customer"), v.literal("system")),
    content: v.string(),
    timestamp: v.string(),
    sentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    )),
  },
  handler: async (ctx, args) => {
    // Get the current count for ordering
    const existingEntries = await ctx.db
      .query("transcriptEntries")
      .withIndex("by_call", q => q.eq("callId", args.callId))
      .collect();

    const transcriptId = await ctx.db.insert("transcriptEntries", {
      callId: args.callId,
      timestamp: args.timestamp,
      speaker: args.speaker,
      content: args.content,
      sentiment: args.sentiment,
      order: existingEntries.length,
    });

    return { transcriptId };
  },
});

// Update phone number statistics
export const updatePhoneNumberStats = mutation({
  args: {
    phoneNumberId: v.id("phoneNumbers"),
    incrementCalls: v.optional(v.boolean()),
    updateLastUsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const phoneNumber = await ctx.db.get(args.phoneNumberId);
    if (!phoneNumber) {
      throw new Error("Phone number not found");
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (args.incrementCalls) {
      updates.callsToday = phoneNumber.callsToday + 1;
      updates.callsThisWeek = phoneNumber.callsThisWeek + 1;
      updates.callsThisMonth = phoneNumber.callsThisMonth + 1;
    }

    if (args.updateLastUsed) {
      updates.lastUsed = new Date().toISOString();
    }

    await ctx.db.patch(args.phoneNumberId, updates);

    return { success: true };
  },
});

// Helper functions
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/(\d+)m\s+(\d+)s/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  
  const secondsMatch = duration.match(/(\d+)s/);
  if (secondsMatch) {
    return parseInt(secondsMatch[1]);
  }
  
  return 0;
}

function sentimentToScore(sentiment: string): number {
  switch (sentiment) {
    case "POSITIVE": return 0.8;
    case "NEGATIVE": return 0.2;
    case "NEUTRAL": return 0.5;
    case "MIXED": return 0.5;
    default: return 0.5;
  }
}