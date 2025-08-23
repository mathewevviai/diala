import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';

interface YouTubeChannel {
  channelId: string;
  channelName: string;
  channelHandle?: string;
  channelUrl: string;
  avatar?: string;
  banner?: string;
  description?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  joinedDate?: string;
  country?: string;
}

interface YouTubeVideo {
  videoId: string;
  channelId: string;
  channelName: string;
  title: string;
  description?: string;
  thumbnail?: string;
  thumbnails?: Array<{
    quality: string;
    url: string;
    width: number;
    height: number;
  }>;
  duration: number;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
  category?: string;
  language?: string;
}

interface UseYouTubeContentReturn {
  // Channel data
  channel: YouTubeChannel | null;
  channelLoading: boolean;
  channelError: string | null;
  fetchChannel: (channelUrl: string) => Promise<void>;
  
  // Videos data
  videos: YouTubeVideo[];
  videosLoading: boolean;
  videosError: string | null;
  fetchVideos: (channelId: string, count?: number, sortBy?: string) => Promise<void>;
  
  // Download functionality
  downloadVideos: (videoIds: string[], channelName: string) => Promise<void>;
  downloadProgress: number;
  downloadStatus: string | null;
  
  // Cleanup
  cleanup: () => Promise<any>;
  
  // Rate limiting
  canFetchChannel: boolean;
  canFetchVideos: boolean;
  canDownloadVideos: boolean;
  rateLimitInfo: {
    fetch_channel: { remaining: number; resetAt: number };
    fetch_videos: { remaining: number; resetAt: number };
    download_videos: { remaining: number; resetAt: number };
  } | null;
}

