# ViewWorkflowModal - Convex Queries

## Overview
Query functions for the View Workflow Modal to display detailed workflow information, results, and export functionality.

## Required Queries

### getWorkflowDetails
```typescript
export const getWorkflowDetails = query({
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
    if (!workflow) throw new Error("Workflow not found");
    
    // Verify ownership
    if (workflow.userId !== user._id) {
      throw new Error("Access denied");
    }
    
    return workflow;
  },
});
```

### getWorkflowResults
```typescript
export const getWorkflowResults = query({
  args: {
    workflowId: v.id("huntWorkflows"),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    filters: v.optional(v.object({
      validationStatus: v.optional(v.array(v.string())),
      minConfidenceScore: v.optional(v.number()),
      industry: v.optional(v.string()),
      hasEmail: v.optional(v.boolean()),
      hasPhone: v.optional(v.boolean()),
      hasWebsite: v.optional(v.boolean()),
    })),
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
    
    const page = args.page || 1;
    const limit = Math.min(args.limit || 25, 100); // Max 100 results per page
    const offset = (page - 1) * limit;
    
    let query = ctx.db
      .query("huntWorkflowResults")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId));
    
    // Apply filters
    if (args.filters) {
      if (args.filters.validationStatus?.length) {
        query = query.filter((q) => 
          args.filters!.validationStatus!.some(status =>
            q.eq(q.field("validationStatus"), status)
          )
        );
      }
      
      if (args.filters.minConfidenceScore !== undefined) {
        query = query.filter((q) => 
          q.gte(q.field("confidenceScore"), args.filters!.minConfidenceScore!)
        );
      }
      
      if (args.filters.industry) {
        query = query.filter((q) => 
          q.eq(q.field("industry"), args.filters!.industry!)
        );
      }
      
      if (args.filters.hasEmail) {
        query = query.filter((q) => 
          args.filters!.hasEmail 
            ? q.neq(q.field("email"), undefined)
            : q.eq(q.field("email"), undefined)
        );
      }
      
      if (args.filters.hasPhone) {
        query = query.filter((q) => 
          args.filters!.hasPhone 
            ? q.neq(q.field("phone"), undefined)
            : q.eq(q.field("phone"), undefined)
        );
      }
      
      if (args.filters.hasWebsite) {
        query = query.filter((q) => 
          args.filters!.hasWebsite 
            ? q.neq(q.field("website"), undefined)
            : q.eq(q.field("website"), undefined)
        );
      }
    }
    
    // Apply sorting
    const sortBy = args.sortBy || "extractedAt";
    const sortOrder = args.sortOrder || "desc";
    
    if (sortOrder === "desc") {
      query = query.order("desc");
    } else {
      query = query.order("asc");
    }
    
    const allResults = await query.collect();
    
    // Manual sorting if not by indexed field
    if (sortBy !== "extractedAt") {
      allResults.sort((a, b) => {
        const aVal = a[sortBy] || "";
        const bVal = b[sortBy] || "";
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === "desc" ? -comparison : comparison;
      });
    }
    
    // Pagination
    const paginatedResults = allResults.slice(offset, offset + limit);
    
    return {
      results: paginatedResults,
      totalCount: allResults.length,
      page,
      limit,
      totalPages: Math.ceil(allResults.length / limit),
      hasNextPage: offset + limit < allResults.length,
      hasPreviousPage: page > 1,
    };
  },
});
```

### getWorkflowStats
```typescript
export const getWorkflowStats = query({
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
    
    const stats = await ctx.db
      .query("huntWorkflowStats")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();
    
    return stats;
  },
});
```

### getWorkflowExports
```typescript
export const getWorkflowExports = query({
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
    
    const exports = await ctx.db
      .query("huntWorkflowExports")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .collect();
    
    return exports;
  },
});
```

### getExportFieldOptions
```typescript
export const getExportFieldOptions = query({
  args: {},
  handler: async (ctx) => {
    return [
      { key: "businessName", label: "Business Name", required: true },
      { key: "industry", label: "Industry", required: false },
      { key: "description", label: "Description", required: false },
      { key: "website", label: "Website", required: false },
      { key: "email", label: "Email", required: false },
      { key: "phone", label: "Phone", required: false },
      { key: "address", label: "Address", required: false },
      { key: "city", label: "City", required: false },
      { key: "state", label: "State", required: false },
      { key: "country", label: "Country", required: false },
      { key: "postalCode", label: "Postal Code", required: false },
      { key: "linkedinUrl", label: "LinkedIn URL", required: false },
      { key: "facebookUrl", label: "Facebook URL", required: false },
      { key: "twitterUrl", label: "Twitter URL", required: false },
      { key: "employeeCount", label: "Employee Count", required: false },
      { key: "yearFounded", label: "Year Founded", required: false },
      { key: "annualRevenue", label: "Annual Revenue", required: false },
      { key: "confidenceScore", label: "Confidence Score", required: false },
      { key: "validationStatus", label: "Validation Status", required: false },
      { key: "dataSource", label: "Data Source", required: false },
      { key: "extractedAt", label: "Extracted Date", required: false },
    ];
  },
});
```

### getIndustryBreakdown
```typescript
export const getIndustryBreakdown = query({
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
    
    const results = await ctx.db
      .query("huntWorkflowResults")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    // Group by industry
    const industryMap = new Map<string, number>();
    results.forEach(result => {
      const industry = result.industry || "Unknown";
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
    });
    
    // Convert to array and sort by count
    const breakdown = Array.from(industryMap.entries())
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: Math.round((count / results.length) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
    
    return breakdown;
  },
});
```

### getValidationStatusBreakdown
```typescript
export const getValidationStatusBreakdown = query({
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
    
    const results = await ctx.db
      .query("huntWorkflowResults")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();
    
    const statusMap = new Map<string, number>();
    results.forEach(result => {
      const status = result.validationStatus;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    const breakdown = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / results.length) * 100 * 10) / 10,
      }));
    
    return breakdown;
  },
});
```

## Query Usage Patterns

### Modal Initialization
1. **getWorkflowDetails** - Load basic workflow information
2. **getWorkflowStats** - Display summary statistics
3. **getWorkflowResults** - Load first page of results

### Results Display
1. **getWorkflowResults** - Paginated results with filtering/sorting
2. **getIndustryBreakdown** - Industry distribution chart
3. **getValidationStatusBreakdown** - Validation status pie chart

### Export Functionality
1. **getExportFieldOptions** - Available fields for export
2. **getWorkflowExports** - Previous export history

## Performance Considerations
- Results are paginated (max 100 per page)
- Indexes on workflowId for efficient filtering
- Complex sorting handled in memory for flexibility
- Statistics pre-computed and cached in huntWorkflowStats table