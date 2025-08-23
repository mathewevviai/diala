"""
Hunter Search Service - Streamlined lead generation with parallel processing.
"""

import os
import json
import asyncio
import logging
import time
import psutil
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
from pathlib import Path
import re
import aiohttp
from convex import ConvexClient
import groq

from .jina_client import JinaClient

# Import new pipeline
try:
    from ...services.hunter_pipeline import run_hunter_pipeline
    PIPELINE_AVAILABLE = True
except ImportError as e:
    try:
        # Try alternative import path
        import sys
        import os
        backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        sys.path.insert(0, backend_root)
        from src.services.hunter_pipeline import run_hunter_pipeline
        PIPELINE_AVAILABLE = True
    except ImportError:
        PIPELINE_AVAILABLE = False
        logging.warning(f"New hunter pipeline not available: {e}, falling back to legacy implementation")

logger = logging.getLogger(__name__)

# Configure verbose logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)
# Convex HTTP base (for posting progress/status/results when using new pipeline)
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://localhost:3210")
convex_client = ConvexClient(CONVEX_URL)


class HunterSearchService:
    """Main service for lead generation with parallel processing."""
    
    def __init__(self, jina_api_key: str, openai_api_key: Optional[str] = None, groq_api_key: Optional[str] = None):
        # Reduce concurrent connections to prevent DNS overload
        self.jina_client = JinaClient(jina_api_key, max_concurrent=5)
        self.openai_api_key = openai_api_key
        
        if not groq_api_key:
            raise ValueError("Groq API key is required for lead validation.")
        self.groq_client = groq.AsyncGroq(api_key=groq_api_key)

        self.results = []
        self.validated_results = []
        self.query_performance = {}  # Track which queries return results
        self.tried_queries = set()  # Avoid duplicate queries
        self.stats = {
            "queries_generated": 0,
            "urls_found": 0,
            "content_extracted": 0,
            "leads_validated": 0,
            "validation_time": 0.0,
            "search_time": 0.0,
            "extraction_time": 0.0,
            "start_time": None,
            "end_time": None,
            "empty_iterations": 0,
            "fallback_queries_used": 0
        }
        logger.info("HunterSearchService initialized with Groq validator")
        self._log_system_info()
    
    def _log_system_info(self):
        """Log system information for debugging."""
        try:
            process = psutil.Process()
            logger.info(f"[SYSTEM] CPU={psutil.cpu_percent()}%, Memory={psutil.virtual_memory().percent}%, "
                       f"Process Memory={process.memory_info().rss / 1024 / 1024:.2f}MB")
        except Exception as e:
            logger.debug(f"Could not get system info: {e}")

    async def generate_ai_search_queries(self, search_config: Dict[str, Any], max_queries: int = 60) -> List[Dict[str, Any]]:
        """
        Use Groq (moonshotai/kimi-k2-instruct) to synthesize a diverse set of high-quality search queries.
        Returns a list of objects: {"type","query","intent","tags"} ordered by predicted usefulness.
        """
        # Sanitize/compact search_config for prompt (avoid huge payloads)
        compact = {
            "industry": search_config.get("industry"),
            "location": search_config.get("location"),
            "keywords": search_config.get("keywords"),
            "companySize": search_config.get("companySize"),
            "jobTitles": search_config.get("jobTitles"),
            "validationCriteria": search_config.get("validationCriteria", {})
        }

        prompt = f"""You are a query synthesis expert for web search. Generate a JSON object with a "queries" field containing an array of query objects.

Each query object must have these exact fields:
- "type": one of ["longtail","boolean","directory_site","site_specific","inurl_title","role_offer","pain_point","social_profile","exclusion"]  
- "query": the search string
- "intent": one of ["contact","company_page","service_page","directory_listing","review","social","press","job_posting"]
- "tags": array of short tags

Generate {max_queries} diverse queries for finding business leads and contact pages.

Rules:
1. Prefer long-tail queries with contact intent (e.g. "roofing contractors Belfast contact email phone")
2. Include site: and inurl: operators for directories (checkatrade.com, yell.com, linkedin.com/company, trustpilot.com)
3. Combine job titles with company descriptors for role_offer queries
4. Include exclusion queries with -job -forum -blog to reduce noise
5. Use boolean operators (AND, OR, quotes) for precise targeting

Search config: {json.dumps(compact)}

Output format:
{{"queries": [
  {{"type": "longtail", "query": "example query", "intent": "contact", "tags": ["tag1", "tag2"]}},
  ...
]}}"""

        try:
            # Check cache first
            cache_dir = Path("data/query_cache")
            cache_dir.mkdir(parents=True, exist_ok=True)
            config_hash = abs(hash(json.dumps(compact, sort_keys=True)))
            cache_file = cache_dir / f"{config_hash}.json"
            
            # Check if cache exists and is recent (24 hours)
            if cache_file.exists():
                cache_age = time.time() - cache_file.stat().st_mtime
                if cache_age < 24 * 3600:  # 24 hours
                    logger.info(f"[AI QUERY] Using cached queries for config hash {config_hash}")
                    with open(cache_file, 'r') as f:
                        return json.load(f)

            # Use Groq client (async)
            logger.info(f"[AI QUERY] Generating {max_queries} queries via Groq for: {compact}")
            resp = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="moonshotai/kimi-k2-instruct",
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            
            raw = resp.choices[0].message.content
            logger.debug(f"[AI QUERY] Groq response: {raw[:200]}...")
            
            # Parse JSON - expect object with queries field
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and 'queries' in parsed:
                parsed = parsed['queries']
            elif isinstance(parsed, list):
                # Direct array response (legacy)
                pass
            else:
                logger.warning(f"[AI QUERY] Unexpected response format: {type(parsed)}")
                raise ValueError("Groq did not return expected format")

            # Basic normalization + scoring heuristic
            scored = []
            for item in parsed:
                if not isinstance(item, dict):
                    continue
                    
                qtext = item.get("query", "").strip()
                if not qtext:
                    continue
                    
                score = 0
                # Score based on query quality indicators
                if "site:" in qtext or "inurl:" in qtext:
                    score += 20
                if any(w in qtext.lower() for w in ["contact", "email", "phone", "quote", "get a quote", "request a quote"]):
                    score += 15
                if any(t in (item.get("tags") or []) for t in ["directory", "review", "linkedin", "facebook", "trustpilot"]):
                    score += 10
                if any(j.lower() in qtext.lower() for j in (search_config.get("jobTitles") or [])):
                    score += 10
                # Prefer longer, more specific queries
                word_count = len(qtext.split())
                if word_count >= 4:
                    score += 5
                elif word_count <= 2:
                    score -= 10
                    
                item["_score"] = score
                scored.append(item)

            # Sort by score descending
            scored.sort(key=lambda x: x.get("_score", 0), reverse=True)
            
            # Dedupe and limit
            seen = set()
            out = []
            for it in scored:
                q = it["query"]
                if q in seen:
                    continue
                seen.add(q)
                out.append(it)
                if len(out) >= max_queries:
                    break

            # Cache the AI queries to disk
            try:
                with open(cache_file, "w") as f:
                    json.dump(out, f, indent=2)
                logger.info(f"[AI QUERY] Cached {len(out)} queries to {cache_file}")
            except Exception as e:
                logger.warning(f"[AI QUERY] Failed to cache queries: {e}")

            logger.info(f"[AI QUERY] Generated {len(out)} AI queries (top score: {out[0].get('_score', 0) if out else 0})")
            return out
            # Save last generation snapshot for debugging / human review (non-fatal)
            try:
                with open(data/last_ai_queries.json, w) as f:
                    json.dump(out, f, indent=2)
            except Exception:
                pass


        except Exception as e:
            logger.error(f"[AI QUERY] Groq query generation failed: {e}", exc_info=True)
            return []
    
    def generate_search_queries(self, search_config: Dict[str, Any], fallback_level: int = 0) -> List[str]:
        """
        Generate search queries from user configuration.
        
        Args:
            search_config: User's search configuration
            fallback_level: Fallback level for legacy queries
            
        Returns:
            List of search queries
        """
        # Prefer AI-generated queries (Groq) first, fallback to legacy heuristics.
        queries = []
        
        # Try AI query generation first (only on initial call, not fallbacks)
        if fallback_level == 0:
            try:
                ai_queries = asyncio.get_event_loop().run_until_complete(
                    self.generate_ai_search_queries(search_config, max_queries=40)
                )
                if ai_queries:
                    # ai_queries is a list of dicts: {"type","query","intent","tags"}
                    # flatten to strings and keep order
                    ai_list = [q["query"] for q in ai_queries if q.get("query")]
                    # prepend AI queries (they'll be deduped below)
                    queries.extend(ai_list)
                    logger.info(f"[AI QUERY] Added {len(ai_list)} AI-generated queries")
            except Exception as e:
                logger.debug(f"[AI QUERY] Groq query generation failed, using legacy generator: {e}")

        # Continue with legacy query generation (as fallback or supplement)
        legacy_queries = []
        
        # Extract key information
        industry = search_config.get("industry", "")
        location = search_config.get("location", "")
        keywords = search_config.get("keywords", "")
        company_size = search_config.get("companySize", "")
        job_titles = search_config.get("jobTitles", [])
        
        # Base components
        base_terms = []
        
        # Add industry terms
        if industry:
            base_terms.append(industry)
            # Add related terms
            industry_map = {
                "Roofing & Construction": ["roofing", "roof repair", "construction", "contractor"],
                "Technology": ["tech", "software", "IT", "technology"],
                "Healthcare": ["health", "medical", "healthcare", "clinic"],
                "Finance": ["financial", "finance", "investment", "banking"],
                "Retail": ["retail", "shop", "store", "commerce"],
                "Manufacturing": ["manufacturing", "production", "factory", "industrial"]
            }
            base_terms.extend(industry_map.get(industry, []))
        
        # Add keywords
        if keywords:
            base_terms.extend(keywords.split(","))
        
        # Add location
        location_str = f" {location}" if location else ""
        
        # Generate legacy query variations (as supplement/fallback)
        # Query 1: Direct industry + location
        if industry and location:
            legacy_queries.append(f"{industry} companies {location}")
        
        # Query 2: Keywords + location
        if keywords:
            legacy_queries.append(f"{keywords} {location}".strip())
        
        # Query 3: Industry + business terms + location
        business_terms = ["companies", "businesses", "firms", "services", "contractors", "providers"]
        for term in business_terms[:3]:  # Use first 3
            if base_terms:
                query = f"{base_terms[0]} {term} {location}".strip()
                legacy_queries.append(query)
        
        # Query 4: Contact-focused queries
        if base_terms:
            legacy_queries.append(f"{base_terms[0]} contact information email phone {location}".strip())
            legacy_queries.append(f"{base_terms[0]} business directory {location}".strip())
        
        # Query 5: Size-specific queries
        if company_size and base_terms:
            size_map = {
                "1-10": "small business startup",
                "11-50": "small medium business SMB",
                "51-200": "medium business",
                "201-500": "large company",
                "500+": "enterprise corporation"
            }
            size_terms = size_map.get(company_size, "business")
            legacy_queries.append(f"{size_terms} {base_terms[0]} {location}".strip())
        
        # Combine AI queries with legacy queries
        queries.extend(legacy_queries)
        
        # Remove duplicates and empty queries
        queries = list(dict.fromkeys([q for q in queries if q]))
        
        # Apply fallback strategies if previous searches returned no results
        if fallback_level > 0:
            logger.info(f"[FALLBACK] Applying fallback level {fallback_level} query generation")
            fallback_queries = []
            
            if fallback_level == 1:
                # Level 1: Broader industry terms
                if industry and location:
                    fallback_queries.extend([
                        f"{industry} {location}",
                        f"{industry.split()[0]} companies {location}",  # First word only
                        f"construction {location}" if "construction" in industry.lower() else f"{industry} {location}",
                        f"contractors {location}",
                        f"local {industry} {location}"
                    ])
                    
            elif fallback_level == 2:
                # Level 2: Location-focused with general business terms
                if location:
                    fallback_queries.extend([
                        f"businesses {location}",
                        f"companies {location}",
                        f"contractors {location}",
                        f"{location} business directory",
                        f"{location} yellow pages"
                    ])
                    
            elif fallback_level >= 3:
                # Level 3: Very broad searches
                location_parts = location.split(",")
                if location_parts:
                    city = location_parts[0].strip()
                    fallback_queries.extend([
                        city,
                        f"{city} businesses",
                        f"{city} services",
                        "Belfast roofing" if "Belfast" in location else f"{city} contractors"
                    ])
            
            # Add fallback queries to the beginning
            queries = fallback_queries + queries
            self.stats["fallback_queries_used"] += len(fallback_queries)
        
        # Filter out already tried queries
        new_queries = [q for q in queries if q not in self.tried_queries]
        
        # Mark queries as tried
        for q in new_queries:
            self.tried_queries.add(q)
        
        # Limit to reasonable number
        new_queries = new_queries[:10]
        
        self.stats["queries_generated"] += len(new_queries)
        logger.info("="*60)
        logger.info(f"[QUERY GENERATION] Generated {len(new_queries)} new search queries (fallback level: {fallback_level}):")
        for i, query in enumerate(new_queries):
            logger.info(f"  Query {i+1}: {query}")
        logger.info("="*60)
        
        return new_queries
    
    async def validate_lead(self, content_data: Dict[str, Any], validation_criteria: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a lead against user criteria using Groq Kimi K2 model.
        """
        if not content_data.get("success"):
            return {
                "url": content_data.get("url"),
                "valid": False,
                "score": 0,
                "reasons": ["Failed to extract content"],
                "matched_criteria": [],
                "contact_info": {}
            }
        
        content = content_data.get("content", "")[:8000]  # Truncate content for the model
        title = content_data.get("title", "")
        url = content_data.get("url", "")

        prompt = f"""
        You are a lead validation expert. Analyze the following website content and determine if it's a valid lead based on the provided criteria.

        **Website URL:** {url}
        **Website Title:** {title}
        **Website Content (first 8000 characters):**
        ---
        {content}
        ---

        **Validation Criteria:**
        - **Industry:** {validation_criteria.get('industry', 'N/A')}
        - **Must have contact info (email/phone)?** {'Yes' if validation_criteria.get('mustHaveContactInfo') else 'No'}
        - **Must strictly match industry?** {'Yes' if validation_criteria.get('mustBeInIndustry') else 'No'}
        - **Required keywords on page:** {validation_criteria.get('mustHaveSpecificKeywords', []) or 'None'}
        - **Custom Rules:** {validation_criteria.get('customValidationRules', 'N/A')}

        **Instructions:**
        Return a single JSON object with no other text. The JSON object must have this exact structure:
        {{
          "valid": boolean,
          "score": number (0-100, where a score >= 40 means valid),
          "reasons": ["string"],
          "matched_criteria": ["string"]
        }}

        **Reasoning Process:**
        1. Evaluate if the website content aligns with the specified **Industry**.
        2. Check for contact information (emails, phone numbers, contact pages).
        3. Confirm if the **Required keywords** are present in the content.
        4. Assess if the **Custom Rules** are met.
        5. Calculate a confidence **score** based on how many criteria are met and the quality of the match. A lead is "valid" if the score is 40 or more.
        6. Populate `reasons` with a brief explanation for the score.
        7. Populate `matched_criteria` with a list of criteria that were successfully met.
        """

        try:
            chat_completion = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="moonshotai/kimi-k2-instruct",
                temperature=0.0,
                response_format={"type": "json_object"},
            )
            response_json_str = chat_completion.choices[0].message.content
            llm_result = json.loads(response_json_str)

            # Combine LLM result with structured data from Jina
            extracted_data = content_data.get("extracted_data", {})
            return {
                "url": url,
                "title": title,
                "valid": llm_result.get("valid", False),
                "score": llm_result.get("score", 0),
                "matched_criteria": llm_result.get("matched_criteria", []),
                "reasons": llm_result.get("reasons", ["LLM response was incomplete."]),
                "contact_info": {
                    "emails": extracted_data.get("emails", []),
                    "phones": extracted_data.get("phones", []),
                    "has_contact_form": extracted_data.get("has_contact_form", False)
                }
            }

        except Exception as e:
            logger.error(f"Groq validation failed for URL {url}: {e}", exc_info=True)
            return {
                "url": url,
                "title": title,
                "valid": False,
                "score": 0,
                "reasons": [f"LLM validation error: {e}"],
                "matched_criteria": [],
                "contact_info": {}
            }
    
    async def process_search_results(self, search_results: List[Dict[str, Any]], 
                                   validation_criteria: Dict[str, Any],
                                   progress_callback: Optional[Callable] = None) -> List[Dict[str, Any]]:
        """
        Process search results: extract content and validate in parallel.
        """
        urls = list(set(r.get("url") for r in search_results if r.get("url")))
        url_to_result = {r.get("url"): r for r in search_results if r.get("url")}
        
        self.stats["urls_found"] += len(urls)
        logger.info(f"[URL PROCESSING] Found {len(urls)} unique URLs to process")
        if not urls:
            return []
        
        if progress_callback:
            await progress_callback({
                "stage": "content_extraction",
                "message": f"Extracting content from {len(urls)} websites...",
                "total": len(urls)
            })
        
        logger.info(f"[CONTENT EXTRACTION] Starting extraction for {len(urls)} URLs")
        extraction_start = time.time()
        content_results = await self.jina_client.read_urls(urls, progress_callback)
        extraction_time = time.time() - extraction_start
        self.stats["extraction_time"] += extraction_time
        
        successful_extractions = len([r for r in content_results if r.get("success")])
        self.stats["content_extracted"] += successful_extractions
        logger.info(f"[CONTENT EXTRACTION] Completed in {extraction_time:.2f}s - Success: {successful_extractions}/{len(urls)}")
        
        if progress_callback:
            await progress_callback({
                "stage": "validation",
                "message": f"Validating {len(content_results)} leads with AI...",
                "total": len(content_results)
            })
        
        logger.info(f"[VALIDATION] Starting parallel validation for {len(content_results)} results")
        validation_start = time.time()
        
        validation_tasks = [self.validate_lead(content, validation_criteria) for content in content_results]
        all_validation_results = await asyncio.gather(*validation_tasks)
        
        validated_leads = []
        for validation_result in all_validation_results:
            if validation_result["valid"]:
                url = validation_result.get("url")
                search_data = url_to_result.get(url, {})
                content_data = next((c for c in content_results if c.get("url") == url), {})

                lead = {
                    "url": url,
                    "title": validation_result.get("title", ""),
                    "company_name": self.extract_company_name(validation_result.get("title", "")),
                    "description": content_data.get("description", search_data.get("description", "")),
                    "score": validation_result["score"],
                    "matched_criteria": validation_result["matched_criteria"],
                    "contact_info": validation_result["contact_info"],
                    "extracted_at": datetime.now().isoformat(),
                    "search_position": search_data.get("position", 0),
                    "search_query": search_data.get("search_query", "")
                }
                validated_leads.append(lead)
        
        self.stats["leads_validated"] += len(validated_leads)
        validated_leads.sort(key=lambda x: x["score"], reverse=True)
        validation_time = time.time() - validation_start
        self.stats["validation_time"] += validation_time
        
        logger.info(f"[VALIDATION] Completed in {validation_time:.2f}s - Valid: {len(validated_leads)}/{len(content_results)}")
        
        if validated_leads:
            logger.info("[TOP LEADS] Top 5 validated leads:")
            for i, lead in enumerate(validated_leads[:5]):
                logger.info(f"  {i+1}. {lead['company_name']} (Score: {lead['score']:.1f}%) - {lead['url']}")
        
        return validated_leads
    
    def extract_company_name(self, title: str) -> str:
        """Extract company name from title."""
        # Remove common suffixes
        name = title
        for suffix in [" - Home", " | Homepage", " - Official", " - Website", " Ltd", " LLC", " Inc"]:
            name = name.replace(suffix, "")
        
        # Take first part before separators
        for sep in ["|", "-", ":", "/"]:
            if sep in name:
                name = name.split(sep)[0]
        
        return name.strip()
    
    async def hunt_leads(self, search_config: Dict[str, Any], 
                        target_leads: int = 30,
                        progress_callback: Optional[Callable] = None,
                        cancellation_check: Optional[Callable] = None) -> Dict[str, Any]:
        """
        Main entry point for lead hunting with parallel processing.
        """
        self.stats["start_time"] = datetime.now()
        all_validated_leads = []
        processed_urls = set()
        
        try:
            async with self.jina_client as client:
                # 1. Generate search queries
                if progress_callback:
                    await progress_callback({
                        "stage": "initialization",
                        "message": "Generating search queries...",
                        "progress": 5
                    })
                
                initial_queries = self.generate_search_queries(search_config)
                
                if not initial_queries:
                    return {
                        "success": False,
                        "error": "No search queries generated",
                        "leads": [],
                        "stats": self.stats
                    }
                
                # Start with initial queries
                available_queries = initial_queries.copy()
                fallback_level = 0
                
                # 2. Search in batches until we have enough leads
                pages_per_query = 3
                batch_size = 5
                total_iterations = 0
                max_iterations = 15  # Increased to allow for fallback queries
                consecutive_empty_iterations = 0
                
                while len(all_validated_leads) < target_leads and total_iterations < max_iterations:
                    total_iterations += 1
                    
                    # Check for cancellation
                    if cancellation_check and await cancellation_check():
                        logger.info("[HUNT CANCELLED] Cancellation requested, stopping search")
                        raise asyncio.CancelledError("Search cancelled by user")
                    
                    # Search progress
                    search_progress = 10 + (total_iterations * 10)
                    if progress_callback:
                        await progress_callback({
                            "stage": "searching",
                            "message": f"Searching... (iteration {total_iterations})",
                            "progress": min(search_progress, 40),
                            "leads_found": len(all_validated_leads)
                        })
                    
                    # Get next batch of queries
                    if not available_queries:
                        # Generate fallback queries if we're out of queries
                        fallback_level += 1
                        logger.info(f"[FALLBACK] No more queries available, generating fallback level {fallback_level}")
                        available_queries = self.generate_search_queries(search_config, fallback_level)
                        
                        if not available_queries:
                            logger.warning("[NO MORE QUERIES] Unable to generate more search queries")
                            break
                    
                    # Take up to batch_size queries
                    query_batch = available_queries[:batch_size]
                    available_queries = available_queries[batch_size:]
                    
                    # Search with batch
                    logger.info(f"[SEARCH BATCH] Iteration {total_iterations}: Searching {len(query_batch)} queries, {pages_per_query} pages each")
                    search_start = time.time()
                    
                    search_results = await client.search_multiple(query_batch, pages_per_query)
                    
                    search_time = time.time() - search_start
                    self.stats["search_time"] += search_time
                    logger.info(f"[SEARCH BATCH] Completed in {search_time:.2f}s - Found {len(search_results)} results")
                    
                    # Filter out already processed URLs
                    new_results = []
                    for result in search_results:
                        # Handle both 'url' and 'link' fields (Jina uses 'url')
                        url = result.get("url") or result.get("link")
                        if url and url not in processed_urls:
                            processed_urls.add(url)
                            result["url"] = url  # Ensure url field exists
                            result["search_query"] = query_batch[0]  # Track which query found it
                            new_results.append(result)
                    
                    if not new_results:
                        consecutive_empty_iterations += 1
                        self.stats["empty_iterations"] += 1
                        logger.warning(f"[ITERATION {total_iterations}] No new results found (empty iterations: {consecutive_empty_iterations})")
                        
                        # If we get 3 consecutive empty iterations, force fallback queries
                        if consecutive_empty_iterations >= 3:
                            logger.info("[FALLBACK TRIGGER] Too many empty iterations, forcing fallback queries")
                            available_queries = []  # Force fallback generation on next iteration
                            consecutive_empty_iterations = 0
                        
                        continue
                    else:
                        consecutive_empty_iterations = 0  # Reset counter
                        logger.info(f"[ITERATION {total_iterations}] Found {len(new_results)} new URLs to process")
                        
                        # Track query performance
                        for query in query_batch:
                            if query not in self.query_performance:
                                self.query_performance[query] = 0
                            self.query_performance[query] += len(new_results)
                    
                    # Check for cancellation before processing
                    if cancellation_check and await cancellation_check():
                        logger.info("[HUNT CANCELLED] Cancellation requested during processing")
                        raise asyncio.CancelledError("Search cancelled by user")
                    
                    # Process and validate results
                    validation_criteria = search_config.get("validationCriteria", {})
                    validation_criteria["industry"] = search_config.get("industry", "")
                    
                    validated_batch = await self.process_search_results(
                        new_results, 
                        validation_criteria,
                        progress_callback
                    )
                    
                    all_validated_leads.extend(validated_batch)
                    
                    logger.info(f"[ITERATION {total_iterations} COMPLETE] New leads: {len(validated_batch)}, Total leads: {len(all_validated_leads)}/{target_leads}")
                    self._log_system_info()
                    
                    # Update progress
                    if progress_callback:
                        await progress_callback({
                            "stage": "processing",
                            "message": f"Found {len(all_validated_leads)} leads so far...",
                            "progress": min(50 + (len(all_validated_leads) / target_leads) * 40, 90),
                            "leads_found": len(all_validated_leads),
                            "target": target_leads
                        })
                
                # 3. Final processing
                self.stats["end_time"] = datetime.now()
                duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
                
                logger.info("="*60)
                logger.info("[HUNT COMPLETE] Final Statistics:")
                logger.info(f"  Total duration: {duration:.2f}s")
                logger.info(f"  Search time: {self.stats['search_time']:.2f}s")
                logger.info(f"  Extraction time: {self.stats['extraction_time']:.2f}s")
                logger.info(f"  Validation time: {self.stats['validation_time']:.2f}s")
                logger.info(f"  Queries generated: {self.stats['queries_generated']}")
                logger.info(f"  Fallback queries used: {self.stats['fallback_queries_used']}")
                logger.info(f"  Empty iterations: {self.stats['empty_iterations']}")
                logger.info(f"  URLs found: {self.stats['urls_found']}")
                logger.info(f"  Content extracted: {self.stats['content_extracted']}")
                logger.info(f"  Leads validated: {len(all_validated_leads)}")
                
                # Log top performing queries
                if self.query_performance:
                    top_queries = sorted(self.query_performance.items(), key=lambda x: x[1], reverse=True)[:5]
                    logger.info("[TOP QUERIES] Best performing search queries:")
                    for query, count in top_queries:
                        logger.info(f"  '{query}': {count} results")
                
                logger.info("="*60)
                
                # Get final stats
                jina_stats = client.get_stats()
                
                # Prepare final results
                final_results = {
                    "success": True,
                    "leads": all_validated_leads[:target_leads],  # Limit to target
                    "total_found": len(all_validated_leads),
                    "stats": {
                        **self.stats,
                        "duration_seconds": duration,
                        "jina_stats": jina_stats
                    }
                }
                
                # Save results
                self.save_results(final_results)
                
                if progress_callback:
                    await progress_callback({
                        "stage": "completed",
                        "message": f"Search completed! Found {len(all_validated_leads)} validated leads.",
                        "progress": 100,
                        "leads_found": len(all_validated_leads)
                    })
                
                return final_results
                
        except asyncio.CancelledError:
            logger.info(f"[HUNT CANCELLED] Search was cancelled after finding {len(all_validated_leads)} leads")
            self.stats["end_time"] = datetime.now()
            
            # Return partial results
            return {
                "success": False,
                "cancelled": True,
                "error": "Search cancelled by user",
                "leads": all_validated_leads,
                "stats": self.stats
            }
            
        except Exception as e:
            logger.error(f"[CRITICAL ERROR] Lead hunting failed: {str(e)}", exc_info=True)
            self.stats["end_time"] = datetime.now()
            
            # Log partial results
            logger.info(f"[PARTIAL RESULTS] Found {len(all_validated_leads)} leads before error")
            
            return {
                "success": False,
                "error": str(e),
                "leads": all_validated_leads,
                "stats": self.stats
            }
    
    def save_results(self, results: Dict[str, Any]):
        """Save results to file for debugging."""
        try:
            Path("data").mkdir(exist_ok=True)
            
            # Save full results
            with open("data/hunter_results.json", "w") as f:
                json.dump(results, f, indent=2)
            
            # Save simplified lead list
            leads = results.get("leads", [])
            simplified = []
            
            for lead in leads:
                simplified.append({
                    "company": lead.get("company_name", "Unknown"),
                    "url": lead.get("url", ""),
                    "score": lead.get("score", 0),
                    "emails": lead.get("contact_info", {}).get("emails", []),
                    "phones": lead.get("contact_info", {}).get("phones", [])
                })
            
            with open("data/hunter_leads_simple.json", "w") as f:
                json.dump(simplified, f, indent=2)
                
            logger.info(f"Saved {len(leads)} leads to data/hunter_results.json")
            
        except Exception as e:
            logger.error(f"Error saving results: {e}")


# New pipeline integration functions
def start_hunter_search_background(search_id: str, config: dict):
    """
    Non-blocking kick: spawn the async pipeline on the event loop.
    Use this from your FastAPI route or job scheduler to return quickly.
    """
    global PIPELINE_AVAILABLE, run_hunter_pipeline
    
    logger.info(f"[BACKGROUND] PIPELINE_AVAILABLE: {PIPELINE_AVAILABLE}")
    
    # Try to import pipeline if not available
    if not PIPELINE_AVAILABLE:
        try:
            from ...services.hunter_pipeline import run_hunter_pipeline
            PIPELINE_AVAILABLE = True
            logger.info("[BACKGROUND] Successfully imported pipeline on demand")
        except ImportError:
            try:
                import sys, os
                backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                sys.path.insert(0, backend_root)
                from src.services.hunter_pipeline import run_hunter_pipeline
                PIPELINE_AVAILABLE = True
                logger.info("[BACKGROUND] Successfully imported pipeline via alternative path")
            except ImportError as e:
                logger.error(f"New pipeline not available even on demand: {e}")
                return
        
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = None
    if loop and loop.is_running():
        # running inside an existing loop (uvicorn): create task
        asyncio.create_task(_runner(search_id, config))
    else:
        # not running in loop (unit tests or CLI), run directly
        asyncio.run(_runner(search_id, config))

async def _runner(search_id: str, config: dict):
    try:
        final = await run_hunter_pipeline(search_id, config)

        # After pipeline completes, send summary/status updates via Convex client (3210)
        try:
            summary_total = len(final or [])
            verified_emails = 0
            verified_phones = 0
            try:
                verified_emails = sum(1 for item in (final or []) if item.get("email_valid"))
            except Exception:
                verified_emails = 0

            # Post updates via Convex client
            try:
                key = os.getenv("API_KEY")
                convex_client.action(
                    "hunterActions:updateSearchProgress",
                    {
                        "searchId": search_id,
                        "progress": 100,
                        "currentStage": "Completed",
                        "results": {
                            "totalLeads": summary_total,
                            "verifiedEmails": int(verified_emails),
                            "verifiedPhones": int(verified_phones),
                            "businessWebsites": summary_total,
                            "avgResponseRate": "N/A",
                            "searchTime": "N/A",
                        },
                        "status": "completed",
                        **({"authKey": key} if key else {}),
                    },
                )
            except Exception:
                logging.exception("convex action updateSearchProgress failed")
        except Exception:
            logging.exception("failed to post final Convex updates")
    except Exception:
        logging.exception("hunter pipeline failed for %s", search_id)
