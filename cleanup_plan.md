# Diala System Cleanup Plan - Reduce Disk Usage

## Current Space Analysis
The system uses significant disk space primarily from:
- Python virtual environments (2-5GB each)
- Machine learning models (1-3GB)
- Cache and temporary files
- Build artifacts

## Three-Phase Cleanup Strategy

### Phase 1: Safe Cache & Temp Cleanup (Immediate - 500MB-2GB savings)

#### Safe-to-remove files:
1. **Python cache files** - All `__pycache__` directories and `.pyc/.pyo` files
2. **Pip cache** - Downloaded package cache
3. **Temporary audio files** - Processed audio cache
4. **Model download caches** - Temporary model files
5. **Log files** - Old log files (keep recent ones)

### Phase 2: Dependency Optimization (Medium Risk - 1-3GB savings)
- Remove unused packages from requirements
- Use lighter alternatives for some dependencies
- Optimize virtual environment size

### Phase 3: Model Management (Higher Impact - 2-5GB savings)
- Remove unused model variants
- Use smaller model alternatives
- Implement selective model loading

## Implementation Plan

### Step 1: Create Safe Cleanup Script
Create `scripts/cleanup_safe.sh` for immediate space recovery

### Step 2: Create Dependency Analysis
Create `scripts/analyze_deps.py` to identify unused packages

### Step 3: Create Model Cleanup Script
Create `scripts/cleanup_models.py` for model management

## Expected Results
- **Phase 1**: 500MB-2GB immediate savings, 100% safe
- **Phase 2**: Additional 1-3GB savings, 95% safe
- **Phase 3**: Additional 2-5GB savings, requires testing

## Testing Strategy
After each phase:
1. Run `npm run dev` to verify system starts
2. Test core functionality (audio upload, processing)
3. Verify no critical errors in logs