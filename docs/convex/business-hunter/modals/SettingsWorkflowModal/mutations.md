# SettingsWorkflowModal - Convex Mutations

## Overview
Mutation functions for updating workflow settings through the Settings Workflow Modal, including validation and change tracking.

## Required Mutations

### updateWorkflowSettings
```typescript
export const updateWorkflowSettings = mutation({
  args: {
    workflowId: v.id("huntWorkflows"),
    settings: v.object({
      autoValidation: v.optional(v.boolean()),
      qualityThreshold: v.optional(v.number()),
      maxResults: v.optional(v.number()),
      searchFrequency: v.optional(v.union(
        v.literal("aggressive"),
        v.literal("moderate"),
        v.literal("conservative")
      )),
      retryFailedSources: v.optional(v.boolean()),
      skipDuplicates: v.optional(v.boolean()),
      respectRobotsTxt: v.optional(v.boolean()),
      emailNotifications: v.optional(v.boolean()),
      slackWebhook: v.optional(v.string()),
      notificationEvents: v.optional(v.array(v.string())),
      enableDataEnrichment: v.optional(v.boolean()),
      enableSocialMediaLookup: v.optional(v.boolean()),
      enableCompanyLookup: v.optional(v.boolean()),
      enableContactLookup: v.optional(v.boolean()),
      defaultExportFormat: v.optional(v.string()),
      autoExportOnCompletion: v.optional(v.boolean()),
      exportDestination: v.optional(v.string()),
      customHeaders: v.optional(v.object({
        userAgent: v.optional(v.string()),
        referer: v.optional(v.string()),
        acceptLanguage: v.optional(v.string()),
      })),
      proxySettings: v.optional(v.object({
        enabled: v.boolean(),
        rotateProxies: v.boolean(),
        maxProxyRetries: v.number(),
      })),
      rateLimiting: v.optional(v.object({
        requestsPerSecond: v.number(),
        requestsPerMinute: v.number(),
        delayBetweenRequests: v.number(),
      })),
    }),
    changeReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Workflow not found or access denied");
    }
    
    // Get current settings
    const currentSettings = await ctx.db
      .query("huntWorkflowSettings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    // Validate settings against user plan
    const planLimits = await getUserPlanLimits(ctx, user);
    const validationResult = await validateSettings(args.settings, planLimits, user.plan || "free");
    
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join("; "));
    }
    
    // Determine which fields are changing
    const previousValues = currentSettings ? 
      extractRelevantFields(currentSettings, Object.keys(args.settings)) : {};
    const changedFields = getChangedFields(previousValues, args.settings);
    
    if (changedFields.length === 0) {
      throw new Error("No changes detected");
    }
    
    // Check if changes require workflow restart
    const requiresRestart = checkIfRestartRequired(changedFields, workflow.status);
    
    // Update or create settings
    const timestamp = new Date().toISOString();
    const newVersion = currentSettings ? currentSettings.version + 1 : 1;
    
    if (currentSettings) {
      await ctx.db.patch(currentSettings._id, {
        ...args.settings,
        lastModified: timestamp,
        modifiedBy: user._id,
        version: newVersion,
      });
    } else {
      // Create new settings record
      const defaultSettings = getDefaultSettings(user.plan || "free");
      await ctx.db.insert("huntWorkflowSettings", {
        workflowId: args.workflowId,
        ...defaultSettings,
        ...args.settings,
        lastModified: timestamp,
        modifiedBy: user._id,
        version: newVersion,
      });
    }
    
    // Log the change
    await ctx.db.insert("huntWorkflowChangeLog", {
      workflowId: args.workflowId,
      settingsVersion: newVersion,
      changedFields,
      previousValues,
      newValues: args.settings,
      changeReason: args.changeReason,
      changeType: "user_update",
      changedBy: user._id,
      changedAt: timestamp,
      requiresRestart,
      affectedComponents: getAffectedComponents(changedFields),
    });
    
    // If workflow is active and requires restart, handle accordingly
    if (requiresRestart && ["searching", "scraping", "analyzing", "validating"].includes(workflow.status)) {
      await handleWorkflowRestart(ctx, args.workflowId, workflow.status);
    }
    
    // Send notification if configured
    if (args.settings.emailNotifications !== false) {
      await ctx.scheduler.runAfter(0, "sendSettingsChangeNotification", {
        workflowId: args.workflowId,
        userId: user._id,
        changedFields,
        requiresRestart,
      });
    }
    
    return {
      success: true,
      version: newVersion,
      requiresRestart,
      changedFields,
    };
  },
});

async function getUserPlanLimits(ctx: any, user: any) {
  const plan = user.plan || "free";
  
  const planLimits = {
    free: {
      maxResults: 100,
      maxRequestsPerSecond: 1,
      enableDataEnrichment: false,
      enableCompanyLookup: false,
      enableContactLookup: false,
      enableSlackNotifications: false,
      enableCustomHeaders: false,
      enableProxyRotation: false,
      maxExportsPerDay: 3,
      exportFormats: ["csv"],
    },
    pro: {
      maxResults: 2500,
      maxRequestsPerSecond: 5,
      enableDataEnrichment: true,
      enableCompanyLookup: true,
      enableContactLookup: false,
      enableSlackNotifications: true,
      enableCustomHeaders: true,
      enableProxyRotation: true,
      maxExportsPerDay: 25,
      exportFormats: ["csv", "excel", "json"],
    },
    enterprise: {
      maxResults: -1,
      maxRequestsPerSecond: 10,
      enableDataEnrichment: true,
      enableCompanyLookup: true,
      enableContactLookup: true,
      enableSlackNotifications: true,
      enableCustomHeaders: true,
      enableProxyRotation: true,
      maxExportsPerDay: -1,
      exportFormats: ["csv", "excel", "json", "crm"],
    },
  };
  
  return planLimits[plan] || planLimits.free;
}

async function validateSettings(settings: any, planLimits: any, plan: string) {
  const errors: string[] = [];
  
  // Validate quality threshold
  if (settings.qualityThreshold !== undefined) {
    if (settings.qualityThreshold < 0 || settings.qualityThreshold > 100) {
      errors.push("Quality threshold must be between 0 and 100");
    }
  }
  
  // Validate max results against plan
  if (settings.maxResults !== undefined && planLimits.maxResults !== -1) {
    if (settings.maxResults > planLimits.maxResults) {
      errors.push(`Max results cannot exceed ${planLimits.maxResults} for ${plan} plan`);
    }
  }
  
  // Validate rate limiting
  if (settings.rateLimiting) {
    const { requestsPerSecond, requestsPerMinute, delayBetweenRequests } = settings.rateLimiting;
    
    if (requestsPerSecond > planLimits.maxRequestsPerSecond) {
      errors.push(`Requests per second cannot exceed ${planLimits.maxRequestsPerSecond} for ${plan} plan`);
    }
    
    if (delayBetweenRequests < 100 || delayBetweenRequests > 5000) {
      errors.push("Delay between requests must be between 100 and 5000 milliseconds");
    }
    
    if (requestsPerMinute > requestsPerSecond * 60) {
      errors.push("Requests per minute cannot exceed requests per second * 60");
    }
  }
  
  // Validate plan-restricted features
  if (settings.enableDataEnrichment && !planLimits.enableDataEnrichment) {
    errors.push(`Data enrichment not available for ${plan} plan`);
  }
  
  if (settings.enableCompanyLookup && !planLimits.enableCompanyLookup) {
    errors.push(`Company lookup not available for ${plan} plan`);
  }
  
  if (settings.enableContactLookup && !planLimits.enableContactLookup) {
    errors.push(`Contact lookup not available for ${plan} plan`);
  }
  
  if (settings.slackWebhook && !planLimits.enableSlackNotifications) {
    errors.push(`Slack notifications not available for ${plan} plan`);
  }
  
  if (settings.customHeaders && !planLimits.enableCustomHeaders) {
    errors.push(`Custom headers not available for ${plan} plan`);
  }
  
  if (settings.proxySettings?.enabled && !planLimits.enableProxyRotation) {
    errors.push(`Proxy rotation not available for ${plan} plan`);
  }
  
  // Validate export format
  if (settings.defaultExportFormat && !planLimits.exportFormats.includes(settings.defaultExportFormat)) {
    errors.push(`Export format '${settings.defaultExportFormat}' not available for ${plan} plan`);
  }
  
  // Validate Slack webhook URL format
  if (settings.slackWebhook) {
    try {
      const url = new URL(settings.slackWebhook);
      if (url.hostname !== "hooks.slack.com" || !url.pathname.startsWith("/services/")) {
        errors.push("Invalid Slack webhook URL format");
      }
    } catch {
      errors.push("Invalid Slack webhook URL");
    }
  }
  
  // Validate notification events
  if (settings.notificationEvents) {
    const validEvents = ["started", "milestone_25", "milestone_50", "milestone_75", "completed", "failed", "error"];
    const invalidEvents = settings.notificationEvents.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      errors.push(`Invalid notification events: ${invalidEvents.join(", ")}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

