"""
Vector Database Service Usage Examples

This module provides practical examples of how to use the VectorDatabaseService
for different scenarios and use cases.
"""

import asyncio
import json
from pathlib import Path
from typing import List, Dict, Any
import logging

from .vector_database_service import (
    VectorDatabaseService,
    VectorRecord,
    VectorExportConfig,
    VectorDatabaseProvider,
    ExportFormat,
    TaskType
)

logger = logging.getLogger(__name__)

class VectorDatabaseExamples:
    """Examples and utilities for vector database operations"""
    
    def __init__(self):
        self.service = VectorDatabaseService()
    
    async def example_1_basic_export(self):
        """
        Example 1: Basic vector export workflow
        
        This example shows how to:
        1. Create vector records from text
        2. Export to different database formats
        3. Generate import scripts
        """
        
        print("📚 Example 1: Basic Vector Export")
        
        # Sample documents
        documents = [
            "The quick brown fox jumps over the lazy dog",
            "Machine learning is a subset of artificial intelligence",
            "Vector databases enable efficient similarity search",
            "Python is a popular programming language for data science",
            "Natural language processing helps computers understand text"
        ]
        
        # Create export for Pinecone
        print("\n🔸 Creating Pinecone export...")
        pinecone_export = await self.service.create_sample_export(
            texts=documents,
            provider=VectorDatabaseProvider.PINECONE,
            format=ExportFormat.JSON,
            embedding_service="jina"
        )
        
        print(f"✅ Created {pinecone_export['record_count']} records")
        print(f"📊 Vector dimensions: {pinecone_export['metadata']['vector_statistics']['dimensions']}")
        
        # Show sample import script
        print("\n📜 Sample Pinecone import script:")
        print(pinecone_export['import_scripts']['python'][:500] + "...")
        
        return pinecone_export
    
    async def example_2_multi_provider_export(self):
        """
        Example 2: Export same data to multiple providers
        
        This example demonstrates how to export the same vector data
        to different database providers with appropriate formatting.
        """
        
        print("\n📚 Example 2: Multi-Provider Export")
        
        # Create sample vector records
        sample_records = []
        for i in range(10):
            record = VectorRecord(
                id=f"doc_{i:03d}",
                vector=[0.1 * j for j in range(768)],  # 768-dim vector
                text=f"Sample document {i} with content about topic {i % 3}",
                metadata={
                    "document_id": i,
                    "topic": f"topic_{i % 3}",
                    "length": 50 + i * 10,
                    "category": "sample"
                },
                source="example_dataset",
                model="example_model",
                task_type=TaskType.RETRIEVAL_DOCUMENT.value
            )
            sample_records.append(record)
        
        # Export to all providers
        providers = [
            VectorDatabaseProvider.PINECONE,
            VectorDatabaseProvider.CHROMADB,
            VectorDatabaseProvider.WEAVIATE
        ]
        
        exports = {}
        for provider in providers:
            print(f"\n🔸 Exporting to {provider.value}...")
            
            config = VectorExportConfig(
                provider=provider,
                format=ExportFormat.JSON,
                namespace=f"example_{provider.value}",
                batch_size=5
            )
            
            export_data = await self.service.prepare_vector_export(sample_records, config)
            exports[provider.value] = export_data
            
            print(f"✅ {provider.value}: {export_data['record_count']} records")
        
        # Compare export formats
        print("\n📊 Export Format Comparison:")
        for provider, export_data in exports.items():
            size_estimate = self.service.estimate_export_size(sample_records, ExportFormat.JSON)
            print(f"  {provider}: {size_estimate['size_mb']} MB estimated")
        
        return exports
    
    async def example_3_csv_parquet_export(self):
        """
        Example 3: Export to different file formats
        
        This example shows how to export vector data to CSV and Parquet
        formats for data analysis and storage efficiency.
        """
        
        print("\n📚 Example 3: CSV and Parquet Export")
        
        # Create sample records
        records = []
        for i in range(5):
            record = VectorRecord(
                id=f"item_{i}",
                vector=[float(j) for j in range(50)],  # Smaller vectors for demo
                text=f"Item {i} description",
                metadata={"category": "electronics", "price": 100 + i * 50},
                source="product_catalog"
            )
            records.append(record)
        
        # Export to different formats
        formats = [ExportFormat.JSON, ExportFormat.CSV, ExportFormat.PARQUET]
        
        for format in formats:
            print(f"\n🔸 Exporting to {format.value}...")
            
            config = VectorExportConfig(
                provider=VectorDatabaseProvider.CHROMADB,
                format=format,
                namespace="products",
                output_path=f"exports/products.{format.value}"
            )
            
            export_data = await self.service.prepare_vector_export(records, config)
            size_estimate = self.service.estimate_export_size(records, format)
            
            print(f"✅ {format.value}: {size_estimate['size_mb']} MB estimated")
            print(f"📁 Saved to: {config.output_path}")
    
    async def example_4_large_dataset_processing(self):
        """
        Example 4: Processing large datasets with batching
        
        This example demonstrates how to handle large datasets
        efficiently with proper batching and memory management.
        """
        
        print("\n📚 Example 4: Large Dataset Processing")
        
        # Simulate large dataset
        dataset_size = 1000
        batch_size = 100
        
        print(f"🔸 Processing {dataset_size} records in batches of {batch_size}...")
        
        # Process in batches to avoid memory issues
        all_records = []
        for batch_start in range(0, dataset_size, batch_size):
            batch_end = min(batch_start + batch_size, dataset_size)
            batch_records = []
            
            for i in range(batch_start, batch_end):
                record = VectorRecord(
                    id=f"large_doc_{i:06d}",
                    vector=[0.01 * j for j in range(1024)],  # 1024-dim
                    text=f"Large document {i} with extensive content...",
                    metadata={
                        "doc_id": i,
                        "batch": batch_start // batch_size,
                        "size": "large"
                    },
                    source="large_dataset"
                )
                batch_records.append(record)
            
            all_records.extend(batch_records)
            print(f"  📦 Processed batch {batch_start // batch_size + 1}: {len(batch_records)} records")
        
        # Export with optimized configuration
        config = VectorExportConfig(
            provider=VectorDatabaseProvider.WEAVIATE,
            format=ExportFormat.PARQUET,  # Most efficient for large datasets
            namespace="large_dataset",
            batch_size=batch_size,
            output_path="exports/large_dataset.parquet"
        )
        
        print(f"\n🔸 Exporting {len(all_records)} records to Weaviate...")
        export_data = await self.service.prepare_vector_export(all_records, config)
        
        # Show performance metrics
        size_estimate = self.service.estimate_export_size(all_records, ExportFormat.PARQUET)
        print(f"✅ Export completed:")
        print(f"  📊 Records: {export_data['record_count']}")
        print(f"  📏 Size: {size_estimate['size_mb']} MB")
        print(f"  ⏱️  Time: {size_estimate['estimated_time_seconds']} seconds")
        
        return export_data
    
    async def example_5_metadata_enrichment(self):
        """
        Example 5: Advanced metadata enrichment
        
        This example shows how to enrich vector records with
        additional metadata for better search and filtering.
        """
        
        print("\n📚 Example 5: Metadata Enrichment")
        
        # Create records with rich metadata
        records = []
        categories = ["technology", "science", "business", "health", "education"]
        
        for i in range(20):
            # Rich metadata
            metadata = {
                "category": categories[i % len(categories)],
                "subcategory": f"sub_{i % 3}",
                "importance": i % 5 + 1,
                "tags": [f"tag_{j}" for j in range(i % 3 + 1)],
                "author": f"author_{i % 4}",
                "created_date": f"2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}",
                "word_count": 100 + i * 20,
                "language": "en",
                "sentiment": ["positive", "negative", "neutral"][i % 3],
                "confidence": 0.7 + (i % 3) * 0.1
            }
            
            record = VectorRecord(
                id=f"enriched_{i:03d}",
                vector=[0.02 * j for j in range(512)],
                text=f"Enriched document {i} about {metadata['category']}",
                metadata=metadata,
                source="enriched_dataset",
                model="enriched_model",
                task_type=TaskType.CLASSIFICATION.value
            )
            records.append(record)
        
        # Export with metadata focus
        config = VectorExportConfig(
            provider=VectorDatabaseProvider.CHROMADB,
            format=ExportFormat.JSON,
            namespace="enriched_data",
            include_metadata=True,
            include_text=True
        )
        
        export_data = await self.service.prepare_vector_export(records, config)
        
        print(f"✅ Enriched export created with {export_data['record_count']} records")
        print(f"📊 Metadata fields: {list(records[0].metadata.keys())}")
        
        # Show metadata statistics
        metadata_stats = export_data['metadata']['vector_statistics']
        print(f"📈 Statistics: {json.dumps(metadata_stats, indent=2)}")
        
        return export_data
    
    async def example_6_custom_validation(self):
        """
        Example 6: Custom validation and quality checks
        
        This example demonstrates advanced validation techniques
        for ensuring vector data quality.
        """
        
        print("\n📚 Example 6: Custom Validation")
        
        # Create test records with various quality issues
        test_records = [
            # Good records
            VectorRecord(id="good_1", vector=[0.1, 0.2, 0.3], text="Good record", metadata={"quality": "high"}),
            VectorRecord(id="good_2", vector=[0.4, 0.5, 0.6], text="Another good record", metadata={"quality": "high"}),
            
            # Problematic records
            VectorRecord(id="empty_vector", vector=[], text="Empty vector", metadata={"quality": "low"}),
            VectorRecord(id="nan_values", vector=[0.1, float('nan'), 0.3], text="NaN values", metadata={"quality": "low"}),
            VectorRecord(id="zero_vector", vector=[0.0, 0.0, 0.0], text="Zero vector", metadata={"quality": "medium"}),
            VectorRecord(id="large_values", vector=[1000.0, 2000.0, 3000.0], text="Large values", metadata={"quality": "medium"}),
        ]
        
        print(f"🔍 Validating {len(test_records)} records...")
        
        # Validate records
        valid_records = await self.service._validate_vector_data(test_records)
        
        print(f"✅ Valid records: {len(valid_records)}")
        print(f"❌ Invalid records: {len(test_records) - len(valid_records)}")
        
        # Show validation results
        for record in test_records:
            is_valid = record in valid_records
            status = "✅ VALID" if is_valid else "❌ INVALID"
            print(f"  {status}: {record.id} - {record.metadata['quality']}")
        
        return valid_records
    
    async def run_all_examples(self):
        """Run all examples in sequence"""
        
        print("🚀 Running All Vector Database Service Examples")
        print("=" * 60)
        
        # Create output directory
        Path("exports").mkdir(exist_ok=True)
        
        # Run examples
        examples = [
            self.example_1_basic_export,
            self.example_2_multi_provider_export,
            self.example_3_csv_parquet_export,
            self.example_4_large_dataset_processing,
            self.example_5_metadata_enrichment,
            self.example_6_custom_validation
        ]
        
        results = []
        for i, example in enumerate(examples, 1):
            try:
                print(f"\n{'='*60}")
                result = await example()
                results.append(result)
                print(f"✅ Example {i} completed successfully")
            except Exception as e:
                print(f"❌ Example {i} failed: {e}")
                results.append(None)
        
        print(f"\n🎉 All examples completed!")
        print(f"✅ Successful: {sum(1 for r in results if r is not None)}")
        print(f"❌ Failed: {sum(1 for r in results if r is None)}")
        
        return results

