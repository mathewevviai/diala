import os
import time
import json
import tempfile
import requests

API = os.getenv("BACKEND_URL", "http://localhost:8000")


def wait_healthy(timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(f"{API}/health", timeout=3)
            if r.ok and r.json().get("status") == "healthy":
                return True
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError("backend not healthy in time")


def test_chat_then_tts_generates_audio_file():
    wait_healthy()

    # 1) Chat via Groq with kimi-k2-instruct
    chat_url = f"{API}/api/public/underlying-models/chat"
    payload = {
        "model": "moonshotai/kimi-k2-instruct",
        "messages": [
            {"role": "user", "content": "Say a cheerful single sentence about sunny weather."}
        ],
        "temperature": 0.7,
        "max_completion_tokens": 128,
    }
    r = requests.post(chat_url, json=payload, timeout=30)
    assert r.ok, f"chat failed: {r.status_code} {r.text}"
    data = r.json()
    text = data.get("message", {}).get("content")
    assert text and isinstance(text, str), f"no text in chat response: {data}"

    # 2) TTS via unified endpoint (prefer kokoro/google/openai/elevenlabs depending on env)
    provider = os.getenv("TEST_TTS_PROVIDER", "google")
    voice = os.getenv("TEST_TTS_VOICE", None)

    tts_url = f"{API}/api/public/tts/speak"
    r2 = requests.post(tts_url, json={
        "provider": provider,
        "text": text,
        "voice_id": voice,
        "format": "mp3",
    }, timeout=60)
    assert r2.ok, f"tts failed: {r2.status_code} {r2.text}"

    # 3) Save audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
        f.write(r2.content)
        path = f.name

    # 4) Basic sanity: file exists and > 2KB
    stat = os.stat(path)
    assert stat.st_size > 2048, f"audio too small: {stat.st_size}"

    # cleanup
    os.remove(path)
