"""
Async API client for concurrent API requests with rate limiting and retry logic.
"""

import asyncio
import aiohttp
import time
import json
import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
import hashlib
from pathlib import Path
import os

logger = logging.getLogger(__name__)

class RateLimiter:
    """Token bucket rate limiter for API requests."""
    
    def __init__(self, rate: float = 10.0, burst: int = 20):
        """
        Initialize rate limiter.
        
        Args:
            rate: Requests per second
            burst: Maximum burst size
        """
        self.rate = rate
        self.burst = burst
        self.tokens = burst
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()
    
    async def acquire(self, tokens: int = 1) -> float:
        """
        Acquire tokens, waiting if necessary.
        
        Returns:
            Wait time in seconds
        """
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
            self.last_update = now
            
            if self.tokens < tokens:
                wait_time = (tokens - self.tokens) / self.rate
                await asyncio.sleep(wait_time)
                self.tokens = tokens
                return wait_time
            
            self.tokens -= tokens
            return 0.0

class AsyncJinaClient:
    """Async client for Jina AI Search API with rate limiting and caching."""
    
    def __init__(self, api_key: str, rate_limiter: Optional[RateLimiter] = None,
                 cache_dir: str = "data/cache", debug: bool = False):
        self.api_key = api_key
        self.base_url = "https://s.jina.ai"
        self.rate_limiter = rate_limiter or RateLimiter(rate=5.0, burst=10)
        self.cache_dir = cache_dir
        self.debug = debug
        self.session: Optional[aiohttp.ClientSession] = None
        self._cache = {}
        
        # Create cache directory
        Path(cache_dir).mkdir(parents=True, exist_ok=True)
        
        # Load cache from disk
        self._load_cache()
    
    def _load_cache(self):
        """Load cache from disk."""
        cache_file = os.path.join(self.cache_dir, "jina_cache.json")
        try:
            if os.path.exists(cache_file):
                with open(cache_file, 'r') as f:
                    self._cache = json.load(f)
                logger.info(f"Loaded {len(self._cache)} cached queries")
        except Exception as e:
            logger.warning(f"Could not load cache: {e}")
            self._cache = {}
    
    def _save_cache(self):
        """Save cache to disk."""
        cache_file = os.path.join(self.cache_dir, "jina_cache.json")
        try:
            with open(cache_file, 'w') as f:
                json.dump(self._cache, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save cache: {e}")
    
    def _get_cache_key(self, query: str, page: int) -> str:
        """Generate cache key for a query."""
        return hashlib.md5(f"{query}:{page}".encode()).hexdigest()
    
    async def __aenter__(self):
        """Enter async context."""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context."""
        if self.session:
            await self.session.close()
        self._save_cache()
    
    async def search(self, query: str, page: int = 1, 
                     retry_count: int = 3,
                     progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """
        Search using Jina AI with retry and rate limiting.
        
        Args:
            query: Search query
            page: Page number
            retry_count: Number of retries on failure
            progress_callback: Optional callback for progress updates
            
        Returns:
            Search results
        """
        # Check cache first
        cache_key = self._get_cache_key(query, page)
        if cache_key in self._cache:
            logger.info(f"Cache hit for query: {query[:50]}...")
            return self._cache[cache_key]
        
        # Rate limiting
        wait_time = await self.rate_limiter.acquire()
        if wait_time > 0:
            logger.info(f"Rate limited, waited {wait_time:.2f}s")
        
        url = f"{self.base_url}/?q={query}&page={page}"
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "X-Respond-With": "no-content"
        }
        
        for attempt in range(retry_count):
            try:
                if progress_callback:
                    await progress_callback(f"Searching: {query[:50]}... (attempt {attempt + 1})")
                
                async with self.session.get(url, headers=headers, timeout=30) as response:
                    if response.status == 429:  # Rate limited
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"Rate limited by API, waiting {retry_after}s")
                        await asyncio.sleep(retry_after)
                        continue
                    
                    response.raise_for_status()
                    data = await response.json()
                    
                    if data.get("code") != 200:
                        logger.error(f"Jina API error: {data}")
                        if attempt < retry_count - 1:
                            await asyncio.sleep(2 ** attempt)  # Exponential backoff
                            continue
                        return {"organic_results": []}
                    
                    # Format results
                    results = self._format_results(data.get("data", []))
                    
                    # Cache successful results
                    self._cache[cache_key] = {"organic_results": results}
                    
                    return {"organic_results": results}
                    
            except asyncio.TimeoutError:
                logger.error(f"Timeout for query: {query}")
                if attempt < retry_count - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                    
            except Exception as e:
                logger.error(f"Error searching: {e}")
                if attempt < retry_count - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
        
        return {"organic_results": []}
    
    def _format_results(self, raw_results: List[Dict]) -> List[Dict]:
        """Format Jina results to expected structure."""
        formatted = []
        for i, result in enumerate(raw_results):
            formatted.append({
                "position": i + 1,
                "title": result.get("title", ""),
                "link": result.get("url", ""),
                "snippet": result.get("description", "")
            })
        return formatted
    
    async def search_multiple(self, queries: List[str], 
                            max_concurrent: int = 5,
                            progress_callback: Optional[Callable] = None) -> List[Dict]:
        """
        Search multiple queries concurrently.
        
        Args:
            queries: List of search queries
            max_concurrent: Maximum concurrent requests
            progress_callback: Optional callback for progress updates
            
        Returns:
            List of search results
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def search_with_semaphore(query: str, index: int) -> Dict:
            async with semaphore:
                if progress_callback:
                    await progress_callback(f"Query {index + 1}/{len(queries)}: {query[:50]}...")
                return await self.search(query)
        
        tasks = [
            search_with_semaphore(query, i) 
            for i, query in enumerate(queries)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Query {i} failed: {result}")
                valid_results.append({"organic_results": []})
            else:
                valid_results.append(result)
        
        return valid_results

class AsyncSearchOrchestrator:
    """Orchestrate concurrent searches with progress tracking."""
    
    def __init__(self, jina_client: AsyncJinaClient):
        self.client = jina_client
        self.progress = 0
        self.total_queries = 0
        self.processed_queries = 0
        self.results = []
        self.seen_urls = set()
        
    async def search_with_progress(self, queries: List[str], 
                                 progress_callback: Optional[Callable] = None,
                                 max_results: int = 1000) -> List[Dict]:
        """
        Execute searches with progress tracking.
        
        Args:
            queries: List of search queries
            progress_callback: Callback for progress updates
            max_results: Maximum results to collect
            
        Returns:
            Aggregated unique results
        """
        self.total_queries = len(queries)
        self.processed_queries = 0
        self.results = []
        self.seen_urls = set()
        
        # Process queries in batches
        batch_size = 5
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i + batch_size]
            
            # Update progress
            self.progress = int((i / len(queries)) * 100)
            if progress_callback:
                await progress_callback({
                    "progress": self.progress,
                    "processed": i,
                    "total": len(queries),
                    "results_found": len(self.results)
                })
            
            # Search batch concurrently
            batch_results = await self.client.search_multiple(batch)
            
            # Aggregate results
            for query_results in batch_results:
                for result in query_results.get("organic_results", []):
                    url = result.get("link", "")
                    if url and url not in self.seen_urls:
                        self.seen_urls.add(url)
                        self.results.append(result)
                        
                        if len(self.results) >= max_results:
                            return self.results
            
            self.processed_queries += len(batch)
        
        return self.results