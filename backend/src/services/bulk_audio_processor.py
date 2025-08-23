"""
Bulk Audio Processor Service

Provides batch processing capabilities for audio files, integrating with existing
audio preparation and separation services. Supports bulk transcription, vocal extraction,
and data export in multiple formats.
"""

import os
import json
import csv
import logging
import asyncio
import tempfile
import uuid
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from datetime import datetime
import concurrent.futures
from dataclasses import dataclass, asdict
import pandas as pd

from src.services.audio_preparation_service import audio_preparation_service
from src.services.audio_separation_service import audio_separation_service

logger = logging.getLogger(__name__)


@dataclass
class AudioProcessingResult:
    """Data class for storing individual audio processing results"""
    file_path: str
    file_name: str
    file_size: int
    duration: float
    transcription: str
    language: str
    segments: List[Dict[str, Any]]
    speaker_info: Dict[str, Any]
    metadata: Dict[str, Any]
    vocals_path: Optional[str] = None
    processing_time: float = 0.0
    error: Optional[str] = None
    success: bool = True


@dataclass
class BatchProcessingConfig:
    """Configuration for batch processing operations"""
    # Audio processing options
    use_whisper: bool = True
    segment_audio: bool = True
    max_segment_duration: int = 30
    clean_silence: bool = True
    separate_voices: bool = True
    identify_speakers: bool = True
    
    # Speaker diarization options
    min_speakers: int = 1
    max_speakers: int = 10
    min_speaker_duration: float = 1.0
    
    # Transcription options
    language: Optional[str] = None
    prompt: Optional[str] = None
    
    # Processing options
    max_workers: int = 4
    timeout_per_file: int = 300  # 5 minutes per file
    
    # Export options
    export_formats: List[str] = None
    export_directory: Optional[str] = None
    
    def __post_init__(self):
        if self.export_formats is None:
            self.export_formats = ["json", "csv"]


