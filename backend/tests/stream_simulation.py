#!/usr/bin/env python3
"""
Final, Corrected Stream Simulation Script with Stateful Speaker Diarization.
This version implements online clustering with updating centroids to ensure
speaker identity is maintained consistently throughout the conversation, as per
established academic best practices for streaming diarization.
"""

import os
import sys
import logging
import json
import numpy as np
import asyncio
from pathlib import Path
from scipy.spatial.distance import cosine
import textwrap
import langextract as lx
import soundfile as sf
import tempfile
from dotenv import load_dotenv
from datetime import datetime

# Add the project root to the Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables (e.g., LANGEXTRACT_API_KEY) from .env.local and .env
load_dotenv(project_root / ".env.local")
load_dotenv(project_root / ".env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Suppress excessive logging
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("funasr").setLevel(logging.ERROR)
logging.getLogger("speechbrain").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

# Import services and models
from src.services.realtime_analysis_service import get_realtime_analysis_service
from src.services.audio_separation_service import audio_separation_service

try:
    import torch
    import torchaudio
    from speechbrain.pretrained import SepformerSeparation as separator_model
    from speechbrain.pretrained import EncoderClassifier as speaker_id_model
    SPEECHBRAIN_AVAILABLE = True
except ImportError:
    logger.warning("Could not import SpeechBrain. Speaker separation/ID will be unavailable.")
    SPEECHBRAIN_AVAILABLE = False
    
try:
    if 'torch' not in sys.modules:
        import torch
    torch.set_num_threads(1)
    vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=True, trust_repo=True)
    (get_speech_timestamps, _, read_audio, _, _) = utils
    SILERO_AVAILABLE = True
    logger.info("Silero VAD loaded successfully")
except Exception as e:
    logger.warning(f"Could not load Silero VAD: {e}. VAD segmentation will be unavailable.")
    SILERO_AVAILABLE = False

SAMPLE_RATE = 16000

# --- FINAL, STATEFUL SPEAKER IDENTIFIER CLASS ---
class StatefulSpeakerIdentifier:
    """
    Manages speaker voiceprints using online clustering of centroids to provide
    consistent, stateful speaker identification.
    """
    def __init__(self, cache_dir="speaker_id_cache", similarity_threshold=0.60):
        if not SPEECHBRAIN_AVAILABLE:
            raise ImportError("SpeechBrain is not installed.")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"SpeakerIdentifier using device: {self.device}")
        
        self.embedding_model = speaker_id_model.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir=Path(cache_dir) / "spkrec-ecapa-voxceleb",
            run_opts={"device": self.device}
        )
        self.similarity_threshold = similarity_threshold
        
        # FIX #1: The speaker_profiles dictionary now stores the centroid and count.
        # This is the "memory" that gets carried over.
        self.speaker_profiles = {}  # Format: { 'Speaker 1': {'centroid': vector, 'count': N}, ... }
        self.next_speaker_id = 1
        logger.info(f"StatefulSpeakerIdentifier initialized with threshold={self.similarity_threshold}.")

    def _get_embedding(self, audio_chunk_np: np.ndarray):
        """Generates a voice embedding for an audio chunk."""
        if audio_chunk_np.dtype != np.float32:
            audio_chunk_np = audio_chunk_np.astype(np.float32) / 32768.0
        
        audio_tensor = torch.from_numpy(audio_chunk_np).to(self.device)
        with torch.no_grad():
            embedding = self.embedding_model.encode_batch(audio_tensor.unsqueeze(0))
            return embedding.squeeze(0).squeeze(0).cpu().numpy()

    def identify_speaker(self, audio_chunk_np: np.ndarray):
        """
        Identifies a speaker by comparing their voice to stored cluster centroids.
        Updates the matched centroid or creates a new one for an unknown speaker.
        """
        if len(audio_chunk_np) < SAMPLE_RATE * 0.25:
            return "Unknown", 0.0
            
        current_embedding = self._get_embedding(audio_chunk_np)

        # Handle the very first speaker
        if not self.speaker_profiles:
            new_speaker_name = f"Speaker {self.next_speaker_id}"
            # FIX #2: Create the first speaker profile with its centroid and count.
            self.speaker_profiles[new_speaker_name] = {'centroid': current_embedding, 'count': 1}
            self.next_speaker_id += 1
            logger.info(f"Enrolled first speaker: {new_speaker_name}")
            return new_speaker_name, 1.0

        # Compare the current voice to the centroid of each known speaker
        best_match_speaker = "Unknown"
        highest_similarity = -1

        for name, profile in self.speaker_profiles.items():
            similarity = 1 - cosine(current_embedding, profile['centroid'])
            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match_speaker = name

        # Decision logic based on the closest match
        if highest_similarity >= self.similarity_threshold:
            # FIX #3: This is the critical centroid update logic.
            # It updates the speaker's profile with the new embedding, making it more robust.
            profile_to_update = self.speaker_profiles[best_match_speaker]
            old_centroid = profile_to_update['centroid']
            old_count = profile_to_update['count']
            
            # Calculate the new running average for the centroid
            new_centroid = (old_centroid * old_count + current_embedding) / (old_count + 1)
            
            # Update the stored profile
            self.speaker_profiles[best_match_speaker]['centroid'] = new_centroid
            self.speaker_profiles[best_match_speaker]['count'] += 1
            
            logger.info(f"Matched existing speaker: {best_match_speaker}. Updating profile (count: {old_count + 1}).")
            return best_match_speaker, highest_similarity
        else:
            # No close match, enroll as a new speaker by creating a new cluster
            new_speaker_name = f"Speaker {self.next_speaker_id}"
            self.speaker_profiles[new_speaker_name] = {'centroid': current_embedding, 'count': 1}
            self.next_speaker_id += 1
            logger.info(f"Enrolled new speaker: {new_speaker_name} (highest similarity to others: {highest_similarity:.2f})")
            return new_speaker_name, highest_similarity

