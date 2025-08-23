# HuntConfigurationModal - Convex Queries

## Overview
Query functions needed for the Hunt Configuration Modal to fetch data for creating new business discovery workflows.

## Required Queries

### getUserWorkflows
```typescript
export const getUserWorkflows = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    return await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});
```

### getActiveWorkflowsCount
```typescript
export const getActiveWorkflowsCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
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
    
    return activeWorkflows.length;
  },
});
```

### getWorkflowTemplates
```typescript
export const getWorkflowTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("huntWorkflowTemplates")
      .withIndex("by_public", (q) => q.eq("isPublic", true));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    return await query
      .order("desc")
      .collect();
  },
});
```

### getBusinessTypeOptions
```typescript
export const getBusinessTypeOptions = query({
  args: {},
  handler: async (ctx) => {
    // Return predefined business type categories
    return [
      "Software / SaaS",
      "E-commerce",
      "Financial Services",
      "Healthcare",
      "Manufacturing",
      "Professional Services", 
      "Real Estate",
      "Retail",
      "Technology",
      "Consulting",
      "Marketing / Advertising",
      "Education",
      "Non-profit",
      "Other"
    ];
  },
});
```

### getUserUsageLimits
```typescript
export const getUserUsageLimits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Get user's current usage this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const monthlyWorkflows = await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), currentMonth))
      .collect();
    
    const totalBusinessesExtracted = monthlyWorkflows.reduce(
      (sum, workflow) => sum + workflow.businessesExtracted,
      0
    );
    
    // Return usage limits based on user plan
    const planLimits = {
      free: { maxWorkflows: 3, maxBusinesses: 100 },
      pro: { maxWorkflows: 25, maxBusinesses: 2500 },
      enterprise: { maxWorkflows: -1, maxBusinesses: -1 }, // unlimited
    };
    
    const userPlan = user.plan || "free";
    const limits = planLimits[userPlan];
    
    return {
      plan: userPlan,
      currentWorkflows: monthlyWorkflows.length,
      maxWorkflows: limits.maxWorkflows,
      currentBusinesses: totalBusinessesExtracted,
      maxBusinesses: limits.maxBusinesses,
      canCreateWorkflow: limits.maxWorkflows === -1 || monthlyWorkflows.length < limits.maxWorkflows,
    };
  },
});
```

### validateWorkflowName
```typescript
export const validateWorkflowName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const existingWorkflow = await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    return {
      isValid: !existingWorkflow,
      message: existingWorkflow ? "A workflow with this name already exists" : "Name is available",
    };
  },
});
```

## Query Usage Patterns

### Modal Initialization
1. **getUserUsageLimits** - Check if user can create new workflows
2. **getBusinessTypeOptions** - Populate business type dropdown
3. **getWorkflowTemplates** - Show template suggestions

### Form Validation
1. **validateWorkflowName** - Real-time name validation
2. **getUserUsageLimits** - Check limits before submission

### Template Selection
1. **getWorkflowTemplates** - Filter templates by category
2. Apply template defaults to form fields

## Error Handling
- All queries require authentication
- User existence validation
- Graceful handling of missing data
- Clear error messages for UI feedback