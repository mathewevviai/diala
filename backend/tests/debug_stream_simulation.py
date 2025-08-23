#!/usr/bin/env python3
"""
Debug version of modern_stream_simulation.py with detailed diagnostics
"""

import os
import sys
import logging
import numpy as np
import asyncio
import psutil
import gc
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import time
import json
import tracemalloc
from dataclasses import dataclass
from collections import defaultdict

# Add the project root to the Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Configure logging for debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Suppress excessive logging
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("funasr").setLevel(logging.ERROR)
logging.getLogger("speechbrain").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

# Import debug components
from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier
from src.services.realtime_analysis_service import get_realtime_analysis_service

print("=== DEBUG: Initial imports completed ===")

# Memory debugging
tracemalloc.start()

def log_memory_usage(stage: str):
    """Log detailed memory usage"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        logger.info(f"Memory at {stage}: {memory_info.rss / 1024 / 1024:.2f} MB")
        
        # Garbage collection
        gc.collect()
    except Exception as e:
        logger.error(f"Error logging memory: {e}")

try:
    import torch
    import torchaudio
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"CUDA device count: {torch.cuda.device_count()}")
        logger.info(f"Current device: {torch.cuda.current_device()}")
    SPEECHBRAIN_AVAILABLE = True
except ImportError:
    logger.warning("Could not import SpeechBrain")
    SPEECHBRAIN_AVAILABLE = False

try:
    if 'torch' not in sys.modules:
        import torch
    torch.set_num_threads(1)
    vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', 
                                      force_reload=False, trust_repo=True)
    (get_speech_timestamps, _, read_audio, _, _) = utils
    SILERO_AVAILABLE = True
    logger.info("Silero VAD loaded successfully")
except Exception as e:
    logger.warning(f"Could not load Silero VAD: {e}")
    SILERO_AVAILABLE = False

SAMPLE_RATE = 16000

@dataclass
class ProcessingStats:
    """Statistics for processing performance"""
    total_segments: int = 0
    total_processing_time_ms: float = 0.0
    avg_processing_time_ms: float = 0.0
    max_processing_time_ms: float = 0.0
    memory_usage_mb: float = 0.0
    speaker_count: int = 0
    fallback_count: int = 0

class DebugCascadedSeparationPipeline:
    """Debug version with memory monitoring"""
    
    def __init__(self, output_dir="debug_separation_cache"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"DebugCascadedSeparationPipeline using device: {self.device}")
        
        # Check if we can load the model without crashing
        try:
            logger.info("Attempting to load SpeechBrain separation model...")
            from speechbrain.pretrained import SepformerSeparation as separator_model
            
            self.separator = separator_model.from_hparams(
                "speechbrain/sepformer-whamr-enhancement", 
                savedir=Path(output_dir)/'sepformer', 
                run_opts={"device": self.device}
            )
            logger.info("SpeechBrain separation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load SpeechBrain model: {e}")
            raise
            
    def separate(self, audio_chunk_np: np.ndarray) -> List[np.ndarray]:
        """Separate audio with memory monitoring"""
        logger.info(f"Starting separation of audio chunk with {len(audio_chunk_np)} samples")
        log_memory_usage("before separation")
        
        try:
            if audio_chunk_np.dtype != np.float32:
                audio_chunk_np = audio_chunk_np.astype(np.float32) / 32768.0
                
            audio_tensor = torch.from_numpy(audio_chunk_np).to(self.device).unsqueeze(0)
            est_sources = self.separator.separate_batch(audio_tensor)
            est_sources_np = est_sources.squeeze(0).cpu().numpy().T
            
            result = [(source * 32767).astype(np.int16) for source in est_sources_np]
            logger.info(f"Separation completed, got {len(result)} sources")
            log_memory_usage("after separation")
            
            return result
        except Exception as e:
            logger.error(f"Error in separation: {e}")
            raise

class DebugStreamProcessor:
    """Debug processor with detailed logging"""
    
    def __init__(self, config: Dict = None):
        logger.info("Initializing DebugStreamProcessor...")
        log_memory_usage("init start")
        
        self.config = config or {
            'use_graph_clustering': True,
            'use_adaptive_thresholds': True,
            'use_quality_weighting': True,
            'use_temporal_context': True,
            'similarity_threshold': 0.7,
            'max_speakers': 20
        }
        
        logger.info("Creating ModernStatefulSpeakerIdentifier...")
        try:
            self.speaker_identifier = ModernStatefulSpeakerIdentifier(
                base_threshold=self.config['similarity_threshold'],
                max_speakers=self.config['max_speakers'],
                use_graph_clustering=self.config['use_graph_clustering'],
                use_adaptive_thresholds=self.config['use_adaptive_thresholds'],
                use_quality_weighting=self.config['use_quality_weighting'],
                use_temporal_context=self.config['use_temporal_context']
            )
            logger.info("ModernStatefulSpeakerIdentifier created successfully")
        except Exception as e:
            logger.error(f"Failed to create ModernStatefulSpeakerIdentifier: {e}")
            raise
            
        self.separation_pipeline = None
        self.service = None
        
        log_memory_usage("init complete")
        
    def initialize_models(self):
        """Initialize required models with debug info"""
        logger.info("=== Initializing models ===")
        log_memory_usage("before model init")
        
        try:
            if SPEECHBRAIN_AVAILABLE:
                logger.info("Loading SpeechBrain separation pipeline...")
                self.separation_pipeline = DebugCascadedSeparationPipeline()
                logger.info("SpeechBrain separation pipeline loaded")
                
            logger.info("Loading realtime analysis service...")
            self.service = get_realtime_analysis_service()
            logger.info("Realtime analysis service loaded")
            
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise
            
        log_memory_usage("after model init")
        
    def load_audio_file(self, file_path: str) -> np.ndarray:
        """Load and preprocess audio file with debug info"""
        logger.info(f"Loading audio file: {file_path}")
        log_memory_usage("before audio load")
        
        try:
            import librosa
            audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
            result = (audio * 32767).astype(np.int16)
            logger.info(f"Loaded audio: {len(result)} samples")
            log_memory_usage("after audio load")
            return result
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            return None
            
    def get_vad_segments(self, audio_data: np.ndarray) -> List[Dict]:
        """Get voice activity detection segments with debug info"""
        logger.info(f"Getting VAD segments for {len(audio_data)} samples")
        
        if not SILERO_AVAILABLE:
            logger.warning("Silero VAD not available, using fixed segments")
            segment_duration = int(SAMPLE_RATE * 2.0)
            segments = []
            for i in range(0, len(audio_data), segment_duration):
                end = min(i + segment_duration, len(audio_data))
                segments.append({
                    'audio': audio_data[i:end],
                    'start_time': i / SAMPLE_RATE,
                    'end_time': end / SAMPLE_RATE
                })
            logger.info(f"Created {len(segments)} fixed segments")
            return segments
            
        audio_float = audio_data.astype(np.float32) / 32768.0
        speech_timestamps = get_speech_timestamps(
            torch.from_numpy(audio_float), 
            vad_model, 
            sampling_rate=SAMPLE_RATE,
            min_speech_duration_ms=int(0.5 * 1000),
            min_silence_duration_ms=int(0.25 * 1000)
        )
        
        logger.info(f"Silero VAD found {len(speech_timestamps)} speech segments")
        return [{
            'audio': audio_data[s['start']:s['end']],
            'start_time': s['start'] / SAMPLE_RATE,
            'end_time': s['end'] / SAMPLE_RATE
        } for s in speech_timestamps]

    async def process_segment(self, segment: Dict, separate_speakers: bool = False) -> Dict:
        """Process a single audio segment with detailed logging"""
        logger.info(f"Processing segment: {segment['start_time']:.2f}s - {segment['end_time']:.2f}s")
        log_memory_usage("before segment processing")
        
        start_time = time.time()
        original_segment_audio = segment['audio']
        
        try:
            if not separate_speakers:
                logger.info("Processing without speaker separation")
                result = await self.service.process_sentiment_chunk(original_segment_audio.tobytes())
                processing_time = (time.time() - start_time) * 1000
                
                logger.info(f"Segment processed: {result.get('text', 'No text')[:50]}...")
                return {
                    'text': result['text'],
                    'sentiment': result['sentiment'],
                    'speaker': 'Unknown',
                    'confidence': 1.0,
                    'processing_time_ms': processing_time
                }
                
            # Process with speaker separation
            logger.info("Processing with speaker separation")
            loop = asyncio.get_event_loop()
            
            # Process audio separation
            separated_sources = await loop.run_in_executor(
                None, self.separation_pipeline.separate, original_segment_audio
            )
            
            # Process sentiment analysis
            master_result = await self.service.process_sentiment_chunk(original_segment_audio.tobytes())
            master_transcription = master_result.get('text', '').strip()
            
            if not master_transcription or master_transcription == "[NO SPEECH DETECTED]":
                return {
                    'text': master_transcription,
                    'sentiment': master_result['sentiment'],
                    'speaker': 'Unknown',
                    'confidence': 0.0,
                    'processing_time_ms': (time.time() - start_time) * 1000
                }
            
            # Identify speakers from separated sources
            speaker_results = []
            for i, source_audio in enumerate(separated_sources):
                energy = np.sqrt(np.mean((source_audio.astype(np.float32) / 32768.0) ** 2))
                if energy < 0.01:
                    continue
                    
                logger.info(f"Processing source {i}: energy={energy:.4f}")
                speaker_id, similarity = self.speaker_identifier.identify_speaker(source_audio, source_audio)
                speaker_results.append({
                    'id': speaker_id,
                    'energy': energy,
                    'similarity': similarity
                })
            
            if not speaker_results:
                dominant_speaker = 'Unknown'
                confidence = 0.0
            else:
                dominant_speaker = max(speaker_results, key=lambda x: x['energy'])['id']
                confidence = max(speaker_results, key=lambda x: x['energy'])['similarity']
            
            processing_time = (time.time() - start_time) * 1000
            
            logger.info(f"Segment complete: speaker={dominant_speaker}, confidence={confidence:.3f}")
            return {
                'text': master_transcription,
                'sentiment': master_result['sentiment'],
                'speaker': dominant_speaker,
                'confidence': confidence,
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error processing segment: {e}", exc_info=True)
            processing_time = (time.time() - start_time) * 1000
            return {
                'text': 'Error processing segment',
                'sentiment': 'neutral',
                'speaker': 'Unknown',
                'confidence': 0.0,
                'processing_time_ms': processing_time
            }

    async def process_stream(self, audio_file: str, separate_speakers: bool = False) -> Dict:
        """Process complete audio stream with debug info"""
        logger.info("=== DEBUG STREAM PROCESSING START ===")
        log_memory_usage("stream start")
        
        try:
            # Initialize models
            logger.info("Initializing models...")
            self.initialize_models()
            log_memory_usage("after model init")
            
            # Load and preprocess audio
            logger.info(f"Loading audio file: {audio_file}")
            test_audio = self.load_audio_file(audio_file)
            if test_audio is None:
                return {'error': 'Failed to load audio file'}
                
            logger.info(f"Loaded audio: {len(test_audio)} samples")
            log_memory_usage("after audio load")
            
            # Get segments
            logger.info("Getting VAD segments...")
            segments = self.get_vad_segments(test_audio)
            if not segments:
                logger.warning("No speech segments detected")
                return {'results': [], 'stats': ProcessingStats()}
                
            logger.info(f"Found {len(segments)} segments")
            
            # Process segments
            results = []
            stats = ProcessingStats()
            stats.total_segments = len(segments)
            
            for i, segment in enumerate(segments, 1):
                logger.info(f"\n=== PROCESSING SEGMENT {i}/{len(segments)} ===")
                logger.info(f"Time range: {segment['start_time']:.2f}s - {segment['end_time']:.2f}s")
                logger.info(f"Audio samples: {len(segment['audio'])}")
                
                result = await self.process_segment(segment, separate_speakers)
                results.append(result)
                
                # Update stats
                stats.total_processing_time_ms += result['processing_time_ms']
                stats.max_processing_time_ms = max(stats.max_processing_time_ms, result['processing_time_ms'])
                
                logger.info(f"Result: {result['text'][:50]}...")
                logger.info(f"Speaker: {result['speaker']} (confidence: {result['confidence']:.2f})")
                logger.info(f"Processing time: {result['processing_time_ms']:.1f}ms")
                
                # Memory check every 5 segments
                if i % 5 == 0:
                    log_memory_usage(f"after segment {i}")
                    
            # Calculate final stats
            if stats.total_segments > 0:
                stats.avg_processing_time_ms = stats.total_processing_time_ms / stats.total_segments
            
            stats.speaker_count = len(set(r['speaker'] for r in results if r['speaker'] != 'Unknown'))
            stats.memory_usage_mb = 0.0
            
            logger.info("=== DEBUG PROCESSING COMPLETE ===")
            log_memory_usage("final")
            
            return {
                'results': results,
                'stats': {
                    'total_segments': stats.total_segments,
                    'avg_processing_time_ms': stats.avg_processing_time_ms,
                    'max_processing_time_ms': stats.max_processing_time_ms,
                    'speaker_count': stats.speaker_count,
                    'fallback_count': stats.fallback_count
                }
            }
            
        except Exception as e:
            logger.error(f"Fatal error in process_stream: {e}", exc_info=True)
            log_memory_usage("error state")
            raise

async def debug_run(audio_file: str, separate_speakers: bool = False, config: Dict = None):
    """Debug version of main processing"""
    logger.info("Starting debug run...")
    logger.info(f"Audio file: {audio_file}")
    logger.info(f"Separate speakers: {separate_speakers}")
    
    try:
        processor = DebugStreamProcessor(config)
        result = await processor.process_stream(audio_file, separate_speakers)
        return result
        
    except Exception as e:
        logger.error(f"Debug run failed: {e}", exc_info=True)
        log_memory_usage("debug failure")
        raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Debug Stream Simulation")
    parser.add_argument("--audio", type=str, required=True, help="Path to audio file")
    parser.add_argument("--separate-speakers", action="store_true", help="Enable speaker separation")
    parser.add_argument("--config", type=str, help="JSON config file")
    
    args = parser.parse_args()
    
    config = None
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    try:
        result = asyncio.run(debug_run(args.audio, args.separate_speakers, config))
        
        # Print summary
        print("\n=== DEBUG SUMMARY ===")
        print(f"Total segments: {result['stats']['total_segments']}")
        print(f"Average processing time: {result['stats']['avg_processing_time_ms']:.1f}ms")
        print(f"Speakers detected: {result['stats']['speaker_count']}")
        
    except Exception as e:
        logger.error(f"Debug run failed: {e}")
        sys.exit(1)