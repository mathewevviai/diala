# HuntConfigurationModal - Convex Mutations

## Overview
Mutation functions for creating and managing hunt configuration workflows from the Business Hunter modal.

## Required Mutations

### createHuntWorkflow
```typescript
export const createHuntWorkflow = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    businessType: v.string(),
    keywords: v.array(v.string()),
    includeLinkedIn: v.boolean(),
    searchDepth: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Validate workflow name uniqueness
    const existingWorkflow = await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existingWorkflow) {
      throw new Error("A workflow with this name already exists");
    }
    
    // Check usage limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyWorkflows = await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), currentMonth))
      .collect();
    
    const planLimits = {
      free: 3,
      pro: 25,
      enterprise: -1,
    };
    
    const userPlan = user.plan || "free";
    const maxWorkflows = planLimits[userPlan];
    
    if (maxWorkflows !== -1 && monthlyWorkflows.length >= maxWorkflows) {
      throw new Error(`Monthly workflow limit reached for ${userPlan} plan`);
    }
    
    // Check for active workflows limit (max 1 active per user)
    const activeWorkflows = await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "searching"),
          q.eq(q.field("status"), "scraping"),
          q.eq(q.field("status"), "analyzing"),
          q.eq(q.field("status"), "validating")
        )
      )
      .collect();
    
    if (activeWorkflows.length >= 1) {
      throw new Error("You can only have one active workflow at a time");
    }
    
    // Validate input parameters
    if (args.name.length < 3 || args.name.length > 100) {
      throw new Error("Workflow name must be between 3 and 100 characters");
    }
    
    if (args.location.length < 2) {
      throw new Error("Location must be at least 2 characters");
    }
    
    if (args.keywords.length === 0 || args.keywords.length > 10) {
      throw new Error("Must provide between 1 and 10 keywords");
    }
    
    if (args.searchDepth < 1 || args.searchDepth > 5) {
      throw new Error("Search depth must be between 1 and 5");
    }
    
    // Remove duplicate keywords
    const uniqueKeywords = Array.from(new Set(args.keywords.map(k => k.trim().toLowerCase())));
    
    // Create the workflow
    const workflowId = await ctx.db.insert("huntWorkflows", {
      name: args.name.trim(),
      status: "searching",
      progress: 0,
      location: args.location.trim(),
      businessType: args.businessType,
      keywords: uniqueKeywords,
      includeLinkedIn: args.includeLinkedIn,
      searchDepth: args.searchDepth,
      pagesFound: 0,
      pagesScraped: 0,
      businessesExtracted: 0,
      businessesValidated: 0,
      matchRate: 0,
      createdAt: new Date().toISOString(),
      estimatedTime: calculateEstimatedTime(args.searchDepth, uniqueKeywords.length),
      userId: user._id,
    });
    
    // Log workflow creation
    await ctx.db.insert("huntWorkflowAudit", {
      workflowId,
      action: "created",
      previousStatus: null,
      newStatus: "searching",
      userId: user._id,
      timestamp: new Date().toISOString(),
      metadata: {
        location: args.location,
        businessType: args.businessType,
        keywordCount: uniqueKeywords.length,
        searchDepth: args.searchDepth,
      },
    });
    
    // Trigger background workflow processing
    await ctx.scheduler.runAfter(0, "processHuntWorkflow", { workflowId });
    
    return workflowId;
  },
});

// Helper function to calculate estimated time
function calculateEstimatedTime(searchDepth: number, keywordCount: number): string {
  const baseMinutes = 30;
  const depthMultiplier = searchDepth * 0.5;
  const keywordMultiplier = keywordCount * 0.2;
  
  const totalMinutes = Math.round(baseMinutes * (1 + depthMultiplier + keywordMultiplier));
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
  }
}
```

### saveWorkflowTemplate
```typescript
export const saveWorkflowTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    businessType: v.string(),
    keywords: v.array(v.string()),
    searchDepth: v.number(),
    includeLinkedIn: v.boolean(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Validate template data
    if (args.name.length < 3 || args.name.length > 50) {
      throw new Error("Template name must be between 3 and 50 characters");
    }
    
    if (args.description.length < 10 || args.description.length > 200) {
      throw new Error("Description must be between 10 and 200 characters");
    }
    
    const templateId = await ctx.db.insert("huntWorkflowTemplates", {
      name: args.name.trim(),
      description: args.description.trim(),
      category: args.category,
      defaultBusinessType: args.businessType,
      defaultKeywords: Array.from(new Set(args.keywords.map(k => k.trim().toLowerCase()))),
      defaultSearchDepth: args.searchDepth,
      defaultIncludeLinkedIn: args.includeLinkedIn,
      isPublic: args.isPublic,
      usageCount: 0,
      createdBy: user._id,
      createdAt: new Date().toISOString(),
    });
    
    return templateId;
  },
});
```

### incrementTemplateUsage
```typescript
export const incrementTemplateUsage = mutation({
  args: {
    templateId: v.id("huntWorkflowTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    
    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
    });
  },
});
```

### updateUserPlan
```typescript
export const updateUserPlan = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(user._id, {
      plan: args.plan,
      planUpdatedAt: new Date().toISOString(),
    });
    
    return user._id;
  },
});
```

## Validation Rules

### Input Validation
- **name**: 3-100 characters, trimmed
- **location**: Minimum 2 characters
- **keywords**: 1-10 unique keywords, lowercased
- **searchDepth**: 1-5 integer value

### Business Rules
- Only one active workflow per user
- Monthly workflow limits based on plan
- Duplicate workflow names not allowed per user
- Template names must be unique per user

### Error Handling
- Authentication required for all operations
- Clear error messages for validation failures
- Proper error codes for different failure types
- Rollback on partial failures

## Background Processing
After creating a workflow, the system triggers:
1. **processHuntWorkflow** - Starts the search pipeline
2. **Audit logging** - Records workflow creation
3. **Usage tracking** - Updates user statistics