"""
Audio Preparation Service

Provides unified audio preparation for different TTS providers,
including Whisper transcription, segmentation, and provider-specific preprocessing.
Based on Trelis TTS fine-tuning approach for optimal voice cloning results.
"""

import os
import json
import logging
import tempfile
import asyncio
import subprocess
import uuid
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import soundfile as sf
import numpy as np
from src.services.audio_separation_service import audio_separation_service
from src.services.realtime_analysis_service import get_realtime_analysis_service
from src.services.comprehensive_audio_service import comprehensive_audio_service

logger = logging.getLogger(__name__)


class AudioPreparationService:
    """Unified service for preparing audio for various TTS providers"""
    
    def __init__(self):
        """Initialize the audio preparation service"""
        self.temp_dir = tempfile.mkdtemp(prefix="audio_prep_")
        
        logger.info("Audio Preparation Service initialized - Using Whisper v3 ASR via realtime service")
    
    async def prepare_audio(
        self,
        audio_path: str,
        provider: str = "chatterbox",
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Prepare audio for TTS provider with optional Whisper processing
        
        Args:
            audio_path: Path to input audio file
            provider: TTS provider name
            config: Preparation configuration
                - use_whisper: Enable Whisper transcription
                - segment_audio: Split into segments
                - max_segment_duration: Max segment length (seconds)
                - transcribe: Generate transcript
                - clean_silence: Remove silence
                - provider_specific: Provider-specific options
        
        Returns:
            Dictionary containing:
                - prepared_audio_path: Path to prepared audio
                - transcription: Optional transcript
                - segments: Optional list of segments
                - metadata: Additional preparation metadata
        """
        try:
            # Default configuration
            default_config = {
                "use_whisper": True,
                "segment_audio": True,
                "max_segment_duration": 30,
                "transcribe": True,
                "clean_silence": True,
                "provider_specific": {}
            }
            
            # Merge with provided config
            if config:
                default_config.update(config)
            config = default_config
            
            # Provider-specific preparation
            if provider == "chatterbox":
                return await self._prepare_for_chatterbox(audio_path, config)
            elif provider == "elevenlabs":
                return await self._prepare_for_elevenlabs(audio_path, config)
            elif provider == "transcription":
                return await self._prepare_for_transcription(audio_path, config)
            else:
                # Default preparation (basic conversion)
                return await self._prepare_default(audio_path, config)
                
        except Exception as e:
            logger.error(f"Error preparing audio: {str(e)}")
            raise
    
    async def _prepare_for_chatterbox(
        self,
        audio_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare audio specifically for Chatterbox TTS
        Using Trelis approach: Whisper transcription + segmentation
        """
        result = {
            "prepared_audio_path": audio_path,
            "transcription": None,
            "segments": [],
            "metadata": {}
        }
        
        try:
            # Step 1: Separate vocals if requested (for cleaner voice cloning)
            if config.get("separate_voices", True):
                logger.info("Extracting vocals for voice cloning")
                
                separation_config = {
                    "extract_vocals": True,
                    "min_speakers": 1,
                    "max_speakers": 1,  # Voice cloning is single speaker
                    "min_duration": 1.0
                }
                
                separation_result = await audio_separation_service.separate_and_diarize(
                    audio_path,
                    config=separation_config
                )
                
                # Use vocals for all subsequent processing
                if separation_result.get("vocals_path"):
                    audio_path = separation_result["vocals_path"]
                    result["metadata"]["vocals_extracted"] = True
                    logger.info(f"Using extracted vocals: {audio_path}")
            
            # Transcribe with Whisper v3 via realtime service
            logger.info(f"Transcribing audio with Whisper v3 ASR: {audio_path}")
            
            # Get realtime analysis service
            realtime_service = await get_realtime_analysis_service()
            
            # Load and process audio directly
            audio_data, sample_rate = sf.read(audio_path, dtype='int16')
            audio_bytes = audio_data.tobytes()
            
            # Process with realtime analysis service
            analysis_result = await realtime_service.process_sentiment_chunk(audio_bytes)
            
            # Create transcription result in expected format
            transcription_result = {
                "transcript": analysis_result.get("text", "").strip(),
                "language": "en",
                "sentiment": analysis_result.get("sentiment", "neutral"),
                "tokens": analysis_result.get("tokens", [])
            }
            
            # Store transcription
            result["transcription"] = transcription_result.get("transcript", "").strip()
            result["metadata"]["language"] = transcription_result.get("language", "en")
            
            # Process segments if enabled
            if config.get("segment_audio"):
                transcript_text = transcription_result.get("transcript", "")
                if transcript_text:
                    # Create basic segments for chatterbox processing
                    sentences = [s.strip() for s in transcript_text.split('.') if s.strip()]
                    segments = []
                    current_time = 0.0
                    audio_duration = len(audio_data) / sample_rate if len(audio_data) > 0 else 0
                    
                    for sentence in sentences:
                        if sentence:
                            # Estimate duration based on word count
                            word_count = len(sentence.split())
                            estimated_duration = min(word_count * 0.5, audio_duration - current_time)
                            
                            segments.append({
                                "text": sentence.strip(),
                                "start": current_time,
                                "end": current_time + estimated_duration,
                                "duration": estimated_duration,
                                "path": audio_path  # Use original audio for now
                            })
                            current_time += estimated_duration
                    
                    result["segments"] = segments
                    result["metadata"]["total_segments"] = len(segments)
                    result["metadata"]["total_duration"] = current_time
            
            # Additional Chatterbox-specific processing
            if config.get("clean_silence"):
                cleaned_path = await self._remove_silence(result["prepared_audio_path"])
                if cleaned_path != result["prepared_audio_path"]:
                    result["prepared_audio_path"] = cleaned_path
                    result["metadata"]["silence_removed"] = True
            
            # Ensure correct format for Chatterbox (24kHz, mono)
            final_path = await self._ensure_audio_format(
                result["prepared_audio_path"],
                sample_rate=24000,
                channels=1
            )
            result["prepared_audio_path"] = final_path
            
            # Log the complete processing chain
            logger.info(f"Chatterbox audio preparation complete: "
                       f"vocals_extracted={result['metadata'].get('vocals_extracted', False)}, "
                       f"segments={len(result['segments'])}, "
                       f"silence_removed={result['metadata'].get('silence_removed', False)}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in Chatterbox preparation: {str(e)}")
            raise
    
    async def _prepare_for_elevenlabs(
        self,
        audio_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare audio specifically for ElevenLabs
        (Placeholder for future implementation)
        """
        # ElevenLabs may have different requirements
        # For now, use default preparation
        return await self._prepare_default(audio_path, config)
    
    async def _prepare_for_transcription(
        self,
        audio_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare audio specifically for transcription
        Focused on getting the best transcription quality
        """
        result = {
            "prepared_audio_path": audio_path,
            "transcription": None,
            "segments": [],
            "metadata": {}
        }
        
        try:
            # Step 1: Separate vocals and identify speakers if requested
            if config.get("separate_voices", True) or config.get("identify_speakers", True):
                logger.info("Performing audio separation and speaker diarization")
                
                separation_config = {
                    "extract_vocals": config.get("separate_voices", True),
                    "min_speakers": config.get("min_speakers", 1),
                    "max_speakers": config.get("max_speakers", 10),
                    "min_duration": config.get("min_speaker_duration", 1.0)
                }
                
                separation_result = await audio_separation_service.separate_and_diarize(
                    audio_path,
                    config=separation_config
                )
                
                # Use vocals if extracted, otherwise use original
                if separation_result.get("vocals_path"):
                    audio_path = separation_result["vocals_path"]
                    result["metadata"]["vocals_extracted"] = True
                
                # Store diarization results
                result["diarization"] = separation_result.get("diarization")
                result["metadata"]["speakers_identified"] = separation_result.get("diarization", {}).get("speakers", 1)
            
            # Transcribe with Whisper v3 via realtime service
            logger.info(f"Transcribing audio with Whisper v3 ASR: {audio_path}")
            
            # Clean silence if requested (after vocal extraction for better results)
            if config.get("clean_silence", True):
                cleaned_path = await self._remove_silence(audio_path)
                audio_path = cleaned_path
                result["metadata"]["silence_removed"] = True
            
            # Ensure proper format for ASR (16kHz is optimal)
            formatted_path = await self._ensure_audio_format(
                audio_path,
                sample_rate=16000,  # Whisper prefers 16kHz for stable results
                channels=1
            )
            
            # Use the proven comprehensive audio processing approach
            logger.info("Using comprehensive audio processing service (based on working stream_simulation.py)")
            
            comprehensive_result = await comprehensive_audio_service.process_audio_comprehensive(
                audio_path=formatted_path,
                separate_speakers=config.get("identify_speakers", True),
                use_pyannote=True,  # Use pyannote diarization
                max_seconds=None
            )
            
            if "error" in comprehensive_result:
                logger.error(f"Comprehensive processing failed: {comprehensive_result['error']}")
                # Fallback to basic realtime service
                realtime_service = await get_realtime_analysis_service()
                audio_data, sample_rate = sf.read(formatted_path, dtype='int16')
                audio_bytes = audio_data.tobytes()
                analysis_result = await realtime_service.process_sentiment_chunk(audio_bytes)
                
                transcription_result = {
                    "transcript": analysis_result.get("text", "").strip(),
                    "language": "en",
                    "sentiment": analysis_result.get("sentiment", "neutral"),
                    "tokens": analysis_result.get("tokens", [])
                }
            else:
                # Use comprehensive results and format for Convex schema
                segments = comprehensive_result.get("segments", [])
                
                # Convert segments to Convex speaker format
                convex_speakers = []
                for segment in segments:
                    convex_speakers.append({
                        "speaker": segment.get("speaker", "Unknown"),
                        "start": segment.get("start_time", 0),
                        "end": segment.get("end_time", 0), 
                        "duration": segment.get("duration", 0),
                        "text": segment.get("text", ""),
                        "sentiment": segment.get("sentiment", "neutral"),
                        "speaker_similarity": segment.get("speaker_similarity", 0.0),
                        "langextract_analysis": segment.get("langextract_analysis", {}),
                        "emotion2vec": segment.get("emotion2vec", {})
                    })
                
                transcription_result = {
                    "transcript": comprehensive_result.get("transcript", "").strip(),
                    "language": comprehensive_result.get("language", "en"),
                    "segments": convex_speakers,  # Use formatted speaker data
                    "speakers": comprehensive_result.get("speakers", []),
                    "total_segments": comprehensive_result.get("total_segments", 0),
                    "processing_approach": comprehensive_result.get("processing_approach", "comprehensive")
                }
            
            # Store full transcription
            result["transcription"] = transcription_result.get("transcript", "").strip()
            result["metadata"]["language"] = transcription_result.get("language", "en")
            
            # Process segments with detailed information
            if config.get("segment_audio"):
                # Create basic segments from transcription
                transcript_text = transcription_result.get("transcript", "")
                if transcript_text:
                    # Simple sentence-based segmentation
                    sentences = [s.strip() for s in transcript_text.split('.') if s.strip()]
                    segments = []
                    current_time = 0.0
                    audio_duration = len(audio_data) / sample_rate if len(audio_data) > 0 else 0
                    
                    for i, sentence in enumerate(sentences):
                        if sentence:
                            # Estimate duration based on word count
                            word_count = len(sentence.split())
                            estimated_duration = min(word_count * 0.5, audio_duration - current_time)
                            
                            segment_data = {
                                "text": sentence.strip(),
                                "start": current_time,
                                "end": current_time + estimated_duration,
                                "duration": estimated_duration,
                                "speaker": "SPEAKER_00",
                                "sentiment": transcription_result.get("sentiment", "neutral")
                            }
                            segments.append(segment_data)
                            current_time += estimated_duration
                    
                    result["segments"] = segments
                    result["metadata"]["total_segments"] = len(segments)
                    
                    # Calculate total duration
                    if segments:
                        result["metadata"]["total_duration"] = segments[-1]["end"]
                    
                    # Group segments by speaker
                    result["segments_by_speaker"] = self._group_segments_by_speaker(segments)
            
            # Clean up temporary formatted file if different from input
            if formatted_path != audio_path and os.path.exists(formatted_path):
                os.unlink(formatted_path)
            
            result["prepared_audio_path"] = audio_path

            # Extra logging summary
            logger.info(
                "Transcription prepared (Whisper v3): length_chars=%d, speakers=%s",
                len(result.get("transcription") or ""),
                result.get("diarization", {}).get("speakers") if result.get("diarization") else "n/a",
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error in transcription preparation: {str(e)}")
            raise
    
    async def _prepare_default(
        self,
        audio_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Default audio preparation (basic conversion)"""
        result = {
            "prepared_audio_path": audio_path,
            "transcription": None,
            "segments": [],
            "metadata": {}
        }
        
        # Basic format conversion
        final_path = await self._ensure_audio_format(audio_path)
        result["prepared_audio_path"] = final_path
        
        return result
    
    async def _process_asr_segments(
        self,
        audio_path: str,
        segments: List[Dict[str, Any]],
        max_duration: int
    ) -> Dict[str, Any]:
        """
        Process ASR segments and create audio chunks
        Based on Trelis approach for optimal TTS training
        """
        chunks = []
        current_chunk = None
        
        # Group segments into chunks <= max_duration
        for segment in segments:
            start, end, text = segment["start"], segment["end"], segment["text"]
            duration = end - start
            
            # Skip segments that are too long individually
            if duration > max_duration:
                logger.warning(f"Skipping segment >={max_duration}s: {text[:50]}...")
                continue
            
            if current_chunk is None:
                current_chunk = {"start": start, "end": end, "text": text}
            elif (end - current_chunk["start"]) <= max_duration:
                # Extend current chunk
                current_chunk["end"] = end
                current_chunk["text"] += " " + text
            else:
                # Save current chunk and start new one
                chunks.append(current_chunk)
                current_chunk = {"start": start, "end": end, "text": text}
        
        # Don't forget the last chunk
        if current_chunk:
            chunks.append(current_chunk)
        
        logger.info(f"Created {len(chunks)} audio chunks from {len(segments)} segments")
        
        # Extract audio chunks
        chunk_files = []
        for i, chunk in enumerate(chunks):
            chunk_path = os.path.join(self.temp_dir, f"chunk_{uuid.uuid4().hex}.wav")
            
            # Use ffmpeg to extract chunk
            cmd = [
                "ffmpeg", "-loglevel", "error", "-y",
                "-i", audio_path,
                "-ss", str(chunk["start"]),
                "-to", str(chunk["end"]),
                "-ar", "24000",  # 24kHz for TTS
                "-ac", "1",      # Mono
                chunk_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            _, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"FFmpeg error: {stderr.decode()}")
                continue
            
            chunk_files.append({
                "path": chunk_path,
                "text": chunk["text"].strip(),
                "start": chunk["start"],
                "end": chunk["end"],
                "duration": chunk["end"] - chunk["start"]
            })
        
        # Merge chunks back into single file
        merged_path = os.path.join(self.temp_dir, f"prepared_{uuid.uuid4().hex}.wav")
        
        if chunk_files:
            # Create file list for ffmpeg concat
            list_path = os.path.join(self.temp_dir, "concat_list.txt")
            with open(list_path, 'w') as f:
                for chunk in chunk_files:
                    f.write(f"file '{chunk['path']}'\n")
            
            # Concatenate chunks
            cmd = [
                "ffmpeg", "-loglevel", "error", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", list_path,
                "-c", "copy",
                merged_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await process.communicate()
            
            # Clean up temp files
            os.unlink(list_path)
            for chunk in chunk_files:
                if os.path.exists(chunk["path"]):
                    os.unlink(chunk["path"])
        else:
            # No valid chunks, use original
            merged_path = audio_path
        
        # Calculate total duration
        total_duration = sum(chunk["duration"] for chunk in chunk_files)
        
        return {
            "segments": chunk_files,
            "merged_audio_path": merged_path,
            "total_duration": total_duration
        }
    
    async def _remove_silence(self, audio_path: str, threshold_db: float = -40.0) -> str:
        """
        Remove silence from audio file
        
        Args:
            audio_path: Input audio path
            threshold_db: Silence threshold in dB
            
        Returns:
            Path to audio with silence removed
        """
        try:
            output_path = os.path.join(self.temp_dir, f"desilenced_{uuid.uuid4().hex}.wav")
            
            # Use ffmpeg to remove silence
            cmd = [
                "ffmpeg", "-loglevel", "error", "-y",
                "-i", audio_path,
                "-af", f"silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold={threshold_db}dB",
                output_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            _, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"Error removing silence: {stderr.decode()}")
                return audio_path
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error in silence removal: {str(e)}")
            return audio_path
    
    async def _ensure_audio_format(
        self,
        audio_path: str,
        sample_rate: int = 24000,
        channels: int = 1,
        format: str = "wav"
    ) -> str:
        """
        Ensure audio is in the correct format
        
        Args:
            audio_path: Input audio path
            sample_rate: Target sample rate
            channels: Number of channels (1=mono, 2=stereo)
            format: Output format
            
        Returns:
            Path to formatted audio
        """
        try:
            # Check current format
            info = sf.info(audio_path)
            
            # If already correct format, return as-is
            if (info.samplerate == sample_rate and 
                info.channels == channels and 
                audio_path.endswith(f".{format}")):
                return audio_path
            
            # Convert to target format
            output_path = os.path.join(self.temp_dir, f"formatted_{uuid.uuid4().hex}.{format}")
            
            cmd = [
                "ffmpeg", "-loglevel", "error", "-y",
                "-i", audio_path,
                "-ar", str(sample_rate),
                "-ac", str(channels),
                output_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            _, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"Error converting audio format: {stderr.decode()}")
                return audio_path
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error ensuring audio format: {str(e)}")
            return audio_path
    
    def _find_speaker_for_segment(
        self,
        whisper_segment: Dict[str, Any],
        diarization_segments: List[Dict[str, Any]]
    ) -> str:
        """
        Find the speaker for a Whisper segment based on diarization results
        
        Args:
            whisper_segment: Whisper transcription segment
            diarization_segments: Speaker diarization segments
            
        Returns:
            Speaker label
        """
        segment_start = whisper_segment["start"]
        segment_end = whisper_segment["end"]
        segment_mid = (segment_start + segment_end) / 2
        
        # Find speaker with most overlap
        best_speaker = "SPEAKER_UNKNOWN"
        best_overlap = 0
        
        for diar_seg in diarization_segments:
            # Calculate overlap
            overlap_start = max(segment_start, diar_seg["start"])
            overlap_end = min(segment_end, diar_seg["end"])
            overlap_duration = max(0, overlap_end - overlap_start)
            
            # Also check if segment midpoint falls within diarization segment
            midpoint_match = diar_seg["start"] <= segment_mid <= diar_seg["end"]
            
            # Prefer midpoint match, then overlap duration
            if midpoint_match and overlap_duration > 0:
                return diar_seg["speaker"]
            elif overlap_duration > best_overlap:
                best_overlap = overlap_duration
                best_speaker = diar_seg["speaker"]
        
        return best_speaker
    
    def _group_segments_by_speaker(
        self,
        segments: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Group transcription segments by speaker
        
        Args:
            segments: List of segments with speaker information
            
        Returns:
            Dictionary mapping speaker labels to their segments
        """
        grouped = {}
        
        for segment in segments:
            speaker = segment.get("speaker", "SPEAKER_UNKNOWN")
            if speaker not in grouped:
                grouped[speaker] = []
            grouped[speaker].append(segment)
        
        return grouped
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            logger.warning(f"Error cleaning up temp files: {str(e)}")
    
    def __del__(self):
        """Cleanup on deletion"""
        self.cleanup()


# Global instance
audio_preparation_service = AudioPreparationService()