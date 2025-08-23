"""
Bulk Processing Workflow Orchestrator

Manages the complete pipeline for bulk processing of TikTok content:
TikTok content → Audio processing → Transcription → Embedding → Export

This orchestrator coordinates multiple stages, handles data flow, validates quality,
and prepares export-ready data in formats suitable for vector database import.
"""

import os
import json
import logging
import asyncio
import tempfile
import uuid
import time
from typing import Dict, List, Any, Optional, Union, Callable
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import traceback

# Import existing services
from .tiktok_service import TikTokService, get_tiktok_service
from .audio_preparation_service import AudioPreparationService, audio_preparation_service
from .jina.embeddings_service import JinaEmbeddingsService
from .gemini.embeddings_service import GeminiEmbeddingsService

logger = logging.getLogger(__name__)


class WorkflowStage(Enum):
    """Workflow stage enumeration"""
    CONTENT_INGESTION = "content_ingestion"
    AUDIO_EXTRACTION = "audio_extraction"
    AUDIO_CLEANUP = "audio_cleanup"
    TRANSCRIPTION = "transcription"
    EMBEDDING_GENERATION = "embedding_generation"
    EXPORT_PREPARATION = "export_preparation"
    COMPLETED = "completed"
    FAILED = "failed"


class ExportFormat(Enum):
    """Export format enumeration"""
    PINECONE = "pinecone"
    WEAVIATE = "weaviate"
    CHROMA = "chroma"
    JSONL = "jsonl"
    CSV = "csv"
    PARQUET = "parquet"


