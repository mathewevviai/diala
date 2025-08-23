#!/usr/bin/env python3
"""
Fixed version of debug_stream_simulation.py with proper speaker identification
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

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(name)s | %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("funasr").setLevel(logging.ERROR)
logging.getLogger("speechbrain").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

from src.services.integrated_speaker_identifier import IntegratedSpeakerIdentifier
from src.services.realtime_analysis_service import get_realtime_analysis_service

print("=== DEBUG: Initial imports completed ===")

tracemalloc.start()

def log_memory_usage(stage: str):
    """Log detailed memory usage"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        logger.info(f"Memory at {stage}: {memory_info.rss / 1024 / 1024:.2f} MB")
        gc.collect()
    except Exception as e:
        logger.error(f"Error logging memory: {e}")

try:
    import torch
    import torchaudio
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    SPEECHBRAIN_AVAILABLE = True
except ImportError:
    logger.warning("Could not import SpeechBrain")
    SPEECHBRAIN_AVAILABLE = False

try:
    if 'torch' not in sys.modules: import torch
    torch.set_num_threads(1)
    vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False, trust_repo=True)
    (get_speech_timestamps, _, read_audio, _, _) = utils
    SILERO_AVAILABLE = True
    logger.info("Silero VAD loaded successfully")
except Exception as e:
    logger.warning(f"Could not load Silero VAD: {e}")
    SILERO_AVAILABLE = False

SAMPLE_RATE = 16000

@dataclass
class ProcessingStats:
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
        try:
            logger.info("Attempting to load SpeechBrain separation model...")
            from speechbrain.pretrained import SepformerSeparation as separator_model
            # Landini et al. (2022) - Using pre-trained models for source separation is a common preprocessing step
            self.separator = separator_model.from_hparams("speechbrain/sepformer-whamr-enhancement", savedir=Path(output_dir)/'sepformer', run_opts={"device": self.device})
            logger.info("SpeechBrain separation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load SpeechBrain model: {e}")
            raise
            
    def separate(self, audio_chunk_np: np.ndarray) -> List[np.ndarray]:
        log_memory_usage("before separation")
        try:
            if audio_chunk_np.dtype != np.float32: audio_chunk_np = audio_chunk_np.astype(np.float32) / 32768.0
            audio_tensor = torch.from_numpy(audio_chunk_np).to(self.device).unsqueeze(0)
            est_sources = self.separator.separate_batch(audio_tensor)
            est_sources_np = est_sources.squeeze(0).cpu().numpy().T
            result = [(source * 32767).astype(np.int16) for source in est_sources_np]
            log_memory_usage("after separation")
            return result
        except Exception as e:
            logger.error(f"Error in separation: {e}")
            raise

