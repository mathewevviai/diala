"""
Jina Embeddings v4 HTTP Client
"""

import asyncio
import aiohttp
import logging
from typing import List, Optional, Dict, Any
from .config import JinaConfig
from .models import JinaEmbeddingRequest, JinaEmbeddingResponse, JinaModelInfo

logger = logging.getLogger(__name__)

class JinaEmbeddingsClient:
    """HTTP client for Jina Embeddings v4 API"""
    
    def __init__(self, config: Optional[JinaConfig] = None):
        self.config = config or JinaConfig()
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        await self.start_session()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close_session()
        
    async def start_session(self):
        """Start HTTP session"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={
                    'Authorization': f'Bearer {self.config.api_key}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'diala-backend/1.0'
                }
            )
            
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
            
    async def create_embeddings(
        self, 
        texts: List[str], 
        task: Optional[str] = None,
        dimensions: Optional[int] = None,
        late_chunking: Optional[bool] = None,
        truncate_at_maximum_length: Optional[bool] = None,
        output_multi_vector_embeddings: Optional[bool] = None,
        output_data_type: Optional[str] = None,
        **kwargs
    ) -> JinaEmbeddingResponse:
        """
        Create embeddings for a list of texts using Jina v4 API
        
        Args:
            texts: List of texts to embed
            task: Task type (retrieval.passage, retrieval.query, text-matching, etc.)
            dimensions: Embedding dimensions (128-2048)
            late_chunking: Enable late chunking for long texts
            truncate_at_maximum_length: Truncate instead of error for long texts
            output_multi_vector_embeddings: Output multi-vector embeddings
            output_data_type: Output format (float, binary, base64)
            **kwargs: Additional parameters for the request
            
        Returns:
            JinaEmbeddingResponse with embeddings
        """
        if not self.session:
            await self.start_session()
            
        if not self.config.api_key:
            raise ValueError("Jina API key is required")
            
        # Prepare request with V4 parameters
        request_data = {
            "input": texts,
            "model": self.config.model_name,
            "task": task or self.config.task,
            "dimensions": dimensions or self.config.dimensions,
            **kwargs
        }
        
        # Add V4-specific parameters if provided
        if late_chunking is not None:
            request_data["late_chunking"] = late_chunking
        elif hasattr(self.config, 'late_chunking'):
            request_data["late_chunking"] = self.config.late_chunking
            
        if truncate_at_maximum_length is not None:
            request_data["truncate_at_maximum_length"] = truncate_at_maximum_length
        elif hasattr(self.config, 'truncate_at_maximum_length'):
            request_data["truncate_at_maximum_length"] = self.config.truncate_at_maximum_length
            
        if output_multi_vector_embeddings is not None:
            request_data["output_multi_vector_embeddings"] = output_multi_vector_embeddings
        elif hasattr(self.config, 'output_multi_vector_embeddings'):
            request_data["output_multi_vector_embeddings"] = self.config.output_multi_vector_embeddings
            
        if output_data_type is not None:
            request_data["output_data_type"] = output_data_type
        elif hasattr(self.config, 'output_data_type'):
            request_data["output_data_type"] = self.config.output_data_type
        
        try:
            logger.info(f"Creating V4 embeddings for {len(texts)} texts with task: {request_data.get('task')}")
            
            # Make API request
            async with self.session.post(
                f"{self.config.base_url}/embeddings",
                json=request_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return JinaEmbeddingResponse(**data)
                else:
                    error_text = await response.text()
                    logger.error(f"Jina API error {response.status}: {error_text}")
                    raise Exception(f"API request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Error creating embeddings: {e}")
            raise
            
    async def embed_transcripts(
        self,
        transcripts: List[str],
        dimensions: int = 1024,
        late_chunking: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Embed video transcripts with optimal V4 settings
        
        Args:
            transcripts: List of video transcript texts
            dimensions: Embedding dimensions
            late_chunking: Enable late chunking for long transcripts
            
        Returns:
            List of embedding results with metadata
        """
        logger.info(f"Embedding {len(transcripts)} transcripts for RAG")
        
        response = await self.create_embeddings(
            transcripts,
            task="retrieval.passage",
            dimensions=dimensions,
            late_chunking=late_chunking,
            truncate_at_maximum_length=True
        )
        
        # Format results with metadata
        results = []
        for i, data in enumerate(response.data):
            results.append({
                "transcript_index": i,
                "embedding": data.embedding,
                "dimensions": len(data.embedding),
                "processing_method": "late_chunking" if late_chunking else "direct"
            })
            
        logger.info(f"Successfully embedded {len(results)} transcripts")
        return results
        
    async def get_model_info(self) -> JinaModelInfo:
        """
        Get information about the Jina v4 model
        
        Returns:
            JinaModelInfo with model specifications
        """
        return JinaModelInfo(
            id=self.config.model_name,
            name="Jina Embeddings v4",
            description="3.8B parameter universal embedding model optimized for transcript processing",
            dimensions=self.config.dimensions,
            max_tokens=self.config.max_tokens,
            parameters=self.config.parameters,
            github_repo=self.config.github_repo,
            github_stars=self.config.github_stars,
            mteb_score=self.config.mteb_avg_score,
            retrieval_score=self.config.retrieval_score
        )
        
    async def batch_embeddings(
        self, 
        texts: List[str], 
        batch_size: Optional[int] = None,
        task: str = "retrieval.passage",
        dimensions: Optional[int] = None,
        late_chunking: bool = True
    ) -> List[List[float]]:
        """
        Create embeddings for large lists of texts using batching - optimized for transcripts
        
        Args:
            texts: List of texts to embed
            batch_size: Optional batch size override
            task: Task type for embedding (retrieval.passage for transcripts)
            dimensions: Embedding dimensions
            late_chunking: Enable late chunking for long transcripts
            
        Returns:
            List of embedding vectors
        """
        batch_size = batch_size or self.config.batch_size
        all_embeddings = []
        
        logger.info(f"Batch processing {len(texts)} texts in batches of {batch_size}")
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            response = await self.create_embeddings(
                batch,
                task=task,
                dimensions=dimensions,
                late_chunking=late_chunking
            )
            
            # Extract embeddings in order
            batch_embeddings = [data.embedding for data in response.data]
            all_embeddings.extend(batch_embeddings)
            
        logger.info(f"Completed batch processing - generated {len(all_embeddings)} embeddings")
        return all_embeddings
        
    async def health_check(self) -> bool:
        """
        Check if the Jina API is accessible
        
        Returns:
            True if API is healthy, False otherwise
        """
        try:
            # Test with a simple embedding using V4 parameters
            await self.create_embeddings(
                ["test transcript content"],
                task="retrieval.passage",
                dimensions=128,  # Use smallest dimension for health check
                late_chunking=False
            )
            logger.info("Jina V4 API health check passed")
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False