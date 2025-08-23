# ViewWorkflowModal - Convex Mutations

## Overview
Mutation functions for the View Workflow Modal to handle export requests, data validation, and result management.

## Required Mutations

### requestExport
```typescript
export const requestExport = mutation({
  args: {
    workflowId: v.id("huntWorkflows"),
    exportType: v.union(
      v.literal("csv"),
      v.literal("excel"),
      v.literal("json"),
      v.literal("crm")
    ),
    includeFields: v.array(v.string()),
    filterCriteria: v.optional(v.object({
      minConfidenceScore: v.optional(v.number()),
      validationStatus: v.optional(v.array(v.string())),
      includeEmptyFields: v.optional(v.boolean()),
      dateRange: v.optional(v.object({
        start: v.string(),
        end: v.string(),
      })),
    })),
    crmProvider: v.optional(v.string()),
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
    
    // Check if workflow is complete
    if (workflow.status !== "completed") {
      throw new Error("Workflow must be completed before exporting");
    }
    
    // Validate export fields
    const validFields = [
      "businessName", "industry", "description", "website", "email", "phone",
      "address", "city", "state", "country", "postalCode", "linkedinUrl",
      "facebookUrl", "twitterUrl", "employeeCount", "yearFounded",
      "annualRevenue", "confidenceScore", "validationStatus", "dataSource",
      "extractedAt"
    ];
    
    const invalidFields = args.includeFields.filter(field => !validFields.includes(field));
    if (invalidFields.length > 0) {
      throw new Error(`Invalid export fields: ${invalidFields.join(", ")}`);
    }
    
    if (args.includeFields.length === 0) {
      throw new Error("At least one field must be selected for export");
    }
    
    // Validate filter criteria
    if (args.filterCriteria?.minConfidenceScore !== undefined) {
      if (args.filterCriteria.minConfidenceScore < 0 || args.filterCriteria.minConfidenceScore > 100) {
        throw new Error("Confidence score must be between 0 and 100");
      }
    }
    
    if (args.filterCriteria?.validationStatus) {
      const validStatuses = ["pending", "validated", "failed", "skipped"];
      const invalidStatuses = args.filterCriteria.validationStatus.filter(
        status => !validStatuses.includes(status)
      );
      if (invalidStatuses.length > 0) {
        throw new Error(`Invalid validation statuses: ${invalidStatuses.join(", ")}`);
      }
    }
    
    // Check user export limits
    const today = new Date().toISOString().split('T')[0];
    const todayExports = await ctx.db
      .query("huntWorkflowExports")
      .withIndex("by_user", (q) => q.eq("requestedBy", user._id))
      .filter((q) => q.gte(q.field("requestedAt"), today))
      .collect();
    
    const planLimits = {
      free: 3,
      pro: 25,
      enterprise: -1,
    };
    
    const userPlan = user.plan || "free";
    const dailyLimit = planLimits[userPlan];
    
    if (dailyLimit !== -1 && todayExports.length >= dailyLimit) {
      throw new Error(`Daily export limit reached for ${userPlan} plan`);
    }
    
    // Check for duplicate pending export
    const pendingExport = await ctx.db
      .query("huntWorkflowExports")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      )
      .first();
    
    if (pendingExport) {
      throw new Error("Another export is already in progress for this workflow");
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = args.exportType === "excel" ? "xlsx" : args.exportType;
    const fileName = `${workflow.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${fileExtension}`;
    
    // Create export record
    const exportId = await ctx.db.insert("huntWorkflowExports", {
      workflowId: args.workflowId,
      exportType: args.exportType,
      includeFields: args.includeFields,
      filterCriteria: args.filterCriteria || {},
      status: "pending",
      fileName,
      crmProvider: args.crmProvider,
      requestedBy: user._id,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
    
    // Schedule export processing
    await ctx.scheduler.runAfter(0, "processExport", { exportId });
    
    return exportId;
  },
});
```

### validateBusinessData
```typescript
export const validateBusinessData = mutation({
  args: {
    resultId: v.id("huntWorkflowResults"),
    validationStatus: v.union(
      v.literal("validated"),
      v.literal("failed"),
      v.literal("skipped")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Result not found");
    
    const workflow = await ctx.db.get(result.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Access denied");
    }
    
    // Update validation status
    await ctx.db.patch(args.resultId, {
      validationStatus: args.validationStatus,
      validatedAt: new Date().toISOString(),
      notes: args.notes,
    });
    
    // Update workflow statistics
    const allResults = await ctx.db
      .query("huntWorkflowResults")
      .withIndex("by_workflow", (q) => q.eq("workflowId", result.workflowId))
      .collect();
    
    const validatedCount = allResults.filter(r => 
      r._id === args.resultId 
        ? args.validationStatus === "validated"
        : r.validationStatus === "validated"
    ).length;
    
    const matchRate = allResults.length > 0 
      ? Math.round((validatedCount / allResults.length) * 100 * 10) / 10
      : 0;
    
    await ctx.db.patch(result.workflowId, {
      businessesValidated: validatedCount,
      matchRate,
    });
    
    return args.resultId;
  },
});
```

### updateBusinessData
```typescript
export const updateBusinessData = mutation({
  args: {
    resultId: v.id("huntWorkflowResults"),
    updates: v.object({
      businessName: v.optional(v.string()),
      industry: v.optional(v.string()),
      description: v.optional(v.string()),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      facebookUrl: v.optional(v.string()),
      twitterUrl: v.optional(v.string()),
      employeeCount: v.optional(v.number()),
      yearFounded: v.optional(v.number()),
      annualRevenue: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Result not found");
    
    const workflow = await ctx.db.get(result.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Access denied");
    }
    
    // Validate email format if provided
    if (args.updates.email && args.updates.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.updates.email.trim())) {
        throw new Error("Invalid email format");
      }
    }
    
    // Validate URL formats if provided
    const urlFields = ["website", "linkedinUrl", "facebookUrl", "twitterUrl"];
    for (const field of urlFields) {
      const url = args.updates[field];
      if (url && url.trim()) {
        try {
          new URL(url.trim());
        } catch {
          throw new Error(`Invalid ${field} format`);
        }
      }
    }
    
    // Validate year founded
    if (args.updates.yearFounded !== undefined) {
      const currentYear = new Date().getFullYear();
      if (args.updates.yearFounded < 1800 || args.updates.yearFounded > currentYear) {
        throw new Error("Year founded must be between 1800 and current year");
      }
    }
    
    // Validate employee count
    if (args.updates.employeeCount !== undefined && args.updates.employeeCount < 0) {
      throw new Error("Employee count must be non-negative");
    }
    
    // Clean and update data
    const cleanUpdates = Object.fromEntries(
      Object.entries(args.updates)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() || undefined : value
        ])
        .filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error("No valid updates provided");
    }
    
    await ctx.db.patch(args.resultId, cleanUpdates);
    
    return args.resultId;
  },
});
```

### deleteBusinessResult
```typescript
export const deleteBusinessResult = mutation({
  args: {
    resultId: v.id("huntWorkflowResults"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Result not found");
    
    const workflow = await ctx.db.get(result.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Access denied");
    }
    
    // Delete the result
    await ctx.db.delete(args.resultId);
    
    // Update workflow statistics
    const remainingResults = await ctx.db
      .query("huntWorkflowResults")
      .withIndex("by_workflow", (q) => q.eq("workflowId", result.workflowId))
      .collect();
    
    const validatedCount = remainingResults.filter(r => 
      r.validationStatus === "validated"
    ).length;
    
    const matchRate = remainingResults.length > 0 
      ? Math.round((validatedCount / remainingResults.length) * 100 * 10) / 10
      : 0;
    
    await ctx.db.patch(result.workflowId, {
      businessesExtracted: remainingResults.length,
      businessesValidated: validatedCount,
      matchRate,
    });
    
    return args.resultId;
  },
});
```

### cancelExport
```typescript
export const cancelExport = mutation({
  args: {
    exportId: v.id("huntWorkflowExports"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const exportRecord = await ctx.db.get(args.exportId);
    if (!exportRecord) throw new Error("Export not found");
    
    if (exportRecord.requestedBy !== user._id) {
      throw new Error("Access denied");
    }
    
    if (exportRecord.status === "completed") {
      throw new Error("Cannot cancel completed export");
    }
    
    if (exportRecord.status === "failed") {
      throw new Error("Export already failed");
    }
    
    await ctx.db.patch(args.exportId, {
      status: "failed",
      errorMessage: "Cancelled by user",
      completedAt: new Date().toISOString(),
    });
    
    return args.exportId;
  },
});
```

## Validation Rules

### Export Validation
- Workflow must be completed before export
- Valid export fields only
- Daily export limits based on user plan
- No duplicate pending exports

### Business Data Validation
- Email format validation
- URL format validation
- Year founded range validation
- Non-negative employee count

### Access Control
- User ownership verification for all operations
- Proper authentication required
- Resource existence checks

## Background Processing
- **processExport** - Scheduled job for file generation
- Statistics updates after data modifications
- Automatic cleanup of expired exports