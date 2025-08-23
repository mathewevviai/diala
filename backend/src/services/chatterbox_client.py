"""
Chatterbox TTS client service for interacting with the containerized API
"""
import os
import asyncio
import aiohttp
import tempfile
from typing import Optional, Dict, Any, List
import logging
from io import BytesIO
import tempfile

logger = logging.getLogger(__name__)

class ChatterboxClient:
    """Client for interacting with the Chatterbox TTS API"""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize the Chatterbox client
        
        Args:
            base_url: Base URL for the Chatterbox API. 
                     Defaults to environment variable or localhost
        """
        self.base_url = base_url or os.getenv("CHATTERBOX_API_URL", "http://localhost:8001")
        self.session = None
        
        # Determine mode based on configuration
        self.mode = os.getenv("CHATTERBOX_MODE", "local")
        
        # Import local service if in local mode
        if self.mode == "local":
            try:
                from src.services.chatterbox_service import ChatterboxService
                self.local_service = ChatterboxService()
                logger.info("ChatterboxClient initialized in LOCAL mode")
            except ImportError as e:
                logger.warning(f"Failed to import ChatterboxService, falling back to remote mode: {e}")
                self.mode = "remote"
                self.local_service = None
        else:
            self.local_service = None
            logger.info(f"ChatterboxClient initialized in REMOTE mode: {self.base_url}")
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
            
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the Chatterbox service is healthy
        
        Returns:
            Dict with health status information
        """
        if self.mode == "local" and self.local_service:
            return await self.local_service.get_health_info()
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            async with self.session.get(f"{self.base_url}/health") as response:
                response.raise_for_status()
                return await response.json()
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {"status": "unhealthy", "error": str(e)}
            
    async def list_voices(self) -> List[Dict[str, str]]:
        """
        Get list of available voices
        
        Returns:
            List of voice information dictionaries
        """
        if self.mode == "local" and self.local_service:
            # Return default voices for local mode
            return [
                {
                    "id": "default",
                    "name": "Default Voice",
                    "description": "Default Chatterbox TTS voice"
                },
                {
                    "id": "custom",
                    "name": "Custom Voice",
                    "description": "Upload audio for voice cloning"
                }
            ]
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            async with self.session.get(f"{self.base_url}/voices") as response:
                response.raise_for_status()
                return await response.json()
        except Exception as e:
            logger.error(f"Failed to list voices: {str(e)}")
            raise
            
    async def generate_speech(
        self,
        text: str,
        voice_id: str = "default",
        chunk_size: int = 2048,
        exaggeration: float = 1.0,
        cfg_weight: float = 1.7
    ) -> bytes:
        """
        Generate speech from text
        
        Args:
            text: Text to convert to speech
            voice_id: ID of the voice to use
            chunk_size: Size of audio chunks for generation
            exaggeration: Voice exaggeration factor
            cfg_weight: Configuration weight for generation
            
        Returns:
            Audio data as bytes
        """
        if self.mode == "local" and self.local_service:
            # Use local service
            try:
                audio_path = await self.local_service.generate_speech(
                    text=text,
                    voice_id=voice_id,
                    chunk_size=chunk_size,
                    exaggeration=exaggeration,
                    cfg_weight=cfg_weight
                )
                
                # Read the generated file
                with open(audio_path, 'rb') as f:
                    audio_data = f.read()
                
                # Cleanup
                os.unlink(audio_path)
                
                return audio_data
            except Exception as e:
                logger.error(f"Failed to generate speech locally: {str(e)}")
                raise
        
        # Remote mode
        try:
            payload = {
                "text": text,
                "voice_id": voice_id,
                "chunk_size": chunk_size,
                "exaggeration": exaggeration,
                "cfg_weight": cfg_weight
            }
            
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            async with self.session.post(
                f"{self.base_url}/generate",
                json=payload
            ) as response:
                response.raise_for_status()
                return await response.read()
                
        except Exception as e:
            logger.error(f"Failed to generate speech: {str(e)}")
            raise
            
    async def generate_with_voice_cloning(
        self,
        text: str,
        voice_audio_path: Optional[str] = None,
        voice_audio_data: Optional[bytes] = None,
        voice_filename: str = "voice.mp3",
        chunk_size: int = 2048,
        exaggeration: float = 1.0,
        cfg_weight: float = 1.7
    ) -> bytes:
        """
        Generate speech with voice cloning from audio file or data
        
        Args:
            text: Text to convert to speech
            voice_audio_path: Path to audio file for voice cloning
            voice_audio_data: Audio data as bytes (alternative to path)
            voice_filename: Filename for the audio data
            chunk_size: Size of audio chunks for generation
            exaggeration: Voice exaggeration factor
            cfg_weight: Configuration weight for generation
            
        Returns:
            Audio data as bytes
        """
        try:
            # Validate input
            if voice_audio_path is None and voice_audio_data is None:
                raise ValueError("Either voice_audio_path or voice_audio_data must be provided")
            
            if self.mode == "local" and self.local_service:
                # Use local service
                try:
                    # If we have data but no path, write to temp file
                    if voice_audio_data and not voice_audio_path:
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
                            tmp_audio.write(voice_audio_data)
                            tmp_audio.flush()
                            temp_path = tmp_audio.name
                    else:
                        temp_path = voice_audio_path
                    
                    # Generate with voice cloning
                    audio_path = await self.local_service.generate_with_voice_cloning(
                        text=text,
                        audio_prompt_path=temp_path,
                        chunk_size=chunk_size,
                        exaggeration=exaggeration,
                        cfg_weight=cfg_weight
                    )
                    
                    # Read the generated file
                    with open(audio_path, 'rb') as f:
                        audio_data = f.read()
                    
                    # Cleanup
                    os.unlink(audio_path)
                    if voice_audio_data and not voice_audio_path:
                        os.unlink(temp_path)
                    
                    return audio_data
                except Exception as e:
                    logger.error(f"Failed to generate speech with voice cloning locally: {str(e)}")
                    raise
            
            # Remote mode
            # Create session if not exists
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Prepare multipart form data
            data = aiohttp.FormData()
            data.add_field('text', text)
            data.add_field('chunk_size', str(chunk_size))
            data.add_field('exaggeration', str(exaggeration))
            data.add_field('cfg_weight', str(cfg_weight))
            
            # Add audio file or data
            if voice_audio_path:
                with open(voice_audio_path, 'rb') as f:
                    audio_content = f.read()
                    data.add_field(
                        'voice_audio',
                        audio_content,
                        filename=os.path.basename(voice_audio_path),
                        content_type='audio/mpeg'
                    )
            else:
                # Use provided audio data
                data.add_field(
                    'voice_audio',
                    voice_audio_data,
                    filename=voice_filename,
                    content_type='audio/mpeg'
                )
            
            async with self.session.post(
                f"{self.base_url}/generate_with_voice",
                data=data,
                timeout=aiohttp.ClientTimeout(total=120)  # 2 minute timeout for voice cloning
            ) as response:
                response.raise_for_status()
                return await response.read()
                    
        except Exception as e:
            logger.error(f"Failed to generate speech with voice cloning: {str(e)}")
            raise
            
    async def generate_speech_stream(
        self,
        text: str,
        voice_id: str = "default",
        chunk_size: int = 2048,
        exaggeration: float = 1.0,
        cfg_weight: float = 1.7
    ):
        """
        Generate speech from text with streaming response
        
        Args:
            text: Text to convert to speech
            voice_id: ID of the voice to use
            chunk_size: Size of audio chunks for generation
            exaggeration: Voice exaggeration factor
            cfg_weight: Configuration weight for generation
            
        Yields:
            Audio data chunks as bytes
        """
        try:
            # Create session if not exists
            if not self.session:
                self.session = aiohttp.ClientSession()
                
            payload = {
                "text": text,
                "voice_id": voice_id,
                "chunk_size": chunk_size,
                "exaggeration": exaggeration,
                "cfg_weight": cfg_weight
            }
            
            async with self.session.post(
                f"{self.base_url}/generate_stream",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)  # 5 minute timeout for streaming
            ) as response:
                response.raise_for_status()
                
                # Stream the response chunks
                async for chunk in response.content.iter_chunked(8192):
                    if chunk:
                        yield chunk
                        
        except aiohttp.ClientResponseError as e:
            if e.status == 501:
                logger.warning("Streaming not implemented, falling back to non-streaming")
                # Fall back to non-streaming
                audio_data = await self.generate_speech(
                    text, voice_id, chunk_size, exaggeration, cfg_weight
                )
                yield audio_data
            else:
                logger.error(f"Failed to generate streaming speech: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Failed to generate streaming speech: {str(e)}")
            raise

    async def save_audio(self, audio_data: bytes, output_path: str) -> str:
        """
        Save audio data to file
        
        Args:
            audio_data: Audio data as bytes
            output_path: Path to save the audio file
            
        Returns:
            Path to saved file
        """
        try:
            with open(output_path, 'wb') as f:
                f.write(audio_data)
            return output_path
        except Exception as e:
            logger.error(f"Failed to save audio: {str(e)}")
            raise


# Synchronous wrapper for compatibility
class ChatterboxClientSync:
    """Synchronous wrapper for ChatterboxClient"""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url
        
    def generate_speech(self, text: str, **kwargs) -> bytes:
        """Synchronous speech generation"""
        async def _generate():
            async with ChatterboxClient(self.base_url) as client:
                return await client.generate_speech(text, **kwargs)
        
        return asyncio.run(_generate())
        
    def generate_with_voice_cloning(
        self, 
        text: str, 
        voice_audio_path: str, 
        **kwargs
    ) -> bytes:
        """Synchronous speech generation with voice cloning"""
        async def _generate():
            async with ChatterboxClient(self.base_url) as client:
                return await client.generate_with_voice_cloning(
                    text, voice_audio_path, **kwargs
                )
        
        return asyncio.run(_generate())
        
    def health_check(self) -> Dict[str, Any]:
        """Synchronous health check"""
        async def _check():
            async with ChatterboxClient(self.base_url) as client:
                return await client.health_check()
        
        return asyncio.run(_check())