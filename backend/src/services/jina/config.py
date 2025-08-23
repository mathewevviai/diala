"""
Jina Embeddings v4 Configuration - Optimized for Transcript Processing
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings

class JinaConfig(BaseSettings):
    """Configuration for Jina Embeddings v4 API - Transcript-to-RAG focused"""
    
    # API Configuration
    api_key: Optional[str] = os.getenv('JINA_API_KEY')
    base_url: str = "https://api.jina.ai/v1"
    
    # Model Configuration
    model_name: str = "jina-embeddings-v4"
    task: str = "retrieval.passage"  # Optimal for transcript content
    
    # V4 Specific Features
    late_chunking: bool = True  # Enable for long transcripts
    truncate_at_maximum_length: bool = True  # Safer for production
    output_multi_vector_embeddings: bool = False  # Single vector by default
    output_data_type: str = "float"  # float, binary, base64
    
    # Request Configuration
    max_tokens: int = 32768  # V4 supports up to 32K tokens
    batch_size: int = 50  # Smaller batches for larger context
    timeout: int = 60  # Longer timeout for large transcripts
    
    # Model Specifications  
    dimensions: int = 1024  # Default dimension (128-2048 supported)
    parameters: str = "3.8B"
    context_length: int = 32768  # Full V4 context length
    
    # Transcript Processing Optimization
    optimize_for_transcripts: bool = True
    auto_chunk_long_transcripts: bool = True
    chunk_size: Optional[int] = None  # Auto-determined based on content
    chunk_overlap: Optional[int] = None  # Auto-determined
    
    # Supported Tasks for V4
    supported_tasks: List[str] = [
        "retrieval.passage",  # For transcript content
        "retrieval.query",    # For search queries  
        "text-matching",      # For similarity tasks
        "code.query",         # For code search
        "code.passage"        # For code snippets
    ]
    
    # Supported Dimensions (Matryoshka)
    supported_dimensions: List[int] = [128, 256, 512, 1024, 2048]
    
    # GitHub Repository Info
    github_repo: str = "jina-ai/jina-embeddings-v4"
    github_stars: int = 2847
    
    # Performance Metrics (Updated for V4)
    mteb_avg_score: float = 64.41
    retrieval_score: float = 50.87
    clustering_score: float = 49.62
    classification_score: float = 75.45
    multilingual_score: float = 66.49  # Outperforms OpenAI by 12%
    long_document_score: float = 67.11  # 28% better than competitors
    code_retrieval_score: float = 71.59  # 15% better than Voyage-3
    
    class Config:
        env_prefix = "JINA_"
        case_sensitive = False