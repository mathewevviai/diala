#!/usr/bin/env python3
"""Compare search results before and after query formatting"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.leadgen.phase1_search import search_jina_raw, search_jina_with_formatted_queries
import logging

logging.basicConfig(level=logging.INFO)

# Test with Belfast roofing example
test_query = "Roofing and Construction roofing contractor roof repair commercial roofing residential roofing guttering slate roof tile roof roofing startup small business Belfast, Northern Ireland, UK"

print("COMPARISON: Raw vs Formatted Query Search")
print("=" * 80)

print("\n1. RAW SEARCH (Old Method):")
print("-" * 40)
print(f"Query: {test_query[:80]}...")
raw_results = search_jina_raw(test_query, page=1)
raw_count = len(raw_results.get("organic_results", []))
print(f"Results found: {raw_count}")
if raw_count > 0:
    print("\nFirst 3 results:")
    for i, result in enumerate(raw_results["organic_results"][:3], 1):
        print(f"\n{i}. {result.get('title', 'No title')}")
        print(f"   URL: {result.get('link', 'No URL')}")
        print(f"   Snippet: {result.get('snippet', 'No snippet')[:100]}...")

print("\n\n2. FORMATTED SEARCH (New Method):")
print("-" * 40)
formatted_results = search_jina_with_formatted_queries(test_query, max_results=30)
print(f"Results found: {len(formatted_results)}")
if formatted_results:
    print("\nFirst 5 results:")
    for i, result in enumerate(formatted_results[:5], 1):
        print(f"\n{i}. {result.get('title', 'No title')}")
        print(f"   URL: {result.get('link', 'No URL')}")
        print(f"   Query used: {result.get('search_query', 'Unknown')}")
        print(f"   Snippet: {result.get('snippet', 'No snippet')[:100]}...")

print("\n" + "=" * 80)
print("SUMMARY:")
print(f"- Raw search: {raw_count} results")
print(f"- Formatted search: {len(formatted_results)} results")
print(f"- Improvement: {len(formatted_results) - raw_count} more results")