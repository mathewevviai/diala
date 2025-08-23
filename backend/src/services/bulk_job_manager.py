"""
Bulk Job Manager

Manages complex bulk operations with multiple stages, progress tracking,
and export functionality. Extends the existing Convex job system to handle
bulk processing workflows with detailed stage progression and cleanup.
"""

import os
import uuid
import logging
import tempfile
import shutil
import asyncio
from typing import Dict, Any, Optional, List, Callable, Union
from datetime import datetime, timedelta
from pathlib import Path
from enum import Enum
from dataclasses import dataclass, asdict
from convex import ConvexClient
import json
import zipfile
import csv
import time

logger = logging.getLogger(__name__)


class BulkJobStatus(Enum):
    """Bulk job status enumeration"""
    PENDING = "pending"
    INITIALIZING = "initializing"
    PROCESSING = "processing"
    EXPORTING = "exporting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BulkJobStage(Enum):
    """Bulk job processing stages"""
    INITIALIZATION = "initialization"
    VALIDATION = "validation"
    CONTENT_FETCH = "content_fetch"
    CONTENT_PROCESSING = "content_processing"
    AUDIO_EXTRACTION = "audio_extraction"
    TRANSCRIPTION = "transcription"
    VOICE_PREPARATION = "voice_preparation"
    EXPORT_PREPARATION = "export_preparation"
    EXPORT_GENERATION = "export_generation"
    CLEANUP = "cleanup"


@dataclass
class BulkJobStageInfo:
    """Information about a specific job stage"""
    stage: BulkJobStage
    status: str  # pending, processing, completed, failed, skipped
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    progress: float = 0.0  # 0.0 to 1.0
    items_total: int = 0
    items_completed: int = 0
    items_failed: int = 0
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class BulkJobExportInfo:
    """Information about job export"""
    export_id: str
    format: str  # zip, csv, json
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    download_url: Optional[str] = None
    expires_at: Optional[float] = None
    created_at: Optional[float] = None


