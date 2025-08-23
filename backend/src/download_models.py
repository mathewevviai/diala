#!/usr/bin/env python3
"""
Download Chatterbox models before starting the server

This script downloads all required Chatterbox models to avoid timeout issues
during voice cloning operations. It shows progress and can resume partial downloads.

Usage:
    python -m src.download_models
"""

import os
import sys
import time
import logging
from pathlib import Path
from typing import List, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.chatterbox_service import ChatterboxService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Disable some verbose logging
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)


class ModelDownloader:
    """Handles downloading of Chatterbox models with progress tracking"""
    
    def __init__(self):
        self.service = ChatterboxService()
        self.start_time = time.time()
        self.current_stage = ""
        self.current_progress = 0
        
    def progress_callback(self, stage: str, progress: float):
        """Callback for progress updates"""
        self.current_stage = stage
        self.current_progress = progress
        
        # Clear line and print progress
        print(f"\r{stage}: {progress:.1f}%", end="", flush=True)
        
        # Add newline when stage completes
        if progress >= 100:
            print()
    
    def print_summary(self):
        """Print download summary"""
        elapsed = time.time() - self.start_time
        print("\n" + "="*60)
        print("Model Download Summary")
        print("="*60)
        
        # Get download status
        if hasattr(self.service, 'download_progress'):
            print("\nDownloaded files:")
            for filename, status in self.service.download_progress.items():
                if status.get('status') == 'completed':
                    print(f"  ✓ {filename}")
                elif status.get('status') == 'failed':
                    print(f"  ✗ {filename} - {status.get('error', 'Unknown error')}")
        
        print(f"\nTotal time: {elapsed:.2f} seconds")
        
        # Check if model is ready
        if self.service.model_loaded:
            print("\n✅ Model loaded successfully! Ready for voice cloning.")
        else:
            print("\n❌ Model failed to load. Check errors above.")
            if self.service.loading_error:
                print(f"Error: {self.service.loading_error}")
    
    def download_models(self):
        """Download all required models"""
        print("="*60)
        print("Chatterbox Model Downloader")
        print("="*60)
        print("\nThis will download all required models for Chatterbox TTS.")
        print("Models will be cached for future use.\n")
        
        # Check if models are already downloaded
        all_cached = True
        try:
            from huggingface_hub import scan_cache_dir, hf_hub_download
            cache_info = scan_cache_dir()
            
            # Check for Chatterbox models in cache
            chatterbox_cached = False
            for repo in cache_info.repos:
                if "ResembleAI/chatterbox" in str(repo.repo_id):
                    chatterbox_cached = True
                    print(f"ℹ️  Found cached models at: {repo.repo_path}")
                    print(f"   Size: {repo.size_on_disk / (1024**3):.2f} GB")
                    break
            
            if chatterbox_cached:
                print("\n⚠️  Models appear to be cached. Verifying...")
                
                # Check each required file
                required_files = ["ve.pt", "t3_cfg.pt", "s3gen.pt", "tokenizer.json", "conds.pt"]
                for filename in required_files:
                    try:
                        local_path = hf_hub_download(
                            repo_id="ResembleAI/chatterbox",
                            filename=filename,
                            local_files_only=True
                        )
                        file_size = Path(local_path).stat().st_size / (1024**2)
                        print(f"   ✓ {filename} ({file_size:.1f} MB) - cached")
                    except:
                        print(f"   ✗ {filename} - not cached")
                        all_cached = False
                
                if all_cached:
                    print("\n✅ All models are already downloaded!")
                    print("\nVerifying model can load...")
                    try:
                        # Try loading without downloading
                        self.service._load_model(progress_callback=self.progress_callback)
                        print("✅ Model loaded successfully!")
                        return True
                    except Exception as e:
                        print(f"⚠️  Model failed to load: {e}")
                        print("Will re-download models...")
                        all_cached = False
                
        except Exception as e:
            logger.debug(f"Could not check cache: {e}")
            all_cached = False
        
        if not all_cached:
            print("\nStarting download...\n")
            print("⚠️  This may take several minutes depending on your connection speed.")
            print("⚠️  Large files: t3_cfg.pt (~180MB), s3gen.pt (~500MB)")
            print("\nPress Ctrl+C to interrupt. Downloads can be resumed.\n")
            
            try:
                # Force model loading (which triggers downloads)
                self.service._load_model(progress_callback=self.progress_callback)
                
                print("\n✅ All models downloaded successfully!")
                
            except KeyboardInterrupt:
                print("\n\n⚠️  Download interrupted by user.")
                print("Run this script again to resume downloads.")
                return False
                
            except Exception as e:
                print(f"\n\n❌ Error downloading models: {str(e)}")
                logger.exception("Download failed")
                return False
        
        return True
    
    def verify_models(self):
        """Verify that all models are properly downloaded"""
        print("\nVerifying models...")
        
        required_files = ["ve.pt", "t3_cfg.pt", "s3gen.pt", "tokenizer.json", "conds.pt"]
        
        try:
            from huggingface_hub import hf_hub_download, HfFileSystem
            
            fs = HfFileSystem()
            repo_files = fs.ls("ResembleAI/chatterbox", detail=False)
            
            print("\nChecking required files:")
            all_present = True
            
            for filename in required_files:
                try:
                    # Try to get cached file path
                    local_path = hf_hub_download(
                        repo_id="ResembleAI/chatterbox",
                        filename=filename,
                        local_files_only=True
                    )
                    file_size = Path(local_path).stat().st_size / (1024**2)  # MB
                    print(f"  ✓ {filename} ({file_size:.1f} MB)")
                except Exception:
                    print(f"  ✗ {filename} - Not cached")
                    all_present = False
            
            if all_present:
                print("\n✅ All model files are properly cached!")
            else:
                print("\n⚠️  Some files are missing. Run download again.")
                
            return all_present
            
        except Exception as e:
            logger.error(f"Error verifying models: {e}")
            return False


def main():
    """Main entry point"""
    downloader = ModelDownloader()
    
    # Download models
    success = downloader.download_models()
    
    if success:
        # Verify downloads
        downloader.verify_models()
    
    # Print summary
    downloader.print_summary()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()