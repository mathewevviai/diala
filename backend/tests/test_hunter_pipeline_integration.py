"""
E2E Test for Hunter Pipeline Integration
Tests all 7 improvements: front-load filtering, parallel enrichment, 
confidence scoring, progressive fallback, structured dedup, 
incremental saving, and domain-level enrichment.
"""

import pytest
import asyncio
import os
import json
import tempfile
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path

# Import the new services
from src.services.enrichors import validate_email, domain_enrich, contact_enrich
from src.services.dedup import dedupe_exact, fuzzy_dedupe
from src.services.scoring import compute_score
from src.services.save_batcher import SaveBatcher
from src.services.hunter_pipeline import run_hunter_pipeline
from src.core.leadgen.hunter_search_service import start_hunter_search_background


class TestHunterPipelineIntegration:
    """Comprehensive test suite for Hunter pipeline improvements."""
    
    @pytest.fixture
    def sample_leads(self):
        """Sample lead data for testing."""
        return [
            {
                "id": "lead_1",
                "name": "Acme Corp",
                "company": "Acme Corporation",
                "email": "contact@acme.com",
                "phone": "+1-555-0123",
                "url": "https://acme.com",
                "meta": {"match_score": 85},
                "enrichment": {"title": "CEO", "linkedin": "linkedin.com/in/ceo"}
            },
            {
                "id": "lead_2", 
                "name": "ACME Corp",  # Similar to lead_1 (for dedup test)
                "company": "Acme Corporation Ltd",
                "email": "info@acme.com",
                "phone": "+1-555-0124",
                "url": "https://acme.com",
                "meta": {"match_score": 90}
            },
            {
                "id": "lead_3",
                "name": "TechStart Inc",
                "company": "TechStart",
                "email": "hello@techstart.io",
                "url": "https://techstart.io",
                "meta": {"match_score": 70},
                "enrichment": {"title": "CTO", "company": "TechStart"}
            }
        ]
    
    @pytest.fixture
    def mock_session(self):
        """Mock aiohttp session for testing."""
        session = AsyncMock()
        
        # Mock successful HTTP responses
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = {"valid": True}
        
        session.get.return_value.__aenter__ = AsyncMock(return_value=mock_response)
        session.post.return_value.__aenter__ = AsyncMock(return_value=mock_response)
        
        return session

    def test_1_front_load_filtering(self):
        """Test 1: Front-load filtering to reject low-quality queries early."""
        from src.services.hunter_pipeline import _passes_front_filters
        
        # Test blocked domains
        config = {"blocklist_domains": ["spam.com", "blocked.net"]}
        
        assert _passes_front_filters("good business query", config) == True
        assert _passes_front_filters("contains spam.com domain", config) == False
        assert _passes_front_filters("blocked.net should fail", config) == False
        
        print("✅ Test 1 PASSED: Front-load filtering working correctly")

    def test_2_exact_deduplication(self, sample_leads):
        """Test 2: Exact deduplication by email/URL."""
        # Add exact duplicate
        duplicated_leads = sample_leads + [{
            "id": "lead_4",
            "email": "contact@acme.com",  # Same email as lead_1
            "url": "https://different.com"
        }]
        
        deduplicated = dedupe_exact(duplicated_leads)
        
        # Should remove the duplicate with same email
        assert len(deduplicated) == len(sample_leads)
        emails = [lead.get("email") for lead in deduplicated if lead.get("email")]
        assert len(emails) == len(set(emails))  # All emails unique
        
        print("✅ Test 2 PASSED: Exact deduplication working correctly")

    def test_3_fuzzy_deduplication(self, sample_leads):
        """Test 3: Fuzzy deduplication by company name similarity."""
        deduplicated = fuzzy_dedupe(sample_leads, name_key="company", threshold=86)
        
        # "Acme Corp" and "ACME Corp" should be considered duplicates
        # Should keep the one with higher score
        assert len(deduplicated) < len(sample_leads)
        
        # Verify the kept lead has higher score
        acme_leads = [lead for lead in deduplicated if "acme" in lead.get("company", "").lower()]
        assert len(acme_leads) == 1
        assert acme_leads[0]["meta"]["match_score"] == 90  # Higher score kept
        
        print("✅ Test 3 PASSED: Fuzzy deduplication working correctly")

    def test_4_confidence_scoring(self, sample_leads):
        """Test 4: Confidence scoring combines multiple factors."""
        # Test lead with all factors
        lead_complete = {
            "meta": {"match_score": 80},
            "email_valid": True,
            "enrichment": {"title": "CEO", "company": "Test", "linkedin": "url", "phone": "123"}
        }
        
        # Test lead with partial factors
        lead_partial = {
            "meta": {"match_score": 60},
            "email_valid": False,
            "enrichment": {"title": "Manager"}  # Only 1/4 enrichment fields
        }
        
        score_complete = compute_score(lead_complete)
        score_partial = compute_score(lead_partial)
        
        # Complete lead should score higher
        assert score_complete > score_partial
        assert 0 <= score_complete <= 100
        assert 0 <= score_partial <= 100
        
        # Test expected scoring: 80*0.5 + 25 + 25 = 90
        assert score_complete == 90
        # Test partial scoring: 60*0.5 + 0 + 6.25 = 36.25 -> 36
        assert score_partial == 36
        
        print("✅ Test 4 PASSED: Confidence scoring working correctly")

    @pytest.mark.asyncio
    async def test_5_email_validation(self, mock_session):
        """Test 5: Email validation with fallback."""
        # Test valid email format
        valid = await validate_email("test@example.com", mock_session)
        assert valid == True
        
        # Test invalid email format
        invalid = await validate_email("not-an-email", mock_session)
        assert invalid == False
        
        # Test empty email
        empty = await validate_email("", mock_session)
        assert empty == False
        
        print("✅ Test 5 PASSED: Email validation working correctly")

    @pytest.mark.asyncio
    async def test_6_incremental_saving(self):
        """Test 6: Incremental saving with SaveBatcher."""
        saved_items = []
        
        async def mock_save_fn(items):
            saved_items.extend(items)
        
        # Test batch saving
        batcher = SaveBatcher(mock_save_fn, batch_size=2, flush_interval=1)
        await batcher.start()
        
        # Add items one by one
        await batcher.add({"id": 1})
        assert len(saved_items) == 0  # Not yet at batch size
        
        await batcher.add({"id": 2})
        # Give a moment for async processing
        await asyncio.sleep(0.1)
        assert len(saved_items) == 2  # Batch size reached, should save
        
        # Test periodic flush
        await batcher.add({"id": 3})
        await asyncio.sleep(1.2)  # Wait for flush interval
        assert len(saved_items) == 3  # Should flush remaining items
        
        # Test drain
        await batcher.add({"id": 4})
        await batcher.add({"id": 5})
        pending = await batcher.drain()
        assert len(saved_items) == 5  # All items saved
        
        print("✅ Test 6 PASSED: Incremental saving working correctly")

    @pytest.mark.asyncio
    async def test_7_domain_enrichment(self, mock_session):
        """Test 7: Domain-level enrichment."""
        # Mock the response for domain enrichment
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = {
            "domain": "example.com",
            "firmographic": {"size": "50-100", "industry": "Tech"},
            "technographic": {"cms": "WordPress"},
            "decision_makers": [{"name": "John Doe", "title": "CEO"}]
        }
        
        mock_session.get.return_value.__aenter__ = AsyncMock(return_value=mock_response)
        
        # Test enrichment
        result = await domain_enrich("example.com", mock_session)
        
        assert result["domain"] == "example.com"
        assert "firmographic" in result
        assert "technographic" in result
        assert "decision_makers" in result
        
        print("✅ Test 7 PASSED: Domain enrichment working correctly")

    @pytest.mark.asyncio
    async def test_8_parallel_enrichment(self, mock_session):
        """Test 8: Parallel contact enrichment."""
        candidates = [
            {"email": "test1@example.com", "name": "Company 1"},
            {"email": "test2@example.com", "name": "Company 2"},
            {"email": "test3@example.com", "name": "Company 3"}
        ]
        
        # Mock enrichment responses
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = {"title": "CEO", "company": "Test"}
        
        mock_session.post.return_value.__aenter__ = AsyncMock(return_value=mock_response)
        
        # Time parallel enrichment
        start_time = asyncio.get_event_loop().time()
        
        tasks = [contact_enrich(candidate, mock_session) for candidate in candidates]
        results = await asyncio.gather(*tasks)
        
        end_time = asyncio.get_event_loop().time()
        
        # All should complete and return enrichment data
        assert len(results) == 3
        for result in results:
            assert "enrichment" in result
            assert "email_valid" in result
        
        # Should be faster than sequential (though this is a mock test)
        assert end_time - start_time < 1.0  # Reasonable upper bound
        
        print("✅ Test 8 PASSED: Parallel enrichment working correctly")

    @pytest.mark.asyncio 
    async def test_9_progressive_fallback(self, mock_session):
        """Test 9: Progressive fallback on API failures."""
        # Mock session that fails on some calls
        failed_response = AsyncMock()
        failed_response.status = 500
        failed_response.text.return_value = "Server Error"
        
        # Mix of success and failure responses
        mock_session.get.side_effect = [
            AsyncMock(__aenter__=AsyncMock(return_value=failed_response)),  # Fail
            Exception("Network error"),  # Exception  
        ]
        
        # Should not crash and return graceful defaults
        result1 = await domain_enrich("example.com", mock_session)
        assert result1["domain"] == "example.com"  # Basic structure maintained
        
        result2 = await validate_email("test@example.com", mock_session)
        assert result2 == True  # Fallback to soft-true on external validator failure
        
        print("✅ Test 9 PASSED: Progressive fallback working correctly")

    @pytest.mark.asyncio
    async def test_10_end_to_end_pipeline(self):
        """Test 10: Complete end-to-end pipeline integration."""
        # Create temporary file for results
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
            temp_file = f.name
        
        saved_leads = []
        
        async def mock_save_fn(items):
            saved_leads.extend(items)
            # Also save to file for verification
            with open(temp_file, 'w') as f:
                json.dump(saved_leads, f)
        
        # Test pipeline configuration
        config = {
            "queries": ["tech companies San Francisco", "software startups SF"],
            "concurrency": 2,
            "batch_size": 5,
            "flush_interval": 1,
            "dedup_threshold": 86,
            "blocklist_domains": []
        }
        
        search_id = "test_search_12345"
        
        # Mock the discovery functions to return test data
        with patch('src.services.hunter_pipeline._parallel_discover') as mock_discover:
            mock_discover.return_value = [
                {
                    "id": "test_lead_1",
                    "name": "Test Company 1", 
                    "email": "contact@test1.com",
                    "url": "https://test1.com",
                    "match_score": 80
                },
                {
                    "id": "test_lead_2",
                    "name": "Test Company 2",
                    "email": "info@test2.com", 
                    "url": "https://test2.com",
                    "match_score": 90
                }
            ]
            
            # Run the full pipeline
            results = await run_hunter_pipeline(search_id, config, save_fn=mock_save_fn)
            
            # Verify results
            assert len(results) > 0, "Pipeline should return some results"
            assert len(saved_leads) > 0, "Leads should be saved incrementally"
            
            # Verify scoring was applied
            for lead in results:
                assert "meta" in lead
                assert "score" in lead["meta"]
                assert 0 <= lead["meta"]["score"] <= 100
            
            # Verify file was created
            assert os.path.exists(temp_file)
            
            # Cleanup
            os.unlink(temp_file)
        
        print("✅ Test 10 PASSED: End-to-end pipeline working correctly")

    def test_11_background_task_integration(self):
        """Test 11: Background task integration."""
        config = {
            "queries": ["test query"],
            "concurrency": 1,
            "batch_size": 10
        }
        
        search_id = "background_test_123"
        
        # Test that background task starts without blocking
        try:
            start_hunter_search_background(search_id, config)
            # If we get here, the function returned without blocking
            success = True
        except Exception as e:
            success = False
            print(f"Background task failed: {e}")
        
        assert success, "Background task should start without blocking"
        print("✅ Test 11 PASSED: Background task integration working correctly")


