"""
Comprehensive Audio Processing Service
Based on the proven logic from tests/stream_simulation.py that actually works
"""

import os
import sys
import logging
import json
import numpy as np
import asyncio
import tempfile
import soundfile as sf
import textwrap
from pathlib import Path
from scipy.spatial.distance import cosine
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import our working services
from src.services.realtime_analysis_service import get_realtime_analysis_service
from src.services.audio_separation_service import audio_separation_service

# Import LangExtract for advanced analysis
try:
    import langextract as lx
    LANGEXTRACT_AVAILABLE = True
except ImportError:
    logger.warning("LangExtract not available. Advanced sentiment analysis will be disabled.")
    LANGEXTRACT_AVAILABLE = False

logger = logging.getLogger(__name__)

# --- START: LangExtract Integration (copied from stream_simulation.py) ---
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
    
    def analyze_transcription(self, text: str) -> dict:
        """Analyze transcribed text using LangExtract; falls back to local heuristics if no API key."""
        if not text or not text.strip():
            return {"error": "Empty transcription"}

        # Fallback analyzer for offline/no-API mode
        def _fallback(text_in: str) -> dict:
            lower = text_in.lower()
            # Expanded keyword detection
            pos_words = {"great", "amazing", "happy", "wonderful", "excited", "love", "good", "excellent", "fantastic", "awesome", "pleased"}
            neg_words = {"angry", "frustrated", "terrible", "bad", "awful", "hate", "disappointed", "sad", "upset", "annoyed", "furious"}
            question_words = {"what", "how", "when", "where", "why", "who", "can", "could", "would", "should"}
            business_words = {"company", "business", "service", "product", "customer", "client", "sales", "marketing"}
            
            emo_map = {
                "happy": ["happy", "excited", "joy", "glad", "pleased", "thrilled"],
                "angry": ["angry", "mad", "furious", "upset", "annoyed", "frustrated"],
                "sad": ["sad", "down", "unhappy", "disappointed", "depressed"],
                "neutral": ["ok", "fine", "alright"],
                "curious": ["interested", "wondering", "curious"],
            }
            
            sentiments = []
            emotions = []
            topics = []
            engagement = []
            
            # Sentiment detection
            if any(w in lower for w in pos_words):
                sentiments.append({"class": "sentiment", "text": "positive", "attributes": {"confidence": "medium", "trigger": "positive_keywords"}})
            elif any(w in lower for w in neg_words):
                sentiments.append({"class": "sentiment", "text": "negative", "attributes": {"confidence": "medium", "trigger": "negative_keywords"}})
            else:
                sentiments.append({"class": "sentiment", "text": "neutral", "attributes": {"confidence": "low", "reason": "no_clear_indicators"}})
            
            # Emotion detection
            for label, keys in emo_map.items():
                if any(k in lower for k in keys):
                    emotions.append({"class": "emotion", "text": label, "attributes": {"detected": True, "confidence": "medium"}})
            
            # Topic detection
            if any(w in lower for w in business_words):
                topics.append({"class": "topic", "text": "business_conversation", "attributes": {"category": "professional"}})
            if any(w in lower for w in question_words):
                topics.append({"class": "topic", "text": "inquiry", "attributes": {"type": "question"}})
            
            # Engagement detection
            if len([w for w in question_words if w in lower]) > 0:
                engagement.append({"class": "engagement", "text": "inquisitive", "attributes": {"type": "asking_questions"}})
            if len(text_in.split()) > 10:
                engagement.append({"class": "engagement", "text": "high", "attributes": {"reason": "lengthy_response"}})
            elif len(text_in.split()) < 3:
                engagement.append({"class": "engagement", "text": "low", "attributes": {"reason": "brief_response"}})
            else:
                engagement.append({"class": "engagement", "text": "medium", "attributes": {"reason": "moderate_length"}})
            
            analysis = {
                "emotions": emotions,
                "sentiments": sentiments,
                "topics": topics,
                "engagement": engagement,
                "key_phrases": [{"class": "key_phrases", "text": phrase, "attributes": {"importance": "medium"}} for phrase in text_in.split('.') if len(phrase.strip()) > 5][:3],
                "raw_extractions": emotions + sentiments + topics + engagement,
                "note": "enhanced_offline_fallback"
            }
            return analysis

        # If no API key, use fallback
        if not LANGEXTRACT_AVAILABLE:
            return _fallback(text)
            
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

# Initialize LangExtract analyzer
langextract_analyzer = LangExtractStreamAnalyzer()
# --- END: LangExtract Integration ---

