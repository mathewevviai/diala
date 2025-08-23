# DeleteConfirmationModal - Convex Mutations Documentation

## Overview
Mutations for handling resource deletion, including soft delete, hard delete, restoration, and bulk operations across different resource types.

## Mutation Definitions

### 1. Delete Resource (Generic)
```typescript
// convex/common/mutations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteResource = mutation({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    userId: v.string(),
    hardDelete: v.optional(v.boolean()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate permission
    const permission = await ctx.runQuery(
      api.common.queries.validateDeletePermission,
      {
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        userId: args.userId,
      }
    );
    
    if (!permission.canDelete) {
      throw new Error(permission.reason || "Cannot delete resource");
    }
    
    // Check dependencies
    const dependencies = await ctx.runQuery(
      api.common.queries.checkResourceDependencies,
      {
        resourceType: args.resourceType,
        resourceId: args.resourceId,
      }
    );
    
    if (dependencies.hasBlockingDependencies) {
      throw new Error(
        `Cannot delete: ${dependencies.blockingDependencies.length} blocking dependencies`
      );
    }
    
    // Get resource data before deletion
    const resource = await getResourceById(ctx, args.resourceType, args.resourceId);
    if (!resource) {
      throw new Error("Resource not found");
    }
    
    // Determine if soft delete is enabled
    const softDeleteConfig = getSoftDeleteConfig(args.resourceType);
    const useSoftDelete = softDeleteConfig.enabled && !args.hardDelete;
    
    // Create audit log entry
    const auditLogId = await ctx.db.insert("deletionAuditLog", {
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      resourceName: resource.name || `${args.resourceType} ${args.resourceId}`,
      deletedBy: args.userId,
      deletedAt: new Date().toISOString(),
      metadata: {
        stats: getResourceStats(resource, args.resourceType),
        reason: args.reason,
        childResources: dependencies.cascadeDependencies.map(d => d.type),
      },
      softDelete: useSoftDelete,
      restorable: useSoftDelete,
      expiresAt: useSoftDelete 
        ? new Date(Date.now() + softDeleteConfig.retentionDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    });
    
    if (useSoftDelete) {
      // Soft delete - move to soft delete storage
      await performSoftDelete(ctx, args, resource, softDeleteConfig);
    } else {
      // Hard delete - permanently remove
      await performHardDelete(ctx, args, resource, dependencies);
    }
    
    // Log deletion event
    await logDeletionEvent(ctx, args, resource, useSoftDelete);
    
    return {
      success: true,
      auditLogId,
      softDeleted: useSoftDelete,
      cascadeDeleted: dependencies.cascadeDependencies.length,
      message: useSoftDelete 
        ? `${args.resourceType} soft deleted. Can be restored within ${softDeleteConfig.retentionDays} days.`
        : `${args.resourceType} permanently deleted.`,
    };
  },
});

// Helper functions
async function getResourceById(ctx: any, resourceType: string, resourceId: string) {
  switch (resourceType) {
    case 'ragWorkflow':
      return ctx.db.get(resourceId);
    case 'agent':
      return ctx.db.get(resourceId);
    case 'call':
      return ctx.db.get(resourceId);
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
}

function getSoftDeleteConfig(resourceType: string) {
  const configs = {
    ragWorkflow: { enabled: true, retentionDays: 30 },
    agent: { enabled: true, retentionDays: 90 },
    call: { enabled: false, retentionDays: 0 },
  };
  return configs[resourceType] || { enabled: false, retentionDays: 0 };
}

function getResourceStats(resource: any, resourceType: string) {
  switch (resourceType) {
    case 'ragWorkflow':
      return {
        embeddings: resource.stats?.embeddings || 0,
        sources: resource.parameters?.sources?.length || 0,
        indexSize: resource.stats?.indexSize || '0 MB',
      };
    case 'agent':
      return {
        totalCalls: resource.stats?.totalCalls || 0,
        activeCalls: resource.stats?.activeCalls || 0,
      };
    case 'call':
      return {
        duration: resource.duration || 0,
        hasRecording: !!resource.recordingId,
      };
    default:
      return {};
  }
}
```

