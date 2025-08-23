"""
Bulk Processing Service

A comprehensive orchestrator for processing large volumes of content through
the complete pipeline: Content → Audio Processing → Transcription → Embedding → Export.

This service coordinates all processing steps and manages the workflow state,
error handling, and resource cleanup for bulk content operations.
"""

import os
import json
import logging
import asyncio
import tempfile
import uuid
import threading
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import aiofiles

from src.services.tiktok_service import get_tiktok_service
from src.services.audio_preparation_service import audio_preparation_service
from src.services.gemini.embeddings_service import GeminiEmbeddingsService
from src.services.jina.embeddings_service import JinaEmbeddingsService
from src.services.gemini.config import GeminiConfig
from src.services.jina.config import JinaConfig
from src.services.vector_db_connectors import (
    VectorDBType, VectorExportConfig, VectorRecord, 
    VectorDBConnectorFactory, VectorExportManager
)

logger = logging.getLogger(__name__)


class ProcessingStatus(Enum):
    """Processing status enumeration"""
    PENDING = "pending"
    INITIALIZING = "initializing"
    FETCHING_CONTENT = "fetching_content"
    PROCESSING_AUDIO = "processing_audio"
    TRANSCRIBING = "transcribing"
    EMBEDDING = "embedding"
    FINALIZING = "finalizing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ContentType(Enum):
    """Supported content types"""
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITCH = "twitch"
    AUDIO_FILE = "audio_file"
    VIDEO_FILE = "video_file"


@dataclass
class ProcessingConfig:
    """Configuration for bulk processing operations"""
    
    # Content settings
    content_type: ContentType
    max_items: int = 25
    audio_format: str = "wav"
    
    # Audio processing settings
    enable_audio_processing: bool = True
    enable_transcription: bool = True
    enable_embedding: bool = True
    
    # Transcription settings
    whisper_model: str = "base"
    segment_audio: bool = True
    max_segment_duration: int = 30
    clean_silence: bool = True
    separate_voices: bool = True
    
    # Embedding settings
    embedding_provider: str = "jina"  # "jina" or "gemini"
    embedding_task_type: str = "RETRIEVAL_DOCUMENT"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # JINA V4 specific settings for transcript processing
    jina_v4_task: str = "retrieval.passage"  # Optimal for transcript content
    jina_v4_dimensions: int = 1024  # Embedding dimensions (128-2048)
    jina_v4_late_chunking: bool = True  # Enable late chunking for long transcripts
    jina_v4_multi_vector: bool = False  # Single vector embeddings
    jina_v4_optimize_for_rag: bool = True  # Optimize for RAG systems
    jina_v4_truncate_at_max: bool = True  # Safer for production
    
    # Export settings
    export_formats: List[str] = None
    include_metadata: bool = True
    include_analytics: bool = True
    
    # Processing settings
    max_concurrent_items: int = 3
    retry_attempts: int = 3
    timeout_seconds: int = 300
    
    def __post_init__(self):
        if self.export_formats is None:
            self.export_formats = ["json", "csv", "jsonl"]


@dataclass
class ProcessingResult:
    """Result of processing a single content item"""
    
    item_id: str
    content_type: ContentType
    status: ProcessingStatus
    
    # Original content metadata
    original_metadata: Dict[str, Any] = None
    
    # Audio processing results
    audio_path: Optional[str] = None
    audio_duration: Optional[float] = None
    audio_format: Optional[str] = None
    vocals_extracted: bool = False
    
    # Transcription results
    transcription: Optional[str] = None
    segments: List[Dict[str, Any]] = None
    language: Optional[str] = None
    
    # Embedding results
    embeddings: List[List[float]] = None
    chunks: List[Dict[str, Any]] = None
    
    # V4 Embedding metadata
    embedding_provider: Optional[str] = None
    embedding_dimensions: Optional[int] = None
    processing_method: Optional[str] = None  # 'v4_transcript', 'late_chunking', 'traditional_chunking'
    token_count: Optional[int] = None
    v4_optimized: bool = False
    v4_task_type: Optional[str] = None
    
    # Processing metadata
    processing_time: float = 0.0
    error_message: Optional[str] = None
    retry_count: int = 0
    
    def __post_init__(self):
        if self.segments is None:
            self.segments = []
        if self.embeddings is None:
            self.embeddings = []
        if self.chunks is None:
            self.chunks = []


@dataclass
class BulkProcessingState:
    """State management for bulk processing operations"""
    
    session_id: str
    status: ProcessingStatus
    config: ProcessingConfig
    
    # Progress tracking
    total_items: int = 0
    completed_items: int = 0
    failed_items: int = 0
    
    # Results storage
    results: List[ProcessingResult] = None
    
    # Real-time progress tracking (thread-safe)
    _processing_results: List[ProcessingResult] = None
    _embeddings_count: int = 0
    _lock: threading.Lock = None
    
    # Timing
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    # Error handling
    errors: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.results is None:
            self.results = []
        if self.errors is None:
            self.errors = []
        if self._processing_results is None:
            self._processing_results = []
        if self._lock is None:
            self._lock = threading.Lock()
    
    def add_completed_item(self, result: ProcessingResult):
        """Thread-safe method to add a completed processing result"""
        with self._lock:
            self._processing_results.append(result)
            self.completed_items += 1
            # Count embeddings if they exist - embeddings is List[List[float]]
            if hasattr(result, 'embeddings') and result.embeddings:
                if isinstance(result.embeddings, list):
                    # Each item in embeddings list is a vector (List[float])
                    self._embeddings_count += len(result.embeddings)
                else:
                    self._embeddings_count += 1
    
    def get_real_time_stats(self) -> Dict[str, int]:
        """Get real-time statistics in a thread-safe way"""
        with self._lock:
            return {
                "completed_items": self.completed_items,
                "embeddings_count": self._embeddings_count,
                "failed_items": self.failed_items
            }
    
    @property
    def progress_percentage(self) -> float:
        """Calculate completion percentage"""
        if self.total_items == 0:
            return 0.0
        return (self.completed_items / self.total_items) * 100.0
    
    @property
    def processing_time(self) -> float:
        """Calculate total processing time in seconds"""
        if self.start_time is None:
            return 0.0
        end = self.end_time or datetime.now()
        return (end - self.start_time).total_seconds()


