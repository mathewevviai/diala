# Jina Models Comparison Guide

## Text Embedding Models

### jina-embeddings-v3 vs jina-embeddings-v2

| Feature | v3 | v2 | 
|---------|----|----|
| Parameters | 570M | 137M |
| Max Tokens | 8192 | 8192 |
| Languages | 89 | 30+ |
| Dimensions | 1024 (reducible to 32) | 768 |
| Task LoRA | ✅ Yes | ❌ No |
| Matryoshka | ✅ Yes | ❌ No |
| Performance | Best on MTEB | Good |
| Use Case | Production recommended | Legacy |

### Key Advantages of v3
- **Task-Specific Optimization**: LoRA adapters for different use cases
- **Flexible Dimensions**: Reduce from 1024 to 32 without retraining
- **Superior Multilingual**: Better performance across all 89 languages
- **Benchmark Leader**: Outperforms OpenAI and Cohere

## Multimodal Models

### jina-clip-v2 vs jina-clip-v1

| Feature | v2 | v1 |
|---------|----|----|
| Parameters | 885M | 865M |
| Image Resolution | 512×512 | 224×224 |
| Languages | 89 | 50+ |
| Text Performance | Excellent | Good for multimodal |
| Dimensions | 1024 | 768 |
| Matryoshka | ✅ Yes | ❌ No |
| Token Cost/Image | 4000 per tile | 1000 per tile |

### Key Advantages of v2
- **Higher Resolution**: 2.3x more pixels for better image understanding
- **Text Retrieval**: Works well for text-only tasks (unlike original CLIP)
- **More Languages**: Expanded from 50+ to 89 languages
- **Better Performance**: 3% improvement in retrieval tasks

## Model Selection Guide

### Choose jina-embeddings-v3 when:
- Working with text only
- Need maximum performance
- Require specific task optimization
- Working with long documents (up to 8192 tokens)
- Need flexible embedding dimensions

### Choose jina-clip-v2 when:
- Need both text and image embeddings
- Building multimodal search
- Want unified embeddings for mixed content
- Need cross-modal retrieval (text→image, image→text)

## Performance Benchmarks

### MTEB (Massive Text Embedding Benchmark)

**jina-embeddings-v3 Rankings:**
- #1 among models <1B parameters
- Outperforms OpenAI text-embedding-3-large
- Superior to Cohere embed-v3

### Multilingual Performance

**Top 30 Languages (Optimized):**
Arabic, Bengali, Chinese, Danish, Dutch, English, Finnish, French, Georgian, German, Greek, Hindi, Indonesian, Italian, Japanese, Korean, Latvian, Norwegian, Polish, Portuguese, Romanian, Russian, Slovak, Spanish, Swedish, Thai, Turkish, Ukrainian, Urdu, Vietnamese

### Retrieval Tasks

| Model | Text-Text | Text-Image | Image-Text | Image-Image |
|-------|-----------|------------|------------|-------------|
| jina-clip-v2 | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Excellent |
| jina-clip-v1 | ⚠️ Limited | ✅ Good | ✅ Good | ✅ Good |
| jina-embeddings-v3 | ✅ Best | ❌ N/A | ❌ N/A | ❌ N/A |

## Technical Specifications

### API Compatibility
- **OpenAI Compatible**: Drop-in replacement for text-embedding-3-large
- **Unified Interface**: Same API for all models
- **Batch Processing**: Up to 2048 inputs per request

### Deployment Options

| Option | Best For | Models Available |
|--------|----------|------------------|
| Jina API | Quick start, managed service | All |
| Hugging Face | Self-hosted, custom deployment | All |
| AWS SageMaker | AWS infrastructure | Selected |
| Azure | Microsoft ecosystem | Selected |
| Google Cloud | GCP users | Selected |

## Cost Comparison

### Token Pricing (via API)
- Same pricing for all models
- Based on input tokens only
- Batch processing for efficiency

### Self-Hosted Costs
- **jina-embeddings-v3**: ~2GB model size
- **jina-clip-v2**: ~3.5GB model size
- GPU recommended for production speeds

## Speed Benchmarks

### Inference Speed (on T4 GPU)
| Model | Batch Size | Tokens/Second |
|-------|------------|---------------|
| jina-embeddings-v3 | 32 | ~10,000 |
| jina-clip-v2 (text) | 32 | ~8,000 |
| jina-clip-v2 (image) | 8 | ~20 images/sec |

### API Latency
- Depends on input size
- Generally <500ms for typical requests
- Batch processing more efficient

## Migration Guide

### From OpenAI
```python
# Before (OpenAI)
openai.Embedding.create(
    model="text-embedding-3-large",
    input=texts
)

# After (Jina)
requests.post(
    "https://api.jina.ai/v1/embeddings",
    json={"model": "jina-embeddings-v3", "input": texts}
)
```

### From jina-embeddings-v2 to v3
- API compatible - just change model name
- Dimensions: v2 (768) → v3 (1024)
- Consider using dimension parameter for compatibility

### From jina-clip-v1 to v2
- Higher resolution images automatically handled
- Better text performance out of the box
- Token costs differ due to resolution

## Recommendations

1. **New Projects**: Always use latest versions (v3, v2)
2. **Existing Projects**: Plan migration for better performance
3. **Multimodal Needs**: jina-clip-v2 is the clear choice
4. **Text Only**: jina-embeddings-v3 for best results
5. **Resource Constrained**: Use dimension reduction feature