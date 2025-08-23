# LiveCallMonitorModal Mutations

## Overview
Mutation functions for managing live call data and real-time updates in Convex.

## Mutation Functions

### startLiveCall
Initiates a new live call session.

```typescript
// convex/mutations/liveCalls.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const startLiveCall = mutation({
  args: {
    callId: v.string(),
    agentName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    campaignName: v.string(),
    sessionId: v.string(),
    sipEndpoint: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create live call record
    const liveCallId = await ctx.db.insert("liveCalls", {
      callId: args.callId,
      agentName: args.agentName,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      status: "connecting",
      startTime: new Date().toISOString(),
      duration: 0,
      currentPhase: "Connecting",
      campaignId: args.campaignId,
      campaignName: args.campaignName,
      isRecording: false,
      agentGain: 50,
      customerGain: 50,
      currentSpeaker: null,
      sipEndpoint: args.sipEndpoint,
      sessionId: args.sessionId,
      createdAt: now,
      updatedAt: now,
    });
    
    // Initialize call objectives based on campaign type
    const defaultObjectives = [
      "Identify decision makers in target companies",
      "Present value proposition effectively",
      "Handle common objections professionally",
      "Schedule qualified product demonstrations",
      "Maintain conversation flow and rapport",
    ];
    
    await Promise.all(
      defaultObjectives.map((objective, index) =>
        ctx.db.insert("callObjectives", {
          liveCallId,
          objective,
          status: "pending",
          order: index,
        })
      )
    );
    
    // Initialize performance metrics
    await ctx.db.insert("livePerformanceMetrics", {
      liveCallId,
      scriptAdherence: 100,
      agentConfidence: 85,
      conversationQuality: 90,
      prospectEngagement: 50,
      voiceEnergyLevel: "MEDIUM",
      responseQuality: "GOOD",
      questionFrequency: "MEDIUM",
      interestSignals: "MODERATE",
      conversionProbability: 50,
      demoAcceptanceProbability: 50,
      immediateCloseProbability: 20,
      updatedAt: now,
    });
    
    // Initialize sentiment analysis
    await ctx.db.insert("sentimentAnalysis", {
      liveCallId,
      positivePercentage: 33,
      neutralPercentage: 67,
      negativePercentage: 0,
      trend: "stable",
      updatedAt: now,
    });
    
    // Initialize call phases
    const callPhases = [
      { phase: "Opening", order: 0 },
      { phase: "Discovery", order: 1 },
      { phase: "Value Proposition", order: 2 },
      { phase: "Objection Handling", order: 3 },
      { phase: "Closing", order: 4 },
    ];
    
    await Promise.all(
      callPhases.map((phase) =>
        ctx.db.insert("callPhases", {
          liveCallId,
          phase: phase.phase,
          status: phase.order === 0 ? "active" : "pending",
          order: phase.order,
        })
      )
    );
    
    // Initialize system config
    await ctx.db.insert("callSystemConfig", {
      liveCallId,
      sipProvider: "Telnyx",
      sttProvider: "Deepgram",
      llmProvider: "OpenAI GPT-4",
      ttsProvider: "ElevenLabs",
      sipStatus: "connected",
      sttStatus: "streaming",
      llmStatus: "active",
      ttsStatus: "active",
      apiLatency: 0,
      errorRate: 0,
      queueDepth: 0,
      costPerMinute: 0.0298,
      totalCost: 0,
      updatedAt: now,
    });
    
    return liveCallId;
  },
});

// Update call status
export const updateCallStatus = mutation({
  args: {
    callId: v.string(),
    status: v.union(
      v.literal("connecting"),
      v.literal("ringing"),
      v.literal("connected"),
      v.literal("on-hold"),
      v.literal("transferring")
    ),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    await ctx.db.patch(liveCall._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    // Update phase if connected
    if (args.status === "connected") {
      const firstPhase = await ctx.db
        .query("callPhases")
        .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
        .first();
      
      if (firstPhase && firstPhase.status === "pending") {
        await ctx.db.patch(firstPhase._id, {
          status: "active",
          startTime: new Date().toISOString(),
        });
      }
    }
  },
});

// Add transcript entry
export const addTranscriptEntry = mutation({
  args: {
    callId: v.string(),
    timestamp: v.string(),
    speaker: v.union(v.literal("agent"), v.literal("customer")),
    text: v.string(),
    sentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    )),
    confidence: v.optional(v.number()),
    isFinal: v.boolean(),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    // Get existing transcript count for ordering
    const existingCount = await ctx.db
      .query("liveTranscripts")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .collect();
    
    await ctx.db.insert("liveTranscripts", {
      liveCallId: liveCall._id,
      timestamp: args.timestamp,
      speaker: args.speaker,
      text: args.text,
      sentiment: args.sentiment,
      confidence: args.confidence,
      isFinal: args.isFinal,
      order: existingCount.length,
      createdAt: Date.now(),
    });
    
    // Update current speaker
    await ctx.db.patch(liveCall._id, {
      currentSpeaker: args.speaker,
      updatedAt: Date.now(),
    });
    
    // Update sentiment analysis if sentiment provided
    if (args.sentiment && args.isFinal) {
      await updateSentimentAnalysis(ctx, liveCall._id, args.sentiment);
    }
  },
});

// Helper function to update sentiment
async function updateSentimentAnalysis(
  ctx: any,
  liveCallId: string,
  newSentiment: "positive" | "negative" | "neutral"
) {
  const sentiment = await ctx.db
    .query("sentimentAnalysis")
    .withIndex("by_call", (q) => q.eq("liveCallId", liveCallId))
    .first();
  
  if (!sentiment) return;
  
  // Simple rolling average (would be more sophisticated in production)
  const weight = 0.1; // Weight of new sentiment
  let positive = sentiment.positivePercentage;
  let neutral = sentiment.neutralPercentage;
  let negative = sentiment.negativePercentage;
  
  if (newSentiment === "positive") {
    positive = positive * (1 - weight) + 100 * weight;
    neutral = neutral * (1 - weight);
    negative = negative * (1 - weight);
  } else if (newSentiment === "neutral") {
    positive = positive * (1 - weight);
    neutral = neutral * (1 - weight) + 100 * weight;
    negative = negative * (1 - weight);
  } else {
    positive = positive * (1 - weight);
    neutral = neutral * (1 - weight);
    negative = negative * (1 - weight) + 100 * weight;
  }
  
  // Determine trend
  const oldAverage = sentiment.positivePercentage - sentiment.negativePercentage;
  const newAverage = positive - negative;
  const trend = newAverage > oldAverage + 5 ? "improving" :
                newAverage < oldAverage - 5 ? "declining" : "stable";
  
  await ctx.db.patch(sentiment._id, {
    positivePercentage: Math.round(positive),
    neutralPercentage: Math.round(neutral),
    negativePercentage: Math.round(negative),
    trend,
    lastPositiveMoment: newSentiment === "positive" ? new Date().toISOString() : sentiment.lastPositiveMoment,
    lastNegativeMoment: newSentiment === "negative" ? new Date().toISOString() : sentiment.lastNegativeMoment,
    updatedAt: Date.now(),
  });
}

// Update performance metrics
export const updatePerformanceMetrics = mutation({
  args: {
    callId: v.string(),
    metrics: v.object({
      scriptAdherence: v.optional(v.number()),
      agentConfidence: v.optional(v.number()),
      conversationQuality: v.optional(v.number()),
      prospectEngagement: v.optional(v.number()),
      voiceEnergyLevel: v.optional(v.union(
        v.literal("LOW"),
        v.literal("MEDIUM"),
        v.literal("HIGH")
      )),
      responseQuality: v.optional(v.union(
        v.literal("POOR"),
        v.literal("FAIR"),
        v.literal("GOOD"),
        v.literal("EXCELLENT")
      )),
      conversionProbability: v.optional(v.number()),
      demoAcceptanceProbability: v.optional(v.number()),
    }),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    const metrics = await ctx.db
      .query("livePerformanceMetrics")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    if (!metrics) {
      throw new Error("Performance metrics not found");
    }
    
    await ctx.db.patch(metrics._id, {
      ...args.metrics,
      updatedAt: Date.now(),
    });
  },
});

// Update call duration and audio levels
export const updateCallProgress = mutation({
  args: {
    callId: v.string(),
    duration: v.number(),
    agentGain: v.optional(v.number()),
    customerGain: v.optional(v.number()),
    currentPhase: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    const updates: any = {
      duration: args.duration,
      updatedAt: Date.now(),
    };
    
    if (args.agentGain !== undefined) updates.agentGain = args.agentGain;
    if (args.customerGain !== undefined) updates.customerGain = args.customerGain;
    if (args.currentPhase !== undefined) updates.currentPhase = args.currentPhase;
    
    await ctx.db.patch(liveCall._id, updates);
    
    // Update system cost
    const systemConfig = await ctx.db
      .query("callSystemConfig")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    if (systemConfig) {
      const totalCost = (args.duration / 60) * systemConfig.costPerMinute;
      await ctx.db.patch(systemConfig._id, {
        totalCost,
        updatedAt: Date.now(),
      });
    }
  },
});

// Add supervisor action
export const addSupervisorAction = mutation({
  args: {
    callId: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string(),
    action: v.union(
      v.literal("COACH_AGENT"),
      v.literal("JOIN_CALL"),
      v.literal("TRANSFER_CALL"),
      v.literal("END_CALL"),
      v.literal("ADD_NOTE"),
      v.literal("BOOKMARK_MOMENT"),
      v.literal("FLAG_FOR_REVIEW")
    ),
    details: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    const existingActions = await ctx.db
      .query("supervisorActions")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .collect();
    
    await ctx.db.insert("supervisorActions", {
      liveCallId: liveCall._id,
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      action: args.action,
      details: args.details,
      timestamp: new Date().toISOString(),
      order: existingActions.length,
    });
    
    // Handle specific actions
    if (args.action === "END_CALL") {
      await endLiveCall(ctx, args.callId);
    } else if (args.action === "TRANSFER_CALL") {
      await ctx.db.patch(liveCall._id, {
        status: "transferring",
        updatedAt: Date.now(),
      });
    }
  },
});

// Add coaching recommendation
export const addCoachingRecommendation = mutation({
  args: {
    callId: v.string(),
    type: v.union(v.literal("positive"), v.literal("warning"), v.literal("suggestion")),
    title: v.string(),
    description: v.string(),
    priority: v.number(), // 1-10
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    await ctx.db.insert("coachingRecommendations", {
      liveCallId: liveCall._id,
      type: args.type,
      title: args.title,
      description: args.description,
      priority: args.priority,
      timestamp: new Date().toISOString(),
      isActive: true,
    });
  },
});

// Update call phase
export const updateCallPhase = mutation({
  args: {
    callId: v.string(),
    phase: v.string(),
    quality: v.optional(v.union(
      v.literal("poor"),
      v.literal("fair"),
      v.literal("good"),
      v.literal("excellent")
    )),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    // Complete current phase
    const currentPhase = await ctx.db
      .query("callPhases")
      .withIndex("by_status", (q) => 
        q.eq("liveCallId", liveCall._id).eq("status", "active")
      )
      .first();
    
    if (currentPhase) {
      await ctx.db.patch(currentPhase._id, {
        status: "completed",
        endTime: new Date().toISOString(),
        quality: args.quality,
      });
    }
    
    // Activate new phase
    const newPhase = await ctx.db
      .query("callPhases")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .filter((q) => q.eq(q.field("phase"), args.phase))
      .first();
    
    if (newPhase) {
      await ctx.db.patch(newPhase._id, {
        status: "active",
        startTime: new Date().toISOString(),
      });
    }
    
    // Update current phase in live call
    await ctx.db.patch(liveCall._id, {
      currentPhase: args.phase,
      updatedAt: Date.now(),
    });
  },
});

// Toggle recording
export const toggleRecording = mutation({
  args: {
    callId: v.string(),
    isRecording: v.boolean(),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    await ctx.db.patch(liveCall._id, {
      isRecording: args.isRecording,
      recordingStartTime: args.isRecording ? new Date().toISOString() : undefined,
      updatedAt: Date.now(),
    });
  },
});

// End live call
async function endLiveCall(ctx: any, callId: string) {
  const liveCall = await ctx.db
    .query("liveCalls")
    .withIndex("by_callId", (q) => q.eq("callId", callId))
    .first();
  
  if (!liveCall) return;
  
  // Mark all active recommendations as inactive
  const activeRecs = await ctx.db
    .query("coachingRecommendations")
    .withIndex("by_call", (q) => 
      q.eq("liveCallId", liveCall._id).eq("isActive", true)
    )
    .collect();
  
  await Promise.all(
    activeRecs.map(rec => 
      ctx.db.patch(rec._id, { isActive: false })
    )
  );
  
  // Complete any active phases
  const activePhase = await ctx.db
    .query("callPhases")
    .withIndex("by_status", (q) => 
      q.eq("liveCallId", liveCall._id).eq("status", "active")
    )
    .first();
  
  if (activePhase) {
    await ctx.db.patch(activePhase._id, {
      status: "completed",
      endTime: new Date().toISOString(),
    });
  }
  
  // Note: In production, you would also:
  // 1. Transfer data to callAnalytics table
  // 2. Clean up live data after a delay
  // 3. Generate final reports
  // 4. Trigger post-call workflows
}

// Update system configuration status
export const updateSystemStatus = mutation({
  args: {
    callId: v.string(),
    service: v.union(
      v.literal("sip"),
      v.literal("stt"),
      v.literal("llm"),
      v.literal("tts")
    ),
    status: v.union(
      v.literal("connected"),
      v.literal("streaming"),
      v.literal("active"),
      v.literal("error")
    ),
    latency: v.optional(v.number()),
    errorRate: v.optional(v.number()),
  },
  
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      throw new Error("Live call not found");
    }
    
    const systemConfig = await ctx.db
      .query("callSystemConfig")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    if (!systemConfig) {
      throw new Error("System config not found");
    }
    
    const updates: any = { updatedAt: Date.now() };
    
    // Update specific service status
    if (args.service === "sip") updates.sipStatus = args.status;
    else if (args.service === "stt") updates.sttStatus = args.status;
    else if (args.service === "llm") updates.llmStatus = args.status;
    else if (args.service === "tts") updates.ttsStatus = args.status;
    
    if (args.latency !== undefined) updates.apiLatency = args.latency;
    if (args.errorRate !== undefined) updates.errorRate = args.errorRate;
    
    await ctx.db.patch(systemConfig._id, updates);
  },
});
```

