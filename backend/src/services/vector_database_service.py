"""
Vector Database Integration Service

Provides unified interface for exporting and importing vector embeddings
to/from major vector database providers (Pinecone, ChromaDB, Weaviate).
"""

import asyncio
import json
import csv
import logging
from typing import List, Dict, Any, Optional, Union, Tuple
from pathlib import Path
from datetime import datetime
import hashlib
import uuid
from enum import Enum
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from pydantic import BaseModel, Field

# Import existing embedding services
from .jina.embeddings_service import JinaEmbeddingsService
from .jina.models import JinaEmbeddingData
from .gemini.embeddings_service import GeminiEmbeddingsService
from .gemini.models import GeminiEmbeddingData

logger = logging.getLogger(__name__)

class VectorDatabaseProvider(str, Enum):
    """Supported vector database providers"""
    PINECONE = "pinecone"
    CHROMADB = "chromadb"
    WEAVIATE = "weaviate"

class ExportFormat(str, Enum):
    """Supported export formats"""
    JSON = "json"
    CSV = "csv"
    PARQUET = "parquet"
    VECTOR = "vector"

class TaskType(str, Enum):
    """Task types for optimization"""
    RETRIEVAL_DOCUMENT = "retrieval_document"
    RETRIEVAL_QUERY = "retrieval_query"
    CLASSIFICATION = "classification"
    CLUSTERING = "clustering"
    SEMANTIC_SIMILARITY = "semantic_similarity"

