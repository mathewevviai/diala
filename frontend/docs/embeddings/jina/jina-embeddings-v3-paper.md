# jina-embeddings-v3: Multilingual Embeddings With Task LoRA

**ArXiv**: https://arxiv.org/abs/2409.10173

## Summary

jina-embeddings-v3 is a state-of-the-art multilingual text embedding model with 570 million parameters that supports context lengths up to 8192 tokens.

## Key Technical Details

- **Parameters**: 570 million
- **Max Context Length**: 8192 tokens
- **Default Embedding Dimension**: 1024
- **Flexible Dimensions**: Can be reduced down to 32 dimensions
- **Architecture**: Includes task-specific Low-Rank Adaptation (LoRA) adapters
- **Languages Supported**: 89 languages with optimized performance for top 30

## Key Features

1. **Task-Specific LoRA Adapters**: The model uses Low-Rank Adaptation to specialize for different tasks without full fine-tuning
2. **Matryoshka Representation Learning**: Enables dimension reduction from 1024 to 32 without significant performance loss
3. **Long-Context Support**: Native support for documents up to 8192 tokens

## Performance

- Achieves state-of-the-art performance on multilingual data and long-context retrieval
- Outperforms OpenAI and Cohere embeddings on English tasks
- Superior performance compared to multilingual-e5-large-instruct across all multilingual tasks

## Evaluation Benchmarks

The model was evaluated on:
- **MTEB (Massive Text Embedding Benchmark)**: Comprehensive benchmark for text embeddings
- **Query-document retrieval**: Information retrieval tasks
- **Clustering**: Grouping similar texts
- **Classification**: Text categorization
- **Text matching**: Semantic similarity tasks

## Applications

The model generates high-quality embeddings suitable for:
- Cross-lingual search
- Multilingual RAG (Retrieval Augmented Generation)
- Semantic search across languages
- Document clustering and classification
- Long-document retrieval

## Unique Advantages

1. **Multilingual Excellence**: Top performance across 89 languages
2. **Flexible Deployment**: Adjustable embedding dimensions for different use cases
3. **Long Context**: Handle lengthy documents without truncation
4. **Task Adaptation**: LoRA adapters optimize for specific downstream tasks