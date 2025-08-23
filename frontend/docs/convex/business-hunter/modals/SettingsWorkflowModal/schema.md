# SettingsWorkflowModal - Convex Schema

## Overview
Schema definition for the Settings Workflow Modal which allows users to modify hunt workflow configurations and parameters for existing workflows.

## Schema Structure

### huntWorkflowSettings Table
```typescript
huntWorkflowSettings: defineTable({
  workflowId: v.id("huntWorkflows"),
  
  // Configuration Settings
  autoValidation: v.boolean(), // Enable automatic result validation
  qualityThreshold: v.number(), // Minimum confidence score (0-100)
  maxResults: v.number(), // Maximum number of results to collect
  
  // Search Behavior
  searchFrequency: v.union(
    v.literal("aggressive"), // Fast, more resources
    v.literal("moderate"),   // Balanced approach
    v.literal("conservative") // Slow, less resources
  ),
  
  retryFailedSources: v.boolean(),
  skipDuplicates: v.boolean(),
  respectRobotsTxt: v.boolean(),
  
  // Notification Settings
  emailNotifications: v.boolean(),
  slackWebhook: v.optional(v.string()),
  notificationEvents: v.array(v.union(
    v.literal("started"),
    v.literal("milestone_25"),
    v.literal("milestone_50"), 
    v.literal("milestone_75"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("error")
  )),
  
  // Data Processing
  enableDataEnrichment: v.boolean(), // Enhance with external APIs
  enableSocialMediaLookup: v.boolean(),
  enableCompanyLookup: v.boolean(),
  enableContactLookup: v.boolean(),
  
  // Export Settings
  defaultExportFormat: v.union(
    v.literal("csv"),
    v.literal("excel"),
    v.literal("json")
  ),
  autoExportOnCompletion: v.boolean(),
  exportDestination: v.optional(v.string()), // S3, Google Drive, etc.
  
  // Advanced Settings
  customHeaders: v.optional(v.object({
    userAgent: v.optional(v.string()),
    referer: v.optional(v.string()),
    acceptLanguage: v.optional(v.string()),
  })),
  
  proxySettings: v.optional(v.object({
    enabled: v.boolean(),
    rotateProxies: v.boolean(),
    maxProxyRetries: v.number(),
  })),
  
  rateLimiting: v.object({
    requestsPerSecond: v.number(),
    requestsPerMinute: v.number(),
    delayBetweenRequests: v.number(), // milliseconds
  }),
  
  // Metadata
  lastModified: v.string(),
  modifiedBy: v.id("users"),
  version: v.number(), // Settings version for migration
})
.index("by_workflow", ["workflowId"])
.index("by_modified", ["lastModified"])
```

### huntWorkflowChangeLog Table
```typescript
huntWorkflowChangeLog: defineTable({
  workflowId: v.id("huntWorkflows"),
  settingsVersion: v.number(),
  
  // Change Information
  changedFields: v.array(v.string()),
  previousValues: v.object({}), // Dynamic object with previous values
  newValues: v.object({}), // Dynamic object with new values
  
  // Change Context
  changeReason: v.optional(v.string()),
  changeType: v.union(
    v.literal("user_update"),
    v.literal("system_update"),
    v.literal("migration"),
    v.literal("rollback")
  ),
  
  // User Information
  changedBy: v.id("users"),
  changedAt: v.string(),
  
  // Impact Assessment
  requiresRestart: v.boolean(), // Whether workflow needs restart
  affectedComponents: v.array(v.string()),
})
.index("by_workflow", ["workflowId"])
.index("by_changed_date", ["changedAt"])
```