# --- Emotion2Vec Integration (copied from stream_simulation.py) ---
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
                        device="cpu",  # Use CPU to avoid CUDA memory conflicts
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
# --- END: Emotion2Vec Integration ---

# Import dependencies with fallbacks
try:
    import torch
    import torchaudio
    # Enable better CUDA memory management
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
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
    vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False, trust_repo=True)
    (get_speech_timestamps, _, read_audio, _, _) = utils
    SILERO_AVAILABLE = True
    logger.info("Silero VAD loaded successfully")
except Exception as e:
    logger.warning(f"Could not load Silero VAD: {e}. VAD segmentation will be unavailable.")
    SILERO_AVAILABLE = False

SAMPLE_RATE = 16000

class StatefulSpeakerIdentifier:
    """
    Stateful speaker identification that maintains speaker profiles across audio processing.
    This is the proven approach from tests/stream_simulation.py
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
        
        # Speaker profiles store centroid and count for updating
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
        Identifies speaker and updates centroids for stateful identification.
        This is the core logic that works in the test.
        """
        if len(audio_chunk_np) < SAMPLE_RATE * 0.25:
            return "Unknown", 0.0
            
        current_embedding = self._get_embedding(audio_chunk_np)

        # Handle the very first speaker
        if not self.speaker_profiles:
            new_speaker_name = f"Speaker {self.next_speaker_id}"
            self.speaker_profiles[new_speaker_name] = {'centroid': current_embedding, 'count': 1}
            self.next_speaker_id += 1
            logger.info(f"Enrolled first speaker: {new_speaker_name}")
            return new_speaker_name, 1.0

        # Compare with existing speakers
        best_match_speaker = "Unknown"
        highest_similarity = -1

        for name, profile in self.speaker_profiles.items():
            similarity = 1 - cosine(current_embedding, profile['centroid'])
            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match_speaker = name

        # Update or create speaker profile
        if highest_similarity >= self.similarity_threshold:
            # Update existing speaker centroid
            profile_to_update = self.speaker_profiles[best_match_speaker]
            old_centroid = profile_to_update['centroid']
            old_count = profile_to_update['count']
            
            # Calculate new running average for the centroid
            new_centroid = (old_centroid * old_count + current_embedding) / (old_count + 1)
            
            # Update the stored profile
            self.speaker_profiles[best_match_speaker]['centroid'] = new_centroid
            self.speaker_profiles[best_match_speaker]['count'] += 1
            
            logger.info(f"Matched existing speaker: {best_match_speaker}. Updating profile (count: {old_count + 1}).")
            return best_match_speaker, highest_similarity
        else:
            # Create new speaker
            new_speaker_name = f"Speaker {self.next_speaker_id}"
            self.speaker_profiles[new_speaker_name] = {'centroid': current_embedding, 'count': 1}
            self.next_speaker_id += 1
            logger.info(f"Enrolled new speaker: {new_speaker_name} (highest similarity to others: {highest_similarity:.2f})")
            return new_speaker_name, highest_similarity


def get_vad_segments(audio_data, min_speech_duration=0.5, min_silence_duration=0.25):
    """Extract speech segments using Silero VAD"""
    if not SILERO_AVAILABLE:
        # Fallback: treat entire audio as one segment
        return [{'audio': audio_data, 'start_time': 0, 'end_time': len(audio_data) / SAMPLE_RATE}]
    
    audio_float = audio_data.astype(np.float32) / 32768.0
    speech_timestamps = get_speech_timestamps(
        torch.from_numpy(audio_float), 
        vad_model, 
        sampling_rate=SAMPLE_RATE,
        min_speech_duration_ms=int(min_speech_duration*1000),
        min_silence_duration_ms=int(min_silence_duration*1000)
    )
    return [{'audio': audio_data[s['start']:s['end']], 'start_time': s['start']/SAMPLE_RATE, 'end_time': s['end']/SAMPLE_RATE} for s in speech_timestamps]


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


