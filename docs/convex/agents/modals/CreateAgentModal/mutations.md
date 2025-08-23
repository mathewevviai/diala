# CreateAgentModal Mutations

## Overview
Mutations for creating and managing voice agents through the wizard interface.

## Primary Mutations

### `createVoiceAgent`
Creates a new voice agent with full configuration

```typescript
export const createVoiceAgent = mutation({
  args: {
    // Step 1: Basic Information
    name: v.string(),
    description: v.string(),
    purpose: v.union(
      v.literal("sales"),
      v.literal("support"),
      v.literal("appointment"),
      v.literal("technical"),
      v.literal("custom")
    ),
    customPurpose: v.optional(v.string()),
    
    // Step 2: Voice Configuration
    voiceProvider: v.union(v.literal("elevenlabs"), v.literal("chatterbox")),
    voiceId: v.string(),
    voiceStyle: v.string(),
    speechRate: v.number(),
    pitch: v.number(),
    
    // Step 3: Language & Behavior
    language: v.string(),
    responseDelay: v.number(),
    interruptionSensitivity: v.number(),
    silenceThreshold: v.number(),
    maxCallDuration: v.number(),
    
    // Step 4: Advanced Settings
    systemPrompt: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    enableTranscription: v.boolean(),
    enableAnalytics: v.boolean(),
    webhookUrl: v.optional(v.string()),
  },
  
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // 2. Check agent limits
    const existingAgents = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const agentLimit = getAgentLimitByTier(user.tier);
    if (existingAgents.length >= agentLimit) {
      throw new Error(`Agent limit reached. Your ${user.tier} plan allows ${agentLimit} agents.`);
    }
    
    // 3. Validate premium features
    if (args.voiceProvider === "elevenlabs" && !["premium", "enterprise"].includes(user.tier)) {
      throw new Error("ElevenLabs voices are only available on Premium and Enterprise plans");
    }
    
    // 4. Check name uniqueness
    const existingName = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existingName) {
      throw new Error("An agent with this name already exists");
    }
    
    // 5. Create the agent
    const agentId = await ctx.db.insert("voiceAgents", {
      ...args,
      userId: user._id,
      status: "configuring",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalCalls: 0,
      successRate: 0,
      avgCallDuration: "0:00",
      satisfactionRating: 0,
    });
    
    // 6. Create initial configuration
    await ctx.db.insert("agentConfigurations", {
      agentId,
      version: 1,
      configuration: {
        systemPrompt: args.systemPrompt,
        temperature: args.temperature,
        maxTokens: args.maxTokens,
        voiceSettings: {
          provider: args.voiceProvider,
          voiceId: args.voiceId,
          speechRate: args.speechRate,
          pitch: args.pitch,
        },
        behaviorSettings: {
          responseDelay: args.responseDelay,
          interruptionSensitivity: args.interruptionSensitivity,
          silenceThreshold: args.silenceThreshold,
          maxCallDuration: args.maxCallDuration,
        },
      },
      createdAt: new Date().toISOString(),
      createdBy: user._id,
      isActive: true,
    });
    
    // 7. Setup webhook if provided
    if (args.webhookUrl) {
      await ctx.db.insert("agentWebhooks", {
        agentId,
        url: args.webhookUrl,
        events: ["call.started", "call.ended", "call.failed"],
        isActive: true,
        failureCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // 8. Schedule activation
    await ctx.scheduler.runAfter(0, "activateAgent", { agentId });
    
    return { agentId, success: true };
  },
});
```

### `updateAgentConfiguration`
Updates an existing agent's configuration

```typescript
export const updateAgentConfiguration = mutation({
  args: {
    agentId: v.id("voiceAgents"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      systemPrompt: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      // ... other optional fields
    }),
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
    
    // Update agent
    await ctx.db.patch(args.agentId, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });
    
    // Create new configuration version if system settings changed
    if (args.updates.systemPrompt || args.updates.temperature || args.updates.maxTokens) {
      const latestConfig = await ctx.db
        .query("agentConfigurations")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .first();
      
      if (latestConfig) {
        await ctx.db.patch(latestConfig._id, { isActive: false });
        
        await ctx.db.insert("agentConfigurations", {
          agentId: args.agentId,
          version: (latestConfig.version || 0) + 1,
          configuration: {
            ...latestConfig.configuration,
            systemPrompt: args.updates.systemPrompt || latestConfig.configuration.systemPrompt,
            temperature: args.updates.temperature || latestConfig.configuration.temperature,
            maxTokens: args.updates.maxTokens || latestConfig.configuration.maxTokens,
          },
          createdAt: new Date().toISOString(),
          createdBy: user!._id,
          isActive: true,
        });
      }
    }
    
    return { success: true };
  },
});
```