### huntWorkflowTemplateSettings Table
```typescript
huntWorkflowTemplateSettings: defineTable({
  templateId: v.id("huntWorkflowTemplates"),
  
  // Default Settings for Template
  defaultSettings: v.object({
    autoValidation: v.boolean(),
    qualityThreshold: v.number(),
    maxResults: v.number(),
    searchFrequency: v.string(),
    retryFailedSources: v.boolean(),
    skipDuplicates: v.boolean(),
    respectRobotsTxt: v.boolean(),
    enableDataEnrichment: v.boolean(),
    enableSocialMediaLookup: v.boolean(),
    enableCompanyLookup: v.boolean(),
    enableContactLookup: v.boolean(),
    defaultExportFormat: v.string(),
    autoExportOnCompletion: v.boolean(),
    rateLimiting: v.object({
      requestsPerSecond: v.number(),
      requestsPerMinute: v.number(),
      delayBetweenRequests: v.number(),
    }),
  }),
  
  // Template Metadata
  createdBy: v.id("users"),
  createdAt: v.string(),
  lastModified: v.string(),
})
.index("by_template", ["templateId"])
```

## Field Descriptions

### Configuration Settings
- **autoValidation**: Automatically validate results using AI
- **qualityThreshold**: Minimum confidence score to accept results
- **maxResults**: Hard limit on number of results to collect
- **searchFrequency**: Controls speed vs. resource usage

### Search Behavior
- **retryFailedSources**: Retry sources that initially failed
- **skipDuplicates**: Skip businesses already in database
- **respectRobotsTxt**: Honor robots.txt files

### Notification Settings
- **emailNotifications**: Send progress emails to user
- **slackWebhook**: Send notifications to Slack channel
- **notificationEvents**: Which events trigger notifications

### Data Processing
- **enableDataEnrichment**: Use external APIs for additional data
- **enableSocialMediaLookup**: Find social media profiles
- **enableCompanyLookup**: Enhance with company databases
- **enableContactLookup**: Find contact information

### Export Settings
- **defaultExportFormat**: Preferred export format
- **autoExportOnCompletion**: Auto-generate export when done
- **exportDestination**: Where to save exports

### Advanced Settings
- **customHeaders**: HTTP headers for requests
- **proxySettings**: Proxy configuration for scraping
- **rateLimiting**: Control request frequency

## Default Values

### Standard Defaults
```typescript
const DEFAULT_SETTINGS = {
  autoValidation: true,
  qualityThreshold: 70,
  maxResults: 1000,
  searchFrequency: "moderate",
  retryFailedSources: true,
  skipDuplicates: true,
  respectRobotsTxt: true,
  emailNotifications: true,
  notificationEvents: ["completed", "failed"],
  enableDataEnrichment: false,
  enableSocialMediaLookup: true,
  enableCompanyLookup: false,
  enableContactLookup: false,
  defaultExportFormat: "csv",
  autoExportOnCompletion: false,
  rateLimiting: {
    requestsPerSecond: 2,
    requestsPerMinute: 100,
    delayBetweenRequests: 500,
  },
};
```

### Plan-Based Limits
```typescript
const PLAN_LIMITS = {
  free: {
    maxResults: 100,
    maxRequestsPerSecond: 1,
    enableDataEnrichment: false,
    enableCompanyLookup: false,
    enableContactLookup: false,
  },
  pro: {
    maxResults: 2500,
    maxRequestsPerSecond: 5,
    enableDataEnrichment: true,
    enableCompanyLookup: true,
    enableContactLookup: false,
  },
  enterprise: {
    maxResults: -1, // unlimited
    maxRequestsPerSecond: 10,
    enableDataEnrichment: true,
    enableCompanyLookup: true,
    enableContactLookup: true,
  },
};
```

## Validation Rules

### Setting Constraints
- qualityThreshold: 0-100
- maxResults: Plan-dependent limits
- requestsPerSecond: Plan-dependent limits
- delayBetweenRequests: 100-5000ms

### Business Rules
- Settings changes require workflow restart if active
- Some features restricted by user plan
- Rate limiting enforced at system level
- Change log maintained for audit trail

### Data Integrity
- Settings version incremented on each change
- Previous values preserved in change log
- User permissions verified for modifications
- Invalid combinations prevented (e.g., aggressive frequency with high delay)