# Vector Database Integration Guide

## Overview

The Diala audio-to-RAG pipeline provides seamless integration with major vector databases through a unified export system. Each database connector generates optimized formats, import scripts, and configuration files for immediate deployment.

## Supported Vector Databases

### 1. Pinecone
**Type**: Cloud-native vector database  
**Best For**: Production deployments, managed infrastructure  
**Pricing**: Pay-per-use with free tier  

### 2. ChromaDB
**Type**: Open-source embeddings database  
**Best For**: Local development, cost-sensitive deployments  
**Pricing**: Free and open-source  

### 3. Weaviate
**Type**: GraphQL vector search engine  
**Best For**: Complex schemas, hybrid search applications  
**Pricing**: Open-source with cloud options  

## Export Process

### 1. Select Vector Database

During bulk processing setup, choose your target database:

```json
{
  "vector_db": {
    "id": "pinecone",
    "label": "Pinecone"
  }
}
```

### 2. Process Content

The pipeline automatically optimizes embeddings for your chosen database during processing.

### 3. Export with Vector Format

When exporting, select the "vector" format to generate database-specific files:

```json
{
  "job_id": "bulk-1641024000123",
  "format": "vector"
}
```

### 4. Download and Import

Receive a zip file containing:
- Optimized data files
- Import scripts
- Configuration files
- Setup instructions

## Pinecone Integration

### Export Contents

```
pinecone_export_20250105/
├── pinecone_vectors_default_batch_1.json
├── pinecone_vectors_default_batch_2.json
├── pinecone_index_config.json
├── pinecone_import_script.py
└── pinecone_export_metadata.json
```

### Data Format

**Vector Batch File** (`pinecone_vectors_default_batch_1.json`):
```json
{
  "namespace": "default",
  "vectors": [
    {
      "id": "7516961325537332502",
      "values": [0.1, 0.2, 0.3, ...],
      "metadata": {
        "text": "Full transcript text",
        "content_type": "tiktok",
        "source": "Video Title",
        "duration": 34.0,
        "language": "en"
      }
    }
  ]
}
```

**Index Configuration** (`pinecone_index_config.json`):
```json
{
  "dimension": 1024,
  "metric": "cosine",
  "pod_type": "p1.x1",
  "pods": 1,
  "metadata_config": {
    "indexed": ["content_type", "language", "source"]
  },
  "source_tag": "diala-voice-agent"
}
```

### Setup Instructions

1. **Install Dependencies**:
```bash
pip install pinecone-client
```

2. **Set Environment Variables**:
```bash
export PINECONE_API_KEY="your-api-key"
export PINECONE_ENVIRONMENT="us-west1-gcp"
export PINECONE_INDEX_NAME="diala-voice-embeddings"
```

3. **Run Import Script**:
```bash
python pinecone_import_script.py
```

### Generated Import Script

```python
#!/usr/bin/env python3
"""
Pinecone Import Script for Diala Voice Agent Platform
"""

import json
import os
from pathlib import Path
import pinecone
from tqdm import tqdm

# Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-west1-gcp")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "diala-voice-embeddings")

def main():
    """Import vectors to Pinecone"""
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY environment variable is required")
    
    # Initialize Pinecone
    pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
    
    # Load index configuration
    with open("pinecone_index_config.json", "r") as f:
        index_config = json.load(f)
    
    # Create index if it doesn't exist
    if INDEX_NAME not in pinecone.list_indexes():
        print(f"Creating index: {INDEX_NAME}")
        pinecone.create_index(
            name=INDEX_NAME,
            dimension=index_config["dimension"],
            metric=index_config["metric"]
        )
    
    # Get index and import vectors
    index = pinecone.Index(INDEX_NAME)
    
    # Process each batch file
    for batch_file in Path(".").glob("pinecone_vectors_*.json"):
        with open(batch_file, "r") as f:
            data = json.load(f)
        
        vectors = data["vectors"]
        namespace = data["namespace"]
        
        print(f"Importing {len(vectors)} vectors to namespace: {namespace}")
        
        # Batch upsert
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch, namespace=namespace)
        
        print(f"Completed: {batch_file}")
    
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
```

## ChromaDB Integration

### Export Contents

```
chromadb_export_20250105/
├── chromadb_collection_default.csv
├── chromadb_collection_default.parquet
├── chromadb_collections_config.json
├── chromadb_import_script.py
└── chromadb_export_metadata.json
```

### Data Format

**Collection CSV** (`chromadb_collection_default.csv`):
```csv
id,embeddings,documents,metadatas
7516961325537332502,"[0.1, 0.2, 0.3, ...]","Full transcript text","{""content_type"": ""tiktok"", ""language"": ""en""}"
```

**Collection Configuration** (`chromadb_collections_config.json`):
```json
{
  "dimension": 1024,
  "distance_function": "cosine",
  "metadata_fields": ["content_type", "language", "source", "duration"],
  "embedding_function": "custom",
  "source_tag": "diala-voice-agent"
}
```

### Setup Instructions

1. **Install Dependencies**:
```bash
pip install chromadb pandas
```

