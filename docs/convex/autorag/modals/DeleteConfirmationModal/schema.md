# DeleteConfirmationModal - Convex Schema Documentation

## Overview
This is a generic confirmation modal used across the application for deleting various resources. It includes configurable warnings, name confirmation for high-risk deletions, and consequence displays.

## Data Types

### Modal Configuration
```typescript
interface DeleteConfirmationConfig {
  itemName: string;              // Name of item to delete
  itemType: string;              // Type of item (e.g., "RAG workflow", "agent")
  warningMessage?: string;       // Custom warning message
  consequences?: string[];       // List of consequences
  requiresNameConfirmation?: boolean;  // Require typing item name
  isLoading?: boolean;          // Show loading state during deletion
}

interface DeleteValidation {
  canDelete: boolean;
  reason?: string;
  dependencies?: string[];
  alternativeAction?: string;
}
```

## Extended Convex Schema for Deletion Tracking

```typescript
// Deletion audit log
export const deletionAuditLog = defineTable({
  resourceType: v.string(), // "ragWorkflow", "agent", "call", etc.
  resourceId: v.string(),
  resourceName: v.string(),
  deletedBy: v.string(),
  deletedAt: v.string(),
  metadata: v.optional(v.object({
    parentResources: v.optional(v.array(v.string())),
    childResources: v.optional(v.array(v.string())),
    stats: v.optional(v.any()),
    reason: v.optional(v.string()),
  })),
  softDelete: v.boolean(), // Whether it was soft or hard delete
  restorable: v.boolean(),
  expiresAt: v.optional(v.string()), // When soft delete becomes hard delete
})
.index("by_user", ["deletedBy"])
.index("by_type", ["resourceType"])
.index("by_date", ["deletedAt"]);

// Soft delete storage
export const softDeletedResources = defineTable({
  resourceType: v.string(),
  resourceId: v.string(),
  resourceData: v.any(), // Serialized resource data
  deletedBy: v.string(),
  deletedAt: v.string(),
  expiresAt: v.string(), // Auto-purge date
  restoreCount: v.number(),
  lastRestoredAt: v.optional(v.string()),
})
.index("by_expiry", ["expiresAt"])
.index("by_type_and_user", ["resourceType", "deletedBy"]);

// Deletion dependencies
export const resourceDependencies = defineTable({
  resourceType: v.string(),
  resourceId: v.string(),
  dependsOn: v.array(v.object({
    type: v.string(),
    id: v.string(),
    relationship: v.string(), // "uses", "references", "parent", etc.
    cascadeDelete: v.boolean(),
  })),
  dependents: v.array(v.object({
    type: v.string(),
    id: v.string(),
    relationship: v.string(),
    blocksDeletion: v.boolean(),
  })),
})
.index("by_resource", ["resourceType", "resourceId"]);
```

## Resource-Specific Delete Configurations

```typescript
// RAG Workflow deletion config
export const RAG_WORKFLOW_DELETE_CONFIG = {
  warningMessage: "This will permanently delete the workflow and all its embeddings",
  consequences: [
    "All generated embeddings will be lost",
    "Vector index data cannot be recovered",
    "Agents using this workflow will lose RAG capabilities",
    "Processing history will be deleted"
  ],
  requiresNameConfirmation: (workflow: any) => workflow.stats.embeddings > 1000,
  checkDependencies: async (workflowId: string) => {
    // Check for agents using this workflow
    const dependentAgents = await getAgentsUsingWorkflow(workflowId);
    return {
      canDelete: dependentAgents.length === 0,
      dependencies: dependentAgents.map(a => `Agent: ${a.name}`),
      alternativeAction: "Remove workflow from agents before deleting"
    };
  }
};

// Agent deletion config
export const AGENT_DELETE_CONFIG = {
  warningMessage: "This will permanently delete the agent and all its configurations",
  consequences: [
    "All agent settings will be lost",
    "Call history will be archived",
    "Active calls will be terminated",
    "Scheduled tasks will be cancelled"
  ],
  requiresNameConfirmation: true,
  checkDependencies: async (agentId: string) => {
    const activeCalls = await getActiveCallsForAgent(agentId);
    return {
      canDelete: activeCalls.length === 0,
      dependencies: activeCalls.map(c => `Active call: ${c.id}`),
      alternativeAction: "End all active calls before deleting"
    };
  }
};

// Call deletion config
export const CALL_DELETE_CONFIG = {
  warningMessage: "This will permanently delete the call record",
  consequences: [
    "Call recording will be deleted",
    "Transcript will be removed",
    "Analytics data will be lost"
  ],
  requiresNameConfirmation: false,
  checkDependencies: async (callId: string) => {
    return { canDelete: true, dependencies: [] };
  }
};
```

