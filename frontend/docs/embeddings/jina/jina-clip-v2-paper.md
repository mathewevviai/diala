# jina-clip-v2: Multilingual Multimodal Embeddings for Text and Images

**ArXiv**: https://arxiv.org/abs/2412.08802  
**Model**: https://huggingface.co/jinaai/jina-clip-v2

## Summary

jina-clip-v2 is an advanced contrastive vision-language model that addresses key limitations of existing CLIP models, particularly in text-only tasks and multilingual understanding.

## Key Technical Details

- **Architecture**: Contrastive vision-language model
- **Parameters**: 0.9B
- **Image Resolution**: 512x512 pixels
- **Training Approach**: Multi-task and multi-stage contrastive learning

## Training Methodology

1. **Multi-Stage Training**: 
   - Text pairs for semantic similarity
   - Text triplets for ranking tasks
   - Image-text pairs for crossmodal understanding

2. **Multilingual Text Encoder**: Specifically designed to handle multiple languages effectively

## Multilingual Capabilities

- **Language Support**: 89 languages total
- **Training Languages**: Expanded dataset includes 29 non-English languages
- **Example Languages**: Hindi, Chinese, German, French, and many more
- **Use Cases**: Both text-only and crossmodal tasks across languages

## Key Improvements

1. **Text-Only Retrieval**: Unlike original CLIP, excels at text-to-text search
2. **Semantic Textual Similarity**: Strong performance on text similarity tasks
3. **Crossmodal Retrieval**: Enhanced image-text and text-image search
4. **Flexible Embedding Dimensions**: Supports dimension reduction through Matryoshka learning

## Performance Highlights

- Notable improvements over state-of-the-art CLIP models
- Effective in both English and multilingual settings
- 3% performance improvement over jina-clip-v1 in text-image and text-text retrieval

## Applications

1. **Multilingual Image Search**: Search images using queries in 89 languages
2. **Cross-Lingual Retrieval**: Find content across language barriers
3. **Multimodal RAG**: Combine text and image understanding for enhanced retrieval
4. **Zero-Shot Classification**: Classify images and text without task-specific training

## Unique Features

1. **True Multimodal**: Handles text-text, text-image, image-text, and image-image tasks
2. **High Resolution**: Processes 512x512 images (vs 224x224 in many CLIP models)
3. **Matryoshka Representations**: Reduce storage with truncated embeddings
4. **Unified Model**: Single model for both vision and language tasks

## Availability

The model is publicly available and can be accessed at:
- Hugging Face: https://huggingface.co/jinaai/jina-clip-v2
- Jina API: https://api.jina.ai/v1/embeddings