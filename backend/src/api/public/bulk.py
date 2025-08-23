"""
Bulk Processing API - Public endpoints for bulk content processing.

This module provides endpoints for bulk processing of content (TikTok videos, 
YouTube videos, documents) into vector embeddings with export capabilities.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
import asyncio
import os
import tempfile
import aiofiles
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv
from convex import ConvexClient
import httpx
import logging
from pathlib import Path
import time
import json

# Import our services
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from services.bulk_processing_service import get_bulk_processing_service
from services.bulk_job_manager import BulkJobManager
from core.rate_limiting import RateLimitException, check_rate_limit

# Setup logger
logger = logging.getLogger(__name__)

# Load environment variables
backend_env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(backend_env_path)

frontend_env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(frontend_env_path, override=False)

router = APIRouter()

# Initialize Convex client
CONVEX_URL = os.getenv("CONVEX_URL") or os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
logger.info(f"Initializing Convex client with URL: {CONVEX_URL}")
convex_client = ConvexClient(CONVEX_URL)

# Initialize job manager
job_manager = BulkJobManager()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        self.active_connections[job_id] = websocket
        logger.info(f"WebSocket connected for job {job_id}")

    def disconnect(self, job_id: str):
        if job_id in self.active_connections:
            del self.active_connections[job_id]
            logger.info(f"WebSocket disconnected for job {job_id}")

    async def send_progress_update(self, job_id: str, data: dict):
        if job_id in self.active_connections:
            try:
                await self.active_connections[job_id].send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"Error sending progress update to {job_id}: {e}")
                self.disconnect(job_id)

manager = ConnectionManager()


class EmbeddingModelRequest(BaseModel):
    """Embedding model configuration."""
    id: str = Field(..., description="Model ID (jina-v4, gemini-exp)")
    label: str = Field(..., description="Model display name")
    dimensions: int = Field(..., description="Vector dimensions")
    max_tokens: int = Field(..., description="Maximum tokens per request")
    
    # JINA V4 specific parameters for transcript processing
    jina_v4_task: Optional[str] = Field(default="retrieval.passage", description="JINA V4 task type for transcripts")
    jina_v4_dimensions: Optional[int] = Field(default=1024, description="JINA V4 embedding dimensions")
    jina_v4_late_chunking: Optional[bool] = Field(default=True, description="Enable late chunking for long transcripts")
    jina_v4_multi_vector: Optional[bool] = Field(default=False, description="Multi-vector embeddings")
    jina_v4_optimize_for_rag: Optional[bool] = Field(default=True, description="Optimize for RAG systems")
    jina_v4_truncate_at_max: Optional[bool] = Field(default=True, description="Truncate at maximum length")


class VectorDbRequest(BaseModel):
    """Vector database configuration."""
    id: str = Field(..., description="Database ID (pinecone, chromadb, weaviate)")
    label: str = Field(..., description="Database display name")


class BulkSettingsRequest(BaseModel):
    """Bulk processing settings."""
    chunkSize: int = Field(default=1024, description="Text chunk size", ge=512, le=4096)
    chunkOverlap: int = Field(default=100, description="Chunk overlap", ge=0, le=500)
    maxTokens: int = Field(default=8192, description="Maximum tokens", ge=512, le=8192)


class BulkProcessingRequest(BaseModel):
    """Request model for bulk processing."""
    job_id: str = Field(..., description="Unique job identifier")
    platform: str = Field(..., description="Content platform (tiktok, youtube, twitch, documents)")
    input_method: str = Field(..., description="Input method (channel, urls, upload)")
    channel_url: Optional[str] = Field(None, description="Channel URL for channel method")
    pasted_urls: Optional[List[str]] = Field(None, description="List of URLs for urls method")
    selected_content: List[str] = Field(..., description="Selected content IDs")
    uploaded_documents: Optional[List[Dict[str, Any]]] = Field(None, description="Uploaded documents")
    embedding_model: EmbeddingModelRequest = Field(..., description="Selected embedding model")
    vector_db: VectorDbRequest = Field(..., description="Selected vector database")
    settings: BulkSettingsRequest = Field(..., description="Processing settings")
    user_id: Optional[str] = Field("bulk-user", description="User ID for rate limiting")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "bulk-1234567890",
                "platform": "tiktok",
                "input_method": "channel",
                "channel_url": "https://tiktok.com/@zachking",
                "selected_content": ["7123456789012345678", "7123456789012345679"],
                "embedding_model": {
                    "id": "jina-v4",
                    "label": "Jina Embedder v4",
                    "dimensions": 1024,
                    "max_tokens": 8192,
                    "jina_v4_task": "retrieval.passage",
                    "jina_v4_dimensions": 1024,
                    "jina_v4_late_chunking": True,
                    "jina_v4_multi_vector": False,
                    "jina_v4_optimize_for_rag": True,
                    "jina_v4_truncate_at_max": True
                },
                "vector_db": {
                    "id": "pinecone",
                    "label": "Pinecone"
                },
                "settings": {
                    "chunkSize": 1024,
                    "chunkOverlap": 100,
                    "maxTokens": 8192
                }
            }
        }


class BulkProcessingResponse(BaseModel):
    """Response model for bulk processing."""
    success: bool
    job_id: str
    message: str
    websocket_url: str
    estimated_time: Optional[str] = None


class ExportRequest(BaseModel):
    """Request model for exporting results."""
    job_id: str = Field(..., description="Processing job ID")
    format: str = Field(..., description="Export format (json, csv, parquet, vector)")
    export_id: Optional[str] = Field(None, description="Export identifier")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "bulk-1234567890",
                "format": "json",
                "export_id": "export-1234567890"
            }
        }


class ExportResponse(BaseModel):
    """Response model for export request."""
    success: bool
    export_id: str
    message: str
    status_url: str


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    job_id: str
    status: str
    progress: float
    stage: str
    content_processed: int
    total_content: int
    embeddings: int
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None


class ExportStatusResponse(BaseModel):
    """Response model for export status."""
    export_id: str
    status: str
    progress: float
    download_url: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None
    error: Optional[str] = None


@router.post("/process", response_model=BulkProcessingResponse)
async def process_bulk_content(
    request: BulkProcessingRequest,
    background_tasks: BackgroundTasks
):
    """Start bulk processing of content."""
    try:
        logger.info(f"Starting bulk processing for job {request.job_id}")
        
        # Rate limiting check
        try:
            await check_rate_limit(
                user_id=request.user_id,
                action="bulk_process",
                limit=20,  # 20 bulk processing requests per hour (increased for development)
                window_hours=1
            )
        except RateLimitException as e:
            raise HTTPException(status_code=429, detail=str(e))

        # Validate request
        if not request.selected_content:
            raise HTTPException(status_code=400, detail="No content selected for processing")

        # Initialize job in job manager with error handling
        try:
            job_manager.create_job(
                job_id=request.job_id,
                job_type="bulk_processing",
                user_id=request.user_id,
                total_items=len(request.selected_content),
                config={
                    "platform": request.platform,
                    "input_method": request.input_method,
                    "embedding_model": request.embedding_model.dict(),
                    "vector_db": request.vector_db.dict(),
                    "settings": request.settings.dict()
                }
            )
            logger.info(f"Successfully created job {request.job_id}")
        except ValueError as e:
            if "Rate limit exceeded" in str(e):
                raise HTTPException(status_code=429, detail=str(e))
            else:
                logger.error(f"Error creating job: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating job: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

        # Start background processing only if job creation succeeded
        background_tasks.add_task(
            process_bulk_content_task,
            request.dict(),
            request.job_id
        )

        websocket_url = f"ws://localhost:8000/api/public/bulk/ws/bulk-processing/{request.job_id}"
        
        return BulkProcessingResponse(
            success=True,
            job_id=request.job_id,
            message="Bulk processing started successfully",
            websocket_url=websocket_url,
            estimated_time=f"{len(request.selected_content) * 2} minutes"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting bulk processing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start bulk processing: {str(e)}")


async def process_bulk_content_task(request_data: dict, job_id: str):
    """Background task for processing bulk content."""
    try:
        logger.info(f"Background processing started for job {job_id}")
        
        # Get bulk processing service
        service = get_bulk_processing_service()
        
        # Progress callback to send updates via WebSocket
        async def progress_callback(progress_data):
            # Ensure stage is always a string, not an object
            stage_value = progress_data.get("stage", "")
            if isinstance(stage_value, dict):
                # If stage is an object, extract the stage string from it or use a default
                stage_str = stage_value.get("stage", "Processing...")
            else:
                stage_str = str(stage_value) if stage_value is not None else "Processing..."
            
            await manager.send_progress_update(job_id, {
                "type": "progress",
                "job_id": job_id,
                "progress": progress_data["progress"],
                "stage": stage_str,
                "contentProcessed": progress_data.get("content_processed", 0),
                "embeddings": progress_data.get("embeddings", 0),
                "status": progress_data.get("status", "processing")
            })
            
            # Update job manager with filtered metadata (only schema-allowed fields)
            # Use the same stage_str as above for consistency
            filtered_metadata = {
                "content_processed": progress_data.get("content_processed", 0),
                "embeddings": progress_data.get("embeddings", 0),
                "progress": progress_data.get("progress", 0),
                "stage": stage_str,
                "status": progress_data.get("status", "processing")
            }
            
            job_manager.update_job_progress(
                job_id=job_id,
                progress=progress_data["progress"],
                stage=stage_str,
                metadata=filtered_metadata
            )

        # Convert request data to processing config
        config = {
            "platform": request_data["platform"],
            "input_method": request_data["input_method"],
            "channel_url": request_data.get("channel_url"),
            "pasted_urls": request_data.get("pasted_urls"),
            "selected_content": request_data["selected_content"],
            "uploaded_documents": request_data.get("uploaded_documents"),
            "embedding_model": request_data["embedding_model"],
            "vector_db": request_data["vector_db"],
            "settings": request_data["settings"],
            "user_id": request_data.get("user_id", "bulk-user")
        }

        # Process content
        result = await service.process_bulk_content(
            config=config,
            job_id=job_id,
            progress_callback=progress_callback
        )

        # Send completion notification
        await manager.send_progress_update(job_id, {
            "type": "completed",
            "job_id": job_id,
            "progress": 100,
            "stage": "Processing completed successfully!",
            "result": result
        })

        # Update job as completed
        job_manager.complete_job(job_id, result)
        
        logger.info(f"Bulk processing completed for job {job_id}")

    except Exception as e:
        logger.error(f"Error in bulk processing task for job {job_id}: {e}")
        
        # Send error notification
        await manager.send_progress_update(job_id, {
            "type": "error",
            "job_id": job_id,
            "message": str(e)
        })

        # Mark job as failed
        job_manager.fail_job(job_id, str(e))


@router.get("/job/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a bulk processing job."""
    try:
        job_status = await job_manager.get_job_status(job_id)
        
        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")

        return JobStatusResponse(**job_status)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status for {job_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.post("/export", response_model=ExportResponse)
async def export_results(
    request: ExportRequest,
    background_tasks: BackgroundTasks
):
    """Export bulk processing results."""
    try:
        logger.info(f"Starting export for job {request.job_id} in format {request.format}")
        
        # Check if job exists and is completed
        job_status = await job_manager.get_job_status(request.job_id)
        if not job_status:
            logger.error(f"Export requested for non-existent job: {request.job_id}")
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_status["status"] != "completed":
            raise HTTPException(status_code=400, detail="Job is not completed yet")

        export_id = request.export_id or f"export-{int(time.time())}"
        
        # Start background export
        background_tasks.add_task(
            export_results_task,
            request.job_id,
            request.format,
            export_id
        )

        status_url = f"/api/public/bulk/export/{export_id}/status"
        
        return ExportResponse(
            success=True,
            export_id=export_id,
            message="Export started successfully",
            status_url=status_url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting export: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start export: {str(e)}")


async def export_results_task(job_id: str, format: str, export_id: str):
    """Background task for exporting results."""
    try:
        logger.info(f"Background export started for job {job_id}, export {export_id}")
        
        # Get bulk processing service
        service = get_bulk_processing_service()
        
        # Get job result and configuration
        job_status = await job_manager.get_job_status(job_id)
        if not job_status or not job_status.get("result"):
            raise Exception("Job result not found")

        # Get vector database type from job configuration
        vector_db_type = None
        job_config = job_status.get("config", {})
        if "vector_db" in job_config and isinstance(job_config["vector_db"], dict):
            vector_db_type = job_config["vector_db"].get("id")
        
        logger.info(f"Exporting {format} format with vector DB type: {vector_db_type}")

        # Export data
        export_path = await service.export_data(
            job_result=job_status["result"],
            format=format,
            export_id=export_id,
            vector_db_type=vector_db_type
        )

        # Update export status as completed
        export_info = {
            "export_id": export_id,
            "status": "completed",
            "progress": 100,
            "download_url": f"/api/public/bulk/download/{export_id}",
            "filename": os.path.basename(export_path),
            "file_size": os.path.getsize(export_path),
            "file_path": export_path  # Add the full file path for download
        }
        
        # Store export info (you might want to store this in a database)
        job_manager.store_export_info(export_id, export_info)
        
        logger.info(f"Export completed for {export_id}")

    except Exception as e:
        logger.error(f"Error in export task for {export_id}: {e}")
        
        # Update export status as failed
        export_info = {
            "export_id": export_id,
            "status": "failed",
            "progress": 0,
            "error": str(e)
        }
        job_manager.store_export_info(export_id, export_info)


@router.get("/export/{export_id}/status", response_model=ExportStatusResponse)
async def get_export_status(export_id: str):
    """Get the status of an export."""
    try:
        export_info = job_manager.get_export_info(export_id)
        
        if not export_info:
            raise HTTPException(status_code=404, detail="Export not found")

        return ExportStatusResponse(**export_info)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting export status for {export_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get export status: {str(e)}")


@router.get("/download/{export_id}")
async def download_export(export_id: str):
    """Download exported file."""
    try:
        export_info = job_manager.get_export_info(export_id)
        
        if not export_info:
            raise HTTPException(status_code=404, detail="Export not found")
        
        if export_info["status"] != "completed":
            raise HTTPException(status_code=400, detail="Export is not ready for download")

        # Get file path (this should be stored with the export info)
        file_path = export_info.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Export file not found")

        return FileResponse(
            path=file_path,
            filename=export_info["filename"],
            media_type='application/octet-stream'
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading export {export_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download export: {str(e)}")


@router.delete("/cleanup")
async def cleanup_old_jobs():
    """Clean up old completed/failed jobs for development purposes."""
    try:
        # This is a development endpoint to help with rate limiting issues
        # In production, this should be secured or removed
        logger.info("Cleaning up old bulk jobs for development")
        
        # Clean up jobs older than 1 day
        from convex import ConvexClient
        convex_client = ConvexClient(CONVEX_URL)
        
        try:
            result = convex_client.mutation("bulkJobs:cleanupOldJobs", {"olderThanDays": 1})
            logger.info(f"Cleaned up {result.get('deletedCount', 0)} old jobs")
            return {"success": True, "deleted_count": result.get('deletedCount', 0)}
        except Exception as e:
            logger.error(f"Error calling cleanup mutation: {e}")
            return {"success": False, "error": str(e)}
            
    except Exception as e:
        logger.error(f"Error cleaning up jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup jobs: {str(e)}")


@router.websocket("/ws/bulk-processing/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time progress updates."""
    try:
        await manager.connect(websocket, job_id)
        
        # Send initial status
        job_status = await job_manager.get_job_status(job_id)
        if job_status:
            await websocket.send_text(json.dumps({
                "type": "status",
                "job_id": job_id,
                "status": job_status.get("status", "pending"),
                "progress": job_status.get("progress", 0),
                "stage": job_status.get("stage", "initializing")
            }))

        # Keep connection alive
        while True:
            try:
                # Wait for client messages (though we don't expect any)
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error for {job_id}: {e}")
                break

    except Exception as e:
        logger.error(f"WebSocket connection error for {job_id}: {e}")
    finally:
        manager.disconnect(job_id)