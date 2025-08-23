# CreateAgentModal Queries

## Overview
Queries for validating and fetching data during agent creation and management.

## Validation Queries

### `checkAgentNameExists`
Validates if an agent name is already in use

```typescript
export const checkAgentNameExists = query({
  args: {
    name: v.string(),
    excludeAgentId: v.optional(v.id("voiceAgents")),
  },
  
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { exists: false, canCheck: false };
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) return { exists: false, canCheck: false };
    
    const existingAgent = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => {
        const nameMatch = q.eq(q.field("name"), args.name);
        if (args.excludeAgentId) {
          return q.and(
            nameMatch,
            q.neq(q.field("_id"), args.excludeAgentId)
          );
        }
        return nameMatch;
      })
      .first();
    
    return {
      exists: !!existingAgent,
      canCheck: true,
      suggestedName: existingAgent ? `${args.name}-${Date.now().toString(36)}` : undefined,
    };
  },
});
```

### `getUserAgentQuota`
Gets the user's agent limit and current usage

```typescript
export const getUserAgentQuota = query({
  args: {},
  
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        limit: 0,
        used: 0,
        remaining: 0,
        canCreate: false,
        tier: "free",
      };
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      return {
        limit: 0,
        used: 0,
        remaining: 0,
        canCreate: false,
        tier: "free",
      };
    }
    
    const agents = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .collect();
    
    const limit = getAgentLimitByTier(user.tier);
    const used = agents.length;
    const remaining = Math.max(0, limit - used);
    
    return {
      limit,
      used,
      remaining,
      canCreate: remaining > 0,
      tier: user.tier,
      agents: agents.map(agent => ({
        id: agent._id,
        name: agent.name,
        status: agent.status,
      })),
    };
  },
});
```

### `getAvailableVoices`
Fetches available voices based on user's plan

```typescript
export const getAvailableVoices = query({
  args: {
    provider: v.optional(v.union(v.literal("elevenlabs"), v.literal("chatterbox"))),
  },
  
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        voices: [],
        canAccessPremium: false,
      };
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    const canAccessPremium = user?.tier === "premium" || user?.tier === "enterprise";
    
    // Base voices available to all
    const chatterboxVoices = [
      { id: "nova", name: "Nova", style: "Energetic Female", provider: "chatterbox" },
      { id: "alloy", name: "Alloy", style: "Professional Neutral", provider: "chatterbox" },
      { id: "echo", name: "Echo", style: "Friendly Neutral", provider: "chatterbox" },
      { id: "fable", name: "Fable", style: "Calm Female", provider: "chatterbox" },
    ];
    
    // Premium voices
    const elevenLabsVoices = [
      { id: "rachel", name: "Rachel", style: "Professional Female", provider: "elevenlabs" },
      { id: "drew", name: "Drew", style: "Professional Male", provider: "elevenlabs" },
      { id: "clyde", name: "Clyde", style: "Friendly Male", provider: "elevenlabs" },
      { id: "paul", name: "Paul", style: "Calm Male", provider: "elevenlabs" },
    ];
    
    let voices = chatterboxVoices;
    
    if (canAccessPremium && (!args.provider || args.provider === "elevenlabs")) {
      voices = args.provider === "elevenlabs" ? elevenLabsVoices : [...voices, ...elevenLabsVoices];
    }
    
    if (args.provider === "chatterbox") {
      voices = chatterboxVoices;
    }
    
    return {
      voices,
      canAccessPremium,
    };
  },
});
```

## Data Fetching Queries

### `getAgent`
Fetches a single agent with full details

```typescript
export const getAgent = query({
  args: {
    agentId: v.id("voiceAgents"),
  },
  
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    
    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (agent.userId !== user?._id) {
      throw new Error("Unauthorized");
    }
    
    // Get latest configuration
    const latestConfig = await ctx.db
      .query("agentConfigurations")
      .withIndex("by_agent_active", (q) => 
        q.eq("agentId", args.agentId).eq("isActive", true)
      )
      .first();
    
    // Get webhook configuration
    const webhook = await ctx.db
      .query("agentWebhooks")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    // Get recent call stats
    const recentCalls = await ctx.db
      .query("agentCallLogs")
      .withIndex("by_agent_time", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(100);
    
    const callStats = {
      last24Hours: recentCalls.filter(call => {
        const callTime = new Date(call.startTime).getTime();
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return callTime > dayAgo;
      }).length,
      last7Days: recentCalls.filter(call => {
        const callTime = new Date(call.startTime).getTime();
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return callTime > weekAgo;
      }).length,
    };
    
    return {
      ...agent,
      configuration: latestConfig?.configuration,
      webhook: webhook ? {
        url: webhook.url,
        events: webhook.events,
        lastDelivery: webhook.lastDeliveryAt,
        status: webhook.lastDeliveryStatus,
      } : null,
      callStats,
    };
  },
});
```

