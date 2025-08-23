#!/usr/bin/env python3
"""
Test Jina API using OpenAI SDK format
"""

import openai
import os
from typing import List, Dict, Any

# Configure OpenAI client to use Jina API
client = openai.OpenAI(
    api_key=os.getenv("JINA_API_KEY"),
    base_url="https://api.jina.ai/v1"
)

def test_jina_embeddings():
    """Test Jina embeddings using OpenAI SDK format"""
    print("🧪 Testing Jina API with OpenAI SDK format...")
    
    try:
        # Test with actual document content
        response = client.embeddings.create(
            model="jina-embeddings-v4",
            input=[
                "This is a test of the audio transcription API",
                "The system supports multiple languages and audio formats",
                "Real-time transcription with speaker identification"
            ]
        )
        
        print(f"✅ Success! Got {len(response.data)} embeddings")
        print(f"📊 Dimensions: {len(response.data[0].embedding)}")
        print(f"📝 Tokens used: {response.usage.total_tokens}")
        
        # Print first few dimensions of first embedding
        embedding = response.data[0].embedding
        print(f"🔍 First 10 dimensions: {embedding[:10]}")
        
        return response
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_with_actual_content():
    """Test with actual markdown content"""
    print("\n📄 Testing with actual markdown content...")
    
    # Sample from actual docs
    content = """
    # Audio Transcription API
    
    This API provides advanced audio transcription capabilities using state-of-the-art speech recognition models. The system supports multiple languages and audio formats.
    
    ## Features
    - Real-time transcription
    - Speaker identification
    - Language detection
    - Timestamp generation
    
    ## Usage
    ```bash
    curl -X POST http://localhost:8000/api/transcribe \
      -F "audio=@recording.wav"
    ```
    """
    
    try:
        response = client.embeddings.create(
            model="jina-embeddings-v4",
            input=[content]
        )
        
        print(f"✅ Success! Processed markdown content")
        print(f"📊 Dimensions: {len(response.data[0].embedding)}")
        print(f"📝 Tokens used: {response.usage.total_tokens}")
        
        return response
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_batch_processing():
    """Test batch processing like our RAG system"""
    print("\n🔄 Testing batch processing (like RAG system)...")
    
    # Simulate chunked content
    chunks = [
        "# Audio Transcription API\n\nThis API provides advanced audio transcription capabilities",
        "## Features\n- Real-time transcription\n- Speaker identification\n- Language detection",
        "## Usage\n```bash\ncurl -X POST http://localhost:8000/api/transcribe\n```",
        "# Bulk Processing Setup\n\nThis guide covers setting up bulk processing for large-scale content",
        "## Prerequisites\n- Convex deployment\n- Jina API key\n- Sufficient storage space"
    ]
    
    try:
        response = client.embeddings.create(
            model="jina-embeddings-v4",
            input=chunks
        )
        
        print(f"✅ Success! Processed {len(chunks)} chunks")
        print(f"📊 Dimensions per embedding: {len(response.data[0].embedding)}")
        print(f"📝 Total tokens: {response.usage.total_tokens}")
        print(f"⏱️ Average tokens per chunk: {response.usage.total_tokens / len(chunks):.1f}")
        
        return response
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Testing Jina API with OpenAI SDK format")
    print("=" * 50)
    
    # Test basic functionality
    test_jina_embeddings()
    
    # Test with actual content
    test_with_actual_content()
    
    # Test batch processing
    test_batch_processing()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")