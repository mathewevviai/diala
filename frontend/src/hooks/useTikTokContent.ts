import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';

interface TikTokUser {
  username: string;
  userId: string;
  secUid: string;
  nickname?: string;
  avatar?: string;
  signature?: string;
  verified?: boolean;
  followerCount?: number;
  followingCount?: number;
  videoCount?: number;
  heartCount?: number;
  privateAccount?: boolean;
}

interface TikTokVideo {
  videoId: string;
  username: string;
  title: string;
  thumbnail?: string;
  dynamicCover?: string;
  duration: number;
  createTime: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  playAddr?: string;
  downloadAddr?: string;
  musicTitle?: string;
  musicAuthor?: string;
  url?: string; // Direct video URL for preview
}
interface UseTikTokContentReturn {
  // User data
  user: TikTokUser | null;
  userLoading: boolean;
  userError: string | null;
  userDataComplete: boolean;
  fetchUser: (username: string) => Promise<void>;
  
  // Videos data
  videos: TikTokVideo[];
  videosLoading: boolean;
  videosError: string | null;
  fetchVideos: (username: string) => Promise<void>;
  
  // Download functionality
  downloadVideos: (videoIds: string[]) => Promise<void>;
  downloadProgress: number;
  downloadStatus: string | null;
  
  // Cleanup
  cleanup: () => Promise<any>;
  
  // Rate limiting
  canFetchUser: boolean;
  canFetchVideos: boolean;
  canDownloadVideos: boolean;
  rateLimitInfo: {
    fetch_user: { remaining: number; resetAt: number };
    fetch_videos: { remaining: number; resetAt: number };
    download_videos: { remaining: number; resetAt: number };
  } | null;
}