class DebugStreamProcessor:
    def __init__(self, config: Dict = None):
        log_memory_usage("init start")
        self.config = config or {'use_graph_clustering': True, 'use_adaptive_thresholds': True, 'use_quality_weighting': True, 'use_temporal_context': True, 'similarity_threshold': 0.7, 'max_speakers': 20}
        logger.info("Creating IntegratedSpeakerIdentifier...")
        try:
            self.speaker_identifier = IntegratedSpeakerIdentifier(
                base_threshold=self.config['similarity_threshold'], max_speakers=self.config['max_speakers'],
                use_graph_clustering=self.config['use_graph_clustering'], use_adaptive_thresholds=self.config['use_adaptive_thresholds'],
                use_quality_weighting=self.config['use_quality_weighting'], use_temporal_context=self.config['use_temporal_context']
            )
            logger.info("IntegratedSpeakerIdentifier created successfully")
        except Exception as e:
            logger.error(f"Failed to create IntegratedSpeakerIdentifier: {e}")
            raise
        self.separation_pipeline = None
        self.service = None
        log_memory_usage("init complete")
        
    def initialize_models(self):
        log_memory_usage("before model init")
        try:
            if SPEECHBRAIN_AVAILABLE: self.separation_pipeline = DebugCascadedSeparationPipeline()
            self.service = get_realtime_analysis_service()
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise
        log_memory_usage("after model init")
        
    def load_audio_file(self, file_path: str) -> np.ndarray:
        log_memory_usage("before audio load")
        try:
            import librosa
            audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
            result = (audio * 32767).astype(np.int16)
            log_memory_usage("after audio load")
            return result
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            return None
            
    def get_vad_segments(self, audio_data: np.ndarray) -> List[Dict]:
        if not SILERO_AVAILABLE:
            logger.warning("Silero VAD not available, using fixed segments")
            segment_duration = int(SAMPLE_RATE * 2.0)
            return [{'audio': audio_data[i:min(i + segment_duration, len(audio_data))], 'start_time': i / SAMPLE_RATE, 'end_time': min(i + segment_duration, len(audio_data)) / SAMPLE_RATE} for i in range(0, len(audio_data), segment_duration)]
        audio_float = audio_data.astype(np.float32) / 32768.0
        speech_timestamps = get_speech_timestamps(torch.from_numpy(audio_float), vad_model, sampling_rate=SAMPLE_RATE, min_speech_duration_ms=500, min_silence_duration_ms=250)
        return [{'audio': audio_data[s['start']:s['end']], 'start_time': s['start'] / SAMPLE_RATE, 'end_time': s['end'] / SAMPLE_RATE} for s in speech_timestamps]

    async def process_segment(self, segment: Dict, separate_speakers: bool = False) -> Dict:
        log_memory_usage("before segment processing")
        start_time = time.time()
        original_segment_audio = segment['audio']
        
        try:
            result = await self.service.process_sentiment_chunk(original_segment_audio.tobytes())
            master_transcription = result.get('text', '').strip()
            
            if not master_transcription or master_transcription == "[NO SPEECH DETECTED]":
                return {'text': master_transcription, 'sentiment': result['sentiment'], 'speaker': 'SILENCE', 'confidence': 1.0, 'processing_time_ms': (time.time() - start_time) * 1000}

            speaker_id = 'Unknown'
            confidence = 0.0

            if not separate_speakers:
                # FIX: Identify speaker even when not separating to avoid "Unknown"
                speaker_id, confidence = self.speaker_identifier.identify_speaker(original_segment_audio)
            else:
                loop = asyncio.get_event_loop()
                separated_sources = await loop.run_in_executor(None, self.separation_pipeline.separate, original_segment_audio)
                
                speaker_results = []
                for source_audio in separated_sources:
                    energy = np.sqrt(np.mean((source_audio.astype(np.float32) / 32768.0) ** 2))
                    if energy < 0.01: continue
                    
                    # FIX: Use the integrated identifier which handles its own embedding
                    id, sim = self.speaker_identifier.identify_speaker(source_audio)
                    speaker_results.append({'id': id, 'energy': energy, 'similarity': sim})
                
                if speaker_results:
                    # FIX: Choose dominant speaker based on highest confidence (similarity), not just energy
                    dominant_speaker_result = max(speaker_results, key=lambda x: x['similarity'])
                    speaker_id = dominant_speaker_result['id']
                    confidence = dominant_speaker_result['similarity']
                else:
                    # If separation yields no valid sources, identify from original audio
                    speaker_id, confidence = self.speaker_identifier.identify_speaker(original_segment_audio)
            
            processing_time = (time.time() - start_time) * 1000
            
            return {'text': master_transcription, 'sentiment': result['sentiment'], 'speaker': speaker_id, 'confidence': confidence, 'processing_time_ms': processing_time}
            
        except Exception as e:
            logger.error(f"Error processing segment: {e}", exc_info=True)
            return {'text': 'Error processing segment', 'sentiment': 'neutral', 'speaker': 'ERROR', 'confidence': 0.0, 'processing_time_ms': (time.time() - start_time) * 1000}

    async def process_stream(self, audio_file: str, separate_speakers: bool = False) -> Dict:
        logger.info("=== DEBUG STREAM PROCESSING START ===")
        log_memory_usage("stream start")
        
        try:
            self.initialize_models()
            log_memory_usage("after model init")
            
            test_audio = self.load_audio_file(audio_file)
            if test_audio is None: return {'error': 'Failed to load audio file'}
            log_memory_usage("after audio load")
            
            segments = self.get_vad_segments(test_audio)
            if not segments: return {'results': [], 'stats': ProcessingStats()}
                
            results = []
            stats = ProcessingStats()
            stats.total_segments = len(segments)
            
            for i, segment in enumerate(segments, 1):
                logger.info(f"\n=== PROCESSING SEGMENT {i}/{len(segments)} ===")
                result = await self.process_segment(segment, separate_speakers)
                results.append(result)
                stats.total_processing_time_ms += result['processing_time_ms']
                stats.max_processing_time_ms = max(stats.max_processing_time_ms, result['processing_time_ms'])
                logger.info(f"Result: {result['text'][:50]}...")
                logger.info(f"Speaker: {result['speaker']} (confidence: {result['confidence']:.2f})")
                
                if i % 5 == 0: log_memory_usage(f"after segment {i}")
                    
            if stats.total_segments > 0: stats.avg_processing_time_ms = stats.total_processing_time_ms / stats.total_segments
            
            stats.speaker_count = len(set(r['speaker'] for r in results if r['speaker'] not in ['Unknown', 'SILENCE', 'ERROR']))
            
            logger.info("=== DEBUG PROCESSING COMPLETE ===")
            log_memory_usage("final")
            
            return {'results': results, 'stats': {k: v for k, v in stats.__dict__.items()}}
            
        except Exception as e:
            logger.error(f"Fatal error in process_stream: {e}", exc_info=True)
            log_memory_usage("error state")
            raise

async def debug_run(audio_file: str, separate_speakers: bool = False, config: Dict = None):
    try:
        processor = DebugStreamProcessor(config)
        return await processor.process_stream(audio_file, separate_speakers)
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
    
    config_data = None
    if args.config:
        with open(args.config, 'r') as f: config_data = json.load(f)
    
    try:
        final_result = asyncio.run(debug_run(args.audio, args.separate_speakers, config_data))
        print("\n=== DEBUG SUMMARY ===")
        print(json.dumps(final_result['stats'], indent=2))
    except Exception as e:
        logger.error(f"Main execution failed: {e}")
        sys.exit(1)
