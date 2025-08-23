import { useState, useEffect, useCallback, useRef } from 'react';

interface VideoPreviewData {
  videoId: string;
  platform: 'tiktok' | 'youtube' | 'twitch';
  previewUrl: string | null;
  previewBlob: Blob | null;
  loading: boolean;
  error: string | null;
}

// LRU Cache for preview management
class PreviewCache {
  private cache: Map<string, VideoPreviewData>;
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): VideoPreviewData | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: string, value: VideoPreviewData): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      const oldData = this.cache.get(firstKey);
      if (oldData?.previewUrl) {
        URL.revokeObjectURL(oldData.previewUrl);
      }
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    // Clean up all blob URLs
    this.cache.forEach((data) => {
      if (data.previewUrl) {
        URL.revokeObjectURL(data.previewUrl);
      }
    });
    this.cache.clear();
  }
}

// Singleton cache instance
const previewCache = new PreviewCache();

export function useVideoPreview() {
  const [previews, setPreviews] = useState<Map<string, VideoPreviewData>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());

  const generatePreview = useCallback(async (
    videoId: string,
    platform: 'tiktok' | 'youtube' | 'twitch',
    videoUrl?: string
  ) => {
    const cacheKey = `${platform}-${videoId}`;
    
    // Check cache first
    const cached = previewCache.get(cacheKey);
    if (cached) {
      setPreviews(prev => new Map(prev).set(cacheKey, cached));
      return cached;
    }

    // Avoid duplicate requests
    if (loadingRef.current.has(cacheKey)) {
      return;
    }

    loadingRef.current.add(cacheKey);
    
    // Set loading state
    const loadingData: VideoPreviewData = {
      videoId,
      platform,
      previewUrl: null,
      previewBlob: null,
      loading: true,
      error: null
    };
    
    setPreviews(prev => new Map(prev).set(cacheKey, loadingData));

    try {
      // Call backend to generate preview
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/${platform}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoId,
          video_url: videoUrl,
          duration: platform === 'tiktok' ? 0 : 30, // Full video for TikTok, 30s for others
          quality: '480p'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);

      const previewData: VideoPreviewData = {
        videoId,
        platform,
        previewUrl,
        previewBlob: blob,
        loading: false,
        error: null
      };

      // Update state and cache
      previewCache.set(cacheKey, previewData);
      setPreviews(prev => new Map(prev).set(cacheKey, previewData));

      return previewData;
    } catch (error) {
      const errorData: VideoPreviewData = {
        videoId,
        platform,
        previewUrl: null,
        previewBlob: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview'
      };
      
      setPreviews(prev => new Map(prev).set(cacheKey, errorData));
      return errorData;
    } finally {
      loadingRef.current.delete(cacheKey);
    }
  }, []);

  const getPreview = useCallback((videoId: string, platform: 'tiktok' | 'youtube' | 'twitch') => {
    const cacheKey = `${platform}-${videoId}`;
    return previews.get(cacheKey);
  }, [previews]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previews.forEach((data) => {
        if (data.previewUrl) {
          URL.revokeObjectURL(data.previewUrl);
        }
      });
    };
  }, []);

  return {
    generatePreview,
    getPreview,
    previews,
    clearCache: () => previewCache.clear()
  };
}