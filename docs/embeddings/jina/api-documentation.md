# Jina Embeddings API Documentation

## API Endpoint

**Base URL**: `https://api.jina.ai/v1/embeddings`

## Purpose

Convert text and images to fixed-length vectors for semantic search, similarity matching, clustering, and other vector-based applications.

## Authentication

- **Method**: Bearer Token
- **Header**: `Authorization: Bearer YOUR_API_KEY`
- **Get API Key**: https://jina.ai/?sui=apikey

## Available Models

### Text Embeddings
- **jina-embeddings-v3**: 570M parameters, 1024 dimensions, 8192 max tokens
- **jina-embeddings-v2**: Previous generation model

### Multimodal Embeddings
- **jina-clip-v2**: 885M parameters, 1024 dimensions, supports text and images
- **jina-clip-v1**: Previous generation multimodal model

## Request Format

### Basic Request Structure
```json
{
    "model": "jina-embeddings-v3",
    "input": ["Your text here", "Another text"],
    "encoding_type": "float"
}
```

### Request Parameters

#### Required Parameters
- **model** (string): Model identifier (e.g., "jina-embeddings-v3", "jina-clip-v2")
- **input** (array): Array of strings (text) or objects (images) to embed
  - Text: Plain strings
  - Images: Objects with `url` or `bytes` (base64 encoded)

#### Optional Parameters
- **embedding_type** (string): Output format
  - `float` (default): Standard floating-point numbers
  - `base64`: Base64 encoded for efficient transmission
  - `binary`: Binary format for faster retrieval
  
- **task** (string): Optimize embeddings for specific tasks
  - `retrieval.query`: For search queries
  - `retrieval.passage`: For document passages
  - `text-matching`: For similarity comparison
  - `classification`: For categorization tasks
  - `separation`: For clustering

- **dimensions** (integer): Truncate embedding size (32-1024)
  - Uses Matryoshka representation learning
  - Smaller dimensions = faster search, less storage
  
- **normalized** (boolean): Normalize to unit L2 norm
  - Default: `false`
  - Set to `true` for cosine similarity

## Example Requests

### Text Embedding
```bash
curl https://api.jina.ai/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "jina-embeddings-v3",
    "input": ["Hello world", "How are you?"],
    "normalized": true
  }'
```

### Image Embedding with URL
```json
{
    "model": "jina-clip-v2",
    "input": [{
        "url": "https://example.com/image.jpg"
    }]
}
```

### Image Embedding with Base64
```json
{
    "model": "jina-clip-v2",
    "input": [{
        "bytes": "iVBORw0KGgoAAAANS..."
    }]
}
```

### Mixed Text and Image
```json
{
    "model": "jina-clip-v2",
    "input": [
        "A beautiful sunset",
        {"url": "https://example.com/sunset.jpg"}
    ]
}
```

## Response Format

### Success Response
```json
{
    "object": "list",
    "data": [
        {
            "object": "embedding",
            "index": 0,
            "embedding": [0.1, 0.2, 0.3, ...]
        },
        {
            "object": "embedding", 
            "index": 1,
            "embedding": [0.4, 0.5, 0.6, ...]
        }
    ],
    "model": "jina-embeddings-v3",
    "usage": {
        "prompt_tokens": 10,
        "total_tokens": 10
    }
}
```

### Error Response
```json
{
    "error": {
        "message": "Invalid API key",
        "type": "invalid_request_error",
        "code": "invalid_api_key"
    }
}
```

## Rate Limits

| Tier | Requests/Minute | Tokens/Minute |
|------|----------------|---------------|
| Free | N/A | N/A |
| Standard | 500 RPM | 1,000,000 TPM |
| Premium | 2,000 RPM | 5,000,000 TPM |

## Token Calculation

### Text
- Standard tokenization (approximately 1 token per 4 characters)
- Maximum 8192 tokens per input for jina-embeddings-v3

### Images
- **jina-clip-v2**: 4000 tokens per 512x512 tile
- **jina-clip-v1**: 1000 tokens per 224x224 tile
- Larger images are tiled and charged accordingly

## Best Practices

1. **Batch Processing**: Send multiple inputs in a single request (up to 2048)
2. **Error Handling**: Implement retry logic for network failures
3. **Input Validation**: Check text length and image format before sending
4. **Dimension Selection**: Use smaller dimensions for faster search when full precision isn't needed
5. **Normalization**: Enable for cosine similarity comparisons

## Integration Examples

### Python
```python
import requests

response = requests.post(
    'https://api.jina.ai/v1/embeddings',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'jina-embeddings-v3',
        'input': ['Hello world'],
        'normalized': True
    }
)

embeddings = response.json()['data'][0]['embedding']
```

### Node.js
```javascript
const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: ['Hello world'],
        normalized: true
    })
});

const data = await response.json();
const embeddings = data.data[0].embedding;
```

## OpenAI Compatibility

The API is designed to be compatible with OpenAI's embedding API format, allowing easy migration:
- Same endpoint structure (`/v1/embeddings`)
- Compatible request/response format
- Drop-in replacement for `text-embedding-3-large`