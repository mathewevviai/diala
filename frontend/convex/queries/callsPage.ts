import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all agent call statistics for the main table
export const getAgentCallStats = query({
  args: {
    userId: v.optional(v.string()),
    timeRange: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    // Get all agents
    const agents = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", q => q.eq("userId", args.userId || "default"))
      .collect();

    // Get call statistics for each agent
    const agentStats = await Promise.all(
      agents.map(async (agent) => {
        // Get call logs for this agent
        const callLogs = await ctx.db
          .query("agentCallLogs")
          .withIndex("by_agent", q => q.eq("agentId", agent._id))
          .collect();

        // Filter by time range if provided
        const filteredLogs = args.timeRange
          ? callLogs.filter(log => 
              log.startTime >= args.timeRange!.start &&
              log.startTime <= args.timeRange!.end
            )
          : callLogs;

        // Calculate statistics
        const outboundCalls = filteredLogs.filter(log => log.direction === "outbound").length;
        const inboundCalls = filteredLogs.filter(log => log.direction === "inbound").length;
        const completedCalls = filteredLogs.filter(log => log.status === "completed").length;
        const failedCalls = filteredLogs.filter(log => 
          log.status === "failed" || log.status === "no_answer"
        ).length;

        // Check if agent is currently on a call
        const liveCall = await ctx.db
          .query("liveCalls")
          .withIndex("by_agent", q => q.eq("agentId", agent._id))
          .first();

        return {
          id: agent._id,
          agent: agent.name,
          outbound: outboundCalls,
          answeredInbound: inboundCalls,
          pickedUp: completedCalls,
          notPickedUp: failedCalls,
          status: liveCall ? 'online' as const : agent.status === 'active' ? 'available' as const : 'offline' as const,
          onMobile: true, // This could be determined by user agent or device info
          onDesktop: true,
          convexEntryPoint: `agents.${agent._id}`,
        };
      })
    );

    return agentStats;
  },
});

// Get all phone numbers with statistics
export const getPhoneNumbers = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("phoneNumbers");
    
    if (args.status) {
      query = query.withIndex("by_status", q => q.eq("status", args.status!));
    }

    const phoneNumbers = await query.collect();
    
    return phoneNumbers.map(phone => ({
      id: phone._id,
      number: phone.number,
      displayName: phone.displayName,
      type: phone.type,
      status: phone.status,
      provider: phone.provider,
      location: phone.location,
      assignedUser: phone.assignedUser,
      callsToday: phone.callsToday,
      callsThisWeek: phone.callsThisWeek,
      callsThisMonth: phone.callsThisMonth,
      successRate: phone.successRate,
      avgCallDuration: phone.avgCallDuration,
      lastUsed: phone.lastUsed,
      sipConfig: phone.sipConfig,
      features: phone.features,
    }));
  },
});

// Get live calls for monitoring
export const getLiveCalls = query({
  args: {},
  handler: async (ctx) => {
    const liveCalls = await ctx.db
      .query("liveCalls")
      .collect();

    return liveCalls.map(call => ({
      id: call._id,
      callId: call.callId,
      agent: call.agentName,
      customer: call.customerName,
      phone: call.customerPhone,
      duration: call.duration,
      status: call.status,
      sentiment: call.sentiment,
      recording: call.isRecording,
    }));
  },
});

// Get swarm campaigns overview
export const getSwarmCampaigns = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("scheduled")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("campaigns");
    
    if (args.status) {
      query = query.withIndex("by_status", q => q.eq("status", args.status!));
    }

    const campaigns = await query.collect();

    // Get agent assignments for each campaign
    const campaignsWithAgents = await Promise.all(
      campaigns.map(async (campaign) => {
        const assignments = await ctx.db
          .query("campaignAgents")
          .withIndex("by_campaign", q => q.eq("campaignId", campaign._id))
          .collect();

        const agents = await Promise.all(
          assignments.map(async (assignment) => {
            const agent = await ctx.db.get(assignment.agentId);
            return agent ? {
              id: agent._id,
              name: agent.name,
              status: agent.status,
              callsHandled: assignment.callsHandled,
              successRate: assignment.successRate,
            } : null;
          })
        );

        return {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          progress: campaign.totalCalls > 0 
            ? Math.round((campaign.completedCalls / campaign.totalCalls) * 100)
            : 0,
          totalCalls: campaign.totalCalls,
          completedCalls: campaign.completedCalls,
          agents: agents.filter(Boolean),
        };
      })
    );

    return campaignsWithAgents;
  },
});

// Get call analytics for a specific call
export const getCallAnalytics = query({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("callAnalytics")
      .withIndex("by_callId", q => q.eq("callId", args.callId))
      .first();

    if (!analytics) {
      return null;
    }

    // Get transcript entries
    const transcript = await ctx.db
      .query("transcriptEntries")
      .withIndex("by_call", q => q.eq("callId", args.callId))
      .collect();

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
      transcript: transcript.map(entry => ({
        timestamp: entry.timestamp,
        speaker: entry.speaker,
        content: entry.content,
        sentiment: entry.sentiment,
      })),
    };
  },
});

// Get dashboard statistics
export const getDashboardStats = query({
  args: {
    userId: v.optional(v.string()),
    date: v.optional(v.string()), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const today = args.date || new Date().toISOString().split('T')[0];
    const userId = args.userId || "default";

    // Try to get cached stats first
    const cachedStats = await ctx.db
      .query("dashboardStats")
      .withIndex("by_user_date", q => 
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    if (cachedStats && 
        new Date(cachedStats.updatedAt) > new Date(Date.now() - 5 * 60 * 1000)) {
      // Return cached stats if less than 5 minutes old
      return {
        totalCalls: cachedStats.totalCalls,
        activeCalls: cachedStats.activeCalls,
        successRate: cachedStats.successRate,
        avgCallDuration: cachedStats.avgCallDuration,
        activeAgents: cachedStats.activeAgents,
      };
    }

    // Otherwise, calculate fresh stats
    const agents = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    const activeCalls = await ctx.db
      .query("liveCalls")
      .collect();

    const todaysCalls = await ctx.db
      .query("callAnalytics")
      .withIndex("by_date")
      .collect();

    // Filter today's calls
    const todaysCallsFiltered = todaysCalls.filter(call => 
      call.startTime.startsWith(today)
    );

    const totalCalls = todaysCallsFiltered.length;
    const completedCalls = todaysCallsFiltered.filter(c => c.status === "COMPLETED").length;
    const successRate = totalCalls > 0 
      ? Math.round((completedCalls / totalCalls) * 100)
      : 0;

    // Calculate average duration
    const durations = todaysCallsFiltered
      .map(call => {
        const match = call.duration.match(/(\d+)m\s+(\d+)s/);
        return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
      })
      .filter(d => d > 0);

    const avgDurationSeconds = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const avgCallDuration = `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`;

    const activeAgents = agents.filter(a => a.status === "active").length;

    return {
      totalCalls,
      activeCalls: activeCalls.length,
      successRate,
      avgCallDuration,
      activeAgents,
    };
  },
});