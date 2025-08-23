# External Search Service for RAG Workflows

The external search service integrates Jina AI search with DeepSeek query formatting to enhance RAG workflows with web-sourced content.

## Features

1. **Query Formatting**: Converts keyword arrays into natural language queries using DeepSeek AI
2. **Multiple Search Queries**: Splits complex searches into multiple focused queries
3. **Content Extraction**: Processes search results and extracts meaningful content
4. **RAG Integration**: Seamlessly integrates with the RAG workflow pipeline

## Configuration

Set the following environment variables:

```bash
JINA_API_KEY=your_jina_api_key       # Required for search
DEEPSEEK_API_KEY=your_deepseek_key   # For query formatting (falls back to OpenAI if not set)
```

## Usage

### 1. Direct API Usage

```python
from src.rag.external_search_service import ExternalSearchService

service = ExternalSearchService()

# Format keywords into queries
keywords = ["machine learning", "neural networks", "deep learning"]
queries = await service.format_keywords_to_queries(
    keywords=keywords,
    context="Looking for beginner tutorials",
    max_queries=5
)

# Search with formatted queries
results = await service.search_with_formatted_queries(
    keywords=keywords,
    context="Technical documentation",
    max_queries=3,
    max_results_per_query=5
)
```

### 2. RAG Workflow Integration

Create a RAG workflow with external search sources:

```python
workflow_data = {
    "name": "External Search RAG",
    "type": "external_search",
    "sources": [
        {
            "source": json.dumps({
                "keywords": ["RAG", "embeddings", "vector database"],
                "context": "Technical documentation",
                "max_results": 10
            }),
            "source_type": "external_search"
        },
        {
            # Simple comma-separated keywords
            "source": "machine learning, RAG, best practices",
            "source_type": "external_search"
        }
    ]
}
```

### 3. Source Format Options

The external search source accepts two formats:

#### JSON Format (Recommended)
```json
{
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "context": "Optional context about what you're looking for",
    "max_results": 10
}
```

#### Simple Format
```
keyword1, keyword2, keyword3
```

## Query Formatting Examples

The DeepSeek integration converts keywords into effective search queries:

**Input Keywords**: `["React", "useState", "useEffect"]`  
**Context**: `"Looking for React hooks tutorials"`

**Generated Queries**:
1. "React useState and useEffect hooks tutorial guide"
2. "How to use React hooks useState useEffect examples"
3. "React functional components hooks best practices"

## Error Handling

- If JINA_API_KEY is not set, searches will fail with an error
- If DEEPSEEK_API_KEY is not set, it falls back to OpenAI API
- If both are missing, a simple keyword combination fallback is used

## Testing

Run the test scripts:

```bash
# Test query formatting and search
python test_external_search.py

# Example RAG workflow
python examples/rag_external_search_example.py
```

## Integration with Existing RAG Pipeline

The external search seamlessly integrates with the existing RAG pipeline:

1. **Scraping Phase**: External search results are fetched and combined
2. **Chunking Phase**: Search results are chunked like any other content
3. **Embedding Phase**: Standard embedding process applies
4. **Indexing Phase**: Results are indexed in the configured vector store

## Best Practices

1. **Keywords**: Use 3-5 relevant keywords for best results
2. **Context**: Always provide context for more targeted queries
3. **Max Results**: Balance between coverage and processing time (10-20 recommended)
4. **Query Caching**: The service caches formatted queries to avoid redundant API calls

## Monitoring and Debugging

Enable debug logging to see detailed information:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

This will show:
- Generated queries from keywords
- Search API calls and responses
- Content extraction details
- Error messages with full context