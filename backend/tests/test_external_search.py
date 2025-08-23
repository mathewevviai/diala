#!/usr/bin/env python3
"""
Test script for the external search service with query formatting.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.rag.external_search_service import ExternalSearchService
from src.core.logging import logger
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def test_query_formatting():
    """Test the format_keywords_to_queries method."""
    service = ExternalSearchService()
    
    # Test case 1: Basic keywords
    print("\n=== Test 1: Basic Keywords ===")
    keywords = ["machine learning", "neural networks", "deep learning"]
    queries = await service.format_keywords_to_queries(keywords)
    print(f"Keywords: {keywords}")
    print("Generated queries:")
    for i, query in enumerate(queries, 1):
        print(f"  {i}. {query}")
    
    # Test case 2: Keywords with context
    print("\n=== Test 2: Keywords with Context ===")
    keywords = ["React", "useState", "useEffect"]
    context = "Looking for React hooks tutorials and best practices"
    queries = await service.format_keywords_to_queries(keywords, context)
    print(f"Keywords: {keywords}")
    print(f"Context: {context}")
    print("Generated queries:")
    for i, query in enumerate(queries, 1):
        print(f"  {i}. {query}")
    
    # Test case 3: Business-related keywords
    print("\n=== Test 3: Business Keywords ===")
    keywords = ["roofing", "contractor", "Belfast", "commercial", "residential"]
    context = "Finding roofing contractors in Belfast area"
    queries = await service.format_keywords_to_queries(keywords, context, max_queries=3)
    print(f"Keywords: {keywords}")
    print(f"Context: {context}")
    print("Generated queries:")
    for i, query in enumerate(queries, 1):
        print(f"  {i}. {query}")

async def test_search_with_formatting():
    """Test the complete search with formatted queries."""
    service = ExternalSearchService()
    
    print("\n=== Test 4: Complete Search with Formatting ===")
    keywords = ["Python", "async", "programming", "tutorial"]
    context = "Looking for advanced Python async programming tutorials"
    
    print(f"Keywords: {keywords}")
    print(f"Context: {context}")
    print("\nPerforming search...")
    
    results = await service.search_with_formatted_queries(
        keywords=keywords,
        context=context,
        max_queries=2,
        max_results_per_query=3
    )
    
    print(f"\nFound {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        print(f"Title: {result['title']}")
        print(f"URL: {result['url']}")
        print(f"Query: {result['metadata']['search_query']}")
        if result.get('snippet'):
            print(f"Snippet: {result['snippet'][:200]}...")

async def test_rag_integration():
    """Test how the external search would work in a RAG workflow."""
    print("\n=== Test 5: RAG Workflow Integration ===")
    
    # Example of how to format the source for RAG workflow
    search_config = {
        "keywords": ["RAG", "retrieval augmented generation", "LLM", "embeddings"],
        "context": "Technical documentation about RAG systems",
        "max_results": 5
    }
    
    import json
    search_query = json.dumps(search_config)
    print(f"RAG Source string: {search_query}")
    
    # This is how it would be used in the RAG workflow:
    # 1. Create a RAGSource with source_type=EXTERNAL_SEARCH
    # 2. Set the source field to the JSON string above
    # 3. The _scrape_external_search method will parse and execute the search

async def main():
    """Run all tests."""
    print("Testing External Search Service with Query Formatting")
    print("=" * 50)
    
    try:
        # Check if API keys are set
        if not os.getenv("JINA_API_KEY"):
            print("WARNING: JINA_API_KEY not set. Search functionality will not work.")
        if not os.getenv("DEEPSEEK_API_KEY") and not os.getenv("OPENAI_API_KEY"):
            print("WARNING: Neither DEEPSEEK_API_KEY nor OPENAI_API_KEY is set. Query formatting will use fallback.")
        
        # Run tests
        await test_query_formatting()
        await test_search_with_formatting()
        await test_rag_integration()
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())