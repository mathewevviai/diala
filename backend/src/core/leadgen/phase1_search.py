"""
Phase 1: Search for FCA-approved finance companies using a search API.

This module uses a search API to find FCA-approved finance companies
with broker/affiliate programs and saves the results to a JSON file.
"""

import os
import json
import logging
import requests
import urllib.parse
import time
import random
import http.client
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv  # Make sure python-dotenv is installed
import hashlib
from typing import List, Dict, Optional, Callable, Any
import threading
from collections import deque
import redis
from functools import wraps

logger = logging.getLogger(__name__)

# ===== SEARCH CONFIGURATION =====
# File to save search results
SEARCH_RESULTS_FILE = "data/search_results.json"

# Number of search API request retries
MAX_RETRIES = 3

# Number of search iterations to perform with each base query
MAX_SEARCH_ITERATIONS = 20  # Maximum number of iterations per base query

# Target number of results to find before stopping
TARGET_RESULTS = 1000  # Stop when we have this many results

# Maximum number of search result pages to process per query
MAX_PAGES_PER_QUERY = 5  # How many pages to check for each query (reduced for speed)

# Minimum number of pages to process per query before considering stopping
MIN_PAGES_PER_QUERY = 2  # Always check at least this many pages per query

# Maximum number of site prefixes to exclude in a single query (reduced for broader results per iteration)
MAX_EXCLUSIONS = 7

# Maximum length of the full query string (including exclusions)
MAX_QUERY_LENGTH = 2048

def extract_domain(url):
    """
    Extract the domain from a URL.
    
    Args:
        url (str): The URL to extract the domain from
        
    Returns:
        str: The extracted domain
    """
    try:
        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc
        
        # Remove www. prefix if present
        if domain.startswith('www.'):
            domain = domain[4:]
            
        return domain
    except Exception as e:
        logger.error(f"Error extracting domain from {url}: {e}")
        return ""

