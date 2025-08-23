"""
Test script for Vector Database Service

This script demonstrates how to use the VectorDatabaseService for exporting
and importing vector embeddings across different database providers.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import List

# Add src to path for imports
import sys
sys.path.append(str(Path(__file__).parent / "src"))

from services.vector_database_service import (
    VectorDatabaseService,
    VectorRecord,
    VectorExportConfig,
    VectorDatabaseProvider,
    ExportFormat,
    TaskType
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_vector_export_service():
    """Test the vector database service with sample data"""
    
    # Initialize service
    service = VectorDatabaseService()
    
    # Create sample texts
    sample_texts = [
        "Artificial intelligence is transforming how we work and live.",
        "Machine learning algorithms can process vast amounts of data.",
        "Natural language processing helps computers understand human language.",
        "Deep learning models are inspired by neural networks in the brain.",
        "Vector databases enable efficient similarity search at scale."
    ]
    
    print("🚀 Testing Vector Database Service")
    print(f"📝 Sample texts: {len(sample_texts)}")
    
    # Test 1: Create sample export with Jina embeddings
    print("\n1️⃣ Testing Jina embeddings export...")
    try:
        jina_export = await service.create_sample_export(
            texts=sample_texts,
            provider=VectorDatabaseProvider.PINECONE,
            format=ExportFormat.JSON,
            embedding_service="jina"
        )
        
        print(f"✅ Jina export created with {jina_export['record_count']} records")
        print(f"📊 Metadata: {json.dumps(jina_export['metadata']['vector_statistics'], indent=2)}")
        
        # Save to file
        output_path = Path("test_exports/jina_pinecone_export.json")
        output_path.parent.mkdir(exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(jina_export, f, indent=2, default=str)
        print(f"💾 Saved to: {output_path}")
        
    except Exception as e:
        print(f"❌ Jina export failed: {e}")
    
    # Test 2: Create sample export with Gemini embeddings
    print("\n2️⃣ Testing Gemini embeddings export...")
    try:
        gemini_export = await service.create_sample_export(
            texts=sample_texts,
            provider=VectorDatabaseProvider.CHROMADB,
            format=ExportFormat.JSON,
            embedding_service="gemini"
        )
        
        print(f"✅ Gemini export created with {gemini_export['record_count']} records")
        print(f"📊 Metadata: {json.dumps(gemini_export['metadata']['vector_statistics'], indent=2)}")
        
        # Save to file
        output_path = Path("test_exports/gemini_chromadb_export.json")
        with open(output_path, 'w') as f:
            json.dump(gemini_export, f, indent=2, default=str)
        print(f"💾 Saved to: {output_path}")
        
    except Exception as e:
        print(f"❌ Gemini export failed: {e}")
    
    # Test 3: Test different export formats
    print("\n3️⃣ Testing different export formats...")
    
    # Create mock vector records for format testing
    mock_records = []
    for i, text in enumerate(sample_texts):
        record = VectorRecord(
            id=f"mock_{i}",
            vector=[0.1 * j for j in range(1024)],  # Mock 1024-dim vector
            text=text,
            metadata={
                "index": i,
                "length": len(text),
                "category": "test"
            },
            source="test",
            model="mock",
            task_type=TaskType.RETRIEVAL_DOCUMENT.value
        )
        mock_records.append(record)
    
    # Test each provider and format combination
    providers = [VectorDatabaseProvider.PINECONE, VectorDatabaseProvider.CHROMADB, VectorDatabaseProvider.WEAVIATE]
    formats = [ExportFormat.JSON, ExportFormat.CSV, ExportFormat.PARQUET]
    
    for provider in providers:
        for format in formats:
            print(f"\n🔄 Testing {provider.value} with {format.value} format...")
            
            try:
                config = VectorExportConfig(
                    provider=provider,
                    format=format,
                    namespace=f"test_{provider.value}",
                    batch_size=100
                )
                
                export_data = await service.prepare_vector_export(mock_records, config)
                
                # Estimate size
                size_estimate = service.estimate_export_size(mock_records, format)
                
                print(f"✅ {provider.value} + {format.value}: {export_data['record_count']} records")
                print(f"📏 Estimated size: {size_estimate['size_mb']} MB")
                print(f"⏱️  Estimated time: {size_estimate['estimated_time_seconds']} seconds")
                
                # Save sample export
                output_path = Path(f"test_exports/{provider.value}_{format.value}_export.json")
                with open(output_path, 'w') as f:
                    json.dump({
                        "metadata": export_data["metadata"],
                        "config": export_data["config"],
                        "size_estimate": size_estimate,
                        "import_scripts": export_data["import_scripts"]
                    }, f, indent=2, default=str)
                
            except Exception as e:
                print(f"❌ {provider.value} + {format.value} failed: {e}")
    
    # Test 4: Display provider capabilities
    print("\n4️⃣ Vector Database Provider Capabilities:")
    capabilities = service.get_provider_capabilities()
    
    for provider, info in capabilities.items():
        print(f"\n🔧 {info['name']}")
        print(f"   Description: {info['description']}")
        print(f"   Features: {', '.join(info['features'])}")
        print(f"   Formats: {', '.join(info['supported_formats'])}")
        print(f"   Max dimensions: {info['max_dimensions']}")
        print(f"   Distance metrics: {', '.join(info['distance_metrics'])}")
    
    # Test 5: Generate import scripts
    print("\n5️⃣ Generated Import Scripts:")
    
    # Show sample import script for each provider
    for provider in providers:
        config = VectorExportConfig(
            provider=provider,
            format=ExportFormat.JSON,
            namespace=f"test_{provider.value}"
        )
        
        export_data = await service.prepare_vector_export(mock_records[:2], config)  # Small sample
        scripts = export_data["import_scripts"]
        
        print(f"\n📜 {provider.value.upper()} Import Script:")
        if "python" in scripts:
            # Show first few lines of Python script
            script_lines = scripts["python"].strip().split('\n')
            for line in script_lines[:10]:
                print(f"    {line}")
            if len(script_lines) > 10:
                print(f"    ... ({len(script_lines)-10} more lines)")
        
        # Save full script
        script_path = Path(f"test_exports/{provider.value}_import_script.py")
        with open(script_path, 'w') as f:
            f.write(scripts.get("python", "# No Python script available"))
        print(f"💾 Full script saved to: {script_path}")
    
    print("\n🎉 Vector Database Service testing completed!")
    print("📁 Check the 'test_exports' directory for all generated files.")

async def test_vector_validation():
    """Test vector data validation"""
    
    print("\n🔍 Testing Vector Validation...")
    
    service = VectorDatabaseService()
    
    # Create test records with various issues
    test_records = [
        # Valid record
        VectorRecord(
            id="valid_1",
            vector=[0.1, 0.2, 0.3, 0.4],
            text="This is a valid record",
            metadata={"type": "valid"}
        ),
        # Invalid: empty vector
        VectorRecord(
            id="invalid_empty",
            vector=[],
            text="Empty vector",
            metadata={"type": "invalid"}
        ),
        # Invalid: NaN values
        VectorRecord(
            id="invalid_nan",
            vector=[0.1, float('nan'), 0.3],
            text="NaN values",
            metadata={"type": "invalid"}
        ),
        # Invalid: infinite values
        VectorRecord(
            id="invalid_inf",
            vector=[0.1, float('inf'), 0.3],
            text="Infinite values",
            metadata={"type": "invalid"}
        ),
        # Invalid: non-numeric values
        VectorRecord(
            id="invalid_string",
            vector=[0.1, "not_a_number", 0.3],
            text="String in vector",
            metadata={"type": "invalid"}
        ),
        # Valid record
        VectorRecord(
            id="valid_2",
            vector=[0.5, 0.6, 0.7, 0.8],
            text="Another valid record",
            metadata={"type": "valid"}
        )
    ]
    
    print(f"📥 Testing {len(test_records)} records...")
    
    # Validate records
    validated_records = await service._validate_vector_data(test_records)
    
    print(f"✅ Valid records: {len(validated_records)}")
    print(f"❌ Invalid records: {len(test_records) - len(validated_records)}")
    
    for record in validated_records:
        print(f"   ✓ {record.id}: {record.metadata['type']}")

if __name__ == "__main__":
    # Run the tests
    asyncio.run(test_vector_export_service())
    asyncio.run(test_vector_validation())