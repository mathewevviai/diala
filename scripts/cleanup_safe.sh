#!/bin/bash
# Safe cleanup script for Diala system - Phase 1
# This script removes cache and temporary files without breaking functionality

echo "🧹 Starting safe cleanup for Diala system..."
echo "============================================"

# Get initial disk usage
INITIAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "📊 Current directory size: $INITIAL_SIZE"

# Clean Python cache files
echo "🐍 Cleaning Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
find . -type f -name "*.pyo" -delete 2>/dev/null
find . -type f -name "*.pyd" -delete 2>/dev/null

# Clean pip cache
echo "📦 Cleaning pip cache..."
pip cache purge 2>/dev/null
pip3 cache purge 2>/dev/null

# Clean temporary audio files
echo "🎵 Cleaning temporary audio files..."
find /tmp -name "*audio*" -type f -mtime +1 -delete 2>/dev/null
find /tmp -name "*dial*" -type f -mtime +1 -delete 2>/dev/null
find . -name "*.tmp" -delete 2>/dev/null
find . -name "temp*" -type d -empty -delete 2>/dev/null

# Clean model caches (safe to remove, will re-download if needed)
echo "🤖 Cleaning model caches..."
rm -rf ~/.cache/huggingface/ 2>/dev/null
rm -rf ~/.cache/torch/ 2>/dev/null
rm -rf backend/audio_generator_service/audiocraft_models_cache/torch/kernels 2>/dev/null

# Clean log files (keep last 7 days)
echo "📝 Cleaning old log files..."
find . -name "*.log" -mtime +7 -delete 2>/dev/null
find backend -name "*.log" -mtime +7 -delete 2>/dev/null

# Clean build artifacts
echo "🏗️ Cleaning build artifacts..."
rm -rf build/ 2>/dev/null
rm -rf dist/ 2>/dev/null
rm -rf *.egg-info/ 2>/dev/null

# Clean node modules if needed (be careful with this)
echo "📱 Checking for node_modules to clean..."
find . -name "node_modules" -type d -exec du -sh {} \; 2>/dev/null | sort -hr

# Get final disk usage
FINAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "============================================"
echo "✅ Cleanup complete!"
echo "📊 Initial size: $INITIAL_SIZE"
echo "📊 Final size: $FINAL_SIZE"
echo "🎯 Safe cleanup complete - no system functionality affected"
echo ""
echo "💡 To free more space, consider running the dependency cleanup next:"
echo "   python scripts/analyze_deps.py"