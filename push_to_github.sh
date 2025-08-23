#!/usr/bin/env bash
# push_to_github.sh
# Usage examples:
#   ./push_to_github.sh -m "Initial commit"
#   ./push_to_github.sh -r https://github.com/you/repo.git -m "Update"
#   ./push_to_github.sh --reset -r https://github.com/you/repo.git -m "Fresh start"
#   ./push_to_github.sh -b master -m "Use master"
#   ./push_to_github.sh --force -m "Force push with lease"

set -euo pipefail

RESET=false
REMOTE_URL=""
COMMIT_MSG="update"
BRANCH=""            # auto-detect current branch by default
FORCE=false

# --- args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset) RESET=true; shift ;;
    --force) FORCE=true; shift ;;
    -r|--remote) REMOTE_URL="${2:-}"; shift 2 ;;
    -m|--message) COMMIT_MSG="${2:-}"; shift 2 ;;
    -b|--branch) BRANCH="${2:-}"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--reset] [--force] [-r|--remote URL] [-m|--message MSG] [-b|--branch BRANCH]"
      exit 0
      ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing '$1'"; exit 1; }; }
need git

# --- optional reset ---
if $RESET; then
  echo "⚠️  Resetting git repo (removing .git)..."
  rm -rf .git
fi

# --- init if needed ---
if [[ ! -d .git ]]; then
  echo "Initializing new git repo…"
  git init
fi

# --- detect or set branch ---
if [[ -z "${BRANCH}" ]]; then
  BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  if [[ -z "${BRANCH}" ]]; then
    # fallback: prefer master if exists, else main
    if git show-ref --quiet refs/heads/master; then
      BRANCH="master"
    else
      BRANCH="main"
    fi
  fi
fi

git checkout -B "${BRANCH}"

# --- ensure remote origin ---
if [[ -n "${REMOTE_URL}" ]]; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "${REMOTE_URL}"
  else
    git remote add origin "${REMOTE_URL}"
  fi
else
  if ! git remote get-url origin >/dev/null 2>&1; then
    echo "No remote set. Provide one with -r https://github.com/you/repo.git"
    exit 1
  fi
fi

# --- basic .gitignore if missing ---
if [[ ! -f .gitignore ]]; then
  cat > .gitignore <<'EOF'
# basics
.DS_Store
Thumbs.db
.env
.env.local
__pycache__/
node_modules/
# heavy stuff
models/
data/
checkpoints/
outputs/
runs/
artifacts/
*.ckpt
*.pt
*.bin
*.onnx
*.h5
EOF
  echo "Created a basic .gitignore"
fi

# --- add/commit/push ---
git add -A

if git diff --cached --quiet; then
  # No staged changes; check if anything to push
  if git rev-parse --quiet --verify HEAD >/dev/null; then
    echo "No changes to commit. Pushing current branch anyway…"
  else
    echo "Nothing to commit and no commits exist. Exiting."
    exit 0
  fi
else
  git commit -m "${COMMIT_MSG}"
fi

echo "Pushing to origin/${BRANCH}…"
if $FORCE; then
  git push -u origin "${BRANCH}" --force-with-lease
else
  git push -u origin "${BRANCH}"
fi

echo "✅ Done."
