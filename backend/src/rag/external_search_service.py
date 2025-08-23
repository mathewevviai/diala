"""
External search service for RAG workflows using Jina AI and DeepSeek.
"""

import os
import json
import asyncio
import aiohttp
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging

import openai

from ..core.logging import logger

class ExternalSearchService:
    """Service for performing external web searches using Jina AI."""
    
    def __init__(self):
        self.jina_api_key = os.getenv("JINA_API_KEY")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        
        # Initialize DeepSeek client for query formatting
        if self.deepseek_api_key:
            self.deepseek_client = openai.AsyncOpenAI(
                api_key=self.deepseek_api_key,
                base_url="https://api.deepseek.com/v1"
            )
        else:
            logger.warning("DEEPSEEK_API_KEY not set, using OpenAI for query formatting")
            self.deepseek_client = openai.AsyncOpenAI(
                api_key=os.getenv("OPENAI_API_KEY")
            )
        
        # Cache for formatted queries to avoid redundant API calls
        self.query_cache = {}
        
    async def format_keywords_to_queries(
        self, 
        keywords: List[str], 
        context: Optional[str] = None,
        max_queries: int = 5
    ) -> List[str]:
        """
        Convert a list of keywords into natural language search queries using DeepSeek.
        
        Args:
            keywords: List of keywords to convert
            context: Optional context about what kind of information is being searched
            max_queries: Maximum number of queries to generate
            
        Returns:
            List of formatted natural language queries
        """
        # Create cache key
        cache_key = f"{'-'.join(sorted(keywords))}-{context or 'none'}"
        
        # Check cache
        if cache_key in self.query_cache:
            logger.info(f"Using cached queries for keywords: {keywords}")
            return self.query_cache[cache_key]
        
        # Prepare the prompt
        keywords_str = ", ".join(keywords)
        
        prompt = f"""Given these keywords: {keywords_str}

Please convert them into {max_queries} different natural language search queries that would be effective for finding relevant web content.

Requirements:
1. Each query should be a complete, natural sentence or question
2. Queries should cover different aspects and combinations of the keywords
3. Use variations in phrasing to capture different types of content
4. Keep queries concise but comprehensive (under 100 characters each)
5. Focus on queries that would return high-quality, informative results

{f'Additional context: {context}' if context else ''}

Output format: Return only the queries, one per line, without numbering or other formatting.
"""
        
        try:
            logger.info(f"Formatting keywords to queries: {keywords}")
            
            response = await self.deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "You are a search query optimization expert. Create effective search queries from keywords."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Parse the response
            queries_text = response.choices[0].message.content.strip()
            queries = [q.strip() for q in queries_text.split('\n') if q.strip()]
            
            # Limit to max_queries
            queries = queries[:max_queries]
            
            logger.info(f"Generated {len(queries)} queries from keywords")
            for i, query in enumerate(queries, 1):
                logger.debug(f"Query {i}: {query}")
            
            # Cache the result
            self.query_cache[cache_key] = queries
            
            return queries
            
        except Exception as e:
            logger.error(f"Error formatting keywords to queries: {str(e)}")
            # Fallback: create simple queries from keywords
            fallback_queries = []
            
            # Create different combinations
            if len(keywords) >= 2:
                # Full combination
                fallback_queries.append(f"{' '.join(keywords[:3])} information")
                
                # Key pairs
                for i in range(0, len(keywords)-1, 2):
                    pair = keywords[i:i+2]
                    fallback_queries.append(f"What is {' '.join(pair)}")
                
                # Individual important keywords
                for keyword in keywords[:3]:
                    if len(keyword) > 3:  # Skip very short words
                        fallback_queries.append(f"{keyword} guide explained")
            else:
                # Single keyword
                fallback_queries.append(f"{keywords[0]} comprehensive guide")
            
            return fallback_queries[:max_queries]
    
    async def search_jina(
        self, 
        query: str, 
        page: int = 1,
        max_results: int = 10
    ) -> Dict[str, Any]:
        """
        Search using Jina AI Search API.
        
        Args:
            query: The search query
            page: Page number (1-indexed)
            max_results: Maximum number of results to return
            
        Returns:
            Dictionary containing search results
        """
        if not self.jina_api_key:
            logger.error("JINA_API_KEY not set")
            return {"results": [], "error": "JINA_API_KEY not configured"}
        
        try:
            # Prepare the request
            encoded_query = urllib.parse.quote(query)
            url = f"https://s.jina.ai/?q={encoded_query}&page={page}"
            
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.jina_api_key}",
                "X-Respond-With": "no-content"
            }
            
            logger.info(f"Searching Jina AI: query='{query}', page={page}")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=30) as response:
                    response.raise_for_status()
                    data = await response.json()
            
            # Check for successful response
            if data.get("code") != 200:
                logger.error(f"Jina AI API error: {data}")
                return {"results": [], "error": f"API returned code {data.get('code')}"}
            
            # Extract and format results
            search_results = data.get("data", [])
            formatted_results = []
            
            for i, result in enumerate(search_results[:max_results]):
                formatted_result = {
                    "position": i + 1 + ((page - 1) * max_results),
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("description", ""),
                    "content": result.get("content", ""),  # If available
                    "metadata": {
                        "source": "jina_ai",
                        "query": query,
                        "page": page,
                        "fetched_at": datetime.utcnow().isoformat()
                    }
                }
                formatted_results.append(formatted_result)
            
            logger.info(f"Found {len(formatted_results)} results from Jina AI")
            
            return {
                "results": formatted_results,
                "total": len(formatted_results),
                "query": query,
                "page": page
            }
            
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error searching Jina AI: {str(e)}")
            return {"results": [], "error": f"HTTP error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error searching Jina AI: {str(e)}")
            return {"results": [], "error": f"Unexpected error: {str(e)}"}
    
    async def search_with_formatted_queries(
        self,
        keywords: List[str],
        context: Optional[str] = None,
        max_queries: int = 3,
        max_results_per_query: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Perform searches using formatted queries from keywords.
        
        Args:
            keywords: List of keywords to search
            context: Optional context for query generation
            max_queries: Maximum number of queries to generate and search
            max_results_per_query: Maximum results per query
            
        Returns:
            Combined list of search results from all queries
        """
        # Generate formatted queries
        queries = await self.format_keywords_to_queries(keywords, context, max_queries)
        
        if not queries:
            logger.warning("No queries generated from keywords")
            return []
        
        # Execute searches in parallel
        search_tasks = []
        for query in queries:
            task = self.search_jina(query, page=1, max_results=max_results_per_query)
            search_tasks.append(task)
        
        # Wait for all searches to complete
        search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        # Combine and deduplicate results
        all_results = []
        seen_urls = set()
        
        for i, result in enumerate(search_results):
            if isinstance(result, Exception):
                logger.error(f"Search failed for query '{queries[i]}': {str(result)}")
                continue
            
            if "error" in result:
                logger.error(f"Search error for query '{queries[i]}': {result['error']}")
                continue
            
            for item in result.get("results", []):
                url = item.get("url")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    # Add query info to metadata
                    item["metadata"]["search_query"] = queries[i]
                    all_results.append(item)
        
        logger.info(f"Combined search found {len(all_results)} unique results from {len(queries)} queries")
        
        return all_results
    
    async def extract_content_from_results(
        self,
        search_results: List[Dict[str, Any]],
        max_content_length: int = 5000
    ) -> List[Dict[str, Any]]:
        """
        Extract and process content from search results.
        
        Args:
            search_results: List of search results
            max_content_length: Maximum length of content to keep per result
            
        Returns:
            Search results with processed content
        """
        processed_results = []
        
        for result in search_results:
            # Extract meaningful content
            content_parts = []
            
            # Title
            if result.get("title"):
                content_parts.append(f"Title: {result['title']}")
            
            # URL
            if result.get("url"):
                content_parts.append(f"Source: {result['url']}")
            
            # Snippet/Description
            if result.get("snippet"):
                content_parts.append(f"Summary: {result['snippet']}")
            
            # Full content if available
            if result.get("content"):
                # Truncate if too long
                content = result["content"]
                if len(content) > max_content_length:
                    content = content[:max_content_length] + "..."
                content_parts.append(f"Content: {content}")
            
            # Combine all parts
            full_content = "\n\n".join(content_parts)
            
            processed_result = {
                "url": result.get("url", ""),
                "title": result.get("title", ""),
                "content": full_content,
                "metadata": result.get("metadata", {}),
                "chunk_metadata": {
                    "source_type": "web_search",
                    "extraction_method": "jina_ai",
                    "processed_at": datetime.utcnow().isoformat()
                }
            }
            
            processed_results.append(processed_result)
        
        return processed_results


# Convenience function for quick search
async def search_external(
    keywords: List[str],
    context: Optional[str] = None,
    max_results: int = 10
) -> List[Dict[str, Any]]:
    """
    Convenience function to perform external search with keywords.
    
    Args:
        keywords: List of keywords to search
        context: Optional context for the search
        max_results: Maximum number of results to return
        
    Returns:
        List of search results with content
    """
    service = ExternalSearchService()
    
    # Calculate queries and results per query
    max_queries = min(3, max(1, max_results // 3))
    max_results_per_query = max(3, max_results // max_queries)
    
    # Perform search
    results = await service.search_with_formatted_queries(
        keywords=keywords,
        context=context,
        max_queries=max_queries,
        max_results_per_query=max_results_per_query
    )
    
    # Process and return results
    processed = await service.extract_content_from_results(results[:max_results])
    
    return processed