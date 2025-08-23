#!/usr/bin/env python3
"""Test concurrent search functionality with multiple users"""

import sys
import os
import threading
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.leadgen import phase1_search
from src.core.query_builder import combine_search_and_validation_queries

# Test configurations for different searches
test_configs = [
    {
        'user_id': 'user_001',
        'config': {
            'industry': 'Roofing and Construction',
            'location': 'Belfast, Northern Ireland, UK',
            'keywords': 'roofing contractor, roof repair',
            'validationCriteria': {
                'mustHaveWebsite': True,
                'mustHaveContactInfo': True
            }
        }
    },
    {
        'user_id': 'user_002',
        'config': {
            'industry': 'Plumbing Services',
            'location': 'London, UK',
            'keywords': 'emergency plumber, drain cleaning',
            'validationCriteria': {
                'mustHaveWebsite': True,
                'mustHaveContactInfo': True
            }
        }
    },
    {
        'user_id': 'user_003',
        'config': {
            'industry': 'Web Development',
            'location': 'San Francisco, CA',
            'keywords': 'API integration, software engineering',
            'validationCriteria': {
                'mustHaveWebsite': True,
                'mustHaveSpecificKeywords': ['API', 'development']
            }
        }
    }
]

def run_search_for_user(user_config):
    """Run a search for a specific user configuration"""
    user_id = user_config['user_id']
    config = user_config['config']
    
    print(f"\n[{user_id}] Starting search for {config['industry']} in {config['location']}")
    
    # Track progress for this user
    progress_history = []
    
    def progress_callback(update):
        progress_history.append({
            'time': time.time(),
            'progress': update.get('progress', 0),
            'message': update.get('message', ''),
            'stats': update.get('stats', {})
        })
        print(f"[{user_id}] {update.get('progress', 0)}% - {update.get('message', '')}")
    
    try:
        # Generate queries
        queries = combine_search_and_validation_queries(config)
        print(f"[{user_id}] Generated {len(queries)} queries")
        
        # Run search
        start_time = time.time()
        results = phase1_search.run(
            custom_queries=queries[:2],  # Use only first 2 queries for faster test
            max_pages=3,  # Limit pages for test
            user_id=user_id,
            progress_callback=progress_callback,
            append_mode=False
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Get final stats
        final_stats = phase1_search.get_performance_stats()
        
        return {
            'user_id': user_id,
            'duration': duration,
            'results_count': len(results),
            'queries_used': len(queries[:2]),
            'progress_updates': len(progress_history),
            'final_stats': final_stats,
            'success': True
        }
        
    except Exception as e:
        print(f"[{user_id}] ERROR: {e}")
        return {
            'user_id': user_id,
            'error': str(e),
            'success': False
        }

def main():
    print("CONCURRENT SEARCH TEST")
    print("=" * 60)
    print(f"Testing with {len(test_configs)} concurrent users")
    print("=" * 60)
    
    # Run searches concurrently
    with ThreadPoolExecutor(max_workers=3) as executor:
        # Submit all tasks
        futures = {
            executor.submit(run_search_for_user, config): config 
            for config in test_configs
        }
        
        # Collect results
        results = []
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
    
    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    print(f"\nSuccessful searches: {len(successful)}")
    print(f"Failed searches: {len(failed)}")
    
    if successful:
        print("\nSuccessful Search Details:")
        for result in successful:
            print(f"\n{result['user_id']}:")
            print(f"  - Duration: {result['duration']:.2f}s")
            print(f"  - Results found: {result['results_count']}")
            print(f"  - Progress updates: {result['progress_updates']}")
            print(f"  - API calls: {result['final_stats'].get('api_calls', 0)}")
            print(f"  - Cache hits: {result['final_stats'].get('cache_hits', 0)}")
            print(f"  - Cache hit rate: {result['final_stats'].get('cache_hit_rate', 0):.2%}")
    
    if failed:
        print("\nFailed Searches:")
        for result in failed:
            print(f"\n{result['user_id']}: {result.get('error', 'Unknown error')}")
    
    # Overall statistics
    if successful:
        avg_duration = sum(r['duration'] for r in successful) / len(successful)
        total_results = sum(r['results_count'] for r in successful)
        total_api_calls = sum(r['final_stats'].get('api_calls', 0) for r in successful)
        
        print(f"\nOverall Statistics:")
        print(f"  - Average search duration: {avg_duration:.2f}s")
        print(f"  - Total results found: {total_results}")
        print(f"  - Total API calls made: {total_api_calls}")
        print(f"  - Concurrent efficiency: {len(successful)} searches in ~{max(r['duration'] for r in successful):.2f}s")

if __name__ == "__main__":
    main()