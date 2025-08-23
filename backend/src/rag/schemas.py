"""
Pydantic schemas for RAG API endpoints.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID

from .models import WorkflowStatus, WorkflowType, SourceType, SourceStatus, VectorStore, EmbeddingModel


class RAGWorkflowBase(BaseModel):
    """Base schema for RAG workflows."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    

class RAGWorkflowCreate(RAGWorkflowBase):
    """Schema for creating a new RAG workflow."""
    sources: List[str] = Field(..., min_items=1)
    chunk_size: int = Field(default=512, ge=100, le=2000)
    overlap: int = Field(default=50, ge=0, le=500)
    embedding_model: str = Field(default=EmbeddingModel.ADA_002)
    vector_store: str = Field(default=VectorStore.PINECONE)
    auto_start: bool = Field(default=False)
    estimated_cost: Optional[float] = None
    
    @validator('sources')
    def validate_sources(cls, v):
        """Validate that sources are not empty."""
        if not v:
            raise ValueError("At least one source is required")
        for source in v:
            if not source.strip():
                raise ValueError("Source cannot be empty")
        return v
        
    @validator('overlap')
    def validate_overlap(cls, v, values):
        """Validate that overlap is less than chunk size."""
        chunk_size = values.get('chunk_size', 512)
        if v >= chunk_size:
            raise ValueError("Overlap must be less than chunk size")
        return v


class RAGWorkflowUpdate(BaseModel):
    """Schema for updating a RAG workflow."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    chunk_size: Optional[int] = Field(None, ge=100, le=2000)
    overlap: Optional[int] = Field(None, ge=0, le=500)
    embedding_model: Optional[str] = None
    vector_store: Optional[str] = None
    add_sources: Optional[List[str]] = None
    remove_sources: Optional[List[str]] = None
    
    @validator('overlap')
    def validate_overlap(cls, v, values):
        """Validate that overlap is less than chunk size."""
        if v is not None and values.get('chunk_size'):
            if v >= values['chunk_size']:
                raise ValueError("Overlap must be less than chunk size")
        return v


class RAGSourceBase(BaseModel):
    """Base schema for RAG sources."""
    source: str
    source_type: SourceType
    status: SourceStatus
    metadata: Dict[str, Any]
    

class RAGSourceResponse(RAGSourceBase):
    """Response schema for RAG sources."""
    id: UUID
    workflow_id: UUID
    stats: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class RAGProcessingStepResponse(BaseModel):
    """Response schema for processing steps."""
    id: UUID
    workflow_id: UUID
    step_name: str
    status: str
    progress: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    
    class Config:
        orm_mode = True


class RAGWorkflowEventResponse(BaseModel):
    """Response schema for workflow events."""
    id: UUID
    workflow_id: UUID
    event_type: str
    event_data: Dict[str, Any]
    created_at: datetime
    
    class Config:
        orm_mode = True


class RAGWorkflowResponse(RAGWorkflowBase):
    """Response schema for RAG workflows."""
    id: UUID
    status: WorkflowStatus
    progress: float
    type: WorkflowType
    parameters: Dict[str, Any]
    stats: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: float
    actual_cost: float
    user_id: str
    
    # Optional nested data
    sources: Optional[List[RAGSourceResponse]] = None
    processing_steps: Optional[List[RAGProcessingStepResponse]] = None
    events: Optional[List[RAGWorkflowEventResponse]] = None
    
    class Config:
        orm_mode = True


class RAGWorkflowExportRequest(BaseModel):
    """Request schema for exporting workflow data."""
    format: str = Field(..., regex="^(json|vectors|faiss|onnx)$")
    include_metadata: bool = Field(default=True)
    compression: Optional[str] = Field(None, regex="^(zip|gzip|none)$")


class RAGWorkflowStatsResponse(BaseModel):
    """Response schema for workflow statistics."""
    workflow_id: UUID
    total_sources: int
    completed_sources: int
    failed_sources: int
    total_chunks: int
    total_embeddings: int
    processing_time_seconds: Optional[float] = None
    estimated_cost: float
    actual_cost: float
    index_size: str
    status: WorkflowStatus
    progress: float


class RAGChunkResponse(BaseModel):
    """Response schema for RAG chunks."""
    id: UUID
    source_id: UUID
    chunk_index: int
    content: str
    metadata: Dict[str, Any]
    token_count: Optional[int] = None
    
    class Config:
        orm_mode = True


class RAGEmbeddingResponse(BaseModel):
    """Response schema for RAG embeddings."""
    id: UUID
    workflow_id: UUID
    chunk_id: UUID
    vector_dimension: int
    embedding_model: str
    metadata: Dict[str, Any]
    created_at: datetime
    
    class Config:
        orm_mode = True


class RAGSearchRequest(BaseModel):
    """Request schema for searching RAG embeddings."""
    query: str = Field(..., min_length=1)
    workflow_ids: Optional[List[UUID]] = None
    top_k: int = Field(default=10, ge=1, le=100)
    threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    include_metadata: bool = Field(default=True)


class RAGSearchResult(BaseModel):
    """Result schema for RAG search."""
    chunk_id: UUID
    workflow_id: UUID
    content: str
    score: float
    metadata: Optional[Dict[str, Any]] = None
    source_info: Optional[Dict[str, Any]] = None