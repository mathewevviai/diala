# CallAnalyticsModal Queries

## Overview
Query functions for retrieving call analytics data from Convex for the CallAnalyticsModal component.

## Query Functions

### getCallAnalytics
Retrieves complete call analytics data with all related information.

```typescript
// convex/queries/callAnalytics.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getCallAnalytics = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    // Get main analytics record
    const analytics = await ctx.db
      .query("callAnalytics")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .first();
    
    if (!analytics) {
      return null;
    }
    
    // Get customer profile
    const customer = analytics.customerId 
      ? await ctx.db.get(analytics.customerId)
      : null;
    
    // Get call flow steps
    const callFlowSteps = await ctx.db
      .query("callFlowSteps")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    // Get transcript entries
    const transcript = await ctx.db
      .query("transcriptEntries")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    // Get AI insights
    const aiTopics = await ctx.db
      .query("aiTopics")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    const aiEvents = await ctx.db
      .query("aiEvents")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    // Get timeline events
    const timeline = await ctx.db
      .query("timelineEvents")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    // Get quality summary
    const qualitySummary = await ctx.db
      .query("qualitySummary")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .first();
    
    let qualityCategories = [];
    let qualityImprovements = [];
    
    if (qualitySummary) {
      qualityCategories = await ctx.db
        .query("qualityCategories")
        .withIndex("by_summary", (q) => q.eq("qualitySummaryId", qualitySummary._id))
        .collect();
      
      qualityImprovements = await ctx.db
        .query("qualityImprovements")
        .withIndex("by_summary", (q) => q.eq("qualitySummaryId", qualitySummary._id))
        .collect();
    }
    
    // Get audit trail
    const auditTrail = await ctx.db
      .query("auditTrail")
      .withIndex("by_call", (q) => q.eq("callAnalyticsId", analytics._id))
      .collect();
    
    // Get customer journey data if customer exists
    let customerJourney = null;
    if (customer) {
      const touchpoints = await ctx.db
        .query("customerTouchpoints")
        .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
        .take(10); // Last 10 touchpoints
      
      const satisfaction = await ctx.db
        .query("customerSatisfaction")
        .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
        .take(5); // Last 5 satisfaction scores
      
      const issues = await ctx.db
        .query("customerIssues")
        .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
        .take(5); // Last 5 issues
      
      customerJourney = {
        touchpoints,
        satisfaction,
        issues,
      };
    }
    
    // Format the response to match the component interface
    return {
      callInfo: {
        callId: analytics.callId,
        agent: analytics.agentName,
        customer: analytics.customerName,
        phone: analytics.customerPhone,
        status: analytics.status,
      },
      timing: {
        startTime: analytics.startTime,
        endTime: analytics.endTime,
        duration: analytics.duration,
        queueTime: analytics.queueTime,
        holdTime: analytics.holdTime,
      },
      metrics: {
        resolution: analytics.resolution,
        transfer: analytics.hasTransfer,
        sentiment: analytics.sentiment,
        qualityScore: analytics.qualityScore,
      },
      callFlow: callFlowSteps.map(step => ({
        step: step.step,
        title: step.title,
        description: step.description,
        color: step.color,
      })),
      customerProfile: customer ? {
        name: customer.name,
        initials: customer.initials,
        type: customer.type,
        accountType: customer.accountType,
        customerSince: customer.customerSince,
        previousCalls: customer.previousCalls,
        satisfaction: customer.satisfaction,
        lastContact: customer.lastContact,
      } : null,
      transcript: transcript.map(entry => ({
        timestamp: entry.timestamp,
        speaker: entry.speaker,
        content: entry.content,
        sentiment: entry.sentiment,
      })),
      aiInsights: {
        topics: aiTopics.map(topic => ({
          name: topic.name,
          type: topic.type,
        })),
        events: aiEvents.map(event => ({
          name: event.name,
          timestamp: event.timestamp,
          type: event.type,
        })),
      },
      timeline: timeline.map(event => ({
        timestamp: event.timestamp,
        event: event.event,
        description: event.description,
        type: event.type,
        duration: event.duration,
      })),
      qualitySummary: qualitySummary ? {
        overallScore: qualitySummary.overallScore,
        categories: qualityCategories.map(cat => ({
          name: cat.name,
          score: cat.score,
          maxScore: cat.maxScore,
          color: cat.color,
        })),
        improvements: qualityImprovements.map(imp => ({
          area: imp.area,
          suggestion: imp.suggestion,
          priority: imp.priority,
        })),
        strengths: qualitySummary.strengths,
      } : null,
      auditTrail: auditTrail.map(entry => ({
        timestamp: entry.timestamp,
        user: entry.user,
        action: entry.action,
        details: entry.details,
        system: entry.system,
      })),
      customerJourney,
    };
  },
});

// Query for agent call history
export const getAgentCallHistory = query({
  args: { 
    agentName: v.string(),
    limit: v.optional(v.number()),
    timeRange: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("callAnalytics")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName));
    
    // Apply time range filter if provided
    if (args.timeRange) {
      // Filter by date range in handler since we can't do range queries on secondary fields
      const allCalls = await query.collect();
      const filtered = allCalls.filter(call => 
        call.startTime >= args.timeRange!.start && 
        call.startTime <= args.timeRange!.end
      );
      return filtered.slice(0, args.limit || 50);
    }
    
    const calls = await query.take(args.limit || 50);
    
    // Enrich with basic metrics
    return Promise.all(calls.map(async (call) => {
      const qualitySummary = await ctx.db
        .query("qualitySummary")
        .withIndex("by_call", (q) => q.eq("callAnalyticsId", call._id))
        .first();
      
      return {
        callId: call.callId,
        customerName: call.customerName,
        customerPhone: call.customerPhone,
        startTime: call.startTime,
        duration: call.duration,
        status: call.status,
        sentiment: call.sentiment,
        qualityScore: qualitySummary?.overallScore || 0,
        resolution: call.resolution,
      };
    }));
  },
});

// Query for customer interaction history
export const getCustomerHistory = query({
  args: { customerPhone: v.string() },
  handler: async (ctx, args) => {
    // Find customer by phone
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.customerPhone))
      .first();
    
    if (!customer) {
      return null;
    }
    
    // Get all calls for this customer
    const calls = await ctx.db
      .query("callAnalytics")
      .withIndex("by_customer", (q) => q.eq("customerPhone", args.customerPhone))
      .take(20);
    
    // Get touchpoints
    const touchpoints = await ctx.db
      .query("customerTouchpoints")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .take(50);
    
    // Get satisfaction history
    const satisfaction = await ctx.db
      .query("customerSatisfaction")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();
    
    // Get issues
    const issues = await ctx.db
      .query("customerIssues")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();
    
    return {
      customer: {
        ...customer,
        totalCalls: calls.length,
      },
      recentCalls: calls.map(call => ({
        callId: call.callId,
        agentName: call.agentName,
        startTime: call.startTime,
        duration: call.duration,
        sentiment: call.sentiment,
        resolution: call.resolution,
      })),
      touchpoints,
      satisfaction,
      issues,
    };
  },
});

// Query for campaign performance
export const getCampaignAnalytics = query({
  args: { 
    campaignId: v.id("campaigns"),
    timeRange: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("callAnalytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Filter by time range if provided
    const filteredCalls = args.timeRange 
      ? calls.filter(call => 
          call.startTime >= args.timeRange!.start && 
          call.startTime <= args.timeRange!.end
        )
      : calls;
    
    // Calculate aggregate metrics
    const totalCalls = filteredCalls.length;
    const completedCalls = filteredCalls.filter(c => c.status === "COMPLETED").length;
    const transferredCalls = filteredCalls.filter(c => c.hasTransfer).length;
    
    const sentimentCounts = {
      positive: filteredCalls.filter(c => c.sentiment === "POSITIVE").length,
      negative: filteredCalls.filter(c => c.sentiment === "NEGATIVE").length,
      neutral: filteredCalls.filter(c => c.sentiment === "NEUTRAL").length,
      mixed: filteredCalls.filter(c => c.sentiment === "MIXED").length,
    };
    
    const resolutionCounts = {
      resolved: filteredCalls.filter(c => c.resolution === "RESOLVED").length,
      unresolved: filteredCalls.filter(c => c.resolution === "UNRESOLVED").length,
      escalated: filteredCalls.filter(c => c.resolution === "ESCALATED").length,
      transferred: filteredCalls.filter(c => c.resolution === "TRANSFERRED").length,
    };
    
    // Get quality scores
    const qualityScores = await Promise.all(
      filteredCalls.map(async (call) => {
        const summary = await ctx.db
          .query("qualitySummary")
          .withIndex("by_call", (q) => q.eq("callAnalyticsId", call._id))
          .first();
        return summary?.overallScore || 0;
      })
    );
    
    const avgQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;
    
    return {
      summary: {
        totalCalls,
        completedCalls,
        transferredCalls,
        successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
        avgQualityScore,
      },
      sentiment: sentimentCounts,
      resolution: resolutionCounts,
      recentCalls: filteredCalls.slice(0, 10).map(call => ({
        callId: call.callId,
        agentName: call.agentName,
        customerName: call.customerName,
        startTime: call.startTime,
        duration: call.duration,
        sentiment: call.sentiment,
        resolution: call.resolution,
      })),
    };
  },
});

// Query for quality metrics by date range
export const getQualityMetrics = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    groupBy: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("callAnalytics")
      .withIndex("by_date")
      .collect();
    
    // Filter by date range
    const filteredCalls = calls.filter(call => 
      call.startTime >= args.startDate && 
      call.startTime <= args.endDate
    );
    
    // Get quality data for each call
    const qualityData = await Promise.all(
      filteredCalls.map(async (call) => {
        const summary = await ctx.db
          .query("qualitySummary")
          .withIndex("by_call", (q) => q.eq("callAnalyticsId", call._id))
          .first();
        
        const categories = summary ? await ctx.db
          .query("qualityCategories")
          .withIndex("by_summary", (q) => q.eq("qualitySummaryId", summary._id))
          .collect() : [];
        
        return {
          date: call.startTime,
          overallScore: summary?.overallScore || 0,
          categories: categories.map(cat => ({
            name: cat.name,
            score: cat.score,
            maxScore: cat.maxScore,
          })),
        };
      })
    );
    
    // Group by time period if requested
    if (args.groupBy) {
      // Implementation would group data by day/week/month
      // Simplified for brevity
    }
    
    return qualityData;
  },
});
```

## Usage Examples

### In React Component

```typescript
// In your CallAnalyticsModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function CallAnalyticsModal({ callId }: { callId: string }) {
  const analyticsData = useQuery(api.queries.callAnalytics.getCallAnalytics, { 
    callId 
  });
  
  if (!analyticsData) {
    return <div>Loading...</div>;
  }
  
  // Use the data to render the modal
  return (
    <div>
      {/* Render analytics data */}
    </div>
  );
}
```

### Performance Considerations

1. **Pagination**: Use `.take()` for large datasets
2. **Indexes**: Ensure all queries use appropriate indexes
3. **Caching**: Consider caching frequently accessed data
4. **Batch Loading**: Load related data in parallel when possible