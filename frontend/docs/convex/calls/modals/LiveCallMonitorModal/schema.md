# LiveCallMonitorModal Schema

## Overview
The LiveCallMonitorModal displays real-time information about ongoing calls, including live transcripts, performance metrics, and supervisor controls.

## Schema Definitions

### liveCalls
Main table for storing active call sessions.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Live call sessions
  liveCalls: defineTable({
    // Basic Information
    callId: v.string(),
    agentName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    
    // Call Status
    status: v.union(
      v.literal("connecting"),
      v.literal("ringing"),
      v.literal("connected"),
      v.literal("on-hold"),
      v.literal("transferring")
    ),
    
    // Call Progress
    startTime: v.string(), // ISO timestamp
    duration: v.number(), // seconds
    currentPhase: v.string(), // "Pitch Delivery", "Discovery", etc.
    
    // Campaign Info
    campaignId: v.optional(v.id("campaigns")),
    campaignName: v.string(),
    
    // Recording Status
    isRecording: v.boolean(),
    recordingStartTime: v.optional(v.string()),
    
    // Audio Levels (0-100)
    agentGain: v.number(),
    customerGain: v.number(),
    currentSpeaker: v.optional(v.union(
      v.literal("agent"),
      v.literal("customer")
    )),
    
    // System Info
    sipEndpoint: v.optional(v.string()),
    sessionId: v.string(),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_callId", ["callId"])
    .index("by_status", ["status"])
    .index("by_agent", ["agentName"])
    .index("by_session", ["sessionId"]),

  // Live transcript entries
  liveTranscripts: defineTable({
    liveCallId: v.id("liveCalls"),
    timestamp: v.string(), // Time in call "2:15"
    speaker: v.union(v.literal("agent"), v.literal("customer")),
    text: v.string(),
    sentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    )),
    confidence: v.optional(v.number()), // STT confidence 0-1
    isFinal: v.boolean(), // Is this a final transcript or interim
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_call", ["liveCallId", "order"])
    .index("by_timestamp", ["liveCallId", "createdAt"]),

  // Call objectives tracking
  callObjectives: defineTable({
    liveCallId: v.id("liveCalls"),
    objective: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    completedAt: v.optional(v.string()),
    order: v.number(),
  })
    .index("by_call", ["liveCallId", "order"])
    .index("by_status", ["liveCallId", "status"]),

  // AI suggested next actions
  nextActions: defineTable({
    liveCallId: v.id("liveCalls"),
    action: v.string(),
    priority: v.union(
      v.literal("immediate"),
      v.literal("next"),
      v.literal("follow-up")
    ),
    reason: v.string(),
    suggestedAt: v.string(),
    order: v.number(),
  })
    .index("by_call", ["liveCallId", "priority", "order"]),

  // Real-time performance metrics
  livePerformanceMetrics: defineTable({
    liveCallId: v.id("liveCalls"),
    
    // Script adherence
    scriptAdherence: v.number(), // 0-100
    
    // Confidence levels
    agentConfidence: v.number(), // 0-100
    
    // Quality metrics
    conversationQuality: v.number(), // 0-100
    
    // Engagement
    prospectEngagement: v.number(), // 0-100
    
    // Voice metrics
    voiceEnergyLevel: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH")
    ),
    responseQuality: v.union(
      v.literal("POOR"),
      v.literal("FAIR"),
      v.literal("GOOD"),
      v.literal("EXCELLENT")
    ),
    
    // Interest indicators
    questionFrequency: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH")
    ),
    interestSignals: v.union(
      v.literal("WEAK"),
      v.literal("MODERATE"),
      v.literal("STRONG")
    ),
    
    // Predictions
    conversionProbability: v.number(), // 0-100
    demoAcceptanceProbability: v.number(), // 0-100
    immediateCloseProbability: v.number(), // 0-100
    
    updatedAt: v.number(),
  })
    .index("by_call", ["liveCallId"]),

  // Supervisor interventions
  supervisorActions: defineTable({
    liveCallId: v.id("liveCalls"),
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
    timestamp: v.string(),
    order: v.number(),
  })
    .index("by_call", ["liveCallId", "timestamp"])
    .index("by_supervisor", ["supervisorId", "timestamp"]),

  // AI coaching recommendations
  coachingRecommendations: defineTable({
    liveCallId: v.id("liveCalls"),
    type: v.union(
      v.literal("positive"),
      v.literal("warning"),
      v.literal("suggestion")
    ),
    title: v.string(),
    description: v.string(),
    priority: v.number(), // 1-10
    timestamp: v.string(),
    isActive: v.boolean(),
  })
    .index("by_call", ["liveCallId", "isActive", "priority"]),

  // Call phase tracking
  callPhases: defineTable({
    liveCallId: v.id("liveCalls"),
    phase: v.string(), // "Opening", "Discovery", "Value Prop", etc.
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("skipped")
    ),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    duration: v.optional(v.string()),
    quality: v.optional(v.union(
      v.literal("poor"),
      v.literal("fair"),
      v.literal("good"),
      v.literal("excellent")
    )),
    order: v.number(),
  })
    .index("by_call", ["liveCallId", "order"])
    .index("by_status", ["liveCallId", "status"]),

  // System configuration for live calls
  callSystemConfig: defineTable({
    liveCallId: v.id("liveCalls"),
    
    // Service providers
    sipProvider: v.string(),
    sttProvider: v.string(),
    llmProvider: v.string(),
    ttsProvider: v.string(),
    
    // Service status
    sipStatus: v.union(v.literal("connected"), v.literal("error")),
    sttStatus: v.union(v.literal("streaming"), v.literal("error")),
    llmStatus: v.union(v.literal("active"), v.literal("error")),
    ttsStatus: v.union(v.literal("active"), v.literal("error")),
    
    // Performance metrics
    apiLatency: v.number(), // milliseconds
    errorRate: v.number(), // percentage
    queueDepth: v.number(),
    
    // Cost tracking
    costPerMinute: v.number(),
    totalCost: v.number(),
    
    updatedAt: v.number(),
  })
    .index("by_call", ["liveCallId"]),

  // Real-time sentiment analysis
  sentimentAnalysis: defineTable({
    liveCallId: v.id("liveCalls"),
    
    // Overall sentiment percentages
    positivePercentage: v.number(),
    neutralPercentage: v.number(),
    negativePercentage: v.number(),
    
    // Trend direction
    trend: v.union(
      v.literal("improving"),
      v.literal("stable"),
      v.literal("declining")
    ),
    
    // Key moments
    lastPositiveMoment: v.optional(v.string()),
    lastNegativeMoment: v.optional(v.string()),
    
    updatedAt: v.number(),
  })
    .index("by_call", ["liveCallId"]),

  // Campaigns (referenced by live calls)
  campaigns: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.string(), // "Outbound", "Inbound", etc.
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"]),
});
```

## Data Relationships

### Primary Relationships
- `liveCalls` → `campaigns` (Many-to-One)
- All detail tables → `liveCalls` (Many-to-One)

### Real-time Updates
- `liveTranscripts` - Continuous stream of transcript entries
- `livePerformanceMetrics` - Updated every few seconds
- `sentimentAnalysis` - Updated with each transcript entry
- `callSystemConfig` - Updated based on system health

### Lifecycle
1. **Call Start**: Create `liveCalls` record with initial status
2. **During Call**: 
   - Stream `liveTranscripts` entries
   - Update `livePerformanceMetrics` periodically
   - Track `callPhases` progression
   - Generate `coachingRecommendations`
   - Update `sentimentAnalysis`
3. **Call End**: 
   - Update final status in `liveCalls`
   - Mark all recommendations as inactive
   - Transition data to `callAnalytics` for historical record

## Performance Considerations

### Real-time Requirements
- Transcript streaming: < 100ms latency
- Metric updates: Every 5 seconds
- Sentiment analysis: With each transcript chunk
- UI updates: Via Convex subscriptions

### Data Retention
- Live call data: Keep for duration of call + 1 hour
- Transcripts: Move to permanent storage after call
- Metrics: Aggregate and archive after call completion

### Scaling
- Index on `status` for active call queries
- Partition by `createdAt` for time-based cleanup
- Use TTL indexes for automatic data expiration