# Utility functions for common operations
class VectorDatabaseUtils:
    """Utility functions for vector database operations"""
    
    @staticmethod
    def create_mock_vectors(count: int, dimensions: int = 768) -> List[List[float]]:
        """Create mock vector data for testing"""
        import random
        
        vectors = []
        for i in range(count):
            # Create normalized random vector
            vector = [random.gauss(0, 1) for _ in range(dimensions)]
            # Normalize
            magnitude = sum(x**2 for x in vector)**0.5
            if magnitude > 0:
                vector = [x / magnitude for x in vector]
            vectors.append(vector)
        
        return vectors
    
    @staticmethod
    def analyze_vector_distribution(vectors: List[List[float]]) -> Dict[str, Any]:
        """Analyze the distribution of vector values"""
        if not vectors:
            return {}
        
        # Flatten all vectors
        all_values = [val for vector in vectors for val in vector]
        
        return {
            "count": len(all_values),
            "min": min(all_values),
            "max": max(all_values),
            "mean": sum(all_values) / len(all_values),
            "dimensions": len(vectors[0]) if vectors else 0,
            "vector_count": len(vectors)
        }
    
    @staticmethod
    def generate_test_metadata(index: int) -> Dict[str, Any]:
        """Generate realistic test metadata"""
        categories = ["tech", "science", "business", "arts", "sports"]
        authors = ["Alice", "Bob", "Charlie", "Diana", "Eve"]
        
        return {
            "id": index,
            "category": categories[index % len(categories)],
            "author": authors[index % len(authors)],
            "timestamp": f"2024-{(index % 12) + 1:02d}-{(index % 28) + 1:02d}",
            "word_count": 100 + index * 50,
            "importance": (index % 5) + 1,
            "tags": [f"tag_{i}" for i in range(index % 3 + 1)]
        }

# Main execution
async def main():
    """Main function to run examples"""
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run examples
    examples = VectorDatabaseExamples()
    await examples.run_all_examples()

if __name__ == "__main__":
    asyncio.run(main())