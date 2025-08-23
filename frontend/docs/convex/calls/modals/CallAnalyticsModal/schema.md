# CallAnalyticsModal Schema

## Overview
The CallAnalyticsModal displays comprehensive analytics for completed calls, including performance metrics, transcripts, quality scores, and customer journey data.

## Schema Definitions

### callAnalytics
Main table for storing call analytics data.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  callAnalytics: defineTable({
    // Call Information
    callId: v.string(),
    agentName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    status: v.union(
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("TRANSFERRED"),
      v.literal("ABANDONED")
    ),
    
    // Timing Information
    startTime: v.string(), // ISO timestamp
    endTime: v.string(), // ISO timestamp
    duration: v.string(), // Format: "4m 01s"
    queueTime: v.string(), // Format: "12s"
    holdTime: v.string(), // Format: "0s"
    
    // Call Metrics
    resolution: v.union(
      v.literal("RESOLVED"),
      v.literal("UNRESOLVED"),
      v.literal("ESCALATED"),
      v.literal("TRANSFERRED")
    ),
    hasTransfer: v.boolean(),
    sentiment: v.union(
      v.literal("POSITIVE"),
      v.literal("NEGATIVE"),
      v.literal("NEUTRAL"),
      v.literal("MIXED")
    ),
    qualityScore: v.string(), // Format: "8.5/10"
    
    // Customer Profile Reference
    customerId: v.optional(v.id("customers")),
    
    // Campaign Information
    campaignId: v.optional(v.id("campaigns")),
    campaignName: v.string(),
    
    // Metadata
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_callId", ["callId"])
    .index("by_agent", ["agentName"])
    .index("by_customer", ["customerPhone"])
    .index("by_campaign", ["campaignId"])
    .index("by_date", ["startTime"]),

  // Call Flow Steps
  callFlowSteps: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    step: v.number(),
    title: v.string(),
    description: v.string(),
    color: v.string(), // CSS class like "bg-purple-400"
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"]),

  // Transcript Entries
  transcriptEntries: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    timestamp: v.string(), // Format: "00:43"
    speaker: v.union(v.literal("agent"), v.literal("customer"), v.literal("system")),
    content: v.string(),
    sentiment: v.optional(
      v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral"))
    ),
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"])
    .index("by_speaker", ["callAnalyticsId", "speaker"]),

  // AI Insights Topics
  aiTopics: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    name: v.string(),
    type: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("empathetic"),
      v.literal("unhelpful")
    ),
  })
    .index("by_call", ["callAnalyticsId"]),

  // AI Insight Events
  aiEvents: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    name: v.string(),
    timestamp: v.string(),
    type: v.union(
      v.literal("green"),
      v.literal("blue"),
      v.literal("red"),
      v.literal("orange")
    ),
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"]),

  // Timeline Events
  timelineEvents: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    timestamp: v.string(),
    event: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("incoming"),
      v.literal("connected"),
      v.literal("hold"),
      v.literal("transfer"),
      v.literal("resolution"),
      v.literal("system")
    ),
    duration: v.optional(v.string()),
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"]),

  // Quality Summary
  qualitySummary: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    overallScore: v.number(), // 0-100
    strengths: v.array(v.string()),
  })
    .index("by_call", ["callAnalyticsId"]),

  // Quality Categories
  qualityCategories: defineTable({
    qualitySummaryId: v.id("qualitySummary"),
    name: v.string(),
    score: v.number(),
    maxScore: v.number(),
    color: v.string(), // CSS class
    order: v.number(),
  })
    .index("by_summary", ["qualitySummaryId", "order"]),

  // Quality Improvements
  qualityImprovements: defineTable({
    qualitySummaryId: v.id("qualitySummary"),
    area: v.string(),
    suggestion: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    order: v.number(),
  })
    .index("by_summary", ["qualitySummaryId", "priority", "order"]),

  // Audit Trail
  auditTrail: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    timestamp: v.string(), // Full timestamp
    user: v.string(),
    action: v.string(),
    details: v.string(),
    system: v.string(),
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"])
    .index("by_timestamp", ["timestamp"]),

  // Customer Journey Touchpoints
  customerTouchpoints: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    customerId: v.id("customers"),
    date: v.string(),
    type: v.string(), // OUTBOUND, INBOUND, MARKETING, etc.
    channel: v.string(), // Phone, Email, LinkedIn, etc.
    outcome: v.string(),
    status: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"])
    .index("by_customer", ["customerId", "date"]),

  // Customer Satisfaction
  customerSatisfaction: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    customerId: v.id("customers"),
    date: v.string(),
    score: v.number(), // 1-10
    feedback: v.optional(v.string()),
  })
    .index("by_call", ["callAnalyticsId"])
    .index("by_customer", ["customerId", "date"]),

  // Customer Issues
  customerIssues: defineTable({
    callAnalyticsId: v.id("callAnalytics"),
    customerId: v.id("customers"),
    date: v.string(),
    issue: v.string(),
    resolution: v.string(),
    status: v.union(v.literal("resolved"), v.literal("pending"), v.literal("escalated")),
    order: v.number(),
  })
    .index("by_call", ["callAnalyticsId", "order"])
    .index("by_customer", ["customerId", "status"]),

  // Customers table (referenced by analytics)
  customers: defineTable({
    name: v.string(),
    initials: v.string(),
    type: v.string(), // Sales Prospect, Customer, Lead, etc.
    accountType: v.string(), // LEAD, CUSTOMER, VIP, etc.
    customerSince: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    previousCalls: v.number(),
    satisfaction: v.string(),
    lastContact: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"])
    .index("by_company", ["company"]),
});
```

## Data Relationships

### Primary Relationships
- `callAnalytics` → `customers` (Many-to-One)
- `callAnalytics` → `campaigns` (Many-to-One)
- All detail tables → `callAnalytics` (Many-to-One)
- `qualityCategories` & `qualityImprovements` → `qualitySummary` (Many-to-One)
- `qualitySummary` → `callAnalytics` (One-to-One)

### Index Strategy
1. **Primary Lookup**: `by_callId` for quick call retrieval
2. **Agent Performance**: `by_agent` for agent-specific analytics
3. **Customer History**: `by_customer` for customer journey views
4. **Campaign Analytics**: `by_campaign` for campaign performance
5. **Time-based Queries**: `by_date` for historical analysis
6. **Ordered Data**: `order` field in detail tables for consistent display

## Data Lifecycle

### Creation
- Call analytics records are created after call completion
- All related detail records are created in a transaction
- Customer records are created/updated separately

### Updates
- Quality scores and improvements can be updated post-call
- Audit trail is append-only
- Customer journey data accumulates over time

### Retention
- Call analytics data retained based on compliance requirements
- Transcript data may be anonymized after retention period
- Audit trail data retained for compliance (typically 7 years)