# --- START: LangExtract Integration ---
class LangExtractStreamAnalyzer:
    """
    Uses LangExtract to extract structured information from transcribed text
    in streaming audio, providing detailed sentiment and contextual analysis.
    """
    
    def __init__(self):
        self.prompt = textwrap.dedent("""
            Extract comprehensive information from the transcribed text including:
            1. Speaker emotional states (happy, sad, angry, neutral, anxious, excited, frustrated)
            2. Sentiment analysis (positive, negative, neutral, mixed)
            3. Conversation topics and themes
            4. Speaker engagement level (high, medium, low)
            5. Key phrases or important statements
            6. Turn-taking indicators
            
            Provide exact text extractions with contextual attributes.
        """)
        
        self.examples = [
            lx.data.ExampleData(
                text="I'm really disappointed with this service, it's been terrible.",
                extractions=[
                    lx.data.Extraction(
                        extraction_class="emotion",
                        extraction_text="disappointed",
                        attributes={"type": "negative", "intensity": "high", "context": "service quality"}
                    ),
                    lx.data.Extraction(
                        extraction_class="sentiment",
                        extraction_text="negative",
                        attributes={"confidence": "high", "trigger": "terrible service"}
                    ),
                    lx.data.Extraction(
                        extraction_class="topic",
                        extraction_text="service quality",
                        attributes={"category": "customer_service", "sentiment": "negative"}
                    )
                ]
            ),
            lx.data.ExampleData(
                text="That's wonderful news! I'm so happy to hear about your promotion.",
                extractions=[
                    lx.data.Extraction(
                        extraction_class="emotion",
                        extraction_text="happy",
                        attributes={"type": "positive", "intensity": "high", "context": "promotion news"}
                    ),
                    lx.data.Extraction(
                        extraction_class="engagement",
                        extraction_text="high",
                        attributes={"type": "enthusiastic", "response": "excitement"}
                    )
                ]
            )
        ]
        # Collect raw Result objects when API-backed extraction is used
        self._raw_results = []
    
    def analyze_transcription(self, text: str) -> dict:
        """Analyze transcribed text using LangExtract; falls back to local heuristics if no API key.

        Returns a structured dict with keys: emotions, sentiments, topics, engagement, key_phrases, raw_extractions.
        """
        if not text or not text.strip():
            return {"error": "Empty transcription"}

        # Fallback analyzer for offline/no-API mode
        def _fallback(text_in: str) -> dict:
            lower = text_in.lower()
            pos_words = {"great", "amazing", "happy", "wonderful", "excited", "love", "good"}
            neg_words = {"angry", "frustrated", "terrible", "bad", "awful", "hate", "disappointed", "sad"}
            emo_map = {
                "happy": ["happy", "excited", "joy", "glad"],
                "angry": ["angry", "mad", "furious"],
                "sad": ["sad", "down", "unhappy", "disappointed"],
                "neutral": ["ok", "fine"],
            }
            sentiments = []
            emotions = []
            if any(w in lower for w in pos_words):
                sentiments.append({"class": "sentiment", "text": "positive", "attributes": {"confidence": "low"}})
            elif any(w in lower for w in neg_words):
                sentiments.append({"class": "sentiment", "text": "negative", "attributes": {"confidence": "low"}})
            else:
                sentiments.append({"class": "sentiment", "text": "neutral", "attributes": {"confidence": "low"}})
            for label, keys in emo_map.items():
                if any(k in lower for k in keys):
                    emotions.append({"class": "emotion", "text": label, "attributes": {"detected": True}})
            analysis = {
                "emotions": emotions,
                "sentiments": sentiments,
                "topics": [],
                "engagement": [],
                "key_phrases": [],
                "raw_extractions": emotions + sentiments,
                "note": "offline_fallback"
            }
            return analysis

        # If no API key, use fallback
        api_key = os.getenv("LANGEXTRACT_API_KEY")
        if not api_key:
            return _fallback(text)

        try:
            result = lx.extract(
                text_or_documents=text,
                prompt_description=self.prompt,
                examples=self.examples,
                model_id="gemini-2.5-flash",
                extraction_passes=2,
                max_workers=3,
                api_key=api_key
            )

            # Store raw result for later JSONL save and visualization
            try:
                self._raw_results.append(result)
            except Exception:
                pass

            analysis = {
                "emotions": [],
                "sentiments": [],
                "topics": [],
                "engagement": [],
                "key_phrases": [],
                "raw_extractions": []
            }

            for extraction in result.extractions:
                extraction_data = {
                    "class": extraction.extraction_class,
                    "text": extraction.extraction_text,
                    "attributes": extraction.attributes or {}
                }
                analysis["raw_extractions"].append(extraction_data)

                if extraction.extraction_class == "emotion":
                    analysis["emotions"].append(extraction_data)
                elif extraction.extraction_class == "sentiment":
                    analysis["sentiments"].append(extraction_data)
                elif extraction.extraction_class == "topic":
                    analysis["topics"].append(extraction_data)
                elif extraction.extraction_class == "engagement":
                    analysis["engagement"].append(extraction_data)
                elif extraction.extraction_class == "key_phrases":
                    analysis["key_phrases"].append(extraction_data)

            return analysis

        except Exception as e:
            logging.error(f"LangExtract analysis failed: {e}")
            return _fallback(text)

    def save_outputs(self, output_dir: Path, base_name: str) -> dict:
        """If API-backed results exist, save JSONL and HTML visualization.

        Returns paths dict with keys jsonl_path and html_path when created.
        """
        paths = {}
        if not self._raw_results:
            return paths
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
            jsonl_name = f"{base_name}_langextract.jsonl"
            html_name = f"{base_name}_langextract.html"
            # Save JSONL
            lx.io.save_annotated_documents(
                self._raw_results,
                output_name=jsonl_name,
                output_dir=str(output_dir)
            )
            jsonl_path = output_dir / jsonl_name
            # Generate HTML
            html_content = lx.visualize(str(jsonl_path))
            html_path = output_dir / html_name
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_content)
            paths = {"jsonl_path": str(jsonl_path), "html_path": str(html_path)}
        except Exception as e:
            logger.warning(f"Failed to save LangExtract outputs: {e}")
        return paths

