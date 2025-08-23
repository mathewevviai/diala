"""
Vector Database Connectors for Diala Voice Agent Platform

This module provides connectors for exporting vector embeddings to different vector databases:
- Pinecone: Cloud-native vector database
- ChromaDB: Open-source embeddings database  
- Weaviate: Vector search engine with GraphQL API

Each connector handles format-specific export logic, schema management, and import script generation.
"""

import json
import csv
import os
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from pathlib import Path
import pandas as pd
import numpy as np
from enum import Enum

logger = logging.getLogger(__name__)


class VectorDBType(str, Enum):
    """Supported vector database types"""
    PINECONE = "pinecone"
    CHROMADB = "chromadb"
    WEAVIATE = "weaviate"


@dataclass
class VectorExportConfig:
    """Configuration for vector export operations"""
    output_directory: str
    batch_size: int = 1000
    include_metadata: bool = True
    compression: bool = True
    generate_import_script: bool = True
    validate_schema: bool = True


@dataclass
class VectorRecord:
    """Standardized vector record format"""
    id: str
    vector: List[float]
    metadata: Dict[str, Any]
    namespace: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "vector": self.vector,
            "metadata": self.metadata,
            "namespace": self.namespace,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class BaseVectorConnector(ABC):
    """Abstract base class for vector database connectors"""
    
    def __init__(self, config: VectorExportConfig):
        self.config = config
        self.db_type = None
        self.output_dir = Path(config.output_directory)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    @abstractmethod
    def export_vectors(self, vectors: List[VectorRecord]) -> Dict[str, Any]:
        """Export vectors to database-specific format"""
        pass
    
    @abstractmethod
    def generate_import_script(self, export_info: Dict[str, Any]) -> str:
        """Generate import script for the target database"""
        pass
    
    @abstractmethod
    def validate_schema(self, vectors: List[VectorRecord]) -> bool:
        """Validate vector data against database schema requirements"""
        pass
    
    def test_connection(self) -> bool:
        """Test connection to vector database (override in subclasses)"""
        logger.warning(f"Connection test not implemented for {self.__class__.__name__}")
        return True


