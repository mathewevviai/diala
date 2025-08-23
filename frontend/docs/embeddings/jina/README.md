# Jina Embeddings Documentation

This directory contains comprehensive documentation about Jina AI's embedding models and APIs.

## Contents

### Core Documentation
- **[overview.md](./overview.md)** - Complete overview of Jina Embeddings API, features, and capabilities
- **[api-documentation.md](./api-documentation.md)** - Detailed API reference with examples and integration guides
- **[related_urls.json](./related_urls.json)** - Collection of embedding-related URLs and resources

### Research Papers
- **[jina-embeddings-v3-paper.md](./jina-embeddings-v3-paper.md)** - Technical details about the v3 multilingual embeddings model with Task LoRA
- **[jina-clip-v2-paper.md](./jina-clip-v2-paper.md)** - Information about the multimodal CLIP v2 model for text and images
- **[late-chunking-paper.md](./late-chunking-paper.md)** - Novel technique for preserving context in chunked embeddings

## Quick Links

### Models
- **jina-embeddings-v3**: 570M parameters, 89 languages, 8192 tokens
- **jina-clip-v2**: 885M parameters, multimodal (text + images), 89 languages

### API
- **Endpoint**: https://api.jina.ai/v1/embeddings
- **Documentation**: https://docs.jina.ai/
- **Get API Key**: https://jina.ai/?sui=apikey

### Research Papers
- jina-embeddings-v3: https://arxiv.org/abs/2409.10173
- jina-clip-v2: https://arxiv.org/abs/2412.08802
- Late Chunking: https://arxiv.org/abs/2409.04701

### Cloud Providers
- AWS: https://aws.amazon.com/marketplace/seller-profile?id=seller-stch2ludm6vgy
- Azure: https://azuremarketplace.microsoft.com/en-US/marketplace/apps?page=1&search=jina
- Google Cloud: https://console.cloud.google.com/marketplace/browse?q=jina

## Key Features

1. **Multilingual Support**: 89 languages with optimized performance
2. **Long Context**: Up to 8192 tokens for comprehensive document processing
3. **Multimodal**: Text and image embeddings in a single model (jina-clip-v2)
4. **Flexible Dimensions**: Matryoshka learning allows 1024 → 32 dimension reduction
5. **State-of-the-art Performance**: Outperforms OpenAI and Cohere on benchmarks

## Integration

The API is compatible with OpenAI's embedding format, making migration simple:
```python
# Just change the endpoint and model name
endpoint = "https://api.jina.ai/v1/embeddings"
model = "jina-embeddings-v3"
```

## Rate Limits

| Tier | RPM | TPM |
|------|-----|-----|
| Standard | 500 | 1M |
| Premium | 2,000 | 5M |

## Support

- Hugging Face: https://huggingface.co/jinaai
- API Status: https://status.jina.ai/
- Contact Sales: https://jina.ai/contact-sales