## Deletion Process States

```typescript
export enum DeletionState {
  CONFIRMING = "confirming",      // User viewing confirmation
  VALIDATING = "validating",      // Checking dependencies
  DELETING = "deleting",          // Performing deletion
  COMPLETED = "completed",        // Deletion successful
  FAILED = "failed",              // Deletion failed
  CANCELLED = "cancelled"         // User cancelled
}

export interface DeletionProgress {
  state: DeletionState;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  message: string;
  error?: string;
}
```

## Soft Delete Configuration

```typescript
export const SOFT_DELETE_CONFIG = {
  ragWorkflows: {
    enabled: true,
    retentionDays: 30,
    autoHardDelete: true,
    maxRestores: 3
  },
  agents: {
    enabled: true,
    retentionDays: 90,
    autoHardDelete: false,
    maxRestores: 5
  },
  calls: {
    enabled: false, // Calls are hard deleted
    retentionDays: 0,
    autoHardDelete: true,
    maxRestores: 0
  }
};

export const DELETION_PERMISSIONS = {
  ragWorkflows: {
    requiresOwnership: true,
    requiresAdminForShared: true,
    allowBulkDelete: false
  },
  agents: {
    requiresOwnership: true,
    requiresAdminForShared: false,
    allowBulkDelete: true
  },
  calls: {
    requiresOwnership: true,
    requiresAdminForShared: false,
    allowBulkDelete: true
  }
};
```

## Validation Rules

```typescript
export const validateDeletion = async (
  resourceType: string,
  resourceId: string,
  userId: string
): Promise<DeleteValidation> => {
  // Check ownership
  const resource = await getResource(resourceType, resourceId);
  if (!resource) {
    return {
      canDelete: false,
      reason: "Resource not found"
    };
  }
  
  const permissions = DELETION_PERMISSIONS[resourceType];
  if (permissions.requiresOwnership && resource.userId !== userId) {
    if (!permissions.requiresAdminForShared || !isAdmin(userId)) {
      return {
        canDelete: false,
        reason: "You don't have permission to delete this resource"
      };
    }
  }
  
  // Check dependencies
  const dependencies = await checkResourceDependencies(resourceType, resourceId);
  if (dependencies.blockingDependents.length > 0) {
    return {
      canDelete: false,
      reason: "Resource has blocking dependencies",
      dependencies: dependencies.blockingDependents,
      alternativeAction: dependencies.suggestedAction
    };
  }
  
  // Check active status
  if (resourceType === 'ragWorkflows') {
    const workflow = resource as RAGWorkflow;
    if (['scraping', 'embedding', 'indexing'].includes(workflow.status)) {
      return {
        canDelete: false,
        reason: "Cannot delete active workflow",
        alternativeAction: "Stop the workflow before deleting"
      };
    }
  }
  
  return {
    canDelete: true,
    dependencies: dependencies.cascadeDependents
  };
};
```

## Common Delete Consequences

```typescript
export const getDeleteConsequences = (
  resourceType: string,
  resource: any
): string[] => {
  const baseConsequences = [
    "This action cannot be undone",
    "All associated data will be permanently deleted"
  ];
  
  switch (resourceType) {
    case 'ragWorkflows':
      return [
        ...baseConsequences,
        `${resource.stats.embeddings} embeddings will be deleted`,
        `${resource.stats.indexSize} of vector data will be removed`,
        resource.status !== 'completed' && resource.status !== 'failed'
          ? 'Active processing will be immediately stopped'
          : 'Trained knowledge base will be permanently deleted',
        'Any agents using this workflow will lose RAG capabilities'
      ].filter(Boolean);
    
    case 'agents':
      const activeCalls = resource.stats?.activeCalls || 0;
      return [
        ...baseConsequences,
        'Agent configuration will be lost',
        activeCalls > 0 
          ? `${activeCalls} active call(s) will be terminated`
          : 'Call history will be archived',
        resource.ragWorkflowId 
          ? 'RAG integration will be removed'
          : null,
        'Scheduled tasks will be cancelled'
      ].filter(Boolean);
    
    case 'calls':
      return [
        ...baseConsequences,
        'Call recording will be deleted',
        'Transcript and analytics will be lost',
        'This will not affect the agent configuration'
      ];
    
    default:
      return baseConsequences;
  }
};
```