2. **Set Environment Variables**:
```bash
export CHROMADB_PATH="./chromadb"
# OR for HTTP client:
export CHROMADB_HOST="localhost"
export CHROMADB_PORT="8000"
```

3. **Run Import Script**:
```bash
python chromadb_import_script.py
```

### Generated Import Script

```python
#!/usr/bin/env python3
"""
ChromaDB Import Script for Diala Voice Agent Platform
"""

import json
import os
from pathlib import Path
import pandas as pd
import chromadb
from tqdm import tqdm

# Configuration
CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chromadb")
USE_PERSISTENT = os.getenv("USE_PERSISTENT", "true").lower() == "true"

def main():
    """Import vectors to ChromaDB"""
    
    # Initialize ChromaDB client
    if USE_PERSISTENT:
        client = chromadb.PersistentClient(path=CHROMADB_PATH)
    else:
        client = chromadb.HttpClient(
            host=os.getenv("CHROMADB_HOST", "localhost"),
            port=int(os.getenv("CHROMADB_PORT", "8000"))
        )
    
    # Load collection configuration
    with open("chromadb_collections_config.json", "r") as f:
        config = json.load(f)
    
    # Process each collection
    for parquet_file in Path(".").glob("chromadb_collection_*.parquet"):
        collection_name = parquet_file.stem.replace("chromadb_collection_", "")
        
        # Create or get collection
        try:
            collection = client.get_collection(name=collection_name)
            print(f"Using existing collection: {collection_name}")
        except:
            collection = client.create_collection(
                name=collection_name,
                metadata={"source": "diala-voice-agent", "dimension": config["dimension"]}
            )
            print(f"Created new collection: {collection_name}")
        
        # Load data
        df = pd.read_parquet(parquet_file)
        
        # Prepare data for ChromaDB
        ids = df["id"].tolist()
        embeddings = [json.loads(emb) for emb in df["embeddings"]]
        documents = df["documents"].tolist()
        metadatas = [json.loads(meta) for meta in df["metadatas"]]
        
        # Batch insert
        batch_size = 1000
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            batch_embeddings = embeddings[i:i + batch_size]
            batch_documents = documents[i:i + batch_size]
            batch_metadatas = metadatas[i:i + batch_size]
            
            collection.add(
                ids=batch_ids,
                embeddings=batch_embeddings,
                documents=batch_documents,
                metadatas=batch_metadatas
            )
        
        print(f"Imported {len(ids)} vectors to collection: {collection_name}")
    
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
```

## Weaviate Integration

### Export Contents

```
weaviate_export_20250105/
├── weaviate_objects_DefaultClass_batch_1.json
├── weaviate_objects_DefaultClass_batch_2.json
├── weaviate_schema_config.json
├── weaviate_import_script.py
└── weaviate_export_metadata.json
```

### Data Format

**Object Batch File** (`weaviate_objects_DefaultClass_batch_1.json`):
```json
{
  "class": "DefaultClass",
  "objects": [
    {
      "id": "7516961325537332502",
      "class": "DefaultClass",
      "properties": {
        "text": "Full transcript text",
        "content_type": "tiktok",
        "source": "Video Title",
        "timestamp": "2025-01-05T10:30:00Z"
      },
      "vector": [0.1, 0.2, 0.3, ...]
    }
  ]
}
```

**Schema Configuration** (`weaviate_schema_config.json`):
```json
{
  "classes": [
    {
      "class": "DefaultClass",
      "description": "Vector class for DefaultClass embeddings from Diala Voice Agent",
      "vectorizer": "none",
      "properties": [
        {
          "name": "text",
          "dataType": ["text"],
          "description": "Original text content"
        },
        {
          "name": "content_type",
          "dataType": ["string"],
          "description": "Type of content"
        }
      ],
      "vectorIndexConfig": {
        "distance": "cosine",
        "ef": 64,
        "efConstruction": 128
      }
    }
  ]
}
```

### Setup Instructions

1. **Install Dependencies**:
```bash
pip install weaviate-client
```

2. **Set Environment Variables**:
```bash
export WEAVIATE_URL="http://localhost:8080"
export WEAVIATE_API_KEY="your-api-key"  # Optional
```

3. **Run Import Script**:
```bash
python weaviate_import_script.py
```

### Generated Import Script

```python
#!/usr/bin/env python3
"""
Weaviate Import Script for Diala Voice Agent Platform
"""

import json
import os
from pathlib import Path
import weaviate
from tqdm import tqdm

# Configuration
WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")

def main():
    """Import objects to Weaviate"""
    
    # Initialize Weaviate client
    auth_config = None
    if WEAVIATE_API_KEY:
        auth_config = weaviate.AuthApiKey(api_key=WEAVIATE_API_KEY)
    
    client = weaviate.Client(
        url=WEAVIATE_URL,
        auth_client_secret=auth_config
    )
    
    # Test connection
    if not client.is_ready():
        raise Exception("Weaviate server is not ready")
    
    # Load schema configuration
    with open("weaviate_schema_config.json", "r") as f:
        schema_config = json.load(f)
    
    # Create schema if it doesn't exist
    existing_schema = client.schema.get()
    existing_classes = {cls["class"] for cls in existing_schema.get("classes", [])}
    
    for class_schema in schema_config["classes"]:
        class_name = class_schema["class"]
        if class_name not in existing_classes:
            print(f"Creating class: {class_name}")
            client.schema.create_class(class_schema)
    
    # Import objects from each file
    for object_file in Path(".").glob("weaviate_objects_*.json"):
        with open(object_file, "r") as f:
            data = json.load(f)
        
        class_name = data["class"]
        objects = data["objects"]
        
        print(f"Importing {len(objects)} objects to class: {class_name}")
        
        # Batch import
        with client.batch as batch:
            batch.batch_size = 100
            batch.dynamic = True
            
            for obj in objects:
                batch.add_data_object(
                    data_object=obj["properties"],
                    class_name=class_name,
                    uuid=obj["id"],
                    vector=obj["vector"]
                )
        
        print(f"Completed: {object_file}")
    
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
```

