# HuntConfigurationModal - Convex Schema

## Overview
Schema definition for the Hunt Configuration Modal used in the Business Hunter dashboard. This modal allows users to create and configure new business discovery workflows.

## Schema Structure

### huntWorkflows Table
```typescript
huntWorkflows: defineTable({
  name: v.string(),
  status: v.union(
    v.literal("idle"),
    v.literal("searching"), 
    v.literal("scraping"),
    v.literal("analyzing"),
    v.literal("validating"),
    v.literal("completed"),
    v.literal("failed")
  ),
  progress: v.number(), // 0-100
  
  // Search Parameters
  location: v.string(),
  businessType: v.string(),
  keywords: v.array(v.string()),
  includeLinkedIn: v.boolean(),
  searchDepth: v.number(), // 1-5 levels
  
  // Statistics
  pagesFound: v.number(),
  pagesScraped: v.number(),
  businessesExtracted: v.number(),
  businessesValidated: v.number(),
  matchRate: v.number(), // percentage 0-100
  
  // Timestamps
  createdAt: v.string(), // ISO timestamp
  completedAt: v.optional(v.string()), // ISO timestamp
  estimatedTime: v.optional(v.string()), // Human readable duration
  
  // User association
  userId: v.id("users"),
})
.index("by_user", ["userId"])
.index("by_status", ["status"])
.index("by_created", ["createdAt"])
```

### huntWorkflowTemplates Table (Optional)
```typescript
huntWorkflowTemplates: defineTable({
  name: v.string(),
  description: v.string(),
  category: v.string(), // "saas", "ecommerce", "fintech", etc.
  
  // Default parameters
  defaultBusinessType: v.string(),
  defaultKeywords: v.array(v.string()),
  defaultSearchDepth: v.number(),
  defaultIncludeLinkedIn: v.boolean(),
  
  // Template metadata
  isPublic: v.boolean(),
  usageCount: v.number(),
  createdBy: v.id("users"),
  createdAt: v.string(),
})
.index("by_category", ["category"])
.index("by_public", ["isPublic"])
```

## Field Descriptions

### Core Workflow Fields
- **name**: User-defined name for the hunt workflow
- **status**: Current state of the workflow execution
- **progress**: Completion percentage (0-100)

### Search Parameters
- **location**: Geographic location for business search
- **businessType**: Industry or business category to target
- **keywords**: Array of search terms and filters
- **includeLinkedIn**: Whether to include LinkedIn in the search
- **searchDepth**: How many levels deep to search (1-5)

### Statistics
- **pagesFound**: Total number of web pages discovered
- **pagesScraped**: Number of pages successfully scraped
- **businessesExtracted**: Number of business entities extracted
- **businessesValidated**: Number of validated business contacts
- **matchRate**: Percentage of successful matches

### Timestamps
- **createdAt**: When the workflow was created
- **completedAt**: When the workflow finished (optional)
- **estimatedTime**: Estimated time remaining (optional)

## Validation Rules

### Required Fields
- name (min: 3 chars, max: 100 chars)
- location (min: 2 chars)
- businessType (from predefined list)
- keywords (min: 1 keyword, max: 10 keywords)
- searchDepth (1-5)

### Business Rules
- Only one workflow per user can be in "searching", "scraping", "analyzing", or "validating" status
- Keywords must be unique within a workflow
- Search depth affects processing time and cost
- Match rate is calculated as (businessesValidated / businessesExtracted) * 100

## Related Tables
- **users**: For user ownership and permissions
- **huntWorkflowResults**: For storing extracted business data
- **huntWorkflowAudit**: For tracking workflow state changes