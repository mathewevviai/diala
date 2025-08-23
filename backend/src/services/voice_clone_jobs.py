"""
Voice Clone Job Manager

Manages voice cloning jobs across development and production environments,
integrating with Convex for state management and job tracking.
"""

import os
import uuid
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
from convex import ConvexClient

logger = logging.getLogger(__name__)


class VoiceCloneJobManager:
    """Manages voice cloning jobs with Convex integration"""
    
    def __init__(self):
        """Initialize job manager with Convex client"""
        self.convex_url = os.getenv("CONVEX_URL", "http://127.0.0.1:3210")
        self.convex_client = ConvexClient(self.convex_url)
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        logger.info(f"Voice Clone Job Manager initialized - Convex URL: {self.convex_url}")
    
    async def create_job(
        self,
        audio_path: str,
        user_id: Optional[str] = None,
        voice_name: str = "My Voice",
        sample_text: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new voice cloning job
        
        Args:
            audio_path: Path to the audio file
            user_id: User ID (optional)
            voice_name: Name for the voice profile
            sample_text: Text to generate with cloned voice
            settings: Additional TTS settings
            
        Returns:
            Job ID
        """
        try:
            # Generate job ID
            job_id = str(uuid.uuid4())
            
            # Get file info
            file_size = os.path.getsize(audio_path) if os.path.exists(audio_path) else 0
            file_name = os.path.basename(audio_path)
            
            # Default sample text
            if not sample_text:
                sample_text = "Hello, this is my cloned voice. I can now speak with my own voice characteristics."
            
            # Create job data
            job_data = {
                "jobId": job_id,
                "userId": user_id or "anonymous",
                "voiceName": voice_name,
                "audioFileName": file_name,
                "audioFileSize": file_size,
                "sampleText": sample_text,
            }
            
            # In production, upload audio file to cloud storage
            if self.environment == "production":
                # TODO: Upload to S3/Spaces and get URL
                job_data["audioFileUrl"] = f"s3://voice-clones/{job_id}/{file_name}"
            else:
                # In development, use local path
                job_data["audioFileUrl"] = f"file://{audio_path}"
            
            # Create job in Convex
            self.convex_client.mutation("voiceCloneJobs:create", job_data)
            
            logger.info(f"Created voice clone job: {job_id}")
            return job_id
            
        except Exception as e:
            logger.error(f"Error creating voice clone job: {str(e)}")
            raise
    
    async def update_job_status(
        self,
        job_id: str,
        status: str,
        updates: Optional[Dict[str, Any]] = None
    ):
        """
        Update job status and metadata
        
        Args:
            job_id: Job ID to update
            status: New status (pending, processing, completed, failed)
            updates: Additional fields to update
        """
        try:
            mutation_data = {
                "jobId": job_id,
                "status": status,
            }
            
            if updates:
                mutation_data.update(updates)
            
            self.convex_client.mutation("voiceCloneJobs:updateStatus", mutation_data)
            
            logger.info(f"Updated job {job_id} status to: {status}")
            
        except Exception as e:
            logger.error(f"Error updating job status: {str(e)}")
            raise
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current job status
        
        Args:
            job_id: Job ID to check
            
        Returns:
            Job data or None if not found
        """
        try:
            job = self.convex_client.query("voiceCloneJobs:getJob", {"jobId": job_id})
            return job
        except Exception as e:
            logger.error(f"Error getting job status: {str(e)}")
            return None
    
    async def get_user_jobs(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get jobs for a specific user
        
        Args:
            user_id: User ID
            status: Filter by status (optional)
            limit: Maximum number of jobs to return
            
        Returns:
            List of job data
        """
        try:
            query_args = {
                "userId": user_id,
                "limit": limit
            }
            
            if status:
                query_args["status"] = status
            
            jobs = self.convex_client.query("voiceCloneJobs:getUserJobs", query_args)
            return jobs or []
            
        except Exception as e:
            logger.error(f"Error getting user jobs: {str(e)}")
            return []
    
    async def get_pending_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get pending jobs for processing
        
        Args:
            limit: Maximum number of jobs to return
            
        Returns:
            List of pending jobs
        """
        try:
            jobs = self.convex_client.query("voiceCloneJobs:getPendingJobs", {"limit": limit})
            return jobs or []
        except Exception as e:
            logger.error(f"Error getting pending jobs: {str(e)}")
            return []
    
    async def claim_job(self, job_id: str, worker_info: Dict[str, Any]) -> bool:
        """
        Claim a job for processing
        
        Args:
            job_id: Job ID to claim
            worker_info: Information about the worker claiming the job
            
        Returns:
            True if successfully claimed, False otherwise
        """
        try:
            self.convex_client.mutation("voiceCloneJobs:claimJob", {
                "jobId": job_id,
                "workerInfo": worker_info
            })
            return True
        except Exception as e:
            logger.error(f"Error claiming job {job_id}: {str(e)}")
            return False
    
    async def wait_for_completion(
        self,
        job_id: str,
        timeout: int = 120,
        poll_interval: int = 2
    ) -> Optional[Dict[str, Any]]:
        """
        Wait for a job to complete
        
        Args:
            job_id: Job ID to wait for
            timeout: Maximum time to wait in seconds
            poll_interval: Interval between status checks in seconds
            
        Returns:
            Final job data or None if timeout
        """
        start_time = datetime.utcnow()
        
        while (datetime.utcnow() - start_time).total_seconds() < timeout:
            job = await self.get_job_status(job_id)
            
            if not job:
                logger.warning(f"Job {job_id} not found")
                return None
            
            if job["status"] in ["completed", "failed"]:
                return job
            
            await asyncio.sleep(poll_interval)
        
        logger.warning(f"Timeout waiting for job {job_id}")
        return None
    
    async def get_job_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get job statistics
        
        Args:
            user_id: User ID for user-specific stats (optional)
            
        Returns:
            Statistics dictionary
        """
        try:
            query_args = {}
            if user_id:
                query_args["userId"] = user_id
            
            stats = self.convex_client.query("voiceCloneJobs:getStats", query_args)
            return stats or {
                "total": 0,
                "pending": 0,
                "processing": 0,
                "completed": 0,
                "failed": 0,
                "avgProcessingTime": 0
            }
        except Exception as e:
            logger.error(f"Error getting job stats: {str(e)}")
            return {
                "total": 0,
                "pending": 0,
                "processing": 0,
                "completed": 0,
                "failed": 0,
                "avgProcessingTime": 0
            }
    
    async def process_job_locally(self, job_id: str, audio_data: bytes):
        """
        Process a job locally (development mode)
        This is called by TTSManager for local processing
        
        Args:
            job_id: Job ID to process
            audio_data: Audio data to process
        """
        # This method is implemented in TTSManager
        # It's here as a placeholder for the interface
        pass
    
    async def queue_for_remote_processing(self, job_id: str):
        """
        Queue a job for remote processing (production mode)
        This triggers the GPU droplet if needed
        
        Args:
            job_id: Job ID to queue
        """
        # In production, this would:
        # 1. Check if GPU droplet is running
        # 2. Start droplet if needed
        # 3. The GPU worker will poll for pending jobs
        
        # For now, the job is already created as "pending"
        # The GPU worker will pick it up when polling
        logger.info(f"Job {job_id} queued for remote processing")