### 2. Soft Delete Implementation
```typescript
async function performSoftDelete(
  ctx: any, 
  args: any, 
  resource: any, 
  config: any
) {
  // Store in soft delete table
  const softDeleteId = await ctx.db.insert("softDeletedResources", {
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    resourceData: resource,
    deletedBy: args.userId,
    deletedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + config.retentionDays * 24 * 60 * 60 * 1000).toISOString(),
    restoreCount: 0,
  });
  
  // Mark original resource as deleted (don't actually delete)
  await ctx.db.patch(args.resourceId, {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: args.userId,
    softDeleteId,
  });
  
  // Handle resource-specific soft delete actions
  switch (args.resourceType) {
    case 'ragWorkflow':
      // Disable workflow in agents but keep reference
      const agents = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("ragWorkflowId"), args.resourceId))
        .collect();
      
      for (const agent of agents) {
        await ctx.db.patch(agent._id, {
          ragConfig: {
            ...agent.ragConfig,
            enabled: false,
            deletedWorkflowId: args.resourceId,
            disabledReason: 'Workflow deleted',
          },
        });
      }
      break;
    
    case 'agent':
      // Archive active calls
      const activeCalls = await ctx.db
        .query("calls")
        .withIndex("by_agent", (q) => q.eq("agentId", args.resourceId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
      
      for (const call of activeCalls) {
        await ctx.db.patch(call._id, {
          status: 'archived',
          archivedReason: 'Agent deleted',
          archivedAt: new Date().toISOString(),
        });
      }
      break;
  }
  
  return softDeleteId;
}
```

### 3. Hard Delete Implementation
```typescript
async function performHardDelete(
  ctx: any,
  args: any,
  resource: any,
  dependencies: any
) {
  // Delete cascade dependencies first
  for (const dep of dependencies.cascadeDependencies) {
    await deleteCascadeDependency(ctx, dep, args.resourceId);
  }
  
  // Resource-specific deletion
  switch (args.resourceType) {
    case 'ragWorkflow':
      await deleteRAGWorkflow(ctx, args.resourceId);
      break;
    case 'agent':
      await deleteAgent(ctx, args.resourceId);
      break;
    case 'call':
      await deleteCall(ctx, args.resourceId);
      break;
  }
  
  // Delete the main resource
  await ctx.db.delete(args.resourceId);
}

async function deleteRAGWorkflow(ctx: any, workflowId: string) {
  // Delete embeddings
  const embeddings = await ctx.db
    .query("ragEmbeddings")
    .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const embedding of embeddings) {
    await ctx.db.delete(embedding._id);
  }
  
  // Delete source details
  const sources = await ctx.db
    .query("ragSourceDetails")
    .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const source of sources) {
    await ctx.db.delete(source._id);
  }
  
  // Delete processing steps
  const steps = await ctx.db
    .query("ragWorkflowSteps")
    .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const step of steps) {
    await ctx.db.delete(step._id);
  }
  
  // Delete events
  const events = await ctx.db
    .query("ragWorkflowEvents")
    .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
    .collect();
  
  for (const event of events) {
    await ctx.db.delete(event._id);
  }
  
  // Remove from agents
  const agents = await ctx.db
    .query("agents")
    .filter((q) => q.eq(q.field("ragWorkflowId"), workflowId))
    .collect();
  
  for (const agent of agents) {
    await ctx.db.patch(agent._id, {
      ragWorkflowId: undefined,
      ragConfig: undefined,
    });
  }
}

async function deleteAgent(ctx: any, agentId: string) {
  // Archive all calls
  const calls = await ctx.db
    .query("calls")
    .withIndex("by_agent", (q) => q.eq("agentId", agentId))
    .collect();
  
  for (const call of calls) {
    if (call.status === 'active') {
      // Force end active calls
      await ctx.db.patch(call._id, {
        status: 'ended',
        endedAt: new Date().toISOString(),
        endReason: 'Agent deleted',
      });
    }
    
    // Move to archived calls table
    await ctx.db.insert("archivedCalls", {
      ...call,
      archivedAt: new Date().toISOString(),
      archivedReason: 'Agent deleted',
    });
    
    await ctx.db.delete(call._id);
  }
  
  // Cancel scheduled tasks
  const tasks = await ctx.db
    .query("scheduledTasks")
    .filter((q) => q.eq(q.field("agentId"), agentId))
    .collect();
  
  for (const task of tasks) {
    await ctx.db.delete(task._id);
  }
}

async function deleteCall(ctx: any, callId: string) {
  const call = await ctx.db.get(callId);
  if (!call) return;
  
  // Delete recording
  if (call.recordingId) {
    try {
      await ctx.storage.delete(call.recordingId);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  }
  
  // Delete transcript
  if (call.transcriptId) {
    const transcript = await ctx.db.get(call.transcriptId);
    if (transcript) {
      await ctx.db.delete(call.transcriptId);
    }
  }
  
  // Delete analytics
  const analytics = await ctx.db
    .query("callAnalytics")
    .filter((q) => q.eq(q.field("callId"), callId))
    .collect();
  
  for (const analytic of analytics) {
    await ctx.db.delete(analytic._id);
  }
}
```

