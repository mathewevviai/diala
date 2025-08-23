# CreateAgentModal Schema

## Overview
The CreateAgentModal follows a 4-step wizard pattern for creating voice agents with comprehensive configuration options.

## Database Schema

### Primary Table: `voiceAgents`

```typescript
voiceAgents: defineTable({
  // Core identification
  id: v.id("voiceAgents"),
  name: v.string(),
  description: v.string(),
  userId: v.id("users"),
  
  // Purpose configuration
  purpose: v.union(
    v.literal("sales"),
    v.literal("support"),
    v.literal("appointment"),
    v.literal("technical"),
    v.literal("custom")
  ),
  customPurpose: v.optional(v.string()),
  
  // Voice configuration
  voiceProvider: v.union(
    v.literal("elevenlabs"),
    v.literal("chatterbox")
  ),
  voiceId: v.string(),
  voiceStyle: v.union(
    v.literal("professional"),
    v.literal("friendly"),
    v.literal("energetic"),
    v.literal("calm"),
    v.literal("custom")
  ),
  speechRate: v.number(), // 0.5 to 2.0
  pitch: v.number(), // 0.5 to 2.0
  
  // Language & behavior
  language: v.string(), // ISO language code (e.g., "en-US")
  responseDelay: v.number(), // milliseconds
  interruptionSensitivity: v.number(), // 0 to 1
  silenceThreshold: v.number(), // milliseconds
  maxCallDuration: v.number(), // minutes
  
  // Advanced settings
  systemPrompt: v.string(),
  temperature: v.number(), // 0 to 2
  maxTokens: v.number(), // 50 to 2000
  enableTranscription: v.boolean(),
  enableAnalytics: v.boolean(),
  webhookUrl: v.optional(v.string()),
  
  // Status and metadata
  status: v.union(
    v.literal("active"),
    v.literal("idle"),
    v.literal("offline"),
    v.literal("configuring"),
    v.literal("error")
  ),
  
  // Timestamps
  createdAt: v.string(), // ISO date string
  updatedAt: v.string(), // ISO date string
  lastActiveAt: v.optional(v.string()), // ISO date string
  
  // Performance metrics (updated separately)
  totalCalls: v.number(),
  successRate: v.number(), // percentage
  avgCallDuration: v.string(), // format: "MM:SS"
  satisfactionRating: v.number(), // 0 to 5
})
.index("by_user", ["userId"])
.index("by_status", ["status"])
.index("by_purpose", ["purpose"])
.index("by_created", ["createdAt"])
.index("by_user_status", ["userId", "status"]),

### Supporting Tables

#### `agentConfigurations`
Stores versioned configurations for agents

```typescript
agentConfigurations: defineTable({
  id: v.id("agentConfigurations"),
  agentId: v.id("voiceAgents"),
  version: v.number(),
  configuration: v.object({
    systemPrompt: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    voiceSettings: v.object({
      provider: v.string(),
      voiceId: v.string(),
      speechRate: v.number(),
      pitch: v.number(),
    }),
    behaviorSettings: v.object({
      responseDelay: v.number(),
      interruptionSensitivity: v.number(),
      silenceThreshold: v.number(),
      maxCallDuration: v.number(),
    }),
  }),
  createdAt: v.string(),
  createdBy: v.id("users"),
  isActive: v.boolean(),
})
.index("by_agent", ["agentId"])
.index("by_agent_active", ["agentId", "isActive"]),

#### `agentCallLogs`
Tracks all calls made by agents

```typescript
agentCallLogs: defineTable({
  id: v.id("agentCallLogs"),
  agentId: v.id("voiceAgents"),
  callId: v.string(),
  
  // Call details
  phoneNumber: v.string(),
  direction: v.union(v.literal("inbound"), v.literal("outbound")),
  startTime: v.string(),
  endTime: v.optional(v.string()),
  duration: v.optional(v.number()), // seconds
  
  // Call outcome
  status: v.union(
    v.literal("completed"),
    v.literal("failed"),
    v.literal("no_answer"),
    v.literal("busy"),
    v.literal("cancelled")
  ),
  disposition: v.optional(v.string()),
  
  // Performance metrics
  sentimentScore: v.optional(v.number()),
  satisfactionRating: v.optional(v.number()),
  
  // Transcript and recording
  transcriptId: v.optional(v.id("callTranscripts")),
  recordingUrl: v.optional(v.string()),
  
  // Webhook data
  webhookSent: v.boolean(),
  webhookResponse: v.optional(v.string()),
})
.index("by_agent", ["agentId"])
.index("by_call", ["callId"])
.index("by_agent_time", ["agentId", "startTime"]),

#### `agentWebhooks`
Manages webhook configurations and history

```typescript
agentWebhooks: defineTable({
  id: v.id("agentWebhooks"),
  agentId: v.id("voiceAgents"),
  url: v.string(),
  events: v.array(v.string()), // ["call.started", "call.ended", etc.]
  headers: v.optional(v.object({})), // Custom headers
  isActive: v.boolean(),
  
  // Delivery tracking
  lastDeliveryAt: v.optional(v.string()),
  lastDeliveryStatus: v.optional(v.union(
    v.literal("success"),
    v.literal("failed"),
    v.literal("timeout")
  )),
  failureCount: v.number(),
  
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_agent", ["agentId"])
.index("by_active", ["isActive"]),
```

## Validation Rules

### Name Validation
- Required, non-empty string
- Maximum 50 characters
- Must be unique per user
- Alphanumeric with spaces, hyphens, and underscores

### Voice Configuration
- Voice ID must match available options for selected provider
- Speech rate: 0.5 to 2.0
- Pitch: 0.5 to 2.0

### Behavior Settings
- Response delay: 0 to 2000ms
- Interruption sensitivity: 0 to 1
- Silence threshold: 500 to 5000ms
- Max call duration: 1 to 60 minutes

### Advanced Settings
- System prompt: Required, minimum 10 characters
- Temperature: 0 to 2
- Max tokens: 50 to 2000
- Webhook URL: Valid HTTP/HTTPS URL format

## Feature Gating

### Premium Features (ElevenLabs voices)
```typescript
const checkPremiumAccess = async (userId: Id<"users">) => {
  const user = await ctx.db.get(userId);
  return user?.tier === "premium" || user?.tier === "enterprise";
};
```

### Agent Limits by Tier
- Free: 1 agent
- Starter: 3 agents
- Premium: 10 agents
- Enterprise: Unlimited

## State Management

### Agent Status Transitions
```
configuring → active (successful creation)
configuring → error (creation failed)
active → idle (no calls for 30 minutes)
idle → active (call initiated)
active/idle → offline (user action)
offline → active (user action)
```

### Background Jobs
1. **Status Updates**: Check agent activity every 5 minutes
2. **Performance Metrics**: Calculate hourly
3. **Webhook Retry**: Exponential backoff for failed deliveries
4. **Configuration Cleanup**: Remove old versions after 30 days