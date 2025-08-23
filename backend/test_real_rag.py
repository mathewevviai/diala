#!/usr/bin/env python3
"""
ACTUAL WORKING RAG TEST - Using Real Files
"""

import asyncio
import aiohttp
import os
import json
from pathlib import Path
from typing import Dict, Any, List

class ActualRAGTester:
    def __init__(self):
        self.jina_api_key = "jina_97ac1a18dc65431280b56599f79ddbb7PHKwTnjdhpxcAubg_sD1dJcL6C"
        self.jina_url = "https://api.jina.ai/v1/embeddings"
        
    async def test_with_real_files(self):
        """Test with actual .md files from frontend/public/"""
        
        # Find actual .md files
        frontend_path = Path("/home/bozo/projects/projectBozo/diala/frontend/public")
        md_files = list(frontend_path.glob("**/*.md"))
        
        if not md_files:
            print("❌ No .md files found in frontend/public/")
            return
            
        print(f"📁 Found {len(md_files)} .md files")
        
        async with aiohttp.ClientSession() as session:
            for file_path in md_files[:2]:  # Test first 2 files
                print(f"\n🎯 Processing: {file_path.name}")
                
                # Read the actual file content
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    print(f"📊 File size: {len(content)} characters")
                    
                    # Split into chunks (like the actual system)
                    chunks = self.split_into_chunks(content)
                    print(f"✂️ Created {len(chunks)} chunks")
                    
                    # Generate embeddings via Jina API
                    embeddings = await self.generate_embeddings(session, chunks)
                    
                    if embeddings:
                        print(f"✅ Success! Generated {len(embeddings)} embeddings")
                        
                        # Save results
                        await self.save_results(file_path, chunks, embeddings)
                        
                except Exception as e:
                    print(f"❌ Error processing {file_path}: {e}")
    
    def split_into_chunks(self, text: str, chunk_size: int = 512) -> List[str]:
        """Split text into chunks like the actual RAG system"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    async def generate_embeddings(self, session: aiohttp.ClientSession, chunks: List[str]) -> List[Dict[str, Any]]:
        """Generate embeddings via Jina API"""
        
        if not chunks:
            return []
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.jina_api_key}'
        }
        
        # Process in batches to avoid API limits
        batch_size = 10
        all_embeddings = []
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            payload = {
                "model": "jina-embeddings-v4",
                "task": "retrieval.passage",
                "input": [{"text": chunk} for chunk in batch]
            }
            
            try:
                async with session.post(self.jina_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        for j, embedding_data in enumerate(result.get('data', [])):
                            all_embeddings.append({
                                "chunk_index": i + j,
                                "text": batch[j],
                                "embedding": embedding_data.get('embedding', []),
                                "tokens": result.get('usage', {}).get('total_tokens', 0) // len(batch[j].split())
                            })
                        
                        print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} chunks processed")
                        
                    else:
                        print(f"   ❌ API Error: {response.status} - {await response.text()}")
                        return None
                        
            except Exception as e:
                print(f"   ❌ Request error: {e}")
                return None
        
        return all_embeddings
    
    async def save_results(self, file_path: Path, chunks: List[str], embeddings: List[Dict[str, Any]]):
        """Save processing results to JSON"""
        
        results = {
            "file": str(file_path),
            "file_name": file_path.name,
            "chunks_processed": len(chunks),
            "embeddings_generated": len(embeddings),
            "embedding_dimension": len(embeddings[0]['embedding']) if embeddings else 0,
            "results": embeddings
        }
        
        output_file = f"/home/bozo/projects/projectBozo/diala/backend/{file_path.stem}_results.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Results saved to: {output_file}")

async def main():
    print("🚀 Testing Actual RAG Workflow")
    print("=" * 50)
    
    tester = ActualRAGTester()
    await tester.test_with_real_files()
    
    print("\n" + "=" * 50)
    print("✅ Test Complete!")

if __name__ == "__main__":
    asyncio.run(main())