function getDefaultSettings(plan: string) {
  const planLimits = {
    free: { maxResults: 100, maxRequestsPerSecond: 1 },
    pro: { maxResults: 2500, maxRequestsPerSecond: 5 },
    enterprise: { maxResults: 10000, maxRequestsPerSecond: 10 },
  };
  
  const limits = planLimits[plan] || planLimits.free;
  
  return {
    autoValidation: true,
    qualityThreshold: 70,
    maxResults: limits.maxResults,
    searchFrequency: "moderate",
    retryFailedSources: true,
    skipDuplicates: true,
    respectRobotsTxt: true,
    emailNotifications: true,
    notificationEvents: ["completed", "failed"],
    enableDataEnrichment: false,
    enableSocialMediaLookup: true,
    enableCompanyLookup: false,
    enableContactLookup: false,
    defaultExportFormat: "csv",
    autoExportOnCompletion: false,
    rateLimiting: {
      requestsPerSecond: limits.maxRequestsPerSecond,
      requestsPerMinute: limits.maxRequestsPerSecond * 60,
      delayBetweenRequests: 500,
    },
  };
}

function extractRelevantFields(settings: any, fields: string[]) {
  const relevant = {};
  fields.forEach(field => {
    if (settings[field] !== undefined) {
      relevant[field] = settings[field];
    }
  });
  return relevant;
}