class BulkJobManager:
    """
    Manages bulk operations with complex workflows and export capabilities.
    
    Features:
    - Multi-stage processing with detailed progress tracking
    - Export job management with multiple formats
    - Rate limiting integration
    - Resource cleanup and management
    - Convex webhook integration
    """
    
    def __init__(self):
        """Initialize bulk job manager"""
        self.convex_url = os.getenv("CONVEX_URL") or os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
        self.convex_client = ConvexClient(self.convex_url)
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        # Export configuration
        self.export_base_path = os.getenv("BULK_EXPORT_PATH", "/tmp/bulk_exports")
        self.export_retention_hours = int(os.getenv("BULK_EXPORT_RETENTION_HOURS", "24"))
        self.max_export_size_mb = int(os.getenv("BULK_MAX_EXPORT_SIZE_MB", "500"))
        
        # Rate limiting configuration
        self.rate_limit_window_minutes = int(os.getenv("BULK_RATE_LIMIT_WINDOW", "60"))
        self.rate_limit_max_jobs = int(os.getenv("BULK_RATE_LIMIT_MAX_JOBS", "5"))
        
        # Ensure export directory exists
        Path(self.export_base_path).mkdir(parents=True, exist_ok=True)
        
        # In-memory export storage for quick access
        self.exports: Dict[str, Dict[str, Any]] = {}
        
        # Local job storage as fallback when Convex is unavailable
        self.local_jobs: Dict[str, Dict[str, Any]] = {}
        
        logger.info(f"Bulk Job Manager initialized - Convex URL: {self.convex_url}")
        logger.info(f"Export path: {self.export_base_path}, retention: {self.export_retention_hours}h")
    
    async def create_bulk_job(
        self,
        job_type: str,
        user_id: str,
        job_data: Dict[str, Any],
        stages: List[BulkJobStage],
        estimated_duration_minutes: Optional[int] = None,
        priority: str = "normal",
        job_id: Optional[str] = None
    ) -> str:
        """
        Create a new bulk job with stage tracking
        
        Args:
            job_type: Type of bulk job (e.g., "bulk_tiktok_download", "bulk_transcription")
            user_id: User ID for rate limiting and ownership
            job_data: Job-specific data and configuration
            stages: List of processing stages for this job
            estimated_duration_minutes: Estimated processing time
            priority: Job priority (low, normal, high)
            
        Returns:
            Job ID
        """
        try:
            # Check rate limits
            await self._check_rate_limits(user_id)
            
            # Use provided job_id or generate new one
            if job_id is None:
                job_id = str(uuid.uuid4())
                logger.info(f"Generated new job ID: {job_id}")
            else:
                logger.info(f"Using provided job ID: {job_id}")
                # Validate job_id format
                if not job_id or not isinstance(job_id, str):
                    raise ValueError(f"Invalid job_id format: {job_id}")
            
            logger.info(f"Creating bulk job with ID: {job_id}")
            
            # Initialize stage information
            stage_info = {}
            for stage in stages:
                stage_data = BulkJobStageInfo(
                    stage=stage,
                    status="pending"
                )
                # Convert to dict and replace enum with string value
                stage_dict = asdict(stage_data)
                stage_dict["stage"] = stage.value  # Convert enum to string
                stage_info[stage.value] = stage_dict
            
            # Create job data
            bulk_job_data = {
                "jobId": job_id,
                "jobType": job_type,
                "userId": user_id,
                "status": BulkJobStatus.PENDING.value,
                "priority": priority,
                "createdAt": datetime.utcnow().timestamp() * 1000,
                "estimatedDurationMinutes": estimated_duration_minutes,
                "stages": stage_info,
                "currentStage": stages[0].value if stages else None,
                "progress": {
                    "overall": 0.0,
                    "currentStage": 0.0,
                    "itemsTotal": job_data.get("total_items", 0),
                    "itemsCompleted": 0,
                    "itemsFailed": 0
                },
                "jobData": job_data,
                "exports": {},
                "metadata": {
                    "environment": self.environment,
                    "totalStages": len(stages),
                    "stageNames": [stage.value for stage in stages]
                }
            }
            
            # Store job locally first
            self.local_jobs[job_id] = bulk_job_data.copy()
            
            # Try to create job in Convex
            result = await self._send_webhook("bulkJobs:create", bulk_job_data)
            
            if result is not None:
                logger.info(f"Successfully created bulk job in Convex: {job_id} ({job_type}) for user: {user_id}")
            else:
                logger.warning(f"Job {job_id} created locally but Convex integration failed - continuing with local storage")
            
            return job_id
            
        except Exception as e:
            logger.error(f"Error creating bulk job: {str(e)}")
            raise
    
    async def update_job_status(
        self,
        job_id: str,
        status: BulkJobStatus,
        updates: Optional[Dict[str, Any]] = None
    ):
        """
        Update bulk job status
        
        Args:
            job_id: Job ID to update
            status: New job status
            updates: Additional fields to update
        """
        try:
            logger.info(f"Updating job status for job ID: {job_id} to status: {status.value}")
            
            # Update local storage first
            if job_id in self.local_jobs:
                self.local_jobs[job_id]["status"] = status.value
                if updates:
                    self.local_jobs[job_id].update(updates)
            
            mutation_data = {
                "jobId": job_id,
                "status": status.value
            }
            
            # Add supported fields from updates to proper parameter names
            if updates:
                # Map common update fields to proper parameter names
                if "currentStage" in updates:
                    mutation_data["currentStage"] = updates["currentStage"]
                if "current_stage" in updates:
                    mutation_data["currentStage"] = updates["current_stage"]
                if "progress_percentage" in updates:
                    mutation_data["progress_percentage"] = updates["progress_percentage"]
                if "error" in updates:
                    mutation_data["error_message"] = updates["error"]
                if "error_message" in updates:
                    mutation_data["error_message"] = updates["error_message"]
                if "failedStage" in updates:
                    mutation_data["failedStage"] = updates["failedStage"]
                if "cancelledAt" in updates:
                    mutation_data["cancelledAt"] = updates["cancelledAt"]
                if "cancellationReason" in updates:
                    mutation_data["cancellationReason"] = updates["cancellationReason"]
                if "metadata" in updates:
                    mutation_data["metadata"] = updates["metadata"]
                
                # Add any remaining updates as a nested object
                remaining_updates = {k: v for k, v in updates.items() 
                                   if k not in ["currentStage", "current_stage", "progress_percentage", "error", "error_message", 
                                              "failedStage", "cancelledAt", "cancellationReason", "metadata"]}
                if remaining_updates:
                    mutation_data["updates"] = remaining_updates
            
            result = await self._send_webhook("bulkJobs:updateStatus", mutation_data)
            
            if result is not None:
                logger.info(f"Successfully updated bulk job {job_id} status to: {status.value} in Convex")
            else:
                logger.warning(f"Failed to update job {job_id} status in Convex, but continuing processing")
            
        except Exception as e:
            logger.error(f"Error updating bulk job status: {str(e)}")
            # Don't raise - allow processing to continue even if Convex updates fail
            logger.warning(f"Continuing processing despite Convex update failure for job {job_id}")
    
    async def update_stage_progress(
        self,
        job_id: str,
        stage: BulkJobStage,
        progress: float,
        items_completed: Optional[int] = None,
        items_failed: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Update progress for a specific stage
        
        Args:
            job_id: Job ID
            stage: Current stage
            progress: Stage progress (0.0 to 1.0)
            items_completed: Number of items completed
            items_failed: Number of items failed
            metadata: Additional stage metadata
        """
        try:
            stage_update = {
                "jobId": job_id,
                "stage": stage.value,
                "progress": min(max(progress, 0.0), 1.0),  # Clamp to 0.0-1.0
                "updatedAt": datetime.utcnow().timestamp() * 1000
            }
            
            if items_completed is not None:
                stage_update["itemsCompleted"] = items_completed
            
            if items_failed is not None:
                stage_update["itemsFailed"] = items_failed
            
            if metadata:
                stage_update["metadata"] = metadata
            
            await self._send_webhook("bulkJobs:updateStageProgress", stage_update)
            
            logger.debug(f"Updated stage {stage.value} progress for job {job_id}: {progress:.2%}")
            
        except Exception as e:
            logger.error(f"Error updating stage progress: {str(e)}")
            raise
    
    async def start_stage(
        self,
        job_id: str,
        stage: BulkJobStage,
        items_total: Optional[int] = None
    ):
        """
        Mark a stage as started
        
        Args:
            job_id: Job ID
            stage: Stage to start
            items_total: Total items to process in this stage
        """
        try:
            stage_update = {
                "jobId": job_id,
                "stage": stage.value,
                "status": "processing",
                "startTime": datetime.utcnow().timestamp() * 1000,
                "progress": 0.0
            }
            
            if items_total is not None:
                stage_update["itemsTotal"] = items_total
            
            await self._send_webhook("bulkJobs:startStage", stage_update)
            
            # Update job current stage
            await self.update_job_status(job_id, BulkJobStatus.PROCESSING, {
                "currentStage": stage.value
            })
            
            logger.info(f"Started stage {stage.value} for job {job_id}")
            
        except Exception as e:
            logger.error(f"Error starting stage: {str(e)}")
            raise
    
    async def complete_stage(
        self,
        job_id: str,
        stage: BulkJobStage,
        items_completed: Optional[int] = None,
        items_failed: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Mark a stage as completed
        
        Args:
            job_id: Job ID
            stage: Stage to complete
            items_completed: Number of items completed
            items_failed: Number of items failed
            metadata: Stage completion metadata
        """
        try:
            stage_update = {
                "jobId": job_id,
                "stage": stage.value,
                "status": "completed",
                "endTime": datetime.utcnow().timestamp() * 1000,
                "progress": 1.0
            }
            
            if items_completed is not None:
                stage_update["itemsCompleted"] = items_completed
            
            if items_failed is not None:
                stage_update["itemsFailed"] = items_failed
            
            if metadata:
                stage_update["metadata"] = metadata
            
            await self._send_webhook("bulkJobs:completeStage", stage_update)
            
            logger.info(f"Completed stage {stage.value} for job {job_id}")
            
        except Exception as e:
            logger.error(f"Error completing stage: {str(e)}")
            raise
    
    async def fail_stage(
        self,
        job_id: str,
        stage: BulkJobStage,
        error_message: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Mark a stage as failed
        
        Args:
            job_id: Job ID
            stage: Stage that failed
            error_message: Error description
            metadata: Additional error metadata
        """
        try:
            stage_update = {
                "jobId": job_id,
                "stage": stage.value,
                "status": "failed",
                "endTime": datetime.utcnow().timestamp() * 1000,
                "errorMessage": error_message
            }
            
            if metadata:
                stage_update["metadata"] = metadata
            
            await self._send_webhook("bulkJobs:failStage", stage_update)
            
            # Mark entire job as failed
            await self.update_job_status(job_id, BulkJobStatus.FAILED, {
                "error": error_message,
                "failedStage": stage.value
            })
            
            logger.error(f"Failed stage {stage.value} for job {job_id}: {error_message}")
            
        except Exception as e:
            logger.error(f"Error failing stage: {str(e)}")
            raise
    
    async def create_export(
        self,
        job_id: str,
        export_format: str,
        data: Any,
        filename_prefix: str = "export",
        expires_in_hours: Optional[int] = None
    ) -> str:
        """
        Create an export file for a completed job
        
        Args:
            job_id: Job ID
            export_format: Export format (zip, csv, json)
            data: Data to export
            filename_prefix: Prefix for the export filename
            expires_in_hours: Custom expiration time
            
        Returns:
            Export ID
        """
        try:
            export_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{filename_prefix}_{timestamp}.{export_format}"
            
            # Create export directory for this job
            export_dir = Path(self.export_base_path) / job_id
            export_dir.mkdir(parents=True, exist_ok=True)
            
            export_path = export_dir / filename
            
            # Generate export file based on format
            if export_format == "json":
                await self._create_json_export(export_path, data)
            elif export_format == "csv":
                await self._create_csv_export(export_path, data)
            elif export_format == "zip":
                await self._create_zip_export(export_path, data)
            else:
                raise ValueError(f"Unsupported export format: {export_format}")
            
            # Check file size
            file_size = export_path.stat().st_size
            if file_size > self.max_export_size_mb * 1024 * 1024:
                export_path.unlink()
                raise ValueError(f"Export file too large: {file_size / 1024 / 1024:.2f}MB")
            
            # Calculate expiration
            expires_in = expires_in_hours or self.export_retention_hours
            expires_at = (datetime.utcnow() + timedelta(hours=expires_in)).timestamp() * 1000
            
            # Create export info
            export_info = BulkJobExportInfo(
                export_id=export_id,
                format=export_format,
                file_path=str(export_path),
                file_size=file_size,
                download_url=f"/api/bulk/exports/{export_id}/download",
                expires_at=expires_at,
                created_at=datetime.utcnow().timestamp() * 1000
            )
            
            # Update job with export info
            await self._send_webhook("bulkJobs:addExport", {
                "jobId": job_id,
                "exportId": export_id,
                "exportInfo": asdict(export_info)
            })
            
            logger.info(f"Created export {export_id} for job {job_id}: {filename} ({file_size} bytes)")
            return export_id
            
        except Exception as e:
            logger.error(f"Error creating export: {str(e)}")
            raise
    
    async def get_export_info(self, export_id: str) -> Optional[BulkJobExportInfo]:
        """
        Get export information by ID
        
        Args:
            export_id: Export ID
            
        Returns:
            Export information or None if not found
        """
        try:
            export_data = await self._query("bulkJobs:getExport", {"exportId": export_id})
            if export_data:
                return BulkJobExportInfo(**export_data)
            return None
        except Exception as e:
            logger.error(f"Error getting export info: {str(e)}")
            return None
    
    async def get_export_file_path(self, export_id: str) -> Optional[str]:
        """
        Get the file path for an export
        
        Args:
            export_id: Export ID
            
        Returns:
            File path or None if not found/expired
        """
        try:
            export_info = await self.get_export_info(export_id)
            if not export_info:
                return None
            
            # Check if export has expired
            if export_info.expires_at and export_info.expires_at < datetime.utcnow().timestamp() * 1000:
                await self.cleanup_export(export_id)
                return None
            
            # Check if file still exists
            if export_info.file_path and Path(export_info.file_path).exists():
                return export_info.file_path
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting export file path: {str(e)}")
            return None
    
    async def cleanup_export(self, export_id: str):
        """
        Clean up an export file and remove from database
        
        Args:
            export_id: Export ID to clean up
        """
        try:
            export_info = await self.get_export_info(export_id)
            if export_info and export_info.file_path:
                file_path = Path(export_info.file_path)
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"Cleaned up export file: {export_info.file_path}")
                
                # Remove parent directory if empty
                try:
                    file_path.parent.rmdir()
                except OSError:
                    pass  # Directory not empty
            
            # Remove from database
            await self._send_webhook("bulkJobs:removeExport", {"exportId": export_id})
            
        except Exception as e:
            logger.error(f"Error cleaning up export: {str(e)}")
    
    async def cleanup_expired_exports(self):
        """Clean up all expired exports"""
        try:
            current_time = datetime.utcnow().timestamp() * 1000
            expired_exports = await self._query("bulkJobs:getExpiredExports", {
                "currentTime": current_time
            })
            
            for export_data in expired_exports or []:
                await self.cleanup_export(export_data["exportId"])
            
            logger.info(f"Cleaned up {len(expired_exports or [])} expired exports")
            
        except Exception as e:
            logger.error(f"Error cleaning up expired exports: {str(e)}")
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current job status and progress
        
        Args:
            job_id: Job ID to check
            
        Returns:
            Job data or None if not found
        """
        try:
            # Try Convex first
            job = await self._query("bulkJobs:getJob", {"jobId": job_id})
            if job:
                return job
        except Exception as e:
            logger.warning(f"Error getting job status from Convex: {str(e)}")
        
        # Fallback to local storage
        if job_id in self.local_jobs:
            logger.info(f"Retrieved job {job_id} from local storage")
            return self.local_jobs[job_id]
        
        logger.warning(f"Job {job_id} not found in Convex or local storage")
        return None
    
    async def get_user_jobs(
        self,
        user_id: str,
        status: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get jobs for a specific user
        
        Args:
            user_id: User ID
            status: Filter by status
            job_type: Filter by job type
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
            
            if job_type:
                query_args["jobType"] = job_type
            
            jobs = await self._query("bulkJobs:getUserJobs", query_args)
            return jobs or []
            
        except Exception as e:
            logger.error(f"Error getting user jobs: {str(e)}")
            return []
    
    async def cancel_job(self, job_id: str, reason: str = "User cancelled"):
        """
        Cancel a running job
        
        Args:
            job_id: Job ID to cancel
            reason: Cancellation reason
        """
        try:
            await self.update_job_status(job_id, BulkJobStatus.CANCELLED, {
                "cancelledAt": datetime.utcnow().timestamp() * 1000,
                "cancellationReason": reason
            })
            
            logger.info(f"Cancelled job {job_id}: {reason}")
            
        except Exception as e:
            logger.error(f"Error cancelling job: {str(e)}")
            raise
    
    async def process_job_with_stages(
        self,
        job_id: str,
        stage_processors: Dict[BulkJobStage, Callable]
    ):
        """
        Process a job through multiple stages
        
        Args:
            job_id: Job ID to process
            stage_processors: Dictionary mapping stages to processor functions
        """
        try:
            job = await self.get_job_status(job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")
            
            stages = [BulkJobStage(stage) for stage in job.get("metadata", {}).get("stageNames", [])]
            
            for stage in stages:
                if stage not in stage_processors:
                    logger.warning(f"No processor for stage {stage.value}, skipping")
                    continue
                
                try:
                    await self.start_stage(job_id, stage)
                    
                    # Execute stage processor
                    await stage_processors[stage](job_id, job.get("jobData", {}))
                    
                    await self.complete_stage(job_id, stage)
                    
                except Exception as stage_error:
                    await self.fail_stage(job_id, stage, str(stage_error))
                    raise
            
            # Mark job as completed
            await self.update_job_status(job_id, BulkJobStatus.COMPLETED, {
                "completedAt": datetime.utcnow().timestamp() * 1000
            })
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")
            raise
    
    async def _check_rate_limits(self, user_id: str):
        """Check if user has exceeded rate limits"""
        try:
            window_start = datetime.utcnow() - timedelta(minutes=self.rate_limit_window_minutes)
            window_start_ms = window_start.timestamp() * 1000
            
            recent_jobs = await self._query("bulkJobs:getUserRecentJobs", {
                "userId": user_id,
                "afterTime": window_start_ms
            })
            
            # If Convex function doesn't exist, skip rate limiting for now
            if recent_jobs is not None and len(recent_jobs) >= self.rate_limit_max_jobs:
                raise ValueError(f"Rate limit exceeded: {self.rate_limit_max_jobs} jobs per {self.rate_limit_window_minutes} minutes")
            
        except Exception as e:
            if "Rate limit exceeded" in str(e):
                raise
            logger.error(f"Error checking rate limits: {str(e)}")
    
    async def _create_json_export(self, export_path: Path, data: Any):
        """Create JSON export file"""
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    async def _create_csv_export(self, export_path: Path, data: Any):
        """Create CSV export file"""
        if not isinstance(data, list) or not data:
            raise ValueError("CSV export requires list of dictionaries")
        
        with open(export_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
    
    async def _create_zip_export(self, export_path: Path, data: Any):
        """Create ZIP export file"""
        with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            if isinstance(data, dict):
                for filename, content in data.items():
                    if isinstance(content, (str, bytes)):
                        zf.writestr(filename, content)
                    else:
                        zf.writestr(filename, json.dumps(content, indent=2))
            else:
                zf.writestr("data.json", json.dumps(data, indent=2))
    
    async def _send_webhook(self, function_name: str, data: Dict[str, Any]):
        """Send webhook to Convex with fallback handling (supports both actions and mutations)"""
        try:
            # Use actions for complex operations that involve external APIs or long processing
            if function_name in ["bulkJobs:create", "bulkJobs:updateStatus"]:
                result = self.convex_client.action(function_name, data)
                logger.info(f"Convex action {function_name} completed successfully: {result}")
                return result
            else:
                # Use mutations for simple database operations
                result = self.convex_client.mutation(function_name, data)
                logger.info(f"Convex mutation {function_name} completed successfully: {result}")
                return result
        except Exception as e:
            if "Could not find public function" in str(e):
                logger.warning(f"Convex function {function_name} not found. Continuing without Convex integration.")
                # Don't raise error for missing functions - continue without Convex
                return None
            else:
                logger.error(f"Error sending webhook {function_name}: {str(e)}")
                # Log the data that failed to help debug
                logger.error(f"Failed data: {data}")
                raise
    
    async def _query(self, query_name: str, args: Dict[str, Any]) -> Any:
        """Query Convex with fallback handling"""
        try:
            return self.convex_client.query(query_name, args)
        except Exception as e:
            if "Could not find public function" in str(e):
                logger.warning(f"Convex function {query_name} not found. Returning None.")
                # Return None for missing functions instead of raising error
                return None
            else:
                logger.error(f"Error querying {query_name}: {str(e)}")
                raise

    # Additional methods for API compatibility
    def create_job(self, job_id: str, job_type: str, user_id: str, total_items: int, config: Dict[str, Any]):
        """Create a new bulk processing job (sync version)."""
        # Define default stages for bulk processing
        default_stages = [
            BulkJobStage.INITIALIZATION,
            BulkJobStage.CONTENT_FETCH,
            BulkJobStage.AUDIO_EXTRACTION,
            BulkJobStage.TRANSCRIPTION,
            BulkJobStage.EXPORT_PREPARATION
        ]
        
        # Create job data that includes the job_id
        job_data_dict = {
            "job_id": job_id,
            "total_items": total_items,
            "config": config
        }
        
        # Use asyncio.run for blocking execution in sync context
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If already in async context, create task
                task = asyncio.create_task(self.create_bulk_job(
                    job_type=job_type,
                    user_id=user_id,
                    job_data=job_data_dict,
                    stages=default_stages,
                    estimated_duration_minutes=total_items * 2,  # Estimate 2 minutes per item
                    job_id=job_id  # Pass the job_id to preserve it
                ))
                return job_id  # Return the job_id immediately
            else:
                # If not in async context, run synchronously
                return asyncio.run(self.create_bulk_job(
                    job_type=job_type,
                    user_id=user_id,
                    job_data=job_data_dict,
                    stages=default_stages,
                    estimated_duration_minutes=total_items * 2,
                    job_id=job_id  # Pass the job_id to preserve it
                ))
        except Exception as e:
            logger.error(f"Error creating job {job_id}: {e}")
            raise
    
    def update_job_progress(self, job_id: str, progress: float, stage: str, metadata: Dict[str, Any]):
        """Update job progress (sync version)."""
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Convert stage string to enum value for consistency  
                stage_enum = BulkJobStage(stage) if stage in [s.value for s in BulkJobStage] else BulkJobStage.CONTENT_PROCESSING
                asyncio.create_task(self.update_job_status(
                    job_id=job_id,
                    status=BulkJobStatus.PROCESSING,
                    updates={
                        "progress_percentage": progress,
                        "currentStage": stage_enum.value,  # Convert enum to string
                        "metadata": self._filter_metadata_for_schema(metadata)
                    }
                ))
            else:
                # Convert stage string to enum value for consistency  
                stage_enum = BulkJobStage(stage) if stage in [s.value for s in BulkJobStage] else BulkJobStage.CONTENT_PROCESSING
                asyncio.run(self.update_job_status(
                    job_id=job_id,
                    status=BulkJobStatus.PROCESSING,
                    updates={
                        "progress_percentage": progress,
                        "currentStage": stage_enum.value,  # Convert enum to string
                        "metadata": self._filter_metadata_for_schema(metadata)
                    }
                ))
        except Exception as e:
            logger.error(f"Error updating job progress for {job_id}: {e}")
    
    def complete_job(self, job_id: str, result: Dict[str, Any]):
        """Complete a job (sync version)."""
        try:
            # Store result in local storage immediately
            if job_id in self.local_jobs:
                self.local_jobs[job_id]["result"] = result
                self.local_jobs[job_id]["status"] = BulkJobStatus.COMPLETED.value
                self.local_jobs[job_id]["progress_percentage"] = 100.0
                logger.info(f"Stored completion result for job {job_id} in local storage")
            
            # Also try to update Convex
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.update_job_status(
                    job_id=job_id,
                    status=BulkJobStatus.COMPLETED,
                    updates={
                        "progress_percentage": 100.0,
                        "result": result
                    }
                ))
            else:
                asyncio.run(self.update_job_status(
                    job_id=job_id,
                    status=BulkJobStatus.COMPLETED,
                    updates={
                        "progress_percentage": 100.0,
                        "result": result
                    }
                ))
        except Exception as e:
            logger.error(f"Error completing job {job_id}: {e}")
            # Even if Convex update fails, the job is marked complete locally
    
    def fail_job(self, job_id: str, error: str):
        """Fail a job (sync version)."""
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.update_job_status(
                    job_id=job_id,
                    status=BulkJobStatus.FAILED,
                    updates={
                        "error_message": error
                    }
                ))
            else:
                asyncio.run(self.update_job_status(
                    job_id=job_id,
                    status=BulkJobStatus.FAILED,
                    updates={
                        "error_message": error
                    }
                ))
        except Exception as e:
            logger.error(f"Error failing job {job_id}: {e}")
    
    def store_export_info(self, export_id: str, export_info: Dict[str, Any]):
        """Store export information (sync version)."""
        self.exports[export_id] = export_info
        logger.info(f"Stored export info for {export_id} in local storage")
    
    def get_export_info(self, export_id: str) -> Optional[Dict[str, Any]]:
        """Get export information (sync version)."""
        export_info = self.exports.get(export_id)
        if export_info:
            logger.info(f"Retrieved export info for {export_id} from local storage")
        else:
            logger.warning(f"Export info for {export_id} not found in local storage")
        return export_info
    
    def _filter_metadata_for_schema(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter metadata to only include fields allowed by the Convex schema.
        
        Args:
            metadata: Raw metadata dictionary
            
        Returns:
            Filtered metadata dictionary with only schema-allowed fields
        """
        if not metadata:
            return {}
            
        # Only include fields that are defined in the Convex schema
        allowed_fields = {
            "content_processed", "embeddings", "environment", "error", 
            "progress", "stage", "stageNames", "status", "totalStages"
        }
        
        filtered = {}
        for key, value in metadata.items():
            if key in allowed_fields:
                # Ensure stage is always a string, not an object
                if key == "stage" and isinstance(value, dict):
                    # If stage is an object, extract the stage string from it
                    filtered[key] = value.get("stage", str(value))
                elif key == "stage":
                    filtered[key] = str(value)
                else:
                    filtered[key] = value
        
        return filtered


# Singleton instance
bulk_job_manager = BulkJobManager()