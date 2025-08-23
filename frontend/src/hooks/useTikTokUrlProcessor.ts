import { useState, useCallback } from 'react';

export interface ProcessedTikTokVideo {
  url: string;
  videoId: string;
  username: string;
  title: string;
  thumbnail: string;
  duration: number;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  preview: {
    videoId: string;
    title: string;
    description: string;
    duration: number;
    thumbnail: string;
    streamUrl: string;
    format: string;
    width: number;
    height: number;
    uploader: string;
    uploaderId: string;
    stats: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
    timestamp: number;
    hashtags: Array<{
      id: string;
      name: string;
      title: string;
    }>;
  };
  processed: boolean;
  error?: string;
}

export interface UseTikTokUrlProcessorReturn {
  processUrls: (urls: string[]) => Promise<ProcessedTikTokVideo[]>;
  isLoading: boolean;
  error: string | null;
}

export function useTikTokUrlProcessor(): UseTikTokUrlProcessorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processUrls = useCallback(async (urls: string[]): Promise<ProcessedTikTokVideo[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/tiktok/process-specific-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls,
          user_id: 'bulk-processing-user'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.detail || 'Failed to process URLs');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    processUrls,
    isLoading,
    error,
  };
}