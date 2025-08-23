"""
Google Gemini Embeddings HTTP Client
"""

import asyncio
import aiohttp
import logging
from typing import List, Optional, Dict, Any, Union
from .config import GeminiConfig
from .models import GeminiEmbeddingRequest, GeminiEmbeddingResponse, GeminiModelInfo, GeminiEmbeddingConfig

logger = logging.getLogger(__name__)

class GeminiEmbeddingsClient:
    """HTTP client for Google Gemini Embeddings API"""
    
    def __init__(self, config: Optional[GeminiConfig] = None):
        self.config = config or GeminiConfig()
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
        content: Union[str, List[str]], 
        task_type: str = "SEMANTIC_SIMILARITY",
        output_dimensionality: Optional[int] = None
    ) -> GeminiEmbeddingResponse:
        """
        Create embeddings for text content
        
        Args:
            content: Text or list of texts to embed
            task_type: Task optimization type
            output_dimensionality: Optional dimension truncation (MRL)
            
        Returns:
            GeminiEmbeddingResponse with embeddings
        """
        if not self.session:
            await self.start_session()
            
        if not self.config.api_key:
            raise ValueError("Google API key is required")
            
        # Prepare request body
        request_body = {
            "requests": []
        }
        
        # Handle single string or list
        contents = [content] if isinstance(content, str) else content
        
        for text in contents:
            embed_request = {
                "model": f"models/{self.config.model_name}",
                "content": {
                    "parts": [{"text": text}]
                }
            }
            
            # Add configuration if provided
            if task_type or output_dimensionality:
                embed_request["config"] = {}
                if task_type:
                    embed_request["config"]["task_type"] = task_type
                if output_dimensionality:
                    embed_request["config"]["output_dimensionality"] = output_dimensionality
                    
            request_body["requests"].append(embed_request)
        
        try:
            # Make API request
            url = f"{self.config.base_url}/models/{self.config.model_name}:batchEmbedContents"
            params = {"key": self.config.api_key}
            
            async with self.session.post(
                url,
                json=request_body,
                params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Transform response to match our model
                    embeddings = []
                    if "embeddings" in data:
                        for embedding_data in data["embeddings"]:
                            if "values" in embedding_data:
                                embeddings.append({
                                    "values": embedding_data["values"]
                                })
                    
                    return GeminiEmbeddingResponse(embeddings=embeddings)
                else:
                    error_text = await response.text()
                    logger.error(f"Gemini API error {response.status}: {error_text}")
                    raise Exception(f"API request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Error creating embeddings: {e}")
            raise
            
    async def get_model_info(self) -> GeminiModelInfo:
        """
        Get information about the Gemini experimental model
        
        Returns:
            GeminiModelInfo with model specifications
        """
        return GeminiModelInfo(
            id=self.config.model_name,
            name="Gemini Embedding Experimental",
            description="State-of-the-art experimental embedding model with SOTA MTEB performance. Features 8K context, MRL support, and 100+ languages.",
            dimensions=self.config.dimensions,
            max_dimensions=3072,
            alternative_dimensions=self.config.alternative_dimensions,
            max_tokens=self.config.max_tokens,
            mteb_score=self.config.mteb_score,
            margin_over_next=self.config.margin_over_next,
            multimodal=True,
            multilingual=True,
            supported_languages=self.config.supported_languages,
            experimental=True,
            has_mrl=True,
            supported_tasks=self.config.supported_tasks,
            rate_limit_rpm=self.config.rate_limit_rpm
        )
        
    async def batch_embeddings(
        self, 
        texts: List[str], 
        task_type: str = "SEMANTIC_SIMILARITY",
        output_dimensionality: Optional[int] = None,
        batch_size: Optional[int] = None
    ) -> List[List[float]]:
        """
        Create embeddings for large lists of texts using batching
        
        Args:
            texts: List of texts to embed
            task_type: Task optimization type
            output_dimensionality: Optional dimension truncation
            batch_size: Optional batch size override
            
        Returns:
            List of embedding vectors
        """
        batch_size = batch_size or self.config.batch_size
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self.create_embeddings(
                batch, 
                task_type=task_type,
                output_dimensionality=output_dimensionality
            )
            
            # Extract embeddings in order
            batch_embeddings = [embedding.values for embedding in response.embeddings]
            all_embeddings.extend(batch_embeddings)
            
        return all_embeddings
        
    async def health_check(self) -> bool:
        """
        Check if the Gemini API is accessible
        
        Returns:
            True if API is healthy, False otherwise
        """
        try:
            # Test with a simple embedding
            await self.create_embeddings("test")
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False