@dataclass
class VectorRecord:
    """Standardized vector record structure"""
    id: str
    vector: List[float]
    metadata: Dict[str, Any]
    text: Optional[str] = None
    timestamp: Optional[datetime] = None
    source: Optional[str] = None
    task_type: Optional[str] = None
    dimensions: Optional[int] = None
    model: Optional[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
        if self.dimensions is None and self.vector:
            self.dimensions = len(self.vector)

class VectorExportConfig(BaseModel):
    """Configuration for vector export operations"""
    
    provider: VectorDatabaseProvider = Field(..., description="Target database provider")
    format: ExportFormat = Field(default=ExportFormat.JSON, description="Export format")
    namespace: Optional[str] = Field(default=None, description="Namespace/collection name")
    index_name: Optional[str] = Field(default=None, description="Index name")
    batch_size: int = Field(default=1000, description="Batch size for processing")
    include_metadata: bool = Field(default=True, description="Include metadata in export")
    include_text: bool = Field(default=True, description="Include original text")
    validate_vectors: bool = Field(default=True, description="Validate vector data")
    output_path: Optional[str] = Field(default=None, description="Output file path")
    
class VectorImportConfig(BaseModel):
    """Configuration for vector import operations"""
    
    provider: VectorDatabaseProvider = Field(..., description="Source database provider")
    format: ExportFormat = Field(default=ExportFormat.JSON, description="Import format")
    input_path: str = Field(..., description="Input file path")
    batch_size: int = Field(default=1000, description="Batch size for processing")
    validate_vectors: bool = Field(default=True, description="Validate vector data")
    create_index: bool = Field(default=False, description="Create index if not exists")
    overwrite_existing: bool = Field(default=False, description="Overwrite existing records")

class VectorDatabaseService:
    """
    Unified service for vector database operations and export/import
    """
    
    def __init__(self):
        """Initialize the vector database service"""
        logger.info("Initializing VectorDatabaseService...")
        self.jina_service = None
        self.gemini_service = None
        self._initialize_embedding_services()
        
    def _initialize_embedding_services(self):
        """Initialize embedding services"""
        try:
            self.jina_service = JinaEmbeddingsService()
            logger.info("Jina embeddings service initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Jina service: {e}")
            
        try:
            self.gemini_service = GeminiEmbeddingsService()
            logger.info("Gemini embeddings service initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini service: {e}")
    
    async def prepare_vector_export(
        self,
        records: List[VectorRecord],
        config: VectorExportConfig
    ) -> Dict[str, Any]:
        """
        Prepare vector data for export to specified database provider
        
        Args:
            records: List of vector records to export
            config: Export configuration
            
        Returns:
            Dictionary with formatted export data
        """
        logger.info(f"Preparing vector export for {config.provider.value} in {config.format.value} format")
        
        # Validate vectors if requested
        if config.validate_vectors:
            records = await self._validate_vector_data(records)
            
        # Generate metadata
        metadata = self._generate_metadata(records, config)
        
        # Format for specific provider
        if config.provider == VectorDatabaseProvider.PINECONE:
            formatted_data = self._format_for_pinecone(records, config)
        elif config.provider == VectorDatabaseProvider.CHROMADB:
            formatted_data = self._format_for_chromadb(records, config)
        elif config.provider == VectorDatabaseProvider.WEAVIATE:
            formatted_data = self._format_for_weaviate(records, config)
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")
            
        # Export in requested format
        export_data = await self._export_in_format(formatted_data, config)
        
        # Generate import scripts
        import_scripts = self._create_import_scripts(formatted_data, config)
        
        result = {
            "metadata": metadata,
            "export_data": export_data,
            "import_scripts": import_scripts,
            "config": config.dict(),
            "record_count": len(records)
        }
        
        # Save to file if path provided
        if config.output_path:
            await self._save_export_data(result, config)
            
        return result
    
    def _format_for_pinecone(self, records: List[VectorRecord], config: VectorExportConfig) -> Dict[str, Any]:
        """Format data for Pinecone database"""
        logger.info("Formatting data for Pinecone")
        
        vectors = []
        for record in records:
            vector_data = {
                "id": record.id,
                "values": record.vector,
                "metadata": record.metadata.copy() if config.include_metadata else {}
            }
            
            # Add text to metadata if included
            if config.include_text and record.text:
                vector_data["metadata"]["text"] = record.text
                
            # Add system metadata
            if config.include_metadata:
                vector_data["metadata"].update({
                    "timestamp": record.timestamp.isoformat() if record.timestamp else None,
                    "source": record.source,
                    "task_type": record.task_type,
                    "dimensions": record.dimensions,
                    "model": record.model
                })
                
            vectors.append(vector_data)
            
        return {
            "provider": "pinecone",
            "namespace": config.namespace or "default",
            "index_name": config.index_name or "embeddings",
            "vectors": vectors,
            "total_vectors": len(vectors)
        }
    
    def _format_for_chromadb(self, records: List[VectorRecord], config: VectorExportConfig) -> Dict[str, Any]:
        """Format data for ChromaDB"""
        logger.info("Formatting data for ChromaDB")
        
        ids = []
        embeddings = []
        metadatas = []
        documents = []
        
        for record in records:
            ids.append(record.id)
            embeddings.append(record.vector)
            
            # Prepare metadata
            metadata = record.metadata.copy() if config.include_metadata else {}
            if config.include_metadata:
                metadata.update({
                    "timestamp": record.timestamp.isoformat() if record.timestamp else None,
                    "source": record.source,
                    "task_type": record.task_type,
                    "dimensions": record.dimensions,
                    "model": record.model
                })
            metadatas.append(metadata)
            
            # Add document text
            documents.append(record.text if config.include_text else "")
            
        return {
            "provider": "chromadb",
            "collection_name": config.namespace or "embeddings",
            "ids": ids,
            "embeddings": embeddings,
            "metadatas": metadatas,
            "documents": documents,
            "total_vectors": len(ids)
        }
    
    def _format_for_weaviate(self, records: List[VectorRecord], config: VectorExportConfig) -> Dict[str, Any]:
        """Format data for Weaviate"""
        logger.info("Formatting data for Weaviate")
        
        objects = []
        for record in records:
            obj = {
                "id": record.id,
                "vector": record.vector,
                "properties": record.metadata.copy() if config.include_metadata else {}
            }
            
            # Add text property
            if config.include_text and record.text:
                obj["properties"]["text"] = record.text
                
            # Add system properties
            if config.include_metadata:
                obj["properties"].update({
                    "timestamp": record.timestamp.isoformat() if record.timestamp else None,
                    "source": record.source or "",
                    "task_type": record.task_type or "",
                    "dimensions": record.dimensions,
                    "model": record.model or ""
                })
                
            objects.append(obj)
            
        return {
            "provider": "weaviate",
            "class_name": config.namespace or "Embeddings",
            "objects": objects,
            "total_objects": len(objects),
            "schema": self._generate_weaviate_schema(records[0] if records else None)
        }
    
    def _generate_weaviate_schema(self, sample_record: Optional[VectorRecord]) -> Dict[str, Any]:
        """Generate Weaviate schema from sample record"""
        if not sample_record:
            return {}
            
        properties = {
            "text": {"dataType": ["text"]},
            "timestamp": {"dataType": ["date"]},
            "source": {"dataType": ["string"]},
            "task_type": {"dataType": ["string"]},
            "dimensions": {"dataType": ["int"]},
            "model": {"dataType": ["string"]}
        }
        
        # Add metadata properties
        for key, value in sample_record.metadata.items():
            if isinstance(value, str):
                properties[key] = {"dataType": ["string"]}
            elif isinstance(value, (int, float)):
                properties[key] = {"dataType": ["number"]}
            elif isinstance(value, bool):
                properties[key] = {"dataType": ["boolean"]}
            else:
                properties[key] = {"dataType": ["string"]}  # Default to string
                
        return {
            "class": "Embeddings",
            "properties": properties,
            "vectorizer": "none"  # We're providing our own vectors
        }
    
    async def _export_in_format(self, data: Dict[str, Any], config: VectorExportConfig) -> Any:
        """Export data in specified format"""
        logger.info(f"Exporting data in {config.format.value} format")
        
        if config.format == ExportFormat.JSON:
            return data
            
        elif config.format == ExportFormat.CSV:
            return self._export_to_csv(data, config)
            
        elif config.format == ExportFormat.PARQUET:
            return self._export_to_parquet(data, config)
            
        elif config.format == ExportFormat.VECTOR:
            return self._export_to_vector_format(data, config)
            
        else:
            raise ValueError(f"Unsupported format: {config.format}")
    
    def _export_to_csv(self, data: Dict[str, Any], config: VectorExportConfig) -> str:
        """Export data to CSV format"""
        logger.info("Converting to CSV format")
        
        if config.provider == VectorDatabaseProvider.PINECONE:
            rows = []
            for vector in data["vectors"]:
                row = {
                    "id": vector["id"],
                    "vector": json.dumps(vector["values"]),
                    "metadata": json.dumps(vector["metadata"])
                }
                rows.append(row)
                
        elif config.provider == VectorDatabaseProvider.CHROMADB:
            rows = []
            for i in range(len(data["ids"])):
                row = {
                    "id": data["ids"][i],
                    "vector": json.dumps(data["embeddings"][i]),
                    "metadata": json.dumps(data["metadatas"][i]),
                    "document": data["documents"][i]
                }
                rows.append(row)
                
        elif config.provider == VectorDatabaseProvider.WEAVIATE:
            rows = []
            for obj in data["objects"]:
                row = {
                    "id": obj["id"],
                    "vector": json.dumps(obj["vector"]),
                    "properties": json.dumps(obj["properties"])
                }
                rows.append(row)
                
        # Convert to CSV string
        if rows:
            import io
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
            return output.getvalue()
        return ""
    
    def _export_to_parquet(self, data: Dict[str, Any], config: VectorExportConfig) -> bytes:
        """Export data to Parquet format"""
        logger.info("Converting to Parquet format")
        
        if config.provider == VectorDatabaseProvider.PINECONE:
            df_data = {
                "id": [v["id"] for v in data["vectors"]],
                "vector": [v["values"] for v in data["vectors"]],
                "metadata": [v["metadata"] for v in data["vectors"]]
            }
            
        elif config.provider == VectorDatabaseProvider.CHROMADB:
            df_data = {
                "id": data["ids"],
                "vector": data["embeddings"],
                "metadata": data["metadatas"],
                "document": data["documents"]
            }
            
        elif config.provider == VectorDatabaseProvider.WEAVIATE:
            df_data = {
                "id": [obj["id"] for obj in data["objects"]],
                "vector": [obj["vector"] for obj in data["objects"]],
                "properties": [obj["properties"] for obj in data["objects"]]
            }
            
        df = pd.DataFrame(df_data)
        
        # Convert to parquet bytes
        import io
        buffer = io.BytesIO()
        df.to_parquet(buffer, index=False)
        return buffer.getvalue()
    
    def _export_to_vector_format(self, data: Dict[str, Any], config: VectorExportConfig) -> Dict[str, Any]:
        """Export data in raw vector format for direct import"""
        logger.info("Converting to raw vector format")
        
        if config.provider == VectorDatabaseProvider.PINECONE:
            return {
                "format": "pinecone_bulk",
                "data": data["vectors"]
            }
            
        elif config.provider == VectorDatabaseProvider.CHROMADB:
            return {
                "format": "chromadb_bulk",
                "data": {
                    "ids": data["ids"],
                    "embeddings": data["embeddings"],
                    "metadatas": data["metadatas"],
                    "documents": data["documents"]
                }
            }
            
        elif config.provider == VectorDatabaseProvider.WEAVIATE:
            return {
                "format": "weaviate_bulk",
                "data": data["objects"]
            }
        
        return data
    
    def _generate_metadata(self, records: List[VectorRecord], config: VectorExportConfig) -> Dict[str, Any]:
        """Generate metadata for the export"""
        logger.info("Generating export metadata")
        
        # Calculate statistics
        dimensions = [len(record.vector) for record in records if record.vector]
        unique_sources = set(record.source for record in records if record.source)
        unique_models = set(record.model for record in records if record.model)
        
        return {
            "export_timestamp": datetime.utcnow().isoformat(),
            "provider": config.provider.value,
            "format": config.format.value,
            "total_records": len(records),
            "vector_statistics": {
                "dimensions": {
                    "min": min(dimensions) if dimensions else 0,
                    "max": max(dimensions) if dimensions else 0,
                    "avg": sum(dimensions) / len(dimensions) if dimensions else 0
                },
                "unique_sources": len(unique_sources),
                "unique_models": len(unique_models)
            },
            "sources": list(unique_sources),
            "models": list(unique_models),
            "config": config.dict()
        }
    
    async def _validate_vector_data(self, records: List[VectorRecord]) -> List[VectorRecord]:
        """Validate vector data quality"""
        logger.info(f"Validating {len(records)} vector records")
        
        valid_records = []
        for record in records:
            if self._is_valid_vector_record(record):
                valid_records.append(record)
            else:
                logger.warning(f"Invalid vector record: {record.id}")
                
        logger.info(f"Validated {len(valid_records)} out of {len(records)} records")
        return valid_records
    
    def _is_valid_vector_record(self, record: VectorRecord) -> bool:
        """Check if a vector record is valid"""
        if not record.id:
            return False
            
        if not record.vector or not isinstance(record.vector, list):
            return False
            
        if not all(isinstance(x, (int, float)) for x in record.vector):
            return False
            
        if len(record.vector) == 0:
            return False
            
        # Check for NaN or infinite values
        if any(np.isnan(x) or np.isinf(x) for x in record.vector):
            return False
            
        return True
    
    def _create_import_scripts(self, data: Dict[str, Any], config: VectorExportConfig) -> Dict[str, str]:
        """Generate import scripts for different database providers"""
        logger.info("Creating import scripts")
        
        scripts = {}
        
        if config.provider == VectorDatabaseProvider.PINECONE:
            scripts["python"] = self._create_pinecone_import_script(data, config)
            scripts["cli"] = self._create_pinecone_cli_script(data, config)
            
        elif config.provider == VectorDatabaseProvider.CHROMADB:
            scripts["python"] = self._create_chromadb_import_script(data, config)
            
        elif config.provider == VectorDatabaseProvider.WEAVIATE:
            scripts["python"] = self._create_weaviate_import_script(data, config)
            scripts["graphql"] = self._create_weaviate_graphql_script(data, config)
            
        return scripts
    
    def _create_pinecone_import_script(self, data: Dict[str, Any], config: VectorExportConfig) -> str:
        """Create Python import script for Pinecone"""
        return f'''
import pinecone
import json
from typing import List, Dict, Any

# Initialize Pinecone
pinecone.init(api_key="YOUR_API_KEY", environment="YOUR_ENVIRONMENT")

# Create or connect to index
index_name = "{data.get('index_name', 'embeddings')}"
namespace = "{data.get('namespace', 'default')}"

if index_name not in pinecone.list_indexes():
    pinecone.create_index(
        name=index_name,
        dimension={len(data['vectors'][0]['values']) if data['vectors'] else 1024},
        metric="cosine"
    )

index = pinecone.Index(index_name)

# Load and import vectors
def import_vectors(vectors: List[Dict[str, Any]], batch_size: int = {config.batch_size}):
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)
        print(f"Imported batch {{i//batch_size + 1}}: {{len(batch)}} vectors")

# Import the data
vectors = {json.dumps(data['vectors'], indent=2)}
import_vectors(vectors)
print(f"Successfully imported {{len(vectors)}} vectors to Pinecone")
'''
    
    def _create_pinecone_cli_script(self, data: Dict[str, Any], config: VectorExportConfig) -> str:
        """Create CLI script for Pinecone"""
        return f'''
# Pinecone CLI Import Script
# Save vectors to file first, then import

# 1. Save vectors to JSON file
echo '{json.dumps(data["vectors"])}' > pinecone_vectors.json

# 2. Create index (replace with your settings)
pinecone create-index {data.get('index_name', 'embeddings')} \\
    --dimension {len(data['vectors'][0]['values']) if data['vectors'] else 1024} \\
    --metric cosine

# 3. Import vectors
pinecone import {data.get('index_name', 'embeddings')} \\
    --namespace {data.get('namespace', 'default')} \\
    --file pinecone_vectors.json
'''
    
    def _create_chromadb_import_script(self, data: Dict[str, Any], config: VectorExportConfig) -> str:
        """Create Python import script for ChromaDB"""
        return f'''
import chromadb
import json
from typing import List, Dict, Any

# Initialize ChromaDB client
client = chromadb.Client()

# Create or get collection
collection_name = "{data.get('collection_name', 'embeddings')}"
collection = client.get_or_create_collection(name=collection_name)

# Load and import data
def import_embeddings(
    ids: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
    documents: List[str],
    batch_size: int = {config.batch_size}
):
    total = len(ids)
    for i in range(0, total, batch_size):
        batch_ids = ids[i:i + batch_size]
        batch_embeddings = embeddings[i:i + batch_size]
        batch_metadatas = metadatas[i:i + batch_size]
        batch_documents = documents[i:i + batch_size]
        
        collection.add(
            ids=batch_ids,
            embeddings=batch_embeddings,
            metadatas=batch_metadatas,
            documents=batch_documents
        )
        print(f"Imported batch {{i//batch_size + 1}}: {{len(batch_ids)}} vectors")

# Import the data
data = {json.dumps(data, indent=2)}
import_embeddings(
    ids=data["ids"],
    embeddings=data["embeddings"],
    metadatas=data["metadatas"],
    documents=data["documents"]
)
print(f"Successfully imported {{len(data['ids'])}} vectors to ChromaDB")
'''
    
    def _create_weaviate_import_script(self, data: Dict[str, Any], config: VectorExportConfig) -> str:
        """Create Python import script for Weaviate"""
        return f'''
import weaviate
import json
from typing import List, Dict, Any

# Initialize Weaviate client
client = weaviate.Client("http://localhost:8080")  # Replace with your Weaviate URL

# Create schema
class_name = "{data.get('class_name', 'Embeddings')}"
schema = {json.dumps(data.get('schema', {}), indent=2)}

# Create class if it doesn't exist
if not client.schema.exists(class_name):
    client.schema.create_class(schema)

# Import objects
def import_objects(objects: List[Dict[str, Any]], batch_size: int = {config.batch_size}):
    total = len(objects)
    for i in range(0, total, batch_size):
        batch = objects[i:i + batch_size]
        
        with client.batch as batch_client:
            batch_client.batch_size = batch_size
            for obj in batch:
                batch_client.add_data_object(
                    data_object=obj["properties"],
                    class_name=class_name,
                    uuid=obj["id"],
                    vector=obj["vector"]
                )
        print(f"Imported batch {{i//batch_size + 1}}: {{len(batch)}} objects")

# Import the data
objects = {json.dumps(data['objects'], indent=2)}
import_objects(objects)
print(f"Successfully imported {{len(objects)}} objects to Weaviate")
'''
    
    def _create_weaviate_graphql_script(self, data: Dict[str, Any], config: VectorExportConfig) -> str:
        """Create GraphQL script for Weaviate"""
        return f'''
# Weaviate GraphQL Import Script
# Use this for bulk import via GraphQL

mutation {{
  objects: [
    {json.dumps(data['objects'][:3], indent=4)}
    # ... add more objects
  ]
}}
'''
    
    async def _save_export_data(self, data: Dict[str, Any], config: VectorExportConfig):
        """Save export data to file"""
        output_path = Path(config.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if config.format == ExportFormat.JSON:
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
                
        elif config.format == ExportFormat.CSV:
            with open(output_path, 'w') as f:
                f.write(data['export_data'])
                
        elif config.format == ExportFormat.PARQUET:
            with open(output_path, 'wb') as f:
                f.write(data['export_data'])
                
        logger.info(f"Export data saved to {output_path}")
    
    async def create_sample_export(
        self,
        texts: List[str],
        provider: VectorDatabaseProvider,
        format: ExportFormat = ExportFormat.JSON,
        embedding_service: str = "jina"
    ) -> Dict[str, Any]:
        """
        Create a sample export with given texts
        
        Args:
            texts: List of texts to embed and export
            provider: Target database provider
            format: Export format
            embedding_service: Embedding service to use ('jina' or 'gemini')
            
        Returns:
            Export data
        """
        logger.info(f"Creating sample export with {len(texts)} texts")
        
        # Generate embeddings
        if embedding_service == "jina" and self.jina_service:
            embeddings = await self.jina_service.embed_documents(texts)
        elif embedding_service == "gemini" and self.gemini_service:
            embeddings = await self.gemini_service.embed_documents(texts)
        else:
            raise ValueError(f"Unsupported embedding service: {embedding_service}")
            
        # Create vector records
        records = []
        for i, (text, embedding) in enumerate(zip(texts, embeddings)):
            record = VectorRecord(
                id=str(uuid.uuid4()),
                vector=embedding,
                text=text,
                metadata={
                    "index": i,
                    "length": len(text),
                    "embedding_service": embedding_service
                },
                source="sample",
                model=embedding_service,
                task_type=TaskType.RETRIEVAL_DOCUMENT.value
            )
            records.append(record)
            
        # Create export configuration
        config = VectorExportConfig(
            provider=provider,
            format=format,
            namespace=f"sample_{embedding_service}",
            batch_size=100
        )
        
        # Prepare export
        return await self.prepare_vector_export(records, config)
    
    def get_provider_capabilities(self) -> Dict[str, Dict[str, Any]]:
        """Get capabilities of supported vector database providers"""
        return {
            "pinecone": {
                "name": "Pinecone",
                "description": "Managed vector database with high performance",
                "features": [
                    "Managed service", "High performance", "Scalable",
                    "Multiple indexes", "Namespaces", "Metadata filtering"
                ],
                "supported_formats": ["json", "csv", "parquet", "vector"],
                "max_dimensions": 40000,
                "max_metadata_size": "40KB",
                "distance_metrics": ["cosine", "euclidean", "dotproduct"]
            },
            "chromadb": {
                "name": "ChromaDB",
                "description": "Open-source embedding database",
                "features": [
                    "Open source", "Local or cloud", "SQL-like queries",
                    "Collections", "Metadata filtering", "Document storage"
                ],
                "supported_formats": ["json", "csv", "parquet", "vector"],
                "max_dimensions": "No limit",
                "max_metadata_size": "No limit",
                "distance_metrics": ["cosine", "euclidean", "ip"]
            },
            "weaviate": {
                "name": "Weaviate",
                "description": "GraphQL-based vector database",
                "features": [
                    "GraphQL API", "Schema-based", "Auto-vectorization",
                    "Hybrid search", "Multi-tenancy", "Modules"
                ],
                "supported_formats": ["json", "csv", "parquet", "vector"],
                "max_dimensions": "No limit",
                "max_metadata_size": "No limit",
                "distance_metrics": ["cosine", "euclidean", "dot", "manhattan"]
            }
        }
    

    def estimate_export_size(self, records: List[VectorRecord], format: ExportFormat) -> Dict[str, Any]:
        """Estimate export file size and processing time"""
        if not records:
            return {"size_bytes": 0, "estimated_time_seconds": 0}
        sample_record = records[0]
        # Use numpy to get accurate byte size if possible, else assume 8 bytes per float
        try:
            vector_size = np.array(sample_record.vector).nbytes
        except Exception:
            vector_size = len(sample_record.vector) * 8  # 8 bytes per float (Python default)
        metadata_size = len(json.dumps(sample_record.metadata))
        text_size = len(sample_record.text) if sample_record.text else 0
        base_size_per_record = vector_size + metadata_size + text_size
        if format == ExportFormat.JSON:
            # JSON has overhead for structure
            estimated_size = base_size_per_record * len(records) * 1.5
        elif format == ExportFormat.CSV:
            # CSV is more compact
            estimated_size = base_size_per_record * len(records) * 1.2
        elif format == ExportFormat.PARQUET:
            # Parquet is most compact
            estimated_size = base_size_per_record * len(records) * 0.8
        else:
            estimated_size = base_size_per_record * len(records)
        # Estimate processing time (rough approximation)
        estimated_time = len(records) / 10000  # 10K records per second
        return {
            "size_bytes": int(estimated_size),
            "size_mb": round(estimated_size / (1024 * 1024), 2),
        
            "estimated_time_seconds": round(estimated_time, 2),
            "records_count": len(records)
        }

# Factory function for compatibility with other modules
def get_vector_db_service() -> VectorDatabaseService:
    """
    Returns a new instance of VectorDatabaseService.
    You can enhance this to use a true singleton if needed.
    """
    return VectorDatabaseService()