class ComprehensiveAudioService:
    """
    Comprehensive audio processing service that uses the proven approach from stream_simulation.py
    """
    
    def __init__(self):
        self.speaker_identifier = None
        
    async def process_audio_comprehensive(
        self,
        audio_path: str,
        separate_speakers: bool = True,
        use_pyannote: bool = True,
        max_seconds: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Process audio using the proven comprehensive approach that actually works.
        Based on tests/stream_simulation.py logic.
        """
        logger.info("=== COMPREHENSIVE AUDIO PROCESSING START ===")
        
        # Initialize speaker identifier if needed
        if separate_speakers and SPEECHBRAIN_AVAILABLE:
            try:
                self.speaker_identifier = StatefulSpeakerIdentifier()
            except Exception as e:
                logger.warning(f"Could not initialize speaker identifier: {e}")
                separate_speakers = False
        
        # Get realtime analysis service
        service = await get_realtime_analysis_service()
        
        # Load audio
        try:
            import librosa
            audio, _ = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
            if max_seconds is not None and max_seconds > 0:
                max_samples = int(max_seconds * SAMPLE_RATE)
                audio = audio[:max_samples]
            test_audio = (audio * 32767).astype(np.int16)
        except Exception as e:
            logger.error(f"Failed to load audio: {e}")
            return {"error": f"Failed to load audio: {e}"}
        
        if test_audio is None or len(test_audio) == 0:
            return {"error": "No audio data"}
        
        # Get segments using the proven approach
        if use_pyannote:
            segments = await _segments_from_pyannote_diarization(test_audio)
        else:
            segments = get_vad_segments(test_audio)
        
        if not segments:
            logger.warning("No speech segments detected.")
            return {"error": "No speech segments detected"}
        
        # Process each segment
        results = []
        full_transcript = ""
        
        for i, segment in enumerate(segments, 1):
            original_segment_audio = segment['audio']
            logger.info(f"Processing segment {i}/{len(segments)} (Time: {segment['start_time']:.2f}s - {segment['end_time']:.2f}s)")
            
            if len(original_segment_audio) == 0:
                continue
            
            try:
                # Process with realtime analysis service
                result = await service.process_sentiment_chunk(original_segment_audio.tobytes())
                transcription = result.get('text', '').strip()
                
                if not transcription or transcription in ["[NO SPEECH DETECTED]", "[ASR FAILED]"]:
                    logger.warning(f"Segment {i}: No speech detected. Skipping.")
                    continue
                
                # Speaker identification if enabled
                speaker_label = segment.get('speaker', 'Unknown')
                speaker_similarity = 0.0
                
                if separate_speakers and self.speaker_identifier:
                    try:
                        # Clear CUDA cache before speaker identification to avoid memory issues
                        if torch.cuda.is_available():
                            torch.cuda.empty_cache()
                        speaker_label, speaker_similarity = self.speaker_identifier.identify_speaker(original_segment_audio)
                    except Exception as e:
                        logger.warning(f"Speaker identification failed for segment {i}: {e}")
                        # Fallback to pyannote speaker if available
                        speaker_label = segment.get('speaker', 'Unknown')
                
                # 🔥 LangExtract analysis (uses env var LANGEXTRACT_API_KEY if set)
                langextract_analysis = langextract_analyzer.analyze_transcription(transcription)
                
                # Create concise summary like in the working test
                le_summary = {
                    "emotions": [e.get("text", "") for e in langextract_analysis.get("emotions", [])],
                    "sentiments": [s.get("text", "") for s in langextract_analysis.get("sentiments", [])],
                    "topics": [t.get("text", "") for t in langextract_analysis.get("topics", [])],
                    "engagement": [eng.get("text", "") for eng in langextract_analysis.get("engagement", [])]
                }
                logger.info(f"LangExtract Summary: {json.dumps(le_summary, indent=2)}")
                
                # 🎭 Emotion2Vec analysis with CUDA memory management
                try:
                    # Clear CUDA cache before emotion2vec
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                    emotion2vec_result = _compute_emotion2vec_head_tokens(original_segment_audio)
                except Exception as e:
                    logger.warning(f"Emotion2Vec failed for segment {i}: {e}")
                    emotion2vec_result = {"tokens": [], "label": None, "scores": None}
                
                segment_result = {
                    "segment_id": i,
                    "start_time": segment['start_time'],
                    "end_time": segment['end_time'],
                    "duration": segment['end_time'] - segment['start_time'],
                    "speaker": speaker_label,
                    "speaker_similarity": speaker_similarity,
                    "text": transcription,
                    "sentiment": result.get('sentiment', 'neutral'),
                    "tokens": result.get('tokens', []),
                    "langextract_analysis": langextract_analysis,  # 🔥 Advanced LLM-based analysis
                    "emotion2vec": emotion2vec_result  # 🎭 AI emotion detection
                }
                
                results.append(segment_result)
                full_transcript += f"{transcription} "
                
                # Concise segment logging
                logger.info(f"Segment {i} - Speaker: {speaker_label}, Text: {transcription[:50]}...")
                if emotion2vec_result.get("label"):
                    logger.info(f"  Emotion2Vec: {emotion2vec_result['label']}")
                
                # Only log if there are meaningful results (not just neutral)
                if le_summary.get("emotions") and any(e != "neutral" for e in le_summary["emotions"]):
                    logger.info(f"  Emotions: {', '.join(le_summary['emotions'])}")
                if le_summary.get("topics"):
                    logger.info(f"  Topics: {', '.join(le_summary['topics'])}")
                if le_summary.get("engagement") and any(e in ["high", "low"] for e in le_summary["engagement"]):
                    logger.info(f"  Engagement: {', '.join(le_summary['engagement'])}")
                
            except Exception as e:
                logger.error(f"Error processing segment {i}: {e}")
                continue
        
        logger.info("=== COMPREHENSIVE AUDIO PROCESSING COMPLETE ===")
        
        # Generate Speakers Page Summary (like frontend display)
        if results:
            logger.info("\n🎭 === SPEAKERS PAGE PREVIEW ===")
            speakers_summary = {}
            
            # Group segments by speaker
            for segment in results:
                speaker = segment["speaker"]
                if speaker not in speakers_summary:
                    speakers_summary[speaker] = {
                        "segments": [],
                        "total_time": 0,
                        "emotions": [],
                        "topics": [],
                        "sentiment_counts": {"positive": 0, "negative": 0, "neutral": 0}
                    }
                
                speakers_summary[speaker]["segments"].append(segment)
                speakers_summary[speaker]["total_time"] += segment.get("duration", 0)
                
                # Collect analysis data
                if segment.get("langextract_analysis"):
                    le = segment["langextract_analysis"]
                    speakers_summary[speaker]["emotions"].extend([e.get("text", "") for e in le.get("emotions", [])])
                    speakers_summary[speaker]["topics"].extend([t.get("text", "") for t in le.get("topics", [])])
                
                # Count sentiments
                sentiment = segment.get("sentiment", "neutral")
                if sentiment in speakers_summary[speaker]["sentiment_counts"]:
                    speakers_summary[speaker]["sentiment_counts"][sentiment] += 1
            
            # Log speaker summaries
            for speaker, data in speakers_summary.items():
                logger.info(f"\n📋 {speaker}:")
                logger.info(f"  • Segments: {len(data['segments'])}")
                logger.info(f"  • Speaking time: {data['total_time']:.1f}s")
                
                # Top emotions (non-neutral)
                emotions = [e for e in data['emotions'] if e and e != 'neutral']
                if emotions:
                    emotion_counts = {}
                    for e in emotions:
                        emotion_counts[e] = emotion_counts.get(e, 0) + 1
                    top_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:3]
                    logger.info(f"  • Top emotions: {', '.join([f'{e}({c})' for e, c in top_emotions])}")
                
                # Top topics
                topics = [t for t in data['topics'] if t]
                if topics:
                    topic_counts = {}
                    for t in topics:
                        topic_counts[t] = topic_counts.get(t, 0) + 1
                    top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:2]
                    logger.info(f"  • Key topics: {', '.join([f'{t}({c})' for t, c in top_topics])}")
                
                # Sentiment distribution
                sentiments = data['sentiment_counts']
                total_segments = sum(sentiments.values())
                if total_segments > 0:
                    sentiment_pct = {k: (v/total_segments)*100 for k, v in sentiments.items() if v > 0}
                    sentiment_str = ', '.join([f'{k}: {v:.0f}%' for k, v in sentiment_pct.items()])
                    logger.info(f"  • Sentiment: {sentiment_str}")
                
                # Sample quotes
                sample_quotes = [s["text"][:60] + "..." if len(s["text"]) > 60 else s["text"] 
                               for s in data["segments"][:2] if s.get("text")]
                if sample_quotes:
                    logger.info(f"  • Sample quotes:")
                    for quote in sample_quotes:
                        logger.info(f"    - \"{quote}\"")
            
            logger.info("\n🎭 === END SPEAKERS PAGE PREVIEW ===\n")
        
        return {
            "transcript": full_transcript.strip(),
            "language": "en",
            "total_segments": len(results),
            "total_duration": segments[-1]['end_time'] if segments else 0,
            "segments": results,
            "speakers": list(set(r["speaker"] for r in results)),
            "processing_approach": "comprehensive_stateful"
        }


# Global instance
comprehensive_audio_service = ComprehensiveAudioService()