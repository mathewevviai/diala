"""
Google Gemini Embeddings API Models
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class GeminiEmbeddingConfig(BaseModel):
    """Configuration for embedding request"""
    
    task_type: Optional[str] = Field(default="SEMANTIC_SIMILARITY", description="Task type for optimization")
    output_dimensionality: Optional[int] = Field(default=None, description="Truncate dimensions (MRL)")
    
class GeminiEmbeddingRequest(BaseModel):
    """Request model for Gemini Embeddings API"""
    
    model: str = Field(default="gemini-embedding-exp-03-07", description="Model name")
    content: Union[str, List[str]] = Field(..., description="Text to embed")
    config: Optional[GeminiEmbeddingConfig] = Field(default=None, description="Optional configuration")
    
    class Config:
        schema_extra = {
            "example": {
                "model": "gemini-embedding-exp-03-07",
                "content": "What is the meaning of life?",
                "config": {
                    "task_type": "SEMANTIC_SIMILARITY",
                    "output_dimensionality": 1536
                }
            }
        }

class GeminiEmbeddingData(BaseModel):
    """Individual embedding data"""
    
    values: List[float] = Field(..., description="Embedding vector")
    
class GeminiEmbeddingResponse(BaseModel):
    """Response model for Gemini Embeddings API"""
    
    embeddings: List[GeminiEmbeddingData] = Field(..., description="Embedding data")
    
    class Config:
        schema_extra = {
            "example": {
                "embeddings": [
                    {
                        "values": [0.1, 0.2, 0.3]
                    }
                ]
            }
        }

class GeminiModelInfo(BaseModel):
    """Model information and capabilities"""
    
    id: str = Field(..., description="Model ID")
    name: str = Field(..., description="Model display name")
    description: str = Field(..., description="Model description")
    dimensions: int = Field(..., description="Default embedding dimensions")
    max_dimensions: int = Field(..., description="Maximum dimensions available")
    alternative_dimensions: List[int] = Field(..., description="Available dimension options")
    max_tokens: int = Field(..., description="Maximum context length")
    mteb_score: float = Field(..., description="MTEB Multilingual score")
    margin_over_next: float = Field(..., description="Margin over next best model")
    multimodal: bool = Field(..., description="Supports multimodal inputs")
    multilingual: bool = Field(..., description="Supports multiple languages")
    supported_languages: int = Field(..., description="Number of supported languages")
    experimental: bool = Field(..., description="Is experimental model")
    has_mrl: bool = Field(..., description="Supports Matryoshka Representation Learning")
    supported_tasks: List[str] = Field(..., description="Supported task types")
    rate_limit_rpm: int = Field(..., description="Rate limit per minute")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "gemini-embedding-exp-03-07",
                "name": "Gemini Embedding Experimental",
                "description": "State-of-the-art experimental embedding model",
                "dimensions": 3072,
                "max_dimensions": 3072,
                "alternative_dimensions": [768, 1536, 3072],
                "max_tokens": 8192,
                "mteb_score": 68.32,
                "margin_over_next": 5.81,
                "multimodal": True,
                "multilingual": True,
                "supported_languages": 100,
                "experimental": True,
                "has_mrl": True,
                "supported_tasks": ["SEMANTIC_SIMILARITY", "CLASSIFICATION"],
                "rate_limit_rpm": 100
            }
        }