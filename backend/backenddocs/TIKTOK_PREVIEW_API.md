# TikTok Video Preview API Documentation

## Overview

The TikTok Video Preview API provides endpoints to preview TikTok videos without downloading them. This feature allows users to view video metadata and stream videos directly in their browser.

## New Endpoints

### 1. Get Single Video Preview

**Endpoint:** `GET /api/public/tiktok/preview/{video_id}`

**Description:** Retrieves preview information for a single TikTok video, including a direct streaming URL.

**Parameters:**
- `video_id` (path): TikTok video ID
- `user_id` (query): User ID for rate limiting

**Response Model:**
```json
{
  "videoId": "7274327037519932715",
  "title": "Video title",
  "description": "Video description",
  "duration": 30,
  "thumbnail": "https://...",
  "streamUrl": "https://...",
  "format": "mp4",
  "width": 1080,
  "height": 1920,
  "uploader": "username",
  "uploaderId": "user_id",
  "stats": {
    "views": 1000000,
    "likes": 50000,
    "comments": 1000,
    "shares": 500
  },
  "timestamp": 1699123456,
  "hashtags": [
    {
      "id": "funny",
      "name": "funny",
      "title": "funny"
    }
  ]
}
```

**Rate Limiting:** 30 requests per hour per user

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/public/tiktok/preview/7274327037519932715?user_id=user123"
```

### 2. Get Batch Video Previews

**Endpoint:** `POST /api/public/tiktok/preview-batch`

**Description:** Retrieves preview information for multiple TikTok videos in a single request (up to 10 videos).

**Request Body:**
```json
{
  "video_ids": ["7274327037519932715", "7274327037519932716"],
  "user_id": "user123"
}
```

**Response:**
```json
{
  "previews": [
    {
      "videoId": "7274327037519932715",
      "title": "Video 1",
      "streamUrl": "https://...",
      // ... other fields
    }
  ],
  "failed": [
    {
      "videoId": "7274327037519932716",
      "error": "Video not found"
    }
  ],
  "totalRequested": 2,
  "totalSuccessful": 1
}
```

**Rate Limiting:** 10 requests per hour per user

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/public/tiktok/preview-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "video_ids": ["7274327037519932715", "7274327037519932716"],
    "user_id": "user123"
  }'
```

## Usage in Frontend

### HTML5 Video Player Integration

The `streamUrl` returned by the preview endpoints can be used directly in HTML5 video players:

```javascript
// React example
const VideoPreview = ({ videoId }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`/api/public/tiktok/preview/${videoId}?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setPreview(data));
  }, [videoId]);

  if (!preview) return <div>Loading...</div>;

  return (
    <video 
      src={preview.streamUrl}
      poster={preview.thumbnail}
      controls
      width={preview.width}
      height={preview.height}
    />
  );
};
```

### Batch Preview Example

```javascript
// Fetch multiple video previews at once
const fetchBatchPreviews = async (videoIds) => {
  const response = await fetch('/api/public/tiktok/preview-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_ids: videoIds,
      user_id: currentUserId
    })
  });

  const data = await response.json();
  return data.previews;
};
```

## Benefits

1. **No Download Required**: Videos are streamed directly from TikTok's CDN
2. **Faster User Experience**: Instant preview without waiting for downloads
3. **Reduced Storage**: No need to store video files on the server
4. **Better UX**: Users can preview videos before selecting them for voice cloning

## Error Handling

Common error responses:

- **400 Bad Request**: Invalid video ID or extraction failed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

Example error response:
```json
{
  "detail": "Failed to get video preview: Video not found"
}
```

## Technical Details

The preview functionality uses `yt-dlp` to extract video metadata and streaming URLs from TikTok. The extraction happens without downloading the actual video file, making it efficient and fast.

### Service Implementation

The `TikTokService.get_video_preview()` method:
1. Constructs the TikTok video URL
2. Uses yt-dlp to extract video information without downloading
3. Returns metadata including the direct streaming URL
4. Handles errors gracefully

### Performance Considerations

- Video extraction typically takes 1-3 seconds per video
- Batch requests are processed concurrently for better performance
- Streaming URLs are temporary and may expire after some time
- Consider implementing caching for frequently accessed videos