"""
Async version of Phase 1: Search with concurrent processing and real-time progress updates.
"""

import os
import json
import logging
import asyncio
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Callable
from dotenv import load_dotenv

from .utils.async_api_client import AsyncJinaClient, AsyncSearchOrchestrator, RateLimiter
from .utils.query_builder import format_query_with_deepseek, fallback_format_query

logger = logging.getLogger(__name__)

# Load environment variables
backend_env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(backend_env_path)

# Configuration
SEARCH_RESULTS_FILE = "data/search_results.json"
MAX_RETRIES = 3
MAX_SEARCH_ITERATIONS = 20
TARGET_RESULTS = 1000
MAX_PAGES_PER_QUERY = 5
MIN_PAGES_PER_QUERY = 2
MAX_CONCURRENT_REQUESTS = 5
DEBUG_SEARCH = os.getenv("DEBUG_SEARCH", "false").lower() == "true"

# API Keys
JINA_API_KEY = os.getenv("JINA_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class Phase1SearchAsync:
    """Async implementation of phase 1 search with progress tracking."""
    
    def __init__(self, progress_callback: Optional[Callable] = None):
        """
        Initialize async search.
        
        Args:
            progress_callback: Async callback for progress updates
        """
        self.progress_callback = progress_callback
        self.rate_limiter = RateLimiter(rate=5.0, burst=10)
        self.results = []
        self.seen_urls = set()
        self.search_stats = {
            "queries_processed": 0,
            "total_queries": 0,
            "results_found": 0,
            "api_calls": 0,
            "cache_hits": 0,
            "errors": 0,
            "start_time": None,
            "end_time": None
        }
    
    async def update_progress(self, message: str, progress: int = None, 
                            stage: str = None, stats: Dict = None):
        """Send progress update via callback."""
        if self.progress_callback:
            update = {
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            if progress is not None:
                update["progress"] = progress
            if stage:
                update["stage"] = stage
            if stats:
                update["stats"] = stats
            
            await self.progress_callback(update)
            logger.info(f"Progress update: {message} ({progress}%)")
    
    def save_results(self, results: List[Dict], append: bool = True):
        """Save results to file with deduplication."""
        try:
            Path("data").mkdir(exist_ok=True)
            
            existing_results = []
            if append and os.path.exists(SEARCH_RESULTS_FILE):
                try:
                    with open(SEARCH_RESULTS_FILE, 'r') as f:
                        data = json.load(f)
                        existing_results = data.get("results", [])
                except Exception as e:
                    logger.warning(f"Error loading existing results: {e}")
            
            # Combine and deduplicate
            all_results = existing_results + results
            unique_results = []
            seen = set()
            
            for result in all_results:
                url = result.get("link", "")
                if url and url not in seen:
                    seen.add(url)
                    unique_results.append(result)
            
            # Save
            with open(SEARCH_RESULTS_FILE, 'w') as f:
                json.dump({"results": unique_results}, f, indent=2)
            
            logger.info(f"Saved {len(unique_results)} unique results")
            return True
            
        except Exception as e:
            logger.error(f"Error saving results: {e}")
            return False
    
    async def generate_search_queries(self, base_queries: List[str], 
                                    search_config: Dict = None) -> List[str]:
        """Generate formatted search queries from base queries."""
        all_queries = []
        
        await self.update_progress("Generating search queries...", progress=5)
        
        for base_query in base_queries:
            # Format query using AI
            try:
                if DEEPSEEK_API_KEY or OPENAI_API_KEY:
                    formatted = format_query_with_deepseek(base_query)
                else:
                    formatted = fallback_format_query(base_query)
                
                all_queries.extend(formatted)
            except Exception as e:
                logger.error(f"Error formatting query: {e}")
                all_queries.append(base_query)
        
        # Add location and industry variations if provided
        if search_config:
            location = search_config.get("location", "")
            industry = search_config.get("industry", "")
            keywords = search_config.get("keywords", "")
            
            if location and industry:
                all_queries.extend([
                    f"{industry} companies in {location}",
                    f"{industry} businesses {location} contact information",
                    f"list of {industry} companies {location} email phone"
                ])
            
            if keywords:
                all_queries.extend([
                    f"{keywords} {location}",
                    f"{keywords} companies contact details"
                ])
        
        # Remove duplicates while preserving order
        unique_queries = []
        seen = set()
        for q in all_queries:
            if q not in seen:
                seen.add(q)
                unique_queries.append(q)
        
        await self.update_progress(
            f"Generated {len(unique_queries)} unique search queries",
            progress=10
        )
        
        return unique_queries
    
    async def search_with_exclusions(self, client: AsyncJinaClient, 
                                   query: str, excluded_domains: set,
                                   max_pages: int = 5) -> List[Dict]:
        """Search with domain exclusions."""
        results = []
        
        # Add exclusions to query (Jina doesn't support -site: operator)
        # So we'll filter results instead
        for page in range(1, max_pages + 1):
            try:
                response = await client.search(query, page=page)
                page_results = response.get("organic_results", [])
                
                # Filter out excluded domains
                filtered_results = []
                for result in page_results:
                    url = result.get("link", "")
                    domain = self.extract_domain(url)
                    
                    if domain not in excluded_domains:
                        filtered_results.append(result)
                
                results.extend(filtered_results)
                
                if not filtered_results:
                    break  # No more unique results
                    
            except Exception as e:
                logger.error(f"Error searching page {page}: {e}")
                break
        
        return results
    
    def extract_domain(self, url: str) -> str:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except:
            return ""
    
    async def run_async(self, search_query: str = "", max_pages: int = 20,
                       custom_queries: List[str] = None, append_mode: bool = False,
                       single_query: bool = True, search_config: Dict = None) -> List[Dict]:
        """
        Run async phase 1 search with progress tracking.
        
        Args:
            search_query: Base search query
            max_pages: Max pages per query
            custom_queries: Custom queries to use
            append_mode: Whether to append to existing results
            single_query: Whether to run only one query
            search_config: Full search configuration
            
        Returns:
            List of search results
        """
        self.search_stats["start_time"] = datetime.now()
        
        try:
            # Initialize
            if not append_mode and os.path.exists(SEARCH_RESULTS_FILE):
                os.remove(SEARCH_RESULTS_FILE)
            
            await self.update_progress("Initializing search...", progress=0, stage="Phase 1: Search")
            
            # Generate queries
            if custom_queries:
                queries = custom_queries
            else:
                base_queries = [
                    "finance companies affiliate programs",
                    "mortgage broker partner programs",
                    "credit broker affiliate opportunities"
                ] if not search_query else [search_query]
                
                queries = await self.generate_search_queries(base_queries, search_config)
            
            self.search_stats["total_queries"] = len(queries)
            
            # Initialize Jina client
            if not JINA_API_KEY:
                await self.update_progress("Error: Jina API key not configured", progress=0)
                return []
            
            async with AsyncJinaClient(
                api_key=JINA_API_KEY,
                rate_limiter=self.rate_limiter,
                debug=DEBUG_SEARCH
            ) as client:
                
                # Create orchestrator
                orchestrator = AsyncSearchOrchestrator(client)
                
                # Progress callback for orchestrator
                async def orchestrator_progress(update):
                    progress = 10 + int(update.get("progress", 0) * 0.8)  # 10-90%
                    await self.update_progress(
                        f"Processing queries: {update.get('processed', 0)}/{update.get('total', 0)}",
                        progress=progress,
                        stats={
                            "results_found": update.get("results_found", 0),
                            "queries_processed": update.get("processed", 0)
                        }
                    )
                
                # Execute searches
                results = await orchestrator.search_with_progress(
                    queries=queries,
                    progress_callback=orchestrator_progress,
                    max_results=TARGET_RESULTS
                )
                
                self.results = results
                self.search_stats["results_found"] = len(results)
                self.search_stats["queries_processed"] = orchestrator.processed_queries
                
                # Save results
                await self.update_progress("Saving results...", progress=95)
                self.save_results(results, append=append_mode)
                
                # Final update
                self.search_stats["end_time"] = datetime.now()
                duration = (self.search_stats["end_time"] - self.search_stats["start_time"]).total_seconds()
                
                await self.update_progress(
                    f"Search completed: {len(results)} results found",
                    progress=100,
                    stats={
                        "total_results": len(results),
                        "duration_seconds": duration,
                        "queries_processed": self.search_stats["queries_processed"]
                    }
                )
                
                return results
                
        except Exception as e:
            logger.error(f"Search failed: {e}")
            await self.update_progress(f"Search failed: {str(e)}", progress=0)
            raise
    
    def run(self, **kwargs) -> List[Dict]:
        """Synchronous wrapper for async run."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.run_async(**kwargs))
        finally:
            loop.close()

# Module-level run function for backward compatibility
async def run_async(search_query="", max_pages=20, custom_queries=None, 
                   append_mode=False, single_query=True, search_config=None,
                   progress_callback=None):
    """Run phase 1 search asynchronously."""
    search = Phase1SearchAsync(progress_callback=progress_callback)
    return await search.run_async(
        search_query=search_query,
        max_pages=max_pages,
        custom_queries=custom_queries,
        append_mode=append_mode,
        single_query=single_query,
        search_config=search_config
    )

def run(search_query="", max_pages=20, custom_queries=None, 
        append_mode=False, single_query=True, search_config=None):
    """Run phase 1 search (backward compatible)."""
    search = Phase1SearchAsync()
    return search.run(
        search_query=search_query,
        max_pages=max_pages,
        custom_queries=custom_queries,
        append_mode=append_mode,
        single_query=single_query,
        search_config=search_config
    )

if __name__ == "__main__":
    # Test async search
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run test
    results = run()
    print(f"Found {len(results)} results")