class PineconeConnector(BaseVectorConnector):
    """Pinecone vector database connector"""
    
    def __init__(self, config: VectorExportConfig):
        super().__init__(config)
        self.db_type = VectorDBType.PINECONE
        
    def export_vectors(self, vectors: List[VectorRecord]) -> Dict[str, Any]:
        """Export vectors to Pinecone JSON format"""
        logger.info(f"Exporting {len(vectors)} vectors to Pinecone format")
        
        # Validate schema first
        if self.config.validate_schema and not self.validate_schema(vectors):
            raise ValueError("Vector data failed Pinecone schema validation")
        
        # Group vectors by namespace
        namespace_groups = {}
        for vector in vectors:
            namespace = vector.namespace or "default"
            if namespace not in namespace_groups:
                namespace_groups[namespace] = []
            namespace_groups[namespace].append(vector)
        
        export_files = []
        total_vectors = 0
        
        for namespace, ns_vectors in namespace_groups.items():
            # Process in batches
            for i in range(0, len(ns_vectors), self.config.batch_size):
                batch = ns_vectors[i:i + self.config.batch_size]
                batch_data = {
                    "namespace": namespace,
                    "vectors": []
                }
                
                for vector in batch:
                    pinecone_vector = {
                        "id": vector.id,
                        "values": vector.vector,
                        "metadata": vector.metadata if self.config.include_metadata else {}
                    }
                    batch_data["vectors"].append(pinecone_vector)
                
                # Write batch file
                batch_num = i // self.config.batch_size + 1
                filename = f"pinecone_vectors_{namespace}_batch_{batch_num}.json"
                file_path = self.output_dir / filename
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(batch_data, f, indent=2, ensure_ascii=False)
                
                export_files.append({
                    "file": filename,
                    "namespace": namespace,
                    "vector_count": len(batch),
                    "file_size": file_path.stat().st_size
                })
                total_vectors += len(batch)
        
        # Generate index configuration
        index_config = self._generate_index_config(vectors)
        config_file = self.output_dir / "pinecone_index_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(index_config, f, indent=2)
        
        export_info = {
            "database": "pinecone",
            "export_timestamp": datetime.now().isoformat(),
            "total_vectors": total_vectors,
            "namespaces": list(namespace_groups.keys()),
            "files": export_files,
            "index_config": index_config,
            "batch_size": self.config.batch_size
        }
        
        # Write export metadata
        metadata_file = self.output_dir / "pinecone_export_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(export_info, f, indent=2)
        
        # Generate import script
        if self.config.generate_import_script:
            script_path = self.output_dir / "pinecone_import_script.py"
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(self.generate_import_script(export_info))
        
        logger.info(f"Pinecone export completed: {total_vectors} vectors in {len(export_files)} files")
        return export_info
    
    def _generate_index_config(self, vectors: List[VectorRecord]) -> Dict[str, Any]:
        """Generate Pinecone index configuration"""
        if not vectors:
            return {}
        
        # Get vector dimensions from first vector
        dimension = len(vectors[0].vector)
        
        # Analyze metadata fields
        metadata_fields = set()
        for vector in vectors[:100]:  # Sample first 100 vectors
            if vector.metadata:
                metadata_fields.update(vector.metadata.keys())
        
        return {
            "dimension": dimension,
            "metric": "cosine",
            "pod_type": "p1.x1",
            "pods": 1,
            "metadata_config": {
                "indexed": list(metadata_fields)
            },
            "source_tag": "diala-voice-agent"
        }
    
    def generate_import_script(self, export_info: Dict[str, Any]) -> str:
        """Generate Python script for importing to Pinecone"""
        script = f'''#!/usr/bin/env python3
"""
Pinecone Import Script for Diala Voice Agent Platform
Generated on: {export_info["export_timestamp"]}
Total vectors: {export_info["total_vectors"]}
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

# Data directory
DATA_DIR = Path(__file__).parent

def main():
    """Import vectors to Pinecone"""
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY environment variable is required")
    
    # Initialize Pinecone
    pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
    
    # Load index configuration
    with open(DATA_DIR / "pinecone_index_config.json", "r") as f:
        index_config = json.load(f)
    
    # Create index if it doesn't exist
    if INDEX_NAME not in pinecone.list_indexes():
        print(f"Creating index: {{INDEX_NAME}}")
        pinecone.create_index(
            name=INDEX_NAME,
            dimension=index_config["dimension"],
            metric=index_config["metric"],
            pod_type=index_config.get("pod_type", "p1.x1"),
            pods=index_config.get("pods", 1),
            metadata_config=index_config.get("metadata_config", {{}})
        )
    
    # Get index
    index = pinecone.Index(INDEX_NAME)
    
    # Import vectors from each file
    files = {export_info["files"]}
    
    for file_info in tqdm(files, desc="Processing files"):
        file_path = DATA_DIR / file_info["file"]
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Upsert vectors
        namespace = data["namespace"]
        vectors = data["vectors"]
        
        print(f"Upserting {{len(vectors)}} vectors to namespace: {{namespace}}")
        
        # Batch upsert
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch, namespace=namespace)
        
        print(f"Completed file: {{file_info['file']}}")
    
    # Verify import
    stats = index.describe_index_stats()
    print(f"Index stats: {{stats}}")
    
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
'''
        return script
    
    def validate_schema(self, vectors: List[VectorRecord]) -> bool:
        """Validate vectors against Pinecone schema requirements"""
        if not vectors:
            return True
        
        try:
            # Check vector dimensions consistency
            dimensions = set(len(v.vector) for v in vectors)
            if len(dimensions) > 1:
                logger.error(f"Inconsistent vector dimensions: {dimensions}")
                return False
            
            # Check ID format
            for vector in vectors:
                if not vector.id or not isinstance(vector.id, str):
                    logger.error(f"Invalid vector ID: {vector.id}")
                    return False
                
                # Pinecone ID length limit
                if len(vector.id) > 512:
                    logger.error(f"Vector ID too long: {len(vector.id)} characters")
                    return False
            
            # Check metadata size (Pinecone limit: 40KB per vector)
            for vector in vectors:
                if vector.metadata:
                    metadata_size = len(json.dumps(vector.metadata).encode('utf-8'))
                    if metadata_size > 40960:  # 40KB
                        logger.error(f"Metadata too large: {metadata_size} bytes")
                        return False
            
            return True
            
        except Exception as e:
            logger.error(f"Schema validation failed: {e}")
            return False


