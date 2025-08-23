# Bulk Processing API Documentation

## Overview

The Bulk Processing API provides comprehensive endpoints for managing large-scale audio-to-RAG processing operations. It supports concurrent processing, real-time progress tracking, and multi-format exports with vector database integration.

## Base URL

```
http://localhost:8000/api/public/bulk
```

## Authentication

All endpoints require API key authentication:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "http://localhost:8000/api/public/bulk/..."
```

## Rate Limiting

- **Bulk Processing**: 20 requests per hour per user
- **Export Requests**: 10 requests per hour per user
- **Status Checks**: 1000 requests per hour per user

Rate limit headers included in responses:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1641024000
```

## Endpoints

### 1. Start Bulk Processing

**POST** `/process`

Initiates bulk processing of audio/video content through the complete audio-to-RAG pipeline.

#### Request Body

```json
{
  "job_id": "bulk-1641024000123",
  "platform": "tiktok",
  "input_method": "channel",
  "channel_url": "https://tiktok.com/@zachking",
  "pasted_urls": ["https://tiktok.com/@user/video/123"],
  "selected_content": ["7516961325537332502", "7516961325537332503"],
  "uploaded_documents": [],
  "embedding_model": {
    "id": "jina-v4",
    "label": "Jina Embedder v4",
    "dimensions": 1024,
    "max_tokens": 8192,
    "jina_v4_task": "retrieval.passage",
    "jina_v4_dimensions": 1024,
    "jina_v4_late_chunking": true,
    "jina_v4_multi_vector": false,
    "jina_v4_optimize_for_rag": true,
    "jina_v4_truncate_at_max": true
  },
  "vector_db": {
    "id": "pinecone",
    "label": "Pinecone"
  },
  "settings": {
    "chunkSize": 1024,
    "chunkOverlap": 100,
    "maxTokens": 8192
  },
  "user_id": "user-123"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | Unique identifier for the processing job |
| `platform` | string | Yes | Content platform: `tiktok`, `youtube`, `twitch`, `documents` |
| `input_method` | string | Yes | Input method: `channel`, `urls`, `upload` |
| `selected_content` | array | Yes | List of content IDs to process |
| `embedding_model` | object | Yes | Embedding model configuration |
| `vector_db` | object | Yes | Vector database selection |
| `settings` | object | Yes | Processing settings |

#### Embedding Model Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | string | - | Model ID: `jina-v4`, `gemini-exp` |
| `jina_v4_task` | string | `retrieval.passage` | Jina V4 task type for transcripts |
| `jina_v4_dimensions` | integer | 1024 | Embedding dimensions (128-2048) |
| `jina_v4_late_chunking` | boolean | true | Enable late chunking for long transcripts |
| `jina_v4_multi_vector` | boolean | false | Multi-vector embeddings |
| `jina_v4_optimize_for_rag` | boolean | true | Optimize for RAG systems |

#### Response

```json
{
  "success": true,
  "job_id": "bulk-1641024000123",
  "message": "Bulk processing started successfully",
  "websocket_url": "ws://localhost:8000/api/public/bulk/ws/bulk-processing/bulk-1641024000123",
  "estimated_time": "10 minutes"
}
```

#### Status Codes

- `200 OK`: Processing started successfully
- `400 Bad Request`: Invalid request parameters
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Processing failed to start

### 2. Get Job Status

**GET** `/job/{job_id}/status`

Retrieves the current status and progress of a processing job.

#### Response

```json
{
  "job_id": "bulk-1641024000123",
  "status": "processing",
  "progress": 67.5,
  "stage": "Processing item 3/5",
  "content_processed": 3,
  "total_content": 5,
  "embeddings": 1024,
  "error": null,
  "result": null
}
```

#### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Job queued for processing |
| `initializing` | Setting up processing environment |
| `processing` | Active processing in progress |
| `completed` | Processing finished successfully |
| `failed` | Processing failed with errors |
| `cancelled` | Job cancelled by user |

### 3. Export Results

**POST** `/export`

Initiates export of processing results in specified format.

#### Request Body

```json
{
  "job_id": "bulk-1641024000123",
  "format": "json",
  "export_id": "export-1641024000456"
}
```

#### Export Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| `json` | Human-readable JSON | Development, debugging |
| `csv` | Comma-separated values | Spreadsheet analysis |
| `parquet` | Columnar storage format | Analytics, ChromaDB |
| `vector` | Vector database format | Direct database import |

#### Response

```json
{
  "success": true,
  "export_id": "export-1641024000456",
  "message": "Export started successfully",
  "status_url": "/api/public/bulk/export/export-1641024000456/status"
}
```

### 4. Get Export Status

**GET** `/export/{export_id}/status`

Checks the status of an export operation.

#### Response

```json
{
  "export_id": "export-1641024000456",
  "status": "completed",
  "progress": 100,
  "download_url": "/api/public/bulk/download/export-1641024000456",
  "filename": "bulk-embeddings-20250105.json",
  "file_size": 5242880,
  "error": null
}
```

### 5. Download Export

**GET** `/download/{export_id}`

Downloads the exported file.

#### Response

Returns the file with appropriate headers:

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="bulk-embeddings-20250105.json"
Content-Length: 5242880
```