class BulkProcessingService:
    """
    Master orchestrator for bulk content processing.
    
    Coordinates the complete workflow:
    1. Content ingestion from various sources
    2. Audio extraction and preparation
    3. Transcription with Whisper
    4. Embedding generation
    5. Export preparation in multiple formats
    """
    
    def __init__(self):
        """Initialize the bulk processing service"""
        self.temp_dir = tempfile.mkdtemp(prefix="bulk_processing_")
        self.active_sessions: Dict[str, BulkProcessingState] = {}
        
        # Initialize service clients
        self.tiktok_service = get_tiktok_service()
        self.audio_service = audio_preparation_service
        
        # Initialize embedding services
        self.gemini_service = None
        self.jina_service = None
        
        logger.info(f"Bulk Processing Service initialized - temp_dir: {self.temp_dir}")
    
    def _get_embedding_service(self, provider: str):
        """Get or create embedding service instance"""
        # Normalize provider names - map jina-v4 to jina
        normalized_provider = provider
        if provider == "jina-v4":
            normalized_provider = "jina"
            logger.info(f"Mapped embedding provider '{provider}' to '{normalized_provider}'")
        
        if normalized_provider == "gemini":
            if self.gemini_service is None:
                try:
                    self.gemini_service = GeminiEmbeddingsService(GeminiConfig())
                except Exception as e:
                    logger.error(f"Failed to initialize Gemini service: {e}")
                    raise
            return self.gemini_service
        elif normalized_provider == "jina":
            if self.jina_service is None:
                try:
                    self.jina_service = JinaEmbeddingsService(JinaConfig())
                except Exception as e:
                    logger.error(f"Failed to initialize Jina service: {e}")
                    raise
            return self.jina_service
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")
    
    async def process_bulk_content_original(
        self,
        content_source: Union[str, List[str]],
        config: ProcessingConfig
    ) -> str:
        """
        Original processing method for bulk content (kept for backward compatibility).
        
        Args:
            content_source: Username, URL, or list of content identifiers
            config: Processing configuration
            
        Returns:
            Session ID for tracking progress
        """
        session_id = str(uuid.uuid4())
        state = BulkProcessingState(
            session_id=session_id,
            status=ProcessingStatus.INITIALIZING,
            config=config,
            start_time=datetime.now()
        )
        
        self.active_sessions[session_id] = state
        logger.info(f"Starting bulk processing session: {session_id}")
        
        try:
            # Step 1: Content ingestion
            await self._update_status(session_id, ProcessingStatus.FETCHING_CONTENT)
            content_items = await self._ingest_content(content_source, config)
            
            state.total_items = len(content_items)
            logger.info(f"Ingested {len(content_items)} content items")
            
            # Step 2: Process items with concurrency control
            await self._process_content_items(session_id, content_items)
            
            # Step 3: Finalize results
            await self._update_status(session_id, ProcessingStatus.FINALIZING)
            await self._finalize_processing(session_id)
            
            await self._update_status(session_id, ProcessingStatus.COMPLETED)
            state.end_time = datetime.now()
            
            logger.info(f"Bulk processing completed for session {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Bulk processing failed for session {session_id}: {e}")
            await self._update_status(session_id, ProcessingStatus.FAILED)
            state.errors.append({
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "stage": "main_processing"
            })
            state.end_time = datetime.now()
            raise
    
    async def process_bulk_content(
        self,
        config: Dict[str, Any],
        job_id: str,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Process bulk content with new API signature for job manager integration.
        
        Args:
            config: Processing configuration dictionary
            job_id: Job ID for tracking
            progress_callback: Callback function for progress updates
            
        Returns:
            Processing results
        """
        try:
            logger.info(f"Starting bulk processing for job {job_id}")
            
            # Extract content selection from config
            selected_content = config.get("selected_content", [])
            platform = config.get("platform", "tiktok")
            
            # Build processing config
            content_type = ContentType.TIKTOK if platform == "tiktok" else ContentType.AUDIO_FILE
            
            # Extract embedding model config
            embedding_model = config.get("embedding_model", {})
            settings = config.get("settings", {})
            
            processing_config = ProcessingConfig(
                content_type=content_type,
                max_items=len(selected_content),
                max_concurrent_items=3,  # Reasonable default
                separate_voices=True,
                embedding_provider=embedding_model.get("id", "jina-v4"),
                chunk_size=settings.get("chunkSize", 1024),
                chunk_overlap=settings.get("chunkOverlap", 100),
                # JINA V4 specific parameters from API request
                jina_v4_task=embedding_model.get("jina_v4_task", "retrieval.passage"),
                jina_v4_dimensions=embedding_model.get("jina_v4_dimensions", 1024),
                jina_v4_late_chunking=embedding_model.get("jina_v4_late_chunking", True),
                jina_v4_multi_vector=embedding_model.get("jina_v4_multi_vector", False),
                jina_v4_optimize_for_rag=embedding_model.get("jina_v4_optimize_for_rag", True),
                jina_v4_truncate_at_max=embedding_model.get("jina_v4_truncate_at_max", True)
            )
            
            # Start processing session
            session_id = await self.process_bulk_content_legacy(selected_content, processing_config, progress_callback)
            
            # Wait for completion and return results
            state = self.active_sessions.get(session_id)
            if state:
                # Return formatted results
                return {
                    "session_id": session_id,
                    "status": state.status.value,
                    "total_items": state.total_items,
                    "completed_items": state.completed_items,
                    "failed_items": state.failed_items,
                    "results": [self._serialize_processing_result(result) for result in state.results if isinstance(result, ProcessingResult)] if state.results else [],
                    "processing_time": state.processing_time,
                    "progress": state.progress_percentage
                }
            else:
                raise Exception("Processing session not found")
                
        except Exception as e:
            logger.error(f"Error in process_bulk_content for job {job_id}: {e}")
            if progress_callback:
                try:
                    await progress_callback({
                        "progress": 0,
                        "stage": "failed",
                        "status": "failed",
                        "error": str(e)
                    })
                except Exception as callback_error:
                    logger.warning(f"Progress callback failed during error reporting: {callback_error}")
            raise
    
    async def process_bulk_content_legacy(
        self,
        content_source: Union[str, List[str]], 
        config: ProcessingConfig,
        progress_callback: Optional[callable] = None
    ) -> str:
        """
        Legacy processing method (renamed from original process_bulk_content).
        
        Args:
            content_source: Username, URL, or list of content identifiers
            config: Processing configuration
            progress_callback: Optional callback for progress updates
            
        Returns:
            Session ID for tracking progress
        """
        session_id = str(uuid.uuid4())
        state = BulkProcessingState(
            session_id=session_id,
            status=ProcessingStatus.INITIALIZING,
            config=config,
            start_time=datetime.now()
        )
        
        self.active_sessions[session_id] = state
        logger.info(f"Starting bulk processing session: {session_id}")
        
        try:
            # Progress callback support
            async def send_progress(stage: str, progress: float = 0.0):
                if progress_callback:
                    # Ensure stage is always a string
                    stage_str = str(stage) if stage is not None else "Processing..."
                    real_time_stats = state.get_real_time_stats()
                    await progress_callback({
                        "progress": progress,
                        "stage": stage_str,
                        "status": "processing",
                        "content_processed": real_time_stats["completed_items"],
                        "embeddings": real_time_stats["embeddings_count"]
                    })
            
            # Step 1: Content ingestion
            await self._update_status(session_id, ProcessingStatus.FETCHING_CONTENT)
            await send_progress("Fetching content", 10)
            
            content_items = await self._ingest_content(content_source, config)
            
            state.total_items = len(content_items)
            logger.info(f"Ingested {len(content_items)} content items")
            await send_progress("Content ingested", 20)
            
            # Step 2: Process items with concurrency control
            await send_progress("Processing content", 30)
            await self._process_content_items_with_progress(session_id, content_items, send_progress)
            
            # Step 3: Finalize results
            await self._update_status(session_id, ProcessingStatus.FINALIZING)
            await send_progress("Finalizing", 90)
            await self._finalize_processing(session_id)
            
            await self._update_status(session_id, ProcessingStatus.COMPLETED)
            await send_progress("Completed", 100)
            state.end_time = datetime.now()
            
            logger.info(f"Bulk processing completed for session {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Bulk processing failed for session {session_id}: {e}")
            await self._update_status(session_id, ProcessingStatus.FAILED)
            if progress_callback:
                await progress_callback({
                    "progress": 0,
                    "stage": "failed",
                    "status": "failed",
                    "error": str(e)
                })
            raise
    
    async def _process_content_items_with_progress(
        self,
        session_id: str,
        content_items: List[Dict[str, Any]],
        progress_callback: callable
    ) -> None:
        """
        Process content items with progress updates.
        """
        state = self.active_sessions[session_id]
        
        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(state.config.max_concurrent_items)
        
        async def process_single_item_with_progress(item: Dict[str, Any], index: int) -> ProcessingResult:
            async with semaphore:
                try:
                    result = await self._process_single_content_item(session_id, item)
                    
                    # Add completed item to real-time tracking
                    if result and not isinstance(result, Exception):
                        state.add_completed_item(result)
                    else:
                        # Handle failed item
                        with state._lock:
                            state.failed_items += 1
                except Exception as e:
                    # Handle processing exception
                    with state._lock:
                        state.failed_items += 1
                    logger.error(f"Error processing item {index + 1}: {e}")
                    result = e
                
                # Update progress with error handling
                try:
                    progress = 30 + (60 * (index + 1) / len(content_items))
                    real_time_stats = state.get_real_time_stats()
                    
                    await progress_callback({
                        "progress": progress,
                        "stage": f"Processing item {index + 1}/{len(content_items)}",
                        "status": "processing",
                        "content_processed": index + 1,
                        "embeddings": real_time_stats["embeddings_count"],
                        "failed_items": real_time_stats["failed_items"],
                        "completed_items": real_time_stats["completed_items"]
                    })
                except Exception as callback_error:
                    logger.warning(f"Progress callback failed: {callback_error}")
                    # Continue processing even if callback fails
                
                return result
        
        # Process all items with progress tracking
        tasks = [
            process_single_item_with_progress(item, i) 
            for i, item in enumerate(content_items)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results - note: completed_items and failed_items are already tracked in real-time
        for result in results:
            if isinstance(result, Exception):
                state.errors.append({
                    "error": str(result),
                    "timestamp": datetime.now().isoformat()
                })
            else:
                state.results.append(result)
        
        # Copy real-time results to final results for consistency
        with state._lock:
            # Ensure final state matches real-time tracking
            state.results.extend([r for r in state._processing_results if r not in state.results])
    
    async def _ingest_content(
        self,
        content_source: Union[str, List[str]],
        config: ProcessingConfig
    ) -> List[Dict[str, Any]]:
        """
        Ingest content from various sources.
        
        Args:
            content_source: Content source identifier
            config: Processing configuration
            
        Returns:
            List of content items to process
        """
        content_items = []
        
        if config.content_type == ContentType.TIKTOK:
            if isinstance(content_source, str):
                # Single TikTok user
                user_videos = await self.tiktok_service.get_user_videos(
                    content_source, 
                    count=config.max_items
                )
                
                for video in user_videos.get("videos", []):
                    content_items.append({
                        "id": video["videoId"],
                        "type": "tiktok_video",
                        "source": content_source,
                        "metadata": video,
                        "url": video.get("playAddr", "")
                    })
            else:
                # Multiple sources or video IDs
                for source in content_source[:config.max_items]:
                    if source.startswith("http"):
                        # Direct video URL
                        video_id = self._extract_video_id_from_url(source)
                        if video_id:
                            video_info = await self.tiktok_service.get_video_info(video_id)
                            content_items.append({
                                "id": video_id,
                                "type": "tiktok_video",
                                "source": source,
                                "metadata": video_info,
                                "url": source
                            })
                    elif source.isdigit() and len(source) > 10:
                        # This looks like a TikTok video ID (long numeric string)
                        # Process it directly instead of trying to fetch from user
                        logger.info(f"Processing pre-selected TikTok video ID: {source}")
                        try:
                            video_info = await self.tiktok_service.get_video_info(source)
                            content_items.append({
                                "id": source,
                                "type": "tiktok_video",
                                "source": f"video_{source}",
                                "metadata": video_info or {"videoId": source},
                                "url": f"https://www.tiktok.com/@unknown/video/{source}"
                            })
                        except Exception as e:
                            logger.warning(f"Could not get video info for {source}, using basic metadata: {e}")
                            # Still add the item with basic metadata so processing can continue
                            content_items.append({
                                "id": source,
                                "type": "tiktok_video",
                                "source": f"video_{source}",
                                "metadata": {"videoId": source, "title": f"TikTok Video {source}"},
                                "url": f"https://www.tiktok.com/@unknown/video/{source}"
                            })
                    else:
                        # Assume it's a username
                        user_videos = await self.tiktok_service.get_user_videos(
                            source, 
                            count=min(config.max_items // len(content_source), 10)
                        )
                        
                        for video in user_videos.get("videos", []):
                            content_items.append({
                                "id": video["videoId"],
                                "type": "tiktok_video",
                                "source": source,
                                "metadata": video,
                                "url": video.get("playAddr", "")
                            })
        
        elif config.content_type == ContentType.AUDIO_FILE:
            # Direct audio file processing
            if isinstance(content_source, str):
                content_items.append({
                    "id": str(uuid.uuid4()),
                    "type": "audio_file",
                    "source": content_source,
                    "metadata": {"file_path": content_source},
                    "url": content_source
                })
            else:
                for file_path in content_source[:config.max_items]:
                    content_items.append({
                        "id": str(uuid.uuid4()),
                        "type": "audio_file",
                        "source": file_path,
                        "metadata": {"file_path": file_path},
                        "url": file_path
                    })
        
        else:
            raise ValueError(f"Unsupported content type: {config.content_type}")
        
        return content_items
    
    async def _process_content_items(
        self,
        session_id: str,
        content_items: List[Dict[str, Any]]
    ) -> None:
        """
        Process content items with controlled concurrency.
        
        Args:
            session_id: Processing session ID
            content_items: List of content items to process
        """
        state = self.active_sessions[session_id]
        
        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(state.config.max_concurrent_items)
        
        async def process_single_item(item: Dict[str, Any]) -> ProcessingResult:
            async with semaphore:
                return await self._process_single_content_item(session_id, item)
        
        # Process items concurrently
        tasks = [process_single_item(item) for item in content_items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update state with results
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Processing error: {result}")
                state.failed_items += 1
                state.errors.append({
                    "error": str(result),
                    "timestamp": datetime.now().isoformat(),
                    "stage": "item_processing"
                })
            else:
                state.results.append(result)
                if result.status == ProcessingStatus.COMPLETED:
                    state.completed_items += 1
                else:
                    state.failed_items += 1
    
    async def _process_single_content_item(
        self,
        session_id: str,
        item: Dict[str, Any]
    ) -> ProcessingResult:
        """
        Process a single content item through the complete pipeline.
        
        Args:
            session_id: Processing session ID
            item: Content item to process
            
        Returns:
            ProcessingResult with processing outcomes
        """
        state = self.active_sessions[session_id]
        config = state.config
        
        result = ProcessingResult(
            item_id=item["id"],
            content_type=config.content_type,
            status=ProcessingStatus.PENDING,
            original_metadata=item.get("metadata", {})
        )
        
        start_time = datetime.now()
        
        try:
            # Step 1: Audio extraction/preparation
            if config.enable_audio_processing:
                await self._update_status(session_id, ProcessingStatus.PROCESSING_AUDIO)
                audio_result = await self._process_audio(item, config)
                
                result.audio_path = audio_result.get("audio_path")
                result.audio_duration = audio_result.get("duration")
                result.audio_format = audio_result.get("format")
                result.vocals_extracted = audio_result.get("vocals_extracted", False)
            
            # Step 2: Transcription
            if config.enable_transcription and result.audio_path:
                await self._update_status(session_id, ProcessingStatus.TRANSCRIBING)
                transcription_result = await self._process_transcription(
                    result.audio_path, 
                    config
                )
                
                result.transcription = transcription_result.get("transcription")
                result.segments = transcription_result.get("segments", [])
                result.language = transcription_result.get("language")
            
            # Step 3: Embedding generation
            if config.enable_embedding and result.transcription:
                await self._update_status(session_id, ProcessingStatus.EMBEDDING)
                embedding_result = await self._process_embeddings(
                    result.transcription,
                    config
                )
                
                result.embeddings = embedding_result.get("embeddings", [])
                result.chunks = embedding_result.get("chunks", [])
                
                # Populate V4 metadata
                result.embedding_provider = embedding_result.get("provider", config.embedding_provider)
                result.processing_method = embedding_result.get("processing_method", "unknown")
                result.token_count = embedding_result.get("token_count")
                result.v4_optimized = embedding_result.get("v4_optimized", False)
                result.embedding_dimensions = embedding_result.get("dimensions")
                if config.embedding_provider == "jina":
                    result.v4_task_type = config.jina_v4_task
            
            result.status = ProcessingStatus.COMPLETED
            result.processing_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"Successfully processed item {item['id']}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing item {item['id']}: {e}")
            result.status = ProcessingStatus.FAILED
            result.error_message = str(e)
            result.processing_time = (datetime.now() - start_time).total_seconds()
            return result
    
    async def _process_audio(
        self,
        item: Dict[str, Any],
        config: ProcessingConfig
    ) -> Dict[str, Any]:
        """
        Process audio for a content item.
        
        Args:
            item: Content item
            config: Processing configuration
            
        Returns:
            Audio processing results
        """
        if item["type"] == "tiktok_video":
            # Download TikTok video audio
            video_id = item["id"]
            audio_bytes = await self.tiktok_service.download_audio_bytes(
                video_id, 
                format=config.audio_format
            )
            
            # Save to temporary file
            audio_path = os.path.join(self.temp_dir, f"{video_id}.{config.audio_format}")
            async with aiofiles.open(audio_path, 'wb') as f:
                await f.write(audio_bytes)
            
            return {
                "audio_path": audio_path,
                "format": config.audio_format,
                "duration": item.get("metadata", {}).get("duration", 0),
                "vocals_extracted": False
            }
        
        elif item["type"] == "audio_file":
            # Use existing audio file
            return {
                "audio_path": item["url"],
                "format": Path(item["url"]).suffix.lstrip('.'),
                "duration": 0,  # TODO: Extract duration
                "vocals_extracted": False
            }
        
        else:
            raise ValueError(f"Unsupported item type for audio processing: {item['type']}")
    
    async def _process_transcription(
        self,
        audio_path: str,
        config: ProcessingConfig
    ) -> Dict[str, Any]:
        """
        Process transcription for audio content.
        
        Args:
            audio_path: Path to audio file
            config: Processing configuration
            
        Returns:
            Transcription results
        """
        prep_config = {
            "use_whisper": True,
            "segment_audio": config.segment_audio,
            "max_segment_duration": config.max_segment_duration,
            "transcribe": True,
            "clean_silence": config.clean_silence,
            "separate_voices": config.separate_voices,
            "provider_specific": {
                "whisper_model": config.whisper_model
            }
        }
        
        result = await self.audio_service.prepare_audio(
            audio_path,
            provider="transcription",
            config=prep_config
        )
        
        return {
            "transcription": result.get("transcription"),
            "segments": result.get("segments", []),
            "language": result.get("metadata", {}).get("language"),
            "prepared_audio_path": result.get("prepared_audio_path")
        }
    
    async def _process_embeddings(
        self,
        text: str,
        config: ProcessingConfig
    ) -> Dict[str, Any]:
        """
        Process embedding generation for text content using optimized V4 transcript processing.
        
        Args:
            text: Text content to embed (transcript)
            config: Processing configuration
            
        Returns:
            Embedding results with V4 optimizations
        """
        embedding_service = self._get_embedding_service(config.embedding_provider)
        
        # Use V4 transcript-optimized embedding for JINA (supports both "jina" and "jina-v4")
        if config.embedding_provider in ["jina", "jina-v4"] and hasattr(embedding_service, 'embed_transcripts'):
            logger.info(f"Using JINA V4 transcript-optimized embedding with task: {config.jina_v4_task}")
            
            # Create V4 transcript configuration
            from src.services.jina.models import TranscriptEmbeddingConfig
            transcript_config = TranscriptEmbeddingConfig(
                task=config.jina_v4_task,
                dimensions=config.jina_v4_dimensions,
                late_chunking=config.jina_v4_late_chunking,
                chunk_size=config.chunk_size if not config.jina_v4_late_chunking else None,
                chunk_overlap=config.chunk_overlap if not config.jina_v4_late_chunking else None,
                multi_vector=config.jina_v4_multi_vector,
                optimize_for_rag=config.jina_v4_optimize_for_rag
            )
            
            # Process with V4 transcript method
            v4_results = await embedding_service.embed_transcripts([text], transcript_config)
            
            if v4_results:
                result = v4_results[0]
                return {
                    "embeddings": result["embeddings"],
                    "chunks": result.get("chunk_metadata", []),
                    "provider": config.embedding_provider,
                    "processing_method": result.get("processing_method", "v4_transcript"),
                    "token_count": result.get("token_count", 0),
                    "dimensions": config.jina_v4_dimensions,
                    "v4_optimized": True
                }
        
        # Fallback to traditional chunking for other providers or legacy mode
        logger.info(f"Using traditional chunking for provider: {config.embedding_provider}")
        chunks = await embedding_service.chunk_and_embed(
            text,
            chunk_size=config.chunk_size,
            overlap=config.chunk_overlap
        )
        
        # Extract embeddings
        embeddings = [chunk["embedding"] for chunk in chunks]
        
        return {
            "embeddings": embeddings,
            "chunks": chunks,
            "provider": config.embedding_provider,
            "processing_method": "traditional_chunking",
            "v4_optimized": False
        }
    
    async def _finalize_processing(self, session_id: str) -> None:
        """
        Finalize processing and prepare export data.
        
        Args:
            session_id: Processing session ID
        """
        state = self.active_sessions[session_id]
        
        # Generate summary statistics
        successful_results = [r for r in state.results if r.status == ProcessingStatus.COMPLETED]
        
        summary = {
            "session_id": session_id,
            "total_items": state.total_items,
            "successful_items": len(successful_results),
            "failed_items": state.failed_items,
            "processing_time": state.processing_time,
            "average_processing_time": sum(r.processing_time for r in successful_results) / len(successful_results) if successful_results else 0,
            "total_transcription_length": sum(len(r.transcription or "") for r in successful_results),
            "total_embeddings": sum(len(r.embeddings) for r in successful_results),
            "languages_detected": list(set(r.language for r in successful_results if r.language))
        }
        
        # Store summary in state
        state.results.append(summary)
        
        logger.info(f"Processing summary: {summary}")
    
    async def prepare_export_data(
        self,
        session_id: str,
        export_format: str = "json"
    ) -> Dict[str, Any]:
        """
        Prepare processed data for export in specified format.
        
        Args:
            session_id: Processing session ID
            export_format: Export format (json, csv, jsonl)
            
        Returns:
            Export data structure
        """
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        state = self.active_sessions[session_id]
        
        if export_format == "json":
            return await self._prepare_json_export(state)
        elif export_format == "csv":
            return await self._prepare_csv_export(state)
        elif export_format == "jsonl":
            return await self._prepare_jsonl_export(state)
        else:
            raise ValueError(f"Unsupported export format: {export_format}")
    
    async def _prepare_json_export(self, state: BulkProcessingState) -> Dict[str, Any]:
        """Prepare JSON export format"""
        return {
            "session_metadata": {
                "session_id": state.session_id,
                "status": state.status.value,
                "config": asdict(state.config),
                "start_time": state.start_time.isoformat() if state.start_time else None,
                "end_time": state.end_time.isoformat() if state.end_time else None,
                "processing_time": state.processing_time,
                "progress": state.progress_percentage
            },
            "results": [asdict(result) for result in state.results if isinstance(result, ProcessingResult)],
            "errors": state.errors,
            "summary": state.results[-1] if state.results and isinstance(state.results[-1], dict) else {}
        }
    
    async def _prepare_csv_export(self, state: BulkProcessingState) -> Dict[str, Any]:
        """Prepare CSV export format"""
        # Flatten results for CSV
        csv_rows = []
        for result in state.results:
            if isinstance(result, ProcessingResult):
                row = {
                    "item_id": result.item_id,
                    "content_type": result.content_type.value,
                    "status": result.status.value,
                    "transcription": result.transcription,
                    "language": result.language,
                    "audio_duration": result.audio_duration,
                    "processing_time": result.processing_time,
                    "error_message": result.error_message,
                    "segments_count": len(result.segments),
                    "embeddings_count": len(result.embeddings),
                    "vocals_extracted": result.vocals_extracted
                }
                csv_rows.append(row)
        
        return {
            "format": "csv",
            "headers": list(csv_rows[0].keys()) if csv_rows else [],
            "rows": csv_rows
        }
    
    async def _prepare_jsonl_export(self, state: BulkProcessingState) -> Dict[str, Any]:
        """Prepare JSONL export format"""
        jsonl_lines = []
        for result in state.results:
            if isinstance(result, ProcessingResult):
                jsonl_lines.append(asdict(result))
        
        return {
            "format": "jsonl",
            "lines": jsonl_lines
        }
    
    def validate_processing_config(self, config: ProcessingConfig) -> Dict[str, Any]:
        """
        Validate processing configuration.
        
        Args:
            config: Processing configuration to validate
            
        Returns:
            Validation results
        """
        errors = []
        warnings = []
        
        # Check required fields
        if not config.content_type:
            errors.append("Content type is required")
        
        if config.max_items <= 0:
            errors.append("Max items must be positive")
        
        if config.max_items > 50:
            warnings.append("Processing more than 50 items may take significant time")
        
        # Check embedding provider
        if config.enable_embedding:
            if config.embedding_provider not in ["jina", "gemini"]:
                errors.append("Embedding provider must be 'jina' or 'gemini'")
            
            # Validate JINA V4 specific settings
            if config.embedding_provider == "jina":
                if config.jina_v4_dimensions not in [128, 256, 512, 1024, 2048]:
                    errors.append("JINA V4 dimensions must be one of: 128, 256, 512, 1024, 2048")
                
                valid_tasks = ["retrieval.passage", "retrieval.query", "text-matching", "code.query", "code.passage"]
                if config.jina_v4_task not in valid_tasks:
                    errors.append(f"JINA V4 task must be one of: {valid_tasks}")
                
                if config.jina_v4_late_chunking and config.chunk_size > 32000:
                    warnings.append("Large chunk sizes with late chunking may cause performance issues")
                
                if not config.jina_v4_optimize_for_rag:
                    warnings.append("Consider enabling RAG optimization for better transcript search performance")
        
        # Check export formats
        valid_formats = ["json", "csv", "jsonl"]
        for fmt in config.export_formats:
            if fmt not in valid_formats:
                errors.append(f"Invalid export format: {fmt}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    async def get_processing_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get current processing status for a session.
        
        Args:
            session_id: Processing session ID
            
        Returns:
            Status information
        """
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        state = self.active_sessions[session_id]
        
        return {
            "session_id": session_id,
            "status": state.status.value,
            "progress_percentage": state.progress_percentage,
            "total_items": state.total_items,
            "completed_items": state.completed_items,
            "failed_items": state.failed_items,
            "processing_time": state.processing_time,
            "errors": state.errors[-5:] if state.errors else []  # Last 5 errors
        }
    
    async def cancel_processing(self, session_id: str) -> bool:
        """
        Cancel an active processing session.
        
        Args:
            session_id: Processing session ID
            
        Returns:
            True if cancelled successfully
        """
        if session_id not in self.active_sessions:
            return False
        
        state = self.active_sessions[session_id]
        state.status = ProcessingStatus.CANCELLED
        state.end_time = datetime.now()
        
        logger.info(f"Cancelled processing session: {session_id}")
        return True
    
    async def cleanup_temporary_files(self, session_id: Optional[str] = None) -> None:
        """
        Clean up temporary files for a session or all sessions.
        
        Args:
            session_id: Specific session to clean up (optional)
        """
        try:
            if session_id and session_id in self.active_sessions:
                state = self.active_sessions[session_id]
                
                # Clean up result files
                for result in state.results:
                    if isinstance(result, ProcessingResult) and result.audio_path:
                        if os.path.exists(result.audio_path):
                            os.unlink(result.audio_path)
                            logger.debug(f"Cleaned up audio file: {result.audio_path}")
                
                # Remove session
                del self.active_sessions[session_id]
                logger.info(f"Cleaned up session: {session_id}")
            
            else:
                # Clean up all temporary files
                import shutil
                if os.path.exists(self.temp_dir):
                    shutil.rmtree(self.temp_dir)
                    self.temp_dir = tempfile.mkdtemp(prefix="bulk_processing_")
                    logger.info("Cleaned up all temporary files")
                
                # Clear all sessions
                self.active_sessions.clear()
                
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    async def _update_status(self, session_id: str, status: ProcessingStatus) -> None:
        """Update processing status for a session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].status = status
            logger.debug(f"Session {session_id} status updated to: {status.value}")
    
    def _extract_video_id_from_url(self, url: str) -> Optional[str]:
        """Extract video ID from TikTok URL"""
        import re
        
        # TikTok video URL patterns
        patterns = [
            r'tiktok\.com/.*?/video/(\d+)',
            r'tiktok\.com/@[^/]+/video/(\d+)',
            r'vm\.tiktok\.com/([A-Za-z0-9]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    async def export_data(
        self,
        job_result: Dict[str, Any],
        format: str,
        export_id: str,
        vector_db_type: Optional[str] = None
    ) -> str:
        """
        Export processing results to specified format.
        
        Args:
            job_result: Processing results from completed job
            format: Export format (json, csv, parquet, vector)
            export_id: Export identifier
            vector_db_type: Vector database type for vector exports (pinecone, chromadb, weaviate)
            
        Returns:
            Path to exported file
        """
        try:
            # Create export directory
            export_dir = Path(self.temp_dir) / "exports"
            export_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            if format == "json":
                export_path = export_dir / f"{export_id}_{timestamp}.json"
                async with aiofiles.open(export_path, 'w') as f:
                    await f.write(json.dumps(job_result, indent=2))
                    
            elif format == "csv":
                export_path = export_dir / f"{export_id}_{timestamp}.csv"
                
                # Convert results to CSV format
                if "results" in job_result and job_result["results"]:
                    import csv
                    async with aiofiles.open(export_path, 'w', newline='') as f:
                        writer = csv.DictWriter(f, fieldnames=job_result["results"][0].keys())
                        await f.write(','.join(writer.fieldnames) + '\n')
                        for result in job_result["results"]:
                            await f.write(','.join(str(result.get(field, '')) for field in writer.fieldnames) + '\n')
                else:
                    # Empty results
                    async with aiofiles.open(export_path, 'w') as f:
                        await f.write("No results to export\n")
                        
            elif format == "parquet":
                export_path = export_dir / f"{export_id}_{timestamp}.parquet"
                
                # For now, save as JSON (could implement proper Parquet later)
                async with aiofiles.open(export_path, 'w') as f:
                    await f.write(json.dumps(job_result, indent=2))
                    
            elif format == "vector":
                # Vector database export with import scripts and configurations
                return await self._export_vector_database_format(job_result, export_id, vector_db_type, export_dir, timestamp)
                    
            else:
                raise ValueError(f"Unsupported export format: {format}")
            
            logger.info(f"Exported data to {export_path} in {format} format")
            return str(export_path)
            
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            raise

    async def _export_vector_database_format(
        self,
        job_result: Dict[str, Any],
        export_id: str,
        vector_db_type: Optional[str],
        export_dir: Path,
        timestamp: str
    ) -> str:
        """Export data in vector database specific format with import scripts."""
        
        try:
            # Convert job results to VectorRecord format
            vector_records = []
            
            if "results" in job_result and job_result["results"]:
                for i, result in enumerate(job_result["results"]):
                    if "embeddings" in result and result["embeddings"]:
                        # Handle both single embeddings and list of embeddings
                        embeddings_data = result["embeddings"]
                        if isinstance(embeddings_data, list) and len(embeddings_data) > 0:
                            # Take the first embedding if it's a list of embeddings
                            if isinstance(embeddings_data[0], list):
                                embedding_vector = embeddings_data[0]
                            else:
                                embedding_vector = embeddings_data
                        else:
                            continue  # Skip if no valid embeddings
                        
                        # Create vector record
                        vector_record = VectorRecord(
                            id=result.get("item_id", f"{export_id}_{i}"),
                            vector=embedding_vector,
                            metadata={
                                "text": result.get("transcription", ""),
                                "content_type": result.get("content_type", ""),
                                "processing_time": result.get("processing_time", 0),
                                "language": result.get("language", "en"),
                                "audio_duration": result.get("audio_duration", 0),
                                "token_count": result.get("token_count", 0),
                                "source": result.get("original_metadata", {}).get("title", ""),
                                "embedding_provider": result.get("embedding_provider", ""),
                                "embedding_dimensions": result.get("embedding_dimensions", len(embedding_vector) if embedding_vector else 0)
                            },
                            namespace=vector_db_type or "default",
                            timestamp=datetime.now()
                        )
                        vector_records.append(vector_record)
            
            if not vector_records:
                # Fallback: create simple vector export as JSONL
                export_path = export_dir / f"{export_id}_{timestamp}.jsonl"
                async with aiofiles.open(export_path, 'w') as f:
                    await f.write('{"error": "No valid embeddings found for vector export"}\n')
                return str(export_path)
            
            # Determine vector database type
            if vector_db_type:
                try:
                    db_type = VectorDBType(vector_db_type.lower())
                except ValueError:
                    logger.warning(f"Unknown vector DB type: {vector_db_type}, using generic export")
                    db_type = None
            else:
                db_type = None
            
            if db_type:
                # Use vector database specific export
                db_export_dir = export_dir / f"{export_id}_{db_type.value}_{timestamp}"
                db_export_dir.mkdir(exist_ok=True)
                
                # Configure export
                config = VectorExportConfig(
                    output_directory=str(db_export_dir),
                    batch_size=1000,
                    include_metadata=True,
                    generate_import_script=True,
                    validate_schema=True
                )
                
                # Create connector and export
                connector = VectorDBConnectorFactory.create_connector(db_type, config)
                export_info = connector.export_vectors(vector_records)
                
                # Create a summary file
                summary_path = db_export_dir / "export_summary.json"
                async with aiofiles.open(summary_path, 'w') as f:
                    await f.write(json.dumps({
                        "export_info": export_info,
                        "job_metadata": {
                            "export_id": export_id,
                            "timestamp": timestamp,
                            "total_vectors": len(vector_records),
                            "vector_database": db_type.value,
                            "source": "diala-voice-agent"
                        }
                    }, indent=2, default=str))
                
                # Create a zip file containing all exports
                zip_path = export_dir / f"{export_id}_{db_type.value}_{timestamp}.zip"
                import zipfile
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in db_export_dir.rglob('*'):
                        if file_path.is_file():
                            arcname = file_path.relative_to(db_export_dir)
                            zipf.write(file_path, arcname)
                
                logger.info(f"Vector database export completed: {len(vector_records)} vectors for {db_type.value}")
                return str(zip_path)
            
            else:
                # Generic vector export as JSONL
                export_path = export_dir / f"{export_id}_{timestamp}.jsonl"
                async with aiofiles.open(export_path, 'w') as f:
                    for record in vector_records:
                        vector_data = {
                            "id": record.id,
                            "text": record.metadata.get("text", ""),
                            "vector": record.vector,
                            "metadata": record.metadata
                        }
                        await f.write(json.dumps(vector_data) + '\n')
                
                logger.info(f"Generic vector export completed: {len(vector_records)} vectors")
                return str(export_path)
                
        except Exception as e:
            logger.error(f"Error in vector database export: {e}")
            # Fallback to simple JSONL export
            export_path = export_dir / f"{export_id}_{timestamp}_fallback.jsonl"
            async with aiofiles.open(export_path, 'w') as f:
                await f.write(f'{{"error": "Vector export failed: {str(e)}"}}\n')
            return str(export_path)
    
    def _serialize_processing_result(self, result: ProcessingResult) -> Dict[str, Any]:
        """
        Serialize ProcessingResult to a dictionary, converting enums to strings for Convex compatibility.
        
        Args:
            result: ProcessingResult instance
            
        Returns:
            Dictionary with enum values converted to strings
        """
        # Convert to dict first
        result_dict = asdict(result)
        
        # Convert enums to strings
        if 'content_type' in result_dict and hasattr(result_dict['content_type'], 'value'):
            result_dict['content_type'] = result_dict['content_type'].value
        elif 'content_type' in result_dict:
            # Handle case where it's already a string or other serializable type
            result_dict['content_type'] = str(result_dict['content_type'])
            
        if 'status' in result_dict and hasattr(result_dict['status'], 'value'):
            result_dict['status'] = result_dict['status'].value
        elif 'status' in result_dict:
            result_dict['status'] = str(result_dict['status'])
        
        return result_dict
    
    def __del__(self):
        """Cleanup on deletion"""
        try:
            import shutil
            if hasattr(self, 'temp_dir') and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
        except Exception:
            pass


# Global service instance
bulk_processing_service = BulkProcessingService()


def get_bulk_processing_service() -> BulkProcessingService:
    """Get the global bulk processing service instance."""
    return bulk_processing_service