class ChromaDBConnector(BaseVectorConnector):
    """ChromaDB vector database connector"""
    
    def __init__(self, config: VectorExportConfig):
        super().__init__(config)
        self.db_type = VectorDBType.CHROMADB
        
    def export_vectors(self, vectors: List[VectorRecord]) -> Dict[str, Any]:
        """Export vectors to ChromaDB CSV/Parquet format"""
        logger.info(f"Exporting {len(vectors)} vectors to ChromaDB format")
        
        # Validate schema
        if self.config.validate_schema and not self.validate_schema(vectors):
            raise ValueError("Vector data failed ChromaDB schema validation")
        
        # Group by collection (namespace)
        collections = {}
        for vector in vectors:
            collection = vector.namespace or "default"
            if collection not in collections:
                collections[collection] = []
            collections[collection].append(vector)
        
        export_files = []
        total_vectors = 0
        
        for collection_name, coll_vectors in collections.items():
            # Prepare DataFrame
            data = []
            for vector in coll_vectors:
                record = {
                    "id": vector.id,
                    "embeddings": json.dumps(vector.vector),
                    "documents": vector.metadata.get("text", ""),
                    "metadatas": json.dumps(vector.metadata) if self.config.include_metadata else "{}"
                }
                data.append(record)
            
            df = pd.DataFrame(data)
            
            # Export as CSV
            csv_filename = f"chromadb_collection_{collection_name}.csv"
            csv_path = self.output_dir / csv_filename
            df.to_csv(csv_path, index=False, encoding='utf-8')
            
            # Export as Parquet (more efficient)
            parquet_filename = f"chromadb_collection_{collection_name}.parquet"
            parquet_path = self.output_dir / parquet_filename
            df.to_parquet(parquet_path, index=False)
            
            export_files.append({
                "collection": collection_name,
                "csv_file": csv_filename,
                "parquet_file": parquet_filename,
                "vector_count": len(coll_vectors),
                "csv_size": csv_path.stat().st_size,
                "parquet_size": parquet_path.stat().st_size
            })
            total_vectors += len(coll_vectors)
        
        # Generate collection configuration
        collection_config = self._generate_collection_config(vectors)
        config_file = self.output_dir / "chromadb_collections_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(collection_config, f, indent=2)
        
        export_info = {
            "database": "chromadb",
            "export_timestamp": datetime.now().isoformat(),
            "total_vectors": total_vectors,
            "collections": list(collections.keys()),
            "files": export_files,
            "collection_config": collection_config,
            "formats": ["csv", "parquet"]
        }
        
        # Write export metadata
        metadata_file = self.output_dir / "chromadb_export_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(export_info, f, indent=2)
        
        # Generate import script
        if self.config.generate_import_script:
            script_path = self.output_dir / "chromadb_import_script.py"
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(self.generate_import_script(export_info))
        
        logger.info(f"ChromaDB export completed: {total_vectors} vectors in {len(export_files)} collections")
        return export_info
    
    def _generate_collection_config(self, vectors: List[VectorRecord]) -> Dict[str, Any]:
        """Generate ChromaDB collection configuration"""
        if not vectors:
            return {}
        
        # Get vector dimensions
        dimension = len(vectors[0].vector)
        
        # Analyze metadata fields
        metadata_fields = set()
        for vector in vectors[:100]:  # Sample first 100 vectors
            if vector.metadata:
                metadata_fields.update(vector.metadata.keys())
        
        return {
            "dimension": dimension,
            "distance_function": "cosine",
            "metadata_fields": list(metadata_fields),
            "embedding_function": "custom",
            "source_tag": "diala-voice-agent"
        }
    
    def generate_import_script(self, export_info: Dict[str, Any]) -> str:
        """Generate Python script for importing to ChromaDB"""
        script = f'''#!/usr/bin/env python3
"""
ChromaDB Import Script for Diala Voice Agent Platform
Generated on: {export_info["export_timestamp"]}
Total vectors: {export_info["total_vectors"]}
"""

import json
import os
from pathlib import Path
import pandas as pd
import chromadb
from tqdm import tqdm

# Configuration
CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chromadb")
CHROMADB_HOST = os.getenv("CHROMADB_HOST", "localhost")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
USE_PERSISTENT = os.getenv("USE_PERSISTENT", "true").lower() == "true"

# Data directory
DATA_DIR = Path(__file__).parent

def main():
    """Import vectors to ChromaDB"""
    
    # Initialize ChromaDB client
    if USE_PERSISTENT:
        client = chromadb.PersistentClient(path=CHROMADB_PATH)
    else:
        client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
    
    # Load collection configuration
    with open(DATA_DIR / "chromadb_collections_config.json", "r") as f:
        config = json.load(f)
    
    # Import each collection
    files = {export_info["files"]}
    
    for file_info in tqdm(files, desc="Processing collections"):
        collection_name = file_info["collection"]
        
        # Create or get collection
        try:
            collection = client.get_collection(name=collection_name)
            print(f"Using existing collection: {{collection_name}}")
        except:
            collection = client.create_collection(
                name=collection_name,
                metadata={{"source": "diala-voice-agent", "dimension": config["dimension"]}}
            )
            print(f"Created new collection: {{collection_name}}")
        
        # Load data from Parquet (preferred) or CSV
        parquet_file = DATA_DIR / file_info["parquet_file"]
        csv_file = DATA_DIR / file_info["csv_file"]
        
        if parquet_file.exists():
            df = pd.read_parquet(parquet_file)
        else:
            df = pd.read_csv(csv_file)
        
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
        
        print(f"Imported {{len(ids)}} vectors to collection: {{collection_name}}")
    
    # Verify import
    print("\\nCollection summary:")
    for file_info in files:
        collection_name = file_info["collection"]
        collection = client.get_collection(name=collection_name)
        count = collection.count()
        print(f"  {{collection_name}}: {{count}} vectors")
    
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
'''
        return script
    
    def validate_schema(self, vectors: List[VectorRecord]) -> bool:
        """Validate vectors against ChromaDB schema requirements"""
        if not vectors:
            return True
        
        try:
            # Check vector dimensions consistency
            dimensions = set(len(v.vector) for v in vectors)
            if len(dimensions) > 1:
                logger.error(f"Inconsistent vector dimensions: {dimensions}")
                return False
            
            # Check ID format
            for vector in vectors:
                if not vector.id or not isinstance(vector.id, str):
                    logger.error(f"Invalid vector ID: {vector.id}")
                    return False
            
            # Check for duplicate IDs within collections
            collections = {}
            for vector in vectors:
                collection = vector.namespace or "default"
                if collection not in collections:
                    collections[collection] = set()
                
                if vector.id in collections[collection]:
                    logger.error(f"Duplicate ID in collection {collection}: {vector.id}")
                    return False
                
                collections[collection].add(vector.id)
            
            return True
            
        except Exception as e:
            logger.error(f"Schema validation failed: {e}")
            return False


