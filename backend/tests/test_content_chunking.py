"""
Test script for Content Chunking Service

This script demonstrates the functionality of the ContentChunkingService
including transcript chunking, configurable overlap, metadata preservation,
and export preparation.
"""

import asyncio
import json
from datetime import datetime
from src.services.content_chunking_service import (
    ContentChunkingService,
    ChunkingConfig,
    ChunkBoundary,
    ChunkQuality
)

# Sample transcript data
SAMPLE_TRANSCRIPT = """
Speaker 1: Hello everyone and welcome to today's discussion about artificial intelligence and its impact on modern society. I'm really excited to dive into this topic with you all.

Speaker 2: Thank you for having me. I think AI is one of the most transformative technologies of our time, and we're only beginning to understand its full potential.

Speaker 1: Absolutely. Let's start with the basics. When we talk about AI, we're really talking about a broad range of technologies, from machine learning to natural language processing, computer vision, and beyond.

Speaker 2: That's right. And what's particularly interesting is how these technologies are being integrated into everyday applications. Take voice assistants, for example. They combine speech recognition, natural language understanding, and text-to-speech synthesis.

Speaker 1: It's fascinating how far we've come. I remember when speech recognition was barely functional, and now we have systems that can understand context, maintain conversations, and even detect emotions in speech.

Speaker 2: The progress has been remarkable. But with great power comes great responsibility. We need to consider the ethical implications of these technologies, especially when it comes to privacy, bias, and the potential for misuse.

Speaker 1: That's a crucial point. As AI becomes more sophisticated and ubiquitous, we need robust frameworks for ensuring these systems are fair, transparent, and beneficial for everyone.

Speaker 2: Exactly. And that's where the conversation gets really interesting. How do we balance innovation with responsibility? How do we ensure that AI serves humanity rather than the other way around?
"""

SAMPLE_METADATA = {
    'source_id': 'podcast_ai_discussion_001',
    'title': 'AI Discussion Podcast',
    'speakers': ['Speaker 1', 'Speaker 2'],
    'duration': 600,  # 10 minutes
    'language': 'en',
    'topic': 'artificial_intelligence',
    'created_at': datetime.now().isoformat(),
    'source_type': 'podcast_transcript'
}

async def test_basic_chunking():
    """Test basic transcript chunking"""
    print("=== Testing Basic Transcript Chunking ===")
    
    service = ContentChunkingService()
    
    # Test with default configuration
    result = service.chunk_transcript(SAMPLE_TRANSCRIPT, SAMPLE_METADATA)
    
    print(f"Total chunks: {result.total_chunks}")
    print(f"Total tokens: {result.total_tokens}")
    print(f"Average chunk size: {result.avg_chunk_size:.2f} tokens")
    print(f"Processing time: {result.processing_time:.3f} seconds")
    
    print("\nQuality distribution:")
    for quality, count in result.quality_distribution.items():
        print(f"  {quality.value}: {count} chunks")
    
    print("\nFirst chunk preview:")
    if result.chunks:
        chunk = result.chunks[0]
        print(f"  ID: {chunk.metadata.chunk_id}")
        print(f"  Text: {chunk.text[:100]}...")
        print(f"  Tokens: {chunk.metadata.token_count}")
        print(f"  Quality: {chunk.metadata.quality_level.value}")
    
    return result

async def test_configurable_overlap():
    """Test chunking with different overlap settings"""
    print("\n=== Testing Configurable Overlap ===")
    
    service = ContentChunkingService()
    
    # Test with different overlap sizes
    overlap_sizes = [0, 100, 200, 300]
    
    for overlap in overlap_sizes:
        result = service.chunk_with_overlap(
            SAMPLE_TRANSCRIPT, 
            SAMPLE_METADATA, 
            chunk_size=512, 
            overlap=overlap
        )
        
        print(f"\nOverlap {overlap} tokens:")
        print(f"  Total chunks: {result.total_chunks}")
        print(f"  Avg chunk size: {result.avg_chunk_size:.2f} tokens")
        
        if result.chunks:
            avg_overlap = sum(c.metadata.overlap_with_previous for c in result.chunks[1:]) / max(1, len(result.chunks) - 1)
            print(f"  Avg actual overlap: {avg_overlap:.2f} tokens")

async def test_boundary_types():
    """Test different chunking boundary types"""
    print("\n=== Testing Different Boundary Types ===")
    
    boundary_types = [
        ChunkBoundary.SENTENCE,
        ChunkBoundary.PARAGRAPH,
        ChunkBoundary.WORD,
        ChunkBoundary.TOKEN
    ]
    
    for boundary in boundary_types:
        config = ChunkingConfig(
            chunk_size=512,
            overlap=100,
            boundary_type=boundary
        )
        
        service = ContentChunkingService(config)
        result = service.chunk_transcript(SAMPLE_TRANSCRIPT, SAMPLE_METADATA)
        
        print(f"\n{boundary.value} boundary:")
        print(f"  Total chunks: {result.total_chunks}")
        print(f"  Avg chunk size: {result.avg_chunk_size:.2f} tokens")
        
        if result.chunks:
            print(f"  First chunk preview: {result.chunks[0].text[:80]}...")

