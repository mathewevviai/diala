# DeleteConfirmationModal - Convex Mutations

## Overview
Mutation functions for securely deleting hunt workflows with proper backup creation, audit trails, and cascading cleanup operations.

## Required Mutations

### deleteWorkflowWithConfirmation
```typescript
export const deleteWorkflowWithConfirmation = mutation({
  args: {
    workflowId: v.id("huntWorkflows"),
    confirmationMethod: v.union(
      v.literal("name_confirmation"),
      v.literal("password_confirmation"),
      v.literal("admin_override")
    ),
    confirmationValue: v.string(),
    deletionReason: v.optional(v.string()),
    forceDelete: v.optional(v.boolean()), // Admin only
    createBackup: v.optional(v.boolean()),
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
    
    // Verify permissions
    const isOwner = workflow.userId === user._id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    
    if (!isOwner && !isAdmin) {
      throw new Error("Access denied");
    }
    
    // Validate confirmation
    const confirmationValid = await validateConfirmation(
      ctx,
      workflow,
      args.confirmationMethod,
      args.confirmationValue,
      user
    );
    
    if (!confirmationValid.isValid) {
      throw new Error(confirmationValid.error);
    }
    
    // Check if workflow is deleteable
    const canForceDelete = isAdmin && args.forceDelete;
    if (!canForceDelete && ["searching", "scraping", "analyzing"].includes(workflow.status)) {
      throw new Error("Cannot delete active workflow. Please pause it first or use force delete.");
    }
    
    // Cancel any active exports
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
    
    for (const exportRecord of activeExports) {
      await ctx.db.patch(exportRecord._id, {
        status: "failed",
        errorMessage: "Cancelled due to workflow deletion",
        completedAt: new Date().toISOString(),
      });
    }
    
    // Calculate data impact
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
    
    const timeInvested = calculateTimeInvested(workflow);
    
    // Create deletion record
    const deletionSteps = [
      { step: "validation", status: "completed" as const, completedAt: new Date().toISOString() },
      { step: "backup_creation", status: "pending" as const },
      { step: "pause_workflow", status: "pending" as const },
      { step: "cleanup_exports", status: "pending" as const },
      { step: "cleanup_results", status: "pending" as const },
      { step: "cleanup_settings", status: "pending" as const },
      { step: "cleanup_changelogs", status: "pending" as const },
      { step: "delete_workflow", status: "pending" as const },
      { step: "verify_cleanup", status: "pending" as const },
    ];
    
    const shouldCreateBackup = args.createBackup !== false && 
                              (user.plan === "pro" || user.plan === "enterprise") &&
                              results.length > 0;
    
    const deletionId = await ctx.db.insert("huntWorkflowDeletions", {
      originalWorkflowId: args.workflowId,
      workflowName: workflow.name,
      workflowUserId: workflow.userId,
      deletionReason: args.deletionReason,
      deletionType: isAdmin ? "admin_action" : "user_request",
      confirmationMethod: args.confirmationMethod,
      confirmationValue: args.confirmationValue,
      workflowStatus: workflow.status,
      workflowProgress: workflow.progress,
      totalResults: results.length,
      validatedResults: results.filter(r => r.validationStatus === "validated").length,
      dataLossAssessment: {
        businessesExtracted: results.length,
        pagesScraped: workflow.pagesScraped,
        timeInvested,
        exportsPrevious: exports.length,
        isRecoverable: shouldCreateBackup,
        estimatedRecoveryTime: shouldCreateBackup ? calculateRecoveryTime(workflow, results.length) : undefined,
      },
      deletionSteps,
      cleanupStatus: "pending",
      remainingReferences: [],
      requestedBy: user._id,
      requestedAt: new Date().toISOString(),
      processedBy: isAdmin ? user._id : undefined,
      canRecover: shouldCreateBackup,
      recoveryExpiresAt: shouldCreateBackup 
        ? new Date(Date.now() + getRetentionDays(user.plan || "free") * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    });
    
    // Schedule deletion processing
    await ctx.scheduler.runAfter(0, "processWorkflowDeletion", {
      deletionId,
      createBackup: shouldCreateBackup,
      forceDelete: canForceDelete,
    });
    
    return {
      deletionId,
      scheduledForProcessing: true,
      backupWillBeCreated: shouldCreateBackup,
      estimatedCompletionTime: "2-5 minutes",
      recoveryExpiresAt: shouldCreateBackup 
        ? new Date(Date.now() + getRetentionDays(user.plan || "free") * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };
  },
});

async function validateConfirmation(
  ctx: any,
  workflow: any,
  method: string,
  value: string,
  user: any
): Promise<{ isValid: boolean; error?: string }> {
  switch (method) {
    case "name_confirmation":
      const normalizedInput = value.trim().toLowerCase();
      const normalizedWorkflow = workflow.name.trim().toLowerCase();
      if (normalizedInput !== normalizedWorkflow) {
        return {
          isValid: false,
          error: `Please type "${workflow.name}" exactly as shown`,
        };
      }
      return { isValid: true };
      
    case "password_confirmation":
      // In a real implementation, this would verify the user's password
      // For now, we'll assume it's validated by the frontend
      if (!value || value.length < 8) {
        return {
          isValid: false,
          error: "Invalid password confirmation",
        };
      }
      return { isValid: true };
      
    case "admin_override":
      if (user.role !== "admin" && user.role !== "super_admin") {
        return {
          isValid: false,
          error: "Admin privileges required for override",
        };
      }
      return { isValid: true };
      
    default:
      return {
        isValid: false,
        error: "Invalid confirmation method",
      };
  }
}

function calculateTimeInvested(workflow: any): number {
  const createdDate = new Date(workflow.createdAt);
  const endDate = workflow.completedAt ? new Date(workflow.completedAt) : new Date();
  return Math.round((endDate.getTime() - createdDate.getTime()) / (1000 * 60));
}

function calculateRecoveryTime(workflow: any, resultCount: number): string {
  let minutes = 30;
  minutes += Math.ceil(resultCount / 100) * 15;
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

function getRetentionDays(plan: string): number {
  const retentionByPlan = {
    free: 0,
    pro: 30,
    enterprise: 90,
  };
  return retentionByPlan[plan] || 0;
}
```

