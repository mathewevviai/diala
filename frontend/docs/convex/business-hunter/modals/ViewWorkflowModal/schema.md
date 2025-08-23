# ViewWorkflowModal - Convex Schema

## Overview
Schema definition for the View Workflow Modal which displays detailed information about hunt workflows and their results, including export functionality.

## Schema Structure

### huntWorkflowResults Table
```typescript
huntWorkflowResults: defineTable({
  workflowId: v.id("huntWorkflows"),
  
  // Business Information
  businessName: v.string(),
  industry: v.string(),
  description: v.optional(v.string()),
  website: v.optional(v.string()),
  
  // Contact Information
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  
  // Location Data
  address: v.optional(v.string()),
  city: v.string(),
  state: v.optional(v.string()),
  country: v.string(),
  postalCode: v.optional(v.string()),
  
  // Social Media & Professional
  linkedinUrl: v.optional(v.string()),
  facebookUrl: v.optional(v.string()),
  twitterUrl: v.optional(v.string()),
  
  // Business Details
  employeeCount: v.optional(v.number()),
  yearFounded: v.optional(v.number()),
  annualRevenue: v.optional(v.string()),
  
  // Data Quality & Validation
  validationStatus: v.union(
    v.literal("pending"),
    v.literal("validated"),
    v.literal("failed"),
    v.literal("skipped")
  ),
  confidenceScore: v.number(), // 0-100
  dataSource: v.string(), // URL or source identifier
  
  // Metadata
  extractedAt: v.string(), // ISO timestamp
  validatedAt: v.optional(v.string()), // ISO timestamp
  tags: v.array(v.string()),
  notes: v.optional(v.string()),
})
.index("by_workflow", ["workflowId"])
.index("by_validation_status", ["validationStatus"])
.index("by_confidence", ["confidenceScore"])
.index("by_extracted_date", ["extractedAt"])
```

### huntWorkflowExports Table
```typescript
huntWorkflowExports: defineTable({
  workflowId: v.id("huntWorkflows"),
  exportType: v.union(
    v.literal("csv"),
    v.literal("excel"),
    v.literal("json"),
    v.literal("crm")
  ),
  
  // Export Configuration
  includeFields: v.array(v.string()), // Selected fields to export
  filterCriteria: v.object({
    minConfidenceScore: v.optional(v.number()),
    validationStatus: v.optional(v.array(v.string())),
    includeEmptyFields: v.optional(v.boolean()),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
  }),
  
  // Export Status
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  
  // File Information
  fileName: v.optional(v.string()),
  fileSize: v.optional(v.number()), // bytes
  downloadUrl: v.optional(v.string()),
  recordCount: v.optional(v.number()),
  
  // CRM Integration (if applicable)
  crmProvider: v.optional(v.string()), // "salesforce", "hubspot", etc.
  crmSyncStatus: v.optional(v.string()),
  crmRecordIds: v.optional(v.array(v.string())),
  
  // Metadata
  requestedBy: v.id("users"),
  requestedAt: v.string(),
  completedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()), // Download expiration
  errorMessage: v.optional(v.string()),
})
.index("by_workflow", ["workflowId"])
.index("by_user", ["requestedBy"])
.index("by_status", ["status"])
.index("by_requested_date", ["requestedAt"])
```

### huntWorkflowStats Table
```typescript
huntWorkflowStats: defineTable({
  workflowId: v.id("huntWorkflows"),
  
  // Search Statistics
  totalPagesScanned: v.number(),
  totalPagesScraped: v.number(),
  totalBusinessesFound: v.number(),
  totalBusinessesValidated: v.number(),
  
  // Quality Metrics
  averageConfidenceScore: v.number(),
  validationSuccessRate: v.number(), // percentage
  dataCompletenessScore: v.number(), // percentage
  
  // Source Breakdown
  sourceBreakdown: v.object({
    googleMaps: v.number(),
    yellowPages: v.number(),
    linkedin: v.number(),
    companyWebsites: v.number(),
    directories: v.number(),
    other: v.number(),
  }),
  
  // Geographic Distribution
  geographicDistribution: v.array(v.object({
    location: v.string(),
    count: v.number(),
    percentage: v.number(),
  })),
  
  // Industry Distribution
  industryDistribution: v.array(v.object({
    industry: v.string(),
    count: v.number(),
    percentage: v.number(),
  })),
  
  // Processing Timeline
  searchStarted: v.string(),
  searchCompleted: v.optional(v.string()),
  processingDuration: v.optional(v.number()), // seconds
  
  // Updated timestamp
  lastUpdated: v.string(),
})
.index("by_workflow", ["workflowId"])
```

## Field Descriptions

### huntWorkflowResults
- **businessName**: Extracted company/business name
- **industry**: Business category or industry classification
- **validationStatus**: Data verification status
- **confidenceScore**: AI confidence in data accuracy (0-100)
- **dataSource**: Original URL or source where data was found

### huntWorkflowExports
- **exportType**: Format for data export (CSV, Excel, JSON, CRM)
- **includeFields**: User-selected fields to include in export
- **filterCriteria**: User-defined filters for export data
- **downloadUrl**: Temporary signed URL for file download

### huntWorkflowStats
- **sourceBreakdown**: Count of businesses found per source type
- **geographicDistribution**: Breakdown by location
- **industryDistribution**: Breakdown by business type
- **dataCompletenessScore**: Percentage of fields with data

## Data Relationships

### Primary Relationships
- huntWorkflowResults.workflowId → huntWorkflows._id
- huntWorkflowExports.workflowId → huntWorkflows._id
- huntWorkflowStats.workflowId → huntWorkflows._id

### User Relationships
- huntWorkflowExports.requestedBy → users._id

## Validation Rules

### Business Rules
- Confidence score must be 0-100
- Validation status transitions: pending → validated/failed/skipped
- Export files expire after 7 days
- Maximum 1000 records per CSV export (pagination required)

### Data Quality
- Business name is required
- City and country are required for location
- Email format validation when present
- Phone number format standardization
- URL validation for website and social media links