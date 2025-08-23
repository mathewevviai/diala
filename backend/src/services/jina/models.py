"""
Jina Embeddings v4 API Models - Optimized for Transcript-to-RAG Pipeline
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class JinaInputItem(BaseModel):
    """Individual input item for JINA V4 API"""
    text: str = Field(..., description="Text content to embed")

class JinaEmbeddingRequest(BaseModel):
    """Request model for Jina Embeddings v4 API - Transcript focused"""
    
    input: List[Union[str, JinaInputItem]] = Field(..., description="List of texts to embed")
    model: str = Field(default="jina-embeddings-v4", description="Model name")
    task: str = Field(default="retrieval.passage", description="Task type for transcript content")
    dimensions: Optional[int] = Field(default=1024, description="Embedding dimensions (128-2048)")
    late_chunking: Optional[bool] = Field(default=False, description="Enable late chunking for long transcripts")
    truncate_at_maximum_length: Optional[bool] = Field(default=True, description="Truncate instead of error")
    output_multi_vector_embeddings: Optional[bool] = Field(default=False, description="Multi-vector for late interaction")
    output_data_type: Optional[str] = Field(default="float", description="Output format: float, binary, base64")
    
    class Config:
        schema_extra = {
            "example": {
                "input": [
                    {"text": "Video transcript content here..."},
                    {"text": "Another video transcript..."}
                ],
                "model": "jina-embeddings-v4",
                "task": "retrieval.passage",
                "dimensions": 1024,
                "late_chunking": True,
                "truncate_at_maximum_length": True
            }
        }

class JinaEmbeddingData(BaseModel):
    """Individual embedding data from JINA V4"""
    
    object: str = Field(..., description="Object type (embedding)")
    embedding: List[float] = Field(..., description="Embedding vector")
    index: int = Field(..., description="Index in request")

class JinaEmbeddingUsage(BaseModel):
    """Token usage statistics from JINA V4"""
    
    total_tokens: int = Field(..., description="Total tokens processed")

class JinaEmbeddingResponse(BaseModel):
    """Response model for Jina Embeddings v4 API"""
    
    object: str = Field(..., description="Response object type (list)")
    data: List[JinaEmbeddingData] = Field(..., description="Embedding data")
    model: str = Field(..., description="Model used (jina-embeddings-v4)")
    usage: JinaEmbeddingUsage = Field(..., description="Token usage statistics")
    
    class Config:
        schema_extra = {
            "example": {
                "object": "list",
                "data": [
                    {
                        "object": "embedding",
                        "embedding": [0.1, 0.2, 0.3],
                        "index": 0
                    }
                ],
                "model": "jina-embeddings-v4",
                "usage": {
                    "total_tokens": 100
                }
            }
        }

class JinaModelInfo(BaseModel):
    """JINA v4 Model information and capabilities for transcript processing"""
    
    id: str = Field(..., description="Model ID")
    name: str = Field(..., description="Model display name")
    description: str = Field(..., description="Model description")
    dimensions: int = Field(..., description="Default embedding dimensions")
    max_tokens: int = Field(..., description="Maximum context length")
    parameters: str = Field(..., description="Model parameters (3.8B)")
    github_repo: str = Field(..., description="GitHub repository")
    github_stars: int = Field(..., description="GitHub stars")
    mteb_score: float = Field(..., description="MTEB average score")
    retrieval_score: float = Field(..., description="Retrieval task score")
    
    # V4 specific capabilities
    supports_late_chunking: bool = Field(default=True, description="Supports late chunking")
    supports_multi_vector: bool = Field(default=True, description="Supports multi-vector embeddings")
    dimension_range: List[int] = Field(default=[128, 2048], description="Supported dimension range")
    tasks: List[str] = Field(default=["retrieval.passage", "retrieval.query", "text-matching", "code.query", "code.passage"], description="Supported tasks")
    optimal_for_transcripts: bool = Field(default=True, description="Optimized for video transcript processing")
    multilingual: bool = Field(default=True, description="Supports 100+ languages")
    context_length: int = Field(default=32768, description="Maximum context length (32K tokens)")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "jina-embeddings-v4",
                "name": "Jina Embeddings v4",
                "description": "3.8B parameter universal embedding model optimized for transcript processing",
                "dimensions": 1024,
                "max_tokens": 32768,
                "parameters": "3.8B",
                "github_repo": "jina-ai/jina-embeddings-v4",
                "github_stars": 2847,
                "mteb_score": 64.41,
                "retrieval_score": 50.87,
                "supports_late_chunking": True,
                "optimal_for_transcripts": True
            }
        }

class TranscriptEmbeddingConfig(BaseModel):
    """Configuration for transcript-specific embedding with JINA V4"""
    
    task: str = Field(default="retrieval.passage", description="Task type for transcripts")
    dimensions: int = Field(default=1024, description="Embedding dimensions")
    late_chunking: bool = Field(default=True, description="Enable late chunking for long transcripts")
    chunk_size: Optional[int] = Field(default=None, description="Chunk size (auto if None)")
    chunk_overlap: Optional[int] = Field(default=None, description="Chunk overlap (auto if None)")
    multi_vector: bool = Field(default=False, description="Output multi-vector embeddings")
    optimize_for_rag: bool = Field(default=True, description="Optimize settings for RAG systems")
    
    class Config:
        schema_extra = {
            "example": {
                "task": "retrieval.passage",
                "dimensions": 1024,
                "late_chunking": True,
                "multi_vector": False,
                "optimize_for_rag": True
            }
        }