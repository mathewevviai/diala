# DeleteConfirmationModal - Convex Queries Documentation

## Overview
Queries for validating deletions, checking dependencies, and retrieving deletion-related information for the confirmation modal.

## Query Definitions

### 1. Validate Delete Permission
```typescript
// convex/common/queries.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const validateDeletePermission = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get resource based on type
    let resource: any;
    let tableName: string;
    
    switch (args.resourceType) {
      case 'ragWorkflow':
        tableName = 'ragWorkflows';
        resource = await ctx.db.get(args.resourceId as any);
        break;
      case 'agent':
        tableName = 'agents';
        resource = await ctx.db.get(args.resourceId as any);
        break;
      case 'call':
        tableName = 'calls';
        resource = await ctx.db.get(args.resourceId as any);
        break;
      default:
        return {
          canDelete: false,
          reason: 'Unknown resource type',
        };
    }
    
    if (!resource) {
      return {
        canDelete: false,
        reason: 'Resource not found',
      };
    }
    
    // Check ownership
    const isOwner = resource.userId === args.userId;
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
    
    const isAdmin = user?.role === 'admin';
    
    // Apply permission rules
    const permissions = {
      ragWorkflow: {
        requiresOwnership: true,
        adminCanOverride: true,
      },
      agent: {
        requiresOwnership: true,
        adminCanOverride: true,
      },
      call: {
        requiresOwnership: true,
        adminCanOverride: false,
      },
    };
    
    const rules = permissions[args.resourceType];
    
    if (!isOwner && (!isAdmin || !rules.adminCanOverride)) {
      return {
        canDelete: false,
        reason: 'You do not have permission to delete this resource',
        isOwner,
        isAdmin,
      };
    }
    
    // Check resource-specific constraints
    if (args.resourceType === 'ragWorkflow') {
      const workflow = resource as any;
      if (['scraping', 'embedding', 'indexing', 'validating'].includes(workflow.status)) {
        return {
          canDelete: false,
          reason: 'Cannot delete an active workflow',
          suggestion: 'Stop the workflow before attempting to delete it',
          currentStatus: workflow.status,
        };
      }
    }
    
    return {
      canDelete: true,
      isOwner,
      isAdmin,
      resourceName: resource.name || `${args.resourceType} ${args.resourceId}`,
    };
  },
});
```

### 2. Check Resource Dependencies
```typescript
export const checkResourceDependencies = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const dependencies = {
      blocking: [] as any[],
      cascade: [] as any[],
      warnings: [] as string[],
    };
    
    switch (args.resourceType) {
      case 'ragWorkflow':
        // Check agents using this workflow
        const agents = await ctx.db
          .query("agents")
          .filter((q) => q.eq(q.field("ragWorkflowId"), args.resourceId))
          .collect();
        
        if (agents.length > 0) {
          dependencies.blocking = agents.map(agent => ({
            type: 'agent',
            id: agent._id,
            name: agent.name,
            relationship: 'uses RAG workflow',
          }));
          dependencies.warnings.push(
            `${agents.length} agent(s) are using this workflow`
          );
        }
        
        // Check embeddings
        const embeddings = await ctx.db
          .query("ragEmbeddings")
          .withIndex("by_workflow", (q) => q.eq("workflowId", args.resourceId))
          .take(1);
        
        if (embeddings.length > 0) {
          const workflow = await ctx.db.get(args.resourceId as any);
          if (workflow) {
            dependencies.cascade.push({
              type: 'embeddings',
              count: workflow.stats.embeddings,
              size: workflow.stats.indexSize,
            });
            dependencies.warnings.push(
              `${workflow.stats.embeddings} embeddings will be deleted`
            );
          }
        }
        break;
      
      case 'agent':
        // Check active calls
        const activeCalls = await ctx.db
          .query("calls")
          .withIndex("by_agent", (q) => q.eq("agentId", args.resourceId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
        
        if (activeCalls.length > 0) {
          dependencies.blocking = activeCalls.map(call => ({
            type: 'call',
            id: call._id,
            name: `Call ${call.phoneNumber || call.id}`,
            relationship: 'active call',
          }));
          dependencies.warnings.push(
            `${activeCalls.length} active call(s) must be ended first`
          );
        }
        
        // Check call history
        const allCalls = await ctx.db
          .query("calls")
          .withIndex("by_agent", (q) => q.eq("agentId", args.resourceId))
          .collect();
        
        if (allCalls.length > 0) {
          dependencies.cascade.push({
            type: 'calls',
            count: allCalls.length,
            relationship: 'call history',
          });
          dependencies.warnings.push(
            `${allCalls.length} call record(s) will be archived`
          );
        }
        
        // Check scheduled tasks
        const scheduledTasks = await ctx.db
          .query("scheduledTasks")
          .filter((q) => q.eq(q.field("agentId"), args.resourceId))
          .collect();
        
        if (scheduledTasks.length > 0) {
          dependencies.cascade.push({
            type: 'tasks',
            count: scheduledTasks.length,
            relationship: 'scheduled tasks',
          });
          dependencies.warnings.push(
            `${scheduledTasks.length} scheduled task(s) will be cancelled`
          );
        }
        break;
      
      case 'call':
        // Check recordings
        const call = await ctx.db.get(args.resourceId as any);
        if (call?.recordingId) {
          dependencies.cascade.push({
            type: 'recording',
            id: call.recordingId,
            relationship: 'call recording',
          });
          dependencies.warnings.push('Call recording will be deleted');
        }
        
        // Check transcripts
        if (call?.transcriptId) {
          dependencies.cascade.push({
            type: 'transcript',
            id: call.transcriptId,
            relationship: 'call transcript',
          });
          dependencies.warnings.push('Call transcript will be deleted');
        }
        break;
    }
    
    return {
      hasBlockingDependencies: dependencies.blocking.length > 0,
      blockingDependencies: dependencies.blocking,
      cascadeDependencies: dependencies.cascade,
      warnings: dependencies.warnings,
      canProceed: dependencies.blocking.length === 0,
    };
  },
});
```

