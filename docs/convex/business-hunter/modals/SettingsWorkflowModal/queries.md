# SettingsWorkflowModal - Convex Queries

## Overview
Query functions for the Settings Workflow Modal to retrieve workflow configuration options and current settings.

## Required Queries

### getWorkflowSettings
```typescript
export const getWorkflowSettings = query({
  args: {
    workflowId: v.id("huntWorkflows"),
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
    
    // Get workflow settings or return defaults
    const settings = await ctx.db
      .query("huntWorkflowSettings")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    if (settings) {
      return settings;
    }
    
    // Return default settings for new workflows
    const defaultSettings = getDefaultSettings(user.plan || "free");
    return {
      workflowId: args.workflowId,
      ...defaultSettings,
      lastModified: new Date().toISOString(),
      modifiedBy: user._id,
      version: 1,
    };
  },
});

function getDefaultSettings(plan: string) {
  const planLimits = {
    free: {
      maxResults: 100,
      maxRequestsPerSecond: 1,
      enableDataEnrichment: false,
      enableCompanyLookup: false,
      enableContactLookup: false,
    },
    pro: {
      maxResults: 2500,
      maxRequestsPerSecond: 5,
      enableDataEnrichment: true,
      enableCompanyLookup: true,
      enableContactLookup: false,
    },
    enterprise: {
      maxResults: 10000,
      maxRequestsPerSecond: 10,
      enableDataEnrichment: true,
      enableCompanyLookup: true,
      enableContactLookup: true,
    },
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
    enableDataEnrichment: limits.enableDataEnrichment,
    enableSocialMediaLookup: true,
    enableCompanyLookup: limits.enableCompanyLookup,
    enableContactLookup: limits.enableContactLookup,
    defaultExportFormat: "csv",
    autoExportOnCompletion: false,
    rateLimiting: {
      requestsPerSecond: limits.maxRequestsPerSecond,
      requestsPerMinute: limits.maxRequestsPerSecond * 60,
      delayBetweenRequests: 500,
    },
  };
}
```

### getUserPlanLimits
```typescript
export const getUserPlanLimits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const plan = user.plan || "free";
    
    const planLimits = {
      free: {
        maxWorkflows: 3,
        maxResults: 100,
        maxRequestsPerSecond: 1,
        maxProxies: 0,
        enableDataEnrichment: false,
        enableCompanyLookup: false,
        enableContactLookup: false,
        enableSlackNotifications: false,
        enableCustomHeaders: false,
        enableProxyRotation: false,
        maxExportsPerDay: 3,
        exportFormats: ["csv"],
        features: [
          "Basic web scraping",
          "Email notifications",
          "CSV export",
          "Standard rate limiting"
        ],
        restrictions: [
          "Limited to 100 results per workflow",
          "No data enrichment",
          "No company database lookup",
          "No proxy support"
        ]
      },
      pro: {
        maxWorkflows: 25,
        maxResults: 2500,
        maxRequestsPerSecond: 5,
        maxProxies: 10,
        enableDataEnrichment: true,
        enableCompanyLookup: true,
        enableContactLookup: false,
        enableSlackNotifications: true,
        enableCustomHeaders: true,
        enableProxyRotation: true,
        maxExportsPerDay: 25,
        exportFormats: ["csv", "excel", "json"],
        features: [
          "Advanced web scraping",
          "Data enrichment APIs",
          "Company database lookup",
          "Slack notifications",
          "Custom headers",
          "Proxy rotation",
          "Multiple export formats"
        ],
        restrictions: [
          "Limited to 2,500 results per workflow",
          "No contact lookup API access"
        ]
      },
      enterprise: {
        maxWorkflows: -1, // unlimited
        maxResults: -1, // unlimited
        maxRequestsPerSecond: 10,
        maxProxies: -1, // unlimited
        enableDataEnrichment: true,
        enableCompanyLookup: true,
        enableContactLookup: true,
        enableSlackNotifications: true,
        enableCustomHeaders: true,
        enableProxyRotation: true,
        maxExportsPerDay: -1, // unlimited
        exportFormats: ["csv", "excel", "json", "crm"],
        features: [
          "Unlimited workflows and results",
          "Full data enrichment suite",
          "Contact lookup APIs",
          "CRM integration",
          "Custom integrations",
          "Priority support",
          "Dedicated infrastructure"
        ],
        restrictions: []
      }
    };
    
    return {
      currentPlan: plan,
      limits: planLimits[plan],
      upgradeOptions: plan !== "enterprise" ? {
        nextPlan: plan === "free" ? "pro" : "enterprise",
        benefits: plan === "free" ? planLimits.pro.features : planLimits.enterprise.features
      } : null
    };
  },
});
```

