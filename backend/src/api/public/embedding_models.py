"""
Embedding Models API Endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import logging
from ...services.jina import JinaEmbeddingsService
from ...services.gemini import GeminiEmbeddingsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/embedding-models", tags=["embedding-models"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_embedding_models():
    """
    Get list of available embedding models with specifications
    
    Returns:
        List of embedding models with performance metrics
    """
    try:
        logger.info("Starting embedding models endpoint request")
        
        logger.info("Initializing JinaEmbeddingsService...")
        try:
            jina_service = JinaEmbeddingsService()
            logger.info("JinaEmbeddingsService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize JinaEmbeddingsService: {e}")
            raise
        
        logger.info("Initializing GeminiEmbeddingsService...")
        try:
            gemini_service = GeminiEmbeddingsService()
            logger.info("GeminiEmbeddingsService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize GeminiEmbeddingsService: {e}")
            raise
        
        # Get model info
        logger.info("Getting Jina model capabilities...")
        jina_info = await jina_service.get_model_capabilities()
        logger.info("Getting Jina performance metrics...")
        jina_metrics = jina_service.get_performance_metrics()
        logger.info("Getting Gemini model capabilities...")
        gemini_info = await gemini_service.get_model_capabilities()
        logger.info("Getting Gemini performance metrics...")
        gemini_metrics = gemini_service.get_performance_metrics()
        
        models = [
            {
                "id": "jina-v4",
                "label": "JINA EMBEDDER V4",
                "color": "bg-purple-600",
                "description": "Latest multimodal embedding model with 3.8B parameters. Supports 100+ languages, text, images, and code with superior MTEB performance.",
                "dimensions": jina_info.dimensions,
                "maxTokens": jina_info.max_tokens,
                "parameters": jina_info.parameters,
                "githubStars": jina_info.github_stars,
                "mtebScore": jina_metrics["benchmarks"]["mteb_average"],
                "multimodal": True,
                "multilingual": True,
                "supportedLanguages": jina_metrics["languages"]["supported"],
                "pricing": jina_service.get_pricing_info()
            },
            {
                "id": "gemini-embedding-exp",
                "label": "GEMINI EMBEDDING EXP",
                "color": "bg-blue-600",
                "description": "State-of-the-art experimental embedding model with SOTA MTEB performance. Features 8K context, MRL support, and 100+ languages.",
                "dimensions": gemini_info.dimensions,
                "maxTokens": gemini_info.max_tokens,
                "parameters": "Gemini-trained",
                "githubStars": None,
                "mtebScore": gemini_metrics["benchmarks"]["mteb_multilingual_score"],
                "experimental": True,
                "multimodal": gemini_info.multimodal,
                "multilingual": gemini_info.multilingual,
                "supportedLanguages": gemini_info.supported_languages,
                "hasMatryoshka": gemini_info.has_mrl,
                "alternativeDimensions": gemini_info.alternative_dimensions,
                "ranking": "#1 on MTEB Multilingual",
                "marginOverNext": gemini_info.margin_over_next,
                "pricing": gemini_service.get_pricing_info()
            }
        ]
        
        logger.info(f"Successfully built response with {len(models)} models")
        logger.info("Returning embedding models response")
        return models
        
    except Exception as e:
        logger.error(f"Error fetching embedding models: {e}")
        logger.exception("Full exception traceback:")
        raise HTTPException(status_code=500, detail="Failed to fetch embedding models")

@router.get("/{model_id}", response_model=Dict[str, Any])
async def get_embedding_model(model_id: str):
    """
    Get detailed information about a specific embedding model
    
    Args:
        model_id: ID of the embedding model
        
    Returns:
        Detailed model information
    """
    try:
        if model_id == "jina-v4":
            jina_service = JinaEmbeddingsService()
            model_info = await jina_service.get_model_capabilities()
            performance_metrics = jina_service.get_performance_metrics()
            pricing_info = jina_service.get_pricing_info()
            
            return {
                "id": model_info.id,
                "name": model_info.name,
                "description": model_info.description,
                "specifications": {
                    "dimensions": model_info.dimensions,
                    "max_tokens": model_info.max_tokens,
                    "parameters": model_info.parameters,
                    "context_length": performance_metrics["context_length"],
                    "multimodal": model_info.multimodal,
                    "multilingual": model_info.multilingual,
                    "supported_languages": model_info.languages
                },
                "performance": performance_metrics["benchmarks"],
                "github": {
                    "repo": model_info.github_repo,
                    "stars": model_info.github_stars
                },
                "pricing": pricing_info
            }
        elif model_id == "gemini-embedding-exp":
            gemini_service = GeminiEmbeddingsService()
            model_info = await gemini_service.get_model_capabilities()
            performance_metrics = gemini_service.get_performance_metrics()
            pricing_info = gemini_service.get_pricing_info()
            
            return {
                "id": model_info.id,
                "name": model_info.name,
                "description": model_info.description,
                "specifications": {
                    "dimensions": model_info.dimensions,
                    "max_dimensions": model_info.max_dimensions,
                    "alternative_dimensions": model_info.alternative_dimensions,
                    "max_tokens": model_info.max_tokens,
                    "experimental": model_info.experimental,
                    "has_mrl": model_info.has_mrl,
                    "multimodal": model_info.multimodal,
                    "multilingual": model_info.multilingual,
                    "supported_languages": model_info.supported_languages,
                    "supported_tasks": model_info.supported_tasks
                },
                "performance": performance_metrics["benchmarks"],
                "technical_features": performance_metrics["technical_features"],
                "pricing": pricing_info
            }
        else:
            raise HTTPException(status_code=404, detail="Model not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch model information")

@router.post("/test-connection/{model_id}")
async def test_model_connection(model_id: str):
    """
    Test connection to a specific embedding model
    
    Args:
        model_id: ID of the embedding model to test
        
    Returns:
        Connection test result
    """
    try:
        if model_id == "jina-v4":
            jina_service = JinaEmbeddingsService()
            is_healthy = await jina_service.test_connection()
            
            return {
                "model_id": model_id,
                "healthy": is_healthy,
                "status": "connected" if is_healthy else "connection_failed",
                "message": "Model is accessible" if is_healthy else "Failed to connect to model API"
            }
        elif model_id == "gemini-embedding-exp":
            gemini_service = GeminiEmbeddingsService()
            is_healthy = await gemini_service.test_connection()
            
            return {
                "model_id": model_id,
                "healthy": is_healthy,
                "status": "connected" if is_healthy else "connection_failed",
                "message": "Gemini experimental model is accessible" if is_healthy else "Failed to connect to Gemini API"
            }
        else:
            return {
                "model_id": model_id,
                "healthy": False,
                "status": "not_implemented",
                "message": "Connection test not implemented for this model"
            }
            
    except Exception as e:
        logger.error(f"Error testing connection to {model_id}: {e}")
        return {
            "model_id": model_id,
            "healthy": False,
            "status": "error",
            "message": f"Connection test failed: {str(e)}"
        }