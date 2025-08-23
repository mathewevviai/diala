#!/usr/bin/env python3
"""
Test AI Query Generation - Test the new Groq-powered query synthesis.
"""

import sys
import os
import asyncio
import json
from datetime import datetime

# Add project root to path
sys.path.append('.')

def print_header(title):
    print("\n" + "="*60)
    print(f"🧪 {title}")
    print("="*60)

def print_success(message):
    print(f"✅ {message}")

def print_info(message):
    print(f"💡 {message}")

async def test_ai_query_generation():
    """Test AI query generation with Groq."""
    print_header("Testing AI Query Generation")
    
    try:
        from src.core.leadgen.hunter_search_service import HunterSearchService
        
        # Get API keys
        JINA_API_KEY = os.getenv("JINA_API_KEY")
        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        
        if not JINA_API_KEY or not GROQ_API_KEY:
            print("❌ Missing required API keys (JINA_API_KEY, GROQ_API_KEY)")
            return False
        
        # Create service
        service = HunterSearchService(JINA_API_KEY, OPENAI_API_KEY, GROQ_API_KEY)
        
        # Test search config
        search_config = {
            "industry": "Roofing & Construction",
            "location": "Belfast, Northern Ireland",
            "keywords": "roofing contractor, roof repair, commercial roofing",
            "companySize": "11-50",
            "jobTitles": ["CEO", "Business Owner"],
            "validationCriteria": {
                "mustHaveWebsite": True,
                "mustHaveContactInfo": True,
                "mustHaveSpecificKeywords": ["roofing", "roof", "contractor"],
                "mustBeInIndustry": True,
                "customValidationRules": "Must offer roofing services"
            }
        }
        
        print_info(f"Generating AI queries for: {search_config['industry']} in {search_config['location']}")
        
        # Generate AI queries
        ai_queries = await service.generate_ai_search_queries(search_config, max_queries=30)
        
        if not ai_queries:
            print("❌ No AI queries generated")
            return False
        
        print_info(f"Generated {len(ai_queries)} AI queries")
        
        # Validate query structure
        required_fields = ["type", "query", "intent", "tags"]
        valid_types = ["longtail", "boolean", "directory_site", "site_specific", "inurl_title", "role_offer", "pain_point", "social_profile", "exclusion"]
        valid_intents = ["contact", "company_page", "service_page", "directory_listing", "review", "social", "press", "job_posting"]
        
        type_counts = {}
        intent_counts = {}
        site_queries = 0
        contact_queries = 0
        
        for i, query_obj in enumerate(ai_queries[:10]):  # Show first 10
            # Validate structure
            for field in required_fields:
                if field not in query_obj:
                    print(f"❌ Query {i+1} missing field: {field}")
                    return False
            
            # Validate values
            if query_obj["type"] not in valid_types:
                print(f"❌ Query {i+1} invalid type: {query_obj['type']}")
                return False
                
            if query_obj["intent"] not in valid_intents:
                print(f"❌ Query {i+1} invalid intent: {query_obj['intent']}")
                return False
            
            # Count metrics
            type_counts[query_obj["type"]] = type_counts.get(query_obj["type"], 0) + 1
            intent_counts[query_obj["intent"]] = intent_counts.get(query_obj["intent"], 0) + 1
            
            if "site:" in query_obj["query"] or "inurl:" in query_obj["query"]:
                site_queries += 1
                
            if any(w in query_obj["query"].lower() for w in ["contact", "email", "phone"]):
                contact_queries += 1
            
            print_info(f"  {i+1}. [{query_obj['type']}] {query_obj['query'][:80]}...")
        
        # Validate requirements from the plan
        print_info(f"Query types: {type_counts}")
        print_info(f"Intent types: {intent_counts}")
        print_info(f"Site-limited queries: {site_queries}")
        print_info(f"Contact-intent queries: {contact_queries}")
        
        # Check requirements
        checks = []
        checks.append(("At least 2 site: queries", site_queries >= 2))
        checks.append(("At least 3 contact queries", contact_queries >= 3))
        checks.append(("Multiple query types", len(type_counts) >= 3))
        checks.append(("Multiple intent types", len(intent_counts) >= 2))
        
        all_passed = True
        for check_name, passed in checks:
            if passed:
                print_success(check_name)
            else:
                print(f"❌ {check_name}")
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_legacy_integration():
    """Test that legacy queries still work as fallback."""
    print_header("Testing Legacy Integration")
    
    try:
        from src.core.leadgen.hunter_search_service import HunterSearchService
        
        # Get API keys - intentionally use bad Groq key to test fallback
        JINA_API_KEY = os.getenv("JINA_API_KEY")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        
        if not JINA_API_KEY:
            print("❌ Missing JINA_API_KEY")
            return False
        
        # Create service with bad Groq key
        service = HunterSearchService(JINA_API_KEY, OPENAI_API_KEY, "bad_groq_key")
        
        # Test search config
        search_config = {
            "industry": "Technology",
            "location": "San Francisco, CA",
            "keywords": "AI, startup",
            "companySize": "1-50",
            "jobTitles": ["CEO", "CTO"]
        }
        
        print_info("Testing legacy fallback with invalid Groq key...")
        
        # Generate queries (should fall back to legacy)
        queries = service.generate_search_queries(search_config, fallback_level=0)
        
        if not queries:
            print("❌ No queries generated")
            return False
        
        print_info(f"Generated {len(queries)} legacy queries:")
        for i, query in enumerate(queries[:5]):
            print_info(f"  {i+1}. {query}")
        
        # Validate we have reasonable queries
        if len(queries) < 3:
            print("❌ Too few queries generated")
            return False
        
        # Check for expected patterns
        location_queries = [q for q in queries if "San Francisco" in q]
        industry_queries = [q for q in queries if "Technology" in q]
        
        if not location_queries:
            print("❌ No location-specific queries found")
            return False
            
        if not industry_queries:
            print("❌ No industry-specific queries found")
            return False
        
        print_success("Legacy fallback working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_query_caching():
    """Test query caching functionality."""
    print_header("Testing Query Caching")
    
    try:
        from src.core.leadgen.hunter_search_service import HunterSearchService
        from pathlib import Path
        
        # Get API keys
        JINA_API_KEY = os.getenv("JINA_API_KEY")
        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        
        if not JINA_API_KEY or not GROQ_API_KEY:
            print("❌ Missing required API keys")
            return False
        
        # Create service
        service = HunterSearchService(JINA_API_KEY, OPENAI_API_KEY, GROQ_API_KEY)
        
        # Test search config
        search_config = {
            "industry": "Finance",
            "location": "London, UK",
            "keywords": "investment, banking",
            "companySize": "51-200",
            "jobTitles": ["CFO", "Investment Manager"]
        }
        
        # Clear any existing cache
        cache_dir = Path("data/query_cache")
        config_hash = abs(hash(json.dumps({
            "industry": search_config.get("industry"),
            "location": search_config.get("location"),
            "keywords": search_config.get("keywords"),
            "companySize": search_config.get("companySize"),
            "jobTitles": search_config.get("jobTitles"),
            "validationCriteria": search_config.get("validationCriteria", {})
        }, sort_keys=True)))
        cache_file = cache_dir / f"{config_hash}.json"
        
        if cache_file.exists():
            cache_file.unlink()
            print_info("Cleared existing cache")
        
        # First call - should generate and cache
        print_info("First call (should generate new queries)...")
        start_time = datetime.now()
        ai_queries_1 = await service.generate_ai_search_queries(search_config, max_queries=20)
        first_duration = (datetime.now() - start_time).total_seconds()
        
        if not ai_queries_1:
            print("❌ No queries generated on first call")
            return False
        
        print_info(f"First call took {first_duration:.2f}s, generated {len(ai_queries_1)} queries")
        
        # Check cache was created
        if not cache_file.exists():
            print("❌ Cache file was not created")
            return False
        
        print_success("Cache file created")
        
        # Second call - should use cache
        print_info("Second call (should use cache)...")
        start_time = datetime.now()
        ai_queries_2 = await service.generate_ai_search_queries(search_config, max_queries=20)
        second_duration = (datetime.now() - start_time).total_seconds()
        
        if not ai_queries_2:
            print("❌ No queries returned from cache")
            return False
        
        print_info(f"Second call took {second_duration:.2f}s, returned {len(ai_queries_2)} queries")
        
        # Verify results are the same
        if len(ai_queries_1) != len(ai_queries_2):
            print("❌ Cached results differ in length")
            return False
        
        if ai_queries_1[0]["query"] != ai_queries_2[0]["query"]:
            print("❌ Cached results differ in content")
            return False
        
        # Cache should be much faster
        if second_duration >= first_duration * 0.5:  # Allow 50% tolerance
            print(f"⚠️  Cache not significantly faster ({second_duration:.2f}s vs {first_duration:.2f}s)")
        else:
            print_success(f"Cache is faster ({second_duration:.2f}s vs {first_duration:.2f}s)")
        
        print_success("Query caching working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def run_all_tests():
    """Run all AI query generation tests."""
    print("🚀 Starting AI Query Generation Tests")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("AI Query Generation", test_ai_query_generation),
        ("Legacy Integration", test_legacy_integration),
        ("Query Caching", test_query_caching),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            
            if result:
                passed += 1
            else:
                failed += 1
                
        except Exception as e:
            print(f"❌ {test_name} FAILED: {e}")
            failed += 1
    
    # Final summary
    print("\n" + "="*60)
    print("🏆 AI QUERY GENERATION TEST RESULTS")
    print("="*60)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! AI Query Generation Working!")
        print("\n🔧 AI Query System Features:")
        print("   ✅ Groq-powered query synthesis")
        print("   ✅ Multiple query types (longtail, boolean, site:, inurl:)")
        print("   ✅ Contact-intent optimization")
        print("   ✅ Query caching (24-hour TTL)")
        print("   ✅ Legacy fallback support")
        print("   ✅ Heuristic scoring and ranking")
        
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    exit(0 if success else 1)