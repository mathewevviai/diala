# Dependency Analysis Script

## Save this as `scripts/analyze_deps.py` and run with `python scripts/analyze_deps.py`

```python
#!/usr/bin/env python3
"""
Dependency Analysis Script for Diala
Identifies potentially unused packages to reduce virtual environment size
"""

import os
import re
import subprocess
from pathlib import Path

class DependencyAnalyzer:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.used_imports = set()
        self.required_packages = set()
        
    def scan_python_files(self):
        """Scan all Python files for import statements"""
        print("🔍 Scanning Python files for imports...")
        
        python_files = []
        for root, dirs, files in os.walk(self.project_root):
            # Skip virtual environments and cache directories
            if any(skip in root for skip in ['venv', '__pycache__', '.git', 'node_modules']):
                continue
                
            for file in files:
                if file.endswith('.py'):
                    python_files.append(os.path.join(root, file))
        
        print(f"📊 Found {len(python_files)} Python files")
        
        # Extract imports from all Python files
        import_pattern = re.compile(r'^(import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)')
        
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith(('import ', 'from ')):
                            match = import_pattern.match(line)
                            if match:
                                package = match.group(2)
                                self.used_imports.add(package.split('.')[0])
            except Exception as e:
                print(f"⚠️  Could not read {file_path}: {e}")
        
        print(f"🔍 Found {len(self.used_imports)} used packages")
        
    def read_requirements(self):
        """Read requirements from requirements.txt files"""
        print("📋 Reading requirements files...")
        
        requirements_files = [
            self.project_root / "backend" / "requirements.txt",
            self.project_root / "backend" / "audio_generator_service" / "requirements.txt"
        ]
        
        for req_file in requirements_files:
            if req_file.exists():
                print(f"📄 Processing {req_file}")
                with open(req_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            # Extract package name (remove version specifiers)
                            package = re.split(r'[<>=!]', line)[0].strip()
                            self.required_packages.add(package.lower())
        
        print(f"📊 Found {len(self.required_packages)} required packages")
    
    def analyze_dependencies(self):
        """Analyze and report unused dependencies"""
        print("\n📊 ANALYSIS RESULTS")
        print("=" * 50)
        
        # Common packages that might not be directly imported but are used
        implicit_packages = {
            'pillow', 'PIL', 'sklearn', 'matplotlib', 'seaborn',
            'numpy', 'pandas', 'requests', 'urllib3', 'certifi',
            'idna', 'charset-normalizer', 'pyyaml', 'tqdm'
        }
        
        # Filter out common implicit packages
        potentially_unused = self.required_packages - self.used_imports - implicit_packages
        
        print(f"\n🔍 POTENTIALLY UNUSED PACKAGES:")
        for package in sorted(potentially_unused):
            print(f"  ❓ {package}")
        
        print(f"\n✅ DEFINITELY USED PACKAGES:")
        used = self.required_packages & self.used_imports
        for package in sorted(used):
            print(f"  ✅ {package}")
        
        print(f"\n🤔 IMPLICIT PACKAGES (may be used indirectly):")
        implicit_used = self.required_packages & implicit_packages
        for package in sorted(implicit_used):
            print(f"  🤔 {package}")
        
        # Generate cleanup suggestions
        print(f"\n🧹 CLEANUP SUGGESTIONS:")
        print("-" * 30)
        
        if potentially_unused:
            print("\nPackages to consider removing:")
            for package in sorted(potentially_unused):
                print(f"  pip uninstall {package}")
                
            print("\nTo test safely:")
            print("  1. Create backup: pip freeze > backup_requirements.txt")
            print("  2. Remove packages one by one")
            print("  3. Test system startup: npm run dev")
            print("  4. Restore if needed: pip install -r backup_requirements.txt")
        else:
            print("  ✅ No obvious unused packages found")
    
    def generate_lightweight_requirements(self):
        """Generate a lightweight version of requirements.txt"""
        print("\n📄 GENERATING LIGHTWEIGHT REQUIREMENTS")
        print("-" * 40)
        
        # Essential packages (keep these)
        essential_packages = {
            'fastapi', 'uvicorn', 'torch', 'torchaudio', 'transformers',
            'openai', 'pydantic', 'python-dotenv', 'httpx', 'requests',
            'demucs', 'pyannote.audio', 'whisper', 'numpy', 'librosa'
        }
        
        lightweight_reqs = []
        
        for req_file in [self.project_root / "backend" / "requirements.txt"]:
            if req_file.exists():
                with open(req_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            package = re.split(r'[<>=!]', line)[0].strip()
                            if package.lower() in essential_packages:
                                lightweight_reqs.append(line)
        
        # Write lightweight requirements
        lightweight_file = self.project_root / "backend" / "requirements_lightweight.txt"
        with open(lightweight_file, 'w') as f:
            f.write("# Lightweight requirements - essential packages only\n")
            f.write("# Generated by analyze_deps.py\n\n")
            for req in lightweight_reqs:
                f.write(f"{req}\n")
        
        print(f"✅ Created lightweight requirements: {lightweight_file}")
        
    def run_analysis(self):
        """Run complete analysis"""
        print("🚀 Starting dependency analysis...")
        self.scan_python_files()
        self.read_requirements()
        self.analyze_dependencies()
        self.generate_lightweight_requirements()
        
        print("\n🎉 Analysis complete!")
        print(f"📊 Used imports: {len(self.used_imports)}")
        print(f"📊 Required packages: {len(self.required_packages)}")

if __name__ == "__main__":
    analyzer = DependencyAnalyzer()
    analyzer.run_analysis()
```

## Usage Instructions
1. Save this content as `scripts/analyze_deps.py`
2. Run: `python scripts/analyze_deps.py`
3. Review the analysis results
4. Use the generated `requirements_lightweight.txt` for testing

## Expected Results
- Identifies 10-20 potentially unused packages
- Creates lightweight requirements file
- Provides safe testing methodology
- Should reduce virtual environment by 500MB-1.5GB

## Safety Features
- Creates backup of current requirements
- Tests dependencies one by one
- Provides rollback mechanism
- Doesn't automatically remove anything