# Initialize LangExtract analyzer
langextract_analyzer = LangExtractStreamAnalyzer()
# --- END: LangExtract Integration ---

# --- Emotion2Vec Integration (FunASR) ---
EMOTION2VEC_AVAILABLE = False
emotion2vec_model = None

def _load_emotion2vec_if_needed():
    global EMOTION2VEC_AVAILABLE, emotion2vec_model
    if EMOTION2VEC_AVAILABLE and emotion2vec_model is not None:
        return
    try:
        from funasr import AutoModel as FunASRAutoModel
        # Allow override via env
        override_model_id = os.getenv("EMOTION2VEC_MODEL_ID")
        candidate_models = [
            override_model_id.strip() if override_model_id else None,
            "iic/emotion2vec_plus_large",
            "iic/emotion2vec_base",
        ]
        candidate_models = [m for m in candidate_models if m]

        # Prefer local cache if available
        def _local_candidate_for(hf_id: str) -> str | None:
            owner, name = hf_id.split("/")
            # standard HF cache layout
            local_dir = Path.home() / ".cache" / "huggingface" / "hub" / f"models--{owner}--{name}"
            return str(local_dir) if local_dir.exists() else None

        # Temporarily disable global HF Hub token to avoid 401 on public models
        prev_tokens = {
            "HUGGINGFACE_HUB_TOKEN": os.environ.get("HUGGINGFACE_HUB_TOKEN"),
            "HUGGINGFACE_TOKEN": os.environ.get("HUGGINGFACE_TOKEN"),
            "HF_TOKEN": os.environ.get("HF_TOKEN"),
        }
        try:
            # Clear all token env vars to prevent invalid-token 401 on public models
            for k in list(prev_tokens.keys()):
                if prev_tokens[k] is not None:
                    os.environ[k] = ""
            last_err = None
            for mid in candidate_models:
                try:
                    local_dir = _local_candidate_for(mid)
                    model_arg = local_dir if local_dir else mid
                    emotion2vec_model = FunASRAutoModel(
                        model=model_arg,
                        hub="hf",
                        disable_update=True,
                        device=("cuda" if ("torch" in sys.modules and torch.cuda.is_available()) else "cpu"),
                    )
                    logger.info(f"emotion2vec model loaded: {model_arg}")
                    break
                except Exception as inner_e:
                    last_err = inner_e
                    emotion2vec_model = None
            if emotion2vec_model is None and last_err:
                raise last_err
        finally:
            # Restore token environment variable
            for k, v in prev_tokens.items():
                if v is not None:
                    os.environ[k] = v
        EMOTION2VEC_AVAILABLE = True
        logger.info("emotion2vec model loaded successfully")
    except Exception as e:
        EMOTION2VEC_AVAILABLE = False
        emotion2vec_model = None
        logger.warning(f"Could not load emotion2vec model: {e}")