### 6. WebSocket Progress Updates

**WebSocket** `/ws/bulk-processing/{job_id}`

Provides real-time progress updates during processing.

#### Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/api/public/bulk/ws/bulk-processing/bulk-1641024000123');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Progress update:', data);
};
```

#### Message Types

##### Progress Update
```json
{
  "type": "progress",
  "job_id": "bulk-1641024000123",
  "progress": 45.5,
  "stage": "Processing item 2/5",
  "contentProcessed": 2,
  "embeddings": 512,
  "status": "processing"
}
```

##### Completion
```json
{
  "type": "completed",
  "job_id": "bulk-1641024000123",
  "progress": 100,
  "stage": "Processing completed successfully!",
  "result": {
    "total_items": 5,
    "completed_items": 5,
    "failed_items": 0,
    "processing_time": 125.6
  }
}
```

##### Error
```json
{
  "type": "error",
  "job_id": "bulk-1641024000123",
  "message": "Processing failed: API quota exceeded"
}
```

### 7. Cleanup Development Jobs

**DELETE** `/cleanup`

Removes old completed/failed jobs (development endpoint).

#### Response

```json
{
  "success": true,
  "deleted_count": 15
}
```

## Client SDK Examples

### JavaScript/TypeScript

```typescript
class BulkProcessingClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async startProcessing(config: BulkProcessingConfig): Promise<JobResponse> {
    const response = await fetch(`${this.baseUrl}/api/public/bulk/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  connectToProgress(jobId: string, onUpdate: (data: any) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8000/api/public/bulk/ws/bulk-processing/${jobId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    return ws;
  }

  async exportResults(jobId: string, format: string): Promise<ExportResponse> {
    const response = await fetch(`${this.baseUrl}/api/public/bulk/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId,
        format: format,
        export_id: `export-${Date.now()}`
      }),
    });

    return response.json();
  }
}
```

### Python

```python
import asyncio
import aiohttp
import websockets
import json

class BulkProcessingClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    async def start_processing(self, config: dict) -> dict:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{self.base_url}/api/public/bulk/process',
                headers=self.headers,
                json=config
            ) as response:
                return await response.json()

    async def monitor_progress(self, job_id: str, on_update=None):
        uri = f"ws://localhost:8000/api/public/bulk/ws/bulk-processing/{job_id}"
        
        async with websockets.connect(uri) as websocket:
            async for message in websocket:
                data = json.loads(message)
                if on_update:
                    on_update(data)
                
                if data.get('type') in ['completed', 'error']:
                    break

    async def export_results(self, job_id: str, format: str) -> dict:
        export_config = {
            'job_id': job_id,
            'format': format,
            'export_id': f'export-{int(time.time())}'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{self.base_url}/api/public/bulk/export',
                headers=self.headers,
                json=export_config
            ) as response:
                return await response.json()
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid embedding model configuration",
  "details": {
    "field": "embedding_model.dimensions",
    "issue": "Must be between 128 and 2048"
  }
}
```

#### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again in 45 minutes.",
  "retry_after": 2700
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "processing_error",
  "message": "Failed to start bulk processing",
  "request_id": "req-abc123"
}
```

### Retry Logic

Implement exponential backoff for transient errors:

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Performance Considerations

### Optimal Request Patterns

1. **Batch Size**: Process 5-25 items per job for optimal performance
2. **Concurrent Jobs**: Limit to 2-3 concurrent jobs per user
3. **WebSocket Management**: Close connections when not needed
4. **Export Timing**: Wait for processing completion before exporting

### Monitoring Integration

```javascript
// Track processing metrics
const metrics = {
  totalJobs: 0,
  successfulJobs: 0,
  failedJobs: 0,
  averageProcessingTime: 0,
  totalItemsProcessed: 0
};

function updateMetrics(jobResult) {
  metrics.totalJobs++;
  if (jobResult.status === 'completed') {
    metrics.successfulJobs++;
    metrics.totalItemsProcessed += jobResult.completed_items;
  } else {
    metrics.failedJobs++;
  }
}
```

## Security Best Practices

1. **API Key Management**: Store keys securely, rotate regularly
2. **Input Validation**: Validate all user inputs on client and server
3. **Rate Limiting**: Respect rate limits to avoid blocking
4. **Error Logging**: Log errors without exposing sensitive data
5. **File Cleanup**: Download and delete export files promptly

This API provides a robust interface for large-scale audio-to-RAG processing with comprehensive monitoring, error handling, and export capabilities.