#!/usr/bin/env python3
"""
Example of using Convex Python client with the Diala application.
This demonstrates how to interact with Convex from Python.
"""

import os
from dotenv import load_dotenv
from convex import ConvexClient

# Load environment variables from frontend's .env.local
load_dotenv("../../frontend/.env.local")

# Get Convex URL
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
print(f"Connecting to Convex at: {CONVEX_URL}")

# Initialize Convex client
client = ConvexClient(CONVEX_URL)

# Example 1: Query voice agents
print("\n=== Querying Voice Agents ===")
try:
    agents = client.query("queries/callsPage:listVoiceAgents", {
        "userId": "user123",
        "limit": 10
    })
    print(f"Found {len(agents) if agents else 0} voice agents")
    if agents:
        for agent in agents:
            print(f"- {agent.get('name', 'Unknown')}: {agent.get('status', 'Unknown')}")
except Exception as e:
    print(f"Error querying agents: {e}")

# Example 2: Query YouTube transcripts
print("\n=== Querying YouTube Transcripts ===")
try:
    # Query by video ID (internal function - won't work from Python client)
    # Instead, we can use mutations to interact with the system
    print("YouTube transcript queries are internal - use the API endpoints instead")
except Exception as e:
    print(f"Error: {e}")

# Example 3: Subscribe to live data
print("\n=== Subscribing to Live Calls ===")
print("Starting subscription to live calls (Ctrl+C to stop)...")
try:
    # Subscribe to live calls
    for calls in client.subscribe("queries/callsPage:listLiveCalls"):
        print(f"\nActive calls: {len(calls) if calls else 0}")
        if calls:
            for call in calls[:3]:  # Show first 3
                print(f"- Call {call.get('callId', 'Unknown')}: {call.get('status', 'Unknown')}")
        # This loop runs forever until interrupted
except KeyboardInterrupt:
    print("\nSubscription stopped")
except Exception as e:
    print(f"Error subscribing: {e}")

print("\n=== Example Complete ===")