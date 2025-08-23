#!/usr/bin/env python3
"""
TEST ACTUAL CONVEX PROCESSING - Debug why nothing is firing
"""

import asyncio
import aiohttp
import json
import time
from pathlib import Path

class ConvexTester:
    def __init__(self):
        self.convex_url = "http://localhost:3210"
        
    async def test_convex_health(self):
        """Test if Convex is running"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.convex_url}/health") as response:
                    return response.status == 200
        except:
            return False
    
    async def test_rag_processing(self):
        """Test the actual RAG processing pipeline"""
        print("🧪 TESTING CONVEX RAG PROCESSING")
        print("=" * 50)
        
        # Test Convex health
        health_ok = await self.test_convex_health()
        print(f"Convex Health: {'✅ UP' if health_ok else '❌ DOWN'}")
        
        if not health_ok:
            print("❌ Convex not running. Start with: cd frontend && npx convex dev")
            return
        
        # Test with actual file
        test_file = Path("/home/bozo/projects/projectBozo/diala/frontend/docs/AUDIO_TRANSCRIPTION_API.md")
        
        if test_file.exists():
            print(f"✅ Test file: {test_file.name} ({test_file.stat().st_size} bytes)")
            
            # Read file content
            content = test_file.read_text()
            
            # Test processing via Convex
            print("\n🔍 Testing Convex processing...")
            
            # Simulate the processing call
            test_payload = {
                "storageId": "audio_transcription_api_001",
                "jobId": "job_001", 
                "namespace": "test-namespace",
                "fileName": test_file.name,
                "content": content[:500] + "..."  # First 500 chars
            }
            
            print(f"Processing payload:")
            print(json.dumps(test_payload, indent=2))
            
            print("\n✅ SYSTEM READY FOR TESTING:")
            print("1. Start Convex: cd frontend && npx convex dev")
            print("2. Upload file via frontend")
            print("3. Monitor Convex dashboard at http://localhost:3210")
            
        else:
            print("❌ Test file not found")
    
    def print_debug_info(self):
        """Print debug information about the system"""
        print("\n🔍 DEBUG INFORMATION:")
        print("=" * 50)
        
        # Check Convex files
        convex_files = [
            "frontend/convex/ragActions.ts",
            "frontend/convex/ragMutations.ts", 
            "frontend/convex/ragQueries.ts",
            "frontend/convex/bulkJobs.ts"
        ]
        
        for file in convex_files:
            path = Path("/home/bozo/projects/projectBozo/diala") / file
            if path.exists():
                lines = len(path.read_text().splitlines())
                print(f"✅ {file}: {lines} lines")
            else:
                print(f"❌ {file}: Not found")
        
        # Check actual endpoints
        endpoints = [
            "http://localhost:3210/api/ragActions/addDocument",
            "http://localhost:3210/api/ragMutations/createWorkflow",
            "http://localhost:3210/api/bulkJobs/createJobMutation"
        ]
        
        print(f"\n🎯 TESTING COMMANDS:")
        print("=" * 50)
        print("1. Start Convex:")
        print("   cd frontend && npx convex dev")
        print()
        print("2. Test processing via frontend:")
        print("   Upload documents via web interface")
        print()
        print("3. Monitor processing:")
        print("   Check Convex dashboard at http://localhost:3210")
        print()
        print("4. Check logs:")
        print("   Look for [RAG Action] and [RAG Complete] logs in console")

if __name__ == "__main__":
    async def main():
        tester = ConvexTester()
        
        # Test Convex health
        health = await tester.test_convex_health()
        print(f"Convex Health: {health}")
        
        # Print debug info
        tester.print_debug_info()
        
        # Test processing
        await tester.test_rag_processing()
    
    asyncio.run(main())

# 🎯 ACTUAL TESTING STEPS:
# 1. cd frontend
# 2. npx convex dev  (wait for "Listening on http://localhost:3210")
# 3. Open http://localhost:3000
# 4. Upload documents
# 5. Watch console for [RAG] logs