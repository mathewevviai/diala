"""
Unified Jina AI client for Search and Reader APIs with async support.
"""

import os
import json
import asyncio
import aiohttp
import logging
import time
import psutil
import socket
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
import urllib.parse
from pathlib import Path
from aiohttp import TCPConnector, ClientTimeout
try:
    from aiohttp.resolver import AsyncResolver
    ASYNC_RESOLVER_AVAILABLE = True
except ImportError:
    ASYNC_RESOLVER_AVAILABLE = False

logger = logging.getLogger(__name__)

# Configure verbose logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)


class RateLimiter:
    """Token bucket rate limiter for API requests."""
    
    def __init__(self, rate: float = 10.0, burst: int = 20, name: str = "default"):
        self.rate = rate
        self.burst = burst
        self.tokens = burst
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()
        self.name = name
        self.total_requests = 0
        self.total_wait_time = 0.0
        logger.info(f"RateLimiter '{name}' initialized: rate={rate} req/sec ({rate*60} RPM), burst={burst}")
    
    async def acquire(self, tokens: int = 1) -> float:
        """Acquire tokens, waiting if necessary."""
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
            self.last_update = now
            
            self.total_requests += 1
            logger.debug(f"RateLimiter '{self.name}': tokens available={self.tokens:.2f}, requesting={tokens}")
            
            if self.tokens < tokens:
                wait_time = (tokens - self.tokens) / self.rate
                self.total_wait_time += wait_time
                logger.warning(f"RateLimiter '{self.name}': Rate limit hit! Waiting {wait_time:.2f}s (total wait: {self.total_wait_time:.2f}s)")
                await asyncio.sleep(wait_time)
                self.tokens = tokens
                return wait_time
            
            self.tokens -= tokens
            logger.debug(f"RateLimiter '{self.name}': Tokens consumed, remaining={self.tokens:.2f}")
            return 0.0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get rate limiter statistics."""
        return {
            "name": self.name,
            "total_requests": self.total_requests,
            "total_wait_time": self.total_wait_time,
            "current_tokens": self.tokens,
            "rate": self.rate,
            "burst": self.burst
        }


class JinaClient:
    """Unified client for Jina Search and Reader APIs."""
    
    def __init__(self, api_key: str, max_concurrent: int = 5):
        self.api_key = api_key
        self.search_base_url = "https://s.jina.ai"
        self.reader_base_url = "https://r.jina.ai"
        self.max_concurrent = max_concurrent
        
        # Separate rate limiters for each API
        # Search API: 100 RPM = 1.67 requests/second
        self.search_rate_limiter = RateLimiter(rate=1.67, burst=5, name="search")
        # Reader API: 500 RPM = 8.33 requests/second  
        self.reader_rate_limiter = RateLimiter(rate=8.33, burst=20, name="reader")
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        # Statistics
        self.stats = {
            "search_calls": 0,
            "reader_calls": 0,
            "search_errors": 0,
            "reader_errors": 0,
            "dns_errors": 0,
            "rate_limit_waits": 0,
            "total_results": 0,
            "active_connections": 0,
            "start_time": datetime.now()
        }
        
        logger.info(f"JinaClient initialized: max_concurrent={max_concurrent}")
        self._log_system_info()
    
    def _log_system_info(self):
        """Log system information for debugging."""
        try:
            process = psutil.Process()
            logger.info(f"System info: CPU={psutil.cpu_percent()}%, Memory={psutil.virtual_memory().percent}%, " 
                       f"Process connections={len(process.connections())}, Open files={len(process.open_files())}")
        except Exception as e:
            logger.debug(f"Could not get system info: {e}")
    
    async def __aenter__(self):
        """Async context manager entry."""
        # Create custom connector with connection pooling and DNS caching
        connector_kwargs = {
            "limit": self.max_concurrent,  # Total connection pool limit
            "limit_per_host": self.max_concurrent,  # Per-host limit
            "ttl_dns_cache": 300,  # DNS cache for 5 minutes
            "use_dns_cache": True,
            "force_close": True
        }
        
        # Only use AsyncResolver if available
        if ASYNC_RESOLVER_AVAILABLE:
            try:
                connector_kwargs["resolver"] = AsyncResolver()
                logger.info("Using AsyncResolver for DNS resolution")
            except Exception as e:
                logger.warning(f"AsyncResolver initialization failed: {e}. Using default resolver.")
        else:
            logger.warning("aiodns not installed. Using default resolver. Install with: pip install aiodns")
        
        connector = TCPConnector(**connector_kwargs)
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=ClientTimeout(total=45, connect=10, sock_read=30)
        )
        
        logger.info("HTTP session created with connection pooling and DNS caching")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
            logger.info("HTTP session closed")
        
        # Log final statistics
        self._log_final_stats()
    
    async def search(self, query: str, page: int = 1) -> Dict[str, Any]:
        """
        Search using Jina Search API.
        
        Args:
            query: Search query
            page: Page number (1-based)
            
        Returns:
            Search results dict
        """
        async with self.semaphore:
            self.stats["active_connections"] += 1
            logger.debug(f"Acquiring semaphore for search (active: {self.stats['active_connections']}/{self.max_concurrent})")
            
            # Rate limiting for search API
            wait_time = await self.search_rate_limiter.acquire()
            if wait_time > 0:
                self.stats["rate_limit_waits"] += 1
            
            self.stats["search_calls"] += 1
            request_start = time.time()
            
            try:
                # Prepare request
                encoded_query = urllib.parse.quote(query)
                url = f"{self.search_base_url}/?q={encoded_query}"
                if page > 1:
                    url += f"&page={page}"
                
                headers = {
                    "Accept": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                    "X-Engine": "auto"  # Use auto mode for better results
                }
                
                logger.info(f"[SEARCH {self.stats['search_calls']}] Query: '{query}' (page {page})")
                
                # Make request with DNS resolution logging
                try:
                    # Log DNS resolution
                    logger.debug(f"Resolving DNS for {self.search_base_url}")
                    
                    async with self.session.get(url, headers=headers) as response:
                        response_time = time.time() - request_start
                        logger.info(f"[SEARCH RESPONSE] Status={response.status}, Time={response_time:.2f}s")
                        response_text = await response.text()
                    
                    if response.status != 200:
                        logger.error(f"Jina search error: {response.status} - {response_text[:500]}")
                        self.stats["search_errors"] += 1
                        return {"error": f"HTTP {response.status}", "results": []}
                    
                    # Log raw response for debugging
                    logger.debug(f"[RAW RESPONSE] First 500 chars: {response_text[:500]}")
                    
                    # Parse response
                    try:
                        data = json.loads(response_text)
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON response: {response_text[:200]}...")
                        self.stats["search_errors"] += 1
                        return {"error": "Invalid JSON", "results": []}
                    
                    # Extract results - Jina API returns {code: 200, status: 20000, data: [...]}
                    if (data.get("code") == 200 or data.get("status") == 20000) and "data" in data:
                        results = data["data"]
                        self.stats["total_results"] += len(results)
                        
                        # Format results
                        formatted_results = []
                        for i, result in enumerate(results):
                            formatted_results.append({
                                "position": i + 1 + (page - 1) * 10,
                                "title": result.get("title", ""),
                                "url": result.get("url", ""),
                                "link": result.get("url", ""),  # Also store as 'link' for compatibility
                                "description": result.get("description", ""),
                                "content": result.get("content", "")  # Sometimes included
                            })
                        
                        logger.info(f"[SEARCH SUCCESS] Found {len(formatted_results)} results for '{query}' (page {page})")
                        
                        # Log sample result for debugging
                        if formatted_results:
                            logger.debug(f"[RESULT SAMPLE] First result: URL={formatted_results[0].get('url')[:80]}, Title={formatted_results[0].get('title')[:50]}")
                        
                        return {"results": formatted_results, "error": None}
                    else:
                        logger.error(f"Unexpected response format. Keys: {list(data.keys())}, code: {data.get('code')}, status: {data.get('status')}")
                        logger.debug(f"Response sample: {json.dumps(data, indent=2)[:500]}...")
                        self.stats["search_errors"] += 1
                        return {"error": "Unexpected format", "results": []}
                        
                except aiohttp.ClientConnectorError as e:
                    self.stats["dns_errors"] += 1
                    logger.error(f"[DNS ERROR] Failed to resolve {self.search_base_url}: {str(e)}")
                    return {"error": f"DNS resolution failed: {str(e)}", "results": []}
                        
            except asyncio.TimeoutError:
                elapsed = time.time() - request_start
                logger.error(f"[TIMEOUT] Search timeout after {elapsed:.2f}s for query: {query}")
                self.stats["search_errors"] += 1
                return {"error": "Timeout", "results": []}
            except Exception as e:
                elapsed = time.time() - request_start
                logger.error(f"[ERROR] Search failed after {elapsed:.2f}s for '{query}': {str(e)}")
                self.stats["search_errors"] += 1
                return {"error": str(e), "results": []}
            finally:
                self.stats["active_connections"] -= 1
                logger.debug(f"Released semaphore (active: {self.stats['active_connections']}/{self.max_concurrent})")
        
        # This should never be reached, but just in case
        logger.error(f"[CRITICAL] search() reached end without returning - returning empty results")
        return {"error": "Unexpected code path", "results": []}
    
    async def read_url(self, url: str) -> Dict[str, Any]:
        """
        Extract content from URL using Jina Reader API.
        
        Args:
            url: URL to extract content from
            
        Returns:
            Extracted content dict
        """
        async with self.semaphore:
            self.stats["active_connections"] += 1
            logger.debug(f"Acquiring semaphore for reader (active: {self.stats['active_connections']}/{self.max_concurrent})")
            
            # Rate limiting for reader API
            wait_time = await self.reader_rate_limiter.acquire()
            if wait_time > 0:
                self.stats["rate_limit_waits"] += 1
            
            self.stats["reader_calls"] += 1
            request_start = time.time()
            
            try:
                # Prepare request
                # Prefer POST for hash-based routes so the fragment is included
                headers = {
                    "Accept": "application/json",
                    "X-Return-Format": "json",
                    "X-With-Content": "true",
                    "X-With-Links": "true",
                    "X-With-Links-Summary": "all",
                    # Allow some time for SPAs to render main content
                    "x-timeout": "10",
                    # Heuristic wait for main content container
                    "x-wait-for-selector": "main",
                }
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                logger.info(f"[READER {self.stats['reader_calls']}] URL: {url[:100]}...")
                
                # Make request with DNS resolution logging
                logger.debug(f"Resolving DNS for {self.reader_base_url}")
                if "#" in url:
                    # POST form with url field to include the hash fragment
                    async with self.session.post(self.reader_base_url + "/", data={"url": url}, headers=headers) as response:
                        response_time = time.time() - request_start
                        logger.info(f"[READER RESPONSE] Status={response.status}, Time={response_time:.2f}s")
                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"[READER ERROR] HTTP {response.status} for {url}: {error_text[:200]}")
                            self.stats["reader_errors"] += 1
                            return {
                                "url": url,
                                "error": f"HTTP {response.status}",
                                "success": False
                            }
                        try:
                            data = await response.json()
                        except:
                            content = await response.text()
                            data = {"content": content}
                else:
                    reader_url = f"{self.reader_base_url}/{url}"
                    async with self.session.get(reader_url, headers=headers) as response:
                        response_time = time.time() - request_start
                        logger.info(f"[READER RESPONSE] Status={response.status}, Time={response_time:.2f}s")
                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"[READER ERROR] HTTP {response.status} for {url}: {error_text[:200]}")
                            self.stats["reader_errors"] += 1
                            return {
                                "url": url,
                                "error": f"HTTP {response.status}",
                                "success": False
                            }
                        
                        # Parse response
                        try:
                            data = await response.json()
                        except:
                            # Sometimes returns plain text
                            content = await response.text()
                            data = {"content": content}
                        
                        # Extract data
                        result = {
                            "url": url,
                            "title": data.get("title", ""),
                            "content": data.get("content", ""),
                            "description": data.get("description", ""),
                            "publishedTime": data.get("publishedTime"),
                            "metadata": data.get("metadata", {}),
                            "success": True,
                            "extracted_at": datetime.now().isoformat()
                        }
                        
                        # Extract contact info if present
                        content_lower = result["content"].lower()
                        
                        # Simple email extraction
                        import re
                        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
                        emails = list(set(re.findall(email_pattern, result["content"])) )
                        # Also parse links for mailto:
                        try:
                            links = data.get("links", []) or []
                            mailtos = [l.get("href", "") for l in links if isinstance(l, dict) and l.get("href", "").startswith("mailto:")]
                            emails.extend([m.replace("mailto:", "").strip() for m in mailtos if m])
                            emails = list(set(emails))
                        except Exception:
                            pass
                        
                        # Phone extraction (expanded for UK/EU formatting)
                        # Strategy: apply multiple regex patterns and then normalize
                        phone_patterns = [
                            # US/Canada: 123-456-7890 or (123) 456-7890 or 123 456 7890
                            r'\b(?:\+1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b',
                            # UK mobile and landline variants (allow varied spacing):
                            r'\b(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}\b',
                            r'\b(?:\+44\s?\d{2,4}|0\d{2,4})[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b',
                            # Generic international: +CC (area) xxxx xxxx with flexible grouping
                            r'\b\+\d{1,3}[\s.-]?(?:\(\d{1,4}\)[\s.-]?)?(?:\d[\s.-]?){6,12}\b',
                            # Fallback: 10-12 digits with spaces/dots (avoid matching years etc by requiring separators)
                            r'\b\d{2,4}[\s.-]\d{2,4}[\s.-]\d{3,5}\b'
                        ]
                        raw_phones = []
                        for pattern in phone_patterns:
                            raw_phones.extend(re.findall(pattern, result["content"]))
                        # Normalize: collapse whitespace/dots/dashes, keep leading + if present
                        def normalize_phone(p: str) -> str:
                            p = p.strip()
                            prefix = '+' if p.startswith('+') else ''
                            digits = ''.join(ch for ch in p if ch.isdigit())
                            # Reinsert + if originally present
                            return prefix + digits
                        normalized = [normalize_phone(p) for p in raw_phones]
                        # Filter plausible lengths (10-14 digits after normalization)
                        phones = []
                        for p in normalized:
                            nd = len(p.lstrip('+'))
                            if 9 <= nd <= 14:
                                phones.append(p)
                        phones = list(dict.fromkeys(phones))  # dedupe preserve order
                        
                        result["extracted_data"] = {
                            "emails": emails[:5],  # Limit to 5
                            "phones": phones[:5],
                            "has_contact_form": "contact" in content_lower and "form" in content_lower,
                            "has_email": len(emails) > 0,
                            "has_phone": len(phones) > 0
                        }
                        
                        return result
                    
            except asyncio.TimeoutError:
                elapsed = time.time() - request_start
                logger.error(f"[TIMEOUT] Reader timeout after {elapsed:.2f}s for URL: {url}")
                self.stats["reader_errors"] += 1
                return {"url": url, "error": "Timeout", "success": False}
            except Exception as e:
                elapsed = time.time() - request_start
                logger.error(f"[ERROR] Reader failed after {elapsed:.2f}s for {url}: {str(e)}")
                self.stats["reader_errors"] += 1
                return {"url": url, "error": str(e), "success": False}
            finally:
                self.stats["active_connections"] -= 1
                logger.debug(f"Released semaphore (active: {self.stats['active_connections']}/{self.max_concurrent})")
    
    async def search_multiple(self, queries: List[str], pages_per_query: int = 2) -> List[Dict[str, Any]]:
        """
        Search multiple queries in parallel.
        
        Args:
            queries: List of search queries
            pages_per_query: Number of pages to fetch per query
            
        Returns:
            Combined list of all results
        """
        tasks = []
        for query in queries:
            for page in range(1, pages_per_query + 1):
                tasks.append(self.search(query, page))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine all results
        all_results = []
        seen_urls = set()
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Search task {i} failed: {result}")
                continue
            
            if result is None:
                logger.error(f"Search task {i} returned None")
                continue
            
            if result.get("error"):
                logger.debug(f"Search task {i} had error: {result.get('error')}")
                continue
                
            task_results = result.get("results", [])
            logger.debug(f"Search task {i} returned {len(task_results)} results")
            
            for item in task_results:
                url = item.get("url")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(item)
        
        logger.info(f"[SEARCH MULTIPLE] Combined {len(all_results)} unique results from {len(results)} searches")
        return all_results
    
    async def read_urls(self, urls: List[str], progress_callback: Optional[Callable] = None) -> List[Dict[str, Any]]:
        """
        Read multiple URLs in parallel with progress updates.
        
        Args:
            urls: List of URLs to read
            progress_callback: Optional callback for progress updates
            
        Returns:
            List of extracted content
        """
        total = len(urls)
        completed = 0
        results = []
        
        # Process in smaller batches to avoid overwhelming the API
        # Reduce batch size to prevent DNS overload
        batch_size = min(3, self.max_concurrent)  # Max 3 concurrent reads
        
        logger.info(f"[BATCH READER] Processing {total} URLs in batches of {batch_size}")
        self._log_system_info()
        
        for i in range(0, total, batch_size):
            batch = urls[i:i + batch_size]
            batch_num = i // batch_size + 1
            logger.info(f"[BATCH {batch_num}] Processing URLs {i+1}-{min(i+batch_size, total)} of {total}")
            
            tasks = [self.read_url(url) for url in batch]
            
            batch_start = time.time()
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            batch_time = time.time() - batch_start
            
            logger.info(f"[BATCH {batch_num}] Completed in {batch_time:.2f}s")
            
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"Read task failed: {result}")
                    results.append({"error": str(result), "success": False})
                elif result is None:
                    logger.error(f"Read task returned None")
                    results.append({"error": "Result was None", "success": False})
                else:
                    results.append(result)
                
                completed += 1
                
                if progress_callback:
                    await progress_callback({
                        "stage": "content_extraction",
                        "completed": completed,
                        "total": total,
                        "percentage": int((completed / total) * 100)
                    })
        
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Get client statistics."""
        stats = self.stats.copy()
        
        # Calculate success rates
        total_search = stats["search_calls"]
        if total_search > 0:
            stats["search_success_rate"] = 1 - (stats["search_errors"] / total_search)
        else:
            stats["search_success_rate"] = 0
            
        total_reader = stats["reader_calls"]
        if total_reader > 0:
            stats["reader_success_rate"] = 1 - (stats["reader_errors"] / total_reader)
        else:
            stats["reader_success_rate"] = 0
        
        return stats
    
    def _log_final_stats(self):
        """Log final statistics on exit."""
        runtime = (datetime.now() - self.stats["start_time"]).total_seconds()
        
        logger.info("="*60)
        logger.info("JinaClient Final Statistics:")
        logger.info(f"  Runtime: {runtime:.2f}s")
        logger.info(f"  Search API calls: {self.stats['search_calls']} (errors: {self.stats['search_errors']})")
        logger.info(f"  Reader API calls: {self.stats['reader_calls']} (errors: {self.stats['reader_errors']})")
        logger.info(f"  DNS errors: {self.stats['dns_errors']}")
        logger.info(f"  Total results: {self.stats['total_results']}")
        logger.info(f"  Rate limit waits: {self.stats['rate_limit_waits']}")
        
        # Log rate limiter stats
        search_stats = self.search_rate_limiter.get_stats()
        reader_stats = self.reader_rate_limiter.get_stats()
        logger.info(f"  Search rate limiter: {search_stats['total_requests']} requests, {search_stats['total_wait_time']:.2f}s wait time")
        logger.info(f"  Reader rate limiter: {reader_stats['total_requests']} requests, {reader_stats['total_wait_time']:.2f}s wait time")
        logger.info("="*60)