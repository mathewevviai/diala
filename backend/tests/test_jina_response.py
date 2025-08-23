#!/usr/bin/env python3
"""
Quick test to see actual Jina API response format
"""

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("JINA_API_KEY")
if not api_key:
    print("JINA_API_KEY not set!")
    exit(1)

# Test search API
url = "https://s.jina.ai/?q=roofing+belfast"
headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {api_key}",
    "X-Engine": "auto"
}

print("Testing Jina Search API...")
response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
print(f"Headers: {dict(response.headers)}")

if response.status_code == 200:
    try:
        data = response.json()
        print(f"\nResponse structure:")
        print(f"Type: {type(data)}")
        print(f"Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        if isinstance(data, dict):
            print(f"\ncode: {data.get('code')}")
            print(f"status: {data.get('status')}")
            
            if 'data' in data:
                print(f"\ndata type: {type(data['data'])}")
                if isinstance(data['data'], list):
                    print(f"data length: {len(data['data'])}")
                    if data['data']:
                        print(f"\nFirst result keys: {list(data['data'][0].keys())}")
                        print(f"First result sample:")
                        print(json.dumps(data['data'][0], indent=2)[:500])
                elif isinstance(data['data'], dict):
                    print(f"data keys: {list(data['data'].keys())}")
        
        # Save full response for analysis
        with open("jina_response_sample.json", "w") as f:
            json.dump(data, f, indent=2)
        print("\nFull response saved to jina_response_sample.json")
        
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Response text: {response.text[:500]}")
else:
    print(f"Error: {response.text[:500]}")