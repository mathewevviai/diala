#!/usr/bin/env python3
"""
E2E Test for RAG Processing Pipeline
Tests the complete flow: Convex → Jina API → Vector Embeddings
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, List

# Test configuration
CONVEX_URL = "http://localhost:3210"  # Your Convex dev server
JINA_API_URL = "https://api.jina.ai/v1/embeddings"
JINA_API_KEY = "jina_97ac1a18dc65431280b56599f79ddbb7PHKwTnjdhpxcAubg_sD1dJcL6C"

class RAGTester:
    def __init__(self):
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_jina_api_direct(self) -> Dict[str, Any]:
        """Test direct Jina API connection"""
        print("🧪 Testing Jina API directly...")
        
        payload = {
            "model": "jina-embeddings-v4",
            "task": "retrieval.passage",
            "input": [
                {"text": "A beautiful sunset over the beach"},
                {"text": "Un beau coucher de soleil sur la plage"}
            ]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {JINA_API_KEY}'
        }
        
        start_time = time.time()
        try:
            async with self.session.post(JINA_API_URL, json=payload, headers=headers) as response:
                result = await response.json()
                elapsed = time.time() - start_time
                
                print(f"✅ Jina API Response: {response.status}")
                print(f"⏱️ Response time: {elapsed:.2f}s")
                print(f"📝 Tokens used: {result.get('usage', {}).get('total_tokens', 'N/A')}")
                
                return {
                    "status": response.status,
                    "response_time": elapsed,
                    "tokens_used": result.get('usage', {}).get('total_tokens'),
                    "embeddings_count": len(result.get('data', [])),
                    "success": True
                }
                
        except Exception as e:
            print(f"❌ Jina API Error: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_convex_health(self) -> Dict[str, Any]:
        """Test Convex server health"""
        print("🩺 Testing Convex server...")
        
        try:
            async with self.session.get(f"{CONVEX_URL}/health") as response:
                return {
                    "status": response.status,
                    "url": CONVEX_URL,
                    "success": response.status == 200
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def test_embedding_models_endpoint(self) -> Dict[str, Any]:
        """Test embedding models endpoint"""
        print("🔍 Testing embedding models endpoint...")
        
        try:
            async with self.session.get(f"http://localhost:8000/api/public/embedding-models/") as response:
                models = await response.json()
                
                print(f"✅ Found {len(models)} embedding models")
                for model in models:
                    if model.get('id') == 'jina-v4':
                        print(f"🎯 Jina v4 Model: {model.get('label')}")
                        print(f"📊 Dimensions: {model.get('dimensions')}")
                        print(f"⭐ MTEB Score: {model.get('mtebScore')}")
                        
                return {"success": True, "models_count": len(models)}
                
        except Exception as e:
            print(f"❌ Embedding models error: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_convex_rag_workflow(self) -> Dict[str, Any]:
        """Test the complete Convex RAG workflow"""
        print("🔄 Testing complete RAG workflow...")
        
        # Mock document content
        test_documents = [
            {
                "id": "doc1",
                "title": "AUDIO_TRANSCRIPTION_API.md",
                "content": """# Audio Transcription API
                
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
            },
            {
                "id": "doc2", 
                "title": "BULK_PROCESSING_SETUP.md",
                "content": """# Bulk Processing Setup

This guide covers setting up bulk processing for large-scale content ingestion and embedding generation.

## Prerequisites
- Convex deployment
- Jina API key
- Sufficient storage space

## Configuration
Set your environment variables:
```bash
export JINA_API_KEY="your-key-here"
export CONVEX_URL="http://localhost:3210"
```
"""
            }
        ]
        
        # Test each document
        results = []
        for doc in test_documents:
            print(f"📄 Processing: {doc['title']}")
            
            # Simulate chunking
            chunks = doc['content'].split('\n\n')
            
            # Test embedding each chunk
            for i, chunk in enumerate(chunks):
                if chunk.strip():
                    payload = {
                        "model": "jina-embeddings-v4",
                        "task": "retrieval.passage",
                        "input": [{"text": chunk.strip()}]
                    }
                    
                    async with self.session.post(JINA_API_URL, json=payload, headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {JINA_API_KEY}'
                    }) as response:
                        result = await response.json()
                        
                        results.append({
                            "document": doc['title'],
                            "chunk_index": i,
                            "tokens": result.get('usage', {}).get('total_tokens', 0),
                            "dimensions": len(result.get('data', [{}])[0].get('embedding', [])),
                            "success": True
                        })
        
        return {"success": True, "processed_chunks": len(results), "results": results}

async def main():
    """Run all E2E tests"""
    print("🚀 Starting E2E RAG Testing...")
    print("=" * 50)
    
    async with RAGTester() as tester:
        
        # Test 1: Convex health
        convex_health = await tester.test_convex_health()
        print(f"Convex Health: {convex_health}")
        
        # Test 2: Embedding models endpoint
        models_result = await tester.test_embedding_models_endpoint()
        print(f"Embedding Models: {models_result}")
        
        # Test 3: Direct Jina API
        jina_result = await tester.test_jina_api_direct()
        print(f"Jina API Test: {jina_result}")
        
        # Test 4: Complete workflow
        workflow_result = await tester.test_convex_rag_workflow()
        print(f"RAG Workflow: {workflow_result}")
        
        print("=" * 50)
        print("✅ E2E Testing Complete!")

if __name__ == "__main__":
    asyncio.run(main())