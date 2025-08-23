#!/usr/bin/env python3
"""
Test script to verify Jina API rate limits and DNS resolution.
"""

import asyncio
import aiohttp
import time
import socket
import os
from datetime import datetime

async def test_dns_resolution():
    """Test DNS resolution for Jina APIs."""
    print("="*60)
    print("Testing DNS Resolution")
    print("="*60)
    
    hosts = [
        "s.jina.ai",
        "r.jina.ai",
        "jina.ai"
    ]
    
    for host in hosts:
        try:
            start = time.time()
            ip = socket.gethostbyname(host)
            duration = (time.time() - start) * 1000
            print(f"✓ {host} -> {ip} ({duration:.2f}ms)")
        except socket.gaierror as e:
            print(f"✗ {host} -> DNS resolution failed: {e}")

async def test_api_connection():
    """Test basic API connectivity."""
    print("\n" + "="*60)
    print("Testing API Connectivity")
    print("="*60)
    
    api_key = os.getenv("JINA_API_KEY", "")
    if not api_key:
        print("❌ JINA_API_KEY not set!")
        return
    
    async with aiohttp.ClientSession() as session:
        # Test Search API
        try:
            print("\nTesting Search API (s.jina.ai)...")
            url = "https://s.jina.ai/?q=test"
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            start = time.time()
            async with session.get(url, headers=headers, timeout=10) as response:
                duration = time.time() - start
                print(f"  Status: {response.status}")
                print(f"  Response time: {duration:.2f}s")
                
                if response.status == 200:
                    data = await response.json()
                    print(f"  ✓ Success! Got {len(data.get('data', []))} results")
                else:
                    print(f"  ✗ Error: {await response.text()}")
                    
        except Exception as e:
            print(f"  ✗ Connection failed: {e}")
        
        # Test Reader API
        try:
            print("\nTesting Reader API (r.jina.ai)...")
            url = "https://r.jina.ai/https://example.com"
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {api_key}",
                "X-Return-Format": "json"
            }
            
            start = time.time()
            async with session.get(url, headers=headers, timeout=10) as response:
                duration = time.time() - start
                print(f"  Status: {response.status}")
                print(f"  Response time: {duration:.2f}s")
                
                if response.status == 200:
                    print(f"  ✓ Success!")
                else:
                    print(f"  ✗ Error: {await response.text()}")
                    
        except Exception as e:
            print(f"  ✗ Connection failed: {e}")

async def test_rate_limits():
    """Test rate limit behavior."""
    print("\n" + "="*60)
    print("Testing Rate Limits")
    print("="*60)
    
    api_key = os.getenv("JINA_API_KEY", "")
    if not api_key:
        print("❌ JINA_API_KEY not set!")
        return
    
    # Test rapid requests
    print("\nSending 5 rapid requests to Search API...")
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(5):
            url = f"https://s.jina.ai/?q=test{i}"
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            tasks.append(session.get(url, headers=headers))
        
        start = time.time()
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start
        
        success = 0
        errors = 0
        for i, resp in enumerate(responses):
            if isinstance(resp, Exception):
                print(f"  Request {i+1}: ✗ {type(resp).__name__}")
                errors += 1
            else:
                async with resp:
                    if resp.status == 200:
                        print(f"  Request {i+1}: ✓ Success")
                        success += 1
                    else:
                        print(f"  Request {i+1}: ✗ HTTP {resp.status}")
                        errors += 1
        
        print(f"\nResults: {success} success, {errors} errors in {duration:.2f}s")
        print(f"Effective rate: {len(responses)/duration:.2f} req/s")

def main():
    """Run all tests."""
    print(f"Jina API Rate Limit Test - {datetime.now()}")
    print(f"JINA_API_KEY set: {'Yes' if os.getenv('JINA_API_KEY') else 'No'}")
    
    asyncio.run(test_dns_resolution())
    asyncio.run(test_api_connection())
    asyncio.run(test_rate_limits())
    
    print("\n" + "="*60)
    print("Recommendations:")
    print("="*60)
    print("1. Search API: Max 1.67 requests/second (100 RPM)")
    print("2. Reader API: Max 8.33 requests/second (500 RPM)")
    print("3. Use connection pooling with limits")
    print("4. Implement exponential backoff for DNS errors")
    print("5. Monitor active connections to prevent overload")

if __name__ == "__main__":
    main()