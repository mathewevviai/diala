# SwarmOverviewModal Mutations

## Overview
Mutation functions for managing swarm campaigns, agents, and real-time operations in Convex.

## Mutation Functions

### createSwarmCampaign
Creates a new swarm campaign with initial configuration.

```typescript
// convex/mutations/swarmCampaigns.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createSwarmCampaign = mutation({
  args: {
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
    priority: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    totalAgents: v.number(),
    minAgents: v.number(),
    maxAgents: v.number(),
    autoScalingEnabled: v.boolean(),
    recordingEnabled: v.boolean(),
    leadSourceId: v.optional(v.id("leadSources")),
    activeHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
      timezone: v.string(),
      daysOfWeek: v.array(v.number()),
    })),
  },
  
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.auth.getUserId();
    
    // Create the swarm campaign
    const swarmId = await ctx.db.insert("swarmCampaigns", {
      name: args.name,
      description: args.description,
      purpose: args.purpose,
      status: "scheduled",
      totalAgents: args.totalAgents,
      activeAgents: 0,
      minAgents: args.minAgents,
      maxAgents: args.maxAgents,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      successRate: 0,
      autoScalingEnabled: args.autoScalingEnabled,
      recordingEnabled: args.recordingEnabled,
      analyticsEnabled: true,
      priority: args.priority,
      leadSourceId: args.leadSourceId,
      activeHours: args.activeHours,
      createdBy: userId || "system",
      createdAt: now,
      updatedAt: now,
    });
    
    // Create default objectives
    const defaultObjectives = getDefaultObjectives(args.purpose);
    await Promise.all(
      defaultObjectives.map((obj, index) =>
        ctx.db.insert("swarmObjectives", {
          swarmCampaignId: swarmId,
          objective: obj.objective,
          description: obj.description,
          targetValue: obj.targetValue,
          currentValue: 0,
          unit: obj.unit,
          status: "not_started",
          completionPercentage: 0,
          priority: obj.priority,
          isCritical: obj.isCritical,
          order: index,
          createdAt: now,
          updatedAt: now,
        })
      )
    );
    
    // Create default call flow
    const defaultCallFlow = getDefaultCallFlow(args.purpose);
    await Promise.all(
      defaultCallFlow.map((flow, index) =>
        ctx.db.insert("swarmCallFlows", {
          swarmCampaignId: swarmId,
          step: index + 1,
          phase: flow.phase,
          description: flow.description,
          targetDuration: flow.targetDuration,
          avgDuration: "0s",
          fallbackScript: flow.fallbackScript,
          order: index,
        })
      )
    );
    
    // Create default configuration
    await ctx.db.insert("swarmConfiguration", {
      swarmCampaignId: swarmId,
      aiModel: "gpt-4",
      temperature: 0.7,
      maxTokens: 150,
      systemPrompt: getDefaultSystemPrompt(args.purpose),
      voiceProvider: "ElevenLabs",
      voiceModel: "nova",
      speakingRate: 1.0,
      voiceClarity: "high",
      language: "en-US",
      personality: "PROFESSIONAL",
      tone: "confident",
      formality: "formal",
      objectionStyle: "EMPATHETIC",
      maxCallDuration: 600, // 10 minutes
      retryAttempts: 3,
      queueTimeout: 30,
      successThreshold: 70,
      autoTransferEnabled: true,
      escalationTriggers: ["customer_request", "agent_error", "high_value_lead"],
      supervisorAlertEnabled: true,
      qualityCheckEnabled: true,
      updatedAt: now,
    });
    
    // Create initial auto-scaling rules if enabled
    if (args.autoScalingEnabled) {
      await createDefaultAutoScalingRules(ctx, swarmId, now);
    }
    
    // Log activity
    await ctx.db.insert("swarmActivityLogs", {
      swarmCampaignId: swarmId,
      activityType: "campaign_started",
      details: `Created new ${args.purpose} campaign: ${args.name}`,
      userId,
      timestamp: new Date().toISOString(),
      createdAt: now,
    });
    
    return swarmId;
  },
});

// Update swarm campaign status
export const updateSwarmStatus = mutation({
  args: {
    swarmId: v.id("swarmCampaigns"),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("stopped"),
      v.literal("completed")
    ),
  },
  
  handler: async (ctx, args) => {
    const swarm = await ctx.db.get(args.swarmId);
    if (!swarm) {
      throw new Error("Swarm campaign not found");
    }
    
    const previousStatus = swarm.status;
    
    await ctx.db.patch(args.swarmId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    // Handle status-specific actions
    if (args.status === "active" && previousStatus !== "active") {
      await activateSwarmAgents(ctx, args.swarmId);
    } else if (args.status === "paused" || args.status === "stopped") {
      await deactivateSwarmAgents(ctx, args.swarmId);
    }
    
    // Log activity
    await ctx.db.insert("swarmActivityLogs", {
      swarmCampaignId: args.swarmId,
      activityType: `campaign_${args.status}` as any,
      details: `Campaign status changed from ${previousStatus} to ${args.status}`,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });
  },
});

// Add agent to swarm
export const addAgentToSwarm = mutation({
  args: {
    swarmId: v.id("swarmCampaigns"),
    agentName: v.string(),
    voiceModel: v.string(),
    personalityProfile: v.string(),
  },
  
  handler: async (ctx, args) => {
    const swarm = await ctx.db.get(args.swarmId);
    if (!swarm) {
      throw new Error("Swarm campaign not found");
    }
    
    if (swarm.activeAgents >= swarm.maxAgents) {
      throw new Error("Maximum agent limit reached");
    }
    
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    await ctx.db.insert("swarmAgents", {
      swarmCampaignId: args.swarmId,
      agentId,
      name: args.agentName,
      status: "idle",
      lastActivityTime: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgCallDuration: 0,
      successRate: 0,
      qualityScore: 85,
      voiceModel: args.voiceModel,
      personalityProfile: args.personalityProfile,
      scriptVersion: "v1.0",
      cpuUsage: 0,
      memoryUsage: 0,
      apiCalls: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    // Update agent count
    await ctx.db.patch(args.swarmId, {
      activeAgents: swarm.activeAgents + 1,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("swarmActivityLogs", {
      swarmCampaignId: args.swarmId,
      activityType: "agent_added",
      agentId,
      agentName: args.agentName,
      details: `Added agent ${args.agentName} to swarm`,
      timestamp: new Date().toISOString(),
      createdAt: now,
    });
    
    return agentId;
  },
});

// Update agent status
export const updateAgentStatus = mutation({
  args: {
    agentId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("idle"),
      v.literal("calling"),
      v.literal("offline"),
      v.literal("error")
    ),
    currentCallId: v.optional(v.string()),
    currentCustomer: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("swarmAgents")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
    
    if (!agent) {
      throw new Error("Agent not found");
    }
    
    await ctx.db.patch(agent._id, {
      status: args.status,
      currentCallId: args.currentCallId,
      currentCustomer: args.currentCustomer,
      lastActivityTime: new Date().toISOString(),
      updatedAt: Date.now(),
    });
  },
});

// Update objective progress
export const updateObjectiveProgress = mutation({
  args: {
    objectiveId: v.id("swarmObjectives"),
    currentValue: v.number(),
    status: v.optional(v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    )),
  },
  
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId);
    if (!objective) {
      throw new Error("Objective not found");
    }
    
    const completionPercentage = Math.min(
      100,
      Math.round((args.currentValue / objective.targetValue) * 100)
    );
    
    const newStatus = args.status || (
      completionPercentage === 0 ? "not_started" :
      completionPercentage === 100 ? "completed" :
      "in_progress"
    );
    
    await ctx.db.patch(args.objectiveId, {
      currentValue: args.currentValue,
      completionPercentage,
      status: newStatus,
      updatedAt: Date.now(),
    });
    
    // Log completion if achieved
    if (newStatus === "completed" && objective.status !== "completed") {
      await ctx.db.insert("swarmActivityLogs", {
        swarmCampaignId: objective.swarmCampaignId,
        activityType: "objective_completed",
        details: `Completed objective: ${objective.objective}`,
        timestamp: new Date().toISOString(),
        createdAt: Date.now(),
      });
    }
  },
});

// Add recent call
export const addRecentCall = mutation({
  args: {
    swarmId: v.id("swarmCampaigns"),
    agentId: v.string(),
    agentName: v.string(),
    callId: v.string(),
    prospect: v.string(),
    company: v.optional(v.string()),
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
    duration: v.number(),
    qualityScore: v.number(),
    sentiment: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    ),
    notes: v.optional(v.string()),
    nextAction: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.insert("swarmRecentCalls", {
      swarmCampaignId: args.swarmId,
      agentId: args.agentId,
      agentName: args.agentName,
      callId: args.callId,
      timestamp: new Date().toISOString(),
      prospect: args.prospect,
      company: args.company,
      outcome: args.outcome,
      duration: args.duration,
      qualityScore: args.qualityScore,
      sentiment: args.sentiment,
      notes: args.notes,
      nextAction: args.nextAction,
      createdAt: now,
    });
    
    // Update agent metrics
    await updateAgentMetrics(ctx, args.agentId, args.outcome, args.duration, args.qualityScore);
    
    // Update swarm metrics
    await updateSwarmMetrics(ctx, args.swarmId, args.outcome);
  },
});

// Update performance metrics
export const updatePerformanceMetrics = mutation({
  args: {
    swarmId: v.id("swarmCampaigns"),
    periodType: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    metrics: v.object({
      totalCalls: v.number(),
      connectedCalls: v.number(),
      conversions: v.number(),
      avgQualityScore: v.number(),
      scriptAdherence: v.number(),
    }),
  },
  
  handler: async (ctx, args) => {
    const now = new Date();
    const periodStart = getPeriodStart(now, args.periodType);
    const periodEnd = getPeriodEnd(now, args.periodType);
    
    // Check if metrics for this period exist
    const existing = await ctx.db
      .query("swarmPerformanceMetrics")
      .withIndex("by_swarm_period", (q) =>
        q.eq("swarmCampaignId", args.swarmId)
         .eq("periodType", args.periodType)
         .eq("periodStart", periodStart)
      )
      .first();
    
    if (existing) {
      // Update existing metrics
      await ctx.db.patch(existing._id, {
        ...args.metrics,
        connectionRate: (args.metrics.connectedCalls / args.metrics.totalCalls) * 100,
        conversionRate: (args.metrics.conversions / args.metrics.connectedCalls) * 100,
        updatedAt: Date.now(),
      });
    } else {
      // Create new metrics record
      await ctx.db.insert("swarmPerformanceMetrics", {
        swarmCampaignId: args.swarmId,
        periodType: args.periodType,
        periodStart,
        periodEnd,
        totalCalls: args.metrics.totalCalls,
        connectedCalls: args.metrics.connectedCalls,
        avgCallDuration: "0:00",
        connectionRate: (args.metrics.connectedCalls / args.metrics.totalCalls) * 100,
        callsMade: args.metrics.totalCalls,
        callsConnected: args.metrics.connectedCalls,
        prospectsInterested: Math.floor(args.metrics.connectedCalls * 0.3),
        prospectsQualified: Math.floor(args.metrics.connectedCalls * 0.15),
        conversions: args.metrics.conversions,
        avgQualityScore: args.metrics.avgQualityScore,
        scriptAdherence: args.metrics.scriptAdherence,
        objectionHandlingSuccess: 75,
        callsPerHour: args.metrics.totalCalls,
        conversionRate: (args.metrics.conversions / args.metrics.connectedCalls) * 100,
        appointmentRate: (args.metrics.conversions / args.metrics.totalCalls) * 100,
        peakHours: [10, 11, 14, 15],
        bestDays: [1, 2, 3, 4],
        avgRingTime: 8,
        updatedAt: Date.now(),
      });
    }
  },
});

// Update configuration
export const updateSwarmConfiguration = mutation({
  args: {
    swarmId: v.id("swarmCampaigns"),
    config: v.object({
      aiModel: v.optional(v.string()),
      voiceModel: v.optional(v.string()),
      personality: v.optional(v.union(
        v.literal("PROFESSIONAL"),
        v.literal("FRIENDLY"),
        v.literal("ENTHUSIASTIC"),
        v.literal("CONSULTATIVE")
      )),
      maxCallDuration: v.optional(v.number()),
      successThreshold: v.optional(v.number()),
      autoTransferEnabled: v.optional(v.boolean()),
      qualityCheckEnabled: v.optional(v.boolean()),
    }),
  },
  
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("swarmConfiguration")
      .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", args.swarmId))
      .first();
    
    if (!config) {
      throw new Error("Swarm configuration not found");
    }
    
    await ctx.db.patch(config._id, {
      ...args.config,
      updatedAt: Date.now(),
    });
    
    // Log configuration update
    await ctx.db.insert("swarmActivityLogs", {
      swarmCampaignId: args.swarmId,
      activityType: "configuration_updated",
      details: `Updated configuration: ${Object.keys(args.config).join(", ")}`,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });
  },
});

// Add auto-scaling rule
export const addAutoScalingRule = mutation({
  args: {
    swarmId: v.id("swarmCampaigns"),
    ruleName: v.string(),
    ruleType: v.union(
      v.literal("queue_based"),
      v.literal("time_based"),
      v.literal("performance_based"),
      v.literal("cost_based")
    ),
    metric: v.string(),
    operator: v.union(
      v.literal("greater_than"),
      v.literal("less_than"),
      v.literal("equals")
    ),
    threshold: v.number(),
    action: v.union(
      v.literal("scale_up"),
      v.literal("scale_down"),
      v.literal("maintain")
    ),
    scaleAmount: v.number(),
    cooldownPeriod: v.number(),
    priority: v.number(),
  },
  
  handler: async (ctx, args) => {
    const swarm = await ctx.db.get(args.swarmId);
    if (!swarm) {
      throw new Error("Swarm campaign not found");
    }
    
    await ctx.db.insert("swarmAutoScalingRules", {
      swarmCampaignId: args.swarmId,
      ruleName: args.ruleName,
      ruleType: args.ruleType,
      isActive: true,
      metric: args.metric,
      operator: args.operator,
      threshold: args.threshold,
      action: args.action,
      scaleAmount: args.scaleAmount,
      cooldownPeriod: args.cooldownPeriod,
      minAgents: swarm.minAgents,
      maxAgents: swarm.maxAgents,
      priority: args.priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Helper functions

async function activateSwarmAgents(ctx: any, swarmId: string) {
  const agents = await ctx.db
    .query("swarmAgents")
    .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", swarmId))
    .collect();
  
  await Promise.all(
    agents
      .filter(a => a.status === "idle" || a.status === "paused")
      .map(agent =>
        ctx.db.patch(agent._id, {
          status: "active",
          lastActivityTime: new Date().toISOString(),
          updatedAt: Date.now(),
        })
      )
  );
}

async function deactivateSwarmAgents(ctx: any, swarmId: string) {
  const agents = await ctx.db
    .query("swarmAgents")
    .withIndex("by_swarm", (q) => q.eq("swarmCampaignId", swarmId))
    .collect();
  
  await Promise.all(
    agents
      .filter(a => a.status === "active" || a.status === "calling")
      .map(agent =>
        ctx.db.patch(agent._id, {
          status: "paused",
          currentCallId: undefined,
          currentCustomer: undefined,
          lastActivityTime: new Date().toISOString(),
          updatedAt: Date.now(),
        })
      )
  );
}

async function updateAgentMetrics(
  ctx: any, 
  agentId: string, 
  outcome: string, 
  duration: number,
  qualityScore: number
) {
  const agent = await ctx.db
    .query("swarmAgents")
    .withIndex("by_agent", (q) => q.eq("agentId", agentId))
    .first();
  
  if (!agent) return;
  
  const isSuccess = ["Demo Scheduled", "Follow-up Needed", "Transferred"].includes(outcome);
  const totalCalls = agent.totalCalls + 1;
  const successfulCalls = agent.successfulCalls + (isSuccess ? 1 : 0);
  const failedCalls = agent.failedCalls + (isSuccess ? 0 : 1);
  
  await ctx.db.patch(agent._id, {
    totalCalls,
    successfulCalls,
    failedCalls,
    avgCallDuration: Math.round(
      (agent.avgCallDuration * agent.totalCalls + duration) / totalCalls
    ),
    successRate: Math.round((successfulCalls / totalCalls) * 100),
    qualityScore: Math.round(
      (agent.qualityScore * agent.totalCalls + qualityScore) / totalCalls
    ),
    updatedAt: Date.now(),
  });
}

async function updateSwarmMetrics(ctx: any, swarmId: string, outcome: string) {
  const swarm = await ctx.db.get(swarmId);
  if (!swarm) return;
  
  const isSuccess = ["Demo Scheduled", "Follow-up Needed", "Transferred"].includes(outcome);
  const totalCalls = swarm.totalCalls + 1;
  const successfulCalls = swarm.successfulCalls + (isSuccess ? 1 : 0);
  const failedCalls = swarm.failedCalls + (isSuccess ? 0 : 1);
  
  await ctx.db.patch(swarmId, {
    totalCalls,
    successfulCalls,
    failedCalls,
    successRate: Math.round((successfulCalls / totalCalls) * 100),
    updatedAt: Date.now(),
  });
}

async function createDefaultAutoScalingRules(ctx: any, swarmId: string, now: number) {
  const defaultRules = [
    {
      ruleName: "Queue Depth Scale Up",
      ruleType: "queue_based" as const,
      metric: "queue_depth",
      operator: "greater_than" as const,
      threshold: 50,
      action: "scale_up" as const,
      scaleAmount: 2,
      cooldownPeriod: 300, // 5 minutes
      priority: 1,
    },
    {
      ruleName: "Low Queue Scale Down",
      ruleType: "queue_based" as const,
      metric: "queue_depth",
      operator: "less_than" as const,
      threshold: 10,
      action: "scale_down" as const,
      scaleAmount: 1,
      cooldownPeriod: 600, // 10 minutes
      priority: 2,
    },
    {
      ruleName: "High Success Rate Scale Up",
      ruleType: "performance_based" as const,
      metric: "success_rate",
      operator: "greater_than" as const,
      threshold: 80,
      action: "scale_up" as const,
      scaleAmount: 1,
      cooldownPeriod: 900, // 15 minutes
      priority: 3,
    },
  ];
  
  const swarm = await ctx.db.get(swarmId);
  if (!swarm) return;
  
  await Promise.all(
    defaultRules.map(rule =>
      ctx.db.insert("swarmAutoScalingRules", {
        swarmCampaignId: swarmId,
        ...rule,
        isActive: true,
        minAgents: swarm.minAgents,
        maxAgents: swarm.maxAgents,
        createdAt: now,
        updatedAt: now,
      })
    )
  );
}

function getDefaultObjectives(purpose: string): any[] {
  const objectivesByPurpose = {
    Discovery: [
      {
        objective: "Identify Decision Makers",
        description: "Find and qualify key decision makers",
        targetValue: 100,
        unit: "contacts",
        priority: 10,
        isCritical: true,
      },
      {
        objective: "Schedule Demos",
        description: "Book product demonstrations",
        targetValue: 20,
        unit: "demos",
        priority: 9,
        isCritical: true,
      },
    ],
    Support: [
      {
        objective: "Resolve Issues",
        description: "Successfully resolve customer issues",
        targetValue: 50,
        unit: "tickets",
        priority: 10,
        isCritical: true,
      },
      {
        objective: "Customer Satisfaction",
        description: "Maintain high satisfaction scores",
        targetValue: 90,
        unit: "percent",
        priority: 8,
        isCritical: false,
      },
    ],
    Appointment: [
      {
        objective: "Book Appointments",
        description: "Schedule qualified appointments",
        targetValue: 30,
        unit: "appointments",
        priority: 10,
        isCritical: true,
      },
      {
        objective: "Confirm Attendance",
        description: "Get confirmation for scheduled appointments",
        targetValue: 25,
        unit: "confirmations",
        priority: 7,
        isCritical: false,
      },
    ],
    // Add more purpose-specific objectives
  };
  
  return objectivesByPurpose[purpose] || objectivesByPurpose.Discovery;
}

function getDefaultCallFlow(purpose: string): any[] {
  return [
    {
      phase: "Opening",
      description: "Introduction and rapport building",
      targetDuration: "30s",
      fallbackScript: "Hello, this is [Agent Name] from [Company]. How are you today?",
    },
    {
      phase: "Discovery",
      description: "Understand customer needs and pain points",
      targetDuration: "90s",
      fallbackScript: "I'm calling to learn about your current [solution/process]...",
    },
    {
      phase: "Value Proposition",
      description: "Present relevant solutions and benefits",
      targetDuration: "120s",
      fallbackScript: "Based on what you've shared, I believe we can help by...",
    },
    {
      phase: "Objection Handling",
      description: "Address concerns and objections",
      targetDuration: "60s",
      fallbackScript: "I understand your concern. Many of our clients felt the same way...",
    },
    {
      phase: "Closing",
      description: "Secure next steps or commitment",
      targetDuration: "45s",
      fallbackScript: "Would you be available for a brief demo next week?",
    },
  ];
}

function getDefaultSystemPrompt(purpose: string): string {
  const prompts = {
    Discovery: "You are a professional sales representative conducting discovery calls...",
    Support: "You are a helpful customer support specialist resolving issues...",
    Appointment: "You are an appointment setter coordinating schedules...",
  };
  
  return prompts[purpose] || prompts.Discovery;
}

function getPeriodStart(date: Date, periodType: string): string {
  const d = new Date(date);
  switch (periodType) {
    case "hourly":
      d.setMinutes(0, 0, 0);
      break;
    case "daily":
      d.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
  }
  return d.toISOString();
}

function getPeriodEnd(date: Date, periodType: string): string {
  const d = new Date(date);
  switch (periodType) {
    case "hourly":
      d.setHours(d.getHours() + 1);
      d.setMinutes(0, 0, 0);
      break;
    case "daily":
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      d.setDate(d.getDate() - d.getDay() + 7);
      d.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
  }
  return d.toISOString();
}
```