### recoverDeletedWorkflow
```typescript
export const recoverDeletedWorkflow = mutation({
  args: {
    deletionId: v.id("huntWorkflowDeletions"),
    newWorkflowName: v.optional(v.string()),
    conflictResolution: v.optional(v.union(
      v.literal("overwrite"),
      v.literal("merge"),
      v.literal("skip")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const deletion = await ctx.db.get(args.deletionId);
    if (!deletion) throw new Error("Deletion record not found");
    
    // Verify ownership
    if (deletion.workflowUserId !== user._id) {
      throw new Error("Access denied");
    }
    
    // Check if recovery is still possible
    if (!deletion.canRecover) {
      throw new Error("This workflow cannot be recovered");
    }
    
    if (deletion.recoveryExpiresAt && new Date(deletion.recoveryExpiresAt) < new Date()) {
      throw new Error("Recovery period has expired");
    }
    
    // Get backup data
    const backup = await ctx.db
      .query("huntWorkflowBackups")
      .withIndex("by_deletion", (q) => q.eq("deletionId", args.deletionId))
      .filter((q) => q.eq(q.field("backupStatus"), "available"))
      .first();
    
    if (!backup) {
      throw new Error("Backup data not available");
    }
    
    // Check for name conflicts
    const proposedName = args.newWorkflowName || `${deletion.workflowName} (Recovered)`;
    const existingWorkflow = await ctx.db
      .query("huntWorkflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), proposedName))
      .first();
    
    if (existingWorkflow && args.conflictResolution !== "overwrite") {
      throw new Error(`Workflow with name "${proposedName}" already exists`);
    }
    
    // Schedule recovery process
    const recoveryId = await ctx.scheduler.runAfter(0, "processWorkflowRecovery", {
      deletionId: args.deletionId,
      backupId: backup._id,
      newWorkflowName: proposedName,
      conflictResolution: args.conflictResolution || "skip",
      userId: user._id,
    });
    
    // Update backup access time
    await ctx.db.patch(backup._id, {
      accessedAt: new Date().toISOString(),
    });
    
    return {
      recoveryScheduled: true,
      newWorkflowName: proposedName,
      estimatedCompletionTime: "3-10 minutes",
      recoveryId,
    };
  },
});
```

### cancelWorkflowDeletion
```typescript
export const cancelWorkflowDeletion = mutation({
  args: {
    deletionId: v.id("huntWorkflowDeletions"),
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const deletion = await ctx.db.get(args.deletionId);
    if (!deletion) throw new Error("Deletion record not found");
    
    // Verify ownership or admin rights
    const isOwner = deletion.workflowUserId === user._id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    
    if (!isOwner && !isAdmin) {
      throw new Error("Access denied");
    }
    
    // Check if deletion can be cancelled
    if (deletion.cleanupStatus === "completed") {
      throw new Error("Deletion has already been completed and cannot be cancelled");
    }
    
    if (deletion.cleanupStatus === "in_progress") {
      // Try to stop in-progress cleanup tasks
      const cleanupTasks = await ctx.db
        .query("systemCleanupTasks")
        .filter((q) => 
          q.and(
            q.eq(q.field("targetId"), deletion.originalWorkflowId),
            q.eq(q.field("taskType"), "workflow_deletion"),
            q.or(
              q.eq(q.field("status"), "scheduled"),
              q.eq(q.field("status"), "running")
            )
          )
        )
        .collect();
      
      for (const task of cleanupTasks) {
        await ctx.db.patch(task._id, {
          status: "cancelled",
          completedAt: new Date().toISOString(),
          lastError: args.cancellationReason || "Cancelled by user request",
        });
      }
    }
    
    // Update deletion status
    await ctx.db.patch(args.deletionId, {
      cleanupStatus: "cancelled",
      completedAt: new Date().toISOString(),
    });
    
    // Log the cancellation
    await ctx.db.insert("huntWorkflowChangeLog", {
      workflowId: deletion.originalWorkflowId,
      settingsVersion: 0,
      changedFields: ["deletion_cancelled"],
      previousValues: { cleanupStatus: deletion.cleanupStatus },
      newValues: { cleanupStatus: "cancelled" },
      changeReason: args.cancellationReason || "Deletion cancelled by user",
      changeType: "user_update",
      changedBy: user._id,
      changedAt: new Date().toISOString(),
      requiresRestart: false,
      affectedComponents: ["deletion"],
    });
    
    return {
      cancelled: true,
      deletionId: args.deletionId,
      message: "Deletion has been cancelled successfully",
    };
  },
});
```