export function useYouTubeContent(initialChannelUrl?: string): UseYouTubeContentReturn {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());
  const [channelIdFromJob, setChannelIdFromJob] = useState<string | null>(null);
  
  // Get current user ID (in production, get from auth)
  const userId = 'user123'; // TODO: Get from auth context
  
  // Convex mutations
  const createChannelFetchJob = useMutation(api.mutations.youtubeContent.createChannelFetchJob);
  const createVideosFetchJob = useMutation(api.mutations.youtubeContent.createVideosFetchJob);
  const createDownloadJob = useMutation(api.mutations.youtubeContent.createDownloadJob);
  const cleanupAllData = useMutation(api.mutations.youtubeContent.cleanupAllData);
  const cleanupChannelData = useMutation(api.mutations.youtubeContent.cleanupChannelData);
  
  // Check cached data - use either the channel ID from state or from completed job
  const queryChannelId = channel?.channelId || channelIdFromJob;
  
  const cachedChannel = useQuery(
    api.queries.youtubeContent.getCachedChannel,
    queryChannelId && !channelLoading ? { channelId: queryChannelId } : 'skip'
  );
  
  const cachedVideos = useQuery(
    api.queries.youtubeContent.getCachedVideos,
    queryChannelId ? { channelId: queryChannelId } : 'skip'
  );
  
  // Check rate limits
  const channelRateLimit = useQuery(
    api.queries.youtubeContent.checkRateLimit,
    { userId, action: 'fetch_channel' }
  );
  
  const videosRateLimit = useQuery(
    api.queries.youtubeContent.checkRateLimit,
    { userId, action: 'fetch_videos' }
  );
  
  const downloadRateLimit = useQuery(
    api.queries.youtubeContent.checkRateLimit,
    { userId, action: 'download_videos' }
  );
  
  // Monitor active jobs
  const userJobs = useQuery(
    api.queries.youtubeContent.getUserJobs,
    { userId, limit: 10 }
  );
  
  // Load cached data
  useEffect(() => {
    // Don't load cached data while actively fetching new channel
    if (cachedChannel && !channelLoading) {
      if (cachedChannel.channel && !cachedChannel.isStale) {
        setChannel(cachedChannel.channel);
      }
    }
  }, [cachedChannel]);
  
  // Keep track of retry attempts
  const [cacheRetryCount, setCacheRetryCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    // Don't load cached data while actively fetching new videos
    if (!videosLoading) {
      if (!cachedVideos) {
        // No cached videos query result yet
      } else if (cachedVideos.videos) {
        if (cachedVideos.videos.length > 0) {
          setVideos(cachedVideos.videos);
          setCacheRetryCount(0); // Reset retry count on success
        } else if (cacheRetryCount < 3 && queryChannelId) {
          // Retry after a delay
          setTimeout(() => {
            setCacheRetryCount(prev => prev + 1);
          }, 1000);
        }
      }
    }
  }, [cachedVideos, videosLoading, queryChannelId, cacheRetryCount]);
  
  // Monitor job statuses
  useEffect(() => {
    if (!userJobs) return;
    
    userJobs.forEach(job => {
      if (activeJobs.has(job.jobId)) {
        if (job.status === 'completed') {
          activeJobs.delete(job.jobId);
          setActiveJobs(new Set(activeJobs));
          
          // Update local state based on job type
          if (job.action === 'fetch_channel') {
            setChannelLoading(false);
            setChannelError(null);
            // Store the channelId from the completed job
            if (job.channelId) {
              setChannelIdFromJob(job.channelId);
            }
            // Channel data will be loaded via cachedChannel query
          } else if (job.action === 'fetch_videos') {
            setVideosLoading(false);
            setVideosError(null);
            // Add a small delay to ensure Convex has processed the webhook
            setTimeout(() => {
              // Force query refresh
              setRefreshTrigger(prev => prev + 1);
              setCacheRetryCount(0);
            }, 500);
          } else if (job.action === 'download_videos') {
            setDownloadProgress(100);
            setDownloadStatus('completed');
          }
        } else if (job.status === 'failed') {
          activeJobs.delete(job.jobId);
          setActiveJobs(new Set(activeJobs));
          
          const error = job.error || 'Operation failed';
          if (job.action === 'fetch_channel') {
            setChannelLoading(false);
            setChannelError(error);
          } else if (job.action === 'fetch_videos') {
            setVideosLoading(false);
            setVideosError(error);
          } else if (job.action === 'download_videos') {
            setDownloadStatus('failed');
          }
        } else if (job.action === 'download_videos' && job.progress) {
          setDownloadProgress(job.progress);
        }
      }
    });
  }, [userJobs, activeJobs]);
  
  const fetchChannel = useCallback(async (channelUrl: string) => {
    try {
      // Reset all state when fetching a new channel
      setChannel(null);
      setChannelIdFromJob(null);
      setVideos([]);
      setVideosError(null);
      setChannelLoading(true);
      setChannelError(null);
      
      // Create job
      const jobId = uuidv4();
      console.log('[useYouTubeContent] Creating channel fetch job:', {
        jobId,
        userId,
        channelUrl,
      });
      
      await createChannelFetchJob({
        jobId,
        userId,
        channelUrl,
      });
      
      // Add to active jobs
      activeJobs.add(jobId);
      setActiveJobs(new Set(activeJobs));
      
      // Call backend API
      const requestBody = {
        job_id: jobId,
        channel_url: channelUrl,
        user_id: userId,
      };
      
      console.log('[useYouTubeContent] Sending request to backend:', requestBody);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/youtube/channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseData = await response.json();
      console.log('[useYouTubeContent] Backend response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to fetch channel');
      }
      
    } catch (error) {
      console.error('[useYouTubeContent] Error fetching YouTube channel:', error);
      setChannelError(error instanceof Error ? error.message : 'Failed to fetch channel');
      setChannelLoading(false);
    }
  }, [createChannelFetchJob, userId, activeJobs]);
  
  const fetchVideos = useCallback(async (channelId: string, count: number = 6, sortBy: string = 'newest') => {
    try {
      setVideosLoading(true);
      setVideosError(null);
      
      // Create job
      const jobId = uuidv4();
      await createVideosFetchJob({
        jobId,
        userId,
        channelId,
        count,
        sortBy,
      });
      
      // Add to active jobs
      activeJobs.add(jobId);
      setActiveJobs(new Set(activeJobs));
      
      // Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/youtube/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          channel_id: channelId,
          user_id: userId,
          count,
          sort_by: sortBy,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch videos');
      }
      
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      setVideosError(error instanceof Error ? error.message : 'Failed to fetch videos');
      setVideosLoading(false);
    }
  }, [createVideosFetchJob, userId, activeJobs]);
  
  const downloadVideos = useCallback(async (videoIds: string[], channelName: string) => {
    try {
      setDownloadProgress(0);
      setDownloadStatus('starting');
      
      // Create job
      const jobId = uuidv4();
      const channelId = channel?.channelId || '';
      
      await createDownloadJob({
        jobId,
        userId,
        channelId,
        channelName,
        videoIds,
      });
      
      // Add to active jobs
      activeJobs.add(jobId);
      setActiveJobs(new Set(activeJobs));
      
      // Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/youtube/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          video_ids: videoIds,
          user_id: userId,
          channel_name: channelName,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to download videos');
      }
      
      setDownloadStatus('downloading');
      
    } catch (error) {
      console.error('Error downloading YouTube videos:', error);
      setDownloadStatus('failed');
    }
  }, [createDownloadJob, userId, channel, activeJobs]);
  
  // Cleanup function to reset all data
  const cleanup = useCallback(async () => {
    try {
      console.log('[useYouTubeContent] Cleaning up data for user:', userId, 'channel:', channel?.channelId || channelIdFromJob);
      
      // Clear local state
      setChannel(null);
      setChannelIdFromJob(null);
      setVideos([]);
      setChannelLoading(false);
      setVideosLoading(false);
      setChannelError(null);
      setVideosError(null);
      setDownloadProgress(0);
      setDownloadStatus(null);
      setActiveJobs(new Set());
      setCacheRetryCount(0);
      setRefreshTrigger(0);
      
      // Call Convex cleanup mutation - use cleanupAllData for more thorough cleanup
      const result = await cleanupAllData({
        userId,
      });
      
      console.log('[useYouTubeContent] Cleanup complete:', result);
      
      return result;
    } catch (error) {
      console.error('[useYouTubeContent] Cleanup error:', error);
      throw error;
    }
  }, [cleanupAllData, userId, channel, channelIdFromJob]);

  return {
    // Channel data
    channel,
    channelLoading,
    channelError,
    fetchChannel,
    
    // Videos data
    videos,
    videosLoading,
    videosError,
    fetchVideos,
    
    // Download functionality
    downloadVideos,
    downloadProgress,
    downloadStatus,
    
    // Cleanup
    cleanup,
    
    // Rate limiting
    canFetchChannel: channelRateLimit?.canCreate ?? true,
    canFetchVideos: videosRateLimit?.canCreate ?? true,
    canDownloadVideos: downloadRateLimit?.canCreate ?? true,
    rateLimitInfo: channelRateLimit && videosRateLimit && downloadRateLimit ? {
      fetch_channel: {
        remaining: channelRateLimit.remaining,
        resetAt: channelRateLimit.resetAt,
      },
      fetch_videos: {
        remaining: videosRateLimit.remaining,
        resetAt: videosRateLimit.resetAt,
      },
      download_videos: {
        remaining: downloadRateLimit.remaining,
        resetAt: downloadRateLimit.resetAt,
      },
    } : null,
  };
}