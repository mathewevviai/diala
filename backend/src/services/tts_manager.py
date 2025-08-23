"""
Unified TTS Manager

Provides a unified interface for all TTS operations across different
environments (development/production) and providers (Chatterbox, ElevenLabs, etc.)
"""

import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import asyncio

from src.services.chatterbox_client import ChatterboxClient
from src.services.voice_clone_jobs import VoiceCloneJobManager
from src.services.audio_preparation_service import audio_preparation_service

logger = logging.getLogger(__name__)


class TTSManager:
    """Unified interface for all TTS operations"""
    
    def __init__(self):
        """Initialize TTS Manager with environment-specific configuration"""
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.mode = os.getenv("CHATTERBOX_MODE", "local")
        
        # Initialize clients
        self.chatterbox_client = ChatterboxClient()
        self.job_manager = VoiceCloneJobManager()
        
        # Provider configuration
        self.providers = {
            "chatterbox": {
                "name": "Chatterbox",
                "client": self.chatterbox_client,
                "supports_streaming": True,
                "supports_cloning": True,
                "gpu_required": True,
            },
            # Future providers can be added here
            # "elevenlabs": {...},
            # "kokoro": {...},
        }
        
        logger.info(f"TTS Manager initialized - Environment: {self.environment}, Mode: {self.mode}")
    
    def get_provider(self, provider_name: str = "chatterbox"):
        """Get provider configuration"""
        if provider_name not in self.providers:
            raise ValueError(f"Unknown provider: {provider_name}")
        return self.providers[provider_name]
    
    async def process_voice_clone(
        self,
        job_data: Dict[str, Any],
        provider: str = "chatterbox"
    ) -> Dict[str, Any]:
        """
        Process voice cloning request based on environment
        
        Args:
            job_data: Job data including audio path, user ID, etc.
            provider: TTS provider to use
            
        Returns:
            Job result with voice ID and status
        """
        provider_config = self.get_provider(provider)
        
        if self.environment == "development":
            # Direct processing with local GPU
            logger.info(f"Processing voice clone locally (development mode)")
            return await self._process_locally(job_data, provider_config)
        else:
            # Queue for remote processing
            logger.info(f"Queueing voice clone for remote processing (production mode)")
            return await self._queue_remote_job(job_data, provider_config)
    
    async def _process_locally(
        self,
        job_data: Dict[str, Any],
        provider_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process voice cloning locally using CUDA"""
        try:
            # Create job in Convex
            job_id = await self.job_manager.create_job(
                audio_path=job_data["audio_path"],
                user_id=job_data.get("user_id"),
                voice_name=job_data.get("voice_name", "My Voice"),
                sample_text=job_data.get("sample_text"),
                settings=job_data.get("settings", {})
            )
            
            # Update job status to processing
            await self.job_manager.update_job_status(job_id, "processing", {
                "startedAt": datetime.utcnow().timestamp() * 1000,
                "workerInfo": {
                    "environment": "development",
                    "gpuType": "cuda"
                }
            })
            
            # Process with local Chatterbox
            start_time = datetime.utcnow()
            
            # Check if audio preparation is requested
            preparation_config = job_data.get("preparation_config")
            audio_path = job_data["audio_path"]
            
            if preparation_config and preparation_config.get("use_whisper", False):
                logger.info(f"Preparing audio with Whisper for job {job_id}")
                
                # Prepare audio using the preparation service
                provider_name = provider_config["name"].lower()
                prepared_data = await audio_preparation_service.prepare_audio(
                    audio_path=audio_path,
                    provider=provider_name,
                    config=preparation_config
                )
                
                # Update job data with preparation results
                audio_path = prepared_data["prepared_audio_path"]
                
                # Store transcription and metadata in job update
                await self.job_manager.update_job_status(job_id, "processing", {
                    "transcription": prepared_data.get("transcription"),
                    "audioSegments": len(prepared_data.get("segments", [])),
                    "preparationMetadata": prepared_data.get("metadata", {})
                })
                
                logger.info(f"Audio prepared: {len(prepared_data.get('segments', []))} segments, "
                           f"transcription length: {len(prepared_data.get('transcription', ''))}")
            
            # Read audio file (prepared or original)
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            
            # Generate cloned voice sample
            client = provider_config["client"]
            
            # Extract and transform settings from camelCase to snake_case
            settings = job_data.get("settings", {})
            chatterbox_params = {
                "exaggeration": settings.get("exaggeration", 1.0),
                "cfg_weight": settings.get("cfgWeight", 1.7),
                "chunk_size": settings.get("chunkSize", 2048)
            }
            
            cloned_audio = await client.generate_with_voice_cloning(
                text=job_data.get("sample_text", "Hello, this is my cloned voice."),
                voice_audio_data=audio_data,
                voice_filename=f"voice_{job_id}.mp3",
                **chatterbox_params
            )
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Generate voice ID
            import uuid
            voice_id = f"voice_{uuid.uuid4().hex[:12]}"
            
            # Save result (in production, this would upload to S3)
            result_path = f"/tmp/cloned_{voice_id}.mp3"
            with open(result_path, 'wb') as f:
                f.write(cloned_audio)
            
            # Update job completion
            await self.job_manager.update_job_status(job_id, "completed", {
                "completedAt": datetime.utcnow().timestamp() * 1000,
                "processingTime": processing_time,
                "voiceId": voice_id,
                "resultUrl": result_path
            })
            
            # Return result
            return {
                "jobId": job_id,
                "status": "completed",
                "voiceId": voice_id,
                "resultUrl": result_path,
                "processingTime": processing_time,
                "message": "Voice cloning completed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing voice clone locally: {str(e)}")
            
            # Update job failure
            if 'job_id' in locals():
                await self.job_manager.update_job_status(job_id, "failed", {
                    "completedAt": datetime.utcnow().timestamp() * 1000,
                    "error": str(e),
                    "errorDetails": {
                        "code": "LOCAL_PROCESSING_ERROR",
                        "message": str(e)
                    }
                })
            
            raise
    
    async def _queue_remote_job(
        self,
        job_data: Dict[str, Any],
        provider_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Queue job for remote GPU processing"""
        try:
            # Create job in Convex
            job_id = await self.job_manager.create_job(
                audio_path=job_data["audio_path"],
                user_id=job_data.get("user_id"),
                voice_name=job_data.get("voice_name", "My Voice"),
                sample_text=job_data.get("sample_text"),
                settings=job_data.get("settings", {})
            )
            
            # In production, this would:
            # 1. Upload audio file to S3/Spaces
            # 2. Trigger GPU droplet if not running
            # 3. Return immediately with job ID
            
            # For now, just return queued status
            return {
                "jobId": job_id,
                "status": "queued",
                "message": "Voice cloning job queued for processing"
            }
            
        except Exception as e:
            logger.error(f"Error queueing remote job: {str(e)}")
            raise
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        provider: str = "chatterbox",
        stream: bool = False,
        **kwargs
    ):
        """
        Generate speech from text
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use
            provider: TTS provider
            stream: Whether to stream the response
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Audio data or stream
        """
        provider_config = self.get_provider(provider)
        client = provider_config["client"]
        
        if stream and provider_config["supports_streaming"]:
            # Stream response
            async for chunk in client.generate_speech_stream(text, voice_id, **kwargs):
                yield chunk
        else:
            # Return complete audio
            audio_data = await client.generate_speech(text, voice_id, **kwargs)
            yield audio_data
    
    async def list_voices(self, provider: str = "chatterbox") -> list:
        """List available voices for a provider"""
        provider_config = self.get_provider(provider)
        client = provider_config["client"]
        
        if hasattr(client, 'list_voices'):
            return await client.list_voices()
        else:
            return []
    
    async def health_check(self, provider: str = "chatterbox") -> Dict[str, Any]:
        """Check health of TTS provider"""
        provider_config = self.get_provider(provider)
        client = provider_config["client"]
        
        if hasattr(client, 'health_check'):
            return await client.health_check()
        else:
            return {"status": "unknown", "provider": provider}