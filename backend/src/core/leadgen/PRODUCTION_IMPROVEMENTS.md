# Production Improvements for Hunter Search

## Overview
This document describes the production-ready improvements made to the hunter search system to handle concurrent users, rate limiting, and provide accurate progress reporting.

## Key Improvements

### 1. Rate Limiting
- **Token Bucket Algorithm**: Implements a sliding window rate limiter
- **Distributed Rate Limiting**: Uses Redis when available for multi-instance deployments
- **Per-User Limits**: Can limit by user ID, IP address, or globally
- **Configurable**: 10 requests per 60-second window (adjustable)

```python
# Check rate limit before making API calls
if not wait_for_rate_limit(user_id, max_wait=10):
    return {"error": "Rate limit exceeded"}
```

### 2. Concurrent Request Management
- **Semaphore Control**: Limits to 3 concurrent Jina API requests
- **Request Queuing**: Automatically queues requests when limit is reached
- **Thread-Safe**: All operations are thread-safe for concurrent users

### 3. Retry Logic with Exponential Backoff
- **Automatic Retries**: 3 retries with exponential backoff (1.5x factor)
- **Smart Handling**: Different strategies for 429 (rate limit) vs connection errors
- **Circuit Breaker**: Prevents cascading failures

### 4. Enhanced Progress Reporting
Progress is now calculated accurately across:
- Multiple queries per search
- Multiple pages per query
- Query formatting time
- Actual results found

Example progress callback data:
```json
{
    "message": "Query 3/5, page 2",
    "progress": 45,
    "stats": {
        "api_calls": 12,
        "cache_hits": 3,
        "cache_misses": 2,
        "total_results": 67,
        "cache_hit_rate": 0.6,
        "error_rate": 0.0
    }
}
```

### 5. Performance Metrics
Real-time tracking of:
- API calls made
- Cache hit/miss ratio
- Format and search errors
- Total results found
- Error rates

### 6. Debug Enhancements
- **Query Formatting**: Saved in debug logs with timestamps
- **Performance Data**: Metrics included in all debug outputs
- **Request/Response**: Full API interactions logged in DEBUG mode

## Configuration

### Environment Variables
```bash
# Required
JINA_API_KEY=your_jina_key
DEEPSEEK_API_KEY=your_deepseek_key  # or OPENAI_API_KEY

# Optional
REDIS_URL=redis://localhost:6379
DEBUG_SEARCH=true
```

### Rate Limit Configuration
```python
# In phase1_search.py
RATE_LIMIT_REQUESTS = 10  # requests per window
RATE_LIMIT_WINDOW = 60    # seconds
MAX_CONCURRENT_REQUESTS = 3
```

## Usage Example

```python
from src.core.leadgen import phase1_search

# Define progress callback
def my_progress_callback(update):
    print(f"Progress: {update['progress']}% - {update['message']}")
    print(f"Stats: {update['stats']}")

# Run search with progress tracking
results = phase1_search.run(
    custom_queries=["roofing contractors Belfast"],
    user_id="user_123",  # For per-user rate limiting
    progress_callback=my_progress_callback
)
```

## Performance Characteristics

### Without Query Formatting
- Single query: ~10 results
- Limited relevance
- Fast but incomplete

### With Query Formatting
- 3-5 queries generated per search
- 30-50 results typical
- Much better relevance
- Slightly slower but comprehensive

### Concurrent Performance
- Handles 10+ concurrent users
- Redis enables horizontal scaling
- Graceful degradation without Redis

## Monitoring

The system provides several monitoring points:

1. **Logs**: Structured logging with search context
2. **Metrics**: Real-time performance statistics
3. **Debug Files**: Detailed request/response data
4. **Progress Callbacks**: Live updates for UI

## Error Handling

### Rate Limit Exceeded
- Waits up to 10 seconds for rate limit window
- Returns empty results if timeout
- Logs incident with user ID

### API Errors
- Automatic retry with backoff
- Falls back to cached results when possible
- Clear error messages in logs

### Network Issues
- Connection pooling for efficiency
- Timeout handling (30s default)
- Graceful degradation

## Best Practices

1. **Always provide user_id** for better rate limiting
2. **Implement progress callbacks** for UI updates
3. **Monitor cache hit rates** - should be >50% in production
4. **Use Redis** for multi-instance deployments
5. **Set appropriate timeouts** based on your needs

## Testing

```bash
# Test query formatting
python test_query_formatting.py

# Test improved search with metrics
python test_improved_search.py

# Load test with concurrent requests
python test_concurrent_search.py
```