function getChangedFields(previous: any, updates: any): string[] {
  const changed: string[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    const previousValue = previous[key];
    
    if (JSON.stringify(previousValue) !== JSON.stringify(value)) {
      changed.push(key);
    }
  });
  
  return changed;
}

function checkIfRestartRequired(changedFields: string[], workflowStatus: string): boolean {
  // Fields that require workflow restart if changed during execution
  const restartRequiredFields = [
    "maxResults",
    "searchFrequency", 
    "rateLimiting",
    "proxySettings",
    "customHeaders",
    "respectRobotsTxt",
    "retryFailedSources",
    "enableDataEnrichment",
    "enableSocialMediaLookup",
    "enableCompanyLookup",
    "enableContactLookup",
  ];
  
  const activeStatuses = ["searching", "scraping", "analyzing", "validating"];
  
  if (!activeStatuses.includes(workflowStatus)) {
    return false;
  }
  
  return changedFields.some(field => restartRequiredFields.includes(field));
}

function getAffectedComponents(changedFields: string[]): string[] {
  const componentMap = {
    "maxResults": ["scraper", "validator"],
    "searchFrequency": ["scheduler", "scraper"],
    "rateLimiting": ["scheduler", "scraper"],
    "proxySettings": ["scraper", "network"],
    "customHeaders": ["scraper", "network"],
    "enableDataEnrichment": ["enrichment", "api"],
    "enableSocialMediaLookup": ["enrichment", "social"],
    "enableCompanyLookup": ["enrichment", "company"],
    "enableContactLookup": ["enrichment", "contact"],
    "emailNotifications": ["notifications", "email"],
    "slackWebhook": ["notifications", "slack"],
    "autoExportOnCompletion": ["export", "automation"],
  };
  
  const components = new Set<string>();
  changedFields.forEach(field => {
    const fieldComponents = componentMap[field] || [];
    fieldComponents.forEach(comp => components.add(comp));
  });
  
  return Array.from(components);
}