### `deleteAgent`
Soft deletes an agent and archives its data

```typescript
export const deleteAgent = mutation({
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
    
    // Check for active calls
    const activeCalls = await ctx.db
      .query("agentCallLogs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    
    if (activeCalls.length > 0) {
      throw new Error("Cannot delete agent with active calls");
    }
    
    // Update status to deleted
    await ctx.db.patch(args.agentId, {
      status: "deleted",
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Deactivate webhooks
    const webhooks = await ctx.db
      .query("agentWebhooks")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
    
    for (const webhook of webhooks) {
      await ctx.db.patch(webhook._id, { isActive: false });
    }
    
    return { success: true };
  },
});
```

### `toggleAgentStatus`
Toggles agent between active/offline states

```typescript
export const toggleAgentStatus = mutation({
  args: {
    agentId: v.id("voiceAgents"),
    status: v.union(v.literal("active"), v.literal("offline")),
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
    
    // Update status
    await ctx.db.patch(args.agentId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
      lastActiveAt: args.status === "active" ? new Date().toISOString() : agent.lastActiveAt,
    });
    
    return { success: true };
  },
});
```

### `duplicateAgent`
Creates a copy of an existing agent

```typescript
export const duplicateAgent = mutation({
  args: {
    agentId: v.id("voiceAgents"),
    newName: v.string(),
  },
  
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const sourceAgent = await ctx.db.get(args.agentId);
    if (!sourceAgent) throw new Error("Agent not found");
    
    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (sourceAgent.userId !== user?._id) {
      throw new Error("Unauthorized");
    }
    
    // Check agent limits
    const existingAgents = await ctx.db
      .query("voiceAgents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const agentLimit = getAgentLimitByTier(user.tier);
    if (existingAgents.length >= agentLimit) {
      throw new Error(`Agent limit reached. Your ${user.tier} plan allows ${agentLimit} agents.`);
    }
    
    // Get latest configuration
    const latestConfig = await ctx.db
      .query("agentConfigurations")
      .withIndex("by_agent_active", (q) => 
        q.eq("agentId", args.agentId).eq("isActive", true)
      )
      .first();
    
    // Create duplicate
    const { _id, _creationTime, ...agentData } = sourceAgent;
    const newAgentId = await ctx.db.insert("voiceAgents", {
      ...agentData,
      name: args.newName,
      status: "configuring",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalCalls: 0,
      successRate: 0,
      avgCallDuration: "0:00",
      satisfactionRating: 0,
    });
    
    // Duplicate configuration
    if (latestConfig) {
      await ctx.db.insert("agentConfigurations", {
        agentId: newAgentId,
        version: 1,
        configuration: latestConfig.configuration,
        createdAt: new Date().toISOString(),
        createdBy: user._id,
        isActive: true,
      });
    }
    
    // Schedule activation
    await ctx.scheduler.runAfter(0, "activateAgent", { agentId: newAgentId });
    
    return { agentId: newAgentId, success: true };
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

### `validateWebhookUrl`
```typescript
function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

## Background Jobs

### `activateAgent`
Activates agent after configuration is complete

```typescript
export const activateAgent = internalMutation({
  args: {
    agentId: v.id("voiceAgents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.status !== "configuring") return;
    
    // Verify configuration exists
    const config = await ctx.db
      .query("agentConfigurations")
      .withIndex("by_agent_active", (q) => 
        q.eq("agentId", args.agentId).eq("isActive", true)
      )
      .first();
    
    if (!config) {
      await ctx.db.patch(args.agentId, {
        status: "error",
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    
    // Activate agent
    await ctx.db.patch(args.agentId, {
      status: "active",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  },
});
```