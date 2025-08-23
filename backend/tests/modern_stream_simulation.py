#!/usr/bin/env python3
"""
Modern Stream Simulation with Advanced Speaker Diarization
Drop-in replacement for stream_simulation.py using modern research-backed approaches
"""

import os
import sys
import logging
import numpy as np
import asyncio
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import time
import json
from dataclasses import dataclass
from collections import defaultdict

# Add the project root to the Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

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

# Import modern components
from src.services.modern_stateful_speaker_identifier import ModernStatefulSpeakerIdentifier
from src.services.realtime_analysis_service import get_realtime_analysis_service

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

class ModernCascadedSeparationPipeline:
    """Modern separation pipeline with integrated diarization"""
    
    def __init__(self, output_dir="modern_separation_cache"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"ModernCascadedSeparationPipeline using device: {self.device}")
        
        self.separator = separator_model.from_hparams(
            "speechbrain/sepformer-whamr-enhancement", 
            savedir=Path(output_dir)/'sepformer', 
            run_opts={"device": self.device}
        )
        
    def separate(self, audio_chunk_np: np.ndarray) -> List[np.ndarray]:
        """Separate audio into individual speaker sources"""
        if audio_chunk_np.dtype != np.float32:
            audio_chunk_np = audio_chunk_np.astype(np.float32) / 32768.0
            
        audio_tensor = torch.from_numpy(audio_chunk_np).to(self.device).unsqueeze(0)
        est_sources = self.separator.separate_batch(audio_tensor)
        est_sources_np = est_sources.squeeze(0).cpu().numpy().T
        
        return [(source * 32767).astype(np.int16) for source in est_sources_np]