### 3. Get Deletion History
```typescript
export const getDeletionHistory = query({
  args: {
    userId: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let query = ctx.db.query("deletionAuditLog");
    
    if (args.userId) {
      query = query.withIndex("by_user", (q) => q.eq("deletedBy", args.userId));
    } else if (args.resourceType) {
      query = query.withIndex("by_type", (q) => q.eq("resourceType", args.resourceType));
    } else {
      query = query.withIndex("by_date");
    }
    
    const deletions = await query
      .order("desc")
      .take(limit);
    
    // Enhance with user information
    const enhancedDeletions = await Promise.all(
      deletions.map(async (deletion) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("id"), deletion.deletedBy))
          .first();
        
        return {
          ...deletion,
          deletedByName: user?.name || 'Unknown user',
          timeAgo: getTimeAgo(deletion.deletedAt),
          isRestorable: deletion.restorable && 
            deletion.expiresAt && 
            new Date(deletion.expiresAt) > new Date(),
        };
      })
    );
    
    return {
      deletions: enhancedDeletions,
      total: deletions.length,
    };
  },
});

function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
```

### 4. Get Restorable Resources
```typescript
export const getRestorableResources = query({
  args: {
    userId: v.string(),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("softDeletedResources")
      .filter((q) => 
        q.and(
          q.eq(q.field("deletedBy"), args.userId),
          q.gt(q.field("expiresAt"), new Date().toISOString())
        )
      );
    
    if (args.resourceType) {
      query = query.filter((q) => q.eq(q.field("resourceType"), args.resourceType));
    }
    
    const resources = await query.collect();
    
    // Group by type and enhance
    const grouped = resources.reduce((acc, resource) => {
      if (!acc[resource.resourceType]) {
        acc[resource.resourceType] = [];
      }
      
      const daysUntilExpiry = Math.ceil(
        (new Date(resource.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      acc[resource.resourceType].push({
        ...resource,
        resourceName: resource.resourceData.name || 'Unnamed',
        daysUntilExpiry,
        canRestore: resource.restoreCount < getMaxRestores(resource.resourceType),
        restoresRemaining: getMaxRestores(resource.resourceType) - resource.restoreCount,
      });
      
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      resources: grouped,
      totalRestorable: resources.length,
      types: Object.keys(grouped),
    };
  },
});

function getMaxRestores(resourceType: string): number {
  const limits: Record<string, number> = {
    ragWorkflow: 3,
    agent: 5,
    call: 0,
  };
  return limits[resourceType] || 1;
}
```