## Usage Examples

### Starting a Live Call

```typescript
// In your call initiation handler
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function useStartCall() {
  const startCall = useMutation(api.mutations.liveCalls.startLiveCall);
  
  const initiateCall = async (callData: {
    customerName: string;
    customerPhone: string;
    agentName: string;
    campaignName: string;
  }) => {
    const callId = generateCallId();
    const sessionId = generateSessionId();
    
    await startCall({
      callId,
      sessionId,
      ...callData,
    });
    
    return callId;
  };
  
  return { initiateCall };
}
```

### Real-time Transcript Updates

```typescript
// In your WebSocket handler
const addTranscript = useMutation(api.mutations.liveCalls.addTranscriptEntry);

websocket.on('transcript', async (data) => {
  await addTranscript({
    callId: data.callId,
    timestamp: formatTimestamp(data.timestamp),
    speaker: data.speaker,
    text: data.text,
    sentiment: data.sentiment,
    confidence: data.confidence,
    isFinal: data.isFinal,
  });
});
```

## Best Practices

1. **Real-time Performance**: Keep mutations lightweight for low latency
2. **Error Handling**: Always validate call existence before updates
3. **State Consistency**: Update related records in logical groups
4. **Cost Tracking**: Update cost calculations with each duration update
5. **Cleanup**: Implement proper cleanup when calls end