# Helper to extract scheme://netloc/ prefix for exclusion operators
def extract_site_prefix(url):
    """
    Extract scheme://netloc/ prefix from a URL for exclusion.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        scheme = parsed.scheme or "https"
        netloc = parsed.netloc
        return f"{scheme}://{netloc}/"
    except Exception as e:
        logger.error(f"Error extracting site prefix from {url}: {e}")
        return ""

# Load environment variables
# First load backend .env
backend_env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(backend_env_path)

# Then load frontend .env.local for additional configs
frontend_env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(frontend_env_path)

# Get API keys from environment
JINA_API_KEY = os.getenv("JINA_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Debug mode for detailed logging
DEBUG_SEARCH = os.getenv("DEBUG_SEARCH", "false").lower() == "true"

# Cache for formatted queries
QUERY_CACHE = {}
CACHE_FILE = "data/query_cache.json"

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 10  # requests per window
RATE_LIMIT_WINDOW = 60    # seconds
RATE_LIMIT_LOCK = threading.Lock()
RATE_LIMIT_QUEUE = deque(maxlen=RATE_LIMIT_REQUESTS)

# Concurrent request limiting
MAX_CONCURRENT_REQUESTS = 3
REQUEST_SEMAPHORE = threading.Semaphore(MAX_CONCURRENT_REQUESTS)

# Redis connection for distributed rate limiting (optional)
REDIS_CLIENT = None
try:
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_CLIENT = redis.from_url(REDIS_URL, decode_responses=True)
    REDIS_CLIENT.ping()
    logger.info("Redis connected for distributed rate limiting")
except Exception as e:
    logger.warning(f"Redis not available, using local rate limiting: {e}")
    REDIS_CLIENT = None

# Performance metrics
PERFORMANCE_METRICS = {
    "api_calls": 0,
    "cache_hits": 0,
    "cache_misses": 0,
    "format_errors": 0,
    "search_errors": 0,
    "total_results": 0
}

def load_query_cache():
    """Load query cache from file"""
    global QUERY_CACHE
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r') as f:
                QUERY_CACHE = json.load(f)
                logger.info(f"Loaded {len(QUERY_CACHE)} cached queries")
    except Exception as e:
        logger.warning(f"Could not load query cache: {e}")
        QUERY_CACHE = {}

def save_query_cache():
    """Save query cache to file"""
    try:
        Path("data").mkdir(exist_ok=True)
        with open(CACHE_FILE, 'w') as f:
            json.dump(QUERY_CACHE, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not save query cache: {e}")

def check_rate_limit(identifier: str = "global") -> bool:
    """
    Check if we're within rate limits.
    
    Args:
        identifier: User ID, IP, or 'global' for system-wide
        
    Returns:
        True if request is allowed, False if rate limited
    """
    current_time = time.time()
    
    # Try Redis first for distributed rate limiting
    if REDIS_CLIENT:
        try:
            key = f"jina_rate_limit:{identifier}"
            pipe = REDIS_CLIENT.pipeline()
            pipe.zadd(key, {str(current_time): current_time})
            pipe.zremrangebyscore(key, 0, current_time - RATE_LIMIT_WINDOW)
            pipe.zcard(key)
            pipe.expire(key, RATE_LIMIT_WINDOW + 1)
            results = pipe.execute()
            
            request_count = results[2]
            return request_count <= RATE_LIMIT_REQUESTS
            
        except Exception as e:
            logger.warning(f"Redis rate limit check failed: {e}")
            # Fall back to local rate limiting
    
    # Local rate limiting
    with RATE_LIMIT_LOCK:
        # Remove old entries
        while RATE_LIMIT_QUEUE and RATE_LIMIT_QUEUE[0] < current_time - RATE_LIMIT_WINDOW:
            RATE_LIMIT_QUEUE.popleft()
        
        # Check if we can make a request
        if len(RATE_LIMIT_QUEUE) >= RATE_LIMIT_REQUESTS:
            return False
        
        # Add current request
        RATE_LIMIT_QUEUE.append(current_time)
        return True

def wait_for_rate_limit(identifier: str = "global", max_wait: float = 30) -> bool:
    """
    Wait until rate limit allows a request.
    
    Args:
        identifier: User ID, IP, or 'global'
        max_wait: Maximum seconds to wait
        
    Returns:
        True if request can proceed, False if timeout
    """
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        if check_rate_limit(identifier):
            return True
        time.sleep(1)  # Check every second
    
    return False

def with_retry(max_retries: int = 3, backoff_factor: float = 2.0):
    """
    Decorator for retrying failed requests with exponential backoff.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except requests.exceptions.HTTPError as e:
                    if e.response and e.response.status_code == 429:
                        # Rate limited - wait longer
                        wait_time = backoff_factor ** attempt * 2
                        logger.warning(f"Rate limited, waiting {wait_time}s before retry")
                        time.sleep(wait_time)
                    else:
                        raise
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                    last_exception = e
                    wait_time = backoff_factor ** attempt
                    logger.warning(f"Connection error, retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                except Exception as e:
                    logger.error(f"Unexpected error in {func.__name__}: {e}")
                    raise
            
            # All retries failed
            logger.error(f"All {max_retries} retries failed for {func.__name__}")
            if last_exception:
                raise last_exception
            raise Exception(f"Failed after {max_retries} retries")
        
        return wrapper
    return decorator

def format_query_with_deepseek(keyword_query: str, progress_callback: Optional[Callable] = None) -> List[str]:
    """
    Use DeepSeek or OpenAI to convert keyword-based query into natural language search queries.
    
    Args:
        keyword_query: Concatenated keywords like "roofing contractor roof repair Belfast"
        
    Returns:
        List of natural language queries
    """
    # Create cache key
    cache_key = hashlib.md5(keyword_query.encode()).hexdigest()
    
    # Check cache first
    if cache_key in QUERY_CACHE:
        logger.info(f"Using cached formatted queries for: {keyword_query[:50]}...")
        PERFORMANCE_METRICS["cache_hits"] += 1
        return QUERY_CACHE[cache_key]
    
    PERFORMANCE_METRICS["cache_misses"] += 1
    
    logger.info(f"Formatting query with AI: {keyword_query}")
    
    # Try DeepSeek first, then OpenAI as fallback
    api_key = DEEPSEEK_API_KEY or OPENAI_API_KEY
    if not api_key:
        logger.warning("No AI API key available for query formatting. Using fallback method.")
        return fallback_format_query(keyword_query)
    
    try:
        # Determine which API to use
        api_url = "https://api.deepseek.com/v1/chat/completions" if DEEPSEEK_API_KEY else "https://api.openai.com/v1/chat/completions"
        model = "deepseek-chat" if DEEPSEEK_API_KEY else "gpt-3.5-turbo"
        
        prompt = f"""Convert these keywords into 2-5 natural language search queries for a web search engine.

Keywords: {keyword_query}

Requirements:
1. Create focused, natural language queries
2. Each query should target a different aspect of the search
3. Include location if present in keywords
4. Keep queries concise and search-engine friendly
5. Return ONLY the queries, one per line, no numbering or bullets

Example input: "roofing contractor roof repair commercial Belfast UK"
Example output:
roofing contractors in Belfast UK
commercial roof repair services Belfast
roof contractors Northern Ireland
Belfast roofing companies contact information"""
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a search query optimizer. Convert keywords into effective search queries."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 200
        }
        
        response = requests.post(api_url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content'].strip()
        
        # Parse the response into individual queries
        queries = [q.strip() for q in content.split('\n') if q.strip()]
        
        # Filter out any non-query lines (like explanations)
        filtered_queries = []
        for q in queries:
            # Skip lines that look like explanations or numbering
            if not any(char in q for char in [':', '•', '-', '1.', '2.', '3.', '4.', '5.']):
                filtered_queries.append(q)
        
        # Ensure we have at least one query
        if not filtered_queries:
            logger.warning("AI returned no valid queries, using fallback")
            filtered_queries = fallback_format_query(keyword_query)
        
        # Cache the result
        QUERY_CACHE[cache_key] = filtered_queries
        save_query_cache()
        
        logger.info(f"Formatted into {len(filtered_queries)} queries: {filtered_queries}")
        return filtered_queries
        
    except Exception as e:
        logger.error(f"Error formatting query with AI: {e}")
        PERFORMANCE_METRICS["format_errors"] += 1
        return fallback_format_query(keyword_query)

def fallback_format_query(keyword_query: str) -> List[str]:
    """
    Fallback method to format queries without AI.
    
    Args:
        keyword_query: Concatenated keywords
        
    Returns:
        List of formatted queries
    """
    # Split keywords
    keywords = keyword_query.split()
    
    # Identify location (usually at the end)
    location_keywords = ['uk', 'usa', 'canada', 'ireland', 'england', 'scotland', 'wales']
    location_parts = []
    other_parts = []
    
    for i, word in enumerate(keywords):
        if word.lower() in location_keywords or (i > 0 and keywords[i-1].lower() in ['northern', 'southern', 'eastern', 'western']):
            # This and previous words might be location
            if i > 0 and keywords[i-1].lower() in ['northern', 'southern', 'eastern', 'western']:
                location_parts.extend([keywords[i-1], word])
            else:
                location_parts.append(word)
        elif ',' in word or any(char.isdigit() for char in word):
            # Might be part of address
            location_parts.append(word)
        else:
            other_parts.append(word)
    
    # Create queries
    queries = []
    
    # Query 1: Main keywords + location
    if other_parts:
        query1 = ' '.join(other_parts[:5])  # First 5 keywords
        if location_parts:
            query1 += ' ' + ' '.join(location_parts)
        queries.append(query1)
    
    # Query 2: Different keyword combination
    if len(other_parts) > 3:
        query2 = ' '.join(other_parts[2:7])  # Different slice
        if location_parts:
            query2 += ' in ' + ' '.join(location_parts)
        queries.append(query2)
    
    # Query 3: Service-focused
    service_words = ['contractor', 'service', 'company', 'provider', 'specialist']
    service_keywords = [w for w in other_parts if any(s in w.lower() for s in service_words)]
    if service_keywords:
        query3 = ' '.join(service_keywords + other_parts[:2])
        if location_parts:
            query3 += ' ' + ' '.join(location_parts)
        queries.append(query3)
    
    # Ensure we return at least the original query if nothing else worked
    if not queries:
        queries = [keyword_query]
    
    return queries[:3]  # Return max 3 queries

# Load cache on module import
load_query_cache()

@with_retry(max_retries=3, backoff_factor=1.5)
def search_jina_api_call(url: str, headers: dict, timeout: int = 30) -> requests.Response:
    """
    Make the actual API call to Jina with retry logic.
    """
    with REQUEST_SEMAPHORE:  # Limit concurrent requests
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response

def search_jina(query, page=1, user_id: str = "global", progress_callback: Optional[Callable] = None):
    """
    Search using Jina AI Search API
    """
    logger.info(f"=== JINA AI SEARCH DEBUG ===")
    logger.info(f"Query: '{query}'")
    logger.info(f"Page: {page}")
    logger.info(f"JINA_API_KEY present: {'Yes' if JINA_API_KEY else 'No'}")
    
    if not JINA_API_KEY:
        logger.error("JINA_API_KEY environment variable not set")
        return {"organic_results": []}
    
    # Format the query using AI before sending to Jina
    formatted_queries = format_query_with_deepseek(query, progress_callback)
    
    # We'll search with the first formatted query
    # The run() function will handle multiple queries
    search_query = formatted_queries[0] if formatted_queries else query
    
    logger.info(f"Original query: '{query}'")
    logger.info(f"Using formatted query: '{search_query}'")
    
    try:
        # Prepare the request
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://s.jina.ai/?q={encoded_query}&page={page}"
        
        logger.info(f"Full URL: {url}")
        logger.info(f"Encoded query: {encoded_query}")
        
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {JINA_API_KEY}",
            "X-Respond-With": "no-content"
        }
        
        logger.info(f"Request headers (without API key): Accept={headers.get('Accept')}, X-Respond-With={headers.get('X-Respond-With')}")
        
        # Save request details in debug mode
        if DEBUG_SEARCH:
            debug_request = {
                "timestamp": datetime.now().isoformat(),
                "url": url,
                "headers": {k: v if k != "Authorization" else "MASKED" for k, v in headers.items()},
                "query": search_query,
                "original_query": query,
                "page": page
            }
            debug_file = f"data/debug/jina_request_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{query[:20]}.json"
            try:
                Path("data/debug").mkdir(parents=True, exist_ok=True)
                with open(debug_file, 'w') as f:
                    json.dump(debug_request, f, indent=2)
                logger.info(f"Debug: Request saved to {debug_file}")
            except Exception as e:
                logger.warning(f"Could not save debug request: {e}")
        
        # Check rate limit
        if not wait_for_rate_limit(user_id, max_wait=10):
            logger.error(f"Rate limit exceeded for {user_id}")
            PERFORMANCE_METRICS["search_errors"] += 1
            return {"organic_results": []}
        
        # Make the request with retry logic
        logger.info("Making request to Jina AI...")
        PERFORMANCE_METRICS["api_calls"] += 1
        
        if progress_callback:
            progress_callback({
                "message": f"Searching with query: {search_query[:50]}...",
                "stats": PERFORMANCE_METRICS
            })
        
        response = search_jina_api_call(url, headers)
        
        logger.info(f"Response status code: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        
        response.raise_for_status()
        
        # Log raw response
        raw_response = response.text
        logger.info(f"Raw response length: {len(raw_response)} chars")
        
        # Log full response if it's reasonably sized, otherwise log first 2000 chars
        if len(raw_response) < 5000:
            logger.info(f"Full raw response: {raw_response}")
        else:
            logger.info(f"Raw response (first 2000 chars): {raw_response[:2000]}...")
            # Save full response to debug file
            debug_file = f"data/debug/jina_response_{query[:20]}_{page}.json"
            try:
                Path("data/debug").mkdir(parents=True, exist_ok=True)
                with open(debug_file, 'w') as f:
                    f.write(raw_response)
                logger.info(f"Full response saved to: {debug_file}")
            except Exception as e:
                logger.warning(f"Could not save debug file: {e}")
        
        # Parse response
        data = response.json()
        logger.info(f"Parsed response keys: {list(data.keys())}")
        logger.info(f"Response code: {data.get('code')}")
        logger.info(f"Response status: {data.get('status')}")
        
        # Check for successful response
        if data.get("code") != 200:
            logger.error(f"Jina AI API error - Response code: {data.get('code')}")
            logger.error(f"Jina AI API error - Full response: {json.dumps(data, indent=2)}")
            # Save error response for debugging
            try:
                error_file = f"data/debug/jina_error_{query[:20]}_{page}_{data.get('code')}.json"
                Path("data/debug").mkdir(parents=True, exist_ok=True)
                with open(error_file, 'w') as f:
                    json.dump(data, f, indent=2)
                logger.error(f"Error response saved to: {error_file}")
            except Exception as e:
                logger.warning(f"Could not save error file: {e}")
            return {"organic_results": []}
        
        # Extract search results
        search_results = data.get("data", [])
        
        logger.info(f"Number of search results: {len(search_results)}")
        if search_results:
            logger.info(f"First result: {json.dumps(search_results[0], indent=2)}")
        
        # Format results in the expected structure
        formatted_results = []
        for i, result in enumerate(search_results):
            formatted_result = {
                "position": i + 1,
                "title": result.get("title", ""),
                "link": result.get("url", ""),
                "snippet": result.get("description", "")
            }
            formatted_results.append(formatted_result)
            logger.info(f"Result {i+1}: title='{formatted_result['title'][:50]}...', url='{formatted_result['link']}'")
        
        # Update metrics
        PERFORMANCE_METRICS["total_results"] += len(formatted_results)
        
        logger.info(f"=== END JINA AI SEARCH DEBUG ===")
        return {"organic_results": formatted_results}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error using Jina AI search: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        PERFORMANCE_METRICS["search_errors"] += 1
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text[:500]}")
        return {"organic_results": []}
    except Exception as e:
        logger.error(f"Unexpected error using Jina AI search: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        PERFORMANCE_METRICS["search_errors"] += 1
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"organic_results": []}

