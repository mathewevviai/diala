#!/usr/bin/env python3
"""
Example of creating a RAG workflow with external search sources.
"""

import requests
import json
import time

# API configuration
API_URL = "http://localhost:8000"
API_KEY = "your-api-key-here"  # Replace with actual API key

def create_external_search_workflow():
    """Create a RAG workflow that uses external search."""
    
    # Step 1: Create the workflow
    workflow_data = {
        "name": "External Search RAG Example",
        "description": "RAG workflow using Jina AI external search with formatted queries",
        "type": "external_search",
        "parameters": {
            "chunkSize": 512,
            "overlap": 50,
            "embeddingModel": "text-embedding-ada-002",
            "vectorStore": "pinecone"
        },
        "sources": [
            {
                "source": json.dumps({
                    "keywords": ["RAG", "retrieval augmented generation", "embeddings", "vector database"],
                    "context": "Technical documentation and tutorials about RAG systems",
                    "max_results": 10
                }),
                "source_type": "external_search"
            },
            {
                "source": json.dumps({
                    "keywords": ["LangChain", "RAG", "implementation", "Python"],
                    "context": "Code examples and implementation guides for RAG with LangChain",
                    "max_results": 8
                }),
                "source_type": "external_search"
            },
            {
                "source": "machine learning, RAG, best practices, optimization",
                "source_type": "external_search"
            }
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    print("Creating RAG workflow with external search sources...")
    response = requests.post(
        f"{API_URL}/api/rag/workflows",
        json=workflow_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"Error creating workflow: {response.status_code}")
        print(response.text)
        return None
    
    workflow = response.json()
    workflow_id = workflow["id"]
    print(f"Created workflow: {workflow_id}")
    
    return workflow_id

def start_workflow(workflow_id):
    """Start processing the workflow."""
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    print(f"\nStarting workflow {workflow_id}...")
    response = requests.post(
        f"{API_URL}/api/rag/workflows/{workflow_id}/start",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"Error starting workflow: {response.status_code}")
        print(response.text)
        return False
    
    print("Workflow started successfully!")
    return True

def monitor_workflow(workflow_id):
    """Monitor the workflow progress."""
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    print("\nMonitoring workflow progress...")
    last_status = None
    last_progress = -1
    
    while True:
        response = requests.get(
            f"{API_URL}/api/rag/workflows/{workflow_id}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"Error getting workflow status: {response.status_code}")
            break
        
        workflow = response.json()
        status = workflow["status"]
        progress = workflow["progress"]
        
        # Print updates
        if status != last_status or progress != last_progress:
            print(f"Status: {status}, Progress: {progress:.1f}%")
            last_status = status
            last_progress = progress
        
        # Check if completed or failed
        if status in ["completed", "failed", "cancelled"]:
            print(f"\nWorkflow {status}!")
            
            if status == "completed":
                stats = workflow.get("stats", {})
                print("\nWorkflow Statistics:")
                print(f"  Total chunks: {stats.get('total_chunks', 0)}")
                print(f"  Total embeddings: {stats.get('embeddings', 0)}")
                print(f"  Index size: {stats.get('indexSize', 'N/A')}")
                
                # Get sources info
                response = requests.get(
                    f"{API_URL}/api/rag/workflows/{workflow_id}/sources",
                    headers=headers
                )
                if response.status_code == 200:
                    sources = response.json()
                    print(f"\nProcessed {len(sources)} sources:")
                    for i, source in enumerate(sources, 1):
                        metadata = source.get("metadata", {})
                        print(f"  {i}. Results: {metadata.get('results_count', 0)}, "
                              f"Status: {source['status']}")
            
            break
        
        # Wait before next check
        time.sleep(2)

def main():
    """Main function to demonstrate external search RAG workflow."""
    print("RAG External Search Workflow Example")
    print("=" * 40)
    
    # Create workflow
    workflow_id = create_external_search_workflow()
    if not workflow_id:
        return
    
    # Start workflow
    if not start_workflow(workflow_id):
        return
    
    # Monitor progress
    monitor_workflow(workflow_id)
    
    print("\nExample completed!")
    print(f"Workflow ID: {workflow_id}")
    print("\nYou can now:")
    print("1. Query the indexed content using the search endpoint")
    print("2. Export the embeddings for use in other systems")
    print("3. View detailed results in the dashboard")

if __name__ == "__main__":
    main()