### 5. Calculate Deletion Impact
```typescript
export const calculateDeletionImpact = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const impact = {
      immediateEffects: [] as string[],
      cascadeEffects: [] as string[],
      storageReclaimed: '0 MB',
      affectedUsers: [] as string[],
      estimatedTime: '< 1 minute',
      requiresNameConfirmation: false,
    };
    
    switch (args.resourceType) {
      case 'ragWorkflow':
        const workflow = await ctx.db.get(args.resourceId as any);
        if (!workflow) break;
        
        impact.immediateEffects = [
          'Workflow configuration will be deleted',
          'Processing history will be removed',
          'All source references will be cleared',
        ];
        
        impact.cascadeEffects = [
          `${workflow.stats.embeddings} embeddings will be deleted`,
          'Vector index will be cleared',
          'Agents using this workflow will lose RAG capabilities',
        ];
        
        impact.storageReclaimed = workflow.stats.indexSize;
        impact.requiresNameConfirmation = workflow.stats.embeddings > 1000;
        
        // Find affected agents
        const agents = await ctx.db
          .query("agents")
          .filter((q) => q.eq(q.field("ragWorkflowId"), args.resourceId))
          .collect();
        
        for (const agent of agents) {
          const agentUsers = await ctx.db
            .query("agentUsers")
            .filter((q) => q.eq(q.field("agentId"), agent._id))
            .collect();
          
          impact.affectedUsers.push(...agentUsers.map(u => u.userId));
        }
        
        // Estimate time based on data size
        const estimatedMinutes = Math.ceil(workflow.stats.embeddings / 10000);
        impact.estimatedTime = estimatedMinutes > 1 
          ? `${estimatedMinutes} minutes` 
          : '< 1 minute';
        break;
      
      case 'agent':
        const agent = await ctx.db.get(args.resourceId as any);
        if (!agent) break;
        
        impact.immediateEffects = [
          'Agent configuration will be deleted',
          'Custom settings will be lost',
          'Integration keys will be revoked',
        ];
        
        const calls = await ctx.db
          .query("calls")
          .withIndex("by_agent", (q) => q.eq("agentId", args.resourceId))
          .collect();
        
        impact.cascadeEffects = [
          `${calls.length} call records will be archived`,
          'Active calls will be terminated',
          'Scheduled tasks will be cancelled',
        ];
        
        impact.requiresNameConfirmation = true;
        break;
      
      case 'call':
        const call = await ctx.db.get(args.resourceId as any);
        if (!call) break;
        
        impact.immediateEffects = [
          'Call record will be deleted',
          'Recording will be removed',
          'Transcript will be deleted',
        ];
        
        impact.cascadeEffects = [
          'Analytics data will be lost',
          'Call will be removed from reports',
        ];
        
        if (call.recordingSize) {
          const sizeMB = (call.recordingSize / (1024 * 1024)).toFixed(1);
          impact.storageReclaimed = `${sizeMB} MB`;
        }
        break;
    }
    
    // Remove duplicates from affected users
    impact.affectedUsers = [...new Set(impact.affectedUsers)];
    
    return impact;
  },
});
```

## Usage in Component

```typescript
// In the DeleteConfirmationModal component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function DeleteConfirmationModal({ 
  isOpen, 
  itemType, 
  itemId, 
  itemName,
  onConfirm,
  onClose 
}) {
  // Validate permission
  const permission = useQuery(
    api.common.queries.validateDeletePermission,
    isOpen && itemId ? {
      resourceType: itemType,
      resourceId: itemId,
      userId: currentUser.id,
    } : "skip"
  );
  
  // Check dependencies
  const dependencies = useQuery(
    api.common.queries.checkResourceDependencies,
    isOpen && itemId ? {
      resourceType: itemType,
      resourceId: itemId,
    } : "skip"
  );
  
  // Calculate impact
  const impact = useQuery(
    api.common.queries.calculateDeletionImpact,
    isOpen && itemId ? {
      resourceType: itemType,
      resourceId: itemId,
    } : "skip"
  );
  
  // Get deletion history (optional)
  const history = useQuery(
    api.common.queries.getDeletionHistory,
    showHistory ? {
      userId: currentUser.id,
      resourceType: itemType,
      limit: 10,
    } : "skip"
  );
  
  // Build consequences list
  const consequences = React.useMemo(() => {
    if (!impact) return [];
    
    return [
      ...impact.immediateEffects,
      ...impact.cascadeEffects,
      impact.affectedUsers.length > 0 
        ? `${impact.affectedUsers.length} user(s) will be affected`
        : null,
      impact.storageReclaimed !== '0 MB'
        ? `${impact.storageReclaimed} of storage will be reclaimed`
        : null,
    ].filter(Boolean);
  }, [impact]);
  
  // Determine if name confirmation is required
  const requiresNameConfirmation = impact?.requiresNameConfirmation || 
    (itemType === 'agent') || 
    (dependencies?.warnings?.length > 2);
}
```