class WeaviateConnector(BaseVectorConnector):
    """Weaviate vector database connector"""
    
    def __init__(self, config: VectorExportConfig):
        super().__init__(config)
        self.db_type = VectorDBType.WEAVIATE
        
    def export_vectors(self, vectors: List[VectorRecord]) -> Dict[str, Any]:
        """Export vectors to Weaviate JSON format"""
        logger.info(f"Exporting {len(vectors)} vectors to Weaviate format")
        
        # Validate schema
        if self.config.validate_schema and not self.validate_schema(vectors):
            raise ValueError("Vector data failed Weaviate schema validation")
        
        # Group by class (namespace)
        classes = {}
        for vector in vectors:
            class_name = vector.namespace or "DefaultClass"
            # Weaviate class names must be PascalCase
            class_name = self._to_pascal_case(class_name)
            if class_name not in classes:
                classes[class_name] = []
            classes[class_name].append(vector)
        
        export_files = []
        total_vectors = 0
        
        for class_name, class_vectors in classes.items():
            # Process in batches
            for i in range(0, len(class_vectors), self.config.batch_size):
                batch = class_vectors[i:i + self.config.batch_size]
                
                batch_data = {
                    "class": class_name,
                    "objects": []
                }
                
                for vector in batch:
                    weaviate_object = {
                        "id": vector.id,
                        "class": class_name,
                        "properties": vector.metadata if self.config.include_metadata else {},
                        "vector": vector.vector
                    }
                    
                    # Add timestamp if available
                    if vector.timestamp:
                        weaviate_object["properties"]["timestamp"] = vector.timestamp.isoformat()
                    
                    batch_data["objects"].append(weaviate_object)
                
                # Write batch file
                batch_num = i // self.config.batch_size + 1
                filename = f"weaviate_objects_{class_name}_batch_{batch_num}.json"
                file_path = self.output_dir / filename
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(batch_data, f, indent=2, ensure_ascii=False)
                
                export_files.append({
                    "file": filename,
                    "class": class_name,
                    "object_count": len(batch),
                    "file_size": file_path.stat().st_size
                })
                total_vectors += len(batch)
        
        # Generate schema configuration
        schema_config = self._generate_schema_config(vectors, classes)
        schema_file = self.output_dir / "weaviate_schema_config.json"
        with open(schema_file, 'w', encoding='utf-8') as f:
            json.dump(schema_config, f, indent=2)
        
        export_info = {
            "database": "weaviate",
            "export_timestamp": datetime.now().isoformat(),
            "total_objects": total_vectors,
            "classes": list(classes.keys()),
            "files": export_files,
            "schema_config": schema_config,
            "batch_size": self.config.batch_size
        }
        
        # Write export metadata
        metadata_file = self.output_dir / "weaviate_export_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(export_info, f, indent=2)
        
        # Generate import script
        if self.config.generate_import_script:
            script_path = self.output_dir / "weaviate_import_script.py"
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(self.generate_import_script(export_info))
        
        logger.info(f"Weaviate export completed: {total_vectors} objects in {len(export_files)} files")
        return export_info
    
    def _to_pascal_case(self, name: str) -> str:
        """Convert string to PascalCase for Weaviate class names"""
        # Remove special characters and split by common separators
        words = name.replace('-', ' ').replace('_', ' ').split()
        return ''.join(word.capitalize() for word in words if word)
    
    def _generate_schema_config(self, vectors: List[VectorRecord], classes: Dict[str, List[VectorRecord]]) -> Dict[str, Any]:
        """Generate Weaviate schema configuration"""
        if not vectors:
            return {"classes": []}
        
        # Get vector dimensions
        dimension = len(vectors[0].vector)
        
        schema_classes = []
        
        for class_name, class_vectors in classes.items():
            # Analyze metadata fields for this class
            property_fields = set()
            for vector in class_vectors[:100]:  # Sample first 100 vectors
                if vector.metadata:
                    property_fields.update(vector.metadata.keys())
            
            # Define properties based on metadata analysis
            properties = [
                {
                    "name": "timestamp",
                    "dataType": ["date"],
                    "description": "Timestamp when the vector was created"
                }
            ]
            
            # Add properties based on metadata fields
            for field in property_fields:
                if field == "text":
                    properties.append({
                        "name": "text",
                        "dataType": ["text"],
                        "description": "Original text content"
                    })
                elif field == "source":
                    properties.append({
                        "name": "source",
                        "dataType": ["string"],
                        "description": "Source of the content"
                    })
                elif field == "title":
                    properties.append({
                        "name": "title",
                        "dataType": ["string"],
                        "description": "Title of the content"
                    })
                else:
                    # Generic string property for other fields
                    properties.append({
                        "name": field,
                        "dataType": ["string"],
                        "description": f"Property: {field}"
                    })
            
            class_schema = {
                "class": class_name,
                "description": f"Vector class for {class_name} embeddings from Diala Voice Agent",
                "vectorizer": "none",  # We provide our own vectors
                "properties": properties,
                "vectorIndexConfig": {
                    "distance": "cosine",
                    "ef": 64,
                    "efConstruction": 128,
                    "maxConnections": 64
                }
            }
            
            schema_classes.append(class_schema)
        
        return {
            "classes": schema_classes,
            "dimension": dimension,
            "source_tag": "diala-voice-agent"
        }
    
    def generate_import_script(self, export_info: Dict[str, Any]) -> str:
        """Generate Python script for importing to Weaviate"""
        script = f'''#!/usr/bin/env python3
"""
Weaviate Import Script for Diala Voice Agent Platform
Generated on: {export_info["export_timestamp"]}
Total objects: {export_info["total_objects"]}
"""

import json
import os
from pathlib import Path
import weaviate
from tqdm import tqdm

# Configuration
WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
WEAVIATE_OPENAI_KEY = os.getenv("WEAVIATE_OPENAI_KEY")  # Optional, for additional vectorizers

# Data directory
DATA_DIR = Path(__file__).parent

def main():
    """Import objects to Weaviate"""
    
    # Initialize Weaviate client
    auth_config = None
    if WEAVIATE_API_KEY:
        auth_config = weaviate.AuthApiKey(api_key=WEAVIATE_API_KEY)
    
    additional_headers = {{}}
    if WEAVIATE_OPENAI_KEY:
        additional_headers["X-OpenAI-Api-Key"] = WEAVIATE_OPENAI_KEY
    
    client = weaviate.Client(
        url=WEAVIATE_URL,
        auth_client_secret=auth_config,
        additional_headers=additional_headers
    )
    
    # Test connection
    if not client.is_ready():
        raise Exception("Weaviate server is not ready")
    
    # Load schema configuration
    with open(DATA_DIR / "weaviate_schema_config.json", "r") as f:
        schema_config = json.load(f)
    
    # Create schema if it doesn't exist
    existing_schema = client.schema.get()
    existing_classes = {{cls["class"] for cls in existing_schema.get("classes", [])}}
    
    for class_schema in schema_config["classes"]:
        class_name = class_schema["class"]
        if class_name not in existing_classes:
            print(f"Creating class: {{class_name}}")
            client.schema.create_class(class_schema)
        else:
            print(f"Class already exists: {{class_name}}")
    
    # Import objects from each file
    files = {export_info["files"]}
    
    for file_info in tqdm(files, desc="Processing files"):
        file_path = DATA_DIR / file_info["file"]
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        class_name = data["class"]
        objects = data["objects"]
        
        print(f"Importing {{len(objects)}} objects to class: {{class_name}}")
        
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
        
        print(f"Completed file: {{file_info['file']}}")
    
    # Verify import
    print("\\nClass summary:")
    for class_name in {export_info["classes"]}:
        result = client.query.aggregate(class_name).with_meta_count().do()
        count = result["data"]["Aggregate"][class_name][0]["meta"]["count"]
        print(f"  {{class_name}}: {{count}} objects")
    
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
'''
        return script
    
    def validate_schema(self, vectors: List[VectorRecord]) -> bool:
        """Validate vectors against Weaviate schema requirements"""
        if not vectors:
            return True
        
        try:
            # Check vector dimensions consistency
            dimensions = set(len(v.vector) for v in vectors)
            if len(dimensions) > 1:
                logger.error(f"Inconsistent vector dimensions: {dimensions}")
                return False
            
            # Check ID format (must be valid UUID or string)
            for vector in vectors:
                if not vector.id or not isinstance(vector.id, str):
                    logger.error(f"Invalid vector ID: {vector.id}")
                    return False
            
            # Check class names (namespaces) are valid
            for vector in vectors:
                class_name = vector.namespace or "DefaultClass"
                class_name = self._to_pascal_case(class_name)
                
                # Weaviate class names must start with uppercase letter
                if not class_name[0].isupper():
                    logger.error(f"Invalid class name: {class_name}")
                    return False
            
            # Check property names in metadata
            for vector in vectors:
                if vector.metadata:
                    for key in vector.metadata.keys():
                        # Weaviate property names must start with lowercase letter
                        if not key[0].islower():
                            logger.warning(f"Property name should start with lowercase: {key}")
            
            return True
            
        except Exception as e:
            logger.error(f"Schema validation failed: {e}")
            return False