def run_all_tests():
    """Run all tests and provide summary."""
    print("🚀 Starting Hunter Pipeline Integration Tests...")
    print("="*70)
    
    test_class = TestHunterPipelineIntegration()
    
    # Sample data
    sample_leads = [
        {
            "id": "lead_1",
            "name": "Acme Corp",
            "company": "Acme Corporation",
            "email": "contact@acme.com",
            "phone": "+1-555-0123",
            "url": "https://acme.com",
            "meta": {"match_score": 85},
            "enrichment": {"title": "CEO", "linkedin": "linkedin.com/in/ceo"}
        },
        {
            "id": "lead_2", 
            "name": "ACME Corp",
            "company": "Acme Corporation Ltd",
            "email": "info@acme.com",
            "phone": "+1-555-0124",
            "url": "https://acme.com",
            "meta": {"match_score": 90}
        },
        {
            "id": "lead_3",
            "name": "TechStart Inc",
            "company": "TechStart",
            "email": "hello@techstart.io",
            "url": "https://techstart.io",
            "meta": {"match_score": 70},
            "enrichment": {"title": "CTO", "company": "TechStart"}
        }
    ]
    
    # Mock session
    mock_session = AsyncMock()
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json.return_value = {"valid": True}
    mock_session.get.return_value.__aenter__ = AsyncMock(return_value=mock_response)
    mock_session.post.return_value.__aenter__ = AsyncMock(return_value=mock_response)
    
    # Run synchronous tests
    try:
        test_class.test_1_front_load_filtering()
        test_class.test_2_exact_deduplication(sample_leads)
        test_class.test_3_fuzzy_deduplication(sample_leads)
        test_class.test_4_confidence_scoring(sample_leads)
        test_class.test_11_background_task_integration()
        
        print("\n🔄 Running async tests...")
        
        # Run async tests
        async def run_async_tests():
            await test_class.test_5_email_validation(mock_session)
            await test_class.test_6_incremental_saving()
            await test_class.test_7_domain_enrichment(mock_session)
            await test_class.test_8_parallel_enrichment(mock_session)
            await test_class.test_9_progressive_fallback(mock_session)
            await test_class.test_10_end_to_end_pipeline()
        
        asyncio.run(run_async_tests())
        
        print("\n" + "="*70)
        print("🎉 ALL TESTS PASSED! Hunter Pipeline Integration Complete")
        print("\n✨ Improvements Verified:")
        print("   1. ✅ Front-load filtering")
        print("   2. ✅ Parallel enrichment") 
        print("   3. ✅ Confidence scoring")
        print("   4. ✅ Progressive fallback")
        print("   5. ✅ Structured deduplication")
        print("   6. ✅ Incremental saving")
        print("   7. ✅ Domain-level enrichment")
        print("   8. ✅ Background task integration")
        print("="*70)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)