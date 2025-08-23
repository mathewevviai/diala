"""
Database models for RAG workflows.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional, Dict, List
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, Text, Boolean, Integer, Float, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..core.database import Base


class WorkflowStatus(str, Enum):
    QUEUED = "queued"
    SCRAPING = "scraping"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class WorkflowType(str, Enum):
    YOUTUBE = "youtube"
    DOCUMENTS = "documents"
    URLS = "urls"
    MIXED = "mixed"
    EXTERNAL_SEARCH = "external_search"


class SourceType(str, Enum):
    YOUTUBE_VIDEO = "youtube_video"
    YOUTUBE_CHANNEL = "youtube_channel"
    DOCUMENT = "document"
    URL = "url"
    EXTERNAL_SEARCH = "external_search"


class SourceStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class VectorStore(str, Enum):
    PINECONE = "pinecone"
    CHROMA = "chroma"
    WEAVIATE = "weaviate"
    QDRANT = "qdrant"
    FAISS = "faiss"


class EmbeddingModel(str, Enum):
    ADA_002 = "text-embedding-ada-002"
    ADA_003 = "text-embedding-3-small"
    ADA_003_LARGE = "text-embedding-3-large"
    COHERE = "embed-english-v3.0"
    SENTENCE_TRANSFORMERS = "all-MiniLM-L6-v2"


class RAGWorkflow(Base):
    __tablename__ = "rag_workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default=WorkflowStatus.QUEUED)
    progress = Column(Float, default=0.0)
    type = Column(String(20), nullable=False)
    
    # Parameters
    parameters = Column(JSON, default=dict)  # chunkSize, overlap, embeddingModel, vectorStore
    
    # Statistics
    stats = Column(JSON, default=dict)  # totalContent, contentProcessed, embeddings, indexSize
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # User association
    user_id = Column(String(255), nullable=False)
    
    # Cost tracking
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    
    # Relations
    sources = relationship("RAGSource", back_populates="workflow", cascade="all, delete-orphan")
    embeddings = relationship("RAGEmbedding", back_populates="workflow", cascade="all, delete-orphan")
    processing_steps = relationship("RAGProcessingStep", back_populates="workflow", cascade="all, delete-orphan")
    events = relationship("RAGWorkflowEvent", back_populates="workflow", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "progress": self.progress,
            "type": self.type,
            "parameters": self.parameters,
            "stats": self.stats,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "estimated_cost": self.estimated_cost,
            "actual_cost": self.actual_cost,
            "user_id": self.user_id,
        }


class RAGSource(Base):
    __tablename__ = "rag_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("rag_workflows.id"), nullable=False)
    source = Column(Text, nullable=False)  # URL, file path, or YouTube URL
    source_type = Column(String(20), nullable=False)
    status = Column(String(20), default=SourceStatus.PENDING)
    
    # Metadata
    metadata = Column(JSON, default=dict)  # title, duration, file_size, etc.
    
    # Statistics
    stats = Column(JSON, default=dict)  # chunks, tokens, processing_time
    
    # Error tracking
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relations
    workflow = relationship("RAGWorkflow", back_populates="sources")
    chunks = relationship("RAGChunk", back_populates="source", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "workflow_id": str(self.workflow_id),
            "source": self.source,
            "source_type": self.source_type,
            "status": self.status,
            "metadata": self.metadata,
            "stats": self.stats,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class RAGChunk(Base):
    __tablename__ = "rag_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("rag_sources.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    
    # Metadata
    metadata = Column(JSON, default=dict)  # page_number, timestamp, speaker, etc.
    
    # Token count
    token_count = Column(Integer)
    
    # Relations
    source = relationship("RAGSource", back_populates="chunks")
    embeddings = relationship("RAGEmbedding", back_populates="chunk", cascade="all, delete-orphan")


class RAGEmbedding(Base):
    __tablename__ = "rag_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("rag_workflows.id"), nullable=False)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey("rag_chunks.id"), nullable=False)
    
    # Vector data (stored as binary for efficiency)
    vector = Column(LargeBinary, nullable=False)
    vector_dimension = Column(Integer, nullable=False)
    
    # Model used
    embedding_model = Column(String(50), nullable=False)
    
    # Metadata for retrieval
    metadata = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    workflow = relationship("RAGWorkflow", back_populates="embeddings")
    chunk = relationship("RAGChunk", back_populates="embeddings")


class RAGProcessingStep(Base):
    __tablename__ = "rag_processing_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("rag_workflows.id"), nullable=False)
    step_name = Column(String(50), nullable=False)  # scraping, chunking, embedding, indexing, validating
    status = Column(String(20), default="pending")
    progress = Column(Float, default=0.0)
    
    # Timing
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_seconds = Column(Float)
    
    # Error tracking
    error_message = Column(Text)
    
    # Relations
    workflow = relationship("RAGWorkflow", back_populates="processing_steps")


class RAGWorkflowEvent(Base):
    __tablename__ = "rag_workflow_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("rag_workflows.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # created, started, progress, completed, failed, etc.
    event_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    workflow = relationship("RAGWorkflow", back_populates="events")


class RAGWorkflowExport(Base):
    __tablename__ = "rag_workflow_exports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("rag_workflows.id"), nullable=False)
    export_type = Column(String(20), nullable=False)  # json, vectors, faiss, etc.
    file_path = Column(Text)
    file_size = Column(Integer)
    download_url = Column(Text)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String(255), nullable=False)