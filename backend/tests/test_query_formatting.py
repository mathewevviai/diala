#!/usr/bin/env python3
"""Test the query formatting functionality"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.leadgen.phase1_search import format_query_with_deepseek

# Test cases
test_queries = [
    "Roofing and Construction roofing contractor roof repair commercial roofing residential roofing guttering slate roof tile roof roofing startup small business Belfast, Northern Ireland, UK",
    "plumbing services emergency plumber drain cleaning water heater repair London UK",
    "web development software engineering API integration San Francisco California USA"
]

print("Testing Query Formatting with DeepSeek/OpenAI")
print("=" * 60)

for i, query in enumerate(test_queries, 1):
    print(f"\nTest {i}:")
    print(f"Original: {query}")
    print(f"Length: {len(query)} characters")
    
    formatted = format_query_with_deepseek(query)
    print(f"\nFormatted into {len(formatted)} queries:")
    for j, fq in enumerate(formatted, 1):
        print(f"  {j}. {fq}")
    print("-" * 60)