class ProcessingStatus(Enum):
    """Processing status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class ContentItem:
    """Represents a single content item in the pipeline"""
    id: str
    video_id: str
    username: str
    title: str
    description: str
    duration: float
    thumbnail_url: str
    created_time: int
    status: ProcessingStatus = ProcessingStatus.PENDING
    stage: WorkflowStage = WorkflowStage.CONTENT_INGESTION
    audio_path: Optional[str] = None
    cleaned_audio_path: Optional[str] = None
    transcription: Optional[str] = None
    embeddings: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    processing_time: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        # Convert enums to strings
        data['status'] = self.status.value
        data['stage'] = self.stage.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ContentItem':
        """Create from dictionary"""
        # Convert string enums back to enums
        if 'status' in data:
            data['status'] = ProcessingStatus(data['status'])
        if 'stage' in data:
            data['stage'] = WorkflowStage(data['stage'])
        return cls(**data)


@dataclass
class WorkflowConfig:
    """Configuration for the bulk processing workflow"""
    # Content ingestion settings
    max_videos_per_user: int = 25
    video_duration_limit: int = 180  # 3 minutes max
    
    # Audio processing settings
    audio_format: str = "wav"
    sample_rate: int = 24000
    channels: int = 1
    clean_silence: bool = True
    separate_vocals: bool = True
    
    # Transcription settings
    whisper_model: str = "base"
    language: Optional[str] = None
    segment_audio: bool = True
    max_segment_duration: int = 30
    
    # Embedding settings
    embedding_provider: str = "jina"  # "jina" or "gemini"
    embedding_dimensions: Optional[int] = None
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Export settings
    export_formats: List[ExportFormat] = None
    include_metadata: bool = True
    include_audio_features: bool = False
    
    # Quality validation settings
    min_transcription_length: int = 10
    max_transcription_length: int = 10000
    min_audio_duration: float = 1.0
    max_processing_retries: int = 3
    
    # Performance settings
    max_concurrent_items: int = 5
    batch_size: int = 10
    timeout_per_item: int = 300  # 5 minutes
    
    def __post_init__(self):
        if self.export_formats is None:
            self.export_formats = [ExportFormat.JSONL, ExportFormat.PINECONE]


@dataclass
class WorkflowProgress:
    """Represents the current progress of the workflow"""
    total_items: int
    completed_items: int
    failed_items: int
    current_stage: WorkflowStage
    stage_progress: float
    overall_progress: float
    estimated_time_remaining: Optional[float] = None
    processing_rate: Optional[float] = None  # items per minute
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = asdict(self)
        data['currentStage'] = self.current_stage.value
        # Remove the original field to avoid conflicts
        if 'current_stage' in data:
            del data['current_stage']
        return data


class BulkWorkflowOrchestrator:
    """
    Orchestrates the complete bulk processing pipeline for TikTok content.
    
    Manages workflow stages, data flow, quality validation, and export preparation.
    """
    
    def __init__(self, config: Optional[WorkflowConfig] = None):
        """Initialize the orchestrator"""
        self.config = config or WorkflowConfig()
        self.tiktok_service = get_tiktok_service()
        self.audio_service = audio_preparation_service
        
        # Initialize embedding service based on config
        if self.config.embedding_provider == "gemini":
            try:
                self.embedding_service = GeminiEmbeddingsService()
                logger.info("Initialized Gemini embeddings service")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini service: {e}, falling back to Jina")
                self.embedding_service = JinaEmbeddingsService()
        else:
            self.embedding_service = JinaEmbeddingsService()
            
        # Workflow state
        self.items: List[ContentItem] = []
        self.progress: Optional[WorkflowProgress] = None
        self.is_running = False
        self.should_stop = False
        self.temp_dir = tempfile.mkdtemp(prefix="bulk_workflow_")
        self.start_time: Optional[float] = None
        
        # Concurrency control
        self.semaphore = asyncio.Semaphore(self.config.max_concurrent_items)
        
        logger.info(f"BulkWorkflowOrchestrator initialized with {self.config.embedding_provider} embeddings")
    
    async def process_user_content(
        self,
        username: str,
        progress_callback: Optional[Callable[[WorkflowProgress], None]] = None
    ) -> Dict[str, Any]:
        """
        Process all content for a given TikTok user through the complete pipeline.
        
        Args:
            username: TikTok username to process
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary containing processing results and export data
        """
        if self.is_running:
            raise ValueError("Workflow is already running")
        
        self.is_running = True
        self.should_stop = False
        self.start_time = time.time()
        
        try:
            logger.info(f"Starting bulk processing for user: @{username}")
            
            # Stage 1: Content Ingestion
            await self._stage_content_ingestion(username, progress_callback)
            
            if self.should_stop:
                return self._create_result_summary("cancelled")
            
            # Stage 2: Audio Extraction
            await self._stage_audio_extraction(progress_callback)
            
            if self.should_stop:
                return self._create_result_summary("cancelled")
            
            # Stage 3: Audio Cleanup
            await self._stage_audio_cleanup(progress_callback)
            
            if self.should_stop:
                return self._create_result_summary("cancelled")
            
            # Stage 4: Transcription
            await self._stage_transcription(progress_callback)
            
            if self.should_stop:
                return self._create_result_summary("cancelled")
            
            # Stage 5: Embedding Generation
            await self._stage_embedding_generation(progress_callback)
            
            if self.should_stop:
                return self._create_result_summary("cancelled")
            
            # Stage 6: Export Preparation
            export_data = await self._stage_export_preparation(progress_callback)
            
            # Create final result
            result = self._create_result_summary("completed")
            result["export_data"] = export_data
            
            logger.info(f"Bulk processing completed for @{username}")
            return result
            
        except Exception as e:
            logger.error(f"Workflow failed for @{username}: {str(e)}")
            logger.error(traceback.format_exc())
            return self._create_result_summary("failed", str(e))
        finally:
            self.is_running = False
    
    async def _stage_content_ingestion(
        self,
        username: str,
        progress_callback: Optional[Callable] = None
    ):
        """Stage 1: Ingest TikTok content for the user"""
        logger.info(f"Stage 1: Content ingestion for @{username}")
        
        try:
            # Fetch user videos
            videos_data = await self.tiktok_service.get_user_videos(
                username,
                count=self.config.max_videos_per_user
            )
            
            videos = videos_data.get("videos", [])
            logger.info(f"Found {len(videos)} videos for @{username}")
            
            # Convert to ContentItem objects
            self.items = []
            for video in videos:
                # Skip videos that are too long
                duration = video.get("duration", 0)
                if duration > self.config.video_duration_limit:
                    logger.warning(f"Skipping video {video.get('videoId')} - too long: {duration}s")
                    continue
                
                item = ContentItem(
                    id=str(uuid.uuid4()),
                    video_id=video.get("videoId", ""),
                    username=username,
                    title=video.get("title", ""),
                    description=video.get("title", ""),  # TikTok uses title as description
                    duration=duration,
                    thumbnail_url=video.get("thumbnail", ""),
                    created_time=video.get("createTime", 0),
                    metadata={
                        "stats": video.get("stats", {}),
                        "hashtags": video.get("hashtags", []),
                        "music": video.get("music", {}),
                        "original_video_data": video
                    }
                )
                self.items.append(item)
            
            # Initialize progress tracking
            self.progress = WorkflowProgress(
                total_items=len(self.items),
                completed_items=0,
                failed_items=0,
                current_stage=WorkflowStage.CONTENT_INGESTION,
                stage_progress=100.0,
                overall_progress=100.0 / 7  # 7 stages total
            )
            
            if progress_callback:
                progress_callback(self.progress)
            
            logger.info(f"Content ingestion completed: {len(self.items)} items")
            
        except Exception as e:
            logger.error(f"Content ingestion failed: {str(e)}")
            raise
    
    async def _stage_audio_extraction(self, progress_callback: Optional[Callable] = None):
        """Stage 2: Extract audio from TikTok videos"""
        logger.info("Stage 2: Audio extraction")
        
        self.progress.current_stage = WorkflowStage.AUDIO_EXTRACTION
        self.progress.stage_progress = 0.0
        
        async def extract_audio(item: ContentItem) -> ContentItem:
            """Extract audio for a single item"""
            async with self.semaphore:
                start_time = time.time()
                
                try:
                    # Download audio from TikTok
                    logger.info(f"Extracting audio for video {item.video_id}")
                    
                    audio_bytes = await self.tiktok_service.download_audio_bytes(
                        item.video_id,
                        format=self.config.audio_format
                    )
                    
                    # Save audio to temporary file
                    audio_filename = f"{item.id}_audio.{self.config.audio_format}"
                    audio_path = os.path.join(self.temp_dir, audio_filename)
                    
                    with open(audio_path, 'wb') as f:
                        f.write(audio_bytes)
                    
                    item.audio_path = audio_path
                    item.stage = WorkflowStage.AUDIO_EXTRACTION
                    item.status = ProcessingStatus.COMPLETED
                    item.processing_time += time.time() - start_time
                    
                    logger.info(f"Audio extracted for {item.video_id}: {len(audio_bytes)} bytes")
                    
                except Exception as e:
                    logger.error(f"Audio extraction failed for {item.video_id}: {str(e)}")
                    item.status = ProcessingStatus.FAILED
                    item.error_message = str(e)
                    item.processing_time += time.time() - start_time
                
                return item
        
        # Process items concurrently
        tasks = [extract_audio(item) for item in self.items if item.status != ProcessingStatus.FAILED]
        
        completed = 0
        for task in asyncio.as_completed(tasks):
            if self.should_stop:
                break
                
            await task
            completed += 1
            
            # Update progress
            self.progress.stage_progress = (completed / len(tasks)) * 100
            self.progress.overall_progress = (2 * 100 + self.progress.stage_progress) / 7
            
            if progress_callback:
                progress_callback(self.progress)
        
        # Update completed/failed counts
        self.progress.completed_items = sum(1 for item in self.items if item.status == ProcessingStatus.COMPLETED)
        self.progress.failed_items = sum(1 for item in self.items if item.status == ProcessingStatus.FAILED)
        
        logger.info(f"Audio extraction completed: {self.progress.completed_items}/{len(self.items)} successful")
    
    async def _stage_audio_cleanup(self, progress_callback: Optional[Callable] = None):
        """Stage 3: Clean and prepare audio files"""
        logger.info("Stage 3: Audio cleanup")
        
        self.progress.current_stage = WorkflowStage.AUDIO_CLEANUP
        self.progress.stage_progress = 0.0
        
        async def cleanup_audio(item: ContentItem) -> ContentItem:
            """Clean audio for a single item"""
            async with self.semaphore:
                start_time = time.time()
                
                try:
                    if not item.audio_path or item.status == ProcessingStatus.FAILED:
                        item.status = ProcessingStatus.SKIPPED
                        return item
                    
                    logger.info(f"Cleaning audio for video {item.video_id}")
                    
                    # Prepare audio with cleanup configuration
                    config = {
                        "use_whisper": False,  # Don't transcribe yet
                        "segment_audio": False,  # Don't segment yet
                        "clean_silence": self.config.clean_silence,
                        "separate_voices": self.config.separate_vocals,
                        "provider_specific": {
                            "sample_rate": self.config.sample_rate,
                            "channels": self.config.channels
                        }
                    }
                    
                    result = await self.audio_service.prepare_audio(
                        item.audio_path,
                        provider="transcription",
                        config=config
                    )
                    
                    item.cleaned_audio_path = result["prepared_audio_path"]
                    
                    # Update metadata with audio preparation info
                    if not item.metadata:
                        item.metadata = {}
                    item.metadata.update({
                        "audio_cleanup": result.get("metadata", {}),
                        "vocals_extracted": result.get("metadata", {}).get("vocals_extracted", False),
                        "silence_removed": result.get("metadata", {}).get("silence_removed", False)
                    })
                    
                    item.stage = WorkflowStage.AUDIO_CLEANUP
                    item.status = ProcessingStatus.COMPLETED
                    item.processing_time += time.time() - start_time
                    
                    logger.info(f"Audio cleaned for {item.video_id}")
                    
                except Exception as e:
                    logger.error(f"Audio cleanup failed for {item.video_id}: {str(e)}")
                    item.status = ProcessingStatus.FAILED
                    item.error_message = str(e)
                    item.processing_time += time.time() - start_time
                
                return item
        
        # Process items that have audio
        items_to_process = [item for item in self.items if item.audio_path and item.status != ProcessingStatus.FAILED]
        tasks = [cleanup_audio(item) for item in items_to_process]
        
        completed = 0
        for task in asyncio.as_completed(tasks):
            if self.should_stop:
                break
                
            await task
            completed += 1
            
            # Update progress
            self.progress.stage_progress = (completed / len(tasks)) * 100 if tasks else 100
            self.progress.overall_progress = (3 * 100 + self.progress.stage_progress) / 7
            
            if progress_callback:
                progress_callback(self.progress)
        
        logger.info(f"Audio cleanup completed: {completed}/{len(items_to_process)} processed")
    
    async def _stage_transcription(self, progress_callback: Optional[Callable] = None):
        """Stage 4: Transcribe audio content"""
        logger.info("Stage 4: Transcription")
        
        self.progress.current_stage = WorkflowStage.TRANSCRIPTION
        self.progress.stage_progress = 0.0
        
        async def transcribe_audio(item: ContentItem) -> ContentItem:
            """Transcribe audio for a single item"""
            async with self.semaphore:
                start_time = time.time()
                
                try:
                    if not item.cleaned_audio_path or item.status == ProcessingStatus.FAILED:
                        item.status = ProcessingStatus.SKIPPED
                        return item
                    
                    logger.info(f"Transcribing audio for video {item.video_id}")
                    
                    # Transcription configuration
                    config = {
                        "use_whisper": True,
                        "segment_audio": self.config.segment_audio,
                        "max_segment_duration": self.config.max_segment_duration,
                        "transcribe": True,
                        "clean_silence": False,  # Already cleaned
                        "separate_voices": False,  # Already separated
                        "provider_specific": {
                            "language": self.config.language,
                            "model_size": self.config.whisper_model
                        }
                    }
                    
                    result = await self.audio_service.prepare_audio(
                        item.cleaned_audio_path,
                        provider="transcription",
                        config=config
                    )
                    
                    transcription = result.get("transcription", "").strip()
                    
                    # Validate transcription quality
                    if len(transcription) < self.config.min_transcription_length:
                        raise ValueError(f"Transcription too short: {len(transcription)} characters")
                    
                    if len(transcription) > self.config.max_transcription_length:
                        logger.warning(f"Transcription very long: {len(transcription)} characters")
                        # Truncate but don't fail
                        transcription = transcription[:self.config.max_transcription_length]
                    
                    item.transcription = transcription
                    
                    # Update metadata with transcription info
                    if not item.metadata:
                        item.metadata = {}
                    item.metadata.update({
                        "transcription_metadata": result.get("metadata", {}),
                        "language": result.get("metadata", {}).get("language", "unknown"),
                        "segments": result.get("segments", []),
                        "transcription_length": len(transcription),
                        "word_count": len(transcription.split()) if transcription else 0
                    })
                    
                    item.stage = WorkflowStage.TRANSCRIPTION
                    item.status = ProcessingStatus.COMPLETED
                    item.processing_time += time.time() - start_time
                    
                    logger.info(f"Transcription completed for {item.video_id}: {len(transcription)} chars")
                    
                except Exception as e:
                    logger.error(f"Transcription failed for {item.video_id}: {str(e)}")
                    item.status = ProcessingStatus.FAILED
                    item.error_message = str(e)
                    item.processing_time += time.time() - start_time
                
                return item
        
        # Process items that have cleaned audio
        items_to_process = [
            item for item in self.items 
            if item.cleaned_audio_path and item.status != ProcessingStatus.FAILED
        ]
        
        tasks = [transcribe_audio(item) for item in items_to_process]
        
        completed = 0
        for task in asyncio.as_completed(tasks):
            if self.should_stop:
                break
                
            await task
            completed += 1
            
            # Update progress
            self.progress.stage_progress = (completed / len(tasks)) * 100 if tasks else 100
            self.progress.overall_progress = (4 * 100 + self.progress.stage_progress) / 7
            
            if progress_callback:
                progress_callback(self.progress)
        
        logger.info(f"Transcription completed: {completed}/{len(items_to_process)} processed")
    
    async def _stage_embedding_generation(self, progress_callback: Optional[Callable] = None):
        """Stage 5: Generate embeddings for transcriptions"""
        logger.info("Stage 5: Embedding generation")
        
        self.progress.current_stage = WorkflowStage.EMBEDDING_GENERATION
        self.progress.stage_progress = 0.0
        
        # Collect all transcriptions for batch processing
        items_with_transcriptions = [
            item for item in self.items 
            if item.transcription and item.status != ProcessingStatus.FAILED
        ]
        
        if not items_with_transcriptions:
            logger.warning("No items with transcriptions found for embedding generation")
            self.progress.stage_progress = 100.0
            self.progress.overall_progress = (5 * 100) / 7
            if progress_callback:
                progress_callback(self.progress)
            return
        
        try:
            # Process in batches
            batch_size = self.config.batch_size
            total_batches = (len(items_with_transcriptions) + batch_size - 1) // batch_size
            
            for batch_idx in range(0, len(items_with_transcriptions), batch_size):
                if self.should_stop:
                    break
                
                batch_items = items_with_transcriptions[batch_idx:batch_idx + batch_size]
                texts = [item.transcription for item in batch_items]
                
                logger.info(f"Generating embeddings for batch {batch_idx // batch_size + 1}/{total_batches}")
                
                # Generate embeddings based on provider
                if self.config.embedding_provider == "gemini":
                    embeddings = await self.embedding_service.embed_documents(
                        texts,
                        output_dimensionality=self.config.embedding_dimensions
                    )
                else:  # Jina
                    embeddings = await self.embedding_service.embed_documents(texts)
                
                # Assign embeddings to items
                for item, embedding in zip(batch_items, embeddings):
                    item.embeddings = embedding
                    item.stage = WorkflowStage.EMBEDDING_GENERATION
                    item.status = ProcessingStatus.COMPLETED
                    
                    # Update metadata
                    if not item.metadata:
                        item.metadata = {}
                    item.metadata.update({
                        "embedding_provider": self.config.embedding_provider,
                        "embedding_dimensions": len(embedding),
                        "embedding_model": getattr(self.embedding_service, 'model_name', 'unknown')
                    })
                
                # Update progress
                completed_batches = (batch_idx // batch_size) + 1
                self.progress.stage_progress = (completed_batches / total_batches) * 100
                self.progress.overall_progress = (5 * 100 + self.progress.stage_progress) / 7
                
                if progress_callback:
                    progress_callback(self.progress)
                
                # Small delay between batches to avoid rate limiting
                if batch_idx + batch_size < len(items_with_transcriptions):
                    await asyncio.sleep(0.5)
            
            successful_embeddings = sum(1 for item in items_with_transcriptions if item.embeddings)
            logger.info(f"Embedding generation completed: {successful_embeddings}/{len(items_with_transcriptions)} successful")
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            # Mark all remaining items as failed
            for item in items_with_transcriptions:
                if not item.embeddings:
                    item.status = ProcessingStatus.FAILED
                    item.error_message = f"Embedding generation failed: {str(e)}"
            raise
    
    async def _stage_export_preparation(self, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Stage 6: Prepare data for export in various formats"""
        logger.info("Stage 6: Export preparation")
        
        self.progress.current_stage = WorkflowStage.EXPORT_PREPARATION
        self.progress.stage_progress = 0.0
        
        # Filter successfully processed items
        successful_items = [
            item for item in self.items 
            if item.embeddings and item.transcription and item.status == ProcessingStatus.COMPLETED
        ]
        
        if not successful_items:
            logger.warning("No successfully processed items found for export")
            return {"formats": {}, "summary": {"total_items": 0}}
        
        logger.info(f"Preparing export for {len(successful_items)} successfully processed items")
        
        export_data = {"formats": {}, "summary": {}}
        
        try:
            # Generate export data for each requested format
            for i, export_format in enumerate(self.config.export_formats):
                logger.info(f"Preparing {export_format.value} export format")
                
                if export_format == ExportFormat.PINECONE:
                    export_data["formats"]["pinecone"] = self._prepare_pinecone_format(successful_items)
                elif export_format == ExportFormat.WEAVIATE:
                    export_data["formats"]["weaviate"] = self._prepare_weaviate_format(successful_items)
                elif export_format == ExportFormat.CHROMA:
                    export_data["formats"]["chroma"] = self._prepare_chroma_format(successful_items)
                elif export_format == ExportFormat.JSONL:
                    export_data["formats"]["jsonl"] = self._prepare_jsonl_format(successful_items)
                elif export_format == ExportFormat.CSV:
                    export_data["formats"]["csv"] = self._prepare_csv_format(successful_items)
                elif export_format == ExportFormat.PARQUET:
                    export_data["formats"]["parquet"] = self._prepare_parquet_format(successful_items)
                
                # Update progress
                self.progress.stage_progress = ((i + 1) / len(self.config.export_formats)) * 100
                self.progress.overall_progress = (6 * 100 + self.progress.stage_progress) / 7
                
                if progress_callback:
                    progress_callback(self.progress)
            
            # Add summary information
            export_data["summary"] = {
                "total_items": len(successful_items),
                "embedding_provider": self.config.embedding_provider,
                "embedding_dimensions": len(successful_items[0].embeddings) if successful_items else 0,
                "export_formats": [fmt.value for fmt in self.config.export_formats],
                "processing_time": time.time() - self.start_time if self.start_time else 0,
                "username": successful_items[0].username if successful_items else "",
                "generated_at": time.time()
            }
            
            logger.info("Export preparation completed")
            return export_data
            
        except Exception as e:
            logger.error(f"Export preparation failed: {str(e)}")
            raise
    
    def _prepare_pinecone_format(self, items: List[ContentItem]) -> Dict[str, Any]:
        """Prepare data in Pinecone format"""
        vectors = []
        
        for item in items:
            vector_data = {
                "id": f"{item.username}_{item.video_id}",
                "values": item.embeddings,
                "metadata": {
                    "username": item.username,
                    "video_id": item.video_id,
                    "title": item.title,
                    "description": item.description,
                    "transcription": item.transcription,
                    "duration": item.duration,
                    "created_time": item.created_time,
                    "thumbnail_url": item.thumbnail_url
                }
            }
            
            # Add optional metadata
            if self.config.include_metadata and item.metadata:
                # Filter out large nested objects for Pinecone metadata limits
                filtered_metadata = {}
                for key, value in item.metadata.items():
                    if key in ["stats", "language", "word_count", "transcription_length"]:
                        if isinstance(value, (str, int, float, bool)):
                            filtered_metadata[key] = value
                        elif isinstance(value, dict) and key == "stats":
                            # Include basic stats
                            stats = value
                            filtered_metadata.update({
                                "views": stats.get("views", 0),
                                "likes": stats.get("likes", 0),
                                "comments": stats.get("comments", 0),
                                "shares": stats.get("shares", 0)
                            })
                
                vector_data["metadata"].update(filtered_metadata)
            
            vectors.append(vector_data)
        
        return {
            "vectors": vectors,
            "namespace": f"tiktok_{items[0].username}",
            "dimension": len(items[0].embeddings)
        }
    
    def _prepare_weaviate_format(self, items: List[ContentItem]) -> Dict[str, Any]:
        """Prepare data in Weaviate format"""
        objects = []
        
        for item in items:
            obj = {
                "class": "TikTokContent",
                "id": f"{item.username}_{item.video_id}",
                "properties": {
                    "username": item.username,
                    "videoId": item.video_id,
                    "title": item.title,
                    "description": item.description,
                    "transcription": item.transcription,
                    "duration": item.duration,
                    "createdTime": item.created_time,
                    "thumbnailUrl": item.thumbnail_url
                },
                "vector": item.embeddings
            }
            
            # Add metadata
            if self.config.include_metadata and item.metadata:
                if "stats" in item.metadata:
                    stats = item.metadata["stats"]
                    obj["properties"].update({
                        "views": stats.get("views", 0),
                        "likes": stats.get("likes", 0),
                        "comments": stats.get("comments", 0),
                        "shares": stats.get("shares", 0)
                    })
                
                obj["properties"]["language"] = item.metadata.get("language", "unknown")
                obj["properties"]["wordCount"] = item.metadata.get("word_count", 0)
            
            objects.append(obj)
        
        return {
            "objects": objects,
            "class_name": "TikTokContent"
        }
    
    def _prepare_chroma_format(self, items: List[ContentItem]) -> Dict[str, Any]:
        """Prepare data in Chroma format"""
        ids = []
        embeddings = []
        metadatas = []
        documents = []
        
        for item in items:
            ids.append(f"{item.username}_{item.video_id}")
            embeddings.append(item.embeddings)
            documents.append(item.transcription)
            
            metadata = {
                "username": item.username,
                "video_id": item.video_id,
                "title": item.title,
                "description": item.description,
                "duration": item.duration,
                "created_time": item.created_time,
                "thumbnail_url": item.thumbnail_url
            }
            
            # Add stats if available
            if self.config.include_metadata and item.metadata and "stats" in item.metadata:
                stats = item.metadata["stats"]
                metadata.update({
                    "views": stats.get("views", 0),
                    "likes": stats.get("likes", 0),
                    "comments": stats.get("comments", 0),
                    "shares": stats.get("shares", 0)
                })
            
            metadatas.append(metadata)
        
        return {
            "ids": ids,
            "embeddings": embeddings,
            "metadatas": metadatas,
            "documents": documents,
            "collection_name": f"tiktok_{items[0].username}"
        }
    
    def _prepare_jsonl_format(self, items: List[ContentItem]) -> Dict[str, Any]:
        """Prepare data in JSONL format"""
        records = []
        
        for item in items:
            record = {
                "id": f"{item.username}_{item.video_id}",
                "username": item.username,
                "video_id": item.video_id,
                "title": item.title,
                "description": item.description,
                "transcription": item.transcription,
                "duration": item.duration,
                "created_time": item.created_time,
                "thumbnail_url": item.thumbnail_url,
                "embeddings": item.embeddings
            }
            
            # Add metadata
            if self.config.include_metadata and item.metadata:
                record["metadata"] = item.metadata
            
            records.append(record)
        
        return {
            "records": records,
            "format": "jsonl"
        }
    
    def _prepare_csv_format(self, items: List[ContentItem]) -> Dict[str, Any]:
        """Prepare data in CSV format (without embeddings)"""
        rows = []
        
        for item in items:
            row = {
                "id": f"{item.username}_{item.video_id}",
                "username": item.username,
                "video_id": item.video_id,
                "title": item.title,
                "description": item.description,
                "transcription": item.transcription,
                "duration": item.duration,
                "created_time": item.created_time,
                "thumbnail_url": item.thumbnail_url,
                "embedding_dimensions": len(item.embeddings)
            }
            
            # Add basic stats
            if self.config.include_metadata and item.metadata and "stats" in item.metadata:
                stats = item.metadata["stats"]
                row.update({
                    "views": stats.get("views", 0),
                    "likes": stats.get("likes", 0),
                    "comments": stats.get("comments", 0),
                    "shares": stats.get("shares", 0)
                })
            
            rows.append(row)
        
        return {
            "rows": rows,
            "format": "csv"
        }
    
    def _prepare_parquet_format(self, items: List[ContentItem]) -> Dict[str, Any]:
        """Prepare data in Parquet format"""
        # Similar to CSV but more structured
        return self._prepare_csv_format(items)
    
    def _create_result_summary(self, status: str, error_message: Optional[str] = None) -> Dict[str, Any]:
        """Create a summary of the processing results"""
        total_items = len(self.items)
        completed_items = sum(1 for item in self.items if item.status == ProcessingStatus.COMPLETED)
        failed_items = sum(1 for item in self.items if item.status == ProcessingStatus.FAILED)
        skipped_items = sum(1 for item in self.items if item.status == ProcessingStatus.SKIPPED)
        
        # Calculate processing time
        processing_time = time.time() - self.start_time if self.start_time else 0
        
        # Stage completion statistics
        stage_stats = {}
        for stage in WorkflowStage:
            stage_stats[stage.value] = sum(1 for item in self.items if item.stage == stage)
        
        summary = {
            "status": status,
            "processing_time": processing_time,
            "total_items": total_items,
            "completed_items": completed_items,
            "failed_items": failed_items,
            "skipped_items": skipped_items,
            "success_rate": (completed_items / total_items * 100) if total_items > 0 else 0,
            "stage_statistics": stage_stats,
            "configuration": {
                "embedding_provider": self.config.embedding_provider,
                "max_videos": self.config.max_videos_per_user,
                "export_formats": [fmt.value for fmt in self.config.export_formats],
                "whisper_model": self.config.whisper_model
            }
        }
        
        if error_message:
            summary["error_message"] = error_message
        
        # Add item details for failed items
        if failed_items > 0:
            summary["failed_items_details"] = [
                {
                    "video_id": item.video_id,
                    "stage": item.stage.value,
                    "error": item.error_message
                }
                for item in self.items if item.status == ProcessingStatus.FAILED
            ]
        
        return summary
    
    def stop_processing(self):
        """Signal the workflow to stop processing"""
        logger.info("Stop signal received - workflow will halt after current operations")
        self.should_stop = True
    
    def cleanup(self):
        """Clean up temporary files and resources"""
        try:
            if os.path.exists(self.temp_dir):
                import shutil
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temporary directory: {self.temp_dir}")
        except Exception as e:
            logger.warning(f"Error cleaning up temporary files: {str(e)}")
    
    def __del__(self):
        """Cleanup on deletion"""
        self.cleanup()