# We now use Jina AI API for searching


# This function is no longer used, but kept for reference
def search_custom(query, page=1):
    """
    DEPRECATED - NOT USED ANYMORE
    
    Custom search implementation using a list of known FCA-regulated companies.
    This function is no longer used as the system now uses Serper.dev API
    with exponential backoff for rate limiting instead of fallbacks.
    
    Args:
        query (str): The search query
        page (int): The page number
        
    Returns:
        dict: Empty result set - this function is never called anymore
    """
    logger.warning("search_custom() was called, but this function is deprecated and should never be used")
    return {"organic_results": []}


def save_search_results(results_batch, append=True):
    """
    Save search results to a JSON file, ensuring deduplication against existing file content when appending.
    
    Args:
        results_batch (list): List of new search result dictionaries to potentially add.
        append (bool): If True, load existing results, deduplicate the new batch against them, 
                     append unique new results, and overwrite. If False, deduplicate the 
                     input batch and overwrite the file entirely with it.
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        Path("data").mkdir(exist_ok=True)
        
        existing_results = []
        seen_urls_in_file = set()
        
        # If appending or file exists, load existing data
        if append and os.path.exists(SEARCH_RESULTS_FILE):
            try:
                with open(SEARCH_RESULTS_FILE, 'r') as f:
                    data = json.load(f)
                    existing_results = data.get("results", [])
                    for res in existing_results:
                        url = res.get("link")
                        if url:
                            seen_urls_in_file.add(url)
            except json.JSONDecodeError:
                logger.warning(f"Existing file {SEARCH_RESULTS_FILE} not valid JSON. Treating as empty for append.")
            except FileNotFoundError:
                pass # Will start fresh below

        # Process the incoming batch
        if append:
            # Filter the new batch to only include results whose URLs aren't already saved
            truly_new_results = []
            for result in results_batch:
                url = result.get("link")
                if url and url not in seen_urls_in_file:
                    truly_new_results.append(result)
                    seen_urls_in_file.add(url) # Add to set immediately to deduplicate within batch too
            
            results_to_save = existing_results + truly_new_results
            added_count = len(truly_new_results)
        else:
            # Overwrite mode: Deduplicate the input batch itself
            unique_results_in_batch = []
            seen_urls_in_batch = set()
            for result in results_batch:
                 url = result.get("link")
                 if url and url not in seen_urls_in_batch:
                     unique_results_in_batch.append(result)
                     seen_urls_in_batch.add(url)
            results_to_save = unique_results_in_batch
            added_count = len(results_to_save) # In overwrite, all saved results are 'new' relative to empty file

        # Always overwrite the file with the final list for this operation
        with open(SEARCH_RESULTS_FILE, 'w') as f:
            json.dump({"results": results_to_save}, f, indent=2)
        
        log_action = "Appended" if append else "Overwrote"
        logger.info(f"{log_action} {added_count} unique results. Total in file: {len(results_to_save)}.")
        return True
    
    except Exception as e:
        logger.error(f"Error saving search results: {e}")
        return False


def search_jina_with_formatted_queries(keyword_query: str, max_results: int = 50, 
                                      user_id: str = "global",
                                      progress_callback: Optional[Callable] = None) -> List[Dict]:
    """
    Search Jina with multiple formatted queries and aggregate results.
    
    Args:
        keyword_query: Original keyword-based query
        max_results: Maximum total results to return
        
    Returns:
        List of unique search results
    """
    # Get formatted queries
    formatted_queries = format_query_with_deepseek(keyword_query, progress_callback)
    
    logger.info(f"Searching with {len(formatted_queries)} formatted queries")
    
    if progress_callback:
        progress_callback({
            "message": f"Searching with {len(formatted_queries)} optimized queries",
            "progress": 10,
            "stats": PERFORMANCE_METRICS
        })
    
    all_results = []
    seen_urls = set()
    results_per_query = max(10, max_results // len(formatted_queries))
    pages_per_query = max(1, results_per_query // 10)  # Assuming ~10 results per page
    
    for query in formatted_queries:
        logger.info(f"Searching: '{query}'")
        
        for page in range(1, pages_per_query + 1):
            try:
                # Calculate sub-progress
                query_progress = (formatted_queries.index(query) * 100) // len(formatted_queries)
                page_progress = ((page - 1) * 100) // pages_per_query
                overall_progress = 10 + (query_progress + page_progress // len(formatted_queries)) * 0.8
                
                if progress_callback:
                    progress_callback({
                        "message": f"Query {formatted_queries.index(query) + 1}/{len(formatted_queries)}, page {page}",
                        "progress": overall_progress,
                        "stats": PERFORMANCE_METRICS
                    })
                
                # Use the original search_jina but with formatted query
                results = search_jina_raw(query, page, user_id)
                page_results = results.get("organic_results", [])
                
                # Deduplicate
                for result in page_results:
                    url = result.get("link", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        result["search_query"] = query
                        result["original_query"] = keyword_query
                        all_results.append(result)
                        
                        if len(all_results) >= max_results:
                            return all_results
                
                # Small delay between requests
                if page < pages_per_query:
                    time.sleep(0.5)
                    
            except Exception as e:
                logger.error(f"Error searching with query '{query}': {e}")
                continue
    
    return all_results

def search_jina_raw(query, page=1, user_id: str = "global"):
    """
    Raw Jina search without query formatting.
    This is the original search_jina function.
    """
    logger.info(f"=== JINA AI RAW SEARCH ===")
    logger.info(f"Query: '{query}'")
    logger.info(f"Page: {page}")
    
    if not JINA_API_KEY:
        logger.error("JINA_API_KEY environment variable not set")
        return {"organic_results": []}
    
    try:
        # Prepare the request
        encoded_query = urllib.parse.quote(query)
        url = f"https://s.jina.ai/?q={encoded_query}&page={page}"
        
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {JINA_API_KEY}",
            "X-Respond-With": "no-content"
        }
        
        # Check rate limit
        if not wait_for_rate_limit(user_id, max_wait=10):
            logger.error(f"Rate limit exceeded for {user_id}")
            return {"organic_results": []}
        
        # Make the request with retry logic
        response = search_jina_api_call(url, headers)
        PERFORMANCE_METRICS["api_calls"] += 1
        
        # Parse response
        data = response.json()
        
        # Check for successful response
        if data.get("code") != 200:
            logger.error(f"Jina AI API error - Response code: {data.get('code')}")
            return {"organic_results": []}
        
        # Extract search results
        search_results = data.get("data", [])
        
        # Format results
        formatted_results = []
        for i, result in enumerate(search_results):
            formatted_result = {
                "position": i + 1,
                "title": result.get("title", ""),
                "link": result.get("url", ""),
                "snippet": result.get("description", "")
            }
            formatted_results.append(formatted_result)
        
        return {"organic_results": formatted_results}
        
    except Exception as e:
        logger.error(f"Error in raw Jina search: {e}")
        return {"organic_results": []}

def get_performance_stats() -> Dict[str, Any]:
    """
    Get current performance statistics.
    """
    stats = PERFORMANCE_METRICS.copy()
    if stats["cache_hits"] + stats["cache_misses"] > 0:
        stats["cache_hit_rate"] = stats["cache_hits"] / (stats["cache_hits"] + stats["cache_misses"])
    else:
        stats["cache_hit_rate"] = 0
    
    if stats["api_calls"] > 0:
        stats["error_rate"] = stats["search_errors"] / stats["api_calls"]
    else:
        stats["error_rate"] = 0
    
    return stats

def run(search_query="", max_pages=20, custom_queries=None, append_mode=False, 
        single_query=True, search_config=None, user_id: str = "global",
        progress_callback: Optional[Callable] = None):
    """
    Run phase 1: Search for FCA-approved finance companies.
    
    Args:
        search_query (str): The search query to use
        max_pages (int): Maximum number of search result pages to process per query
        custom_queries (list, optional): List of custom search queries to use in addition to base queries
        append_mode (bool): Whether to append to existing results or start fresh
        single_query (bool): If True, only runs the specified search query and stops
        
    Returns:
        list: The search results
    """
    # Use custom queries if provided, otherwise create simple default queries
    if custom_queries:
        logger.info(f"Using {len(custom_queries)} custom queries")
        for i, query in enumerate(custom_queries):
            logger.info(f"Custom query #{i+1}: '{query}'")
        base_queries = custom_queries
    else:
        # Create simple default queries compatible with Jina AI
        base_queries = [
            "finance companies affiliate programs",
            "mortgage broker partner programs UK",
            "credit broker affiliate opportunities",
            "insurance broker introducer schemes",
            "loan introducer commission programs",
            "financial services partner networks",
            "FCA regulated affiliate programs",
            "consumer credit broker partnerships",
            "commercial finance introducer programs",
            "lending affiliate networks UK"
        ]
        logger.info(f"Using {len(base_queries)} default simple queries for Jina AI")
    
    # Use the global configuration constants
    # These constants can be modified at the top of the file
    
    logger.info(f"Starting Phase 1: Searching with iterative query building (target: {TARGET_RESULTS}+ results)")
    
    # Handle existing results based on append mode
    Path("data").mkdir(exist_ok=True)
    
    # Load existing domains and URLs if in append mode
    all_results = []
    seen_urls = set()          # Track exact URLs to avoid duplicates
    seen_domains_set = set()   # Track unique domains for exclusion
    seen_domains_list = []     # Preserve insertion order for domain rotation
    
    if append_mode and os.path.exists(SEARCH_RESULTS_FILE):
        logger.info(f"Append mode: Loading existing results from {SEARCH_RESULTS_FILE}")
        try:
            with open(SEARCH_RESULTS_FILE, 'r') as f:
                existing_data = json.load(f)
                all_results = existing_data.get("results", [])
                
                # Populate seen URLs and domains from existing results
                for result in all_results:
                    url = result.get("link", "")
                    if url:
                        seen_urls.add(url)
                        prefix = extract_site_prefix(url)
                        if prefix and prefix not in seen_domains_set:
                            seen_domains_set.add(prefix)
                            seen_domains_list.append(prefix)
                
                logger.info(f"Loaded {len(all_results)} existing results")
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logger.warning(f"Error loading existing results: {e}. Starting fresh.")
            all_results = []
            seen_urls = set()
            seen_domains_set = set()
            seen_domains_list = []
    else:
        # Clear existing results for a fresh search
        if os.path.exists(SEARCH_RESULTS_FILE):
            os.remove(SEARCH_RESULTS_FILE)
            logger.info(f"Removed existing search results file to start fresh")
        
        # Initialize empty results file
        with open(SEARCH_RESULTS_FILE, 'w') as f:
            json.dump({"results": []}, f, indent=2)
        logger.info("Initialized empty results file")
    
    search_iteration = 0
    
    # Jina AI is now used exclusively for search
    logger.info("Using Jina AI API for searching")
    
    # Debug - display configuration settings
    logger.info(f"Search Configuration:")
    logger.info(f"  TARGET_RESULTS: {TARGET_RESULTS}")
    logger.info(f"  MAX_ITERATIONS: {MAX_SEARCH_ITERATIONS}")
    logger.info(f"  MAX_PAGES_PER_QUERY: {MAX_PAGES_PER_QUERY}")
    logger.info(f"  MAX_EXCLUSIONS: {MAX_EXCLUSIONS}")
    logger.info(f"  MAX_QUERY_LENGTH: {MAX_QUERY_LENGTH}")
    logger.info(f"  Base Queries: {len(base_queries)} queries to process")
    
    # Start with base queries without exclusions
    logger.info(f"Beginning iterative search with {len(base_queries)} base queries...")
    for query_index, base_query in enumerate(base_queries):
        # Debug output to see what's happening
        logger.info(f"Checking base query #{query_index+1}: '{base_query}'")
        
        # Skip complex boolean queries that won't work with Jina
        if ' AND ' in base_query or ' OR ' in base_query or '-site:' in base_query:
            logger.warning(f"Skipping complex boolean query incompatible with Jina AI.")
            logger.warning(f"Full query: '{base_query}'")
            logger.warning(f"Query length: {len(base_query)} characters")
            logger.warning(f"Contains AND: {' AND ' in base_query}, OR: {' OR ' in base_query}, -site: {'-site:' in base_query}")
            continue
        
        # Check if we've already reached our target
        if len(all_results) >= TARGET_RESULTS:
            logger.info(f"Reached target of {TARGET_RESULTS} results. Ending search.")
            break
            
        logger.info(f"Starting with base query {query_index+1}/{len(base_queries)}: '{base_query}'")
        
        # Now we'll iterate through different variations of this query
        # with exclusions to avoid getting the same results
        for iteration in range(MAX_SEARCH_ITERATIONS):
            search_iteration += 1
            
            # Stop if we've reached the target number of results
            if len(all_results) >= TARGET_RESULTS:
                logger.info(f"Reached target of {TARGET_RESULTS} results on iteration {search_iteration}. Moving to next base query.")
                break
                
            # Build exclusion string using a rotating subset of seen domains
            exclusion_string = ""
            if iteration > 0 and seen_domains_list:
                ops = []
                num_seen = len(seen_domains_list)
                start_index = (iteration * MAX_EXCLUSIONS) % num_seen # Use iteration here
                
                indices_to_exclude = [(start_index + i) % num_seen for i in range(min(MAX_EXCLUSIONS, num_seen))]
                prefixes_to_exclude = [seen_domains_list[i] for i in indices_to_exclude]

                ops = [f" -site:{p}" for p in prefixes_to_exclude]
                current_exclusion_string = "".join(ops)

                if len(base_query) + len(current_exclusion_string) <= MAX_QUERY_LENGTH:
                    exclusion_string = current_exclusion_string
                    logger.info(f"Using rotating exclusions (start={start_index}, count={len(prefixes_to_exclude)}): {prefixes_to_exclude}")
                else:
                     logger.warning(f"Query with {len(prefixes_to_exclude)} exclusions would exceed MAX_QUERY_LENGTH. Sending query without exclusions for this iteration.")
                
            # Combine base query with exclusions
            current_query = base_query + exclusion_string
            
            # Very clear logging of the complete query
            logger.info(f"SEARCH QUERY: '{current_query}'")
            logger.info(f"Search iteration {search_iteration}: Base query {query_index+1}, iteration {iteration+1}")
            
            # Process pages for each iteration of this query
            found_results_in_iteration = False
            for page in range(1, max_pages + 1):
                # Stop if we've exceeded target (but only after min pages)
                if len(all_results) >= TARGET_RESULTS and page > MIN_PAGES_PER_QUERY:
                    logger.info(f"Reached target of {TARGET_RESULTS} results. Moving to next query.")
                    break
                    
                logger.info(f"Processing page {page}/{max_pages} for query: '{current_query}'")
                
                # For complex queries with multiple keywords, use formatted search
                # For simple queries or those with exclusions, use raw search
                # Calculate overall progress
                base_progress = (search_iteration * 100) // MAX_SEARCH_ITERATIONS
                
                if progress_callback:
                    progress_callback({
                        "message": f"Search iteration {search_iteration}, query {query_index + 1}/{len(base_queries)}",
                        "progress": base_progress,
                        "stats": get_performance_stats()
                    })
                
                if len(current_query.split()) > 6 and '-site:' not in current_query:
                    # Use formatted search for complex keyword queries
                    if page == 1:  # Only format once per iteration
                        logger.info("Using formatted search for complex query")
                        formatted_results = search_jina_with_formatted_queries(
                            current_query, 
                            max_results=50,
                            user_id=user_id,
                            progress_callback=progress_callback
                        )
                        results = {"organic_results": formatted_results}
                        # Skip further pages for this iteration since we got multiple queries' worth
                        if formatted_results:
                            page = max_pages  # This will end the page loop after processing
                    else:
                        results = {"organic_results": []}  # No results for subsequent pages
                else:
                    # Use raw search for simple queries or those with exclusions
                    results = search_jina_raw(current_query, page, user_id)
                
                # Extract the results list
                page_results = results.get("organic_results", [])
                
                if not page_results:
                    logger.warning(f"No results found for page {page}")
                    logger.warning(f"Query was: '{current_query}'")
                    logger.warning("Moving to next query iteration.")
                    break
                
                # Filter for unique URLs only
                unique_results = []
                for i, result in enumerate(page_results):
                    url = result.get("link", "")
                    
                    # Skip results without a URL
                    if not url:
                        continue
                        
                    # Skip exact URL duplicates
                    if url in seen_urls:
                        continue
                    
                    # Add to our seen sets
                    seen_urls.add(url)
                    
                    # Add metadata
                    result["search_page"] = page 
                    result["search_query"] = current_query
                    result["search_iteration"] = search_iteration
                    result["position"] = i + 1 + ((page - 1) * 10)
                    unique_results.append(result)
                
                # If we found no unique results at all, try next query variation
                if not unique_results:
                    logger.warning(f"No unique results found on page {page}. Moving to next query.")
                    break
                
                # We found some results in this iteration
                found_results_in_iteration = True
                
                # Add to our overall results
                all_results.extend(unique_results)
                logger.info(f"Found {len(unique_results)} unique results on page {page} (total: {len(all_results)})")
                
                # Save results incrementally after each batch (append mode)
                save_search_results(unique_results, append=True)
                
                # Add a short delay between Jina AI API calls to avoid rate limiting
                if page < max_pages:
                    time.sleep(0.5)  # 0.5 second delay between searches
            
            # If we didn't find any new results in this iteration, move to next base query
            if not found_results_in_iteration:
                logger.warning(f"No new results found for query variation. Moving to next base query.")
                break
    
    # No fallback to custom data, even if we found few results
    if len(all_results) < 10:
        logger.warning(f"Only found {len(all_results)} results. No supplemental data will be added.")
    
    # Final statistics
    final_stats = get_performance_stats()
    logger.info(f"Phase 1 completed. Found a total of {len(all_results)} unique search results.")
    logger.info(f"Performance stats: {json.dumps(final_stats, indent=2)}")
    
    if progress_callback:
        progress_callback({
            "message": f"Search completed. Found {len(all_results)} results.",
            "progress": 100,
            "stats": final_stats
        })
    
    # Final save to ensure the file has the complete, deduplicated list
    logger.info("Performing final save to deduplicate and consolidate results...")
    save_search_results(all_results, append=False) # Overwrite with the full list
    return all_results


if __name__ == "__main__":
    # Set up logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the phase with default parameters
    run()