### 4. Restore Soft Deleted Resource
```typescript
export const restoreResource = mutation({
  args: {
    softDeleteId: v.id("softDeletedResources"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const softDeleted = await ctx.db.get(args.softDeleteId);
    if (!softDeleted) {
      throw new Error("Soft deleted resource not found");
    }
    
    // Check if user has permission
    if (softDeleted.deletedBy !== args.userId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("id"), args.userId))
        .first();
      
      if (!user || user.role !== 'admin') {
        throw new Error("You don't have permission to restore this resource");
      }
    }
    
    // Check if still restorable
    if (new Date(softDeleted.expiresAt) < new Date()) {
      throw new Error("Resource has expired and cannot be restored");
    }
    
    // Check restore limit
    const config = getSoftDeleteConfig(softDeleted.resourceType);
    if (softDeleted.restoreCount >= config.maxRestores) {
      throw new Error(`Maximum restore limit (${config.maxRestores}) reached`);
    }
    
    // Restore the resource
    const resourceData = softDeleted.resourceData;
    delete resourceData.isDeleted;
    delete resourceData.deletedAt;
    delete resourceData.deletedBy;
    delete resourceData.softDeleteId;
    
    // Check if original ID still exists
    const existing = await ctx.db.get(softDeleted.resourceId);
    let restoredId;
    
    if (!existing || existing.isDeleted) {
      // Restore to original ID
      await ctx.db.patch(softDeleted.resourceId, {
        ...resourceData,
        restoredAt: new Date().toISOString(),
        restoredBy: args.userId,
      });
      restoredId = softDeleted.resourceId;
    } else {
      // Create with new ID if original is taken
      restoredId = await ctx.db.insert(getTableName(softDeleted.resourceType), {
        ...resourceData,
        restoredAt: new Date().toISOString(),
        restoredBy: args.userId,
        originalId: softDeleted.resourceId,
      });
    }
    
    // Update soft delete record
    await ctx.db.patch(args.softDeleteId, {
      restoreCount: softDeleted.restoreCount + 1,
      lastRestoredAt: new Date().toISOString(),
    });
    
    // Log restoration
    await ctx.db.insert("deletionAuditLog", {
      resourceType: softDeleted.resourceType,
      resourceId: restoredId,
      resourceName: resourceData.name || `${softDeleted.resourceType} ${restoredId}`,
      deletedBy: args.userId, // Actually restored by
      deletedAt: new Date().toISOString(),
      metadata: {
        action: 'restored',
        originalDeletedBy: softDeleted.deletedBy,
        originalDeletedAt: softDeleted.deletedAt,
      },
      softDelete: false,
      restorable: false,
    });
    
    return {
      success: true,
      restoredId,
      resourceType: softDeleted.resourceType,
      message: `${softDeleted.resourceType} restored successfully`,
    };
  },
});

function getTableName(resourceType: string): string {
  const tables = {
    ragWorkflow: 'ragWorkflows',
    agent: 'agents',
    call: 'calls',
  };
  return tables[resourceType] || resourceType;
}
```

