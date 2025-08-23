# Jina Embeddings: Examples and Use Cases

## Practical Examples

### 1. Basic Text Embedding
```python
import requests
import numpy as np

# Simple text embedding
def embed_text(texts, api_key):
    response = requests.post(
        'https://api.jina.ai/v1/embeddings',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'jina-embeddings-v3',
            'input': texts,
            'normalized': True
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return [item['embedding'] for item in data['data']]
    else:
        raise Exception(f"API error: {response.text}")

# Example usage
texts = [
    "The quick brown fox jumps over the lazy dog",
    "A fast auburn canine leaps above a resting hound"
]
embeddings = embed_text(texts, "YOUR_API_KEY")

# Calculate similarity
similarity = np.dot(embeddings[0], embeddings[1])
print(f"Cosine similarity: {similarity:.4f}")
```

### 2. Multilingual Search
```python
# Search across multiple languages
multilingual_docs = [
    "Organic skincare for sensitive skin",  # English
    "Bio-Hautpflege für empfindliche Haut",  # German
    "Cuidado orgánico para piel sensible",   # Spanish
    "针对敏感肌的有机护肤品",                    # Chinese
    "敏感肌用オーガニックスキンケア"              # Japanese
]

# Embed documents
doc_embeddings = embed_text(multilingual_docs, "YOUR_API_KEY")

# Search with query in any language
query = "Natural products for delicate skin"
query_embedding = embed_text([query], "YOUR_API_KEY")[0]

# Find most similar documents
similarities = [np.dot(query_embedding, doc_emb) for doc_emb in doc_embeddings]
best_match_idx = np.argmax(similarities)
print(f"Best match: {multilingual_docs[best_match_idx]}")
```

### 3. Image and Text Search with CLIP
```python
# Multimodal search with jina-clip-v2
def embed_multimodal(inputs, api_key):
    response = requests.post(
        'https://api.jina.ai/v1/embeddings',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'jina-clip-v2',
            'input': inputs,
            'normalized': True
        }
    )
    return response.json()['data']

# Mix of text and images
inputs = [
    "A beautiful sunset over the ocean",
    {"url": "https://example.com/sunset.jpg"},
    "Waves crashing on the beach",
    {"url": "https://example.com/beach.jpg"}
]

embeddings = embed_multimodal(inputs, "YOUR_API_KEY")

# Search images with text or vice versa
text_query = "peaceful ocean scene"
query_emb = embed_multimodal([text_query], "YOUR_API_KEY")[0]['embedding']

# Find matching images/text
for i, emb_data in enumerate(embeddings):
    similarity = np.dot(query_emb, emb_data['embedding'])
    print(f"Item {i}: similarity = {similarity:.4f}")
```

### 4. Dimension Reduction for Efficient Storage
```python
# Using Matryoshka representations
def embed_with_dimensions(texts, dimensions, api_key):
    response = requests.post(
        'https://api.jina.ai/v1/embeddings',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'jina-embeddings-v3',
            'input': texts,
            'dimensions': dimensions,  # 32 to 1024
            'normalized': True
        }
    )
    return response.json()

# Compare storage requirements
text = ["Sample document for embedding"]

# Full dimensions
full_emb = embed_with_dimensions(text, 1024, "YOUR_API_KEY")
print(f"Full size: {len(full_emb['data'][0]['embedding'])} dimensions")

# Reduced dimensions
small_emb = embed_with_dimensions(text, 128, "YOUR_API_KEY")
print(f"Reduced size: {len(small_emb['data'][0]['embedding'])} dimensions")
print(f"Storage reduction: {(1 - 128/1024) * 100:.1f}%")
```

### 5. Task-Specific Embeddings
```python
# Optimize embeddings for specific tasks
tasks = {
    'retrieval.query': 'For search queries',
    'retrieval.passage': 'For document passages',
    'text-matching': 'For similarity comparison',
    'classification': 'For categorization',
    'separation': 'For clustering'
}

def embed_for_task(texts, task, api_key):
    response = requests.post(
        'https://api.jina.ai/v1/embeddings',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'jina-embeddings-v3',
            'input': texts,
            'task': task,
            'normalized': True
        }
    )
    return response.json()

# Example: Optimize for retrieval
query = ["What is machine learning?"]
query_emb = embed_for_task(query, 'retrieval.query', "YOUR_API_KEY")

passages = [
    "Machine learning is a subset of AI...",
    "Deep learning uses neural networks..."
]
passage_embs = embed_for_task(passages, 'retrieval.passage', "YOUR_API_KEY")
```

## Real-World Use Cases

### 1. Semantic Search Engine
Build a search engine that understands meaning, not just keywords:
- Index documents with `retrieval.passage` task
- Process queries with `retrieval.query` task
- Support 89 languages without translation
- Handle documents up to 8192 tokens

### 2. Multilingual Customer Support
- Embed support documents in multiple languages
- Match customer queries to relevant answers regardless of language
- Use jina-clip-v2 to include product images in search

### 3. Content Recommendation System
- Embed user preferences and content
- Find similar items across text and images
- Use dimension reduction for mobile apps (32-128 dims)
- Cluster content with `separation` task

### 4. Document Intelligence
- Process long documents with Late Chunking
- Maintain context across chunks
- Extract insights from multi-page documents
- Cross-reference between documents

### 5. E-commerce Search
- Combine product descriptions and images
- Enable visual search with text queries
- Support international marketplaces
- Optimize for fast retrieval with reduced dimensions

### 6. Research Paper Discovery
- Embed abstracts and full papers
- Find related work across disciplines
- Support multilingual research
- Cluster papers by topic

### 7. Legal Document Analysis
- Process contracts and legal texts
- Find similar clauses across documents
- Support multiple jurisdictions/languages
- Maintain full context with 8192 tokens

### 8. Social Media Monitoring
- Embed posts in multiple languages
- Detect similar content/trends
- Combine text and image analysis
- Real-time processing with efficient dimensions

## Best Practices

1. **Choose the Right Model**
   - Text only: jina-embeddings-v3
   - Text + Images: jina-clip-v2

2. **Optimize for Your Use Case**
   - Use appropriate task parameter
   - Consider dimension reduction for scale
   - Enable normalization for similarity

3. **Handle Large Documents**
   - Use Late Chunking for context preservation
   - Process up to 8192 tokens per chunk
   - Maintain document structure

4. **Efficient Implementation**
   - Batch requests (up to 2048 items)
   - Cache embeddings when possible
   - Use appropriate dimensions for storage/speed trade-off

5. **Error Handling**
   ```python
   def robust_embed(texts, api_key, max_retries=3):
       for attempt in range(max_retries):
           try:
               return embed_text(texts, api_key)
           except Exception as e:
               if attempt == max_retries - 1:
                   raise
               time.sleep(2 ** attempt)  # Exponential backoff
   ```