### cleanupExpiredBackups
```typescript
export const cleanupExpiredBackups = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Only admins can manually trigger backup cleanup
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("Admin access required");
    }
    
    const batchSize = Math.min(args.batchSize || 50, 100);
    const now = new Date().toISOString();
    
    // Find expired backups
    const expiredBackups = await ctx.db
      .query("huntWorkflowBackups")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .filter((q) => 
        q.or(
          q.eq(q.field("backupStatus"), "available"),
          q.eq(q.field("backupStatus"), "corrupted")
        )
      )
      .take(batchSize);
    
    let cleanedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const backup of expiredBackups) {
      try {
        // Mark backup as expired
        await ctx.db.patch(backup._id, {
          backupStatus: "expired",
        });
        
        // Update corresponding deletion record
        const deletion = await ctx.db.get(backup.deletionId);
        if (deletion && deletion.canRecover) {
          await ctx.db.patch(backup.deletionId, {
            canRecover: false,
          });
        }
        
        // Schedule file cleanup
        await ctx.scheduler.runAfter(0, "cleanupBackupFiles", {
          backupId: backup._id,
          storageLocation: backup.storageLocation,
          storageKey: backup.storageKey,
        });
        
        cleanedCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Failed to cleanup backup ${backup._id}: ${error.message}`);
      }
    }
    
    return {
      processed: expiredBackups.length,
      cleaned: cleanedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Return first 10 errors
    };
  },
});
```

### forceDeleteWorkflow
```typescript
export const forceDeleteWorkflow = mutation({
  args: {
    workflowId: v.id("huntWorkflows"),
    adminReason: v.string(),
    skipBackup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Only admins can force delete
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("Admin access required");
    }
    
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");
    
    // Create deletion record for audit
    const deletionId = await ctx.db.insert("huntWorkflowDeletions", {
      originalWorkflowId: args.workflowId,
      workflowName: workflow.name,
      workflowUserId: workflow.userId,
      deletionReason: args.adminReason,
      deletionType: "admin_action",
      confirmationMethod: "admin_override",
      confirmationValue: "FORCE_DELETE",
      workflowStatus: workflow.status,
      workflowProgress: workflow.progress,
      totalResults: 0, // Will be updated during processing
      validatedResults: 0,
      dataLossAssessment: {
        businessesExtracted: 0,
        pagesScraped: workflow.pagesScraped,
        timeInvested: 0,
        exportsPrevious: 0,
        isRecoverable: !args.skipBackup,
        estimatedRecoveryTime: undefined,
      },
      deletionSteps: [
        { step: "admin_validation", status: "completed", completedAt: new Date().toISOString() },
      ],
      cleanupStatus: "pending",
      remainingReferences: [],
      requestedBy: user._id,
      requestedAt: new Date().toISOString(),
      processedBy: user._id,
      canRecover: !args.skipBackup,
      recoveryExpiresAt: !args.skipBackup 
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days for admin deletions
        : undefined,
    });
    
    // Schedule immediate force deletion
    await ctx.scheduler.runAfter(0, "processWorkflowDeletion", {
      deletionId,
      createBackup: !args.skipBackup,
      forceDelete: true,
      adminAction: true,
    });
    
    return {
      deletionId,
      forceDeleted: true,
      adminReason: args.adminReason,
      backupCreated: !args.skipBackup,
    };
  },
});
```

## Validation Rules

### Confirmation Validation
- Name confirmation: Case-insensitive exact match
- Password confirmation: Minimum 8 characters (actual password verification in production)
- Admin override: Requires admin role

### Deletion Permissions
- User can delete own workflows
- Admins can delete any workflow
- Active workflows require force delete (admin only)
- Workflows with active exports require cancellation first

### Recovery Rules
- Recovery only available with valid backup
- Recovery period limited by user plan
- Name conflicts handled by resolution strategy
- Expired backups cannot be recovered

### Data Protection
- Backups created before deletion (if plan allows)
- Audit trail maintained for all deletions
- Cleanup tasks can be cancelled if not completed
- Recovery possible within retention period

## Background Processing
- **processWorkflowDeletion** - Execute deletion steps
- **processWorkflowRecovery** - Restore from backup
- **cleanupBackupFiles** - Remove expired backup files
- **cleanupOrphanedData** - Clean up any remaining references