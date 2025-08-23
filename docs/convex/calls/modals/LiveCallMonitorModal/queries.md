# LiveCallMonitorModal Queries

## Overview
Query functions for retrieving real-time call data from Convex for the LiveCallMonitorModal component.

## Query Functions

### getLiveCallData
Retrieves complete live call data with all real-time information.

```typescript
// convex/queries/liveCalls.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getLiveCallData = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    // Get live call record
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      return null;
    }
    
    // Get recent transcripts (last 10)
    const recentTranscripts = await ctx.db
      .query("liveTranscripts")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .order("desc")
      .take(10);
    
    // Reverse to get chronological order
    const transcripts = recentTranscripts.reverse().map(t => ({
      timestamp: t.timestamp,
      speaker: t.speaker,
      text: t.text,
      sentiment: t.sentiment,
    }));
    
    // Get call objectives
    const objectives = await ctx.db
      .query("callObjectives")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .collect();
    
    // Get next actions
    const nextActions = await ctx.db
      .query("nextActions")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .collect();
    
    // Get current performance metrics
    const metrics = await ctx.db
      .query("livePerformanceMetrics")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    // Get active coaching recommendations
    const recommendations = await ctx.db
      .query("coachingRecommendations")
      .withIndex("by_call", (q) => 
        q.eq("liveCallId", liveCall._id).eq("isActive", true)
      )
      .take(3);
    
    // Get call phases
    const phases = await ctx.db
      .query("callPhases")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .collect();
    
    // Get system config
    const systemConfig = await ctx.db
      .query("callSystemConfig")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    // Get sentiment analysis
    const sentiment = await ctx.db
      .query("sentimentAnalysis")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    return {
      // Basic call data
      callId: liveCall.callId,
      agentName: liveCall.agentName,
      customerName: liveCall.customerName,
      customerPhone: liveCall.customerPhone,
      status: liveCall.status,
      duration: liveCall.duration,
      campaignName: liveCall.campaignName,
      startTime: liveCall.startTime,
      currentPhase: liveCall.currentPhase,
      isRecording: liveCall.isRecording,
      agentGain: liveCall.agentGain,
      customerGain: liveCall.customerGain,
      currentSpeaker: liveCall.currentSpeaker,
      
      // Recent transcript
      recentTranscript: transcripts,
      
      // Call objectives
      callObjectives: objectives.map(o => o.objective),
      
      // Next actions
      nextActions: nextActions
        .filter(a => a.priority === "immediate" || a.priority === "next")
        .map(a => a.action),
      
      // Performance metrics
      performanceMetrics: metrics ? {
        scriptAdherence: metrics.scriptAdherence,
        agentConfidence: metrics.agentConfidence,
        conversationQuality: metrics.conversationQuality,
        prospectEngagement: metrics.prospectEngagement,
        voiceEnergyLevel: metrics.voiceEnergyLevel,
        responseQuality: metrics.responseQuality,
        questionFrequency: metrics.questionFrequency,
        interestSignals: metrics.interestSignals,
        conversionProbability: metrics.conversionProbability,
        demoAcceptanceProbability: metrics.demoAcceptanceProbability,
        immediateCloseProbability: metrics.immediateCloseProbability,
      } : null,
      
      // Coaching recommendations
      coachingRecommendations: recommendations.map(r => ({
        type: r.type,
        title: r.title,
        description: r.description,
      })),
      
      // Call phases
      callPhases: phases.map(p => ({
        phase: p.phase,
        status: p.status,
        startTime: p.startTime,
        quality: p.quality,
      })),
      
      // System status
      systemConfig: systemConfig ? {
        sipProvider: systemConfig.sipProvider,
        sipStatus: systemConfig.sipStatus,
        sttProvider: systemConfig.sttProvider,
        sttStatus: systemConfig.sttStatus,
        apiLatency: systemConfig.apiLatency,
        errorRate: systemConfig.errorRate,
        totalCost: systemConfig.totalCost,
      } : null,
      
      // Sentiment
      sentimentAnalysis: sentiment ? {
        positivePercentage: sentiment.positivePercentage,
        neutralPercentage: sentiment.neutralPercentage,
        negativePercentage: sentiment.negativePercentage,
        trend: sentiment.trend,
      } : null,
    };
  },
});

// Get all active calls for monitoring dashboard
export const getActiveCalls = query({
  args: {
    agentName: v.optional(v.string()),
    campaignName: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("connecting"),
      v.literal("ringing"),
      v.literal("connected"),
      v.literal("on-hold"),
      v.literal("transferring")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("liveCalls");
    
    // Apply status filter if provided
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    const calls = await query.collect();
    
    // Filter by agent or campaign if provided
    const filteredCalls = calls.filter(call => {
      if (args.agentName && call.agentName !== args.agentName) return false;
      if (args.campaignName && call.campaignName !== args.campaignName) return false;
      return true;
    });
    
    // Enrich with basic metrics
    return Promise.all(filteredCalls.map(async (call) => {
      const metrics = await ctx.db
        .query("livePerformanceMetrics")
        .withIndex("by_call", (q) => q.eq("liveCallId", call._id))
        .first();
      
      const activePhase = await ctx.db
        .query("callPhases")
        .withIndex("by_status", (q) => 
          q.eq("liveCallId", call._id).eq("status", "active")
        )
        .first();
      
      return {
        callId: call.callId,
        agentName: call.agentName,
        customerName: call.customerName,
        customerPhone: call.customerPhone,
        status: call.status,
        duration: call.duration,
        campaignName: call.campaignName,
        currentPhase: activePhase?.phase || call.currentPhase,
        isRecording: call.isRecording,
        prospectEngagement: metrics?.prospectEngagement || 0,
        conversionProbability: metrics?.conversionProbability || 0,
      };
    }));
  },
});

// Subscribe to transcript updates for a specific call
export const subscribeToTranscripts = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      return [];
    }
    
    // Get all transcripts for this call
    const transcripts = await ctx.db
      .query("liveTranscripts")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .collect();
    
    return transcripts.map(t => ({
      timestamp: t.timestamp,
      speaker: t.speaker,
      text: t.text,
      sentiment: t.sentiment,
      isFinal: t.isFinal,
    }));
  },
});

// Get real-time metrics updates
export const subscribeToMetrics = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const liveCall = await ctx.db
      .query("liveCalls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!liveCall) {
      return null;
    }
    
    const metrics = await ctx.db
      .query("livePerformanceMetrics")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    const sentiment = await ctx.db
      .query("sentimentAnalysis")
      .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
      .first();
    
    return {
      performance: metrics,
      sentiment: sentiment,
      agentGain: liveCall.agentGain,
      customerGain: liveCall.customerGain,
      currentSpeaker: liveCall.currentSpeaker,
      duration: liveCall.duration,
    };
  },
});

// Get supervisor action history
export const getSupervisorActions = query({
  args: { 
    callId: v.optional(v.string()),
    supervisorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.callId) {
      const liveCall = await ctx.db
        .query("liveCalls")
        .withIndex("by_callId", (q) => q.eq("callId", args.callId))
        .first();
      
      if (!liveCall) return [];
      
      return await ctx.db
        .query("supervisorActions")
        .withIndex("by_call", (q) => q.eq("liveCallId", liveCall._id))
        .take(args.limit || 20);
    }
    
    if (args.supervisorId) {
      return await ctx.db
        .query("supervisorActions")
        .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
        .take(args.limit || 20);
    }
    
    return [];
  },
});

// Get coaching recommendations for active calls
export const getActiveCoachingRecommendations = query({
  args: { priority: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const activeCalls = await ctx.db
      .query("liveCalls")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();
    
    const recommendations = await Promise.all(
      activeCalls.map(async (call) => {
        const recs = await ctx.db
          .query("coachingRecommendations")
          .withIndex("by_call", (q) => 
            q.eq("liveCallId", call._id).eq("isActive", true)
          )
          .collect();
        
        return recs
          .filter(r => !args.priority || r.priority >= args.priority)
          .map(r => ({
            ...r,
            callId: call.callId,
            agentName: call.agentName,
          }));
      })
    );
    
    return recommendations
      .flat()
      .sort((a, b) => b.priority - a.priority);
  },
});

// Get system health across all active calls
export const getSystemHealth = query({
  handler: async (ctx) => {
    const activeCalls = await ctx.db
      .query("liveCalls")
      .collect();
    
    const activeCallIds = activeCalls
      .filter(c => ["connected", "ringing", "on-hold"].includes(c.status))
      .map(c => c._id);
    
    const systemConfigs = await Promise.all(
      activeCallIds.map(id => 
        ctx.db
          .query("callSystemConfig")
          .withIndex("by_call", (q) => q.eq("liveCallId", id))
          .first()
      )
    );
    
    // Calculate aggregate health metrics
    const validConfigs = systemConfigs.filter(Boolean);
    const avgLatency = validConfigs.length > 0
      ? validConfigs.reduce((sum, c) => sum + c!.apiLatency, 0) / validConfigs.length
      : 0;
    
    const avgErrorRate = validConfigs.length > 0
      ? validConfigs.reduce((sum, c) => sum + c!.errorRate, 0) / validConfigs.length
      : 0;
    
    const totalQueueDepth = validConfigs.reduce((sum, c) => sum + c!.queueDepth, 0);
    
    const serviceStatus = {
      sip: validConfigs.every(c => c!.sipStatus === "connected"),
      stt: validConfigs.every(c => c!.sttStatus === "streaming"),
      llm: validConfigs.every(c => c!.llmStatus === "active"),
      tts: validConfigs.every(c => c!.ttsStatus === "active"),
    };
    
    return {
      activeCalls: activeCallIds.length,
      avgLatency,
      avgErrorRate,
      totalQueueDepth,
      serviceStatus,
      totalCostPerMinute: validConfigs.reduce((sum, c) => sum + c!.costPerMinute, 0),
    };
  },
});
```

