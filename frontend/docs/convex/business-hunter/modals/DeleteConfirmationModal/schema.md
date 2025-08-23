# DeleteConfirmationModal - Convex Schema

## Overview
Schema definition for the Delete Confirmation Modal which handles secure deletion of hunt workflows with proper audit trails and data cleanup.

## Schema Structure

### huntWorkflowDeletions Table
```typescript
huntWorkflowDeletions: defineTable({
  // Original workflow reference
  originalWorkflowId: v.string(), // Store as string since original will be deleted
  workflowName: v.string(),
  workflowUserId: v.id("users"),
  
  // Deletion Context
  deletionReason: v.optional(v.string()),
  deletionType: v.union(
    v.literal("user_request"),
    v.literal("admin_action"),
    v.literal("system_cleanup"),
    v.literal("policy_violation")
  ),
  
  // Deletion Confirmation
  confirmationMethod: v.union(
    v.literal("name_confirmation"),
    v.literal("password_confirmation"),
    v.literal("admin_override")
  ),
  confirmationValue: v.string(), // What user entered for confirmation
  
  // Workflow State at Deletion
  workflowStatus: v.string(),
  workflowProgress: v.number(),
  totalResults: v.number(),
  validatedResults: v.number(),
  
  // Data Impact Assessment
  dataLossAssessment: v.object({
    businessesExtracted: v.number(),
    pagesScraped: v.number(),
    timeInvested: v.number(), // minutes
    exportsPrevious: v.number(),
    isRecoverable: v.boolean(),
    estimatedRecoveryTime: v.optional(v.string()),
  }),
  
  // Deletion Process
  deletionSteps: v.array(v.object({
    step: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"), 
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })),
  
  // Cleanup Status
  cleanupStatus: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("partial"),
    v.literal("failed")
  ),
  
  remainingReferences: v.array(v.object({
    table: v.string(),
    count: v.number(),
    cleanupRequired: v.boolean(),
  })),
  
  // Audit Information
  requestedBy: v.id("users"),
  requestedAt: v.string(),
  processedBy: v.optional(v.id("users")), // For admin deletions
  processedAt: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  
  // Recovery Information (for rollback)
  canRecover: v.boolean(),
  recoveryExpiresAt: v.optional(v.string()), // 30 days max
  backupLocation: v.optional(v.string()),
})
.index("by_user", ["workflowUserId"])
.index("by_requested_date", ["requestedAt"])
.index("by_deletion_type", ["deletionType"])
.index("by_cleanup_status", ["cleanupStatus"])
```

### huntWorkflowBackups Table
```typescript
huntWorkflowBackups: defineTable({
  deletionId: v.id("huntWorkflowDeletions"),
  originalWorkflowId: v.string(),
  
  // Backup Data
  workflowData: v.any(), // Complete workflow object
  settingsData: v.optional(v.any()), // Workflow settings
  resultsCount: v.number(),
  exportHistory: v.array(v.any()), // Export records
  
  // Backup Metadata
  backupSize: v.number(), // bytes
  compressionType: v.optional(v.string()),
  encryptionKey: v.optional(v.string()),
  
  // Backup Storage
  storageLocation: v.string(), // S3, local, etc.
  storageKey: v.string(),
  checksumSha256: v.string(),
  
  // Lifecycle
  createdAt: v.string(),
  expiresAt: v.string(),
  accessedAt: v.optional(v.string()),
  restoredAt: v.optional(v.string()),
  
  // Status
  backupStatus: v.union(
    v.literal("creating"),
    v.literal("available"),
    v.literal("corrupted"),
    v.literal("expired"),
    v.literal("restored")
  ),
})
.index("by_deletion", ["deletionId"])
.index("by_expiry", ["expiresAt"])
.index("by_status", ["backupStatus"])
```

