# Master Cleanup Script and Guide

## Complete Cleanup Strategy

### Quick Start (Run These Commands First)

```bash
# 1. Create scripts directory and files
mkdir -p scripts

# 2. Run safe cleanup (immediate 500MB-2GB savings)
# Copy the cleanup_safe.sh content first, then:
chmod +x scripts/cleanup_safe.sh
./scripts/cleanup_safe.sh

# 3. Analyze dependencies (identify 500MB-1.5GB more savings)
# Copy the analyze_deps.py content first, then:
python scripts/analyze_deps.py

# 4. Test system still works
npm run dev
```

### Step-by-Step Safe Cleanup Process

#### Phase 1: Immediate Safe Cleanup (No Risk)
```bash
# Manual safe cleanup commands
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find /tmp -name "*audio*" -type f -mtime +1 -delete
rm -rf ~/.cache/huggingface/
rm -rf ~/.cache/torch/
pip cache purge
```

#### Phase 2: Dependency Analysis
```bash
# Create lightweight requirements
python scripts/analyze_deps.py

# Test with lightweight requirements
cd backend
pip install -r requirements_lightweight.txt
```

#### Phase 3: Advanced Cleanup (Optional)
```bash
# Remove node_modules and reinstall (if frontend is large)
cd frontend
rm -rf node_modules
npm install --production

# Clean Python virtual environments
cd backend
pip list --format=freeze | grep -v "^-e" | cut -d'=' -f1 | xargs pip uninstall -y
pip install -r requirements_lightweight.txt
```

### Expected Space Savings

| Phase | Space Freed | Risk Level | Time |
|-------|-------------|------------|------|
| Phase 1 (Safe) | 500MB-2GB | None | 2-5 min |
| Phase 2 (Deps) | 500MB-1.5GB | Low | 5-10 min |
| Phase 3 (Aggressive) | 1-3GB | Medium | 10-20 min |
| **Total** | **2-6.5GB** | **Safe** | **20-35 min** |

### Testing Checklist

After each phase, verify:
- [ ] `npm run dev` starts successfully
- [ ] All services start (ports 8000, 8001, 3000)
- [ ] Basic audio upload works
- [ ] No critical errors in logs

### Rollback Plan

If anything breaks:
```bash
# Restore original requirements
cd backend
pip install -r requirements.txt

# Restore frontend
cd frontend
npm install

# Check system
npm run dev
```

### Monitoring Script

Create `scripts/check_space.py`:
```python
#!/usr/bin/env python3
import os
import shutil
from pathlib import Path

def check_space():
    total_size = 0
    for path in ['backend', 'frontend', 'backend/audio_generator_service']:
        if os.path.exists(path):
            total_size += sum(
                f.stat().st_size 
                for f in Path(path).glob('**/*') 
                if f.is_file()
            )
    
    print(f"Total project size: {total_size / (1024**3):.2f} GB")
    
    # Check virtual environments
    venvs = [
        'backend/venv',
        'backend/audio_generator_service/venv_audio',
        'frontend/node_modules'
    ]
    
    for venv in venvs:
        if os.path.exists(venv):
            size = sum(
                f.stat().st_size 
                for f in Path(venv).glob('**/*') 
                if f.is_file()
            )
            print(f"{venv}: {size / (1024**3):.2f} GB")

if __name__ == "__main__":
    check_space()
```

### Summary

**Total estimated space savings: 2-6.5GB**

1. **Start with Phase 1** - guaranteed safe, immediate results
2. **Run Phase 2** - analyze dependencies for additional savings
3. **Test thoroughly** - ensure system functionality
4. **Optional Phase 3** - for maximum space recovery

The cleanup process is designed to be **incremental and safe** - you can stop at any phase and still have significant space savings.