## Usage Examples

### Real-time Call Monitoring

```typescript
// In your LiveCallMonitorModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function LiveCallMonitorModal({ callId }: { callId: string }) {
  // Subscribe to live call data
  const liveCallData = useQuery(
    api.queries.liveCalls.getLiveCallData, 
    { callId }
  );
  
  // Subscribe to transcript updates
  const transcripts = useQuery(
    api.queries.liveCalls.subscribeToTranscripts,
    { callId }
  );
  
  // Subscribe to metrics
  const metrics = useQuery(
    api.queries.liveCalls.subscribeToMetrics,
    { callId }
  );
  
  // Convex will automatically update when data changes
  
  return (
    <div>
      {/* Render live call interface */}
    </div>
  );
}
```

### Supervisor Dashboard

```typescript
// Monitor multiple active calls
function SupervisorDashboard() {
  const activeCalls = useQuery(
    api.queries.liveCalls.getActiveCalls,
    { status: "connected" }
  );
  
  const systemHealth = useQuery(
    api.queries.liveCalls.getSystemHealth
  );
  
  const coachingAlerts = useQuery(
    api.queries.liveCalls.getActiveCoachingRecommendations,
    { priority: 7 } // High priority only
  );
  
  return (
    <div>
      {/* Render supervisor interface */}
    </div>
  );
}
```

## Performance Considerations

1. **Real-time Updates**: Use Convex subscriptions for automatic updates
2. **Data Limiting**: Limit transcript history to recent entries
3. **Filtering**: Use indexes for efficient status/agent filtering
4. **Aggregation**: Pre-calculate metrics where possible