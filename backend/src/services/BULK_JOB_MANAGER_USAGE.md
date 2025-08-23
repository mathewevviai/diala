# Bulk Job Manager Usage Guide

The Bulk Job Manager provides a robust system for managing complex multi-stage bulk operations with progress tracking, export functionality, and resource management.

## Key Features

- **Multi-stage processing** with detailed progress tracking
- **Export management** with multiple formats (JSON, CSV, ZIP)
- **Rate limiting** integration for user protection
- **Resource cleanup** and temporary file management
- **Convex webhook integration** for real-time updates
- **Background task coordination** with existing systems

## Basic Usage

### 1. Create a Bulk Job

```python
from src.services.bulk_job_manager import bulk_job_manager, BulkJobStage

# Define the stages for your bulk operation
stages = [
    BulkJobStage.INITIALIZATION,
    BulkJobStage.CONTENT_FETCH,
    BulkJobStage.CONTENT_PROCESSING,
    BulkJobStage.EXPORT_PREPARATION,
    BulkJobStage.EXPORT_GENERATION
]

# Create the job
job_id = await bulk_job_manager.create_bulk_job(
    job_type="bulk_tiktok_download",
    user_id="user123",
    job_data={
        "username": "example_user",
        "video_count": 50,
        "total_items": 50,
        "export_format": "zip"
    },
    stages=stages,
    estimated_duration_minutes=15,
    priority="normal"
)
```

### 2. Process Through Stages

```python
# Start a stage
await bulk_job_manager.start_stage(job_id, BulkJobStage.CONTENT_FETCH, items_total=50)

# Update progress during processing
for i, item in enumerate(items_to_process):
    # Process item...
    progress = (i + 1) / len(items_to_process)
    await bulk_job_manager.update_stage_progress(
        job_id, 
        BulkJobStage.CONTENT_FETCH, 
        progress,
        items_completed=i + 1
    )

# Complete the stage
await bulk_job_manager.complete_stage(
    job_id, 
    BulkJobStage.CONTENT_FETCH,
    items_completed=len(items_to_process)
)
```

### 3. Handle Errors

```python
try:
    # Process stage...
    pass
except Exception as e:
    await bulk_job_manager.fail_stage(
        job_id, 
        BulkJobStage.CONTENT_FETCH, 
        str(e),
        metadata={"error_type": "network_error"}
    )
```

### 4. Create Exports

```python
# Export as JSON
export_id = await bulk_job_manager.create_export(
    job_id,
    export_format="json",
    data=processed_data,
    filename_prefix="tiktok_content"
)

# Export as ZIP with multiple files
export_data = {
    "metadata.json": metadata,
    "content.json": content_data,
    "transcripts.txt": transcripts
}
export_id = await bulk_job_manager.create_export(
    job_id,
    export_format="zip",
    data=export_data,
    filename_prefix="bulk_export"
)
```

## Integration Examples

### TikTok Bulk Download

```python
async def process_tiktok_bulk_download(job_id: str, job_data: Dict[str, Any]):
    """Example: Bulk TikTok video download with stages"""
    
    # Define stage processors
    stage_processors = {
        BulkJobStage.INITIALIZATION: initialize_tiktok_download,
        BulkJobStage.CONTENT_FETCH: fetch_tiktok_videos,
        BulkJobStage.CONTENT_PROCESSING: process_video_content,
        BulkJobStage.EXPORT_PREPARATION: prepare_export_data,
        BulkJobStage.EXPORT_GENERATION: generate_export_files
    }
    
    # Process through all stages
    await bulk_job_manager.process_job_with_stages(job_id, stage_processors)

async def fetch_tiktok_videos(job_id: str, job_data: Dict[str, Any]):
    """Fetch TikTok videos stage"""
    username = job_data["username"]
    video_count = job_data["video_count"]
    
    # Get TikTok service
    tiktok_service = get_tiktok_service()
    
    # Fetch videos with progress tracking
    videos = []
    for i in range(video_count):
        video = await tiktok_service.get_video(username, i)
        videos.append(video)
        
        # Update progress
        progress = (i + 1) / video_count
        await bulk_job_manager.update_stage_progress(
            job_id, 
            BulkJobStage.CONTENT_FETCH, 
            progress,
            items_completed=i + 1
        )
    
    # Store results in job data
    await bulk_job_manager.update_job_status(job_id, BulkJobStatus.PROCESSING, {
        "fetchedVideos": videos
    })
```

### Audio Transcription Bulk

