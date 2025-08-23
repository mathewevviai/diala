# DeleteConfirmationModal - Convex Queries

## Overview
Query functions for the Delete Confirmation Modal to assess deletion impact, validate permissions, and provide recovery information.

## Required Queries

### getWorkflowDeletionImpact
```typescript
export const getWorkflowDeletionImpact = query({
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
    
    // Calculate time invested
    const createdDate = new Date(workflow.createdAt);
    const timeInvested = workflow.completedAt 
      ? Math.round((new Date(workflow.completedAt).getTime() - createdDate.getTime()) / (1000 * 60))
      : Math.round((new Date().getTime() - createdDate.getTime()) / (1000 * 60));
    
    // Get related data counts
    const [results, exports, settings, changeLogs] = await Promise.all([
      ctx.db.query("huntWorkflowResults")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .collect(),
      ctx.db.query("huntWorkflowExports")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .collect(),
      ctx.db.query("huntWorkflowSettings")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .first(),
      ctx.db.query("huntWorkflowChangeLog")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .collect(),
    ]);
    
    // Calculate recovery estimates
    const estimatedRecoveryTime = calculateRecoveryTime(workflow, results.length);
    const isRecoverable = determineRecoverability(workflow, user.plan || "free");
    
    // Assess consequences
    const consequences = generateConsequences(workflow, results, exports, timeInvested);
    
    return {
      workflow: {
        id: workflow._id,
        name: workflow.name,
        status: workflow.status,
        progress: workflow.progress,
        createdAt: workflow.createdAt,
        completedAt: workflow.completedAt,
      },
      dataImpact: {
        businessesExtracted: results.length,
        businessesValidated: results.filter(r => r.validationStatus === "validated").length,
        pagesScraped: workflow.pagesScraped,
        timeInvested,
        exportsPrevious: exports.length,
        settingsCustomized: !!settings,
        changeLogEntries: changeLogs.length,
      },
      recoverability: {
        isRecoverable,
        estimatedRecoveryTime,
        backupRetentionDays: getBackupRetentionDays(user.plan || "free"),
        requiresUpgrade: !isRecoverable && user.plan === "free",
      },
      confirmationRequired: {
        requiresNameConfirmation: results.length > 50 || workflow.status !== "completed",
        requiresPasswordConfirmation: results.length > 500,
        warningLevel: getWarningLevel(workflow, results.length, timeInvested),
      },
      consequences,
      relatedData: {
        results: results.length,
        exports: exports.length,
        settings: settings ? 1 : 0,
        changeLogs: changeLogs.length,
      }
    };
  },
});

function calculateRecoveryTime(workflow: any, resultCount: number): string {
  // Base time for workflow recreation
  let minutes = 30;
  
  // Add time based on result count
  minutes += Math.ceil(resultCount / 100) * 15;
  
  // Add time based on workflow complexity
  if (workflow.searchDepth > 3) minutes += 30;
  if (workflow.keywords?.length > 5) minutes += 15;
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  }
}

function determineRecoverability(workflow: any, plan: string): boolean {
  // Recovery depends on plan and workflow status
  const planSupportsRecovery = ["pro", "enterprise"].includes(plan);
  const workflowIsComplete = workflow.status === "completed";
  const hasSignificantData = workflow.businessesExtracted > 10;
  
  return planSupportsRecovery && (workflowIsComplete || hasSignificantData);
}

function getBackupRetentionDays(plan: string): number {
  const retentionByPlan = {
    free: 0, // No backup retention
    pro: 30,
    enterprise: 90,
  };
  return retentionByPlan[plan] || 0;
}

function getWarningLevel(workflow: any, resultCount: number, timeInvested: number): "low" | "medium" | "high" | "critical" {
  if (workflow.status !== "completed" && workflow.progress > 50) return "critical";
  if (resultCount > 500 || timeInvested > 480) return "high"; // 8+ hours
  if (resultCount > 100 || timeInvested > 120) return "medium"; // 2+ hours
  return "low";
}

function generateConsequences(workflow: any, results: any[], exports: any[], timeInvested: number): string[] {
  const consequences = [];
  
  if (results.length > 0) {
    consequences.push(`${results.length} extracted business records will be permanently lost`);
  }
  
  if (exports.length > 0) {
    consequences.push(`${exports.length} previous export files will be deleted`);
  }
  
  if (timeInvested > 60) {
    consequences.push(`${Math.round(timeInvested / 60)} hours of processing time will be lost`);
  }
  
  if (workflow.status !== "completed" && workflow.progress > 0) {
    consequences.push("Active search process will be immediately stopped");
  }
  
  if (workflow.status === "completed" && results.length > 100) {
    consequences.push("Completed workflow results cannot be recovered without backup");
  }
  
  consequences.push("This action cannot be undone");
  
  return consequences;
}
```