class VectorDBConnectorFactory:
    """Factory class for creating vector database connectors"""
    
    @staticmethod
    def create_connector(db_type: VectorDBType, config: VectorExportConfig) -> BaseVectorConnector:
        """Create a connector for the specified database type"""
        if db_type == VectorDBType.PINECONE:
            return PineconeConnector(config)
        elif db_type == VectorDBType.CHROMADB:
            return ChromaDBConnector(config)
        elif db_type == VectorDBType.WEAVIATE:
            return WeaviateConnector(config)
        else:
            raise ValueError(f"Unsupported vector database type: {db_type}")


class VectorExportManager:
    """Manager class for vector export operations"""
    
    def __init__(self, output_directory: str):
        self.output_directory = output_directory
        self.export_history = []
    
    def export_to_multiple_formats(
        self, 
        vectors: List[VectorRecord], 
        db_types: List[VectorDBType],
        config: Optional[VectorExportConfig] = None
    ) -> Dict[str, Any]:
        """Export vectors to multiple database formats"""
        
        if config is None:
            config = VectorExportConfig(output_directory=self.output_directory)
        
        results = {}
        
        for db_type in db_types:
            try:
                # Create output subdirectory for each database type
                db_output_dir = Path(self.output_directory) / db_type.value
                db_config = VectorExportConfig(
                    output_directory=str(db_output_dir),
                    batch_size=config.batch_size,
                    include_metadata=config.include_metadata,
                    compression=config.compression,
                    generate_import_script=config.generate_import_script,
                    validate_schema=config.validate_schema
                )
                
                connector = VectorDBConnectorFactory.create_connector(db_type, db_config)
                export_info = connector.export_vectors(vectors)
                results[db_type.value] = export_info
                
                logger.info(f"Successfully exported to {db_type.value}")
                
            except Exception as e:
                logger.error(f"Failed to export to {db_type.value}: {e}")
                results[db_type.value] = {"error": str(e)}
        
        # Save combined export summary
        summary = {
            "export_timestamp": datetime.now().isoformat(),
            "total_vectors": len(vectors),
            "databases": list(db_types),
            "results": results
        }
        
        summary_file = Path(self.output_directory) / "export_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, default=str)
        
        self.export_history.append(summary)
        return summary
    
    def get_export_history(self) -> List[Dict[str, Any]]:
        """Get history of export operations"""
        return self.export_history


