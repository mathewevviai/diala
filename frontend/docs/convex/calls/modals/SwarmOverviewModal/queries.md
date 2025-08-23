# SwarmOverviewModal Queries

## Overview
Query functions for retrieving swarm campaign data and analytics from Convex.

## Query Functions

### getSwarmOverview
Retrieves complete swarm campaign data with agents, objectives, and performance metrics.

```typescript
// convex/queries/swarmCampaigns.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getSwarmOverview = query({
  args: { swarmId: v.id("swarmCampaigns") },
  handler: async (ctx, args) => {
    // Get swarm campaign
    const swarm = await ctx.db.get(args.swarmId);
    
    if (!swarm) {
      return null;
    }
    
    // Get all agents
    const agents = await ctx.db
      .query("swarmAgents")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .collect();
    
    // Get objectives
    const objectives = await ctx.db
      .query("swarmObjectives")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .collect();
    
    // Get call flow
    const callFlow = await ctx.db
      .query("swarmCallFlows")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .collect();
    
    // Get recent calls (last 20)
    const recentCalls = await ctx.db
      .query("swarmRecentCalls")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .order("desc")
      .take(20);
    
    // Get current performance metrics
    const currentMetrics = await ctx.db
      .query("swarmPerformanceMetrics")
      .withIndex("by_swarm_period", (q) => 
        q.eq("swarmCampaignId", args.swarmId)
         .eq("periodType", "daily")
      )
      .order("desc")
      .first();
    
    // Get configuration
    const configuration = await ctx.db
      .query("swarmConfiguration")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .first();
    
    // Get auto-scaling rules
    const autoScalingRules = await ctx.db
      .query("swarmAutoScalingRules")
      .withIndex("by_swarm", (q) => 
        q.eq("swarmCampaignId", args.swarmId)
         .eq("isActive", true)
      )
      .collect();
    
    // Calculate derived metrics
    const activeAgentCount = agents.filter(a => a.status === "active" || a.status === "calling").length;
    const avgSuccessRate = agents.length > 0
      ? agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length
      : 0;
    
    return {
      // Basic swarm data
      id: swarm._id,
      name: swarm.name,
      description: swarm.description,
      status: swarm.status,
      purpose: swarm.purpose,
      priority: swarm.priority,
      
      // Agent summary
      agents: {
        total: swarm.totalAgents,
        active: activeAgentCount,
        utilization: swarm.totalAgents > 0 ? (activeAgentCount / swarm.totalAgents) * 100 : 0,
        details: agents.map(agent => ({
          id: agent.agentId,
          name: agent.name,
          status: agent.status,
          calls: agent.totalCalls,
          success: agent.successRate,
          currentCall: agent.currentCustomer,
          lastActivity: agent.lastActivityTime,
        })),
      },
      
      // Performance summary
      performance: {
        totalCalls: swarm.totalCalls,
        successRate: swarm.successRate,
        avgSuccessRate: Math.round(avgSuccessRate),
        callsToday: currentMetrics?.totalCalls || 0,
        callsThisWeek: currentMetrics ? currentMetrics.totalCalls * 7 : 0, // Simplified
        avgCallDuration: currentMetrics?.avgCallDuration || "0:00",
        conversionRate: currentMetrics?.conversionRate || 0,
        appointmentsBooked: currentMetrics?.conversions || 0,
        qualityScore: currentMetrics?.avgQualityScore || 0,
      },
      
      // Objectives
      objectives: objectives.map(obj => ({
        id: obj._id,
        objective: obj.objective,
        description: obj.description,
        status: obj.status,
        progress: obj.completionPercentage,
        target: obj.targetValue,
        current: obj.currentValue,
        unit: obj.unit,
        priority: obj.priority,
        isCritical: obj.isCritical,
      })),
      
      // Call flow
      callFlow: callFlow.map(flow => ({
        step: flow.step,
        phase: flow.phase,
        description: flow.description,
        avgDuration: flow.avgDuration,
        targetDuration: flow.targetDuration,
      })),
      
      // Recent activity
      recentCalls: recentCalls.map(call => ({
        time: call.timestamp,
        prospect: call.prospect,
        company: call.company,
        outcome: call.outcome,
        agent: call.agentName,
        duration: call.duration,
        qualityScore: call.qualityScore,
        sentiment: call.sentiment,
      })),
      
      // Configuration
      configuration: configuration ? {
        aiModel: configuration.aiModel,
        voiceModel: configuration.voiceModel,
        personality: configuration.personality,
        autoScalingEnabled: swarm.autoScalingEnabled,
        recordingEnabled: swarm.recordingEnabled,
        maxCallDuration: configuration.maxCallDuration,
        successThreshold: configuration.successThreshold,
      } : null,
      
      // Auto-scaling
      autoScalingRules: autoScalingRules.map(rule => ({
        name: rule.ruleName,
        type: rule.ruleType,
        metric: rule.metric,
        threshold: rule.threshold,
        action: rule.action,
        lastTriggered: rule.lastTriggered,
      })),
      
      // Metadata
      created: new Date(swarm.createdAt).toISOString(),
      updated: new Date(swarm.updatedAt).toISOString(),
    };
  },
});

// Get all swarm campaigns
export const getAllSwarms = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("stopped"),
      v.literal("completed"),
      v.literal("scheduled")
    )),
    purpose: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("swarmCampaigns");
    
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    const swarms = await query.take(args.limit || 50);
    
    // Filter by purpose if provided
    const filteredSwarms = args.purpose
      ? swarms.filter(s => s.purpose === args.purpose)
      : swarms;
    
    // Enrich with agent counts
    return Promise.all(filteredSwarms.map(async (swarm) => {
      const activeAgents = await ctx.db
        .query("swarmAgents")
        .withIndex("by_status", (q) => 
          q.eq("swarmCampaignId", swarm._id)
           .eq("status", "active")
        )
        .collect();
      
      return {
        id: swarm._id,
        name: swarm.name,
        description: swarm.description,
        status: swarm.status,
        activeAgents: activeAgents.length,
        totalAgents: swarm.totalAgents,
        totalCalls: swarm.totalCalls,
        successRate: swarm.successRate,
        purpose: swarm.purpose,
        created: new Date(swarm.createdAt).toISOString(),
      };
    }));
  },
});

// Get swarm performance analytics
export const getSwarmAnalytics = query({
  args: {
    swarmId: v.id("swarmCampaigns"),
    periodType: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let metricsQuery = ctx.db
      .query("swarmPerformanceMetrics")
      .withIndex("by_swarm_period", (q) => 
        q.eq("swarmCampaignId", args.swarmId)
         .eq("periodType", args.periodType)
      );
    
    const allMetrics = await metricsQuery.collect();
    
    // Filter by date range if provided
    const filteredMetrics = allMetrics.filter(m => {
      if (args.startDate && m.periodStart < args.startDate) return false;
      if (args.endDate && m.periodEnd > args.endDate) return false;
      return true;
    });
    
    // Sort by period
    const sortedMetrics = filteredMetrics.sort((a, b) => 
      a.periodStart.localeCompare(b.periodStart)
    );
    
    return {
      periods: sortedMetrics.map(m => ({
        period: m.periodStart,
        totalCalls: m.totalCalls,
        connectedCalls: m.connectedCalls,
        connectionRate: m.connectionRate,
        conversions: m.conversions,
        conversionRate: m.conversionRate,
        avgQualityScore: m.avgQualityScore,
        scriptAdherence: m.scriptAdherence,
      })),
      
      // Aggregate totals
      totals: {
        totalCalls: sortedMetrics.reduce((sum, m) => sum + m.totalCalls, 0),
        totalConversions: sortedMetrics.reduce((sum, m) => sum + m.conversions, 0),
        avgConnectionRate: sortedMetrics.length > 0
          ? sortedMetrics.reduce((sum, m) => sum + m.connectionRate, 0) / sortedMetrics.length
          : 0,
        avgConversionRate: sortedMetrics.length > 0
          ? sortedMetrics.reduce((sum, m) => sum + m.conversionRate, 0) / sortedMetrics.length
          : 0,
      },
      
      // Conversion funnel (from latest period)
      funnel: sortedMetrics.length > 0 ? {
        callsMade: sortedMetrics[sortedMetrics.length - 1].callsMade,
        callsConnected: sortedMetrics[sortedMetrics.length - 1].callsConnected,
        prospectsInterested: sortedMetrics[sortedMetrics.length - 1].prospectsInterested,
        prospectsQualified: sortedMetrics[sortedMetrics.length - 1].prospectsQualified,
        conversions: sortedMetrics[sortedMetrics.length - 1].conversions,
      } : null,
      
      // Best performing times
      bestTimes: sortedMetrics.length > 0 ? {
        peakHours: [...new Set(sortedMetrics.flatMap(m => m.peakHours))],
        bestDays: [...new Set(sortedMetrics.flatMap(m => m.bestDays))],
      } : null,
    };
  },
});

// Get agent performance within swarm
export const getSwarmAgentPerformance = query({
  args: {
    swarmId: v.id("swarmCampaigns"),
    sortBy: v.optional(v.union(
      v.literal("calls"),
      v.literal("success"),
      v.literal("quality")
    )),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("swarmAgents")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .collect();
    
    // Sort agents based on criteria
    const sortedAgents = agents.sort((a, b) => {
      switch (args.sortBy) {
        case "calls":
          return b.totalCalls - a.totalCalls;
        case "success":
          return b.successRate - a.successRate;
        case "quality":
          return b.qualityScore - a.qualityScore;
        default:
          return b.totalCalls - a.totalCalls;
      }
    });
    
    return sortedAgents.map(agent => ({
      id: agent.agentId,
      name: agent.name,
      status: agent.status,
      metrics: {
        totalCalls: agent.totalCalls,
        successfulCalls: agent.successfulCalls,
        failedCalls: agent.failedCalls,
        successRate: agent.successRate,
        avgCallDuration: agent.avgCallDuration,
        qualityScore: agent.qualityScore,
      },
      currentActivity: {
        isActive: agent.status === "calling",
        currentCall: agent.currentCallId,
        currentCustomer: agent.currentCustomer,
        lastActivity: agent.lastActivityTime,
      },
      resources: {
        cpuUsage: agent.cpuUsage,
        memoryUsage: agent.memoryUsage,
        apiCalls: agent.apiCalls,
      },
    }));
  },
});

// Get swarm activity feed
export const getSwarmActivityFeed = query({
  args: {
    swarmId: v.optional(v.id("swarmCampaigns")),
    activityType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("swarmActivityLogs");
    
    if (args.swarmId) {
      query = query.withIndex("by_swarm", (q) => 
        q.eq("swarmCampaignId", args.swarmId)
      );
    }
    
    if (args.activityType) {
      query = query.withIndex("by_type", (q) => 
        q.eq("activityType", args.activityType as any)
      );
    }
    
    const activities = await query
      .order("desc")
      .take(args.limit || 50);
    
    // Enrich with swarm names if not filtered by swarm
    return Promise.all(activities.map(async (activity) => {
      const swarm = args.swarmId 
        ? await ctx.db.get(args.swarmId)
        : await ctx.db.get(activity.swarmCampaignId);
      
      return {
        id: activity._id,
        swarmName: swarm?.name || "Unknown",
        activityType: activity.activityType,
        agentName: activity.agentName,
        action: formatActivityAction(activity.activityType),
        target: activity.details,
        status: activity.status,
        timestamp: activity.timestamp,
        timeAgo: getTimeAgo(activity.timestamp),
      };
    }));
  },
});

// Helper function to format activity actions
function formatActivityAction(type: string): string {
  const actionMap: Record<string, string> = {
    campaign_started: "started campaign",
    campaign_paused: "paused campaign",
    campaign_stopped: "stopped campaign",
    agent_added: "added agent to",
    agent_removed: "removed agent from",
    auto_scaled: "auto-scaled",
    configuration_updated: "updated configuration for",
    objective_completed: "completed objective in",
    error_occurred: "encountered error in",
  };
  return actionMap[type] || type;
}

// Helper function for relative time
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Get swarm health metrics
export const getSwarmHealth = query({
  args: { swarmId: v.id("swarmCampaigns") },
  handler: async (ctx, args) => {
    const swarm = await ctx.db.get(args.swarmId);
    if (!swarm) return null;
    
    const agents = await ctx.db
      .query("swarmAgents")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .collect();
    
    const config = await ctx.db
      .query("swarmConfiguration")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .first();
    
    const recentCalls = await ctx.db
      .query("swarmRecentCalls")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .order("desc")
      .take(100);
    
    // Calculate health metrics
    const activeAgents = agents.filter(a => 
      ["active", "calling", "idle"].includes(a.status)
    );
    const errorAgents = agents.filter(a => a.status === "error");
    
    // Calculate average latency (mock data - would come from real monitoring)
    const avgLatency = 127; // ms
    const errorRate = recentCalls.length > 0
      ? (recentCalls.filter(c => c.outcome === "Other").length / recentCalls.length) * 100
      : 0;
    
    // Queue depth (mock - would come from lead queue)
    const queueDepth = Math.floor(Math.random() * 50);
    
    // Calculate uptime (mock - would come from monitoring)
    const uptime = 99.8;
    
    return {
      status: errorAgents.length > 0 ? "WARNING" : "OPTIMAL",
      metrics: {
        apiLatency: avgLatency,
        errorRate: Math.round(errorRate * 100) / 100,
        queueDepth,
        uptime,
      },
      agentHealth: {
        total: agents.length,
        active: activeAgents.length,
        error: errorAgents.length,
        utilization: agents.length > 0 
          ? Math.round((activeAgents.length / agents.length) * 100)
          : 0,
      },
      autoScaling: {
        enabled: swarm.autoScalingEnabled,
        minAgents: swarm.minAgents,
        maxAgents: swarm.maxAgents,
        currentAgents: activeAgents.length,
        nextScaleEvent: "~2 MIN", // Mock - would calculate from rules
      },
    };
  },
});

// Get available script templates
export const getScriptTemplates = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("scriptTemplates");
    
    if (args.category) {
      query = query.withIndex("by_category", (q) => 
        q.eq("category", args.category).eq("isActive", args.isActive ?? true)
      );
    }
    
    const templates = await query.collect();
    
    return templates
      .filter(t => args.isActive === undefined || t.isActive === args.isActive)
      .sort((a, b) => b.avgSuccessRate - a.avgSuccessRate)
      .map(template => ({
        id: template._id,
        name: template.name,
        category: template.category,
        version: template.version,
        usageCount: template.usageCount,
        successRate: template.avgSuccessRate,
        isActive: template.isActive,
      }));
  },
});
```

