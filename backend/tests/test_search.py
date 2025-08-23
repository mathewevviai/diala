#!/usr/bin/env python3
"""Test the search functionality with Belfast roofing example"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.query_builder import combine_search_and_validation_queries
from src.core.leadgen import phase1_search

# Test configuration for Belfast roofing
test_config = {
    'searchName': 'Belfast Roofing Contractors Q1 2025',
    'searchObjective': 'Find established roofing contractors in Belfast',
    'selectedSources': ['web'],
    'industry': 'Roofing and Construction',
    'location': 'Belfast, Northern Ireland, UK',
    'companySize': '11-50',
    'jobTitles': ['CEO', 'Business Owner', 'Operations Manager'],
    'keywords': 'roofing contractor, roof repair, commercial roofing, residential roofing, guttering, slate roof, tile roof',
    'includeEmails': True,
    'includePhones': True,
    'includeLinkedIn': False,
    'validationCriteria': {
        'mustHaveWebsite': True,
        'mustHaveContactInfo': True,
        'mustHaveSpecificKeywords': ['roofing', 'roof', 'contractor', 'construction'],
        'mustBeInIndustry': True,
        'customValidationRules': 'Must offer roofing services and be based in Belfast area'
    }
}

# Generate queries
print("Generating search queries...")
queries = combine_search_and_validation_queries(test_config)
print(f"\nGenerated {len(queries)} queries:")
for i, query in enumerate(queries, 1):
    print(f"{i}. {query}")

# Test Phase 1 search with just the first query
print("\n\nTesting Phase 1 search with first query...")
results = phase1_search.run(
    search_query=queries[0] if queries else "",
    max_pages=2,  # Just 2 pages for testing
    custom_queries=queries[:3],  # Use first 3 queries
    single_query=False
)

print(f"\nSearch results: {len(results)} items found")
if results:
    print("\nFirst result:")
    print(f"Title: {results[0].get('title', 'N/A')}")
    print(f"Link: {results[0].get('link', 'N/A')}")
    print(f"Snippet: {results[0].get('snippet', 'N/A')[:200]}...")