async function handleWorkflowRestart(ctx: any, workflowId: string, currentStatus: string) {
  // Pause the workflow
  await ctx.db.patch(workflowId, {
    status: "idle",
    progress: 0, // Reset progress
  });
  
  // Schedule restart after brief delay
  await ctx.scheduler.runAfter(5000, "restartWorkflowWithNewSettings", {
    workflowId,
    previousStatus: currentStatus,
  });
}
```

### resetWorkflowSettings
```typescript
export const resetWorkflowSettings = mutation({
  args: {
    workflowId: v.id("huntWorkflows"),
    changeReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Workflow not found or access denied");
    }
    
    const currentSettings = await ctx.db
      .query("huntWorkflowSettings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (!currentSettings) {
      throw new Error("No settings to reset");
    }
    
    // Get default settings
    const defaultSettings = getDefaultSettings(user.plan || "free");
    const timestamp = new Date().toISOString();
    const newVersion = currentSettings.version + 1;
    
    // Store previous values for change log
    const previousValues = extractRelevantFields(currentSettings, Object.keys(defaultSettings));
    
    // Update settings to defaults
    await ctx.db.patch(currentSettings._id, {
      ...defaultSettings,
      lastModified: timestamp,
      modifiedBy: user._id,
      version: newVersion,
    });
    
    // Log the reset
    await ctx.db.insert("huntWorkflowChangeLog", {
      workflowId: args.workflowId,
      settingsVersion: newVersion,
      changedFields: Object.keys(defaultSettings),
      previousValues,
      newValues: defaultSettings,
      changeReason: args.changeReason || "Reset to defaults",
      changeType: "user_update",
      changedBy: user._id,
      changedAt: timestamp,
      requiresRestart: ["searching", "scraping", "analyzing", "validating"].includes(workflow.status),
      affectedComponents: ["all"],
    });
    
    return {
      success: true,
      version: newVersion,
      resetToDefaults: true,
    };
  },
});
```

### testSlackWebhook
```typescript
export const testSlackWebhook = mutation({
  args: {
    webhookUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Validate URL format
    try {
      const url = new URL(args.webhookUrl);
      if (url.hostname !== "hooks.slack.com" || !url.pathname.startsWith("/services/")) {
        throw new Error("Invalid Slack webhook URL format");
      }
    } catch {
      throw new Error("Invalid URL format");
    }
    
    // Schedule test message
    await ctx.scheduler.runAfter(0, "sendSlackTestMessage", {
      webhookUrl: args.webhookUrl,
      userEmail: identity.email,
    });
    
    return {
      success: true,
      message: "Test message sent to Slack webhook",
    };
  },
});
```

## Validation Rules

### Setting Constraints
- Quality threshold: 0-100
- Max results: Plan-dependent limits
- Rate limiting: Within plan boundaries
- Notification events: Valid event types only

### Plan Restrictions
- Features enabled based on user plan
- Rate limits enforced per plan
- Export formats restricted by plan
- Advanced features require upgrade

### Business Rules
- Settings changes tracked in audit log
- Restart required for certain changes during active workflows
- Default settings provided for new workflows
- Previous values preserved for rollback capability

## Background Processing
- **sendSettingsChangeNotification** - Email user about changes
- **restartWorkflowWithNewSettings** - Restart workflow with new config
- **sendSlackTestMessage** - Test Slack webhook connectivity