"""
Google Gemini Embeddings Configuration
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class GeminiConfig(BaseSettings):
    """Configuration for Google Gemini Embeddings API"""
    
    # API Configuration
    api_key: Optional[str] = os.getenv('GOOGLE_API_KEY')
    base_url: str = "https://generativelanguage.googleapis.com/v1"
    
    # Model Configuration - Latest experimental model only
    model_name: str = "gemini-embedding-exp-03-07"
    
    # Request Configuration
    max_tokens: int = 8192  # 8K token context length
    batch_size: int = 100
    timeout: int = 30
    
    # Model Specifications
    dimensions: int = 3072  # Default full dimensions
    alternative_dimensions: list = [768, 1536, 3072]  # MRL support
    context_length: int = 8192
    
    # Performance Metrics (SOTA)
    mteb_score: float = 68.32  # #1 on MTEB Multilingual leaderboard
    margin_over_next: float = 5.81  # Margin over next best model
    
    # Supported Languages
    supported_languages: int = 100  # 100+ languages
    
    # Task Types
    supported_tasks: list = [
        "SEMANTIC_SIMILARITY",
        "CLASSIFICATION", 
        "CLUSTERING",
        "RETRIEVAL_DOCUMENT",
        "RETRIEVAL_QUERY",
        "QUESTION_ANSWERING",
        "FACT_VERIFICATION",
        "CODE_RETRIEVAL_QUERY"
    ]
    
    # Rate Limits (experimental model has restrictions)
    rate_limit_rpm: int = 100  # More restricted for experimental
    
    class Config:
        env_prefix = "GEMINI_"
        case_sensitive = False