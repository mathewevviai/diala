"""
Underlying Models API Endpoints

Provides a list of underlying LLMs available to the application. Initially
integrates with Groq's OpenAI-compatible Models API. Shapes the response in a
simple, frontend-friendly format similar to other public endpoints.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional, AsyncGenerator
import os
import httpx
import logging
from pydantic import BaseModel, Field
import dataclasses
try:
    from groq import Groq
except Exception:  # pragma: no cover - fallback if package missing
    Groq = None  # type: ignore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/underlying-models", tags=["underlying-models"])


# ──────────────────────────────────────────────────────────────────────────────
# Provider: Groq
# ──────────────────────────────────────────────────────────────────────────────

GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
GROQ_API_BASE: str = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")
_groq_client: Optional[Any] = None


def _get_groq_client():
    if Groq is None:
        raise HTTPException(status_code=500, detail="Groq SDK not installed; add 'groq' to backend/requirements.txt")
    global _groq_client
    if _groq_client is None:
        # Groq SDK reads GROQ_API_KEY from env; also allow explicit key
        if GROQ_API_KEY:
            _groq_client = Groq(api_key=GROQ_API_KEY)
        else:
            _groq_client = Groq()
    return _groq_client


async def _fetch_groq_models() -> List[Dict[str, Any]]:
    """Fetch available models from Groq's OpenAI-compatible Models API.

    Returns a list of raw model dicts from the upstream API. If the API key is
    missing, returns a curated static fallback list so the UI can still render.
    """
    # Static fallback if key is missing or request fails
    fallback_ids = [
        "openai/gpt-oss-20b",
        "moonshotai/kimi-k2-instruct",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "gemma-7b-it",
    ]

    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set; returning static fallback model list")
        return [{"id": m, "provider": "groq"} for m in fallback_ids]

    url = f"{GROQ_API_BASE}/models"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code >= 400:
            logger.error("Groq models API failed: %s", resp.text)
            # Fall back to static list for resiliency
            return [{"id": m, "provider": "groq"} for m in fallback_ids]

        data = resp.json()
        models = data.get("data", [])
        # Filter to chat-capable LLMs; exclude STT or tools (best-effort)
        filtered = [m for m in models if isinstance(m, dict) and not str(m.get("id", "")).startswith("whisper")]
        return filtered
    except Exception as e:
        logger.error("Error fetching Groq models: %s", e)
        # Fall back to static list for resiliency
        return [{"id": m, "provider": "groq"} for m in fallback_ids]


def _map_groq_model_to_public_shape(model: Dict[str, Any]) -> Dict[str, Any]:
    """Map a Groq model object to our public schema."""
    model_id = model.get("id") if isinstance(model, dict) else str(model)
    return {
        "id": model_id,
        "label": model_id,
        "provider": "groq",
        "description": "Groq-accelerated LLM",
        "capabilities": {
            "chat": True,
            "streaming": True,
        },
    }


@router.get("/", response_model=List[Dict[str, Any]])
async def list_underlying_models() -> List[Dict[str, Any]]:
    """Return a combined list of available underlying models across providers.

    Currently supports Groq; additional providers can be added later.
    """
    try:
        groq_raw = await _fetch_groq_models()

        groq_models = [_map_groq_model_to_public_shape(m) for m in groq_raw]

        # Optional: allow whitelist/override via env var (comma-separated)
        allow_list_env = os.getenv("UNDERLYING_MODELS_ALLOW")
        if allow_list_env:
            allowed = {m.strip() for m in allow_list_env.split(",") if m.strip()}
            groq_models = [m for m in groq_models if m["id"] in allowed]

        return groq_models
    except Exception as e:
        logger.error(f"Failed to list underlying models: {e}")
        raise HTTPException(status_code=500, detail="Failed to list underlying models")


@router.get("/providers", response_model=List[Dict[str, Any]])
async def list_providers() -> List[Dict[str, Any]]:
    """List configured model providers."""
    providers: List[Dict[str, Any]] = [
        {
            "id": "groq",
            "label": "Groq",
            "baseUrl": GROQ_API_BASE,
            "configured": bool(GROQ_API_KEY),
        }
    ]
    return providers


@router.get("/groq/models", response_model=List[Dict[str, Any]])
async def groq_models_raw() -> List[Dict[str, Any]]:
    """Return raw Groq model objects (debug/advanced use)."""
    models = await _fetch_groq_models()
    # Ensure all entries are dicts
    return [m if isinstance(m, dict) else {"id": str(m)} for m in models]


# ──────────────────────────────────────────────────────────────────────────────
# Chat Completions via Groq (non-streaming and streaming)
# ──────────────────────────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str = Field(..., description="Groq model id, e.g. 'openai/gpt-oss-20b'")
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_completion_tokens: Optional[int] = 2048
    top_p: Optional[float] = 1.0
    reasoning_effort: Optional[str] = None
    stop: Optional[List[str]] = None
def _to_jsonable(value: Any) -> Any:
    """Best-effort conversion of SDK objects to JSON-serializable primitives."""
    try:
        if value is None:
            return None
        # Common pydantic v2
        if hasattr(value, "model_dump") and callable(getattr(value, "model_dump")):
            return value.model_dump()
        # Common pydantic v1
        if hasattr(value, "dict") and callable(getattr(value, "dict")):
            return value.dict()
        # Generic SDKs
        if hasattr(value, "to_dict") and callable(getattr(value, "to_dict")):
            return value.to_dict()
        # Dataclasses
        if dataclasses.is_dataclass(value):
            return dataclasses.asdict(value)
        # Already JSON-friendly
        if isinstance(value, (str, int, float, bool)):
            return value
        if isinstance(value, list):
            return [_to_jsonable(v) for v in value]
        if isinstance(value, dict):
            return {k: _to_jsonable(v) for k, v in value.items()}
        # Fallback to string
        return str(value)
    except Exception:
        return None



@router.post("/chat")
async def chat_completion(payload: ChatRequest) -> Dict[str, Any]:
    """Non-streaming chat completion via Groq."""
    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model=payload.model,
            messages=[m.model_dump() for m in payload.messages],
            temperature=payload.temperature,
            max_completion_tokens=payload.max_completion_tokens,
            top_p=payload.top_p,
            reasoning_effort=payload.reasoning_effort,
            stream=False,
            stop=payload.stop,
        )
        choice = completion.choices[0]
        result: Dict[str, Any] = {
            "id": _to_jsonable(getattr(completion, "id", None)),
            "model": _to_jsonable(getattr(completion, "model", payload.model)),
            "usage": _to_jsonable(getattr(completion, "usage", None)),
            "message": {
                "role": _to_jsonable(getattr(choice.message, "role", "assistant")),
                "content": _to_jsonable(getattr(choice.message, "content", "")),
            },
        }
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Groq chat completion failed: %s", e)
        raise HTTPException(status_code=500, detail="Groq chat completion failed")


async def _stream_groq(payload: ChatRequest) -> AsyncGenerator[bytes, None]:
    client = _get_groq_client()
    try:
        completion = client.chat.completions.create(
            model=payload.model,
            messages=[m.model_dump() for m in payload.messages],
            temperature=payload.temperature,
            max_completion_tokens=payload.max_completion_tokens,
            top_p=payload.top_p,
            reasoning_effort=payload.reasoning_effort,
            stream=True,
            stop=payload.stop,
        )
        for chunk in completion:
            delta = getattr(chunk.choices[0].delta, "content", None) or ""
            if delta:
                yield delta.encode("utf-8")
    except Exception as e:
        logger.error("Groq streaming completion failed: %s", e)
        yield f"[STREAM_ERROR] {e}".encode("utf-8")


@router.post("/chat/stream")
async def chat_completion_stream(payload: ChatRequest):
    """Streaming chat completion via Groq.

    Returns a chunked plain-text stream of tokens. A frontend can consume this
    as a simple text stream.
    """
    return StreamingResponse(_stream_groq(payload), media_type="text/plain")
