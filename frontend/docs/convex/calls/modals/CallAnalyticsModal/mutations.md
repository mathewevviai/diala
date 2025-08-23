# CallAnalyticsModal Mutations

## Overview
Mutation functions for creating and updating call analytics data in Convex.

## Mutation Functions

### createCallAnalytics
Creates a complete call analytics record with all related data.

```typescript
// convex/mutations/callAnalytics.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createCallAnalytics = mutation({
  args: {
    // Core call information
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
    
    // Timing data
    startTime: v.string(),
    endTime: v.string(),
    duration: v.string(),
    queueTime: v.string(),
    holdTime: v.string(),
    
    // Metrics
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
    qualityScore: v.string(),
    
    // Campaign info
    campaignId: v.optional(v.id("campaigns")),
    campaignName: v.string(),
    
    // Related data
    callFlow: v.array(v.object({
      step: v.number(),
      title: v.string(),
      description: v.string(),
      color: v.string(),
    })),
    
    transcript: v.array(v.object({
      timestamp: v.string(),
      speaker: v.union(v.literal("agent"), v.literal("customer"), v.literal("system")),
      content: v.string(),
      sentiment: v.optional(v.union(
        v.literal("positive"),
        v.literal("negative"),
        v.literal("neutral")
      )),
    })),
    
    aiInsights: v.object({
      topics: v.array(v.object({
        name: v.string(),
        type: v.union(
          v.literal("positive"),
          v.literal("negative"),
          v.literal("empathetic"),
          v.literal("unhelpful")
        ),
      })),
      events: v.array(v.object({
        name: v.string(),
        timestamp: v.string(),
        type: v.union(
          v.literal("green"),
          v.literal("blue"),
          v.literal("red"),
          v.literal("orange")
        ),
      })),
    }),
    
    timelineEvents: v.array(v.object({
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
    })),
  },
  
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Find or create customer
    let customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.customerPhone))
      .first();
    
    if (!customer) {
      const customerId = await ctx.db.insert("customers", {
        name: args.customerName,
        initials: args.customerName.split(' ').map(n => n[0]).join('').toUpperCase(),
        type: "Sales Prospect",
        accountType: "LEAD",
        customerSince: "New Prospect",
        phone: args.customerPhone,
        previousCalls: 0,
        satisfaction: "Not Rated",
        lastContact: args.startTime,
        createdAt: now,
        updatedAt: now,
      });
      customer = await ctx.db.get(customerId);
    }
    
    // Create main analytics record
    const analyticsId = await ctx.db.insert("callAnalytics", {
      callId: args.callId,
      agentName: args.agentName,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      status: args.status,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.duration,
      queueTime: args.queueTime,
      holdTime: args.holdTime,
      resolution: args.resolution,
      hasTransfer: args.hasTransfer,
      sentiment: args.sentiment,
      qualityScore: args.qualityScore,
      customerId: customer!._id,
      campaignId: args.campaignId,
      campaignName: args.campaignName,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create call flow steps
    await Promise.all(
      args.callFlow.map((step, index) =>
        ctx.db.insert("callFlowSteps", {
          callAnalyticsId: analyticsId,
          step: step.step,
          title: step.title,
          description: step.description,
          color: step.color,
          order: index,
        })
      )
    );
    
    // Create transcript entries
    await Promise.all(
      args.transcript.map((entry, index) =>
        ctx.db.insert("transcriptEntries", {
          callAnalyticsId: analyticsId,
          timestamp: entry.timestamp,
          speaker: entry.speaker,
          content: entry.content,
          sentiment: entry.sentiment,
          order: index,
        })
      )
    );
    
    // Create AI topics
    await Promise.all(
      args.aiInsights.topics.map((topic) =>
        ctx.db.insert("aiTopics", {
          callAnalyticsId: analyticsId,
          name: topic.name,
          type: topic.type,
        })
      )
    );
    
    // Create AI events
    await Promise.all(
      args.aiInsights.events.map((event, index) =>
        ctx.db.insert("aiEvents", {
          callAnalyticsId: analyticsId,
          name: event.name,
          timestamp: event.timestamp,
          type: event.type,
          order: index,
        })
      )
    );
    
    // Create timeline events
    await Promise.all(
      args.timelineEvents.map((event, index) =>
        ctx.db.insert("timelineEvents", {
          callAnalyticsId: analyticsId,
          timestamp: event.timestamp,
          event: event.event,
          description: event.description,
          type: event.type,
          duration: event.duration,
          order: index,
        })
      )
    );
    
    // Update customer's previous calls count
    await ctx.db.patch(customer!._id, {
      previousCalls: (customer!.previousCalls || 0) + 1,
      lastContact: args.endTime,
      updatedAt: now,
    });
    
    return analyticsId;
  },
});

// Add quality summary to existing call
export const addQualitySummary = mutation({
  args: {
    callId: v.string(),
    overallScore: v.number(),
    categories: v.array(v.object({
      name: v.string(),
      score: v.number(),
      maxScore: v.number(),
      color: v.string(),
    })),
    improvements: v.array(v.object({
      area: v.string(),
      suggestion: v.string(),
      priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    })),
    strengths: v.array(v.string()),
  },
  
  handler: async (ctx, args) => {
    // Find the call analytics record
    const analytics = await ctx.db
      .query("callAnalytics")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!analytics) {
      throw new Error("Call analytics not found");
    }
    
    // Check if quality summary already exists
    const existingSummary = await ctx.db
      .query("qualitySummary")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .first();
    
    if (existingSummary) {
      throw new Error("Quality summary already exists for this call");
    }
    
    // Create quality summary
    const summaryId = await ctx.db.insert("qualitySummary", {
      callAnalyticsId: analytics._id,
      overallScore: args.overallScore,
      strengths: args.strengths,
    });
    
    // Create categories
    await Promise.all(
      args.categories.map((category, index) =>
        ctx.db.insert("qualityCategories", {
          qualitySummaryId: summaryId,
          name: category.name,
          score: category.score,
          maxScore: category.maxScore,
          color: category.color,
          order: index,
        })
      )
    );
    
    // Create improvements
    await Promise.all(
      args.improvements.map((improvement, index) =>
        ctx.db.insert("qualityImprovements", {
          qualitySummaryId: summaryId,
          area: improvement.area,
          suggestion: improvement.suggestion,
          priority: improvement.priority,
          order: index,
        })
      )
    );
    
    return summaryId;
  },
});

// Add audit trail entry
export const addAuditEntry = mutation({
  args: {
    callId: v.string(),
    user: v.string(),
    action: v.string(),
    details: v.string(),
    system: v.string(),
  },
  
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("callAnalytics")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!analytics) {
      throw new Error("Call analytics not found");
    }
    
    // Get the count of existing audit entries for ordering
    const existingEntries = await ctx.db
      .query("auditTrail")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    const entryId = await ctx.db.insert("auditTrail", {
      callAnalyticsId: analytics._id,
      timestamp: new Date().toISOString(),
      user: args.user,
      action: args.action,
      details: args.details,
      system: args.system,
      order: existingEntries.length,
    });
    
    return entryId;
  },
});

// Add customer touchpoint
export const addCustomerTouchpoint = mutation({
  args: {
    customerPhone: v.string(),
    date: v.string(),
    type: v.string(),
    channel: v.string(),
    outcome: v.string(),
    status: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    relatedCallId: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    // Find customer
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.customerPhone))
      .first();
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Find related call if provided
    let analyticsId = null;
    if (args.relatedCallId) {
      const analytics = await ctx.db
        .query("callAnalytics")
        .withIndex("by_callId", (q) => q.eq("callId", args.relatedCallId))
        .first();
      analyticsId = analytics?._id;
    }
    
    // Get existing touchpoints for ordering
    const existingTouchpoints = await ctx.db
      .query("customerTouchpoints")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();
    
    const touchpointId = await ctx.db.insert("customerTouchpoints", {
      callAnalyticsId: analyticsId!,
      customerId: customer._id,
      date: args.date,
      type: args.type,
      channel: args.channel,
      outcome: args.outcome,
      status: args.status,
      order: existingTouchpoints.length,
    });
    
    return touchpointId;
  },
});

// Update customer satisfaction
export const updateCustomerSatisfaction = mutation({
  args: {
    customerPhone: v.string(),
    score: v.number(),
    feedback: v.optional(v.string()),
    relatedCallId: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    // Find customer
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.customerPhone))
      .first();
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Find related call if provided
    let analyticsId = null;
    if (args.relatedCallId) {
      const analytics = await ctx.db
        .query("callAnalytics")
        .withIndex("by_callId", (q) => q.eq("callId", args.relatedCallId))
        .first();
      analyticsId = analytics?._id;
    }
    
    const satisfactionId = await ctx.db.insert("customerSatisfaction", {
      callAnalyticsId: analyticsId!,
      customerId: customer._id,
      date: new Date().toISOString(),
      score: args.score,
      feedback: args.feedback,
    });
    
    // Update customer's overall satisfaction
    await ctx.db.patch(customer._id, {
      satisfaction: args.score >= 8 ? "Excellent" : 
                   args.score >= 6 ? "Good" : 
                   args.score >= 4 ? "Fair" : "Poor",
      updatedAt: Date.now(),
    });
    
    return satisfactionId;
  },
});

// Add customer issue
export const addCustomerIssue = mutation({
  args: {
    customerPhone: v.string(),
    issue: v.string(),
    resolution: v.string(),
    status: v.union(v.literal("resolved"), v.literal("pending"), v.literal("escalated")),
    relatedCallId: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    // Find customer
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.customerPhone))
      .first();
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Find related call if provided
    let analyticsId = null;
    if (args.relatedCallId) {
      const analytics = await ctx.db
        .query("callAnalytics")
        .withIndex("by_callId", (q) => q.eq("callId", args.relatedCallId))
        .first();
      analyticsId = analytics?._id;
    }
    
    // Get existing issues for ordering
    const existingIssues = await ctx.db
      .query("customerIssues")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();
    
    const issueId = await ctx.db.insert("customerIssues", {
      callAnalyticsId: analyticsId!,
      customerId: customer._id,
      date: new Date().toISOString(),
      issue: args.issue,
      resolution: args.resolution,
      status: args.status,
      order: existingIssues.length,
    });
    
    return issueId;
  },
});

// Update call sentiment (post-processing)
export const updateCallSentiment = mutation({
  args: {
    callId: v.string(),
    sentiment: v.union(
      v.literal("POSITIVE"),
      v.literal("NEGATIVE"),
      v.literal("NEUTRAL"),
      v.literal("MIXED")
    ),
  },
  
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("callAnalytics")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!analytics) {
      throw new Error("Call analytics not found");
    }
    
    await ctx.db.patch(analytics._id, {
      sentiment: args.sentiment,
      updatedAt: Date.now(),
    });
    
    // Add audit entry
    await ctx.db.insert("auditTrail", {
      callAnalyticsId: analytics._id,
      timestamp: new Date().toISOString(),
      user: "SYSTEM",
      action: "SENTIMENT_UPDATED",
      details: `Sentiment updated to ${args.sentiment}`,
      system: "AI-ANALYTICS",
      order: 0, // Will be updated with proper order
    });
  },
});
```

## Usage Examples

### Creating Call Analytics After Call Completion

```typescript
// In your call completion handler
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function useCreateCallAnalytics() {
  const createAnalytics = useMutation(api.mutations.callAnalytics.createCallAnalytics);
  
  const handleCallComplete = async (callData: CallData) => {
    await createAnalytics({
      callId: callData.id,
      agentName: callData.agent,
      customerName: callData.customer,
      customerPhone: callData.phone,
      status: "COMPLETED",
      // ... all other required fields
    });
  };
  
  return { handleCallComplete };
}
```

### Adding Quality Assessment

```typescript
// In your quality assessment component
const addQuality = useMutation(api.mutations.callAnalytics.addQualitySummary);

const submitQualityAssessment = async (assessment: QualityAssessment) => {
  await addQuality({
    callId: assessment.callId,
    overallScore: assessment.score,
    categories: assessment.categories,
    improvements: assessment.improvements,
    strengths: assessment.strengths,
  });
};
```

## Best Practices

1. **Transactional Integrity**: Create all related records in a single mutation when possible
2. **Validation**: Validate data before insertion
3. **Audit Trail**: Always log significant changes
4. **Error Handling**: Provide meaningful error messages
5. **Idempotency**: Check for existing records before creating duplicates