### `getUserAgents`
Fetches all agents for the authenticated user

```typescript
export const getUserAgents = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("offline"),
      v.literal("all")
    )),
  },
  
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { agents: [], hasAccess: false };
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) return { agents: [], hasAccess: false };
    
    let agentsQuery = ctx.db
      .query("voiceAgents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("status"), "deleted"));
    
    if (args.status && args.status !== "all") {
      agentsQuery = agentsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const agents = await agentsQuery.collect();
    
    // Enrich with latest configuration
    const enrichedAgents = await Promise.all(
      agents.map(async (agent) => {
        const config = await ctx.db
          .query("agentConfigurations")
          .withIndex("by_agent_active", (q) => 
            q.eq("agentId", agent._id).eq("isActive", true)
          )
          .first();
        
        // Get call stats for last 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentCalls = await ctx.db
          .query("agentCallLogs")
          .withIndex("by_agent_time", (q) => 
            q.eq("agentId", agent._id).gte("startTime", dayAgo)
          )
          .collect();
        
        return {
          ...agent,
          voiceProvider: config?.configuration.voiceSettings.provider,
          voiceId: config?.configuration.voiceSettings.voiceId,
          callsToday: recentCalls.length,
          isConfigured: !!config,
        };
      })
    );
    
    return {
      agents: enrichedAgents,
      hasAccess: true,
      tier: user.tier,
    };
  },
});
```

### `getAgentPerformanceMetrics`
Fetches detailed performance metrics for an agent

```typescript
export const getAgentPerformanceMetrics = query({
  args: {
    agentId: v.id("voiceAgents"),
    timeframe: v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("all")
    ),
  },
  
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    
    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (agent.userId !== user?._id) {
      throw new Error("Unauthorized");
    }
    
    // Calculate timeframe
    let startDate: string;
    switch (args.timeframe) {
      case "24h":
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        startDate = new Date(0).toISOString();
    }
    
    // Get calls within timeframe
    const calls = await ctx.db
      .query("agentCallLogs")
      .withIndex("by_agent_time", (q) => 
        q.eq("agentId", args.agentId).gte("startTime", startDate)
      )
      .collect();
    
    // Calculate metrics
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === "completed").length;
    const failedCalls = calls.filter(c => c.status === "failed").length;
    const avgDuration = calls
      .filter(c => c.duration)
      .reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls || 0;
    
    const avgSentiment = calls
      .filter(c => c.sentimentScore !== undefined)
      .reduce((sum, c) => sum + (c.sentimentScore || 0), 0) / completedCalls || 0;
    
    const avgSatisfaction = calls
      .filter(c => c.satisfactionRating !== undefined)
      .reduce((sum, c) => sum + (c.satisfactionRating || 0), 0) / completedCalls || 0;
    
    // Group by day for chart data
    const callsByDay = calls.reduce((acc, call) => {
      const day = new Date(call.startTime).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      summary: {
        totalCalls,
        completedCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
        avgDuration: Math.round(avgDuration),
        avgSentiment,
        avgSatisfaction,
      },
      chartData: Object.entries(callsByDay).map(([date, count]) => ({
        date,
        calls: count,
      })),
      recentCalls: calls.slice(0, 10).map(call => ({
        id: call._id,
        phoneNumber: call.phoneNumber,
        startTime: call.startTime,
        duration: call.duration,
        status: call.status,
        sentiment: call.sentimentScore,
      })),
    };
  },
});
```

### `validateWebhookUrl`
Validates and tests a webhook URL

```typescript
export const validateWebhookUrl = query({
  args: {
    url: v.string(),
  },
  
  handler: async (ctx, args) => {
    try {
      const parsed = new URL(args.url);
      
      // Check protocol
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return {
          valid: false,
          error: "URL must use HTTP or HTTPS protocol",
        };
      }
      
      // Check for localhost in production
      if (process.env.NODE_ENV === "production" && 
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
        return {
          valid: false,
          error: "Localhost URLs are not allowed in production",
        };
      }
      
      return {
        valid: true,
        url: parsed.toString(),
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
      };
    } catch (error) {
      return {
        valid: false,
        error: "Invalid URL format",
      };
    }
  },
});
```

## Helper Functions

### `getAgentLimitByTier`
```typescript
function getAgentLimitByTier(tier: string): number {
  switch (tier) {
    case "free": return 1;
    case "starter": return 3;
    case "premium": return 10;
    case "enterprise": return 999;
    default: return 1;
  }
}
```