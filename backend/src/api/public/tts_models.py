"""
TTS Models Management API

Utilities to download and manage open-source TTS model assets locally under
backend/src/models/<provider> using Hugging Face. This avoids multiple venvs
and centralizes model storage for providers like kokoro, dia, orpheus, sesame, chattts.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from pathlib import Path
import os
import shutil
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts-models", tags=["TTS Models"]) 


MODELS_ROOT = Path(__file__).resolve().parents[3] / "models"
MODELS_ROOT.mkdir(parents=True, exist_ok=True)


class DownloadRequest(BaseModel):
    provider: str = Field(..., description="Provider id: kokoro|dia|orpheus|sesame|chattts|chatterbox")
    repo_id: str = Field(..., description="Hugging Face repo id, e.g. 'org/repo'")
    revision: Optional[str] = Field(None, description="Branch/tag/commit")
    local_dirname: Optional[str] = Field(None, description="Subdir name under models root; defaults to provider")
    allow_patterns: Optional[List[str]] = Field(None, description="Optional file globs to include")
    ignore_patterns: Optional[List[str]] = Field(None, description="Optional globs to exclude")


def _snapshot_download(repo_id: str, target_dir: Path, revision: Optional[str], allow: Optional[List[str]], ignore: Optional[List[str]]) -> List[str]:
    try:
        from huggingface_hub import snapshot_download
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"huggingface_hub not installed: {e}")

    token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
    try:
        snapshot_download(
            repo_id=repo_id,
            revision=revision,
            local_dir=target_dir,
            local_dir_use_symlinks=False,
            allow_patterns=allow,
            ignore_patterns=ignore,
            token=token,
            tqdm_class=None,
        )
    except Exception as e:
        logger.error("snapshot_download failed: %s", e)
        raise HTTPException(status_code=500, detail=f"snapshot_download failed: {e}")

    # Enumerate downloaded files
    files: List[str] = []
    for root, _, fnames in os.walk(target_dir):
        for fname in fnames:
            rel = str(Path(root) / fname)
            files.append(rel)
    return files


@router.get("/status")
async def models_status() -> Dict[str, Any]:
    providers = {}
    if MODELS_ROOT.exists():
        for child in sorted(MODELS_ROOT.iterdir()):
            if child.is_dir():
                files = []
                for root, _, fnames in os.walk(child):
                    for fname in fnames:
                        rel = str(Path(root).relative_to(MODELS_ROOT) / fname)
                        files.append(rel)
                providers[child.name] = {"files": files, "count": len(files)}
    return {"root": str(MODELS_ROOT), "providers": providers}


@router.post("/download")
async def download_models(req: DownloadRequest) -> Dict[str, Any]:
    provider = req.provider.lower()
    dirname = req.local_dirname or provider
    target_dir = MODELS_ROOT / dirname
    target_dir.mkdir(parents=True, exist_ok=True)

    files = _snapshot_download(
        repo_id=req.repo_id,
        target_dir=target_dir,
        revision=req.revision,
        allow=req.allow_patterns,
        ignore=req.ignore_patterns,
    )
    return {
        "provider": provider,
        "repo_id": req.repo_id,
        "revision": req.revision,
        "local_dir": str(target_dir),
        "files_downloaded": len(files),
    }


class CleanupRequest(BaseModel):
    provider: str


@router.post("/cleanup")
async def cleanup_provider(req: CleanupRequest) -> Dict[str, Any]:
    provider = req.provider.lower()
    target_dir = MODELS_ROOT / provider
    if not target_dir.exists():
        return {"provider": provider, "deleted": False, "reason": "not found"}
    shutil.rmtree(target_dir)
    return {"provider": provider, "deleted": True}


@router.post("/preload")
async def preload_from_env() -> Dict[str, Any]:
    """
    If env var TTS_PRELOAD_PROVIDERS is set to comma-separated list, and each
    provider has a corresponding <PROVIDER>_MODEL_REPO env var, download them.
    """
    configured = {}
    results = {}
    providers = [p.strip().lower() for p in (os.getenv("TTS_PRELOAD_PROVIDERS") or "").split(",") if p.strip()]
    for p in providers:
        repo_env = f"{p.upper()}_MODEL_REPO"
        repo_id = os.getenv(repo_env)
        if not repo_id:
            results[p] = {"skipped": True, "reason": f"missing env {repo_env}"}
            continue
        try:
            files = _snapshot_download(repo_id=repo_id, target_dir=MODELS_ROOT / p, revision=None, allow=None, ignore=None)
            results[p] = {"ok": True, "files": len(files)}
        except HTTPException as e:
            results[p] = {"ok": False, "error": e.detail}
        configured[p] = repo_id
    return {"configured": configured, "results": results}
