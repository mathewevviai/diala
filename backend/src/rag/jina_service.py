"""
Jina AI integration service for embeddings and content extraction.
"""

import os
import asyncio
import httpx
from typing import List, Dict, Any, Optional, Union
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class JinaService:
    """Service for interacting with Jina AI APIs."""
    
    def __init__(self):
        self.api_key = os.getenv("JINA_API_KEY")
        if not self.api_key:
            raise ValueError("JINA_API_KEY environment variable not set")
            
        self.embedding_url = "https://api.jina.ai/v1/embeddings"
        self.reader_url = "https://r.jina.ai"
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
        
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str = "jina-clip-v2",
        dimensions: int = 1024,
        normalize: bool = True,
        batch_size: int = 32
    ) -> List[List[float]]:
        """
        Generate embeddings for a list of texts using Jina AI.
        
        Args:
            texts: List of text strings to embed
            model: Embedding model to use
            dimensions: Output dimensions
            normalize: Whether to L2 normalize embeddings
            batch_size: Number of texts to process in each API call
            
        Returns:
            List of embedding vectors
        """
        all_embeddings = []
        
        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            # Prepare request
            payload = {
                "model": model,
                "input": [{"text": text} for text in batch],
                "encoding_type": "float",
                "dimensions": dimensions,
                "task": "text-matching",
                "normalize": normalize,
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            try:
                response = await self.client.post(
                    self.embedding_url,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
                result = response.json()
                embeddings = [item["embedding"] for item in result["data"]]
                all_embeddings.extend(embeddings)
                
                # Log token usage
                if "usage" in result:
                    logger.info(f"Jina embedding tokens used: {result['usage']['total_tokens']}")
                    
            except httpx.HTTPError as e:
                logger.error(f"Error generating embeddings: {e}")
                raise
                
            # Rate limiting - wait between batches
            if i + batch_size < len(texts):
                await asyncio.sleep(0.5)
                
        return all_embeddings
        
    async def extract_content_from_url(
        self,
        url: str,
        return_format: str = "text",
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Extract content from a URL using Jina Reader.
        
        Args:
            url: URL to extract content from
            return_format: Format for returned content ("text", "markdown", "html")
            timeout: Request timeout in seconds
            
        Returns:
            Dictionary with extracted content and metadata
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-Return-Format": return_format,
            "X-With-Generated-Alt": "true",
        }
        
        try:
            response = await self.client.get(
                f"{self.reader_url}/{url}",
                headers=headers,
                timeout=timeout
            )
            response.raise_for_status()
            
            content = response.text
            
            return {
                "content": content,
                "url": url,
                "format": return_format,
                "extracted_at": datetime.utcnow().isoformat(),
                "success": True,
            }
            
        except httpx.HTTPError as e:
            logger.error(f"Error extracting content from {url}: {e}")
            return {
                "content": None,
                "url": url,
                "error": str(e),
                "success": False,
            }
            
    async def extract_youtube_transcript(
        self,
        video_url: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Extract transcript from YouTube video using Jina Reader.
        
        Args:
            video_url: YouTube video URL
            language: Language code for transcript
            
        Returns:
            Dictionary with transcript and metadata
        """
        # Jina Reader can extract YouTube transcripts directly
        result = await self.extract_content_from_url(
            video_url,
            return_format="text"
        )
        
        if result["success"]:
            # Parse YouTube metadata from content if available
            content = result["content"]
            
            # Extract video info from content (Jina includes metadata)
            lines = content.split('\n')
            metadata = {}
            transcript_start = 0
            
            for i, line in enumerate(lines):
                if line.startswith("Title:"):
                    metadata["title"] = line.replace("Title:", "").strip()
                elif line.startswith("Author:"):
                    metadata["author"] = line.replace("Author:", "").strip()
                elif line.startswith("Duration:"):
                    metadata["duration"] = line.replace("Duration:", "").strip()
                elif line.strip() == "":
                    transcript_start = i + 1
                    break
                    
            transcript = '\n'.join(lines[transcript_start:])
            
            return {
                "transcript": transcript,
                "metadata": metadata,
                "url": video_url,
                "language": language,
                "success": True,
            }
        else:
            return result
            
    async def process_batch_urls(
        self,
        urls: List[str],
        return_format: str = "text",
        max_concurrent: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Process multiple URLs concurrently with rate limiting.
        
        Args:
            urls: List of URLs to process
            return_format: Format for returned content
            max_concurrent: Maximum concurrent requests
            
        Returns:
            List of extraction results
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_url(url: str) -> Dict[str, Any]:
            async with semaphore:
                return await self.extract_content_from_url(url, return_format)
                
        tasks = [process_url(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions in results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "url": urls[i],
                    "error": str(result),
                    "success": False,
                })
            else:
                processed_results.append(result)
                
        return processed_results
        
    def calculate_embedding_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        similarity = dot_product / (norm1 * norm2)
        return float(similarity)
        
    async def search_embeddings(
        self,
        query: str,
        embeddings: List[Dict[str, Any]],
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search embeddings using a query.
        
        Args:
            query: Search query
            embeddings: List of embedding dictionaries with 'embedding' and 'text' keys
            top_k: Number of top results to return
            
        Returns:
            Top k most similar embeddings with scores
        """
        # Generate embedding for query
        query_embedding = await self.generate_embeddings([query])
        if not query_embedding:
            return []
            
        query_vec = query_embedding[0]
        
        # Calculate similarities
        results = []
        for emb in embeddings:
            similarity = self.calculate_embedding_similarity(
                query_vec,
                emb["embedding"]
            )
            results.append({
                **emb,
                "similarity": similarity
            })
            
        # Sort by similarity and return top k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
        
    def estimate_cost(
        self,
        num_texts: int,
        avg_text_length: int,
        model: str = "jina-clip-v2"
    ) -> Dict[str, float]:
        """
        Estimate cost for embedding generation.
        
        Args:
            num_texts: Number of texts to embed
            avg_text_length: Average length of texts in characters
            model: Embedding model
            
        Returns:
            Cost estimation details
        """
        # Rough token estimation (1 token ≈ 4 characters)
        avg_tokens_per_text = avg_text_length / 4
        total_tokens = num_texts * avg_tokens_per_text
        
        # Jina pricing (as of 2024, check for updates)
        # Approximate: $0.02 per 1M tokens
        cost_per_million_tokens = 0.02
        
        estimated_cost = (total_tokens / 1_000_000) * cost_per_million_tokens
        
        return {
            "num_texts": num_texts,
            "estimated_tokens": int(total_tokens),
            "estimated_cost_usd": round(estimated_cost, 4),
            "model": model,
        }