export function useTikTokContent(initialUsername?: string): UseTikTokContentReturn {
  const [user, setUser] = useState<TikTokUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [waitingForCache, setWaitingForCache] = useState(false);
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());
  const [usernameFromJob, setUsernameFromJob] = useState<string | null>(null);
  
  // Get current user ID (in production, get from auth)
  const userId = 'user123'; // TODO: Get from auth context
  
  // Convex mutations
  const createUserFetchJob = useMutation(api.mutations.tiktokContent.createUserFetchJob);
  const createVideosFetchJob = useMutation(api.mutations.tiktokContent.createVideosFetchJob);
  const createDownloadJob = useMutation(api.mutations.tiktokContent.createDownloadJob);
  const cleanupUserData = useMutation(api.mutations.tiktokContent.cleanupUserData);
  const cleanupAllData = useMutation(api.mutations.tiktokContent.cleanupAllData);
  
  // Track if we've already attempted to fetch videos for this user
  const fetchedUsernamesRef = React.useRef<Set<string>>(new Set());
  
  // Keep track of retry attempts for videos and refresh trigger
  const [cacheRetryCount, setCacheRetryCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Check cached data - use either the username from state or from completed job
  const queryUsername = user?.username || usernameFromJob;
  
  const cachedUser = useQuery(
    api.queries.tiktokContent.getCachedUser,
    queryUsername && !userLoading ? { username: queryUsername } : 'skip'
  );
  
  const cachedVideos = useQuery(
    api.queries.tiktokContent.getCachedVideos,
    queryUsername ? { username: queryUsername, refreshTrigger } : 'skip'
  );
  
  // Check rate limits
  const userRateLimit = useQuery(
    api.queries.tiktokContent.checkRateLimit,
    { userId, action: 'fetch_user' }
  );
  
  const videosRateLimit = useQuery(
    api.queries.tiktokContent.checkRateLimit,
    { userId, action: 'fetch_videos' }
  );
  
  const downloadRateLimit = useQuery(
    api.queries.tiktokContent.checkRateLimit,
    { userId, action: 'download_videos' }
  );
  
  // Monitor active jobs
  const userJobs = useQuery(
    api.queries.tiktokContent.getUserJobs,
    { userId, limit: 10 }
  );
  
  // Load cached data
  useEffect(() => {
    // Don't load cached data while actively fetching new user
    if (cachedUser && !userLoading) {
      if (cachedUser.user && !cachedUser.isStale) {
        setUser(cachedUser.user);
      }
    }
  }, [cachedUser, userLoading, queryUsername]);
  
  useEffect(() => {
    // Don't load cached data while actively fetching new videos
    if (!videosLoading) {
      if (!cachedVideos) {
        // If we have a username and we're not already retrying, start retry logic
        if (queryUsername && cacheRetryCount < 3) {
          setWaitingForCache(true);
          setTimeout(() => {
            setCacheRetryCount(prev => prev + 1);
          }, 500);
        } else if (cacheRetryCount >= 3) {
          // Stop waiting after max retries
          setWaitingForCache(false);
        }
      } else if (cachedVideos.videos) {
        if (cachedVideos.videos.length > 0) {
          setVideos(cachedVideos.videos);
          setCacheRetryCount(0); // Reset retry count on success
          setWaitingForCache(false); // Stop waiting
        } else if (cacheRetryCount < 3 && queryUsername) {
          // Retry after a delay
          setTimeout(() => {
            setCacheRetryCount(prev => prev + 1);
          }, 500);
        }
      }
    }
  }, [cachedVideos, videosLoading, queryUsername, cacheRetryCount]);  
  // Monitor job statuses
  useEffect(() => {
    if (!userJobs) return;
    
    userJobs.forEach(job => {
      if (activeJobs.has(job.jobId)) {
        console.log('[useTikTokContent] Job status update:', {
          jobId: job.jobId,
          action: job.action,
          status: job.status,
          error: job.error,
        });
        
        if (job.status === 'completed') {
          activeJobs.delete(job.jobId);
          setActiveJobs(new Set(activeJobs));
          
          // Update local state based on job type
          if (job.action === 'fetch_user') {
            console.log('[useTikTokContent] User fetch completed');
            console.log('[useTikTokContent] Job result:', job.result);
            console.log('[useTikTokContent] User info from job:', job.result?.userInfo);
            setUserLoading(false);
            setUserError(null);
            // Store the username from the completed job
            if (job.username) {
              let cleanUsername = job.username;
              // Extract username from URL if needed
              if (cleanUsername.startsWith('http')) {
                const match = cleanUsername.match(/tiktok\.com\/@?([^/?]+)/);
                if (match) {
                  cleanUsername = match[1];
                }
              }
              console.log('[useTikTokContent] Setting username from job:', job.username, '-> cleaned:', cleanUsername);
              setUsernameFromJob(cleanUsername);
            }
            // User data will be loaded via cachedUser query
          } else if (job.action === 'fetch_videos') {
            console.log('[useTikTokContent] Videos fetch completed');
            setVideosError(null);
            // Reset cache retry count to trigger fresh retries
            setCacheRetryCount(0);
            // Add a small delay before marking loading as false to ensure Convex has processed the webhook
            setTimeout(() => {
              console.log('[useTikTokContent] Marking videos loading as false after delay');
              setVideosLoading(false);
              // Force query refresh
              setRefreshTrigger(prev => prev + 1);
            }, 500);
          } else if (job.action === 'download_videos') {
            setDownloadProgress(100);
            setDownloadStatus('completed');
          }
        } else if (job.status === 'failed') {
          activeJobs.delete(job.jobId);
          setActiveJobs(new Set(activeJobs));
          
          const error = job.error || 'Operation failed';
          if (job.action === 'fetch_user') {
            setUserLoading(false);
            setUserError(error);
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
  
  const fetchUser = useCallback(async (username: string) => {
    try {
      // Reset all state when fetching a new user
      setUser(null);
      setUsernameFromJob(null);
      setVideos([]);
      setUserLoading(false);
      setUserError(null);
      
      setUserLoading(true);
      setUserError(null);
      
      // Clean username - handle URLs
      let cleanUsername = username.replace('@', '');
      if (cleanUsername.startsWith('http')) {
        // Extract username from URL like https://www.tiktok.com/@username
        const match = cleanUsername.match(/tiktok\.com\/(@)?([^/?]+)/);
        if (match) {
          cleanUsername = match[2];
        }
      }
      
      // Use the test endpoint for direct user info fetch
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/test/${cleanUsername}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.detail || 'Failed to fetch user');
      }

      const userData = await userResponse.json();

      // Extract user info
      const userInfo = {
        username: cleanUsername,
        userId: userData.userId || '',
        secUid: userData.secUid || '',
        nickname: userData.nickname || cleanUsername,
        avatar: userData.avatar || '',
        signature: userData.signature || '',
        verified: userData.verified || false,
        followerCount: userData.followerCount || 0,
        followingCount: userData.followingCount || 0,
        videoCount: userData.videoCount || 0,
        heartCount: userData.heartCount || 0,
        privateAccount: userData.privateAccount || false,
      };

      // The backend returns videos with proper URLs in playAddr field
      const videos = userData.videos?.map((video: any) => ({
        videoId: video.videoId || video.id,
        username: cleanUsername,
        title: video.title || '',
        thumbnail: video.thumbnail || '',
        duration: video.duration || 0,
        createTime: video.createTime || 0,
        views: video.stats?.views || 0,
        likes: video.stats?.likes || 0,
        comments: video.stats?.comments || 0,
        shares: video.stats?.shares || 0,
        saves: video.stats?.saves || 0,
        playAddr: video.playAddr || '',
        downloadAddr: video.downloadAddr || '',
        musicTitle: video.music?.title || '',
        musicAuthor: video.music?.author || '',
        url: video.playAddr || video.downloadAddr || '', // Use playAddr as the main URL
      })) || [];

      setUser(userInfo);
      setVideos(videos);
      setUserLoading(false);
      setVideosLoading(false);
    } catch (error) {
      console.error('Error fetching TikTok user:', error);
      setUserError(error instanceof Error ? error.message : 'Unknown error');
      setUserLoading(false);
      setVideosLoading(false);
    }
  }, [createUserFetchJob, createVideosFetchJob, userId]);

  const downloadVideos = useCallback(async (videoIds: string[]) => {
    try {
      setDownloadProgress(0);
      setDownloadStatus('starting');
      
      // Create job
      const jobId = uuidv4();
      const username = videos[0]?.username || '';
      
      await createDownloadJob({
        jobId,
        userId,
        username,
        videoIds,
      });
      
      // Add to active jobs
      activeJobs.add(jobId);
      setActiveJobs(new Set(activeJobs));
      
      // Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          video_ids: videoIds,
          user_id: userId,
          username,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to download videos');
      }
      
      setDownloadStatus('downloading');
      
    } catch (error) {
      console.error('Error downloading TikTok videos:', error);
      setDownloadStatus('failed');
    }
  }, [createDownloadJob, userId, videos, activeJobs]);
  
  // Check if user data is complete (has all essential fields)
  const userDataComplete = React.useMemo(() => {
    if (!user) return false;
    
    // Check for essential fields that should be present in complete data
    // Note: yt-dlp doesn't provide followerCount/videoCount reliably, so we just check for username
    // Avatar might be empty string from backend, so we just check if username exists
    return !!(user.username);
  }, [user]);
  
  // Auto-fetch TikTok videos when user is loaded
  useEffect(() => {
    // Videos are now loaded automatically with user data via fetchUser
    // No need for separate fetchVideos call
  }, [user, userDataComplete, videosLoading, videos.length]);

  // Placeholder fetchVideos function for interface compatibility
  const fetchVideos = useCallback(async (username: string, limit: number = 12) => {
    // Videos are already loaded with user data
    console.log('Videos are loaded automatically with user data');
  }, []);
  // Cleanup function to reset all data
  const cleanup = useCallback(async () => {
    try {
      console.log('[useTikTokContent] Cleaning up data for user:', userId, 'username:', user?.username || usernameFromJob);
      
      // Clear local state
      setUser(null);
      setUsernameFromJob(null);
      setVideos([]);
      setUserLoading(false);
      setVideosLoading(false);
      setWaitingForCache(false);
      setUserError(null);
      setVideosError(null);
      setDownloadProgress(0);
      setDownloadStatus(null);
      setActiveJobs(new Set());
      setCacheRetryCount(0);
      fetchedUsernamesRef.current.clear();
      
      // Call Convex cleanup mutation - use cleanupAllData for more thorough cleanup
      const result = await cleanupAllData({
        userId,
      });
      
      console.log('[useTikTokContent] Cleanup complete:', result);
      
      return result;
    } catch (error) {
      console.error('[useTikTokContent] Cleanup error:', error);
      throw error;
    }
  }, [cleanupAllData, userId]);
  
  return {
    // User data
    user,
    userLoading,
    userError,
    userDataComplete,
    fetchUser,
    
    // Videos data
    videos,
    videosLoading: videosLoading || waitingForCache,
    videosError,
    fetchVideos,
    
    // Download functionality
    downloadVideos,
    downloadProgress,
    downloadStatus,
    
    // Cleanup
    cleanup,
    
    // Rate limiting
    canFetchUser: userRateLimit?.canCreate ?? true,
    canFetchVideos: videosRateLimit?.canCreate ?? true,
    canDownloadVideos: downloadRateLimit?.canCreate ?? true,
    rateLimitInfo: userRateLimit && videosRateLimit && downloadRateLimit ? {
      fetch_user: {
        remaining: userRateLimit.remaining,
        resetAt: userRateLimit.resetAt,
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