class ModernStreamProcessor:
    """Main processor for modern streaming diarization"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {
            'use_graph_clustering': True,
            'use_adaptive_thresholds': True,
            'use_quality_weighting': True,
            'use_temporal_context': True,
            'similarity_threshold': 0.7,
            'max_speakers': 20
        }
        
        # Initialize modern speaker identifier
        self.speaker_identifier = ModernStatefulSpeakerIdentifier(
            base_threshold=self.config['similarity_threshold'],
            max_speakers=self.config['max_speakers'],
            use_graph_clustering=self.config['use_graph_clustering'],
            use_adaptive_thresholds=self.config['use_adaptive_thresholds'],
            use_quality_weighting=self.config['use_quality_weighting'],
            use_temporal_context=self.config['use_temporal_context']
        )
        
        self.separation_pipeline = None
        self.service = None
        
    def initialize_models(self):
        """Initialize required models"""
        if SPEECHBRAIN_AVAILABLE:
            self.separation_pipeline = ModernCascadedSeparationPipeline()
        self.service = get_realtime_analysis_service()
        
    def load_audio_file(self, file_path: str) -> np.ndarray:
        """Load and preprocess audio file"""
        try:
            import librosa
            audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
            return (audio * 32767).astype(np.int16)
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            return None
            
    def get_vad_segments(self, audio_data: np.ndarray) -> List[Dict]:
        """Get voice activity detection segments"""
        if not SILERO_AVAILABLE:
            logger.warning("Silero VAD not available, using fixed segments")
            segment_duration = int(SAMPLE_RATE * 2.0)  # 2-second segments
            segments = []
            for i in range(0, len(audio_data), segment_duration):
                end = min(i + segment_duration, len(audio_data))
                segments.append({
                    'audio': audio_data[i:end],
                    'start_time': i / SAMPLE_RATE,
                    'end_time': end / SAMPLE_RATE
                })
            return segments
            
        audio_float = audio_data.astype(np.float32) / 32768.0
        speech_timestamps = get_speech_timestamps(
            torch.from_numpy(audio_float), 
            vad_model, 
            sampling_rate=SAMPLE_RATE,
            min_speech_duration_ms=int(0.5 * 1000),
            min_silence_duration_ms=int(0.25 * 1000)
        )
        
        return [{
            'audio': audio_data[s['start']:s['end']],
            'start_time': s['start'] / SAMPLE_RATE,
            'end_time': s['end'] / SAMPLE_RATE
        } for s in speech_timestamps]

    async def process_segment(self, segment: Dict, separate_speakers: bool = False) -> Dict:
        """Process a single audio segment"""
        start_time = time.time()
        
        original_segment_audio = segment['audio']
        
        if not separate_speakers:
            # Simple processing without speaker separation
            result = await self.service.process_sentiment_chunk(original_segment_audio.tobytes())
            processing_time = (time.time() - start_time) * 1000
            
            return {
                'text': result['text'],
                'sentiment': result['sentiment'],
                'speaker': 'Unknown',
                'confidence': 1.0,
                'processing_time_ms': processing_time
            }
        
        # Process with speaker separation
        loop = asyncio.get_event_loop()
        
        try:
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
            for source_audio in separated_sources:
                energy = np.sqrt(np.mean((source_audio.astype(np.float32) / 32768.0) ** 2))
                if energy < 0.01:
                    continue
                    
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
            
            return {
                'text': master_transcription,
                'sentiment': master_result['sentiment'],
                'speaker': dominant_speaker,
                'confidence': confidence,
                'processing_time_ms': processing_time
            }
        except Exception as e:
            logger.error(f"Error processing segment: {e}")
            processing_time = (time.time() - start_time) * 1000
            return {
                'text': 'Error processing segment',
                'sentiment': 'neutral',
                'speaker': 'Unknown',
                'confidence': 0.0,
                'processing_time_ms': processing_time
            }

    async def process_stream(self, audio_file: str, separate_speakers: bool = False) -> Dict:
        """Process complete audio stream"""
        logger.info("=== MODERN STREAM SIMULATION START ===")
        
        # Initialize models
        self.initialize_models()
        
        # Load and preprocess audio
        test_audio = self.load_audio_file(audio_file)
        if test_audio is None:
            return {'error': 'Failed to load audio file'}
        
        # Get segments
        segments = self.get_vad_segments(test_audio)
        if not segments:
            logger.warning("No speech segments detected")
            return {'results': [], 'stats': ProcessingStats()}
        
        # Process segments
        results = []
        stats = ProcessingStats()
        stats.total_segments = len(segments)
        
        for i, segment in enumerate(segments, 1):
            print(f"\n--- PROCESSING SEGMENT {i}/{len(segments)} "
                  f"(Time: {segment['start_time']:.2f}s - {segment['end_time']:.2f}s) ---")
            
            result = await self.process_segment(segment, separate_speakers)
            results.append(result)
            
            # Update stats
            stats.total_processing_time_ms += result['processing_time_ms']
            stats.max_processing_time_ms = max(stats.max_processing_time_ms, result['processing_time_ms'])
            
            print(f"Speaker: {result['speaker']} (confidence: {result['confidence']:.2f})")
            print(f"Text: {result['text']}")
            print(f"Sentiment: {result['sentiment']}")
            print(f"Processing time: {result['processing_time_ms']:.1f}ms")
        
        # Calculate final stats
        if stats.total_segments > 0:
            stats.avg_processing_time_ms = stats.total_processing_time_ms / stats.total_segments
        
        stats.speaker_count = len(set(r['speaker'] for r in results if r['speaker'] != 'Unknown'))
        stats.memory_usage_mb = 0.0  # TODO: Add memory tracking
        
        # Get performance stats from identifier
        if separate_speakers:
            perf_stats = self.speaker_identifier.get_performance_stats()
            stats.fallback_count = perf_stats.get('fallback_count', 0)
        
        logger.info("=== MODERN STREAM SIMULATION COMPLETE ===")
        
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

async def run_modern_stream(audio_file: str, separate_speakers: bool = False, 
                          config: Dict = None) -> Dict:
    """Main entry point for modern stream processing"""
    processor = ModernStreamProcessor(config)
    return await processor.process_stream(audio_file, separate_speakers)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Modern Stream Simulation with Advanced Diarization")
    parser.add_argument("--audio", type=str, required=True, help="Path to audio file")
    parser.add_argument("--separate-speakers", action="store_true", help="Enable speaker separation")
    parser.add_argument("--config", type=str, help="JSON config file")
    
    args = parser.parse_args()
    
    config = None
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    result = asyncio.run(run_modern_stream(args.audio, args.separate_speakers, config))
    
    # Print summary
    print("\n=== PROCESSING SUMMARY ===")
    print(f"Total segments: {result['stats']['total_segments']}")
    print(f"Average processing time: {result['stats']['avg_processing_time_ms']:.1f}ms")
    print(f"Speakers detected: {result['stats']['speaker_count']}")
    if args.separate_speakers:
        print(f"Fallbacks to legacy: {result['stats']['fallback_count']}")