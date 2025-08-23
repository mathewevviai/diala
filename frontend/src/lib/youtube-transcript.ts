export interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResponse {
  transcript: string;
  videoId: string;
}

export function extractVideoId(url: string): string | null {
  // Standard URL: https://www.youtube.com/watch?v=VIDEO_ID
  let match = url.match(/watch\?v=([^&]+)/);
  if (match) return match[1];
  
  // Shortened URL: https://youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([^?]+)/);
  if (match) return match[1];
  
  // Embedded URL: https://www.youtube.com/embed/VIDEO_ID
  match = url.match(/embed\/([^?]+)/);
  if (match) return match[1];
  
  return null;
}

export async function fetchYoutubeTranscript(url: string): Promise<TranscriptResponse> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }

  try {
    // Using a public API that provides YouTube transcripts
    // Note: In production, you might want to use your own proxy server
    const response = await fetch(`https://youtube-transcript-api.vercel.app/api/transcript?videoId=${videoId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No transcript found for this video');
      }
      throw new Error('Failed to fetch transcript');
    }

    const data = await response.json();
    
    // Combine all transcript segments into one string
    const fullTranscript = data.transcript
      .map((entry: TranscriptEntry) => entry.text)
      .join(' ');

    return {
      transcript: fullTranscript,
      videoId: videoId
    };
  } catch (error) {
    // Fallback: Try using YouTube's own transcript feature through iframe API
    // This requires parsing the YouTube page which has CORS restrictions
    // So we'll need to handle this error gracefully
    
    console.error('Error fetching transcript:', error);
    
    // For now, return a placeholder or error message
    throw new Error('Unable to fetch transcript. This video may not have captions available.');
  }
}

// Alternative approach using YouTube Data API (requires API key)
export async function fetchTranscriptWithApiKey(videoId: string, apiKey: string): Promise<string> {
  try {
    // First, get video details to check if captions are available
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
    );
    
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found');
    }

    // Check if captions are available
    const hasCaption = videoData.items[0].contentDetails.caption === 'true';
    
    if (!hasCaption) {
      throw new Error('No captions available for this video');
    }

    // YouTube Data API doesn't provide direct access to transcripts
    // You would need to use the YouTube Caption API or a third-party service
    throw new Error('Caption API access required for transcript retrieval');
  } catch (error) {
    console.error('Error with YouTube API:', error);
    throw error;
  }
}