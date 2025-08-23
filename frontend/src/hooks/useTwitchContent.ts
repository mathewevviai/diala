import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';

interface TwitchChannel {
  username: string;
  displayName: string;
  profileImage: string;
  bio?: string;
  isVerified: boolean;
  isPartner: boolean;
  followerCount: number;
  videoCount: number;
  isLive: boolean;
  channelUrl: string;
}

interface TwitchVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  viewCount: number;
  createdAt: number;
  url: string;
  type: string; // 'vod', 'clip', 'highlight'
  game?: string;
  language?: string;
  description?: string;
}

interface UseTwitchContentReturn {
  // Channel data
  channel: TwitchChannel | null;
  channelLoading: boolean;
  channelError: string | null;
  channelDataComplete: boolean;
  fetchChannel: (channelUrl: string) => Promise<void>;
  
  // Videos data
  videos: TwitchVideo[];
  videosLoading: boolean;
  videosError: string | null;
  fetchVideos: (channelName: string, count?: number, videoType?: string) => Promise<void>;
  
  // Download functionality
  downloadVideos: (videoIds: string[], channelName: string) => Promise<void>;
  downloadProgress: number;
  downloadStatus: string | null;
  
  // Cleanup
  cleanup: () => Promise<void>;
  
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

export function useTwitchContent(): UseTwitchContentReturn {
  const [channel, setChannel] = useState<TwitchChannel | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [channelDataComplete, setChannelDataComplete] = useState(false);
  
  const [videos, setVideos] = useState<TwitchVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  
  const [activeJobs, setActiveJobs] = useState<{
    channel?: string;
    videos?: string; 
    download?: string;
  }>({});
  const [channelUsernameFromJob, setChannelUsernameFromJob] = useState<string | null>(null);
  
  // Get current user ID (in production, get from auth)
  const userId = 'user123'; // TODO: Get from auth context
  
  // Convex actions for API calls
  const createChannelFetchJob = useAction(api.actions.twitchContent.createChannelFetchJob);
  const createVideosFetchJob = useAction(api.actions.twitchContent.createVideosFetchJob);
  const createDownloadJob = useAction(api.actions.twitchContent.createDownloadJob);
  
  // Convex mutations for database operations
  const cleanupMutation = useMutation(api.mutations.twitchContent.cleanup);
  
  // Check cached data
  const queryChannelUsername = channel?.username || channelUsernameFromJob;  
  // Query cached data
  const cachedChannel = useQuery(
    api.queries.twitchContent.getChannel,
    queryChannelUsername ? { username: queryChannelUsername } : 'skip'
  );
  
  const cachedVideos = useQuery(
    api.queries.twitchContent.getVideos,
    queryChannelUsername ? { channelUsername: queryChannelUsername } : 'skip'
  );
  
  // Query active jobs
  const channelJob = useQuery(
    api.queries.twitchContent.getJob,
    activeJobs.channel ? { jobId: activeJobs.channel } : 'skip'
  );
  
  const videosJob = useQuery(
    api.queries.twitchContent.getJob,
    activeJobs.videos ? { jobId: activeJobs.videos } : 'skip'
  );
  
  const downloadJob = useQuery(
    api.queries.twitchContent.getJob,
    activeJobs.download ? { jobId: activeJobs.download } : 'skip'
  );
  
  // Query rate limit info
  const rateLimitInfo = useQuery(api.queries.twitchContent.getRateLimitInfo, { userId });
  
  // Update channel from cache
  useEffect(() => {
    if (cachedChannel && !channelLoading) {
      setChannel(cachedChannel);
      setChannelDataComplete(true);
      setChannelError(null);
    }
  }, [cachedChannel, channelLoading]);
  
  // Update videos from cache
  useEffect(() => {
    if (cachedVideos && !videosLoading) {
      setVideos(cachedVideos);
      setVideosError(null);
    }
  }, [cachedVideos, videosLoading]);
  
  // Handle channel job updates
  useEffect(() => {
    if (channelJob) {
      if (channelJob.status === 'completed' && channelJob.result?.channelData) {
        setChannel(channelJob.result.channelData);
        setChannelDataComplete(true);
        setChannelLoading(false);
        setChannelError(null);
        
        // Store username for video queries
        const username = channelJob.result.channelData.username;
        if (username) {
          setChannelUsernameFromJob(username);
        }
        
        // Remove job from active jobs
        setActiveJobs(prev => ({
          ...prev,
          channel: undefined
        }));
      } else if (channelJob.status === 'failed') {
        setChannelLoading(false);
        setChannelError(channelJob.error || 'Failed to fetch channel');
        setActiveJobs(prev => ({
          ...prev,
          channel: undefined
        }));
      }
    }
  }, [channelJob]);
  
  // Handle videos job updates
  useEffect(() => {
    if (videosJob) {
      if (videosJob.status === 'completed') {
        // Videos are stored in the cache, not in the job result
        // The cache will be updated by the webhook, so we just need to stop loading
        setVideosLoading(false);
        setVideosError(null);
        
        // Remove job from active jobs
        setActiveJobs(prev => ({
          ...prev,
          videos: undefined
        }));
      } else if (videosJob.status === 'failed') {
        setVideosLoading(false);
        setVideosError(videosJob.error || 'Failed to fetch videos');
        setActiveJobs(prev => ({
          ...prev,
          videos: undefined
        }));
      }
    }
  }, [videosJob]);
  
  // Handle download job updates
  useEffect(() => {
    if (downloadJob) {
      if (downloadJob.status === 'downloading' && downloadJob.progress !== undefined) {
        setDownloadProgress(downloadJob.progress);
        setDownloadStatus(`Downloading videos: ${downloadJob.progress}%`);
      } else if (downloadJob.status === 'completed') {
        setDownloadProgress(100);
        setDownloadStatus('Download completed');
        
        // Remove job from active jobs
        setActiveJobs(prev => ({
          ...prev,
          download: undefined
        }));
      } else if (downloadJob.status === 'failed') {
        setDownloadProgress(0);
        setDownloadStatus(`Download failed: ${downloadJob.error}`);
        setActiveJobs(prev => ({
          ...prev,
          download: undefined
        }));
      }
    }
  }, [downloadJob]);  
  // Fetch channel function
  const fetchChannel = useCallback(async (channelUrl: string) => {
    try {
      setChannelLoading(true);
      setChannelError(null);
      setChannelDataComplete(false);
      
      // Create job
      const jobId = uuidv4();
      const result = await createChannelFetchJob({
        jobId,
        channelUrl,
        userId
      });
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        channel: jobId
      }));
      
    } catch (error) {
      setChannelError(error instanceof Error ? error.message : 'Failed to fetch channel');
      setChannelLoading(false);
    }
  }, [createChannelFetchJob, userId]);  
  // Fetch videos function
  const fetchVideos = useCallback(async (
    channelName: string, 
    count: number = 6,
    videoType: string = 'archive'
  ) => {
    try {
      console.log('[Twitch] Fetching videos for channel:', channelName, 'type:', videoType);
      setVideosLoading(true);
      setVideosError(null);
      
      // Create job
      const jobId = uuidv4();
      const result = await createVideosFetchJob({
        jobId,
        channelName,
        userId,
        count,
        videoType
      });
      
      console.log('[Twitch] Created videos fetch job:', jobId, result);
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        videos: jobId
      }));
      
    } catch (error) {
      console.error('[Twitch] Error fetching videos:', error);
      setVideosError(error instanceof Error ? error.message : 'Failed to fetch videos');
      setVideosLoading(false);
    }
  }, [createVideosFetchJob, userId]);
  
  // Download videos function
  const downloadVideos = useCallback(async (videoIds: string[], channelName: string) => {
    try {
      console.log('[Twitch] Downloading videos:', videoIds.length, 'videos');
      setDownloadProgress(0);
      setDownloadStatus('Starting download...');
      
      // Create job
      const jobId = uuidv4();
      const result = await createDownloadJob({
        jobId,
        videoIds,
        userId,
        channelName
      });
      
      console.log('[Twitch] Created download job:', jobId, result);
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        download: jobId
      }));
      
    } catch (error) {
      console.error('[Twitch] Error downloading videos:', error);
      setDownloadStatus(error instanceof Error ? error.message : 'Failed to download videos');
    }
  }, [createDownloadJob, userId]);
  
  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      const username = channel?.username || channelUsernameFromJob;
      console.log('[Twitch] Cleaning up data for user:', userId, 'username:', username);
      
      // Call cleanup mutation with username if available
      const result = await cleanupMutation({ 
        userId,
        username: username || undefined
      });
      
      console.log('[Twitch] Cleanup result:', result);
      
      // Reset state
      setChannel(null);
      setChannelDataComplete(false);
      setVideos([]);
      setChannelError(null);
      setVideosError(null);
      setDownloadProgress(0);
      setDownloadStatus(null);
      setActiveJobs({});
      setChannelUsernameFromJob(null);
      
      console.log('[Twitch] Cleanup completed');
    } catch (error) {
      console.error('[Twitch] Error during cleanup:', error);
    }
  }, [cleanupMutation, userId, channel, channelUsernameFromJob]);
  
  // Calculate rate limit availability
  const canFetchChannel = rateLimitInfo?.fetch_channel?.remaining ? rateLimitInfo.fetch_channel.remaining > 0 : true;
  const canFetchVideos = rateLimitInfo?.fetch_videos?.remaining ? rateLimitInfo.fetch_videos.remaining > 0 : true;
  const canDownloadVideos = rateLimitInfo?.download_videos?.remaining ? rateLimitInfo.download_videos.remaining > 0 : true;
  
  return {
    // Channel data
    channel,
    channelLoading,
    channelError,
    channelDataComplete,
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
    canFetchChannel,
    canFetchVideos,
    canDownloadVideos,
    rateLimitInfo
  };
}