## Usage Examples

### Swarm Overview Dashboard

```typescript
// In your SwarmOverviewModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function SwarmOverviewModal({ swarmId }: { swarmId: string }) {
  const swarmData = useQuery(
    api.queries.swarmCampaigns.getSwarmOverview,
    { swarmId }
  );
  
  const analytics = useQuery(
    api.queries.swarmCampaigns.getSwarmAnalytics,
    { 
      swarmId,
      periodType: "daily",
      startDate: getLastWeek(),
      endDate: getToday(),
    }
  );
  
  const activityFeed = useQuery(
    api.queries.swarmCampaigns.getSwarmActivityFeed,
    { swarmId, limit: 20 }
  );
  
  return (
    <div>
      {/* Render swarm dashboard */}
    </div>
  );
}
```

### Swarm Management Dashboard

```typescript
// List all active swarms
function SwarmManagement() {
  const activeSwarms = useQuery(
    api.queries.swarmCampaigns.getAllSwarms,
    { status: "active" }
  );
  
  return (
    <div>
      {activeSwarms?.map(swarm => (
        <SwarmCard key={swarm.id} swarm={swarm} />
      ))}
    </div>
  );
}
```

## Performance Optimization

1. **Pagination**: Use `.take()` limits for large datasets
2. **Filtering**: Apply index-based filters before collection
3. **Aggregation**: Pre-calculate metrics in periodic jobs
4. **Caching**: Consider caching expensive analytics queries
5. **Real-time Updates**: Use Convex subscriptions for live data