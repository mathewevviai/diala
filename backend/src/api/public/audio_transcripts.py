# backend/src/api/public/audio_transcripts.py
"""
Audio Transcription API - Public endpoints for transcribing audio files.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import tempfile
import shutil
from dotenv import load_dotenv
from pathlib import Path
from convex import ConvexClient
import mimetypes
from src.services.audio_preparation_service import audio_preparation_service

# Load environment from backend/.env.local and .env explicitly
try:
    BACKEND_ROOT = Path(__file__).resolve().parents[4]
    load_dotenv(BACKEND_ROOT / ".env.local")
    load_dotenv(BACKEND_ROOT / ".env")
except Exception:
    # Fallback to default .env resolution
    load_dotenv()
router = APIRouter()
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
convex_client = ConvexClient(CONVEX_URL)
MAX_FILE_SIZE = 25 * 1024 * 1024
ALLOWED_FORMATS = {"audio/flac": ".flac", "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/mp4": ".mp4", "audio/x-m4a": ".m4a", "audio/ogg": ".ogg", "audio/wav": ".wav", "audio/webm": ".webm", "audio/x-wav": ".wav"}
class JobStatusResponse(BaseModel):
    status: str; job_id: str; message: str
def validate_audio_file(file: UploadFile) -> str:
    if file.size and file.size > MAX_FILE_SIZE: raise HTTPException(status_code=400, detail="File size exceeds 25MB limit.")
    content_type = file.content_type
    if content_type not in ALLOWED_FORMATS:
        guessed_type = mimetypes.guess_type(file.filename)[0]
        if guessed_type not in ALLOWED_FORMATS: raise HTTPException(status_code=400, detail="Invalid file format.")
        content_type = guessed_type
    return ALLOWED_FORMATS[content_type]
def send_convex_webhook(job_id: str, status: str, **kwargs):
    try:
        payload = {"jobId": job_id, "status": status, **kwargs}
        print(f"[LOG] Sending webhook to Convex: {payload}")
        convex_client.mutation("mutations/audioTranscripts:updateResult", payload)
    except Exception as e:
        print(f"Error sending webhook: {e}")

async def process_transcription_job(
    job_id: str,
    user_id: str,
    file_path: str,
    file_name: str,
    file_size: int,
    **kwargs
):
    """Process transcription job asynchronously in the background."""
    try:
        preparation_config = {
            "use_whisper": True, "segment_audio": True, "max_segment_duration": 30,
            "transcribe": True, "clean_silence": True, "separate_voices": True,
            "identify_speakers": True, "min_speakers": 1, "max_speakers": 10,
        }
        
        result = await audio_preparation_service.prepare_audio(
            audio_path=file_path, provider="transcription", config=preparation_config
        )
        
        transcript_text = result.get("transcription", "")
        
        speakers_data: List[Dict] = []
        if result.get("diarization") and result["diarization"].get("segments"):
            for segment in result["diarization"]["segments"]:
                speakers_data.append({
                    "speaker": segment.get("speaker", "SPEAKER_UNKNOWN"),
                    "start": segment.get("start", 0),
                    "end": segment.get("end", 0),
                    "duration": segment.get("duration", 0),
                })
        
        # Optional: LangExtract insights (guarded)
        langextract_insights: Optional[Dict[str, Any]] = None
        try:
            import langextract as lx  # type: ignore
            import os as _os
            api_key = _os.getenv("LANGEXTRACT_API_KEY")
            if api_key and transcript_text:
                prompt = (
                    "Extract sentiment, emotions, and topics from the text. "
                    "Use exact phrases where possible; return concise attributes."
                )
                result_le = lx.extract(
                    text_or_documents=transcript_text,
                    prompt_description=prompt,
                    examples=[],
                    model_id="gemini-2.5-flash",
                    extraction_passes=2,
                    max_workers=4,
                    api_key=api_key,
                )
                # Normalize to simple structure
                analysis = {
                    "emotions": [],
                    "sentiments": [],
                    "topics": [],
                    "engagement": [],
                    "raw_extractions": [],
                }
                for ex in getattr(result_le, "extractions", []) or []:
                    data = {
                        "class": ex.extraction_class,
                        "text": ex.extraction_text,
                        "attributes": ex.attributes or {},
                    }
                    analysis["raw_extractions"].append(data)
                    if ex.extraction_class in analysis:
                        analysis[ex.extraction_class + ("s" if not ex.extraction_class.endswith("s") else "")].append(data)
                langextract_insights = analysis
        except Exception:
            langextract_insights = None

        # This payload now includes speakers and optional insights
        webhook_data = {
            "jobId": job_id,
            "status": "completed",
            "transcript": transcript_text,
            "speakers": speakers_data,
            "langextract": langextract_insights,
        }
        send_convex_webhook(job_id, "completed", transcript=transcript_text, speakers=speakers_data, langextract=langextract_insights)
        
    except Exception as e:
        error_message = f"[TRANSCRIPTION ERROR: {e}]"
        send_convex_webhook(job_id, "failed", error=error_message, transcript=error_message)
    finally:
        try:
            if os.path.exists(file_path): os.remove(file_path)
        except: pass
        audio_preparation_service.cleanup()

@router.post("/transcribe", response_model=JobStatusResponse, summary="Transcribe Audio File")
async def transcribe_audio(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: str = Form(...),
    user_id: str = Form(...),
    # Other form fields are now handled in the background task kwargs
):
    if not request.app.state.models_ready:
        raise HTTPException(status_code=503, detail="The transcription models are still loading. Please try again in a moment.")
    
    file_extension = validate_audio_file(file)
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, f"{job_id}{file_extension}")

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(temp_file_path)

        background_tasks.add_task(
            process_transcription_job,
            job_id=job_id, user_id=user_id, file_path=temp_file_path,
            file_name=file.filename, file_size=file_size
        )
        
        return JobStatusResponse(status="processing", job_id=job_id, message="Audio transcription job accepted.")
    except Exception as e:
        if os.path.exists(temp_file_path): os.remove(temp_file_path)
        if os.path.exists(temp_dir): os.rmdir(temp_dir)
        raise HTTPException(status_code=500, detail=f"Failed to process audio file: {str(e)}")
