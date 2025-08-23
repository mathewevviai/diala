"""
Audio Processing Service

Handles audio extraction from video files, format conversion,
and validation for voice cloning operations.
"""

import os
import tempfile
import asyncio
import subprocess
import logging
from pathlib import Path
from typing import Optional, Tuple
import aiofiles

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Service for processing audio files for voice cloning."""
    
    # Supported input formats
    SUPPORTED_VIDEO_FORMATS = {'.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'}
    SUPPORTED_AUDIO_FORMATS = {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'}
    
    # Output settings
    OUTPUT_FORMAT = 'mp3'
    OUTPUT_BITRATE = '192k'
    OUTPUT_SAMPLE_RATE = 24000  # Chatterbox uses 24kHz
    
    # Validation limits
    MAX_DURATION_SECONDS = 300  # 5 minutes max
    MIN_DURATION_SECONDS = 2    # 2 seconds minimum
    MAX_FILE_SIZE_MB = 50      # 50MB max file size
    
    async def process_file_for_cloning(self, file_path: str) -> str:
        """
        Process an audio or video file for voice cloning.
        
        Args:
            file_path: Path to the input file
            
        Returns:
            Path to the processed MP3 file
            
        Raises:
            ValueError: If file is invalid or processing fails
        """
        try:
            # Validate file exists and size
            if not os.path.exists(file_path):
                raise ValueError(f"File not found: {file_path}")
            
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            if file_size_mb > self.MAX_FILE_SIZE_MB:
                raise ValueError(f"File too large: {file_size_mb:.1f}MB (max {self.MAX_FILE_SIZE_MB}MB)")
            
            # Get file extension
            file_ext = Path(file_path).suffix.lower()
            
            # Check if it's already MP3
            if file_ext == '.mp3':
                # Validate duration and return as-is if valid
                duration = await self._get_audio_duration(file_path)
                self._validate_duration(duration)
                logger.info(f"File is already MP3 with duration {duration}s, using as-is")
                return file_path
            
            # Determine if video or audio
            is_video = file_ext in self.SUPPORTED_VIDEO_FORMATS
            is_audio = file_ext in self.SUPPORTED_AUDIO_FORMATS
            
            if not is_video and not is_audio:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            # Create output file
            output_file = tempfile.NamedTemporaryFile(
                suffix=f'.{self.OUTPUT_FORMAT}',
                delete=False
            )
            output_path = output_file.name
            output_file.close()
            
            # Extract/convert audio
            if is_video:
                logger.info(f"Extracting audio from video file: {file_path}")
                await self._extract_audio_from_video(file_path, output_path)
            else:
                logger.info(f"Converting audio file to MP3: {file_path}")
                await self._convert_audio_format(file_path, output_path)
            
            # Validate output
            duration = await self._get_audio_duration(output_path)
            self._validate_duration(duration)
            
            logger.info(f"Successfully processed audio: {output_path} (duration: {duration}s)")
            return output_path
            
        except Exception as e:
            logger.error(f"Error processing file for cloning: {str(e)}")
            raise
    
    async def _extract_audio_from_video(self, input_path: str, output_path: str):
        """Extract audio from video file using ffmpeg."""
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-vn',  # No video
            '-acodec', 'libmp3lame',  # MP3 codec
            '-ab', self.OUTPUT_BITRATE,  # Bitrate
            '-ar', str(self.OUTPUT_SAMPLE_RATE),  # Sample rate
            '-ac', '1',  # Mono audio (better for voice cloning)
            '-y',  # Overwrite output
            output_path
        ]
        
        await self._run_ffmpeg_command(cmd)
    
    async def _convert_audio_format(self, input_path: str, output_path: str):
        """Convert audio file to MP3 format."""
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-acodec', 'libmp3lame',
            '-ab', self.OUTPUT_BITRATE,
            '-ar', str(self.OUTPUT_SAMPLE_RATE),
            '-ac', '1',  # Mono audio
            '-y',
            output_path
        ]
        
        await self._run_ffmpeg_command(cmd)
    
    async def _get_audio_duration(self, file_path: str) -> float:
        """Get duration of audio file in seconds."""
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise ValueError(f"ffprobe failed: {stderr.decode()}")
            
            duration = float(stdout.decode().strip())
            return duration
            
        except Exception as e:
            logger.error(f"Error getting audio duration: {str(e)}")
            raise ValueError(f"Could not determine audio duration: {str(e)}")
    
    async def _run_ffmpeg_command(self, cmd: list):
        """Run ffmpeg command asynchronously."""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode()
                logger.error(f"ffmpeg error: {error_msg}")
                raise ValueError(f"Audio processing failed: {error_msg}")
            
            logger.debug(f"ffmpeg output: {stdout.decode()}")
            
        except Exception as e:
            logger.error(f"Error running ffmpeg: {str(e)}")
            raise ValueError(f"Audio processing failed: {str(e)}")
    
    def _validate_duration(self, duration: float):
        """Validate audio duration is within acceptable limits."""
        if duration < self.MIN_DURATION_SECONDS:
            raise ValueError(
                f"Audio too short: {duration:.1f}s (minimum {self.MIN_DURATION_SECONDS}s)"
            )
        
        if duration > self.MAX_DURATION_SECONDS:
            raise ValueError(
                f"Audio too long: {duration:.1f}s (maximum {self.MAX_DURATION_SECONDS}s)"
            )
    
    async def cleanup_temp_file(self, file_path: str):
        """Clean up temporary file if it exists."""
        try:
            if file_path and os.path.exists(file_path):
                os.unlink(file_path)
                logger.debug(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp file {file_path}: {str(e)}")


# Global instance
audio_processor = AudioProcessor()