## Usage Examples

### Creating a Swarm Campaign

```typescript
// In your SwarmOverviewModal component
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateSwarmDialog() {
  const createSwarm = useMutation(api.mutations.swarmCampaigns.createSwarmCampaign);
  
  const handleCreate = async (formData: SwarmFormData) => {
    const swarmId = await createSwarm({
      name: formData.name,
      description: formData.description,
      purpose: formData.purpose,
      priority: "HIGH",
      totalAgents: formData.agentCount,
      minAgents: 2,
      maxAgents: formData.agentCount + 5,
      autoScalingEnabled: true,
      recordingEnabled: true,
    });
    
    // Start the campaign
    await updateStatus({
      swarmId,
      status: "active",
    });
  };
  
  return (
    <form onSubmit={handleCreate}>
      {/* Form fields */}
    </form>
  );
}
```

### Real-time Agent Management

```typescript
// Managing agents in the swarm
function AgentManagement({ swarmId }: { swarmId: string }) {
  const addAgent = useMutation(api.mutations.swarmCampaigns.addAgentToSwarm);
  const updateAgent = useMutation(api.mutations.swarmCampaigns.updateAgentStatus);
  
  const handleAddAgent = async () => {
    await addAgent({
      swarmId,
      agentName: `Agent-${Date.now()}`,
      voiceModel: "nova",
      personalityProfile: "professional",
    });
  };
  
  const handleAgentCall = async (agentId: string, customerId: string) => {
    await updateAgent({
      agentId,
      status: "calling",
      currentCallId: generateCallId(),
      currentCustomer: customerId,
    });
  };
  
  return (
    <div>
      {/* Agent controls */}
    </div>
  );
}
```

### Performance Tracking

```typescript
// Update performance metrics periodically
function usePerformanceTracking(swarmId: string) {
  const updateMetrics = useMutation(api.mutations.swarmCampaigns.updatePerformanceMetrics);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const metrics = await calculateCurrentMetrics(swarmId);
      
      await updateMetrics({
        swarmId,
        periodType: "hourly",
        metrics: {
          totalCalls: metrics.totalCalls,
          connectedCalls: metrics.connectedCalls,
          conversions: metrics.conversions,
          avgQualityScore: metrics.avgQualityScore,
          scriptAdherence: metrics.scriptAdherence,
        },
      });
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [swarmId]);
}
```

## Best Practices

1. **Campaign Lifecycle**: Always create default objectives and configuration when creating campaigns
2. **Agent Management**: Update agent metrics after each call for accurate performance tracking
3. **Auto-scaling**: Implement cooldown periods to prevent rapid scaling oscillations
4. **Activity Logging**: Log all significant events for audit trails
5. **Error Handling**: Validate swarm and agent existence before updates
6. **Performance**: Batch updates when possible to reduce database operations