```python
async def process_bulk_transcription(job_id: str, job_data: Dict[str, Any]):
    """Example: Bulk audio transcription"""
    
    files = job_data["audio_files"]
    
    # Initialize transcription stage
    await bulk_job_manager.start_stage(
        job_id, 
        BulkJobStage.TRANSCRIPTION, 
        items_total=len(files)
    )
    
    transcripts = []
    for i, file_path in enumerate(files):
        try:
            # Process file
            transcript = await transcribe_audio_file(file_path)
            transcripts.append({
                "file": file_path,
                "transcript": transcript,
                "status": "completed"
            })
            
            # Update progress
            progress = (i + 1) / len(files)
            await bulk_job_manager.update_stage_progress(
                job_id, 
                BulkJobStage.TRANSCRIPTION, 
                progress,
                items_completed=i + 1
            )
            
        except Exception as e:
            transcripts.append({
                "file": file_path,
                "error": str(e),
                "status": "failed"
            })
            
            await bulk_job_manager.update_stage_progress(
                job_id, 
                BulkJobStage.TRANSCRIPTION, 
                progress,
                items_completed=i + 1,
                items_failed=1
            )
    
    # Complete stage
    await bulk_job_manager.complete_stage(
        job_id, 
        BulkJobStage.TRANSCRIPTION,
        items_completed=len([t for t in transcripts if t["status"] == "completed"]),
        items_failed=len([t for t in transcripts if t["status"] == "failed"])
    )
    
    # Create export
    export_id = await bulk_job_manager.create_export(
        job_id,
        export_format="json",
        data=transcripts,
        filename_prefix="bulk_transcripts"
    )
```

## API Integration

### FastAPI Background Task

```python
from fastapi import BackgroundTasks
from src.services.bulk_job_manager import bulk_job_manager

@router.post("/bulk-process")
async def start_bulk_process(
    request: BulkProcessRequest,
    background_tasks: BackgroundTasks
):
    """Start a bulk processing job"""
    
    # Create job
    job_id = await bulk_job_manager.create_bulk_job(
        job_type=request.job_type,
        user_id=request.user_id,
        job_data=request.job_data,
        stages=request.stages
    )
    
    # Process in background
    background_tasks.add_task(process_bulk_job, job_id)
    
    return {"job_id": job_id, "status": "started"}

@router.get("/bulk-jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """Get job status and progress"""
    job = await bulk_job_manager.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/bulk-jobs/{job_id}/export/{export_id}")
async def download_export(job_id: str, export_id: str):
    """Download export file"""
    file_path = await bulk_job_manager.get_export_file_path(export_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Export not found or expired")
    
    return FileResponse(file_path)
```

## Configuration

### Environment Variables

```bash
# Export configuration
BULK_EXPORT_PATH=/tmp/bulk_exports          # Export files location
BULK_EXPORT_RETENTION_HOURS=24              # How long to keep exports
BULK_MAX_EXPORT_SIZE_MB=500                 # Maximum export file size

# Rate limiting
BULK_RATE_LIMIT_WINDOW=60                   # Rate limit window in minutes
BULK_RATE_LIMIT_MAX_JOBS=5                  # Max jobs per window per user

# Convex configuration
CONVEX_URL=https://your-convex-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

## Convex Schema Requirements

The bulk job manager requires these Convex mutations and queries:

### Mutations
- `bulkJobs:create` - Create new bulk job
- `bulkJobs:updateStatus` - Update job status
- `bulkJobs:updateStageProgress` - Update stage progress
- `bulkJobs:startStage` - Start a stage
- `bulkJobs:completeStage` - Complete a stage
- `bulkJobs:failStage` - Fail a stage
- `bulkJobs:addExport` - Add export to job
- `bulkJobs:removeExport` - Remove export

### Queries
- `bulkJobs:getJob` - Get job by ID
- `bulkJobs:getUserJobs` - Get user's jobs
- `bulkJobs:getUserRecentJobs` - Get recent jobs for rate limiting
- `bulkJobs:getExport` - Get export info
- `bulkJobs:getExpiredExports` - Get expired exports for cleanup

## Best Practices

1. **Always handle errors** at the stage level to prevent job failures
2. **Update progress frequently** for better user experience
3. **Use appropriate stage granularity** - not too fine, not too coarse
4. **Clean up resources** after processing
5. **Set realistic time estimates** for user expectations
6. **Use metadata** to store intermediate results and debug info
7. **Implement proper rate limiting** to protect system resources

## Error Handling

```python
try:
    # Stage processing
    await process_stage_data()
    await bulk_job_manager.complete_stage(job_id, stage)
except ValidationError as e:
    # Handle validation errors
    await bulk_job_manager.fail_stage(
        job_id, stage, f"Validation failed: {str(e)}"
    )
except NetworkError as e:
    # Handle network errors with retry info
    await bulk_job_manager.fail_stage(
        job_id, stage, str(e), 
        metadata={"retry_after": 300, "error_type": "network"}
    )
except Exception as e:
    # Handle unexpected errors
    await bulk_job_manager.fail_stage(
        job_id, stage, f"Unexpected error: {str(e)}"
    )
```

## Monitoring and Cleanup

```python
# Periodic cleanup of expired exports
async def cleanup_expired_exports():
    """Clean up expired exports (run periodically)"""
    await bulk_job_manager.cleanup_expired_exports()

# Job statistics for monitoring
async def get_job_statistics():
    """Get job processing statistics"""
    return await bulk_job_manager.get_job_stats()
```