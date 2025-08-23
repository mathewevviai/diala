"""
RAG (Retrieval-Augmented Generation) module for processing and embedding content.
"""

from .models import *
from .services import *
from .external_search_service import ExternalSearchService, search_external
from .api import router as rag_router

__all__ = ["rag_router", "ExternalSearchService", "search_external"]