# YouTube Video Processing

## Overview

The YouTube processing component extracts transcripts from YouTube videos and converts them into structured knowledge embeddings for RAG workflows. This is based on the existing `SalesAgenttraining/src/transcript_fetcher.py` implementation.

## Core Functionality

### Video ID Extraction

Supports multiple YouTube URL formats:
- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Shortened: `https://youtu.be/VIDEO_ID`
- Embedded: `https://www.youtube.com/embed/VIDEO_ID`

```python
def extract_video_id(url):
    """Extracts the YouTube video ID from a URL."""
    # Standard URL: https://www.youtube.com/watch?v=VIDEO_ID
    match = re.search(r"watch\?v=([^&]+)", url)
    if match:
        return match.group(1)
    # Shortened URL: https://youtu.be/VIDEO_ID
    match = re.search(r"youtu\.be/([^?]+)", url)
    if match:
        return match.group(1)
    # Embedded URL: https://www.youtube.com/embed/VIDEO_ID
    match = re.search(r"embed/([^?]+)", url)
    if match:
        return match.group(1)
    return None
```

### Transcript Fetching

Uses the `youtube-transcript-api` library with intelligent fallback:

1. **Priority Order**:
   - Manually created English transcripts (highest quality)
   - Auto-generated English transcripts
   - Any available transcript in other languages

2. **Error Handling**:
   - `TranscriptsDisabled`: Video owner disabled transcripts
   - `NoTranscriptFound`: No transcript available in any language
   - `VideoUnavailable`: Video is private, deleted, or restricted

### Data Format

Transcripts are saved as JSON files with the following structure:
```json
[
  {
    "text": "Welcome to this video about sales techniques",
    "start": 0.0,
    "duration": 3.5
  },
  {
    "text": "Today we'll cover objection handling",
    "start": 3.5,
    "duration": 2.8
  }
]
```

## Integration Points

### Frontend Interface

From the AutoRAG dashboard, users can:
- Input YouTube channel URLs (`@channelname/videos`)
- Input individual video URLs
- Specify video playlists
- Configure processing parameters

### Backend Processing Pipeline

1. **URL Validation**: Verify YouTube URLs are accessible
2. **Video Discovery**: For channels, discover all videos
3. **Transcript Extraction**: Download available transcripts
4. **Content Processing**: Convert to embeddings using Gemini AI
5. **Storage**: Save to configured vector store

## Implementation Requirements

### Dependencies
```python
youtube-transcript-api==0.6.1
google-generativeai>=0.3.0
```

### API Integration

#### POST /api/autorag/youtube/process
```json
{
  "workflow_id": "uuid",
  "sources": [
    "https://youtube.com/@salesmastery/videos",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ],
  "parameters": {
    "language_preference": ["en", "auto"],
    "chunk_size": 512,
    "overlap": 50
  }
}
```

#### Response
```json
{
  "status": "started",
  "workflow_id": "uuid",
  "estimated_videos": 45,
  "processing_queue_position": 3
}
```

### WebSocket Status Updates
```json
{
  "type": "youtube_progress",
  "workflow_id": "uuid",
  "current_video": 15,
  "total_videos": 45,
  "current_video_id": "dQw4w9WgXcQ",
  "status": "transcribing",
  "details": "Fetching transcript for 'Never Gonna Give You Up'"
}
```

## Error Scenarios

### Transcript Unavailable
- **Cause**: Video owner disabled transcripts
- **Action**: Skip video, log warning, continue processing
- **Frontend**: Show skipped count in workflow stats

### Rate Limiting
- **Cause**: Too many API requests to YouTube
- **Action**: Implement exponential backoff
- **Frontend**: Show "rate limited" status

### Invalid URLs
- **Cause**: Malformed or non-YouTube URLs
- **Action**: Validate before processing, return error
- **Frontend**: Highlight invalid URLs in creation form

## Quality Considerations

### Transcript Quality Scoring
- Manual transcripts: Score 1.0 (highest quality)
- Auto-generated: Score 0.7
- Other languages: Score 0.5

### Content Filtering
- Skip videos shorter than 30 seconds
- Skip videos with no meaningful transcript content
- Filter out music-only or non-speech content

## Performance Optimization

### Batch Processing
- Process multiple videos concurrently (limit: 5 simultaneous)
- Queue management for large channels
- Priority processing for smaller workflows

### Caching Strategy
- Cache video metadata for 24 hours
- Store transcript files locally before processing
- Deduplicate identical video IDs across workflows

## Configuration Options

### Processing Parameters
```json
{
  "max_concurrent_downloads": 5,
  "transcript_timeout_seconds": 30,
  "retry_attempts": 3,
  "retry_delay_seconds": 5,
  "min_video_duration": 30,
  "max_video_duration": 3600,
  "language_preferences": ["en", "auto"],
  "skip_music_videos": true,
  "quality_threshold": 0.5
}
```

### Storage Configuration
```json
{
  "temp_directory": "/tmp/autorag/youtube",
  "cleanup_after_processing": true,
  "preserve_original_transcripts": false,
  "compression_enabled": true
}
```

## Security Considerations

- **URL Validation**: Ensure only YouTube URLs are processed
- **Rate Limiting**: Respect YouTube's API limits
- **Content Filtering**: Scan for inappropriate content
- **Access Control**: Verify user permissions for private videos

## Future Enhancements

1. **Channel Monitoring**: Automatically process new videos from subscribed channels
2. **Live Stream Support**: Handle live stream transcripts
3. **Multi-language Support**: Process non-English content with translation
4. **Content Categorization**: Automatically tag videos by topic
5. **Quality Enhancement**: Use AI to improve auto-generated transcript quality