## Advanced Configuration

### Custom Metadata Mapping

Customize which metadata fields are indexed for optimal search performance:

```python
# Pinecone - selective indexing
metadata_config = {
    "indexed": ["content_type", "language", "duration_range"]
}

# ChromaDB - field filtering
metadata_fields = ["content_type", "language", "source"]

# Weaviate - property schema
properties = [
    {
        "name": "content_type",
        "dataType": ["string"],
        "description": "Type of content",
        "indexInverted": True  # Enable text search
    }
]
```

### Namespace/Collection Strategy

Organize your vectors by content type or source:

```python
# Strategy 1: By content type
namespaces = {
    "tiktok": "tiktok_content",
    "youtube": "youtube_content", 
    "documents": "document_content"
}

# Strategy 2: By language
namespaces = {
    "en": "english_content",
    "es": "spanish_content",
    "fr": "french_content"
}

# Strategy 3: By processing date
namespaces = {
    "2025-01": "january_2025",
    "2025-02": "february_2025"
}
```

### Performance Optimization

#### Pinecone
```python
# Index configuration for optimal performance
index_config = {
    "metric": "cosine",           # Best for text embeddings
    "pod_type": "p1.x1",         # Start small, scale up
    "replicas": 1,               # Add replicas for HA
    "metadata_config": {
        "indexed": ["content_type", "language"]  # Index only searchable fields
    }
}
```

#### ChromaDB
```python
# Collection settings for better performance
collection_metadata = {
    "hnsw:space": "cosine",      # Distance function
    "hnsw:construction_ef": 200, # Higher = better recall
    "hnsw:M": 16                 # Connections per node
}
```

#### Weaviate
```python
# Vector index optimization
vector_index_config = {
    "distance": "cosine",
    "ef": 64,                    # Search quality
    "efConstruction": 128,       # Index build quality
    "maxConnections": 64,        # Graph connectivity
    "vectorCacheMaxObjects": 500000  # Cache size
}
```

## Querying Examples

### Semantic Search

```python
# Pinecone query
query_vector = embed_text("voice assistant technology")
results = index.query(
    vector=query_vector,
    top_k=10,
    include_metadata=True,
    filter={"content_type": {"$eq": "tiktok"}}
)

# ChromaDB query
results = collection.query(
    query_embeddings=[query_vector],
    n_results=10,
    where={"content_type": "tiktok"}
)

# Weaviate query
results = client.query.get("DefaultClass", ["text", "content_type"]) \
    .with_near_vector({"vector": query_vector}) \
    .with_limit(10) \
    .with_where({"path": ["content_type"], "operator": "Equal", "valueString": "tiktok"}) \
    .do()
```

### Hybrid Search (Weaviate)

```python
# Combine vector and keyword search
results = client.query.get("DefaultClass", ["text", "content_type"]) \
    .with_hybrid(
        query="voice technology",
        vector=query_vector,
        alpha=0.7  # Weight: 0=keyword, 1=vector
    ) \
    .with_limit(10) \
    .do()
```

## Troubleshooting

### Common Issues

1. **"Index not found"** (Pinecone)
   - Verify index name and environment
   - Check API key permissions
   - Run index creation script

2. **"Collection does not exist"** (ChromaDB)
   - Ensure collection name matches export
   - Check ChromaDB server is running
   - Verify client connection settings

3. **"Class not found"** (Weaviate)
   - Run schema creation first
   - Check class name capitalization
   - Verify Weaviate server connectivity

### Performance Issues

1. **Slow imports**
   - Reduce batch size
   - Check network connectivity
   - Monitor server resources

2. **High memory usage**
   - Process files one at a time
   - Increase server memory limits
   - Use streaming import for large datasets

### Data Validation

Verify imports with test queries:

```python
# Test data integrity
def verify_import(client, expected_count):
    # Get actual count
    actual_count = get_vector_count(client)
    
    # Compare
    if actual_count != expected_count:
        print(f"Warning: Expected {expected_count}, got {actual_count}")
    
    # Test sample query
    sample_results = sample_query(client)
    print(f"Sample query returned {len(sample_results)} results")
```

This comprehensive integration guide enables seamless deployment of your audio-to-RAG embeddings across all major vector databases with optimized configurations and automated import processes.