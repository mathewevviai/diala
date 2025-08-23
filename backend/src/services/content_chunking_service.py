"""
Content Chunking Service

Provides text segmentation and chunking capabilities for preparing content 
for vector database storage and retrieval. Supports configurable chunk sizes,
overlap settings, metadata preservation, and boundary detection.
"""

import os
import uuid
import logging
import re
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import tiktoken
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)


class ChunkBoundary(Enum):
    """Chunking boundary types"""
    SENTENCE = "sentence"
    PARAGRAPH = "paragraph"
    WORD = "word"
    TOKEN = "token"


class ChunkQuality(Enum):
    """Chunk quality indicators"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


@dataclass
class ChunkingConfig:
    """Configuration for content chunking"""
    chunk_size: int = 1024  # Target chunk size in tokens
    overlap: int = 200  # Overlap between chunks in tokens
    min_chunk_size: int = 100  # Minimum chunk size in tokens
    max_chunk_size: int = 4096  # Maximum chunk size in tokens
    boundary_type: ChunkBoundary = ChunkBoundary.SENTENCE
    preserve_metadata: bool = True
    sentence_aware: bool = True
    paragraph_aware: bool = True
    remove_empty_chunks: bool = True
    quality_threshold: ChunkQuality = ChunkQuality.FAIR
    encoding_model: str = "cl100k_base"  # GPT-3.5/GPT-4 tokenizer


@dataclass
class ChunkMetadata:
    """Metadata for a content chunk"""
    chunk_id: str
    source_id: str
    chunk_index: int
    total_chunks: int
    start_position: int
    end_position: int
    token_count: int
    word_count: int
    sentence_count: int
    paragraph_count: int
    quality_score: float
    quality_level: ChunkQuality
    boundary_type: ChunkBoundary
    overlap_with_previous: int
    overlap_with_next: int
    created_at: datetime
    source_metadata: Dict[str, Any]


@dataclass
class ContentChunk:
    """A chunk of content with metadata"""
    text: str
    metadata: ChunkMetadata
    relationships: Dict[str, str]  # Links to related chunks
    embeddings: Optional[List[float]] = None


@dataclass
class ChunkingResult:
    """Result of content chunking operation"""
    chunks: List[ContentChunk]
    total_chunks: int
    total_tokens: int
    avg_chunk_size: float
    quality_distribution: Dict[ChunkQuality, int]
    processing_time: float
    config: ChunkingConfig


class ContentChunkingService:
    """Service for chunking text content for vector database storage"""
    
    def __init__(self, config: Optional[ChunkingConfig] = None):
        """Initialize the content chunking service"""
        self.config = config or ChunkingConfig()
        self.encoder = tiktoken.get_encoding(self.config.encoding_model)
        
        # Initialize NLTK if not already done
        self._ensure_nltk_data()
        
        logger.info(f"Content Chunking Service initialized with config: {self.config}")
    
    def _ensure_nltk_data(self):
        """Ensure required NLTK data is downloaded"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            logger.info("Downloading NLTK punkt tokenizer...")
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            logger.info("Downloading NLTK stopwords...")
            nltk.download('stopwords', quiet=True)
    
    def chunk_transcript(
        self,
        transcript: str,
        source_metadata: Dict[str, Any],
        config: Optional[ChunkingConfig] = None
    ) -> ChunkingResult:
        """
        Chunk a transcript with speaker-aware segmentation
        
        Args:
            transcript: The transcript text to chunk
            source_metadata: Metadata about the source content
            config: Optional chunking configuration
            
        Returns:
            ChunkingResult with chunked content and metadata
        """
        start_time = datetime.now()
        config = config or self.config
        
        try:
            # Preprocess transcript to handle speaker labels
            processed_text = self._preprocess_transcript(transcript)
            
            # Perform chunking
            chunks = self._chunk_text(processed_text, source_metadata, config)
            
            # Calculate result metrics
            total_tokens = sum(chunk.metadata.token_count for chunk in chunks)
            avg_chunk_size = total_tokens / len(chunks) if chunks else 0
            
            # Quality distribution
            quality_dist = {quality: 0 for quality in ChunkQuality}
            for chunk in chunks:
                quality_dist[chunk.metadata.quality_level] += 1
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ChunkingResult(
                chunks=chunks,
                total_chunks=len(chunks),
                total_tokens=total_tokens,
                avg_chunk_size=avg_chunk_size,
                quality_distribution=quality_dist,
                processing_time=processing_time,
                config=config
            )
            
        except Exception as e:
            logger.error(f"Error chunking transcript: {str(e)}")
            raise
    
    def chunk_with_overlap(
        self,
        text: str,
        source_metadata: Dict[str, Any],
        chunk_size: int,
        overlap: int,
        config: Optional[ChunkingConfig] = None
    ) -> ChunkingResult:
        """
        Chunk text with configurable overlap
        
        Args:
            text: Text to chunk
            source_metadata: Source metadata
            chunk_size: Target chunk size in tokens
            overlap: Overlap between chunks in tokens
            config: Optional chunking configuration
            
        Returns:
            ChunkingResult with chunked content
        """
        start_time = datetime.now()
        config = config or self.config
        
        # Override config with provided parameters
        config.chunk_size = chunk_size
        config.overlap = overlap
        
        try:
            chunks = self._chunk_text(text, source_metadata, config)
            
            # Calculate metrics
            total_tokens = sum(chunk.metadata.token_count for chunk in chunks)
            avg_chunk_size = total_tokens / len(chunks) if chunks else 0
            
            quality_dist = {quality: 0 for quality in ChunkQuality}
            for chunk in chunks:
                quality_dist[chunk.metadata.quality_level] += 1
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ChunkingResult(
                chunks=chunks,
                total_chunks=len(chunks),
                total_tokens=total_tokens,
                avg_chunk_size=avg_chunk_size,
                quality_distribution=quality_dist,
                processing_time=processing_time,
                config=config
            )
            
        except Exception as e:
            logger.error(f"Error chunking with overlap: {str(e)}")
            raise
    
    def preserve_metadata(
        self,
        chunks: List[ContentChunk],
        additional_metadata: Dict[str, Any]
    ) -> List[ContentChunk]:
        """
        Preserve and enhance metadata for chunks
        
        Args:
            chunks: List of content chunks
            additional_metadata: Additional metadata to preserve
            
        Returns:
            Updated chunks with preserved metadata
        """
        try:
            for chunk in chunks:
                # Merge additional metadata
                chunk.metadata.source_metadata.update(additional_metadata)
                
                # Add preservation timestamp
                chunk.metadata.source_metadata['metadata_preserved_at'] = datetime.now().isoformat()
                
                # Add chunk-specific metadata
                chunk.metadata.source_metadata['chunk_version'] = '1.0'
                chunk.metadata.source_metadata['chunking_service'] = 'ContentChunkingService'
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error preserving metadata: {str(e)}")
            raise
    
    def create_chunk_index(
        self,
        chunks: List[ContentChunk],
        index_type: str = "sequential"
    ) -> Dict[str, Any]:
        """
        Create indexing information for chunks
        
        Args:
            chunks: List of content chunks
            index_type: Type of index to create
            
        Returns:
            Dictionary containing indexing information
        """
        try:
            index = {
                "index_type": index_type,
                "created_at": datetime.now().isoformat(),
                "total_chunks": len(chunks),
                "index_version": "1.0"
            }
            
            if index_type == "sequential":
                index["chunk_map"] = {
                    chunk.metadata.chunk_id: {
                        "index": chunk.metadata.chunk_index,
                        "start_position": chunk.metadata.start_position,
                        "end_position": chunk.metadata.end_position,
                        "token_count": chunk.metadata.token_count,
                        "quality": chunk.metadata.quality_level.value
                    }
                    for chunk in chunks
                }
            
            elif index_type == "hierarchical":
                # Group chunks by quality and size
                index["quality_groups"] = {}
                for quality in ChunkQuality:
                    quality_chunks = [c for c in chunks if c.metadata.quality_level == quality]
                    if quality_chunks:
                        index["quality_groups"][quality.value] = {
                            "count": len(quality_chunks),
                            "avg_size": sum(c.metadata.token_count for c in quality_chunks) / len(quality_chunks),
                            "chunk_ids": [c.metadata.chunk_id for c in quality_chunks]
                        }
            
            elif index_type == "similarity":
                # Create similarity-based relationships
                index["relationships"] = {}
                for chunk in chunks:
                    relationships = []
                    
                    # Add previous and next chunks
                    if chunk.metadata.chunk_index > 0:
                        prev_chunk = chunks[chunk.metadata.chunk_index - 1]
                        relationships.append({
                            "type": "previous",
                            "chunk_id": prev_chunk.metadata.chunk_id,
                            "overlap": chunk.metadata.overlap_with_previous
                        })
                    
                    if chunk.metadata.chunk_index < len(chunks) - 1:
                        next_chunk = chunks[chunk.metadata.chunk_index + 1]
                        relationships.append({
                            "type": "next",
                            "chunk_id": next_chunk.metadata.chunk_id,
                            "overlap": chunk.metadata.overlap_with_next
                        })
                    
                    index["relationships"][chunk.metadata.chunk_id] = relationships
            
            return index
            
        except Exception as e:
            logger.error(f"Error creating chunk index: {str(e)}")
            raise
    
    def structure_for_export(
        self,
        chunks: List[ContentChunk],
        export_format: str = "vector_db"
    ) -> Dict[str, Any]:
        """
        Structure chunks for vector database export
        
        Args:
            chunks: List of content chunks
            export_format: Format for export (vector_db, json, etc.)
            
        Returns:
            Structured data ready for export
        """
        try:
            if export_format == "vector_db":
                return {
                    "documents": [
                        {
                            "id": chunk.metadata.chunk_id,
                            "text": chunk.text,
                            "metadata": {
                                "source_id": chunk.metadata.source_id,
                                "chunk_index": chunk.metadata.chunk_index,
                                "token_count": chunk.metadata.token_count,
                                "quality_score": chunk.metadata.quality_score,
                                "quality_level": chunk.metadata.quality_level.value,
                                "created_at": chunk.metadata.created_at.isoformat(),
                                **chunk.metadata.source_metadata
                            },
                            "embeddings": chunk.embeddings
                        }
                        for chunk in chunks
                    ],
                    "export_metadata": {
                        "total_documents": len(chunks),
                        "export_format": export_format,
                        "exported_at": datetime.now().isoformat(),
                        "service_version": "1.0"
                    }
                }
            
            elif export_format == "json":
                return {
                    "chunks": [
                        {
                            "chunk_id": chunk.metadata.chunk_id,
                            "text": chunk.text,
                            "metadata": {
                                "source_id": chunk.metadata.source_id,
                                "chunk_index": chunk.metadata.chunk_index,
                                "total_chunks": chunk.metadata.total_chunks,
                                "positions": {
                                    "start": chunk.metadata.start_position,
                                    "end": chunk.metadata.end_position
                                },
                                "counts": {
                                    "tokens": chunk.metadata.token_count,
                                    "words": chunk.metadata.word_count,
                                    "sentences": chunk.metadata.sentence_count,
                                    "paragraphs": chunk.metadata.paragraph_count
                                },
                                "quality": {
                                    "score": chunk.metadata.quality_score,
                                    "level": chunk.metadata.quality_level.value
                                },
                                "overlap": {
                                    "previous": chunk.metadata.overlap_with_previous,
                                    "next": chunk.metadata.overlap_with_next
                                },
                                "created_at": chunk.metadata.created_at.isoformat(),
                                "source_metadata": chunk.metadata.source_metadata
                            },
                            "relationships": chunk.relationships,
                            "embeddings": chunk.embeddings
                        }
                        for chunk in chunks
                    ]
                }
            
            else:
                raise ValueError(f"Unsupported export format: {export_format}")
            
        except Exception as e:
            logger.error(f"Error structuring for export: {str(e)}")
            raise
    
    def validate_chunk_quality(
        self,
        chunks: List[ContentChunk],
        min_quality: ChunkQuality = ChunkQuality.FAIR
    ) -> Dict[str, Any]:
        """
        Validate chunk quality and provide recommendations
        
        Args:
            chunks: List of content chunks to validate
            min_quality: Minimum acceptable quality level
            
        Returns:
            Validation results and recommendations
        """
        try:
            validation_results = {
                "total_chunks": len(chunks),
                "quality_distribution": {quality.value: 0 for quality in ChunkQuality},
                "passed_validation": 0,
                "failed_validation": 0,
                "recommendations": [],
                "detailed_results": []
            }
            
            for chunk in chunks:
                quality = chunk.metadata.quality_level
                validation_results["quality_distribution"][quality.value] += 1
                
                # Check if chunk meets minimum quality
                quality_levels = [ChunkQuality.POOR, ChunkQuality.FAIR, ChunkQuality.GOOD, ChunkQuality.EXCELLENT]
                meets_threshold = quality_levels.index(quality) >= quality_levels.index(min_quality)
                
                if meets_threshold:
                    validation_results["passed_validation"] += 1
                else:
                    validation_results["failed_validation"] += 1
                
                # Detailed validation for each chunk
                chunk_validation = {
                    "chunk_id": chunk.metadata.chunk_id,
                    "quality_level": quality.value,
                    "quality_score": chunk.metadata.quality_score,
                    "meets_threshold": meets_threshold,
                    "issues": []
                }
                
                # Check for specific issues
                if chunk.metadata.token_count < self.config.min_chunk_size:
                    chunk_validation["issues"].append("Below minimum size")
                
                if chunk.metadata.token_count > self.config.max_chunk_size:
                    chunk_validation["issues"].append("Above maximum size")
                
                if chunk.metadata.sentence_count == 0:
                    chunk_validation["issues"].append("No complete sentences")
                
                if len(chunk.text.strip()) == 0:
                    chunk_validation["issues"].append("Empty or whitespace-only content")
                
                validation_results["detailed_results"].append(chunk_validation)
            
            # Generate recommendations
            if validation_results["failed_validation"] > 0:
                validation_results["recommendations"].append(
                    f"Consider adjusting chunk size or overlap settings. "
                    f"{validation_results['failed_validation']} chunks failed validation."
                )
            
            if validation_results["quality_distribution"]["poor"] > len(chunks) * 0.3:
                validation_results["recommendations"].append(
                    "High percentage of poor quality chunks. Consider preprocessing the source text."
                )
            
            return validation_results
            
        except Exception as e:
            logger.error(f"Error validating chunk quality: {str(e)}")
            raise
    
    def _preprocess_transcript(self, transcript: str) -> str:
        """Preprocess transcript to handle speaker labels and formatting"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', transcript.strip())
        
        # Handle speaker labels (e.g., "SPEAKER_01: Hello there")
        # Keep speaker labels as they provide context
        text = re.sub(r'SPEAKER_(\d+):\s*', r'Speaker \1: ', text)
        
        # Handle timestamps if present
        text = re.sub(r'\[\d{2}:\d{2}:\d{2}\]', '', text)
        
        # Clean up punctuation
        text = re.sub(r'\.{2,}', '.', text)
        text = re.sub(r'\,{2,}', ',', text)
        
        return text
    
    def _chunk_text(
        self,
        text: str,
        source_metadata: Dict[str, Any],
        config: ChunkingConfig
    ) -> List[ContentChunk]:
        """Main text chunking logic"""
        chunks = []
        
        if config.boundary_type == ChunkBoundary.SENTENCE:
            chunks = self._chunk_by_sentences(text, source_metadata, config)
        elif config.boundary_type == ChunkBoundary.PARAGRAPH:
            chunks = self._chunk_by_paragraphs(text, source_metadata, config)
        elif config.boundary_type == ChunkBoundary.WORD:
            chunks = self._chunk_by_words(text, source_metadata, config)
        else:  # TOKEN
            chunks = self._chunk_by_tokens(text, source_metadata, config)
        
        # Remove empty chunks if configured
        if config.remove_empty_chunks:
            chunks = [chunk for chunk in chunks if chunk.text.strip()]
        
        # Update relationships between chunks
        self._update_chunk_relationships(chunks)
        
        return chunks
    
    def _chunk_by_sentences(
        self,
        text: str,
        source_metadata: Dict[str, Any],
        config: ChunkingConfig
    ) -> List[ContentChunk]:
        """Chunk text by sentences while respecting token limits"""
        sentences = sent_tokenize(text)
        chunks = []
        current_chunk = []
        current_tokens = 0
        start_pos = 0
        
        source_id = source_metadata.get('source_id', str(uuid.uuid4()))
        
        for sentence in sentences:
            sentence_tokens = len(self.encoder.encode(sentence))
            
            # If adding this sentence would exceed the limit, finalize current chunk
            if current_tokens + sentence_tokens > config.chunk_size and current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunk = self._create_chunk(
                    chunk_text, len(chunks), source_id, source_metadata, config, start_pos
                )
                chunks.append(chunk)
                
                # Handle overlap
                if config.overlap > 0:
                    overlap_text = self._get_overlap_text(chunk_text, config.overlap)
                    current_chunk = [overlap_text] if overlap_text else []
                    current_tokens = len(self.encoder.encode(overlap_text)) if overlap_text else 0
                else:
                    current_chunk = []
                    current_tokens = 0
                
                start_pos = len(text) - len(' '.join(sentences[sentences.index(sentence):]))
            
            current_chunk.append(sentence)
            current_tokens += sentence_tokens
        
        # Handle remaining chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunk = self._create_chunk(
                chunk_text, len(chunks), source_id, source_metadata, config, start_pos
            )
            chunks.append(chunk)
        
        return chunks
    
    def _chunk_by_paragraphs(
        self,
        text: str,
        source_metadata: Dict[str, Any],
        config: ChunkingConfig
    ) -> List[ContentChunk]:
        """Chunk text by paragraphs while respecting token limits"""
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = []
        current_tokens = 0
        start_pos = 0
        
        source_id = source_metadata.get('source_id', str(uuid.uuid4()))
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
                
            paragraph_tokens = len(self.encoder.encode(paragraph))
            
            # If adding this paragraph would exceed the limit, finalize current chunk
            if current_tokens + paragraph_tokens > config.chunk_size and current_chunk:
                chunk_text = '\n\n'.join(current_chunk)
                chunk = self._create_chunk(
                    chunk_text, len(chunks), source_id, source_metadata, config, start_pos
                )
                chunks.append(chunk)
                
                # Handle overlap
                if config.overlap > 0:
                    overlap_text = self._get_overlap_text(chunk_text, config.overlap)
                    current_chunk = [overlap_text] if overlap_text else []
                    current_tokens = len(self.encoder.encode(overlap_text)) if overlap_text else 0
                else:
                    current_chunk = []
                    current_tokens = 0
                
                start_pos = text.find(paragraph)
            
            current_chunk.append(paragraph)
            current_tokens += paragraph_tokens
        
        # Handle remaining chunk
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            chunk = self._create_chunk(
                chunk_text, len(chunks), source_id, source_metadata, config, start_pos
            )
            chunks.append(chunk)
        
        return chunks
    
    def _chunk_by_words(
        self,
        text: str,
        source_metadata: Dict[str, Any],
        config: ChunkingConfig
    ) -> List[ContentChunk]:
        """Chunk text by words while respecting token limits"""
        words = word_tokenize(text)
        chunks = []
        current_chunk = []
        current_tokens = 0
        start_pos = 0
        
        source_id = source_metadata.get('source_id', str(uuid.uuid4()))
        
        for word in words:
            word_tokens = len(self.encoder.encode(word))
            
            # If adding this word would exceed the limit, finalize current chunk
            if current_tokens + word_tokens > config.chunk_size and current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunk = self._create_chunk(
                    chunk_text, len(chunks), source_id, source_metadata, config, start_pos
                )
                chunks.append(chunk)
                
                # Handle overlap
                if config.overlap > 0:
                    overlap_words = current_chunk[-config.overlap:] if len(current_chunk) > config.overlap else current_chunk
                    current_chunk = overlap_words
                    current_tokens = len(self.encoder.encode(' '.join(overlap_words)))
                else:
                    current_chunk = []
                    current_tokens = 0
                
                start_pos = text.find(word)
            
            current_chunk.append(word)
            current_tokens += word_tokens
        
        # Handle remaining chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunk = self._create_chunk(
                chunk_text, len(chunks), source_id, source_metadata, config, start_pos
            )
            chunks.append(chunk)
        
        return chunks
    
    def _chunk_by_tokens(
        self,
        text: str,
        source_metadata: Dict[str, Any],
        config: ChunkingConfig
    ) -> List[ContentChunk]:
        """Chunk text by tokens with exact token limits"""
        tokens = self.encoder.encode(text)
        chunks = []
        start_pos = 0
        
        source_id = source_metadata.get('source_id', str(uuid.uuid4()))
        
        i = 0
        while i < len(tokens):
            end_pos = min(i + config.chunk_size, len(tokens))
            chunk_tokens = tokens[i:end_pos]
            chunk_text = self.encoder.decode(chunk_tokens)
            
            chunk = self._create_chunk(
                chunk_text, len(chunks), source_id, source_metadata, config, start_pos
            )
            chunks.append(chunk)
            
            # Move to next chunk with overlap
            i = end_pos - config.overlap if config.overlap > 0 else end_pos
            start_pos += len(chunk_text)
        
        return chunks
    
    def _create_chunk(
        self,
        text: str,
        index: int,
        source_id: str,
        source_metadata: Dict[str, Any],
        config: ChunkingConfig,
        start_pos: int
    ) -> ContentChunk:
        """Create a ContentChunk with metadata"""
        chunk_id = str(uuid.uuid4())
        
        # Calculate metrics
        token_count = len(self.encoder.encode(text))
        word_count = len(word_tokenize(text))
        sentence_count = len(sent_tokenize(text))
        paragraph_count = len([p for p in text.split('\n\n') if p.strip()])
        
        # Calculate quality score
        quality_score = self._calculate_quality_score(
            text, token_count, word_count, sentence_count, paragraph_count
        )
        quality_level = self._determine_quality_level(quality_score)
        
        # Create metadata
        metadata = ChunkMetadata(
            chunk_id=chunk_id,
            source_id=source_id,
            chunk_index=index,
            total_chunks=0,  # Will be updated later
            start_position=start_pos,
            end_position=start_pos + len(text),
            token_count=token_count,
            word_count=word_count,
            sentence_count=sentence_count,
            paragraph_count=paragraph_count,
            quality_score=quality_score,
            quality_level=quality_level,
            boundary_type=config.boundary_type,
            overlap_with_previous=0,  # Will be updated later
            overlap_with_next=0,  # Will be updated later
            created_at=datetime.now(),
            source_metadata=source_metadata.copy()
        )
        
        return ContentChunk(
            text=text,
            metadata=metadata,
            relationships={}
        )
    
    def _calculate_quality_score(
        self,
        text: str,
        token_count: int,
        word_count: int,
        sentence_count: int,
        paragraph_count: int
    ) -> float:
        """Calculate quality score for a chunk"""
        score = 0.0
        
        # Size appropriateness (0-30 points)
        if self.config.min_chunk_size <= token_count <= self.config.max_chunk_size:
            score += 30
        elif token_count < self.config.min_chunk_size:
            score += 30 * (token_count / self.config.min_chunk_size)
        else:
            score += 30 * (self.config.max_chunk_size / token_count)
        
        # Sentence completeness (0-25 points)
        if sentence_count > 0:
            score += 25
        
        # Content coherence (0-20 points)
        if paragraph_count > 0:
            score += 20
        
        # Text quality (0-15 points)
        if text.strip():
            score += 15
        
        # Word/token ratio (0-10 points)
        if word_count > 0:
            ratio = token_count / word_count
            if 1.0 <= ratio <= 2.0:  # Reasonable token/word ratio
                score += 10
            else:
                score += 10 * min(ratio / 2.0, 2.0 / ratio)
        
        return min(score, 100.0)
    
    def _determine_quality_level(self, score: float) -> ChunkQuality:
        """Determine quality level based on score"""
        if score >= 90:
            return ChunkQuality.EXCELLENT
        elif score >= 70:
            return ChunkQuality.GOOD
        elif score >= 50:
            return ChunkQuality.FAIR
        else:
            return ChunkQuality.POOR
    
    def _get_overlap_text(self, text: str, overlap_tokens: int) -> str:
        """Get overlap text for the next chunk"""
        tokens = self.encoder.encode(text)
        if len(tokens) <= overlap_tokens:
            return text
        
        overlap_token_list = tokens[-overlap_tokens:]
        return self.encoder.decode(overlap_token_list)
    
    def _update_chunk_relationships(self, chunks: List[ContentChunk]):
        """Update relationships between chunks"""
        for i, chunk in enumerate(chunks):
            chunk.metadata.total_chunks = len(chunks)
            
            # Calculate actual overlap
            if i > 0:
                prev_chunk = chunks[i-1]
                overlap = self._calculate_overlap(prev_chunk.text, chunk.text)
                chunk.metadata.overlap_with_previous = overlap
                
                # Add relationship
                chunk.relationships['previous'] = prev_chunk.metadata.chunk_id
                prev_chunk.relationships['next'] = chunk.metadata.chunk_id
            
            if i < len(chunks) - 1:
                next_chunk = chunks[i+1]
                overlap = self._calculate_overlap(chunk.text, next_chunk.text)
                chunk.metadata.overlap_with_next = overlap
    
    def _calculate_overlap(self, text1: str, text2: str) -> int:
        """Calculate token overlap between two text chunks"""
        tokens1 = set(self.encoder.encode(text1))
        tokens2 = set(self.encoder.encode(text2))
        return len(tokens1.intersection(tokens2))


# Global instance
content_chunking_service = ContentChunkingService()