# Export format-specific utility functions
def export_to_pinecone_format(vectors: List[VectorRecord], output_dir: str) -> Dict[str, Any]:
    """Convenience function to export to Pinecone format"""
    config = VectorExportConfig(output_directory=output_dir)
    connector = PineconeConnector(config)
    return connector.export_vectors(vectors)


def export_to_chromadb_format(vectors: List[VectorRecord], output_dir: str) -> Dict[str, Any]:
    """Convenience function to export to ChromaDB format"""
    config = VectorExportConfig(output_directory=output_dir)
    connector = ChromaDBConnector(config)
    return connector.export_vectors(vectors)


def export_to_weaviate_format(vectors: List[VectorRecord], output_dir: str) -> Dict[str, Any]:
    """Convenience function to export to Weaviate format"""
    config = VectorExportConfig(output_directory=output_dir)
    connector = WeaviateConnector(config)
    return connector.export_vectors(vectors)


# Connection test utilities
def test_all_connections(output_dir: str) -> Dict[str, bool]:
    """Test connections to all supported vector databases"""
    config = VectorExportConfig(output_directory=output_dir)
    results = {}
    
    for db_type in VectorDBType:
        try:
            connector = VectorDBConnectorFactory.create_connector(db_type, config)
            results[db_type.value] = connector.test_connection()
        except Exception as e:
            logger.error(f"Connection test failed for {db_type.value}: {e}")
            results[db_type.value] = False
    
    return results


if __name__ == "__main__":
    # Example usage
    sample_vectors = [
        VectorRecord(
            id="vec_1",
            vector=[0.1, 0.2, 0.3, 0.4, 0.5],
            metadata={"text": "Sample text", "source": "example"},
            namespace="test_collection"
        ),
        VectorRecord(
            id="vec_2", 
            vector=[0.2, 0.3, 0.4, 0.5, 0.6],
            metadata={"text": "Another sample", "source": "example"},
            namespace="test_collection"
        )
    ]
    
    # Test export to all formats
    export_manager = VectorExportManager("./vector_exports")
    results = export_manager.export_to_multiple_formats(
        vectors=sample_vectors,
        db_types=[VectorDBType.PINECONE, VectorDBType.CHROMADB, VectorDBType.WEAVIATE]
    )
    
    print(json.dumps(results, indent=2, default=str))