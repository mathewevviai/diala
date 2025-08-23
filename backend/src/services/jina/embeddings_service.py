# Factory function for compatibility with other modules

# Factory function for compatibility with other modules
def get_jina_embeddings_service(config=None) -> 'JinaEmbeddingsService':
    """
    Returns a new instance of JinaEmbeddingsService.
    You can enhance this to use a true singleton if needed.
    """
    return JinaEmbeddingsService(config)
"""
Jina Embeddings v4 Service Layer - Optimized for Transcript Processing
"""

import asyncio
import logging
import tiktoken
from typing import List, Dict, Any, Optional
from .embeddings_client import JinaEmbeddingsClient
from .config import JinaConfig
from .models import JinaModelInfo, TranscriptEmbeddingConfig

logger = logging.getLogger(__name__)

class JinaEmbeddingsService:
    """High-level service for Jina Embeddings v4 operations - Transcript focused"""
    
    def __init__(self, config: Optional[JinaConfig] = None):
        logger.info("Initializing JINA v4 EmbeddingsService for transcript processing...")
        try:
            self.config = config or JinaConfig()
            logger.info(f"JINA v4 Config loaded - API key present: {bool(self.config.api_key)}")
            logger.info(f"JINA v4 Features - Late chunking: {self.config.late_chunking}, Context: {self.config.context_length}")
            self.client = JinaEmbeddingsClient(self.config)
            
            # Initialize tokenizer for transcript processing
            try:
                self.tokenizer = tiktoken.get_encoding("cl100k_base")
            except:
                logger.warning("Could not load tiktoken, using approximate token counting")
                self.tokenizer = None
                
            logger.info("JINA v4 EmbeddingsClient created successfully")
        except Exception as e:
            logger.error(f"Error in JINA v4 EmbeddingsService.__init__: {e}")
            raise
        
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken or approximation"""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        else:
            # Rough approximation: 1 token ≈ 4 characters
            return len(text) // 4
    
    async def embed_transcripts(
        self, 
        transcripts: List[str], 
        config: Optional[TranscriptEmbeddingConfig] = None
    ) -> List[Dict[str, Any]]:
        """
        Embed video transcripts with optimal JINA V4 settings
        
        Args:
            transcripts: List of video transcript texts
            config: Optional configuration for transcript embedding
            
        Returns:
            List of embedding results with metadata
        """
        config = config or TranscriptEmbeddingConfig()
        results = []
        
        try:
            async with self.client:
                for i, transcript in enumerate(transcripts):
                    token_count = self._count_tokens(transcript)
                    
                    logger.info(f"Processing transcript {i+1}/{len(transcripts)} - {token_count} tokens")
                    
                    # Determine if we need chunking
                    if token_count > self.config.max_tokens and not config.late_chunking:
                        # Traditional chunking for very long transcripts
                        chunks = await self._chunk_transcript(transcript, config)
                        embeddings = await self.client.create_embeddings(
                            [chunk["text"] for chunk in chunks],
                            task=config.task,
                            dimensions=config.dimensions,
                            late_chunking=False
                        )
                        
                        result = {
                            "transcript_index": i,
                            "token_count": token_count,
                            "chunks": len(chunks),
                            "embeddings": [emb.embedding for emb in embeddings.data],
                            "chunk_metadata": chunks,
                            "processing_method": "traditional_chunking"
                        }
                    else:
                        # Use late chunking or direct embedding
                        embeddings = await self.client.create_embeddings(
                            [transcript],
                            task=config.task,
                            dimensions=config.dimensions,
                            late_chunking=config.late_chunking,
                            truncate_at_maximum_length=True
                        )
                        
                        result = {
                            "transcript_index": i,
                            "token_count": token_count,
                            "chunks": 1,
                            "embeddings": [embeddings.data[0].embedding],
                            "processing_method": "late_chunking" if config.late_chunking else "direct"
                        }
                    
                    results.append(result)
                    
            logger.info(f"Successfully embedded {len(transcripts)} transcripts")
            return results
            
        except Exception as e:
            logger.error(f"Error embedding transcripts: {e}")
            raise
    
    async def embed_for_rag(
        self, 
        transcripts: List[str],
        dimensions: int = 1024
    ) -> List[Dict[str, Any]]:
        """
        Embed transcripts optimized for RAG (Retrieval-Augmented Generation)
        
        Args:
            transcripts: List of video transcript texts
            dimensions: Embedding dimensions (128-2048)
            
        Returns:
            RAG-optimized embedding results
        """
        config = TranscriptEmbeddingConfig(
            task="retrieval.passage",
            dimensions=dimensions,
            late_chunking=True,
            optimize_for_rag=True
        )
        
        return await self.embed_transcripts(transcripts, config)
    
    async def _chunk_transcript(
        self, 
        transcript: str, 
        config: TranscriptEmbeddingConfig
    ) -> List[Dict[str, Any]]:
        """
        Intelligently chunk a long transcript
        
        Args:
            transcript: Long transcript text
            config: Configuration for chunking
            
        Returns:
            List of text chunks with metadata
        """
        # Default chunk size based on token limits
        chunk_size = config.chunk_size or (self.config.max_tokens - 100)  # Leave buffer
        chunk_overlap = config.chunk_overlap or (chunk_size // 10)  # 10% overlap
        
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(transcript):
            # Find sentence boundaries for better chunking
            end = min(start + chunk_size, len(transcript))
            
            # Try to end at sentence boundary
            if end < len(transcript):
                # Look for sentence endings within the last 200 characters
                sentence_end = transcript.rfind('.', end - 200, end)
                if sentence_end > start:
                    end = sentence_end + 1
            
            chunk_text = transcript[start:end].strip()
            
            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "chunk_index": chunk_index,
                    "start_char": start,
                    "end_char": end,
                    "token_count": self._count_tokens(chunk_text)
                })
                chunk_index += 1
            
            # Move start position with overlap
            start = max(start + 1, end - chunk_overlap)
        
        logger.info(f"Chunked transcript into {len(chunks)} chunks")
        return chunks
            
    async def get_model_capabilities(self) -> JinaModelInfo:
        """
        Get detailed information about Jina v4 model capabilities
        
        Returns:
            JinaModelInfo with specifications and performance metrics
        """
        try:
            async with self.client:
                return await self.client.get_model_info()
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            raise
            
    async def test_connection(self) -> bool:
        """
        Test if the Jina API is accessible
        
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
        Get pricing information for Jina v4 embeddings
        
        Returns:
            Dictionary with pricing details
        """
        return {
            "model": "jina-embeddings-v4",
            "price_per_1k_tokens": 0.00002,  # $0.00002 per 1K tokens
            "currency": "USD",
            "billing_unit": "tokens",
            "free_tier": {
                "available": True,
                "monthly_limit": 1000000,  # 1M tokens per month
                "rate_limit": "600 requests/minute"
            },
            "enterprise": {
                "available": True,
                "custom_pricing": True,
                "dedicated_support": True
            }
        }
        
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get performance benchmarks for Jina v4
        
        Returns:
            Dictionary with performance metrics
        """
        return {
            "model": "jina-embeddings-v4",
            "parameters": "3.8B",
            "benchmarks": {
                "mteb_average": 64.41,
                "retrieval": 50.87,
                "clustering": 49.62,
                "classification": 75.45,
                "reranking": 58.89,
                "sts": 77.12,
                "pair_classification": 85.34,
                "summarization": 31.05
            },
            "languages": {
                "supported": 100,
                "primary": ["en", "zh", "ja", "ko", "ar", "th", "vi", "de", "fr", "es", "it", "pt", "ru", "hi"],
                "multilingual_score": 63.2
            },
            "multimodal": {
                "text": True,
                "images": True,
                "code": True,
                "structured_data": True
            },
            "context_length": 8192,
            "embedding_dimensions": 1024
        }
        
    async def chunk_and_embed(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
        """
        Chunk a large text and create embeddings for each chunk
        
        Args:
            text: Large text to chunk and embed
            chunk_size: Size of each chunk in characters
            overlap: Overlap between chunks
            
        Returns:
            List of chunks with embeddings
        """
        try:
            # Simple text chunking
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
                
            # Create embeddings for all chunks using transcript method
            chunk_texts = [chunk["text"] for chunk in chunks]
            embedding_results = await self.embed_transcripts(chunk_texts)
            
            # Combine chunks with embeddings
            for i, chunk in enumerate(chunks):
                if i < len(embedding_results):
                    chunk["embedding"] = embedding_results[i]["embeddings"][0]
                    chunk["embedding_metadata"] = {
                        "dimensions": len(embedding_results[i]["embeddings"][0]),
                        "processing_method": embedding_results[i]["processing_method"]
                    }
                
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking and embedding text: {e}")
            raise
            
    async def embed_query(self, query: str, dimensions: int = 1024) -> List[float]:
        """
        Embed a search query optimized for RAG retrieval
        
        Args:
            query: Search query text
            dimensions: Embedding dimensions
            
        Returns:
            Query embedding vector
        """
        try:
            async with self.client:
                response = await self.client.create_embeddings(
                    [query],
                    task="retrieval.query",
                    dimensions=dimensions,
                    late_chunking=False  # Queries are typically short
                )
                
                return response.data[0].embedding
                
        except Exception as e:
            logger.error(f"Error embedding query: {e}")
            raise
            
    async def embed_batch_transcripts(
        self,
        transcripts: List[str],
        batch_size: int = 10,
        dimensions: int = 1024
    ) -> List[Dict[str, Any]]:
        """
        Efficiently embed large batches of transcripts
        
        Args:
            transcripts: List of transcript texts
            batch_size: Batch size for processing
            dimensions: Embedding dimensions
            
        Returns:
            List of embedding results
        """
        try:
            async with self.client:
                return await self.client.batch_embeddings(
                    transcripts,
                    batch_size=batch_size,
                    task="retrieval.passage",
                    dimensions=dimensions,
                    late_chunking=True
                )
                
        except Exception as e:
            logger.error(f"Error batch embedding transcripts: {e}")
            raise