"""
Batch Embedding Service for Efficient Processing

This service provides batch processing capabilities for both Jina AI and Gemini embeddings,
with optimizations for rate limiting, memory management, and export preparation.
"""

import asyncio
import logging
import time
import json
import numpy as np
from typing import List, Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import pickle
from pathlib import Path

from .jina.embeddings_service import JinaEmbeddingsService
from .jina.config import JinaConfig
from .gemini.embeddings_service import GeminiEmbeddingsService
from .gemini.config import GeminiConfig

logger = logging.getLogger(__name__)

class EmbeddingProvider(Enum):
    """Supported embedding providers"""
    JINA = "jina"
    GEMINI = "gemini"

class ExportFormat(Enum):
    """Supported export formats"""
    JSON = "json"
    NUMPY = "numpy"
    PICKLE = "pickle"
    CSV = "csv"

@dataclass
class BatchConfig:
    """Configuration for batch processing"""
    provider: EmbeddingProvider
    batch_size: int = 50
    max_concurrent_batches: int = 3
    rate_limit_delay: float = 1.0
    retry_attempts: int = 3
    retry_delay: float = 2.0
    memory_limit_mb: int = 1024
    enable_progress_tracking: bool = True

@dataclass
class BatchResult:
    """Result of batch processing operation"""
    success: bool
    total_items: int
    processed_items: int
    failed_items: int
    embeddings: List[List[float]]
    metadata: Dict[str, Any]
    processing_time: float
    errors: List[str]

@dataclass
class ExportData:
    """Data structure for embedding exports"""
    embeddings: List[List[float]]
    texts: List[str]
    metadata: Dict[str, Any]
    provider: str
    model: str
    dimensions: int
    timestamp: float
    total_items: int

