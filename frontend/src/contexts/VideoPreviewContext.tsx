'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface VideoPreviewData {
  videoId: string;
  platform: 'tiktok' | 'youtube' | 'twitch';
  previewUrl: string | null;
  fallbackUrl?: string | null;
  previewBlob: Blob | null;
  audioUrl?: string | null;
  audioBlob?: Blob | null;
  loading: boolean;
  error: string | null;
}

interface VideoPreviewContextType {
  previews: Map<string, VideoPreviewData>;
  generatePreview: (videoId: string, platform: 'tiktok' | 'youtube' | 'twitch', videoUrl?: string) => Promise<VideoPreviewData | undefined>;
  generateMultiplePreviews: (videos: Array<{id: string, url?: string}>, platform: 'tiktok' | 'youtube' | 'twitch') => Promise<void>;
  getPreview: (videoId: string, platform: 'tiktok' | 'youtube' | 'twitch') => VideoPreviewData | undefined;
  extractAudio: (videoId: string, platform: 'tiktok' | 'youtube' | 'twitch', format?: string) => Promise<void>;
  cancelPreview: (videoId: string, platform: 'tiktok' | 'youtube' | 'twitch') => void;
  clearCache: () => void;
  previewsLoading: boolean;
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
      // Only revoke if it's a blob URL (starts with 'blob:')
      if (oldData?.previewUrl && oldData.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldData.previewUrl);
      }
      if (oldData?.audioUrl && oldData.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldData.audioUrl);
      }
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  getAll(): Map<string, VideoPreviewData> {
    return new Map(this.cache);
  }

  clear(): void {
    // Clean up only blob URLs (not stream URLs)
    this.cache.forEach((data) => {
      if (data.previewUrl && data.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(data.previewUrl);
      }
      if (data.audioUrl && data.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(data.audioUrl);
      }
    });
    this.cache.clear();
  }
}

// Singleton cache instance
const previewCache = new PreviewCache();

const VideoPreviewContext = createContext<VideoPreviewContextType | undefined>(undefined);

