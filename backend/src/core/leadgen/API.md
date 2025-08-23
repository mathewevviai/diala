# Hunter LeadGen API Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Processing Phases](#processing-phases)
5. [Data Models](#data-models)
6. [Integration Points](#integration-points)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Data Retention & Cleanup](#data-retention--cleanup)
9. [Configuration](#configuration)

## System Overview

The Hunter LeadGen API is a sophisticated lead generation system that searches, validates, and enriches business leads through a multi-phase processing pipeline. It integrates with Convex for real-time updates and data persistence, uses Jina Reader for content extraction, and supports user-defined validation criteria.

### Key Features
- **Generic Validation**: User-defined criteria instead of hardcoded rules
- **Multi-source Search**: Web scraping, databases, and directories
- **Contact Enrichment**: Email, phone, and social media extraction
- **Real-time Progress**: WebSocket-style updates via Convex
- **Checkpoint Recovery**: Resume failed searches from last successful phase
- **Tiered Data Retention**: 7-day retention for free tier, unlimited for paid

## Architecture

```
Frontend (Next.js) 
    ↓
Convex Actions (Rate Limiting & Auth)
    ↓
Backend API (FastAPI)
    ↓
LeadGen Pipeline (6 Phases)
    ↓
Convex Database (Results Storage)
```

### Data Flow
1. User submits search criteria via frontend
2. Convex validates rate limits and creates search record
3. Backend API receives request and starts async processing
4. Each phase processes data and saves checkpoints
5. Results are sent back to Convex for permanent storage
6. Frontend polls for updates and displays results

## API Endpoints

### POST `/api/public/hunter/search`
Initiates a new lead generation search.

**Request Body:**
```json
{
  "search_id": "search_123456",
  "user_id": "user123",
  "search_config": {
    "searchName": "Tech Startups in SF",
    "searchObjective": "Find tech startup leads for partnership",
    "selectedSources": ["web", "database"],
    "industry": "Technology",
    "location": "San Francisco, CA",
    "companySize": "1-50",
    "jobTitles": ["CEO", "CTO"],
    "keywords": "AI, machine learning",
    "includeEmails": true,
    "includePhones": true,
    "includeLinkedIn": false,
    "validationCriteria": {
      "mustHaveWebsite": true,
      "mustHaveContactInfo": true,
      "mustHaveSpecificKeywords": ["API", "integration", "partner"],
      "mustBeInIndustry": true,
      "customValidationRules": "Must offer enterprise solutions"
    }
  }
}
```

**Response:**
```json
{
  "status": "processing",
  "search_id": "search_123456",
  "message": "Lead search processing started",
  "progress": 0
}
```

### GET `/api/public/hunter/search/{search_id}`
Gets the current status of a lead generation search.

**Response:**
```json
{
  "search_id": "search_123456",
  "status": "processing",
  "progress": 75,
  "current_stage": "Phase 5: Validating leads against criteria...",
  "total_leads": null,
  "error": null
}
```

### GET `/api/public/hunter/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Hunter LeadGen API",
  "timestamp": "2024-01-20T10:30:00Z",
  "jina_configured": true,
  "convex_url": "http://127.0.0.1:3210"
}
```

### POST `/api/public/hunter/webhook`
Internal webhook for external service updates.

## Processing Phases

### Phase 1: Search Query Generation
- **Module**: `phase1_search.py`
- **Function**: Generates dynamic search queries based on user criteria
- **Input**: Search configuration with validation criteria
- **Output**: List of search results with URLs and metadata
- **Checkpoint**: `data/checkpoints/{search_id}/phase_1_checkpoint.json`

### Phase 2: Link Extraction
- **Module**: `phase2_extract_links.py`
- **Function**: Extracts and deduplicates URLs from search results
- **Input**: Search results from Phase 1
- **Output**: Structured list of unique URLs with metadata
- **Checkpoint**: Saved in temporary JSON files

### Phase 3: Content Extraction
- **Module**: `phase3_extract_content.py`
- **Function**: Uses Jina Reader API to extract content from URLs
- **Input**: List of URLs from Phase 2
- **Output**: Extracted content with text, metadata, and structure
- **Features**:
  - Batch processing (3 URLs at a time)
  - Rate limiting protection
  - Retry logic for failed extractions

### Phase 4: Data Combination
- **Module**: `phase4_save_content.py`
- **Function**: Combines extracted content with metadata
- **Input**: Content from Phase 3 and links from Phase 2
- **Output**: Combined data structure ready for validation
- **Storage**: `data/combined_data.json`

### Phase 5: Generic Validation
- **Module**: `phase5_validate.py`
- **Function**: Validates leads against user-defined criteria
- **Input**: Combined data and validation criteria
- **Output**: Validated leads with scores and check results
- **Validation Checks**:
  - Website availability
  - Contact information presence
  - Keyword matching
  - Industry relevance
  - Custom rule evaluation
  - AI-powered validation (if DeepSeek API available)

### Phase 6: Report Generation
- **Module**: `phase6_create_final_report.py`
- **Function**: Creates final lead list with contact extraction
- **Input**: Validated data from Phase 5
- **Output**: Final leads with extracted contacts
- **Features**:
  - Email extraction with regex
  - Phone number extraction (multiple formats)
  - Social media profile extraction
  - Metadata enrichment

## Data Models

### LeadSearchRequest
```python
class LeadSearchRequest(BaseModel):
    search_id: str
    user_id: str
    search_config: Dict[str, Any]
```

### SearchConfig Structure
```python
{
    "searchName": str,
    "searchObjective": str,
    "selectedSources": List[str],  # ["web", "database", "directory"]
    "industry": str,
    "location": str,
    "companySize": Optional[str],
    "jobTitles": List[str],
    "keywords": Optional[str],
    "includeEmails": bool,
    "includePhones": bool,
    "includeLinkedIn": bool,
    "validationCriteria": {
        "mustHaveWebsite": bool,
        "mustHaveContactInfo": bool,
        "mustHaveSpecificKeywords": List[str],
        "mustBeInIndustry": bool,
        "customValidationRules": str
    }
}
```

### Lead Result Structure
```python
{
    "leadId": str,
    "name": Optional[str],
    "email": Optional[str],
    "phone": Optional[str],
    "linkedInUrl": Optional[str],
    "websiteUrl": Optional[str],
    "companyName": Optional[str],
    "companySize": Optional[str],
    "industry": Optional[str],
    "location": Optional[str],
    "jobTitle": Optional[str],
    "emailVerified": bool,
    "phoneVerified": bool,
    "confidence": float,  # 0-1
    "dataSource": str
}
```

## Integration Points

### Convex Integration
- **Client**: `ConvexClient` initialized with `NEXT_PUBLIC_CONVEX_URL`
- **Mutations**:
  - `hunterMutations:updateSearchProgress`: Progress updates
  - `hunterMutations:updateSearchStatus`: Status changes
  - `hunterMutations:updateSearchResults`: Final results
  - `hunterMutations:storeLeadResults`: Lead storage
- **Queries**:
  - `hunterQueries:getLeadSearch`: Search status retrieval

### Jina Reader API
- **Endpoint**: `https://r.jina.ai/{url}`
- **Authentication**: Bearer token via `JINA_API_KEY`
- **Headers**:
  - `X-Return-Format: markdown`
  - `X-With-Generated-Alt: true`
- **Rate Limiting**: 3 URLs per batch, 2-second delay between batches

### External Services
- **DeepSeek AI**: Optional AI validation (if API key configured)
- **Query Builder**: Dynamic search query generation

## Error Handling & Recovery

### Checkpoint System
```python
def save_phase_checkpoint(search_id: str, phase: int, data: Dict[str, Any]):
    """Save checkpoint for phase recovery"""
    checkpoint_dir = f"data/checkpoints/{search_id}"
    checkpoint_file = f"phase_{phase}_checkpoint.json"
    # Saves phase data with timestamp

def load_phase_checkpoint(search_id: str, phase: int) -> Optional[Dict[str, Any]]:
    """Load checkpoint if exists"""
    # Returns checkpoint data or None
```

### Error Recovery Flow
1. Phase fails → Exception caught
2. Checkpoint saved (if partial progress)
3. Error logged and sent to Convex
4. Temporary files moved to error directory
5. Search marked as failed with error details
6. On retry: Resume from last checkpoint

### Cleanup on Error
```python
cleanup_temp_files(search_id, keep_on_error=True)
# Moves files to data/errors/{search_id}/ for debugging
```

## Data Retention & Cleanup

### Temporary File Management
```python
def cleanup_temp_files(search_id: str, keep_on_error: bool = False):
    """Clean up temporary JSON files after processing"""
    temp_files = [
        "data/search_results.json",
        "data/extracted_links.json",
        "data/website_contents.json",
        "data/extracted_content.json",
        "data/combined_data.json",
        "data/validated_data.json",
        "data/final_results.json",
        "data/valid_leads_simplified.json"
    ]
    # Removes or moves files based on success/error
```

### Data Retention Policy
- **Free Tier**: 7-day retention (auto-cleanup via Convex cron)
- **Premium/Enterprise**: Unlimited retention
- **Implementation**: `expiresAt` field in Convex schema

### Scheduled Cleanup (Convex)
```typescript
// Daily at 2 AM UTC
cleanupExpiredSearches()
// Removes searches where expiresAt < now

// Daily at midnight UTC
resetDailyUsage()
// Resets searchesToday counter

// Monthly on 1st
resetMonthlyUsage()
// Resets leadsThisMonth counter
```

## Configuration

### Environment Variables
```bash
# Backend (.env)
DEEPSEEK_API_KEY=your_key          # Optional: AI validation
JINA_API_KEY=your_key              # Required: Content extraction
NEXT_PUBLIC_CONVEX_URL=url         # Convex endpoint

# Frontend (.env.local)
NEXT_PUBLIC_CONVEX_URL=url         # Convex endpoint
JINA_API_KEY=your_key              # Jina Reader API
```

### Directory Structure
```
data/
├── checkpoints/           # Phase checkpoints
│   └── {search_id}/
│       └── phase_X_checkpoint.json
├── errors/               # Failed search data
│   └── {search_id}/
│       ├── *.json       # Moved temp files
│       └── checkpoints/ # Moved checkpoints
└── *.json               # Temporary processing files
```

### Rate Limits by Tier
```javascript
const tierLimits = {
  free: { 
    searchesPerDay: 5, 
    leadsPerSearch: 50, 
    totalLeadsPerMonth: 250,
    dataRetentionDays: 7
  },
  premium: { 
    searchesPerDay: 100, 
    leadsPerSearch: 500, 
    totalLeadsPerMonth: 50000,
    dataRetentionDays: -1  // Unlimited
  },
  enterprise: { 
    searchesPerDay: -1,    // Unlimited
    leadsPerSearch: -1, 
    totalLeadsPerMonth: -1,
    dataRetentionDays: -1
  }
};
```

## Best Practices

1. **Always Include Validation Criteria**: Phase 5 requires user-defined criteria
2. **Monitor Checkpoints**: Use for debugging failed searches
3. **Handle Rate Limits**: Implement exponential backoff for external APIs
4. **Clean Up Resources**: Temporary files are auto-cleaned on success
5. **Use Appropriate Batch Sizes**: 3 URLs per Jina batch, 100 leads per Convex batch
6. **Log Extensively**: All phases log progress for debugging
7. **Test Error Scenarios**: Checkpoints enable graceful recovery

## Troubleshooting

### Common Issues

1. **"No validation criteria provided"**
   - Ensure `validationCriteria` is included in search config
   - Check that criteria object has required fields

2. **Jina Reader Timeouts**
   - Reduce batch size
   - Check API key validity
   - Implement retry logic

3. **Convex Connection Errors**
   - Verify `NEXT_PUBLIC_CONVEX_URL`
   - Check network connectivity
   - Ensure Convex dev server is running

4. **Phase Failures**
   - Check `data/errors/{search_id}/` for debug info
   - Review checkpoint files for last successful state
   - Check logs for specific error messages

5. **Missing Results**
   - Verify all phases completed (check progress)
   - Ensure leads passed validation criteria
   - Check if data retention expired (free tier)