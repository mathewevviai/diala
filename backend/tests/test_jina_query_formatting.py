#!/usr/bin/env python3
"""
Test script to verify Jina AI query formatting is working properly.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from rag.services.external_search_service import ExternalSearchService

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_query_formatting():
    """Test the query formatting functionality."""
    service = ExternalSearchService()
    
    # Test case 1: Keywords that were failing before
    keywords1 = [
        "Roofing and Construction",
        "roofing contractor",
        "roof repair",
        "commercial roofing",
        "residential roofing",
        "guttering",
        "slate roof",
        "tile roof",
        "roofing startup",
        "small business",
        "Belfast, Northern Ireland, UK"
    ]
    
    print("\n" + "="*60)
    print("Test Case 1: Roofing Business Keywords")
    print("="*60)
    print(f"Original keywords: {keywords1}")
    print("\nFormatting queries...")
    
    queries1 = await service.format_keywords_to_queries(keywords1)
    print(f"\nFormatted queries ({len(queries1)} total):")
    for i, query in enumerate(queries1, 1):
        print(f"{i}. {query}")
    
    # Test case 2: Tech-related keywords
    keywords2 = [
        "machine learning",
        "neural networks",
        "deep learning",
        "RAG",
        "vector database",
        "embeddings"
    ]
    
    print("\n" + "="*60)
    print("Test Case 2: Tech Keywords")
    print("="*60)
    print(f"Original keywords: {keywords2}")
    print("\nFormatting queries...")
    
    queries2 = await service.format_keywords_to_queries(
        keywords2,
        context="Technical implementation guides"
    )
    print(f"\nFormatted queries ({len(queries2)} total):")
    for i, query in enumerate(queries2, 1):
        print(f"{i}. {query}")
    
    # Test case 3: Actually perform a search with formatted queries
    print("\n" + "="*60)
    print("Test Case 3: Performing Actual Search")
    print("="*60)
    print("Searching for roofing businesses in Belfast...\n")
    
    results = await service.search_with_formatted_queries(
        keywords=keywords1[:5],  # Use fewer keywords for quick test
        max_results=5
    )
    
    print(f"\nSearch completed. Found {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result.get('title', 'No title')}")
        print(f"   URL: {result.get('url', 'No URL')}")
        print(f"   Query used: {result.get('search_query', 'Unknown')}")
        if result.get('description'):
            print(f"   Description: {result['description'][:100]}...")

if __name__ == "__main__":
    asyncio.run(test_query_formatting())
