# Jina AI Models on Hugging Face

**Organization**: https://huggingface.co/jinaai

## Overview

Jina AI maintains 43 models on Hugging Face, focusing on search foundation models including embeddings, rerankers, and small language models for enhanced search capabilities.

## Popular Models

### 1. Embedding Models

#### jina-embeddings-v3
- **Type**: Feature Extraction
- **Downloads**: 4.09M+
- **Description**: State-of-the-art multilingual embeddings with 570M parameters
- **Usage**: Text embeddings for 89 languages, 8192 token context

#### jina-embedding-s-en-v1 & jina-embedding-b-en-v1
- **Type**: Sentence Similarity
- **Description**: Earlier generation English-focused embedding models
- **Variants**: Small (s) and Base (b) sizes

### 2. Multimodal CLIP Models

#### jina-clip-v2
- **Type**: Feature Extraction
- **Downloads**: 46.4k+
- **Description**: Multilingual multimodal embeddings for text and images
- **Features**: 89 languages, 512x512 image resolution

#### jina-clip-v1
- **Type**: Feature Extraction
- **Downloads**: 143k+
- **Description**: First generation CLIP model
- **Note**: v2 offers significant improvements

### 3. Reranker Models

#### jina-reranker-m0
- **Type**: Text Classification
- **Description**: Reranking model for improving search relevance
- **Use Case**: Post-processing search results for better ranking

### 4. ColBERT Models

#### jina-colbert-v2
- **Type**: Search-related
- **Description**: Late interaction retrieval model
- **Features**: Efficient dense retrieval with token-level matching

### 5. Reader Models

#### ReaderLM-v2
- **Type**: Text Generation
- **Description**: Converts HTML to Markdown/JSON
- **Use Case**: Web content extraction and formatting

#### reader-lm-1.5b
- **Type**: Text Generation
- **Parameters**: 1.5B
- **Description**: Language model for reading and processing text

## Installation and Usage

### Basic Installation
```bash
pip install transformers
```

### Using jina-embeddings-v3
```python
from transformers import AutoTokenizer, AutoModel
import torch

# Load model and tokenizer
model_name = "jinaai/jina-embeddings-v3"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)

# Encode text
texts = ["Hello world", "How are you?"]
inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True)

with torch.no_grad():
    outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    
# Normalize if needed
embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
```

### Using jina-clip-v2
```python
from transformers import AutoModel

# Load multimodal model
model = AutoModel.from_pretrained("jinaai/jina-clip-v2", trust_remote_code=True)

# Encode text
text_embeddings = model.encode_text(["A photo of a cat", "A sunny beach"])

# Encode images (from URLs or local paths)
image_embeddings = model.encode_image(["path/to/image.jpg"])

# Both embeddings are in the same space for comparison
```

## Model Categories

1. **Search Foundation Models**
   - Focus on improving search quality
   - Includes embeddings, rerankers, and readers

2. **Multimodal AI**
   - Text and vision understanding
   - Cross-modal search capabilities

3. **Multilingual Support**
   - Models supporting up to 89 languages
   - Optimized for cross-lingual tasks

## Download Statistics

- **Total Downloads**: Millions across all models
- **Most Popular**: jina-embeddings-v3 (4.09M+ downloads)
- **Growing Fast**: jina-clip-v2 (newer but rapidly adopted)

## Key Features Across Models

1. **Open Source**: All models freely available
2. **Production Ready**: Optimized for deployment
3. **Well Documented**: Comprehensive usage guides
4. **Regular Updates**: Active development and improvements
5. **Community Support**: Active discussions and issue tracking

## Integration with Jina API

While these models can be used locally, the Jina API provides:
- Managed infrastructure
- No GPU requirements
- Automatic scaling
- Additional optimizations
- Unified API interface

## Research Focus

Jina AI's Hugging Face presence reflects their research priorities:
- Advanced embedding techniques
- Multimodal understanding
- Efficient retrieval methods
- Practical search applications
- Multilingual capabilities