class BulkAudioProcessor:
    """Service for processing multiple audio files in batch operations"""
    
    def __init__(self):
        """Initialize the bulk audio processor"""
        self.temp_dir = tempfile.mkdtemp(prefix="bulk_audio_")
        self.results: List[AudioProcessingResult] = []
        self.current_batch_id = None
        self.processing_stats = {
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "total_duration": 0.0,
            "processing_time": 0.0,
            "start_time": None,
            "end_time": None
        }
        
        logger.info(f"Bulk Audio Processor initialized - temp dir: {self.temp_dir}")
    
    async def process_audio_batch(
        self,
        audio_files: List[str],
        config: Optional[BatchProcessingConfig] = None
    ) -> Dict[str, Any]:
        """
        Process multiple audio files in batch
        
        Args:
            audio_files: List of audio file paths to process
            config: Batch processing configuration
            
        Returns:
            Dictionary containing batch processing results and statistics
        """
        if config is None:
            config = BatchProcessingConfig()
        
        self.current_batch_id = str(uuid.uuid4())
        self.results = []
        self.processing_stats = {
            "total_files": len(audio_files),
            "processed_files": 0,
            "failed_files": 0,
            "total_duration": 0.0,
            "processing_time": 0.0,
            "start_time": datetime.now(),
            "end_time": None,
            "batch_id": self.current_batch_id
        }
        
        logger.info(f"Starting batch processing of {len(audio_files)} files")
        
        try:
            # Process files with concurrency control
            semaphore = asyncio.Semaphore(config.max_workers)
            
            async def process_single_file(file_path: str) -> AudioProcessingResult:
                async with semaphore:
                    return await self._process_single_audio_file(file_path, config)
            
            # Create tasks for all files
            tasks = [process_single_file(file_path) for file_path in audio_files]
            
            # Process with timeout
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Collect results and handle exceptions
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    error_result = AudioProcessingResult(
                        file_path=audio_files[i],
                        file_name=os.path.basename(audio_files[i]),
                        file_size=0,
                        duration=0.0,
                        transcription="",
                        language="unknown",
                        segments=[],
                        speaker_info={},
                        metadata={},
                        error=str(result),
                        success=False
                    )
                    self.results.append(error_result)
                    self.processing_stats["failed_files"] += 1
                else:
                    self.results.append(result)
                    if result.success:
                        self.processing_stats["processed_files"] += 1
                        self.processing_stats["total_duration"] += result.duration
                    else:
                        self.processing_stats["failed_files"] += 1
            
            self.processing_stats["end_time"] = datetime.now()
            self.processing_stats["processing_time"] = (
                self.processing_stats["end_time"] - self.processing_stats["start_time"]
            ).total_seconds()
            
            logger.info(f"Batch processing complete: {self.processing_stats['processed_files']} "
                       f"succeeded, {self.processing_stats['failed_files']} failed")
            
            # Export results if configured
            export_paths = {}
            if config.export_formats:
                export_paths = await self.export_transcriptions(
                    formats=config.export_formats,
                    export_directory=config.export_directory
                )
            
            return {
                "batch_id": self.current_batch_id,
                "statistics": self.processing_stats,
                "results": [asdict(result) for result in self.results],
                "export_paths": export_paths,
                "success": self.processing_stats["failed_files"] == 0
            }
            
        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")
            self.processing_stats["end_time"] = datetime.now()
            raise
    
    async def extract_vocals_batch(
        self,
        audio_files: List[str],
        model_name: str = "htdemucs",
        max_workers: int = 2
    ) -> Dict[str, Any]:
        """
        Extract vocals from multiple audio files in batch
        
        Args:
            audio_files: List of audio file paths
            model_name: Demucs model to use
            max_workers: Maximum concurrent extractions
            
        Returns:
            Dictionary containing extraction results
        """
        logger.info(f"Starting batch vocal extraction for {len(audio_files)} files")
        
        results = []
        semaphore = asyncio.Semaphore(max_workers)
        
        async def extract_single_vocal(file_path: str) -> Dict[str, Any]:
            async with semaphore:
                try:
                    start_time = datetime.now()
                    vocals_path = await audio_separation_service.extract_vocals(
                        file_path, model_name=model_name
                    )
                    processing_time = (datetime.now() - start_time).total_seconds()
                    
                    return {
                        "file_path": file_path,
                        "file_name": os.path.basename(file_path),
                        "vocals_path": vocals_path,
                        "processing_time": processing_time,
                        "success": True,
                        "error": None
                    }
                except Exception as e:
                    return {
                        "file_path": file_path,
                        "file_name": os.path.basename(file_path),
                        "vocals_path": None,
                        "processing_time": 0,
                        "success": False,
                        "error": str(e)
                    }
        
        # Process all files
        tasks = [extract_single_vocal(file_path) for file_path in audio_files]
        results = await asyncio.gather(*tasks)
        
        # Compile statistics
        successful = sum(1 for r in results if r["success"])
        failed = len(results) - successful
        total_time = sum(r["processing_time"] for r in results)
        
        return {
            "total_files": len(audio_files),
            "successful_extractions": successful,
            "failed_extractions": failed,
            "total_processing_time": total_time,
            "results": results
        }
    
    async def transcribe_batch(
        self,
        audio_files: List[str],
        config: Optional[BatchProcessingConfig] = None
    ) -> Dict[str, Any]:
        """
        Transcribe multiple audio files in batch using Whisper
        
        Args:
            audio_files: List of audio file paths
            config: Batch processing configuration
            
        Returns:
            Dictionary containing transcription results
        """
        if config is None:
            config = BatchProcessingConfig()
        
        logger.info(f"Starting batch transcription for {len(audio_files)} files")
        
        results = []
        semaphore = asyncio.Semaphore(config.max_workers)
        
        async def transcribe_single_file(file_path: str) -> Dict[str, Any]:
            async with semaphore:
                try:
                    start_time = datetime.now()
                    
                    # Prepare audio for transcription
                    preparation_config = {
                        "use_whisper": config.use_whisper,
                        "segment_audio": config.segment_audio,
                        "max_segment_duration": config.max_segment_duration,
                        "transcribe": True,
                        "clean_silence": config.clean_silence,
                        "separate_voices": config.separate_voices,
                        "identify_speakers": config.identify_speakers,
                        "min_speakers": config.min_speakers,
                        "max_speakers": config.max_speakers,
                        "min_speaker_duration": config.min_speaker_duration,
                        "provider_specific": {
                            "language": config.language,
                            "prompt": config.prompt
                        }
                    }
                    
                    result = await audio_preparation_service.prepare_audio(
                        audio_path=file_path,
                        provider="transcription",
                        config=preparation_config
                    )
                    
                    processing_time = (datetime.now() - start_time).total_seconds()
                    
                    return {
                        "file_path": file_path,
                        "file_name": os.path.basename(file_path),
                        "transcription": result.get("transcription", ""),
                        "language": result.get("metadata", {}).get("language", "unknown"),
                        "segments": result.get("segments", []),
                        "speaker_info": result.get("diarization", {}),
                        "metadata": result.get("metadata", {}),
                        "processing_time": processing_time,
                        "success": True,
                        "error": None
                    }
                except Exception as e:
                    return {
                        "file_path": file_path,
                        "file_name": os.path.basename(file_path),
                        "transcription": "",
                        "language": "unknown",
                        "segments": [],
                        "speaker_info": {},
                        "metadata": {},
                        "processing_time": 0,
                        "success": False,
                        "error": str(e)
                    }
        
        # Process all files
        tasks = [transcribe_single_file(file_path) for file_path in audio_files]
        results = await asyncio.gather(*tasks)
        
        # Compile statistics
        successful = sum(1 for r in results if r["success"])
        failed = len(results) - successful
        total_time = sum(r["processing_time"] for r in results)
        
        return {
            "total_files": len(audio_files),
            "successful_transcriptions": successful,
            "failed_transcriptions": failed,
            "total_processing_time": total_time,
            "results": results
        }
    
    async def export_transcriptions(
        self,
        formats: List[str] = None,
        export_directory: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Export transcription results in multiple formats
        
        Args:
            formats: List of export formats ('json', 'csv', 'txt', 'srt')
            export_directory: Directory to export files to
            
        Returns:
            Dictionary mapping format names to export file paths
        """
        if formats is None:
            formats = ["json", "csv"]
        
        if export_directory is None:
            export_directory = self.temp_dir
        
        os.makedirs(export_directory, exist_ok=True)
        
        export_paths = {}
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        batch_id = self.current_batch_id or "unknown"
        
        for format_name in formats:
            try:
                if format_name == "json":
                    export_paths["json"] = await self._export_json(
                        export_directory, timestamp, batch_id
                    )
                elif format_name == "csv":
                    export_paths["csv"] = await self._export_csv(
                        export_directory, timestamp, batch_id
                    )
                elif format_name == "txt":
                    export_paths["txt"] = await self._export_txt(
                        export_directory, timestamp, batch_id
                    )
                elif format_name == "srt":
                    export_paths["srt"] = await self._export_srt(
                        export_directory, timestamp, batch_id
                    )
                else:
                    logger.warning(f"Unsupported export format: {format_name}")
            except Exception as e:
                logger.error(f"Error exporting {format_name}: {str(e)}")
        
        return export_paths
    
    async def _process_single_audio_file(
        self,
        file_path: str,
        config: BatchProcessingConfig
    ) -> AudioProcessingResult:
        """Process a single audio file with full preparation and transcription"""
        try:
            start_time = datetime.now()
            
            # Get file info
            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            
            # Prepare audio configuration
            preparation_config = {
                "use_whisper": config.use_whisper,
                "segment_audio": config.segment_audio,
                "max_segment_duration": config.max_segment_duration,
                "transcribe": True,
                "clean_silence": config.clean_silence,
                "separate_voices": config.separate_voices,
                "identify_speakers": config.identify_speakers,
                "min_speakers": config.min_speakers,
                "max_speakers": config.max_speakers,
                "min_speaker_duration": config.min_speaker_duration,
                "provider_specific": {
                    "language": config.language,
                    "prompt": config.prompt
                }
            }
            
            # Process audio
            result = await audio_preparation_service.prepare_audio(
                audio_path=file_path,
                provider="transcription",
                config=preparation_config
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Calculate duration from segments or metadata
            duration = 0.0
            segments = result.get("segments", [])
            if segments:
                duration = segments[-1].get("end", 0.0) if segments else 0.0
            else:
                duration = result.get("metadata", {}).get("total_duration", 0.0)
            
            # Build speaker info
            speaker_info = {}
            if result.get("diarization"):
                speaker_info = {
                    "total_speakers": result["diarization"].get("speakers", 1),
                    "speaker_labels": result["diarization"].get("speaker_labels", []),
                    "speaker_segments": result["diarization"].get("segments", [])
                }
            
            return AudioProcessingResult(
                file_path=file_path,
                file_name=file_name,
                file_size=file_size,
                duration=duration,
                transcription=result.get("transcription", ""),
                language=result.get("metadata", {}).get("language", "unknown"),
                segments=segments,
                speaker_info=speaker_info,
                metadata=result.get("metadata", {}),
                vocals_path=result.get("vocals_path"),
                processing_time=processing_time,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")
            return AudioProcessingResult(
                file_path=file_path,
                file_name=os.path.basename(file_path),
                file_size=0,
                duration=0.0,
                transcription="",
                language="unknown",
                segments=[],
                speaker_info={},
                metadata={},
                error=str(e),
                success=False
            )
    
    async def _export_json(
        self,
        export_directory: str,
        timestamp: str,
        batch_id: str
    ) -> str:
        """Export results as JSON"""
        file_path = os.path.join(export_directory, f"transcriptions_{timestamp}_{batch_id}.json")
        
        export_data = {
            "batch_id": batch_id,
            "export_timestamp": timestamp,
            "statistics": self.processing_stats,
            "results": [asdict(result) for result in self.results]
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2, default=str)
        
        logger.info(f"Exported JSON results to: {file_path}")
        return file_path
    
    async def _export_csv(
        self,
        export_directory: str,
        timestamp: str,
        batch_id: str
    ) -> str:
        """Export results as CSV"""
        file_path = os.path.join(export_directory, f"transcriptions_{timestamp}_{batch_id}.csv")
        
        # Prepare data for CSV
        csv_data = []
        for result in self.results:
            csv_data.append({
                "file_name": result.file_name,
                "file_path": result.file_path,
                "file_size": result.file_size,
                "duration": result.duration,
                "transcription": result.transcription,
                "language": result.language,
                "total_segments": len(result.segments),
                "total_speakers": result.speaker_info.get("total_speakers", 1),
                "vocals_extracted": result.vocals_path is not None,
                "processing_time": result.processing_time,
                "success": result.success,
                "error": result.error or ""
            })
        
        # Write CSV
        if csv_data:
            df = pd.DataFrame(csv_data)
            df.to_csv(file_path, index=False, encoding='utf-8')
        
        logger.info(f"Exported CSV results to: {file_path}")
        return file_path
    
    async def _export_txt(
        self,
        export_directory: str,
        timestamp: str,
        batch_id: str
    ) -> str:
        """Export transcriptions as plain text"""
        file_path = os.path.join(export_directory, f"transcriptions_{timestamp}_{batch_id}.txt")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"Batch Transcription Results\n")
            f.write(f"Batch ID: {batch_id}\n")
            f.write(f"Export Time: {timestamp}\n")
            f.write(f"Total Files: {len(self.results)}\n")
            f.write("=" * 50 + "\n\n")
            
            for i, result in enumerate(self.results, 1):
                f.write(f"File {i}: {result.file_name}\n")
                f.write(f"Duration: {result.duration:.2f}s\n")
                f.write(f"Language: {result.language}\n")
                if result.success:
                    f.write(f"Transcription:\n{result.transcription}\n")
                else:
                    f.write(f"Error: {result.error}\n")
                f.write("-" * 30 + "\n\n")
        
        logger.info(f"Exported TXT results to: {file_path}")
        return file_path
    
    async def _export_srt(
        self,
        export_directory: str,
        timestamp: str,
        batch_id: str
    ) -> str:
        """Export transcriptions as SRT subtitle files"""
        for result in self.results:
            if not result.success or not result.segments:
                continue
            
            file_name = os.path.splitext(result.file_name)[0]
            srt_path = os.path.join(export_directory, f"{file_name}_{timestamp}.srt")
            
            with open(srt_path, 'w', encoding='utf-8') as f:
                for i, segment in enumerate(result.segments, 1):
                    start_time = self._format_srt_time(segment.get("start", 0))
                    end_time = self._format_srt_time(segment.get("end", 0))
                    text = segment.get("text", "").strip()
                    
                    f.write(f"{i}\n")
                    f.write(f"{start_time} --> {end_time}\n")
                    f.write(f"{text}\n\n")
        
        # Return directory path since multiple files are created
        return export_directory
    
    def _format_srt_time(self, seconds: float) -> str:
        """Format time in SRT format (HH:MM:SS,mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millisecs = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"
    
    def get_batch_statistics(self) -> Dict[str, Any]:
        """Get current batch processing statistics"""
        return self.processing_stats.copy()
    
    def get_results(self) -> List[AudioProcessingResult]:
        """Get current batch processing results"""
        return self.results.copy()
    
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
bulk_audio_processor = BulkAudioProcessor()