"""
Emotion2Vec utility service for lightweight emotion token extraction.
This isolates model loading and inference so multiple endpoints can share it.
"""
from __future__ import annotations
import os
import tempfile
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np

logger = logging.getLogger(__name__)

EMOTION2VEC_AVAILABLE: bool = False
_emotion2vec_model = None
_SAMPLE_RATE = 16000


def _try_import_funasr():
    try:
        from funasr import AutoModel as FunASRAutoModel  # type: ignore
        return FunASRAutoModel
    except Exception as e:
        logger.warning(f"funasr not available for emotion2vec: {e}")
        return None


def _local_candidate_for(hf_id: str) -> Optional[str]:
    try:
        owner, name = hf_id.split("/")
        local_dir = Path.home() / ".cache" / "huggingface" / "hub" / f"models--{owner}--{name}"
        return str(local_dir) if local_dir.exists() else None
    except Exception:
        return None


def _load_emotion2vec_if_needed() -> None:
    global EMOTION2VEC_AVAILABLE, _emotion2vec_model
    if EMOTION2VEC_AVAILABLE and _emotion2vec_model is not None:
        return

    FunASRAutoModel = _try_import_funasr()
    if FunASRAutoModel is None:
        EMOTION2VEC_AVAILABLE = False
        _emotion2vec_model = None
        return

    try:
        override_model_id = os.getenv("EMOTION2VEC_MODEL_ID")
        candidate_models = [m for m in [override_model_id, "iic/emotion2vec_plus_large", "iic/emotion2vec_base"] if m]

        # Temporarily clear HF tokens to avoid 401s on public models
        prev_tokens = {k: os.environ.get(k) for k in ("HUGGINGFACE_HUB_TOKEN", "HUGGINGFACE_TOKEN", "HF_TOKEN")}
        try:
            for k, v in list(prev_tokens.items()):
                if v is not None:
                    os.environ[k] = ""
            last_err: Optional[Exception] = None
            for mid in candidate_models:
                try:
                    local_dir = _local_candidate_for(mid) or mid
                    _emotion2vec_model = FunASRAutoModel(
                        model=local_dir,
                        hub="hf",
                        disable_update=True,
                        device="cpu",
                    )
                    logger.info(f"emotion2vec model loaded: {local_dir}")
                    break
                except Exception as inner_e:  # pragma: no cover - best effort
                    last_err = inner_e
                    _emotion2vec_model = None
            if _emotion2vec_model is None and last_err:
                raise last_err
        finally:
            for k, v in prev_tokens.items():
                if v is not None:
                    os.environ[k] = v
        EMOTION2VEC_AVAILABLE = True
    except Exception as e:  # pragma: no cover - optional dependency
        EMOTION2VEC_AVAILABLE = False
        _emotion2vec_model = None
        logger.warning(f"Could not load emotion2vec model: {e}")


def compute_head_tokens(int16_audio: np.ndarray, head: int = 8) -> Dict[str, Any]:
    """Compute emotion2vec tokens and optional label/scores for an int16 mono array.

    Returns a dict { tokens, label, scores } and safely degrades if not available.
    """
    if int16_audio is None or int16_audio.size == 0:
        return {"tokens": [], "label": None, "scores": None}

    _load_emotion2vec_if_needed()
    if not EMOTION2VEC_AVAILABLE or _emotion2vec_model is None:
        return {"tokens": [], "label": None, "scores": None}

    try:
        import soundfile as sf  # local import
        audio_float = int16_audio.astype(np.float32) / 32768.0
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp_file:
            sf.write(tmp_file.name, audio_float, _SAMPLE_RATE, subtype="PCM_16")
            rec = _emotion2vec_model.generate(
                tmp_file.name,
                granularity="utterance",
                extract_embedding=True,
            )
        if not rec or "feats" not in rec[0]:
            return {"tokens": [], "label": None, "scores": None}
        emb = rec[0]["feats"].astype(np.float32)
        token_head = emb[: head if head > 0 else 8].tolist()
        return {"tokens": token_head, "label": rec[0].get("labels"), "scores": rec[0].get("scores")}
    except Exception as e:  # pragma: no cover - best effort
        logger.warning(f"emotion2vec inference failed: {e}")
        return {"tokens": [], "label": None, "scores": None}
