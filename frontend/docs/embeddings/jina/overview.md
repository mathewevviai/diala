# Jina Embeddings API Overview

## Embedding API

Top-performing multimodal multilingual long-context embeddings for search, RAG, agents applications.

### Overview

Jina Embeddings offers world-class embedding models to improve your search and RAG systems. The service provides top-performing multimodal multilingual embeddings with support for:

- **Text embeddings**: Supporting 89 languages with up to 8192 token-length
- **Image embeddings**: Through jina-clip models for multimodal search
- **Long-context support**: Process documents up to 8192 tokens
- **Matryoshka representations**: Truncate embeddings from 1024 down to 32 dimensions without sacrificing performance

### Key Models

#### jina-embeddings-v3
- **Parameters**: 570M
- **Token Length**: 8192
- **Languages**: 89 (with top 30 optimized)
- **Features**: Outperforms OpenAI and Cohere embeddings on MTEB benchmarks
- **Dimensions**: Default 1024, can be truncated to 32

#### jina-clip-v2
- **Type**: CLIP-style multimodal model
- **Parameters**: 0.9B
- **Image Resolution**: 512x512
- **Languages**: 89
- **Features**: Multilingual support, high image resolution, Matryoshka representation learning

### API Endpoint
```
https://api.jina.ai/v1/embeddings
```

### Rate Limits
- **Without API Key**: Not available
- **With API Key**: 500 RPM & 1,000,000 TPM
- **With Premium API Key**: 2,000 RPM & 5,000,000 TPM

### Token Calculation
- **Text**: Standard token counting
- **Images**: 
  - jina-clip-v2: 4000 tokens per 512x512 tile
  - jina-clip-v1: 1000 tokens per 224x224 tile

### Request Format
```bash
curl https://api.jina.ai/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "normalized": true,
    "embedding_type": "float",
    "input": [
        "Your text here",
        "Multiple texts supported"
    ]
  }'
```

### Features
- **L2 Normalization**: Scales embeddings to unit norm
- **Multiple output formats**: float, binary, base64
- **Batch processing**: Up to 2048 texts per request
- **Compatible with OpenAI API**: Drop-in replacement for text-embedding-3-large

### Deployment Options
1. **Jina Search Foundation API**: Easiest option with pay-as-you-go tokens
2. **Cloud Service Providers**: AWS SageMaker, Microsoft Azure, Google Cloud
3. **Commercial License**: For on-premises deployment

### Integrations
Native integration with various vector databases and frameworks:
- **Vector Stores**: MongoDB, Qdrant, Pinecone, Chroma, Weaviate, Milvus
- **LLMOps**: LlamaIndex, Haystack, Langchain, Dify
- **RAG Frameworks**: Multiple supported platforms

### Pricing
- Free trial with 10 million tokens
- Pay-as-you-go model based on token usage
- Auto-recharge available for uninterrupted service

### Research Publications
- jina-embeddings-v3: Multilingual Embeddings With Task LoRA (ICLR 2025)
- jina-clip-v2: Multilingual Multimodal Embeddings for Text and Images (ICLR 2025)
- Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models
- Multiple papers at EMNLP, SIGIR, ICLR, NeurIPS, and ICML

### Key Advantages
1. **Multilingual Support**: 89 languages with optimized performance
2. **Long Context**: 8192 token support for comprehensive document analysis
3. **Multimodal**: Text and image embeddings in a single model
4. **Performance**: Outperforms proprietary models from OpenAI and Cohere
5. **Flexibility**: Multiple deployment options and output formats
6. **Integration**: Works with major vector databases and AI frameworks