# SwarmOverviewModal Schema

## Overview
The SwarmOverviewModal manages swarm campaigns - coordinated groups of AI agents working together on outbound calling campaigns. It includes agent management, performance tracking, and campaign configuration.

## Schema Definitions

### swarmCampaigns
Main table for swarm campaign configurations and status.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Swarm campaign definitions
  swarmCampaigns: defineTable({
    // Basic Information
    name: v.string(),
    description: v.string(),
    purpose: v.union(
      v.literal("Discovery"),
      v.literal("Support"),
      v.literal("Appointment"),
      v.literal("Follow-up"),
      v.literal("Survey"),
      v.literal("Custom")
    ),
    
    // Status
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("stopped"),
      v.literal("completed"),
      v.literal("scheduled")
    ),
    
    // Agent Configuration
    totalAgents: v.number(), // Maximum agents allowed
    activeAgents: v.number(), // Currently active agents
    minAgents: v.number(), // Minimum for operation
    maxAgents: v.number(), // Maximum for auto-scaling
    
    // Performance Metrics
    totalCalls: v.number(),
    successfulCalls: v.number(),
    failedCalls: v.number(),
    successRate: v.number(), // Percentage
    
    // Campaign Settings
    autoScalingEnabled: v.boolean(),
    recordingEnabled: v.boolean(),
    analyticsEnabled: v.boolean(),
    priority: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    
    // Scheduling
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    activeHours: v.optional(v.object({
      start: v.string(), // "09:00"
      end: v.string(), // "17:00"
      timezone: v.string(), // "America/New_York"
      daysOfWeek: v.array(v.number()), // 0-6, 0=Sunday
    })),
    
    // Lead Configuration
    leadSourceId: v.optional(v.id("leadSources")),
    leadFilterCriteria: v.optional(v.object({
      minScore: v.number(),
      maxAttempts: v.number(),
      includeStatuses: v.array(v.string()),
      excludeStatuses: v.array(v.string()),
    })),
    
    // Metadata
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_name", ["name"])
    .index("by_priority", ["priority", "status"])
    .index("by_created", ["createdAt"]),

  // Swarm agents
  swarmAgents: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    agentId: v.string(), // Unique agent identifier
    name: v.string(),
    
    // Status
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("idle"),
      v.literal("calling"),
      v.literal("offline"),
      v.literal("error")
    ),
    
    // Current Activity
    currentCallId: v.optional(v.string()),
    currentCustomer: v.optional(v.string()),
    lastActivityTime: v.string(),
    
    // Performance Metrics
    totalCalls: v.number(),
    successfulCalls: v.number(),
    failedCalls: v.number(),
    avgCallDuration: v.number(), // seconds
    successRate: v.number(), // percentage
    qualityScore: v.number(), // 0-100
    
    // Configuration
    voiceModel: v.string(),
    personalityProfile: v.string(),
    scriptVersion: v.string(),
    
    // Resource Usage
    cpuUsage: v.number(), // percentage
    memoryUsage: v.number(), // MB
    apiCalls: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId"])
    .index("by_status", ["swarmCampaignId", "status"])
    .index("by_agent", ["agentId"]),

  // Swarm objectives
  swarmObjectives: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    objective: v.string(),
    description: v.string(),
    
    // Tracking
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(), // "calls", "appointments", "conversions", etc.
    
    // Status
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    completionPercentage: v.number(),
    
    // Priority
    priority: v.number(), // 1-10
    isCritical: v.boolean(),
    
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId", "order"])
    .index("by_status", ["swarmCampaignId", "status"]),

  // Call flow configuration
  swarmCallFlows: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    
    step: v.number(),
    phase: v.string(), // "Opening", "Discovery", etc.
    description: v.string(),
    
    // Timing
    targetDuration: v.string(), // "30s", "90s", etc.
    avgDuration: v.string(),
    
    // Scripts
    scriptTemplateId: v.optional(v.id("scriptTemplates")),
    fallbackScript: v.string(),
    
    // Conditions
    skipConditions: v.optional(v.array(v.string())),
    successCriteria: v.optional(v.array(v.string())),
    
    order: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId", "order"]),

  // Recent call activities
  swarmRecentCalls: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    agentId: v.string(),
    agentName: v.string(),
    
    // Call Details
    callId: v.string(),
    timestamp: v.string(),
    prospect: v.string(),
    company: v.optional(v.string()),
    
    // Outcome
    outcome: v.union(
      v.literal("Demo Scheduled"),
      v.literal("Follow-up Needed"),
      v.literal("Not Interested"),
      v.literal("Call Back Later"),
      v.literal("Wrong Number"),
      v.literal("No Answer"),
      v.literal("Voicemail"),
      v.literal("Transferred"),
      v.literal("Other")
    ),
    
    // Metrics
    duration: v.number(), // seconds
    qualityScore: v.number(), // 0-100
    sentiment: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    ),
    
    // Notes
    notes: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId", "timestamp"])
    .index("by_agent", ["agentId", "timestamp"])
    .index("by_outcome", ["swarmCampaignId", "outcome"]),

  // Swarm performance analytics
  swarmPerformanceMetrics: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    
    // Time-based Metrics
    periodType: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    periodStart: v.string(),
    periodEnd: v.string(),
    
    // Call Metrics
    totalCalls: v.number(),
    connectedCalls: v.number(),
    avgCallDuration: v.string(),
    connectionRate: v.number(), // percentage
    
    // Conversion Funnel
    callsMade: v.number(),
    callsConnected: v.number(),
    prospectsInterested: v.number(),
    prospectsQualified: v.number(),
    conversions: v.number(),
    
    // Quality Metrics
    avgQualityScore: v.number(),
    scriptAdherence: v.number(), // percentage
    objectionHandlingSuccess: v.number(), // percentage
    
    // Performance Indicators
    callsPerHour: v.number(),
    conversionRate: v.number(),
    appointmentRate: v.number(),
    
    // Timing Analysis
    peakHours: v.array(v.number()), // hours of day
    bestDays: v.array(v.number()), // days of week
    avgRingTime: v.number(), // seconds
    
    updatedAt: v.number(),
  })
    .index("by_swarm_period", ["swarmCampaignId", "periodType", "periodStart"]),

  // Swarm configuration
  swarmConfiguration: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    
    // AI Configuration
    aiModel: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    systemPrompt: v.string(),
    
    // Voice Configuration
    voiceProvider: v.string(),
    voiceModel: v.string(),
    speakingRate: v.number(),
    voiceClarity: v.string(),
    language: v.string(),
    
    // Conversation Style
    personality: v.union(
      v.literal("PROFESSIONAL"),
      v.literal("FRIENDLY"),
      v.literal("ENTHUSIASTIC"),
      v.literal("CONSULTATIVE")
    ),
    tone: v.string(),
    formality: v.string(),
    objectionStyle: v.union(
      v.literal("EMPATHETIC"),
      v.literal("LOGICAL"),
      v.literal("PERSISTENT"),
      v.literal("ACCOMMODATING")
    ),
    
    // Performance Limits
    maxCallDuration: v.number(), // seconds
    retryAttempts: v.number(),
    queueTimeout: v.number(), // seconds
    successThreshold: v.number(), // percentage
    
    // Escalation Rules
    autoTransferEnabled: v.boolean(),
    escalationTriggers: v.array(v.string()),
    supervisorAlertEnabled: v.boolean(),
    qualityCheckEnabled: v.boolean(),
    
    updatedAt: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId"]),

  // Auto-scaling rules
  swarmAutoScalingRules: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    
    // Rule Definition
    ruleName: v.string(),
    ruleType: v.union(
      v.literal("queue_based"),
      v.literal("time_based"),
      v.literal("performance_based"),
      v.literal("cost_based")
    ),
    isActive: v.boolean(),
    
    // Conditions
    metric: v.string(), // "queue_depth", "wait_time", "success_rate", etc.
    operator: v.union(
      v.literal("greater_than"),
      v.literal("less_than"),
      v.literal("equals")
    ),
    threshold: v.number(),
    
    // Actions
    action: v.union(
      v.literal("scale_up"),
      v.literal("scale_down"),
      v.literal("maintain")
    ),
    scaleAmount: v.number(), // Number of agents to add/remove
    cooldownPeriod: v.number(), // seconds
    
    // Constraints
    minAgents: v.number(),
    maxAgents: v.number(),
    maxCostPerHour: v.optional(v.number()),
    
    priority: v.number(),
    lastTriggered: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId", "isActive", "priority"]),

  // Lead sources
  leadSources: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("csv_upload"),
      v.literal("crm_integration"),
      v.literal("api_webhook"),
      v.literal("manual_entry")
    ),
    
    // Connection Details
    connectionString: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    
    // Data Mapping
    fieldMappings: v.object({
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
      customFields: v.optional(v.array(v.object({
        sourceField: v.string(),
        targetField: v.string(),
      }))),
    }),
    
    // Status
    isActive: v.boolean(),
    lastSync: v.optional(v.string()),
    totalLeads: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // Script templates
  scriptTemplates: defineTable({
    name: v.string(),
    category: v.string(),
    version: v.string(),
    
    // Content
    openingScript: v.string(),
    discoveryQuestions: v.array(v.string()),
    valueProposition: v.string(),
    objectionResponses: v.array(v.object({
      objection: v.string(),
      response: v.string(),
    })),
    closingScript: v.string(),
    
    // Metadata
    isActive: v.boolean(),
    usageCount: v.number(),
    avgSuccessRate: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category", "isActive"])
    .index("by_usage", ["usageCount"]),

  // Swarm activity logs
  swarmActivityLogs: defineTable({
    swarmCampaignId: v.id("swarmCampaigns"),
    
    // Activity Details
    activityType: v.union(
      v.literal("campaign_started"),
      v.literal("campaign_paused"),
      v.literal("campaign_stopped"),
      v.literal("agent_added"),
      v.literal("agent_removed"),
      v.literal("auto_scaled"),
      v.literal("configuration_updated"),
      v.literal("objective_completed"),
      v.literal("error_occurred")
    ),
    
    // Context
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    details: v.string(),
    
    // Status
    status: v.optional(v.object({
      text: v.string(),
      color: v.string(),
      bgColor: v.string(),
    })),
    
    // Metadata
    userId: v.optional(v.string()),
    timestamp: v.string(),
    
    createdAt: v.number(),
  })
    .index("by_swarm", ["swarmCampaignId", "timestamp"])
    .index("by_type", ["activityType", "timestamp"]),
});
```

## Data Relationships

### Primary Relationships
- `swarmCampaigns` ← `swarmAgents` (One-to-Many)
- `swarmCampaigns` ← `swarmObjectives` (One-to-Many)
- `swarmCampaigns` ← `swarmCallFlows` (One-to-Many)
- `swarmCampaigns` ← `leadSources` (Many-to-One)
- `swarmCallFlows` → `scriptTemplates` (Many-to-One)

### Performance & Analytics
- `swarmPerformanceMetrics` - Aggregated time-based metrics
- `swarmRecentCalls` - Real-time activity feed
- `swarmActivityLogs` - Audit trail and system events

### Configuration Hierarchy
1. **Campaign Level**: `swarmCampaigns` & `swarmConfiguration`
2. **Agent Level**: `swarmAgents` with individual settings
3. **Execution Level**: `swarmCallFlows` & `scriptTemplates`
4. **Optimization Level**: `swarmAutoScalingRules`

## Performance Considerations

### Indexing Strategy
- Status-based queries for active monitoring
- Time-based indexes for analytics
- Agent lookups for individual performance
- Priority sorting for rules and objectives

### Data Aggregation
- Pre-compute metrics in `swarmPerformanceMetrics`
- Maintain running totals in parent records
- Use materialized views for complex analytics

### Scaling Considerations
- Partition by campaign for large deployments
- Archive completed campaigns
- Implement data retention policies
- Use time-series storage for metrics