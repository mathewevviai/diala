#!/usr/bin/env python3
"""
Test script for async phase1_search implementation.
"""

import asyncio
import logging
import json
from datetime import datetime
from src.core.leadgen.phase1_search_async import Phase1SearchAsync

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def test_progress_callback(update):
    """Test progress callback to display updates."""
    print(f"\n=== PROGRESS UPDATE ===")
    print(f"Time: {update.get('timestamp', 'N/A')}")
    print(f"Message: {update.get('message', 'N/A')}")
    print(f"Progress: {update.get('progress', 0)}%")
    print(f"Stage: {update.get('stage', 'N/A')}")
    
    stats = update.get('stats', {})
    if stats:
        print(f"Stats:")
        for key, value in stats.items():
            print(f"  {key}: {value}")
    print("=====================\n")

async def test_async_search():
    """Test the async search functionality."""
    print("Starting async search test...")
    
    # Test search configuration
    search_config = {
        "searchName": "Tech Startups in San Francisco",
        "searchObjective": "Find tech startup leads for partnerships",
        "industry": "Technology",
        "location": "San Francisco, CA",
        "keywords": "AI machine learning startup",
        "includeEmails": True,
        "includePhones": True,
        "validationCriteria": {
            "mustHaveWebsite": True,
            "mustHaveContactInfo": True,
            "mustHaveSpecificKeywords": ["AI", "startup"],
            "mustBeInIndustry": True,
            "customValidationRules": "Must be a tech company"
        }
    }
    
    # Create search instance
    search = Phase1SearchAsync(progress_callback=test_progress_callback)
    
    try:
        # Run search with limited queries for testing
        results = await search.run_async(
            search_query="tech startups San Francisco AI",
            max_pages=2,  # Limit for testing
            custom_queries=[
                "AI startups San Francisco contact email",
                "machine learning companies Bay Area",
                "tech startup directory California"
            ],
            append_mode=False,
            single_query=False,
            search_config=search_config
        )
        
        print(f"\n=== SEARCH COMPLETE ===")
        print(f"Total results found: {len(results)}")
        print(f"Search statistics:")
        for key, value in search.search_stats.items():
            print(f"  {key}: {value}")
        
        # Display sample results
        if results:
            print(f"\nFirst 3 results:")
            for i, result in enumerate(results[:3]):
                print(f"\n{i+1}. {result.get('title', 'No title')}")
                print(f"   URL: {result.get('link', 'No URL')}")
                print(f"   Snippet: {result.get('snippet', 'No snippet')[:100]}...")
        
        # Save test results
        with open("data/test_async_results.json", "w") as f:
            json.dump({
                "test_time": datetime.now().isoformat(),
                "config": search_config,
                "stats": search.search_stats,
                "results_count": len(results),
                "sample_results": results[:5] if results else []
            }, f, indent=2)
        
        print(f"\nTest results saved to data/test_async_results.json")
        
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        raise

async def test_rate_limiting():
    """Test rate limiting functionality."""
    from src.core.leadgen.utils.async_api_client import RateLimiter
    
    print("\n=== TESTING RATE LIMITER ===")
    
    limiter = RateLimiter(rate=2.0, burst=5)  # 2 requests/second, burst of 5
    
    start_time = asyncio.get_event_loop().time()
    
    for i in range(10):
        wait_time = await limiter.acquire()
        current_time = asyncio.get_event_loop().time() - start_time
        print(f"Request {i+1}: waited {wait_time:.2f}s, time: {current_time:.2f}s")
    
    print("Rate limiting test complete")

async def main():
    """Run all tests."""
    print("=== ASYNC PHASE1_SEARCH TEST SUITE ===\n")
    
    # Test rate limiting
    await test_rate_limiting()
    
    # Test async search
    await test_async_search()
    
    print("\n=== ALL TESTS COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(main())