# --- SEPARATION PIPELINE, HELPERS, MAIN LOOP ---
class CascadedSeparationPipeline:
    def __init__(self, output_dir="separation_cache"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.separator = separator_model.from_hparams("speechbrain/sepformer-whamr-enhancement", savedir=Path(output_dir)/'sepformer', run_opts={"device": self.device})
    def separate(self, audio_chunk_np: np.ndarray):
        if audio_chunk_np.dtype != np.float32: audio_chunk_np = audio_chunk_np.astype(np.float32) / 32768.0
        audio_tensor = torch.from_numpy(audio_chunk_np).to(self.device).unsqueeze(0)
        est_sources = self.separator.separate_batch(audio_tensor)
        est_sources_np = est_sources.squeeze(0).cpu().numpy().T
        return [(source * 32767).astype(np.int16) for source in est_sources_np]

def load_audio_file(file_path: str, max_seconds: float | None = None):
    import librosa
    audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
    if max_seconds is not None and max_seconds > 0:
        max_samples = int(max_seconds * SAMPLE_RATE)
        audio = audio[:max_samples]
    return (audio * 32767).astype(np.int16)

def get_vad_segments(audio_data, min_speech_duration=0.5, min_silence_duration=0.25):
    audio_float = audio_data.astype(np.float32) / 32768.0
    speech_timestamps = get_speech_timestamps(torch.from_numpy(audio_float), vad_model, sampling_rate=SAMPLE_RATE, min_speech_duration_ms=int(min_speech_duration*1000), min_silence_duration_ms=int(min_silence_duration*1000))
    return [{'audio': audio_data[s['start']:s['end']], 'start_time': s['start']/SAMPLE_RATE, 'end_time': s['end']/SAMPLE_RATE} for s in speech_timestamps]

async def run_in_executor(loop, executor, func, *args):
    return await loop.run_in_executor(executor, func, *args)

async def _segments_from_pyannote_diarization(int16_audio: np.ndarray) -> list[dict]:
    """Build segments using pyannote diarization over the given audio."""
    import torch as _torch
    float_audio = int16_audio.astype(np.float32) / 32768.0
    waveform = _torch.from_numpy(float_audio).unsqueeze(0)
    diarization_result = await audio_separation_service.diarize_from_waveform(
        waveform=waveform, sample_rate=SAMPLE_RATE, min_duration=0.5
    )
    segments: list[dict] = []
    for seg in diarization_result.get("segments", []):
        start_idx = int(seg["start"] * SAMPLE_RATE)
        end_idx = int(seg["end"] * SAMPLE_RATE)
        segments.append({
            'audio': (int16_audio[start_idx:end_idx] if end_idx > start_idx else np.array([], dtype=np.int16)),
            'start_time': float(seg['start']),
            'end_time': float(seg['end']),
            'speaker': seg.get('speaker', 'SPEAKER_00')
        })
    return segments

def _compute_emotion2vec_head_tokens(int16_audio: np.ndarray, head: int = 8) -> dict:
    """Compute emotion2vec embedding, label, and return a small head of the embedding as tokens."""
    if int16_audio.size == 0:
        return {"tokens": [], "label": None, "scores": None}
    if not EMOTION2VEC_AVAILABLE or emotion2vec_model is None:
        _load_emotion2vec_if_needed()
        if not EMOTION2VEC_AVAILABLE or emotion2vec_model is None:
            return {"tokens": [], "label": None, "scores": None}
    try:
        audio_float = int16_audio.astype(np.float32) / 32768.0
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp_file:
            sf.write(tmp_file.name, audio_float, SAMPLE_RATE, subtype='PCM_16')
            rec = emotion2vec_model.generate(
                tmp_file.name,
                granularity="utterance",
                extract_embedding=True,
            )
        if not rec or "feats" not in rec[0]:
            return {"tokens": [], "label": None, "scores": None}
        emb = rec[0]["feats"].astype(np.float32)
        token_head = emb[:head].tolist()
        return {"tokens": token_head, "label": rec[0].get("labels"), "scores": rec[0].get("scores")}
    except Exception as e:
        logger.warning(f"emotion2vec failed: {e}")
        return {"tokens": [], "label": None, "scores": None}

async def simulate_stream(audio_file, separate_speakers=False, use_pyannote=False, max_seconds: float | None = None):
    logger.info("=== STREAM SIMULATION START (Asynchronous & Stateful Centroid) ===")
    
    separation_pipeline, speaker_identifier = None, None
    if separate_speakers:
        if not SPEECHBRAIN_AVAILABLE: logger.error("Cannot separate speakers."); return
        separation_pipeline = CascadedSeparationPipeline()
        speaker_identifier = StatefulSpeakerIdentifier()

    service = await get_realtime_analysis_service()
    test_audio = load_audio_file(audio_file, max_seconds=max_seconds)
    if test_audio is None: return

    segments = await _segments_from_pyannote_diarization(test_audio) if use_pyannote else get_vad_segments(test_audio)
    if not segments: logger.warning("No speech segments detected."); return

    loop = asyncio.get_event_loop()
    executor = asyncio.get_running_loop()._default_executor

    for i, segment in enumerate(segments, 1):
        original_segment_audio = segment['audio']
        print(f"\n--- PROCESSING SEGMENT {i}/{len(segments)} (Time: {segment['start_time']:.2f}s - {segment['end_time']:.2f}s) ---")

        if not separate_speakers:
            result = await service.process_sentiment_chunk(original_segment_audio.tobytes())
            emo = _compute_emotion2vec_head_tokens(original_segment_audio)
            speaker_label = segment.get('speaker', 'Unknown')
            print(f"Attributed Speaker: {speaker_label}")
            print(f"Text: {result['text']}")
            print(f"Sentiment: {result['sentiment']}")
            if emo["label"] is not None:
                print(f"Emotion2Vec: label={emo['label']} tokens_head={emo['tokens']}")
            # LangExtract analysis (uses env var LANGEXTRACT_API_KEY if set)
            langextract_analysis = langextract_analyzer.analyze_transcription(result.get('text', ''))
            print(f"LangExtract Analysis: {json.dumps(langextract_analysis, indent=2)}")
            continue

        transcription_task = asyncio.create_task(service.process_sentiment_chunk(original_segment_audio.tobytes()))
        separation_task = asyncio.create_task(run_in_executor(loop, executor, separation_pipeline.separate, original_segment_audio))
        master_result, separated_sources = await asyncio.gather(transcription_task, separation_task)
        master_transcription = master_result.get('text', '').strip()

        if not master_transcription or master_transcription == "[NO SPEECH DETECTED]":
            logger.warning(f"Segment {i}: No speech detected. Skipping speaker attribution.")
            continue
            
        logger.info(f"Segment {i}: Master Transcription: '{master_transcription}'")
        logger.info(f"Segment {i}: Identifying speakers from separated sources...")

        speaker_results = []
        for source_audio in separated_sources:
            energy = np.sqrt(np.mean((source_audio.astype(np.float32) / 32768.0) ** 2))
            if energy < 0.01: continue
            
            speaker_id, similarity = speaker_identifier.identify_speaker(source_audio)
            speaker_results.append({'id': speaker_id, 'energy': energy, 'similarity': similarity})

        if not speaker_results:
            logger.warning(f"Segment {i}: No dominant speaker found. Attributing to 'Unknown'.")
            print(f"--- Attributed to: Unknown ---")
            print(f"Text: {master_transcription}")
            print(f"Sentiment: {master_result['sentiment']}")
            continue

        dominant_speaker = max(speaker_results, key=lambda x: x['energy'])
        
        print(f"--- Attributed to: {dominant_speaker['id']} (Similarity: {dominant_speaker['similarity']:.2f}) ---")
        # Get LangExtract analysis for the transcription
        langextract_analysis = langextract_analyzer.analyze_transcription(master_transcription)
        
        print(f"Text: {master_transcription}")
        print(f"Sentiment: {master_result['sentiment']}")
        print(f"LangExtract Analysis: {json.dumps(langextract_analysis, indent=2)}")
        emo = _compute_emotion2vec_head_tokens(original_segment_audio)
        if emo["label"] is not None:
            print(f"Emotion2Vec: label={emo['label']} tokens_head={emo['tokens']}")
        
    logger.info("=== STREAM SIMULATION COMPLETE ===")

    # After run: save LangExtract JSONL + HTML if we collected any API-backed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_stem = Path(audio_file).stem
    base_name = f"{base_stem}_{timestamp}"
    results_dir = project_root / "results"
    saved = langextract_analyzer.save_outputs(results_dir, base_name)
    if saved:
        print(f"LangExtract outputs saved:\n  JSONL: {saved['jsonl_path']}\n  HTML:  {saved['html_path']}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Real-time Stream Simulation with Stateful Speaker Diarization")
    parser.add_argument("--audio", type=str, required=True, help="Path to an audio file with mixed speakers")
    parser.add_argument("--separate-speakers", action="store_true", help="Enable the cascaded speaker separation pipeline")
    parser.add_argument("--use-pyannote", action="store_true", help="Use pyannote diarization for segments and speaker labels")
    parser.add_argument("--max-seconds", type=float, default=None, help="Limit processing to the first N seconds of audio")
    args = parser.parse_args()
    asyncio.run(simulate_stream(args.audio, args.separate_speakers, args.use_pyannote, args.max_seconds))