### getNotificationEventOptions
```typescript
export const getNotificationEventOptions = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        value: "started",
        label: "Workflow Started",
        description: "Notify when workflow begins execution"
      },
      {
        value: "milestone_25",
        label: "25% Complete",
        description: "Notify at 25% progress milestone"
      },
      {
        value: "milestone_50", 
        label: "50% Complete",
        description: "Notify at 50% progress milestone"
      },
      {
        value: "milestone_75",
        label: "75% Complete", 
        description: "Notify at 75% progress milestone"
      },
      {
        value: "completed",
        label: "Workflow Completed",
        description: "Notify when workflow finishes successfully"
      },
      {
        value: "failed",
        label: "Workflow Failed",
        description: "Notify when workflow encounters errors"
      },
      {
        value: "error",
        label: "Critical Errors",
        description: "Notify for critical errors during execution"
      }
    ];
  },
});
```

### getExportFormatOptions
```typescript
export const getExportFormatOptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const plan = user.plan || "free";
    
    const formatsByPlan = {
      free: [
        { value: "csv", label: "CSV", description: "Comma-separated values" }
      ],
      pro: [
        { value: "csv", label: "CSV", description: "Comma-separated values" },
        { value: "excel", label: "Excel", description: "Microsoft Excel format" },
        { value: "json", label: "JSON", description: "JavaScript Object Notation" }
      ],
      enterprise: [
        { value: "csv", label: "CSV", description: "Comma-separated values" },
        { value: "excel", label: "Excel", description: "Microsoft Excel format" },
        { value: "json", label: "JSON", description: "JavaScript Object Notation" },
        { value: "crm", label: "CRM Integration", description: "Direct CRM platform integration" }
      ]
    };
    
    return formatsByPlan[plan] || formatsByPlan.free;
  },
});
```

### getWorkflowChangeHistory
```typescript
export const getWorkflowChangeHistory = query({
  args: {
    workflowId: v.id("huntWorkflows"),
    limit: v.optional(v.number()),
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
    
    const limit = Math.min(args.limit || 10, 50);
    
    const changes = await ctx.db
      .query("huntWorkflowChangeLog")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .take(limit);
    
    // Enrich with user information
    const enrichedChanges = await Promise.all(
      changes.map(async (change) => {
        const changeUser = await ctx.db.get(change.changedBy);
        return {
          ...change,
          changedByUser: changeUser ? {
            name: changeUser.name,
            email: changeUser.email
          } : { name: "Unknown User", email: "" }
        };
      })
    );
    
    return enrichedChanges;
  },
});
```

### validateSlackWebhook
```typescript
export const validateSlackWebhook = query({
  args: {
    webhookUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Basic URL validation
    try {
      const url = new URL(args.webhookUrl);
      
      // Check if it's a valid Slack webhook URL pattern
      const isSlackWebhook = url.hostname === "hooks.slack.com" && 
                            url.pathname.startsWith("/services/");
      
      if (!isSlackWebhook) {
        return {
          isValid: false,
          message: "URL must be a valid Slack webhook URL"
        };
      }
      
      return {
        isValid: true,
        message: "Valid Slack webhook URL format"
      };
      
    } catch {
      return {
        isValid: false,
        message: "Invalid URL format"
      };
    }
  },
});
```

### getSearchFrequencyOptions
```typescript
export const getSearchFrequencyOptions = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        value: "conservative",
        label: "Conservative",
        description: "Slower pace, less resource intensive",
        requestsPerSecond: 1,
        delayBetweenRequests: 1000,
        recommendedFor: "Large workflows, shared resources"
      },
      {
        value: "moderate",
        label: "Moderate",
        description: "Balanced speed and resource usage",
        requestsPerSecond: 3,
        delayBetweenRequests: 500,
        recommendedFor: "Most workflows, good default"
      },
      {
        value: "aggressive",
        label: "Aggressive",
        description: "Faster pace, higher resource usage",
        requestsPerSecond: 5,
        delayBetweenRequests: 200,
        recommendedFor: "Small workflows, dedicated resources"
      }
    ];
  },
});
```

## Query Usage Patterns

### Modal Initialization
1. **getWorkflowSettings** - Load current settings
2. **getUserPlanLimits** - Check what features are available
3. **getNotificationEventOptions** - Populate notification checkboxes

### Form Population
1. **getExportFormatOptions** - Based on user plan
2. **getSearchFrequencyOptions** - Frequency explanations
3. **validateSlackWebhook** - Real-time webhook validation

### History & Audit
1. **getWorkflowChangeHistory** - Show previous setting changes
2. Change comparison for understanding impact

## Access Control
- All queries require authentication
- Workflow ownership verification
- Plan-based feature availability
- Proper error handling for missing resources