### 5. Bulk Delete Resources
```typescript
export const bulkDeleteResources = mutation({
  args: {
    resourceType: v.string(),
    resourceIds: v.array(v.string()),
    userId: v.string(),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if bulk delete is allowed
    const permissions = {
      ragWorkflow: { allowBulk: false },
      agent: { allowBulk: true, maxBulk: 10 },
      call: { allowBulk: true, maxBulk: 50 },
    };
    
    const permission = permissions[args.resourceType];
    if (!permission?.allowBulk) {
      throw new Error(`Bulk delete not allowed for ${args.resourceType}`);
    }
    
    if (args.resourceIds.length > permission.maxBulk) {
      throw new Error(`Cannot delete more than ${permission.maxBulk} items at once`);
    }
    
    const results = {
      succeeded: [] as string[],
      failed: [] as { id: string; error: string }[],
      softDeleted: 0,
      hardDeleted: 0,
    };
    
    // Process each deletion
    for (const resourceId of args.resourceIds) {
      try {
        const result = await ctx.runMutation(
          api.common.mutations.deleteResource,
          {
            resourceType: args.resourceType,
            resourceId,
            userId: args.userId,
            hardDelete: args.hardDelete,
            reason: 'Bulk delete operation',
          }
        );
        
        results.succeeded.push(resourceId);
        if (result.softDeleted) {
          results.softDeleted++;
        } else {
          results.hardDeleted++;
        }
      } catch (error) {
        results.failed.push({
          id: resourceId,
          error: error.message,
        });
      }
    }
    
    // Log bulk operation
    await ctx.db.insert("deletionAuditLog", {
      resourceType: 'bulk_operation',
      resourceId: `bulk_${Date.now()}`,
      resourceName: `Bulk delete ${args.resourceType}`,
      deletedBy: args.userId,
      deletedAt: new Date().toISOString(),
      metadata: {
        resourceType: args.resourceType,
        totalRequested: args.resourceIds.length,
        succeeded: results.succeeded.length,
        failed: results.failed.length,
        failedIds: results.failed.map(f => f.id),
      },
      softDelete: false,
      restorable: false,
    });
    
    return results;
  },
});
```

### 6. Schedule Automatic Hard Delete
```typescript
export const scheduleAutomaticCleanup = mutation({
  args: {},
  handler: async (ctx) => {
    // Find expired soft deletes
    const expired = await ctx.db
      .query("softDeletedResources")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), new Date().toISOString()))
      .collect();
    
    const results = {
      processed: 0,
      deleted: 0,
      errors: [] as string[],
    };
    
    for (const resource of expired) {
      results.processed++;
      
      try {
        // Check if auto hard delete is enabled
        const config = getSoftDeleteConfig(resource.resourceType);
        if (!config.autoHardDelete) continue;
        
        // Perform hard delete
        await performHardDelete(
          ctx,
          {
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
          },
          resource.resourceData,
          { cascadeDependencies: [] }
        );
        
        // Remove from soft delete table
        await ctx.db.delete(resource._id);
        
        results.deleted++;
      } catch (error) {
        results.errors.push(`${resource.resourceType}:${resource.resourceId}: ${error.message}`);
      }
    }
    
    // Log cleanup
    if (results.processed > 0) {
      await ctx.db.insert("deletionAuditLog", {
        resourceType: 'cleanup_job',
        resourceId: `cleanup_${Date.now()}`,
        resourceName: 'Automatic cleanup',
        deletedBy: 'system',
        deletedAt: new Date().toISOString(),
        metadata: {
          processed: results.processed,
          deleted: results.deleted,
          errors: results.errors,
        },
        softDelete: false,
        restorable: false,
      });
    }
    
    return results;
  },
});
```

## Usage in Component

```typescript
// In the DeleteConfirmationModal component
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function DeleteConfirmationModal({ 
  isOpen, 
  itemType, 
  itemId, 
  itemName,
  onConfirm,
  onClose 
}) {
  const deleteResource = useMutation(api.common.mutations.deleteResource);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nameConfirmation, setNameConfirmation] = useState('');
  
  const handleConfirm = async () => {
    if (requiresNameConfirmation && nameConfirmation !== itemName) {
      toast.error('Name does not match');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await deleteResource({
        resourceType: itemType,
        resourceId: itemId,
        userId: currentUser.id,
        hardDelete: false, // Use soft delete by default
      });
      
      toast.success(result.message);
      
      if (onConfirm) {
        onConfirm();
      }
      
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // For permanent delete option
  const handlePermanentDelete = async () => {
    const confirmed = await showSecondaryConfirmation(
      'Are you absolutely sure? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteResource({
        resourceType: itemType,
        resourceId: itemId,
        userId: currentUser.id,
        hardDelete: true, // Force hard delete
        reason: 'User requested permanent deletion',
      });
      
      toast.success('Resource permanently deleted');
      
      if (onConfirm) {
        onConfirm();
      }
      
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };
}
```