export function VideoPreviewProvider({ children }: { children: ReactNode }) {
  const [previews, setPreviews] = useState<Map<string, VideoPreviewData>>(() => previewCache.getAll());
  const [previewsLoading, setPreviewsLoading] = useState(false);
  const loadingRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const isMountedRef = useRef(true);

  const generatePreview = useCallback(async (
    videoId: string,
    platform: 'tiktok' | 'youtube' | 'twitch',
    videoUrl?: string
  ): Promise<VideoPreviewData | undefined> => {
    const cacheKey = `${platform}-${videoId}`;
    
    // Check cache first (includes both cached and current state)
    const cached = previewCache.get(cacheKey);
    if (cached && (cached.previewUrl || cached.loading)) {
      return cached;
    }

    // Cancel any existing request for this video
    const existingController = abortControllersRef.current.get(cacheKey);
    if (existingController) {
      existingController.abort();
      abortControllersRef.current.delete(cacheKey);
    }

    // Avoid duplicate requests
    if (loadingRef.current.has(cacheKey)) {
      return;
    }

    loadingRef.current.add(cacheKey);
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllersRef.current.set(cacheKey, abortController);
    
    // Set loading state
    const loadingData: VideoPreviewData = {
      videoId,
      platform,
      previewUrl: null,
      previewBlob: null,
      audioUrl: null,
      audioBlob: null,
      loading: true,
      error: null
    };
    
    if (isMountedRef.current) {
      setPreviews(prev => new Map(prev).set(cacheKey, loadingData));
    }

    try {
      // Currently only TikTok has preview endpoints
      if (platform !== 'tiktok') {
        throw new Error(`Preview not available for ${platform} yet`);
      }
      
      // Use the TikTok preview endpoint to get proper streaming URLs
      if (platform === 'tiktok') {
        try {
          console.log('[VideoPreview] Fetching TikTok preview for', videoId);
          
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
          const response = await fetch(`${apiBaseUrl}/api/public/tiktok/preview/${videoId}?user_id=user123`);
          
          if (!response.ok) {
            throw new Error(`Failed to get preview: ${response.statusText}`);
          }
          
          const previewData = await response.json();
          
          // Use the actual streaming endpoint URL
          const streamUrl = `${apiBaseUrl}/api/public/tiktok/stream/${videoId}`;
          
          const videoPreviewData: VideoPreviewData = {
            videoId,
            platform,
            previewUrl: streamUrl,
            previewBlob: null,
            audioUrl: null,
            audioBlob: null,
            loading: false,
            error: null
          };
          
          console.log('[VideoPreview] Created preview data with streaming URL:', videoPreviewData.previewUrl);
          
      // Update state and cache
      previewCache.set(cacheKey, videoPreviewData);
      if (isMountedRef.current) {
        setPreviews(previewCache.getAll());
      }
      
      return videoPreviewData;        } catch (error) {
          console.error('[VideoPreview] Failed to get TikTok preview:', error);
          throw error;
        }
      }
      
      // Use the actual streaming endpoint for TikTok
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const streamUrl = `${apiBaseUrl}/api/public/tiktok/stream/${videoId}`;
      
      const previewData: VideoPreviewData = {
        videoId,
        platform,
        previewUrl: streamUrl,
        previewBlob: null,
        audioUrl: null,
        audioBlob: null,
        loading: false,
        error: null
      };
      
      console.log('[VideoPreview] Created preview data with streaming URL:', previewData.previewUrl);

      // Update state and cache
      previewCache.set(cacheKey, previewData);
      if (isMountedRef.current) {
        setPreviews(previewCache.getAll());
      }

      return previewData;
    } catch (error) {
      // Check if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[VideoPreview] Request aborted for:', videoId);
        // Don't update state for aborted requests
        return undefined;
      }
      
      const errorData: VideoPreviewData = {
        videoId,
        platform,
        previewUrl: null,
        previewBlob: null,
        audioUrl: null,
        audioBlob: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview'
      };
      
      if (isMountedRef.current) {
        setPreviews(previewCache.getAll());
      }
      return errorData;
    } finally {
      loadingRef.current.delete(cacheKey);
      abortControllersRef.current.delete(cacheKey);
    }
  }, [previews]);

  const generateMultiplePreviews = useCallback(async (
    videos: Array<{id: string, url?: string}>,
    platform: 'tiktok' | 'youtube' | 'twitch'
  ) => {
    setPreviewsLoading(true);
    try {
      // Generate previews in parallel
      await Promise.all(
        videos.map(video => 
          generatePreview(video.id, platform, video.url)
        )
      );
    } finally {
      setPreviewsLoading(false);
    }
  }, [generatePreview]);

  const getPreview = useCallback((videoId: string, platform: 'tiktok' | 'youtube' | 'twitch') => {
    const cacheKey = `${platform}-${videoId}`;
    return previewCache.get(cacheKey);
  }, []);

  const extractAudio = useCallback(async (
    videoId: string,
    platform: 'tiktok' | 'youtube' | 'twitch',
    format: string = 'mp3'
  ) => {
    const cacheKey = `${platform}-${videoId}`;
    
    // Get existing preview data
    const existingPreview = previews.get(cacheKey) || previewCache.get(cacheKey);
    if (!existingPreview) {
      console.error('[VideoPreview] No preview data found for', videoId);
      return;
    }
    
    // Check if audio already extracted
    if (existingPreview.audioUrl) {
      console.log('[VideoPreview] Audio already extracted for', videoId);
      return;
    }
    
    try {
      console.log('[VideoPreview] Extracting audio for', videoId, 'in', format, 'format');
      
      // Currently only TikTok has audio extraction endpoint
      if (platform !== 'tiktok') {
        throw new Error(`Audio extraction not available for ${platform} yet`);
      }
      
      // Use the audio extraction endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const audioUrl = `${baseUrl}/api/public/tiktok/audio/${videoId}?format=${format}&user_id=preview-user`;
      
      // Download audio as blob
      const audioResponse = await fetch(audioUrl);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to extract audio: ${audioResponse.status}`);
      }
      
      // Get audio as blob
      const audioBlob = await audioResponse.blob();
      console.log('[VideoPreview] Downloaded audio blob, size:', audioBlob.size);
      
      // Create blob URL for audio
      const audioBlobUrl = URL.createObjectURL(audioBlob);
      console.log('[VideoPreview] Created audio blob URL:', audioBlobUrl);
      
      // Update preview data with audio
      const updatedPreview: VideoPreviewData = {
        ...existingPreview,
        audioUrl: audioBlobUrl,
        audioBlob: audioBlob
      };
      
      // Update state and cache
      previewCache.set(cacheKey, updatedPreview);
      if (isMountedRef.current) {
        setPreviews(previewCache.getAll());
      }
      
      console.log('[VideoPreview] Audio extraction complete for', videoId);
      
    } catch (error) {
      console.error('[VideoPreview] Failed to extract audio:', error);
      
      // Update preview with error state
      const errorPreview: VideoPreviewData = {
        ...existingPreview,
        error: error instanceof Error ? error.message : 'Failed to extract audio'
      };
      
      if (isMountedRef.current) {
        setPreviews(previewCache.getAll());
      }
    }
  }, [previews]);

  const cancelPreview = useCallback((videoId: string, platform: 'tiktok' | 'youtube' | 'twitch') => {
    const cacheKey = `${platform}-${videoId}`;
    const controller = abortControllersRef.current.get(cacheKey);
    if (controller) {
      console.log('[VideoPreview] Cancelling preview request for:', cacheKey);
      controller.abort();
      abortControllersRef.current.delete(cacheKey);
      loadingRef.current.delete(cacheKey);
      
      // Reset loading state for this specific preview
      if (isMountedRef.current) {
        setPreviews(previewCache.getAll());
      }
    }
  }, []);

  const clearCache = useCallback(() => {
    // Cancel all ongoing requests
    abortControllersRef.current.forEach((controller, key) => {
      console.log('[VideoPreview] Cancelling request for:', key);
      controller.abort();
    });
    abortControllersRef.current.clear();
    
      // Clean up blob URLs from cache
      previewCache.getAll().forEach((preview) => {
        if (preview.previewUrl && preview.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(preview.previewUrl);
        }
        if (preview.audioUrl && preview.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(preview.audioUrl);
        }
      });
    
    previewCache.clear();
    if (isMountedRef.current) {
      setPreviews(new Map());
    }
    loadingRef.current.clear();
  }, []); // No dependencies - uses refs instead

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('[VideoPreview] Cleaning up on unmount');
      isMountedRef.current = false;
      
      // Cancel all ongoing requests
      abortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      abortControllersRef.current.clear();
      
      // Clean up blob URLs from cache
      previewCache.getAll().forEach((preview) => {
        if (preview.previewUrl && preview.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(preview.previewUrl);
        }
        if (preview.audioUrl && preview.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(preview.audioUrl);
        }
      });
    };
  }, []); // Empty deps - only run on unmount

  return (
    <VideoPreviewContext.Provider value={{
      previews,
      generatePreview,
      generateMultiplePreviews,
      getPreview,
      extractAudio,
      cancelPreview,
      clearCache,
      previewsLoading
    }}>
      {children}
    </VideoPreviewContext.Provider>
  );
}

export function useVideoPreviewContext() {
  const context = useContext(VideoPreviewContext);
  if (!context) {
    throw new Error('useVideoPreviewContext must be used within VideoPreviewProvider');
  }
  return context;
}