### validateDeletionPermissions
```typescript
export const validateDeletionPermissions = query({
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
    
    // Check ownership
    const isOwner = workflow.userId === user._id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    
    if (!isOwner && !isAdmin) {
      return {
        canDelete: false,
        reason: "You can only delete workflows you created",
        requiredRole: null,
      };
    }
    
    // Check if workflow is in deleteable state
    const isDeletable = !["searching", "scraping", "analyzing"].includes(workflow.status);
    
    if (!isDeletable && !isAdmin) {
      return {
        canDelete: false,
        reason: "Cannot delete workflow while it's actively processing. Please pause it first.",
        requiredRole: null,
      };
    }
    
    // Check for dependent workflows or exports in progress
    const activeExports = await ctx.db
      .query("huntWorkflowExports")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      )
      .collect();
    
    if (activeExports.length > 0 && !isAdmin) {
      return {
        canDelete: false,
        reason: `${activeExports.length} export(s) in progress. Please wait for completion or cancel them first.`,
        requiredRole: null,
      };
    }
    
    return {
      canDelete: true,
      isOwner,
      isAdmin,
      forceDelete: isAdmin && !isDeletable,
      activeExports: activeExports.length,
    };
  },
});
```

### getDeletionHistory
```typescript
export const getDeletionHistory = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Check if user can view deletion history
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const targetUserId = args.userId || user._id;
    
    if (!isAdmin && targetUserId !== user._id) {
      throw new Error("Access denied");
    }
    
    const limit = Math.min(args.limit || 25, 100);
    
    let query = ctx.db.query("huntWorkflowDeletions");
    
    if (!isAdmin) {
      query = query.withIndex("by_user", (q) => q.eq("workflowUserId", user._id));
    } else if (args.userId) {
      query = query.withIndex("by_user", (q) => q.eq("workflowUserId", args.userId));
    }
    
    const deletions = await query
      .order("desc")
      .take(limit);
    
    // Enrich with user information
    const enrichedDeletions = await Promise.all(
      deletions.map(async (deletion) => {
        const requestedByUser = await ctx.db.get(deletion.requestedBy);
        const processedByUser = deletion.processedBy ? await ctx.db.get(deletion.processedBy) : null;
        
        return {
          ...deletion,
          requestedByUser: requestedByUser ? {
            name: requestedByUser.name,
            email: requestedByUser.email,
          } : null,
          processedByUser: processedByUser ? {
            name: processedByUser.name,
            email: processedByUser.email,
          } : null,
        };
      })
    );
    
    return enrichedDeletions;
  },
});
```

### getRecoverableWorkflows
```typescript
export const getRecoverableWorkflows = query({
  args: {
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
    
    const limit = Math.min(args.limit || 10, 50);
    
    // Get deletions that can be recovered
    const recoverableDeletions = await ctx.db
      .query("huntWorkflowDeletions")
      .withIndex("by_user", (q) => q.eq("workflowUserId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("canRecover"), true),
          q.gt(q.field("recoveryExpiresAt"), new Date().toISOString())
        )
      )
      .order("desc")
      .take(limit);
    
    // Get backup information for each recoverable deletion
    const recoverableWithBackups = await Promise.all(
      recoverableDeletions.map(async (deletion) => {
        const backup = await ctx.db
          .query("huntWorkflowBackups")
          .withIndex("by_deletion", (q) => q.eq("deletionId", deletion._id))
          .filter((q) => q.eq(q.field("backupStatus"), "available"))
          .first();
        
        return {
          deletion,
          backup,
          daysRemaining: Math.ceil(
            (new Date(deletion.recoveryExpiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      })
    );
    
    return recoverableWithBackups.filter(item => item.backup); // Only return items with valid backups
  },
});
```

### validateWorkflowName
```typescript
export const validateWorkflowName = query({
  args: {
    workflowId: v.id("huntWorkflows"),
    inputName: v.string(),
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
    
    const inputNormalized = args.inputName.trim().toLowerCase();
    const workflowNameNormalized = workflow.name.trim().toLowerCase();
    
    return {
      isValid: inputNormalized === workflowNameNormalized,
      expectedName: workflow.name,
      inputName: args.inputName,
      message: inputNormalized === workflowNameNormalized 
        ? "Name matches correctly"
        : `Please type "${workflow.name}" exactly as shown`,
    };
  },
});
```

### getSystemCleanupStatus
```typescript
export const getSystemCleanupStatus = query({
  args: {
    workflowId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Only admins can view system cleanup status
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("Admin access required");
    }
    
    let query = ctx.db.query("systemCleanupTasks");
    
    if (args.workflowId) {
      query = query.filter((q) => q.eq(q.field("targetId"), args.workflowId));
    }
    
    const tasks = await query
      .order("desc")
      .take(100);
    
    // Group by status for summary
    const statusSummary = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      tasks,
      summary: {
        total: tasks.length,
        byStatus: statusSummary,
        pendingCount: statusSummary.scheduled || 0,
        runningCount: statusSummary.running || 0,
        failedCount: statusSummary.failed || 0,
      },
    };
  },
});
```

## Query Usage Patterns

### Modal Initialization
1. **getWorkflowDeletionImpact** - Show consequences and data loss
2. **validateDeletionPermissions** - Check if user can delete
3. **getRecoverableWorkflows** - Show recovery options if available

### Confirmation Process
1. **validateWorkflowName** - Real-time name validation
2. **getDeletionHistory** - Show previous deletions for context

### Admin Functions
1. **getSystemCleanupStatus** - Monitor cleanup tasks
2. **getDeletionHistory** - Audit deletion activities

## Access Control
- User can only delete own workflows (unless admin)
- Deletion history private to user (unless admin)
- System cleanup status admin-only
- Recovery options based on user plan

## Performance Considerations
- Deletion impact calculated in real-time
- History queries paginated
- Cleanup status limited to recent tasks
- User permission checks cached where possible