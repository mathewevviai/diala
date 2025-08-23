"""
Google Gemini Embeddings Service Layer
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from .embeddings_client import GeminiEmbeddingsClient
from .config import GeminiConfig
from .models import GeminiModelInfo

logger = logging.getLogger(__name__)

class GeminiEmbeddingsService:
    """High-level service for Google Gemini Embeddings operations"""
    
    def __init__(self, config: Optional[GeminiConfig] = None):
        logger.info("Initializing GeminiEmbeddingsService...")
        try:
            self.config = config or GeminiConfig()
            logger.info(f"GeminiConfig loaded - API key present: {bool(self.config.api_key)}")
            self.client = GeminiEmbeddingsClient(self.config)
            logger.info("GeminiEmbeddingsClient created successfully")
        except Exception as e:
            logger.error(f"Error in GeminiEmbeddingsService.__init__: {e}")
            raise
        
    async def embed_documents(
        self, 
        documents: List[str],
        output_dimensionality: Optional[int] = None
    ) -> List[List[float]]:
        """
        Embed a list of documents for retrieval
        
        Args:
            documents: List of document texts
            output_dimensionality: Optional dimension truncation (MRL)
            
        Returns:
            List of embedding vectors
        """
        try:
            async with self.client:
                return await self.client.batch_embeddings(
                    documents, 
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=output_dimensionality
                )
        except Exception as e:
            logger.error(f"Error embedding documents: {e}")
            raise
            
    async def embed_queries(
        self, 
        queries: List[str],
        output_dimensionality: Optional[int] = None
    ) -> List[List[float]]:
        """
        Embed a list of queries for retrieval
        
        Args:
            queries: List of query texts
            output_dimensionality: Optional dimension truncation (MRL)
            
        Returns:
            List of embedding vectors
        """
        try:
            async with self.client:
                return await self.client.batch_embeddings(
                    queries, 
                    task_type="RETRIEVAL_QUERY",
                    output_dimensionality=output_dimensionality
                )
        except Exception as e:
            logger.error(f"Error embedding queries: {e}")
            raise
            
    async def embed_for_classification(
        self, 
        texts: List[str],
        output_dimensionality: Optional[int] = None
    ) -> List[List[float]]:
        """
        Embed texts optimized for classification tasks
        
        Args:
            texts: List of texts to classify
            output_dimensionality: Optional dimension truncation (MRL)
            
        Returns:
            List of embedding vectors
        """
        try:
            async with self.client:
                return await self.client.batch_embeddings(
                    texts, 
                    task_type="CLASSIFICATION",
                    output_dimensionality=output_dimensionality
                )
        except Exception as e:
            logger.error(f"Error embedding for classification: {e}")
            raise
            
    async def embed_for_clustering(
        self, 
        texts: List[str],
        output_dimensionality: Optional[int] = None
    ) -> List[List[float]]:
        """
        Embed texts optimized for clustering tasks
        
        Args:
            texts: List of texts to cluster
            output_dimensionality: Optional dimension truncation (MRL)
            
        Returns:
            List of embedding vectors
        """
        try:
            async with self.client:
                return await self.client.batch_embeddings(
                    texts, 
                    task_type="CLUSTERING",
                    output_dimensionality=output_dimensionality
                )
        except Exception as e:
            logger.error(f"Error embedding for clustering: {e}")
            raise
            
    async def get_model_capabilities(self) -> GeminiModelInfo:
        """
        Get detailed information about Gemini experimental model capabilities
        
        Returns:
            GeminiModelInfo with specifications and performance metrics
        """
        try:
            async with self.client:
                return await self.client.get_model_info()
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            raise
            
    async def test_connection(self) -> bool:
        """
        Test if the Gemini API is accessible
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            async with self.client:
                return await self.client.health_check()
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
            
    def get_pricing_info(self) -> Dict[str, Any]:
        """
        Get pricing information for Gemini embeddings (experimental)
        
        Returns:
            Dictionary with pricing details
        """
        return {
            "model": "gemini-embedding-exp-03-07",
            "status": "experimental",
            "pricing": "Free during experimental phase",
            "currency": "USD",
            "billing_unit": "requests",
            "limitations": {
                "rate_limit": f"{self.config.rate_limit_rpm} requests/minute",
                "capacity": "Limited during experimental phase",
                "stability": "Subject to change"
            },
            "future_pricing": {
                "estimated": "TBD - will be announced at GA",
                "comparison": "Expected to be competitive with other SOTA models"
            }
        }
        
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get performance benchmarks for Gemini experimental model
        
        Returns:
            Dictionary with performance metrics
        """
        return {
            "model": "gemini-embedding-exp-03-07",
            "status": "experimental",
            "benchmarks": {
                "mteb_multilingual_score": self.config.mteb_score,
                "ranking": "#1 on MTEB Multilingual leaderboard",
                "margin_over_next": f"+{self.config.margin_over_next} points",
                "domains": [
                    "finance", "science", "legal", "search", 
                    "general", "code", "multilingual"
                ]
            },
            "capabilities": {
                "context_length": self.config.context_length,
                "embedding_dimensions": {
                    "default": self.config.dimensions,
                    "options": self.config.alternative_dimensions,
                    "mrl_support": True
                },
                "languages": {
                    "supported": self.config.supported_languages,
                    "type": "100+ languages including low-resource"
                },
                "multimodal": True,
                "task_optimization": self.config.supported_tasks
            },
            "technical_features": {
                "matryoshka_representation_learning": True,
                "task_specific_optimization": True,
                "unified_model": True,
                "gemini_trained": True
            }
        }
        
    async def chunk_and_embed(
        self, 
        text: str, 
        chunk_size: int = 2000, 
        overlap: int = 200,
        task_type: str = "RETRIEVAL_DOCUMENT",
        output_dimensionality: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Chunk a large text and create embeddings for each chunk
        
        Args:
            text: Large text to chunk and embed
            chunk_size: Size of each chunk in characters (larger for 8K context)
            overlap: Overlap between chunks
            task_type: Task optimization type
            output_dimensionality: Optional dimension truncation (MRL)
            
        Returns:
            List of chunks with embeddings
        """
        try:
            # Improved text chunking for 8K context
            chunks = []
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk_text = text[start:end]
                chunks.append({
                    "text": chunk_text,
                    "start": start,
                    "end": end,
                    "length": len(chunk_text)
                })
                start = end - overlap
                
            # Create embeddings for all chunks
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = await self.client.batch_embeddings(
                chunk_texts,
                task_type=task_type,
                output_dimensionality=output_dimensionality
            )
            
            # Combine chunks with embeddings
            for i, chunk in enumerate(chunks):
                chunk["embedding"] = embeddings[i]
                chunk["task_type"] = task_type
                chunk["dimensions"] = output_dimensionality or self.config.dimensions
                
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking and embedding text: {e}")
            raise