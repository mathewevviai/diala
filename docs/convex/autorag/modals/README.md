# Auto-RAG Modals - Convex Implementation Documentation

## Overview
This directory contains comprehensive documentation for implementing Convex backend functionality for all modals in the Auto-RAG page. Each modal has its own subdirectory with schema, queries, and mutations documentation.

## Modal Components

### 1. CreateRAGWorkflowModal
**Purpose**: 4-step wizard for creating new RAG workflows
- **Location**: `/CreateRAGWorkflowModal/`
- **Key Features**:
  - Multi-step form validation
  - File upload handling
  - Source validation (documents, URLs, YouTube)
  - Processing parameter configuration
  - Cost estimation

### 2. ViewRAGWorkflowModal
**Purpose**: Comprehensive read-only view of workflow details
- **Location**: `/ViewRAGWorkflowModal/`
- **Key Features**:
  - Real-time progress tracking
  - Processing statistics
  - Source details display
  - Export functionality (JSON/vectors)
  - Agent integration

### 3. SettingsRAGWorkflowModal
**Purpose**: Edit workflow configuration and parameters
- **Location**: `/SettingsRAGWorkflowModal/`
- **Key Features**:
  - Change impact assessment
  - Source management (add/remove)
  - Parameter adjustment with preview
  - Workflow restart handling
  - Settings history tracking

### 4. DeleteConfirmationModal
**Purpose**: Generic deletion confirmation with safety features
- **Location**: `/DeleteConfirmationModal/`
- **Key Features**:
  - Dependency checking
  - Soft delete support
  - Name confirmation for high-risk deletions
  - Cascade deletion handling
  - Restoration capabilities

## Database Schema Overview

### Core Tables
```typescript
// Main workflow table
ragWorkflows: {
  name: string
  status: WorkflowStatus
  progress: number
  type: WorkflowType
  parameters: WorkflowParameters
  stats: WorkflowStats
  timestamps: Timestamps
  userId: string
}

// Processing tracking
ragWorkflowSteps: {
  workflowId: Id<"ragWorkflows">
  stepName: StepName
  status: StepStatus
  progress: number
  timestamps: StepTimestamps
}

// Source details
ragSourceDetails: {
  workflowId: Id<"ragWorkflows">
  source: string
  sourceType: SourceType
  status: SourceStatus
  metadata: SourceMetadata
  stats: SourceStats
}

// Embeddings storage
ragEmbeddings: {
  workflowId: Id<"ragWorkflows">
  vector: number[]
  text: string
  metadata: EmbeddingMetadata
}
```

### Supporting Tables
- `ragWorkflowEvents`: Timeline and audit trail
- `ragWorkflowExports`: Export history and links
- `ragWorkflowSettingsHistory`: Configuration changes
- `ragWorkflowLocks`: Concurrent edit prevention
- `deletionAuditLog`: Deletion tracking
- `softDeletedResources`: Soft delete storage

## Common Patterns

### 1. Permission Checking
```typescript
// Standard permission check pattern
const permission = await validatePermission(userId, resourceId);
if (!permission.canAccess) {
  throw new Error(permission.reason);
}
```

### 2. Lock Management
```typescript
// Acquire lock before editing
const lockId = await acquireWorkflowLock(workflowId, userId);
try {
  // Perform operations
} finally {
  await releaseWorkflowLock(lockId);
}
```

### 3. Change Tracking
```typescript
// Track all changes
const changes = compareSettings(oldSettings, newSettings);
await recordSettingsHistory(workflowId, userId, changes);
```

### 4. Soft Delete Pattern
```typescript
// Soft delete by default
const result = await deleteResource({
  resourceType: 'ragWorkflow',
  resourceId: workflowId,
  hardDelete: false, // Soft delete
});
```

## Implementation Checklist

### For Each Modal:
- [ ] Create Convex schema tables
- [ ] Implement all queries
- [ ] Implement all mutations
- [ ] Add proper indexes
- [ ] Set up real-time subscriptions
- [ ] Add error handling
- [ ] Implement validation
- [ ] Add audit logging

### Security Considerations:
- [ ] User authentication checks
- [ ] Resource ownership validation
- [ ] Rate limiting for expensive operations
- [ ] Input sanitization
- [ ] Proper error messages (no sensitive data)

### Performance Optimizations:
- [ ] Proper indexing on all queries
- [ ] Pagination for large datasets
- [ ] Batch operations where possible
- [ ] Caching for expensive calculations
- [ ] Background jobs for heavy processing

## Integration with Frontend

### Using Convex React Hooks
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Queries
const workflowDetails = useQuery(
  api.ragWorkflows.queries.getWorkflowDetails,
  { workflowId }
);

// Mutations
const createWorkflow = useMutation(
  api.ragWorkflows.mutations.createWorkflow
);

// Real-time updates
const { data, error, isLoading } = useQuery(
  api.ragWorkflows.queries.getWorkflowDetails,
  { workflowId, includeSteps: true }
);
```

### Error Handling Pattern
```typescript
try {
  const result = await mutation(args);
  toast.success(result.message);
} catch (error) {
  if (error instanceof ConvexError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

## Next Steps

1. **Schema Implementation**: Start by implementing the schema in `convex/schema.ts`
2. **Core Queries**: Implement essential read operations
3. **Core Mutations**: Implement create/update/delete operations
4. **Advanced Features**: Add soft delete, history, exports
5. **Testing**: Create test suites for all operations
6. **Documentation**: Update docs as implementation progresses

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Schema Guide](https://docs.convex.dev/database/schemas)
- [Convex React Integration](https://docs.convex.dev/client/react)
- [Convex Best Practices](https://docs.convex.dev/production/best-practices)