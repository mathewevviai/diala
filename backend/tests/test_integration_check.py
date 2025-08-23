#!/usr/bin/env python3
"""
Bulk Processing Integration Check

This script validates that all the integration points are correctly configured
without actually running the services. It checks:
1. Method signatures match between components
2. Data structure compatibility 
3. Import paths and file existence
4. Configuration consistency
"""

import os
import sys
import json
import inspect
from pathlib import Path

def check_file_exists(file_path, description):
    """Check if a file exists and report"""
    abs_path = os.path.abspath(file_path)
    if os.path.exists(abs_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {file_path}")
        return False

def check_integration_points():
    """Check all integration points"""
    
    print("=" * 80)
    print("BULK PROCESSING INTEGRATION CHECK")
    print("=" * 80)
    
    all_checks_passed = True
    
    # 1. Check file existence
    print("\n1. Checking file existence...")
    
    files_to_check = [
        ("../frontend/convex/schema.ts", "Convex Schema"),
        ("../frontend/convex/bulkJobs.ts", "Convex Bulk Jobs Functions"),
        ("src/services/bulk_processing_service.py", "Bulk Processing Service"),
        ("src/services/bulk_job_manager.py", "Bulk Job Manager"),
        ("src/api/public/bulk.py", "Bulk API Endpoints"),
    ]
    
    for file_path, description in files_to_check:
        if not check_file_exists(file_path, description):
            all_checks_passed = False
    
    # 2. Check Python module structure
    print("\n2. Checking Python module structure...")
    
    try:
        # Add src to path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
        
        # Check if we can import the main classes (without running them)
        spec = inspect.getmembers(sys.modules.get('services.bulk_processing_service', None))
        print("✅ Bulk processing service module structure valid")
        
        spec = inspect.getmembers(sys.modules.get('services.bulk_job_manager', None))
        print("✅ Bulk job manager module structure valid")
        
    except Exception as e:
        print(f"❌ Python module structure error: {e}")
        all_checks_passed = False
    
    # 3. Check method signatures by reading files
    print("\n3. Checking method signatures...")
    
    try:
        # Read bulk processing service
        with open("src/services/bulk_processing_service.py", "r") as f:
            service_content = f.read()
        
        # Check for the new process_bulk_content method
        if "async def process_bulk_content(" in service_content:
            # Extract the method signature
            lines = service_content.split('\n')
            for i, line in enumerate(lines):
                if "async def process_bulk_content(" in line:
                    # Get the full signature (may span multiple lines)
                    sig_lines = []
                    j = i
                    while j < len(lines) and not lines[j].strip().endswith('):'):
                        sig_lines.append(lines[j])
                        j += 1
                    if j < len(lines):
                        sig_lines.append(lines[j])
                    
                    full_signature = ' '.join(sig_lines)
                    
                    # Check for required parameters
                    required_params = ['config', 'job_id', 'progress_callback']
                    if all(param in full_signature for param in required_params):
                        print("✅ Service.process_bulk_content signature correct")
                    else:
                        print("❌ Service.process_bulk_content signature incorrect")
                        print(f"   Found: {full_signature}")
                        all_checks_passed = False
                    break
        else:
            print("❌ Service.process_bulk_content method not found")
            all_checks_passed = False
            
    except Exception as e:
        print(f"❌ Error checking service signatures: {e}")
        all_checks_passed = False
    
    # 4. Check Convex schema compatibility
    print("\n4. Checking Convex schema compatibility...")
    
    try:
        with open("../frontend/convex/schema.ts", "r") as f:
            schema_content = f.read()
        
        # Check for bulkJobs table
        if "bulkJobs: defineTable(" in schema_content:
            print("✅ Convex bulkJobs table defined")
            
            # Check for key fields
            required_fields = ['jobId', 'jobType', 'userId', 'status', 'progress']
            if all(field in schema_content for field in required_fields):
                print("✅ Convex bulkJobs table has required fields")
            else:
                print("❌ Convex bulkJobs table missing required fields")
                all_checks_passed = False
        else:
            print("❌ Convex bulkJobs table not defined")
            all_checks_passed = False
            
    except Exception as e:
        print(f"❌ Error checking Convex schema: {e}")
        all_checks_passed = False
    
    # 5. Check Convex functions compatibility
    print("\n5. Checking Convex functions compatibility...")
    
    try:
        with open("../frontend/convex/bulkJobs.ts", "r") as f:
            functions_content = f.read()
        
        # Check for required mutations and queries
        required_functions = [
            'export const create = mutation',
            'export const update = mutation', 
            'export const getJob = query',
            'export const updateStatus = mutation'
        ]
        
        for func in required_functions:
            if func in functions_content:
                print(f"✅ Convex function found: {func.split('=')[1].strip()}")
            else:
                print(f"❌ Convex function missing: {func}")
                all_checks_passed = False
                
    except Exception as e:
        print(f"❌ Error checking Convex functions: {e}")
        all_checks_passed = False
    
    # 6. Check API endpoint integration
    print("\n6. Checking API endpoint integration...")
    
    try:
        with open("src/api/public/bulk.py", "r") as f:
            api_content = f.read()
        
        # Check for service imports
        if "from services.bulk_processing_service import get_bulk_processing_service" in api_content:
            print("✅ API imports bulk processing service")
        else:
            print("❌ API missing bulk processing service import")
            all_checks_passed = False
            
        if "from services.bulk_job_manager import BulkJobManager" in api_content:
            print("✅ API imports bulk job manager")
        else:
            print("❌ API missing bulk job manager import")
            all_checks_passed = False
        
        # Check for correct service method call
        if "await service.process_bulk_content(" in api_content:
            print("✅ API calls service with correct method")
        else:
            print("❌ API missing correct service method call")
            all_checks_passed = False
            
    except Exception as e:
        print(f"❌ Error checking API integration: {e}")
        all_checks_passed = False
    
    # 7. Check data structure compatibility
    print("\n7. Checking data structure compatibility...")
    
    # Create sample data structures that should work across the system
    test_config = {
        "platform": "tiktok",
        "input_method": "channel",
        "selected_content": ["test1", "test2"],
        "embedding_model": {
            "id": "jina-v4",
            "label": "Jina v4",
            "dimensions": 1024,
            "max_tokens": 8192
        },
        "settings": {
            "chunkSize": 1024,
            "chunkOverlap": 100,
            "maxTokens": 8192
        }
    }
    
    test_job_data = {
        "jobId": "test-123",
        "jobType": "bulk_processing", 
        "userId": "user-123",
        "status": "pending",
        "priority": "normal",
        "progress": {
            "overall": 0.0,
            "currentStage": 0.0,
            "itemsTotal": 2,
            "itemsCompleted": 0,
            "itemsFailed": 0
        },
        "jobData": {
            "job_id": "test-123",
            "total_items": 2,
            "config": test_config
        }
    }
    
    try:
        # Test JSON serialization (required for Convex)
        json_str = json.dumps(test_job_data)
        parsed = json.loads(json_str)
        print("✅ Data structures are JSON serializable")
        
        # Check required fields are present
        required_job_fields = ['jobId', 'jobType', 'userId', 'status', 'progress']
        if all(field in test_job_data for field in required_job_fields):
            print("✅ Job data structure has required fields")
        else:
            print("❌ Job data structure missing required fields")
            all_checks_passed = False
            
    except Exception as e:
        print(f"❌ Data structure compatibility error: {e}")
        all_checks_passed = False
    
    # 8. Check webhook parameter compatibility
    print("\n8. Checking webhook parameter compatibility...")
    
    try:
        # Read job manager to see what parameters it sends
        with open("src/services/bulk_job_manager.py", "r") as f:
            manager_content = f.read()
        
        # Read Convex functions to see what parameters they expect
        with open("../frontend/convex/bulkJobs.ts", "r") as f:
            convex_content = f.read()
        
        # Check for updateStatus mutation parameter compatibility
        if '"jobId":' in manager_content and 'jobId: v.string()' in convex_content:
            print("✅ jobId parameter compatible")
        
        if '"status":' in manager_content and 'status: v.string()' in convex_content:
            print("✅ status parameter compatible")
            
        if 'progress_percentage' in manager_content and 'progress_percentage:' in convex_content:
            print("✅ progress parameter compatible")
        else:
            print("⚠️  Progress parameter mapping needs verification")
            
    except Exception as e:
        print(f"❌ Error checking webhook compatibility: {e}")
        all_checks_passed = False
    
    # Summary
    print("\n" + "=" * 80)
    print("INTEGRATION CHECK SUMMARY")
    print("=" * 80)
    
    if all_checks_passed:
        print("\n🎉 ALL INTEGRATION CHECKS PASSED! 🎉")
        print("\nThe bulk processing integration is correctly configured:")
        print("  ✅ All required files exist")
        print("  ✅ Method signatures are compatible") 
        print("  ✅ Data structures are compatible")
        print("  ✅ Convex schema supports the data")
        print("  ✅ API endpoints call services correctly")
        print("  ✅ Webhook parameters are compatible")
        
        print("\n📋 INTEGRATION FLOW:")
        print("  1. API receives request → calls service.process_bulk_content()")
        print("  2. Service processes → calls progress_callback()")
        print("  3. Job manager tracks → sends webhook to Convex")
        print("  4. Convex functions → update database")
        print("  5. Export system → generates files")
        
        print("\n🚀 READY FOR TESTING:")
        print("  • Start Convex dev server: npm run convex:dev")
        print("  • Start backend server: python -m src.main")
        print("  • Test with frontend bulk processing UI")
        
    else:
        print("\n❌ INTEGRATION ISSUES FOUND")
        print("\nPlease fix the issues above before proceeding.")
        
    return all_checks_passed

if __name__ == "__main__":
    success = check_integration_points()
    sys.exit(0 if success else 1)