# Factory function for easy instantiation
def create_bulk_orchestrator(config: Optional[WorkflowConfig] = None) -> BulkWorkflowOrchestrator:
    """
    Create a new bulk workflow orchestrator instance.
    
    Args:
        config: Optional workflow configuration
        
    Returns:
        Configured BulkWorkflowOrchestrator instance
    """
    return BulkWorkflowOrchestrator(config)


# Example usage configuration presets
class ConfigPresets:
    """Pre-configured workflow settings for common use cases"""
    
    @staticmethod
    def quick_processing() -> WorkflowConfig:
        """Configuration for quick processing with basic features"""
        return WorkflowConfig(
            max_videos_per_user=10,
            clean_silence=False,
            separate_vocals=False,
            whisper_model="tiny",
            embedding_provider="jina",
            export_formats=[ExportFormat.JSONL],
            max_concurrent_items=3,
            batch_size=5
        )
    
    @staticmethod
    def high_quality() -> WorkflowConfig:
        """Configuration for high-quality processing"""
        return WorkflowConfig(
            max_videos_per_user=25,
            clean_silence=True,
            separate_vocals=True,
            whisper_model="base",
            embedding_provider="gemini",
            export_formats=[ExportFormat.PINECONE, ExportFormat.WEAVIATE, ExportFormat.JSONL],
            max_concurrent_items=5,
            batch_size=10,
            include_metadata=True
        )
    
    @staticmethod
    def production_ready() -> WorkflowConfig:
        """Configuration optimized for production use"""
        return WorkflowConfig(
            max_videos_per_user=20,
            clean_silence=True,
            separate_vocals=True,
            whisper_model="base",
            embedding_provider="jina",  # More stable than experimental Gemini
            export_formats=[ExportFormat.PINECONE, ExportFormat.JSONL],
            max_concurrent_items=3,  # Conservative for stability
            batch_size=8,
            include_metadata=True,
            timeout_per_item=600,  # 10 minutes
            max_processing_retries=2
        )