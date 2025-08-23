"""
API endpoints for RAG workflow management.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import os
import shutil
import uuid

from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..security.models import User
from .models import (
    RAGWorkflow, RAGSource, RAGChunk, RAGEmbedding, RAGProcessingStep,
    RAGWorkflowEvent, WorkflowStatus, SourceType, SourceStatus
)
from .services import RAGProcessingService, YouTubeTranscriptService
from .schemas import (
    RAGWorkflowCreate, RAGWorkflowResponse, RAGWorkflowUpdate,
    RAGSourceResponse, RAGProcessingStepResponse, RAGWorkflowEventResponse,
    RAGWorkflowExportRequest, RAGWorkflowStatsResponse
)

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/workflows", response_model=List[RAGWorkflowResponse])
async def get_workflows(
    status: Optional[WorkflowStatus] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all RAG workflows for the current user."""
    query = db.query(RAGWorkflow).filter(RAGWorkflow.user_id == current_user.id)
    
    if status:
        query = query.filter(RAGWorkflow.status == status)
    if type:
        query = query.filter(RAGWorkflow.type == type)
        
    workflows = query.offset(skip).limit(limit).all()
    return [RAGWorkflowResponse.from_orm(w) for w in workflows]


@router.get("/workflows/{workflow_id}", response_model=RAGWorkflowResponse)
async def get_workflow(
    workflow_id: str,
    include_sources: bool = False,
    include_steps: bool = False,
    include_events: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific workflow."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    response = RAGWorkflowResponse.from_orm(workflow)
    
    if include_sources:
        sources = db.query(RAGSource).filter(RAGSource.workflow_id == workflow_id).all()
        response.sources = [RAGSourceResponse.from_orm(s) for s in sources]
        
    if include_steps:
        steps = db.query(RAGProcessingStep).filter(
            RAGProcessingStep.workflow_id == workflow_id
        ).order_by(RAGProcessingStep.started_at).all()
        response.processing_steps = [RAGProcessingStepResponse.from_orm(s) for s in steps]
        
    if include_events:
        events = db.query(RAGWorkflowEvent).filter(
            RAGWorkflowEvent.workflow_id == workflow_id
        ).order_by(RAGWorkflowEvent.created_at.desc()).limit(100).all()
        response.events = [RAGWorkflowEventResponse.from_orm(e) for e in events]
        
    return response


@router.post("/workflows", response_model=RAGWorkflowResponse)
async def create_workflow(
    workflow_data: RAGWorkflowCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new RAG workflow."""
    # Determine workflow type based on sources
    sources = workflow_data.sources
    has_youtube = any("youtube" in s or "youtu.be" in s for s in sources)
    has_urls = any(s.startswith("http") and "youtube" not in s for s in sources)
    has_files = any(not s.startswith("http") for s in sources)
    
    if has_youtube and (has_urls or has_files):
        workflow_type = "mixed"
    elif has_youtube:
        workflow_type = "youtube"
    elif has_urls:
        workflow_type = "urls"
    else:
        workflow_type = "documents"
        
    # Create workflow
    workflow = RAGWorkflow(
        name=workflow_data.name,
        description=workflow_data.description,
        type=workflow_type,
        user_id=current_user.id,
        parameters={
            "chunkSize": workflow_data.chunk_size,
            "overlap": workflow_data.overlap,
            "embeddingModel": workflow_data.embedding_model,
            "vectorStore": workflow_data.vector_store,
        },
        stats={
            "totalContent": len(sources),
            "contentProcessed": 0,
            "embeddings": 0,
            "indexSize": "0 MB",
        },
        estimated_cost=workflow_data.estimated_cost or 0.0
    )
    db.add(workflow)
    db.commit()
    
    # Create source records
    for source in sources:
        source_type = _determine_source_type(source)
        source_record = RAGSource(
            workflow_id=workflow.id,
            source=source,
            source_type=source_type,
            metadata={}
        )
        db.add(source_record)
        
    db.commit()
    
    # Log creation event
    event = RAGWorkflowEvent(
        workflow_id=workflow.id,
        event_type="created",
        event_data={
            "user_id": current_user.id,
            "source_count": len(sources),
        }
    )
    db.add(event)
    db.commit()
    
    # Start processing if requested
    if workflow_data.auto_start:
        background_tasks.add_task(_start_workflow_processing, workflow.id, db)
        
    return RAGWorkflowResponse.from_orm(workflow)


@router.put("/workflows/{workflow_id}", response_model=RAGWorkflowResponse)
async def update_workflow(
    workflow_id: str,
    update_data: RAGWorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update workflow settings."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    # Don't allow updates while processing
    if workflow.status in [WorkflowStatus.SCRAPING, WorkflowStatus.EMBEDDING, 
                          WorkflowStatus.INDEXING, WorkflowStatus.VALIDATING]:
        raise HTTPException(
            status_code=400, 
            detail="Cannot update workflow while processing"
        )
        
    # Update fields
    if update_data.name is not None:
        workflow.name = update_data.name
    if update_data.description is not None:
        workflow.description = update_data.description
        
    # Update parameters
    if update_data.chunk_size is not None:
        workflow.parameters["chunkSize"] = update_data.chunk_size
    if update_data.overlap is not None:
        workflow.parameters["overlap"] = update_data.overlap
    if update_data.embedding_model is not None:
        workflow.parameters["embeddingModel"] = update_data.embedding_model
    if update_data.vector_store is not None:
        workflow.parameters["vectorStore"] = update_data.vector_store
        
    # Handle source updates
    if update_data.add_sources:
        for source in update_data.add_sources:
            source_type = _determine_source_type(source)
            source_record = RAGSource(
                workflow_id=workflow.id,
                source=source,
                source_type=source_type,
                metadata={}
            )
            db.add(source_record)
            
        # Update stats
        workflow.stats["totalContent"] = workflow.stats.get("totalContent", 0) + len(update_data.add_sources)
        
    if update_data.remove_sources:
        db.query(RAGSource).filter(
            and_(
                RAGSource.workflow_id == workflow_id,
                RAGSource.source.in_(update_data.remove_sources)
            )
        ).delete(synchronize_session=False)
        
        # Update stats
        workflow.stats["totalContent"] = max(0, workflow.stats.get("totalContent", 0) - len(update_data.remove_sources))
        
    workflow.updated_at = datetime.utcnow()
    db.commit()
    
    # Log update event
    event = RAGWorkflowEvent(
        workflow_id=workflow.id,
        event_type="updated",
        event_data={
            "user_id": current_user.id,
            "changes": update_data.dict(exclude_unset=True)
        }
    )
    db.add(event)
    db.commit()
    
    return RAGWorkflowResponse.from_orm(workflow)


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    hard_delete: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a workflow (soft delete by default)."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    # Don't allow deletion while processing
    if workflow.status in [WorkflowStatus.SCRAPING, WorkflowStatus.EMBEDDING, 
                          WorkflowStatus.INDEXING, WorkflowStatus.VALIDATING]:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete workflow while processing"
        )
        
    if hard_delete:
        # Permanently delete
        db.delete(workflow)
        event_type = "hard_deleted"
    else:
        # Soft delete (just mark as deleted)
        workflow.status = WorkflowStatus.CANCELLED
        workflow.updated_at = datetime.utcnow()
        event_type = "soft_deleted"
        
    # Log deletion event
    event = RAGWorkflowEvent(
        workflow_id=workflow.id,
        event_type=event_type,
        event_data={
            "user_id": current_user.id,
            "deleted_at": datetime.utcnow().isoformat()
        }
    )
    db.add(event)
    db.commit()
    
    return {"message": f"Workflow {event_type.replace('_', ' ')} successfully"}


@router.post("/workflows/{workflow_id}/start")
async def start_workflow(
    workflow_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start processing a workflow."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if workflow.status not in [WorkflowStatus.QUEUED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Workflow cannot be started from status: {workflow.status}"
        )
        
    # Start processing in background
    background_tasks.add_task(_start_workflow_processing, workflow_id, db)
    
    return {"message": "Workflow processing started"}


@router.post("/workflows/{workflow_id}/stop")
async def stop_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop processing a workflow."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if workflow.status not in [WorkflowStatus.SCRAPING, WorkflowStatus.EMBEDDING, 
                              WorkflowStatus.INDEXING, WorkflowStatus.VALIDATING]:
        raise HTTPException(
            status_code=400,
            detail=f"Workflow cannot be stopped from status: {workflow.status}"
        )
        
    # Update status
    workflow.status = WorkflowStatus.PAUSED
    workflow.updated_at = datetime.utcnow()
    
    # Log event
    event = RAGWorkflowEvent(
        workflow_id=workflow.id,
        event_type="stopped",
        event_data={
            "user_id": current_user.id,
            "previous_status": workflow.status,
            "progress": workflow.progress
        }
    )
    db.add(event)
    db.commit()
    
    return {"message": "Workflow processing stopped"}


@router.post("/workflows/{workflow_id}/restart")
async def restart_workflow(
    workflow_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restart a workflow from the beginning."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    # Reset workflow
    workflow.status = WorkflowStatus.QUEUED
    workflow.progress = 0.0
    workflow.started_at = None
    workflow.completed_at = None
    workflow.stats = {
        "totalContent": workflow.stats.get("totalContent", 0),
        "contentProcessed": 0,
        "embeddings": 0,
        "indexSize": "0 MB",
    }
    
    # Reset all sources
    db.query(RAGSource).filter(RAGSource.workflow_id == workflow_id).update({
        "status": SourceStatus.PENDING,
        "started_at": None,
        "completed_at": None,
        "error_message": None
    })
    
    # Delete existing embeddings and chunks
    embedding_ids = db.query(RAGEmbedding.id).filter(RAGEmbedding.workflow_id == workflow_id).subquery()
    db.query(RAGEmbedding).filter(RAGEmbedding.id.in_(embedding_ids)).delete(synchronize_session=False)
    
    chunk_ids = db.query(RAGChunk.id).join(RAGSource).filter(RAGSource.workflow_id == workflow_id).subquery()
    db.query(RAGChunk).filter(RAGChunk.id.in_(chunk_ids)).delete(synchronize_session=False)
    
    db.commit()
    
    # Log event
    event = RAGWorkflowEvent(
        workflow_id=workflow.id,
        event_type="restarted",
        event_data={
            "user_id": current_user.id,
            "restarted_at": datetime.utcnow().isoformat()
        }
    )
    db.add(event)
    db.commit()
    
    # Start processing
    background_tasks.add_task(_start_workflow_processing, workflow_id, db)
    
    return {"message": "Workflow restarted successfully"}


@router.post("/workflows/{workflow_id}/export")
async def export_workflow(
    workflow_id: str,
    export_request: RAGWorkflowExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export workflow embeddings or configuration."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if workflow.status != WorkflowStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Can only export completed workflows"
        )
        
    # TODO: Implement export functionality
    # This would generate the requested export format and return a download URL
    
    export_data = {
        "workflow_id": workflow_id,
        "format": export_request.format,
        "requested_at": datetime.utcnow().isoformat(),
        "download_url": f"/api/rag/exports/{workflow_id}/{export_request.format}"
    }
    
    return export_data


@router.get("/workflows/{workflow_id}/stats", response_model=RAGWorkflowStatsResponse)
async def get_workflow_stats(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed statistics for a workflow."""
    workflow = db.query(RAGWorkflow).filter(
        and_(
            RAGWorkflow.id == workflow_id,
            RAGWorkflow.user_id == current_user.id
        )
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    # Calculate detailed stats
    total_sources = db.query(RAGSource).filter(RAGSource.workflow_id == workflow_id).count()
    completed_sources = db.query(RAGSource).filter(
        and_(
            RAGSource.workflow_id == workflow_id,
            RAGSource.status == SourceStatus.COMPLETED
        )
    ).count()
    failed_sources = db.query(RAGSource).filter(
        and_(
            RAGSource.workflow_id == workflow_id,
            RAGSource.status == SourceStatus.FAILED
        )
    ).count()
    
    total_chunks = db.query(RAGChunk).join(RAGSource).filter(
        RAGSource.workflow_id == workflow_id
    ).count()
    
    total_embeddings = db.query(RAGEmbedding).filter(
        RAGEmbedding.workflow_id == workflow_id
    ).count()
    
    # Processing time
    processing_time = None
    if workflow.started_at:
        end_time = workflow.completed_at or datetime.utcnow()
        processing_time = (end_time - workflow.started_at).total_seconds()
        
    stats = {
        "workflow_id": workflow_id,
        "total_sources": total_sources,
        "completed_sources": completed_sources,
        "failed_sources": failed_sources,
        "total_chunks": total_chunks,
        "total_embeddings": total_embeddings,
        "processing_time_seconds": processing_time,
        "estimated_cost": workflow.estimated_cost,
        "actual_cost": workflow.actual_cost,
        "index_size": workflow.stats.get("indexSize", "0 MB"),
        "status": workflow.status,
        "progress": workflow.progress
    }
    
    return RAGWorkflowStatsResponse(**stats)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    workflow_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file for RAG processing."""
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt', '.csv', '.json']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
        
    # Create upload directory
    upload_dir = f"uploads/rag/{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # If workflow_id provided, add to workflow
    if workflow_id:
        workflow = db.query(RAGWorkflow).filter(
            and_(
                RAGWorkflow.id == workflow_id,
                RAGWorkflow.user_id == current_user.id
            )
        ).first()
        
        if workflow:
            source = RAGSource(
                workflow_id=workflow_id,
                source=file_path,
                source_type=SourceType.DOCUMENT,
                metadata={
                    "original_filename": file.filename,
                    "file_size": os.path.getsize(file_path),
                    "uploaded_at": datetime.utcnow().isoformat()
                }
            )
            db.add(source)
            db.commit()
            
    return {
        "file_id": file_id,
        "file_path": file_path,
        "filename": file.filename,
        "size": os.path.getsize(file_path)
    }


# Helper functions
def _determine_source_type(source: str) -> SourceType:
    """Determine the type of a source based on its format."""
    if "youtube.com" in source or "youtu.be" in source:
        if "/channel/" in source or "/c/" in source or "/@" in source:
            return SourceType.YOUTUBE_CHANNEL
        else:
            return SourceType.YOUTUBE_VIDEO
    elif source.startswith("http"):
        return SourceType.URL
    else:
        return SourceType.DOCUMENT


async def _start_workflow_processing(workflow_id: str, db: Session):
    """Start processing a workflow (background task)."""
    try:
        service = RAGProcessingService(db)
        await service.start_workflow(workflow_id)
    except Exception as e:
        # Log error
        event = RAGWorkflowEvent(
            workflow_id=workflow_id,
            event_type="processing_error",
            event_data={
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        db.add(event)
        db.commit()