class BatchEmbeddingService:
    """
    High-performance batch embedding service with multi-provider support
    """
    
    def __init__(
        self,
        jina_config: Optional[JinaConfig] = None,
        gemini_config: Optional[GeminiConfig] = None
    ):
        """
        Initialize batch embedding service
        
        Args:
            jina_config: Optional Jina configuration
            gemini_config: Optional Gemini configuration
        """
        logger.info("Initializing BatchEmbeddingService...")
        
        # Initialize services
        self.jina_service = JinaEmbeddingsService(jina_config) if jina_config or self._has_jina_config() else None
        self.gemini_service = GeminiEmbeddingsService(gemini_config) if gemini_config or self._has_gemini_config() else None
        
        # Rate limiting state
        self._rate_limits = {
            EmbeddingProvider.JINA: {"last_request": 0, "request_count": 0},
            EmbeddingProvider.GEMINI: {"last_request": 0, "request_count": 0}
        }
        
        # Progress tracking
        self._progress_callbacks = []
        
        logger.info(f"BatchEmbeddingService initialized - Jina: {bool(self.jina_service)}, Gemini: {bool(self.gemini_service)}")
    
    def _has_jina_config(self) -> bool:
        """Check if Jina configuration is available"""
        try:
            config = JinaConfig()
            return bool(config.api_key)
        except:
            return False
    
    def _has_gemini_config(self) -> bool:
        """Check if Gemini configuration is available"""
        try:
            config = GeminiConfig()
            return bool(config.api_key)
        except:
            return False
    
    def add_progress_callback(self, callback):
        """Add progress tracking callback"""
        self._progress_callbacks.append(callback)
    
    def _notify_progress(self, processed: int, total: int, provider: str):
        """Notify progress callbacks"""
        for callback in self._progress_callbacks:
            try:
                callback(processed, total, provider)
            except Exception as e:
                logger.warning(f"Progress callback error: {e}")
    
    async def process_jina_batch(
        self,
        texts: List[str],
        config: Optional[BatchConfig] = None
    ) -> BatchResult:
        """
        Process texts using Jina AI embeddings with optimized batching
        
        Args:
            texts: List of texts to embed
            config: Batch processing configuration
            
        Returns:
            BatchResult with embeddings and metadata
        """
        if not self.jina_service:
            raise ValueError("Jina service not available - check API configuration")
        
        config = config or BatchConfig(provider=EmbeddingProvider.JINA)
        start_time = time.time()
        
        logger.info(f"Starting Jina batch processing for {len(texts)} texts")
        
        try:
            # Optimize batch size based on content
            optimized_batch_size = self.optimize_batch_size(texts, config.batch_size, EmbeddingProvider.JINA)
            
            # Process in batches with rate limiting
            all_embeddings = []
            processed_count = 0
            errors = []
            
            for i in range(0, len(texts), optimized_batch_size):
                batch = texts[i:i + optimized_batch_size]
                
                # Handle rate limiting
                await self.handle_rate_limits(EmbeddingProvider.JINA, config.rate_limit_delay)
                
                try:
                    # Process batch with retry logic
                    batch_embeddings = await self._process_batch_with_retry(
                        self.jina_service.embed_documents,
                        batch,
                        config.retry_attempts,
                        config.retry_delay
                    )
                    
                    all_embeddings.extend(batch_embeddings)
                    processed_count += len(batch)
                    
                    # Update progress
                    if config.enable_progress_tracking:
                        self._notify_progress(processed_count, len(texts), "jina")
                    
                    logger.debug(f"Processed Jina batch {i//optimized_batch_size + 1}, total: {processed_count}/{len(texts)}")
                    
                except Exception as e:
                    error_msg = f"Batch {i//optimized_batch_size + 1} failed: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
                    
                    # Add empty embeddings for failed batch
                    all_embeddings.extend([[]] * len(batch))
            
            processing_time = time.time() - start_time
            
            result = BatchResult(
                success=len(errors) == 0,
                total_items=len(texts),
                processed_items=processed_count,
                failed_items=len(texts) - processed_count,
                embeddings=all_embeddings,
                metadata={
                    "provider": "jina",
                    "model": "jina-embeddings-v4",
                    "batch_size": optimized_batch_size,
                    "dimensions": 1024
                },
                processing_time=processing_time,
                errors=errors
            )
            
            logger.info(f"Jina batch processing completed in {processing_time:.2f}s - Success: {result.success}")
            return result
            
        except Exception as e:
            logger.error(f"Jina batch processing failed: {e}")
            return BatchResult(
                success=False,
                total_items=len(texts),
                processed_items=0,
                failed_items=len(texts),
                embeddings=[],
                metadata={"provider": "jina", "error": str(e)},
                processing_time=time.time() - start_time,
                errors=[str(e)]
            )
    
    async def process_gemini_batch(
        self,
        texts: List[str],
        task_type: str = "RETRIEVAL_DOCUMENT",
        output_dimensionality: Optional[int] = None,
        config: Optional[BatchConfig] = None
    ) -> BatchResult:
        """
        Process texts using Gemini embeddings with optimized batching
        
        Args:
            texts: List of texts to embed
            task_type: Gemini task type for optimization
            output_dimensionality: Optional dimension truncation
            config: Batch processing configuration
            
        Returns:
            BatchResult with embeddings and metadata
        """
        if not self.gemini_service:
            raise ValueError("Gemini service not available - check API configuration")
        
        config = config or BatchConfig(provider=EmbeddingProvider.GEMINI)
        start_time = time.time()
        
        logger.info(f"Starting Gemini batch processing for {len(texts)} texts")
        
        try:
            # Optimize batch size based on content and rate limits
            optimized_batch_size = self.optimize_batch_size(texts, config.batch_size, EmbeddingProvider.GEMINI)
            
            # Process in batches with rate limiting
            all_embeddings = []
            processed_count = 0
            errors = []
            
            for i in range(0, len(texts), optimized_batch_size):
                batch = texts[i:i + optimized_batch_size]
                
                # Handle rate limiting (Gemini has stricter limits)
                await self.handle_rate_limits(EmbeddingProvider.GEMINI, config.rate_limit_delay)
                
                try:
                    # Process batch with retry logic
                    if task_type == "RETRIEVAL_DOCUMENT":
                        batch_embeddings = await self._process_batch_with_retry(
                            lambda x: self.gemini_service.embed_documents(x, output_dimensionality),
                            batch,
                            config.retry_attempts,
                            config.retry_delay
                        )
                    elif task_type == "RETRIEVAL_QUERY":
                        batch_embeddings = await self._process_batch_with_retry(
                            lambda x: self.gemini_service.embed_queries(x, output_dimensionality),
                            batch,
                            config.retry_attempts,
                            config.retry_delay
                        )
                    elif task_type == "CLASSIFICATION":
                        batch_embeddings = await self._process_batch_with_retry(
                            lambda x: self.gemini_service.embed_for_classification(x, output_dimensionality),
                            batch,
                            config.retry_attempts,
                            config.retry_delay
                        )
                    elif task_type == "CLUSTERING":
                        batch_embeddings = await self._process_batch_with_retry(
                            lambda x: self.gemini_service.embed_for_clustering(x, output_dimensionality),
                            batch,
                            config.retry_attempts,
                            config.retry_delay
                        )
                    else:
                        # Default to document embedding
                        batch_embeddings = await self._process_batch_with_retry(
                            lambda x: self.gemini_service.embed_documents(x, output_dimensionality),
                            batch,
                            config.retry_attempts,
                            config.retry_delay
                        )
                    
                    all_embeddings.extend(batch_embeddings)
                    processed_count += len(batch)
                    
                    # Update progress
                    if config.enable_progress_tracking:
                        self._notify_progress(processed_count, len(texts), "gemini")
                    
                    logger.debug(f"Processed Gemini batch {i//optimized_batch_size + 1}, total: {processed_count}/{len(texts)}")
                    
                except Exception as e:
                    error_msg = f"Batch {i//optimized_batch_size + 1} failed: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
                    
                    # Add empty embeddings for failed batch
                    all_embeddings.extend([[]] * len(batch))
            
            processing_time = time.time() - start_time
            
            result = BatchResult(
                success=len(errors) == 0,
                total_items=len(texts),
                processed_items=processed_count,
                failed_items=len(texts) - processed_count,
                embeddings=all_embeddings,
                metadata={
                    "provider": "gemini",
                    "model": "gemini-embedding-exp-03-07",
                    "batch_size": optimized_batch_size,
                    "task_type": task_type,
                    "dimensions": output_dimensionality or 3072
                },
                processing_time=processing_time,
                errors=errors
            )
            
            logger.info(f"Gemini batch processing completed in {processing_time:.2f}s - Success: {result.success}")
            return result
            
        except Exception as e:
            logger.error(f"Gemini batch processing failed: {e}")
            return BatchResult(
                success=False,
                total_items=len(texts),
                processed_items=0,
                failed_items=len(texts),
                embeddings=[],
                metadata={"provider": "gemini", "error": str(e)},
                processing_time=time.time() - start_time,
                errors=[str(e)]
            )
    
    async def _process_batch_with_retry(
        self,
        process_func,
        batch: List[str],
        max_retries: int,
        retry_delay: float
    ) -> List[List[float]]:
        """
        Process a batch with retry logic
        
        Args:
            process_func: Function to process the batch
            batch: Batch of texts
            max_retries: Maximum retry attempts
            retry_delay: Delay between retries
            
        Returns:
            List of embeddings
        """
        for attempt in range(max_retries + 1):
            try:
                return await process_func(batch)
            except Exception as e:
                if attempt == max_retries:
                    raise e
                
                logger.warning(f"Batch processing attempt {attempt + 1} failed: {e}, retrying in {retry_delay}s")
                await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
        
        return []
    
    def optimize_batch_size(
        self,
        texts: List[str],
        base_batch_size: int,
        provider: EmbeddingProvider
    ) -> int:
        """
        Optimize batch size based on content characteristics and provider limits
        
        Args:
            texts: List of texts to analyze
            base_batch_size: Base batch size
            provider: Embedding provider
            
        Returns:
            Optimized batch size
        """
        if not texts:
            return base_batch_size
        
        # Calculate average text length
        avg_length = sum(len(text) for text in texts) / len(texts)
        
        # Provider-specific optimizations
        if provider == EmbeddingProvider.JINA:
            # Jina has 8K token limit, batch size based on text length
            if avg_length > 2000:
                return min(base_batch_size // 2, 25)  # Reduce for long texts
            elif avg_length < 500:
                return min(base_batch_size * 2, 200)  # Increase for short texts
            else:
                return base_batch_size
                
        elif provider == EmbeddingProvider.GEMINI:
            # Gemini has stricter rate limits but 8K context
            if avg_length > 2000:
                return min(base_batch_size // 3, 20)  # More conservative for long texts
            elif avg_length < 500:
                return min(base_batch_size, 50)  # Conservative increase
            else:
                return min(base_batch_size, 30)  # Default conservative
        
        return base_batch_size
    
    async def handle_rate_limits(self, provider: EmbeddingProvider, delay: float):
        """
        Handle rate limiting for embedding providers
        
        Args:
            provider: Embedding provider
            delay: Base delay between requests
        """
        current_time = time.time()
        rate_info = self._rate_limits[provider]
        
        # Calculate required delay based on rate limits
        if provider == EmbeddingProvider.JINA:
            # Jina: 600 requests/minute for free tier
            min_interval = 60.0 / 600  # ~0.1 seconds between requests
        elif provider == EmbeddingProvider.GEMINI:
            # Gemini: 100 requests/minute for experimental
            min_interval = 60.0 / 100  # 0.6 seconds between requests
        else:
            min_interval = delay
        
        # Ensure minimum interval
        time_since_last = current_time - rate_info["last_request"]
        if time_since_last < min_interval:
            sleep_time = min_interval - time_since_last
            logger.debug(f"Rate limiting {provider.value}: sleeping {sleep_time:.2f}s")
            await asyncio.sleep(sleep_time)
        
        # Update rate limiting state
        rate_info["last_request"] = time.time()
        rate_info["request_count"] += 1
    
    async def process_mixed_batch(
        self,
        texts: List[str],
        preferred_provider: EmbeddingProvider = EmbeddingProvider.JINA,
        fallback_provider: Optional[EmbeddingProvider] = None,
        config: Optional[BatchConfig] = None
    ) -> BatchResult:
        """
        Process texts with primary provider and fallback support
        
        Args:
            texts: List of texts to embed
            preferred_provider: Primary embedding provider
            fallback_provider: Fallback provider if primary fails
            config: Batch processing configuration
            
        Returns:
            BatchResult with embeddings and metadata
        """
        config = config or BatchConfig(provider=preferred_provider)
        
        # Try primary provider
        try:
            if preferred_provider == EmbeddingProvider.JINA:
                return await self.process_jina_batch(texts, config)
            elif preferred_provider == EmbeddingProvider.GEMINI:
                return await self.process_gemini_batch(texts, config=config)
        except Exception as e:
            logger.warning(f"Primary provider {preferred_provider.value} failed: {e}")
            
            # Try fallback if available
            if fallback_provider and fallback_provider != preferred_provider:
                try:
                    logger.info(f"Attempting fallback to {fallback_provider.value}")
                    config.provider = fallback_provider
                    
                    if fallback_provider == EmbeddingProvider.JINA:
                        return await self.process_jina_batch(texts, config)
                    elif fallback_provider == EmbeddingProvider.GEMINI:
                        return await self.process_gemini_batch(texts, config=config)
                except Exception as fallback_error:
                    logger.error(f"Fallback provider {fallback_provider.value} also failed: {fallback_error}")
            
            # Return failure result
            return BatchResult(
                success=False,
                total_items=len(texts),
                processed_items=0,
                failed_items=len(texts),
                embeddings=[],
                metadata={"provider": preferred_provider.value, "error": str(e)},
                processing_time=0.0,
                errors=[str(e)]
            )
    
    def prepare_export_data(
        self,
        result: BatchResult,
        texts: List[str],
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> ExportData:
        """
        Prepare data for export in optimized format
        
        Args:
            result: Batch processing result
            texts: Original texts
            additional_metadata: Additional metadata to include
            
        Returns:
            ExportData ready for serialization
        """
        metadata = result.metadata.copy()
        if additional_metadata:
            metadata.update(additional_metadata)
        
        return ExportData(
            embeddings=result.embeddings,
            texts=texts,
            metadata=metadata,
            provider=metadata.get("provider", "unknown"),
            model=metadata.get("model", "unknown"),
            dimensions=metadata.get("dimensions", 0),
            timestamp=time.time(),
            total_items=result.total_items
        )
    
    async def export_embeddings(
        self,
        export_data: ExportData,
        output_path: Union[str, Path],
        format: ExportFormat = ExportFormat.JSON,
        compress: bool = False
    ) -> bool:
        """
        Export embeddings in specified format with optimization
        
        Args:
            export_data: Data to export
            output_path: Output file path
            format: Export format
            compress: Whether to compress the output
            
        Returns:
            True if export successful, False otherwise
        """
        try:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Exporting {export_data.total_items} embeddings to {output_path}")
            
            if format == ExportFormat.JSON:
                await self._export_json(export_data, output_path, compress)
            elif format == ExportFormat.NUMPY:
                await self._export_numpy(export_data, output_path, compress)
            elif format == ExportFormat.PICKLE:
                await self._export_pickle(export_data, output_path, compress)
            elif format == ExportFormat.CSV:
                await self._export_csv(export_data, output_path, compress)
            else:
                raise ValueError(f"Unsupported export format: {format}")
            
            logger.info(f"Successfully exported embeddings to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Export failed: {e}")
            return False
    
    async def _export_json(self, data: ExportData, path: Path, compress: bool):
        """Export as JSON format"""
        export_dict = {
            "metadata": data.metadata,
            "provider": data.provider,
            "model": data.model,
            "dimensions": data.dimensions,
            "timestamp": data.timestamp,
            "total_items": data.total_items,
            "data": [
                {
                    "text": text,
                    "embedding": embedding
                }
                for text, embedding in zip(data.texts, data.embeddings)
            ]
        }
        
        if compress:
            import gzip
            with gzip.open(f"{path}.gz", "wt", encoding="utf-8") as f:
                json.dump(export_dict, f, indent=2)
        else:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(export_dict, f, indent=2)
    
    async def _export_numpy(self, data: ExportData, path: Path, compress: bool):
        """Export as NumPy format"""
        embeddings_array = np.array(data.embeddings)
        metadata_dict = asdict(data)
        metadata_dict.pop("embeddings")  # Remove embeddings from metadata
        
        if compress:
            np.savez_compressed(
                path,
                embeddings=embeddings_array,
                texts=np.array(data.texts),
                metadata=np.array([metadata_dict])
            )
        else:
            np.savez(
                path,
                embeddings=embeddings_array,
                texts=np.array(data.texts),
                metadata=np.array([metadata_dict])
            )
    
    async def _export_pickle(self, data: ExportData, path: Path, compress: bool):
        """Export as Pickle format"""
        if compress:
            import gzip
            with gzip.open(f"{path}.gz", "wb") as f:
                pickle.dump(data, f, protocol=pickle.HIGHEST_PROTOCOL)
        else:
            with open(path, "wb") as f:
                pickle.dump(data, f, protocol=pickle.HIGHEST_PROTOCOL)
    
    async def _export_csv(self, data: ExportData, path: Path, compress: bool):
        """Export as CSV format (flattened embeddings)"""
        import csv
        
        # Determine if we need to open compressed or regular file
        if compress:
            import gzip
            file_context = gzip.open(f"{path}.gz", "wt", encoding="utf-8", newline="")
        else:
            file_context = open(path, "w", encoding="utf-8", newline="")
        
        with file_context as f:
            # Create header
            max_dims = max(len(emb) for emb in data.embeddings) if data.embeddings else 0
            header = ["text"] + [f"dim_{i}" for i in range(max_dims)]
            
            writer = csv.writer(f)
            writer.writerow(header)
            
            # Write data
            for text, embedding in zip(data.texts, data.embeddings):
                # Pad embedding to max dimensions if needed
                padded_embedding = embedding + [0.0] * (max_dims - len(embedding))
                writer.writerow([text] + padded_embedding)
    
    def get_memory_usage(self) -> Dict[str, float]:
        """
        Get current memory usage statistics
        
        Returns:
            Dictionary with memory usage in MB
        """
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        return {
            "rss_mb": memory_info.rss / 1024 / 1024,
            "vms_mb": memory_info.vms / 1024 / 1024,
            "percent": process.memory_percent()
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on all available services
        
        Returns:
            Health status for each provider
        """
        health_status = {
            "batch_service": True,
            "providers": {},
            "memory_usage": self.get_memory_usage()
        }
        
        # Check Jina service
        if self.jina_service:
            try:
                jina_healthy = await self.jina_service.test_connection()
                health_status["providers"]["jina"] = {
                    "available": True,
                    "healthy": jina_healthy
                }
            except Exception as e:
                health_status["providers"]["jina"] = {
                    "available": True,
                    "healthy": False,
                    "error": str(e)
                }
        else:
            health_status["providers"]["jina"] = {
                "available": False,
                "reason": "No API key configured"
            }
        
        # Check Gemini service
        if self.gemini_service:
            try:
                gemini_healthy = await self.gemini_service.test_connection()
                health_status["providers"]["gemini"] = {
                    "available": True,
                    "healthy": gemini_healthy
                }
            except Exception as e:
                health_status["providers"]["gemini"] = {
                    "available": True,
                    "healthy": False,
                    "error": str(e)
                }
        else:
            health_status["providers"]["gemini"] = {
                "available": False,
                "reason": "No API key configured"
            }
        
        return health_status