async def test_metadata_preservation():
    """Test metadata preservation functionality"""
    print("\n=== Testing Metadata Preservation ===")
    
    service = ContentChunkingService()
    result = service.chunk_transcript(SAMPLE_TRANSCRIPT, SAMPLE_METADATA)
    
    # Add additional metadata
    additional_metadata = {
        'processing_version': '2.0',
        'quality_threshold': 'high',
        'embedding_model': 'text-embedding-3-large',
        'vector_dimensions': 1536
    }
    
    enhanced_chunks = service.preserve_metadata(result.chunks, additional_metadata)
    
    print(f"Enhanced {len(enhanced_chunks)} chunks with additional metadata")
    
    if enhanced_chunks:
        chunk = enhanced_chunks[0]
        print("Sample enhanced metadata:")
        for key, value in chunk.metadata.source_metadata.items():
            print(f"  {key}: {value}")

async def test_chunk_indexing():
    """Test chunk indexing functionality"""
    print("\n=== Testing Chunk Indexing ===")
    
    service = ContentChunkingService()
    result = service.chunk_transcript(SAMPLE_TRANSCRIPT, SAMPLE_METADATA)
    
    # Test different index types
    index_types = ["sequential", "hierarchical", "similarity"]
    
    for index_type in index_types:
        index = service.create_chunk_index(result.chunks, index_type)
        
        print(f"\n{index_type.title()} index:")
        print(f"  Index type: {index['index_type']}")
        print(f"  Total chunks: {index['total_chunks']}")
        print(f"  Created at: {index['created_at']}")
        
        if index_type == "sequential" and "chunk_map" in index:
            print(f"  Chunk map entries: {len(index['chunk_map'])}")
        elif index_type == "hierarchical" and "quality_groups" in index:
            print(f"  Quality groups: {len(index['quality_groups'])}")
        elif index_type == "similarity" and "relationships" in index:
            print(f"  Relationship entries: {len(index['relationships'])}")

async def test_export_formats():
    """Test different export formats"""
    print("\n=== Testing Export Formats ===")
    
    service = ContentChunkingService()
    result = service.chunk_transcript(SAMPLE_TRANSCRIPT, SAMPLE_METADATA)
    
    # Test vector database export
    vector_db_export = service.structure_for_export(result.chunks, "vector_db")
    print(f"Vector DB export:")
    print(f"  Documents: {len(vector_db_export['documents'])}")
    print(f"  Export metadata keys: {list(vector_db_export['export_metadata'].keys())}")
    
    # Test JSON export
    json_export = service.structure_for_export(result.chunks, "json")
    print(f"\nJSON export:")
    print(f"  Chunks: {len(json_export['chunks'])}")
    
    if json_export['chunks']:
        chunk = json_export['chunks'][0]
        print(f"  Sample chunk keys: {list(chunk.keys())}")
        print(f"  Sample metadata keys: {list(chunk['metadata'].keys())}")

async def test_quality_validation():
    """Test chunk quality validation"""
    print("\n=== Testing Quality Validation ===")
    
    service = ContentChunkingService()
    result = service.chunk_transcript(SAMPLE_TRANSCRIPT, SAMPLE_METADATA)
    
    # Test validation with different quality thresholds
    quality_thresholds = [ChunkQuality.POOR, ChunkQuality.FAIR, ChunkQuality.GOOD]
    
    for threshold in quality_thresholds:
        validation = service.validate_chunk_quality(result.chunks, threshold)
        
        print(f"\nValidation with {threshold.value} threshold:")
        print(f"  Total chunks: {validation['total_chunks']}")
        print(f"  Passed: {validation['passed_validation']}")
        print(f"  Failed: {validation['failed_validation']}")
        
        if validation['recommendations']:
            print(f"  Recommendations: {len(validation['recommendations'])}")
            for rec in validation['recommendations']:
                print(f"    - {rec}")

async def test_performance_benchmarks():
    """Test performance with different text sizes"""
    print("\n=== Testing Performance Benchmarks ===")
    
    service = ContentChunkingService()
    
    # Create texts of different sizes
    base_text = SAMPLE_TRANSCRIPT
    test_cases = [
        ("Small", base_text),
        ("Medium", base_text * 5),
        ("Large", base_text * 20),
        ("Extra Large", base_text * 50)
    ]
    
    for size_name, text in test_cases:
        start_time = datetime.now()
        result = service.chunk_transcript(text, SAMPLE_METADATA)
        end_time = datetime.now()
        
        processing_time = (end_time - start_time).total_seconds()
        
        print(f"\n{size_name} text ({len(text)} chars):")
        print(f"  Processing time: {processing_time:.3f} seconds")
        print(f"  Total chunks: {result.total_chunks}")
        print(f"  Total tokens: {result.total_tokens}")
        print(f"  Chunks per second: {result.total_chunks / processing_time:.2f}")
        print(f"  Tokens per second: {result.total_tokens / processing_time:.2f}")

async def main():
    """Run all tests"""
    print("Content Chunking Service Test Suite")
    print("=" * 50)
    
    try:
        await test_basic_chunking()
        await test_configurable_overlap()
        await test_boundary_types()
        await test_metadata_preservation()
        await test_chunk_indexing()
        await test_export_formats()
        await test_quality_validation()
        await test_performance_benchmarks()
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        
    except Exception as e:
        print(f"\nError during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())