### systemCleanupTasks Table
```typescript
systemCleanupTasks: defineTable({
  taskType: v.union(
    v.literal("workflow_deletion"),
    v.literal("backup_expiry"),
    v.literal("orphaned_data"),
    v.literal("audit_cleanup")
  ),
  
  // Task Target
  targetId: v.string(), // ID of the item to clean
  targetType: v.string(), // Table name or resource type
  
  // Cleanup Configuration
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  
  batchSize: v.number(),
  maxRetries: v.number(),
  retryCount: v.number(),
  
  // Task Status
  status: v.union(
    v.literal("scheduled"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  
  progress: v.number(), // 0-100
  itemsProcessed: v.number(),
  itemsTotal: v.number(),
  
  // Scheduling
  scheduledAt: v.string(),
  startedAt: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  nextRetryAt: v.optional(v.string()),
  
  // Results
  successCount: v.number(),
  errorCount: v.number(),
  skippedCount: v.number(),
  lastError: v.optional(v.string()),
  
  // Metadata
  createdBy: v.optional(v.id("users")),
  processingNode: v.optional(v.string()),
})
.index("by_status", ["status"])
.index("by_priority", ["priority"])
.index("by_scheduled", ["scheduledAt"])
.index("by_type", ["taskType"])
```

## Field Descriptions

### huntWorkflowDeletions
- **confirmationMethod**: How user confirmed deletion intent
- **confirmationValue**: What user typed to confirm (workflow name, etc.)
- **dataLossAssessment**: Analysis of what data will be lost
- **deletionSteps**: Step-by-step process tracking
- **cleanupStatus**: Overall cleanup completion status
- **canRecover**: Whether deletion can be undone

### huntWorkflowBackups
- **workflowData**: Complete snapshot of workflow before deletion
- **backupSize**: Size of backup data in bytes
- **storageLocation**: Where backup is stored (S3, local filesystem)
- **checksumSha256**: Data integrity verification
- **expiresAt**: When backup will be permanently deleted

### systemCleanupTasks
- **taskType**: Category of cleanup operation
- **batchSize**: How many items to process per batch
- **priority**: Task execution priority
- **itemsProcessed**: Progress tracking
- **processingNode**: Which server/worker is handling the task

## Deletion Process Flow

### Standard Deletion Steps
1. **Validation** - Verify user permissions and confirmation
2. **Impact Assessment** - Calculate data loss and recovery options
3. **Backup Creation** - Create recoverable backup if enabled
4. **Workflow Pause** - Stop active workflow if running
5. **Data Cleanup** - Remove workflow results and related data
6. **Settings Cleanup** - Remove workflow settings and logs
7. **Export Cleanup** - Remove associated export files
8. **Audit Cleanup** - Archive audit logs
9. **Final Cleanup** - Remove workflow record itself
10. **Verification** - Confirm all references removed

### Recovery Window
- Backups retained for 30 days (configurable)
- Recovery possible within retention period
- Automatic backup cleanup after expiry
- Premium users get longer retention

## Validation Rules

### Confirmation Requirements
- Workflows with >50 results require name confirmation
- Active workflows require additional confirmation
- Admin deletions can bypass user confirmation
- Failed workflows can be deleted with simple confirmation

### Data Protection
- Backups created before deletion (if plan allows)
- Audit trail maintained permanently
- Related data cleaned up in proper order
- Foreign key constraints respected

### Business Rules
- Only workflow owner can delete (unless admin)
- Active workflows paused before deletion
- Export files cleaned up within 24 hours
- Cleanup tasks prioritized by impact

## Related Tables
- **huntWorkflows**: Main workflow records (deleted)
- **huntWorkflowResults**: Business data (deleted)
- **huntWorkflowExports**: Export records (deleted)
- **huntWorkflowSettings**: Configuration (deleted)
- **huntWorkflowChangeLog**: Audit logs (archived)

## Cleanup Dependencies
Deletion order to maintain referential integrity:
1. huntWorkflowExports (references workflow)
2. huntWorkflowResults (references workflow)
3. huntWorkflowSettings (references workflow)
4. huntWorkflowChangeLog (archived, not deleted)
5. huntWorkflows (main record)

## Recovery Schema Extensions
```typescript
// Additional fields for recovery support
interface RecoveryMetadata {
  originalCreatedAt: string;
  originalModifiedAt: string;
  restorationPoint: string;
  conflictResolution: "overwrite" | "merge" | "skip";
  dependencyMap: Array<{
    table: string;
    originalId: string;
    newId?: string;
  }>;
}
```