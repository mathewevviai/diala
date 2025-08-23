import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';

interface InstagramUser {
  username: string;
  userId: string;
  fullName?: string;
  biography?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  externalUrl?: string;
}

interface InstagramPost {
  postId: string;
  username: string;
  caption?: string;
  mediaType: string; // 'image', 'video', 'carousel'
  thumbnail?: string;
  mediaUrl?: string;
  likeCount: number;
  commentCount: number;
  timestamp: number;
  location?: string;
  isVideo: boolean;
  videoDuration?: number;
  carouselMediaCount?: number;
}

interface UseInstagramContentReturn {
  // User data
  user: InstagramUser | null;
  userLoading: boolean;
  userError: string | null;
  userDataComplete: boolean;
  fetchUser: (username: string) => Promise<void>;
  
  // Posts data
  posts: InstagramPost[];
  postsLoading: boolean;
  postsError: string | null;
  fetchPosts: (username: string, count?: number) => Promise<void>;
  
  // Download functionality
  downloadPosts: (postIds: string[]) => Promise<void>;
  downloadProgress: number;
  downloadStatus: string | null;
  
  // Cleanup
  cleanup: () => Promise<void>;
  
  // Rate limiting
  canFetchUser: boolean;
  canFetchPosts: boolean;
  canDownloadPosts: boolean;
  rateLimitInfo: {
    fetch_user: { remaining: number; resetAt: number };
    fetch_posts: { remaining: number; resetAt: number };
    download_posts: { remaining: number; resetAt: number };
  } | null;
}

export function useInstagramContent(): UseInstagramContentReturn {
  const [user, setUser] = useState<InstagramUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [usernameFromJob, setUsernameFromJob] = useState<string | null>(null);
  
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  
  const [activeJobs, setActiveJobs] = useState<{
    user?: string;
    posts?: string;
    download?: string;
  }>({});
  
  // Get current user ID (in production, get from auth)
  const userId = 'user123'; // TODO: Get from auth context
  
  // Convex actions for API calls
  const createUserFetchJob = useAction(api.actions.instagramContent.createUserFetchJob);
  const createPostsFetchJob = useAction(api.actions.instagramContent.createPostsFetchJob);
  const createDownloadJob = useAction(api.actions.instagramContent.createDownloadJob);
  
  // Convex mutations for database operations
  const cleanupMutation = useMutation(api.mutations.instagramContent.cleanup);
  
  // Track if we've already attempted to fetch posts for this user
  const fetchedUsernamesRef = React.useRef<Set<string>>(new Set());
  
  // Check cached data
  const queryUsername = user?.username || usernameFromJob;
  
  const cachedUser = useQuery(
    api.queries.instagramContent.getCachedUser,
    queryUsername ? { username: queryUsername } : 'skip'
  );
  
  const cachedPosts = useQuery(
    api.queries.instagramContent.getCachedPosts,
    queryUsername ? { username: queryUsername } : 'skip'
  );
  
  // Query active jobs
  const userJob = useQuery(
    api.queries.instagramContent.getJob,
    activeJobs.user ? { jobId: activeJobs.user } : 'skip'
  );
  
  const postsJob = useQuery(
    api.queries.instagramContent.getJob,
    activeJobs.posts ? { jobId: activeJobs.posts } : 'skip'
  );
  
  const downloadJob = useQuery(
    api.queries.instagramContent.getJob,
    activeJobs.download ? { jobId: activeJobs.download } : 'skip'
  );
  
  // Check rate limits
  const userRateLimit = useQuery(
    api.queries.instagramContent.checkRateLimit,
    { userId, action: 'fetch_user' }
  );
  
  const postsRateLimit = useQuery(
    api.queries.instagramContent.checkRateLimit,
    { userId, action: 'fetch_posts' }
  );
  
  const downloadRateLimit = useQuery(
    api.queries.instagramContent.checkRateLimit,
    { userId, action: 'download_posts' }
  );
  
  // Update user from cache
  useEffect(() => {
    if (cachedUser && !userLoading) {
      console.log('[Instagram] Setting user from cache:', cachedUser);
      setUser(cachedUser.user);
      setUserError(null);
    }
  }, [cachedUser, userLoading]);
  
  // Update posts from cache
  useEffect(() => {
    if (cachedPosts && !postsLoading) {
      console.log('[Instagram] Setting posts from cache:', cachedPosts.posts?.length || 0, 'posts');
      setPosts(cachedPosts.posts || []);
      setPostsError(null);
    }
  }, [cachedPosts, postsLoading]);
  
  // Handle user job updates
  useEffect(() => {
    if (userJob) {
      console.log('[Instagram] User job update:', userJob.status);
      
      if (userJob.status === 'completed') {
        setUserLoading(false);
        setUserError(null);
        
        // Store username for post queries
        if (userJob.username) {
          let cleanUsername = userJob.username;
          // Extract username from URL if needed
          if (cleanUsername.includes('instagram.com')) {
            const match = cleanUsername.match(/instagram\.com\/([^/?]+)/);
            if (match) {
              cleanUsername = match[1];
            }
          }
          console.log('[Instagram] Setting username from job:', cleanUsername);
          setUsernameFromJob(cleanUsername);
        }
        
        // Remove job from active jobs
        setActiveJobs(prev => ({
          ...prev,
          user: undefined
        }));
      } else if (userJob.status === 'failed') {
        setUserLoading(false);
        setUserError(userJob.error || 'Failed to fetch user');
        setActiveJobs(prev => ({
          ...prev,
          user: undefined
        }));
      }
    }
  }, [userJob]);
  
  // Handle posts job updates
  useEffect(() => {
    if (postsJob) {
      console.log('[Instagram] Posts job update:', postsJob.status);
      
      if (postsJob.status === 'completed') {
        setPostsLoading(false);
        setPostsError(null);
        
        // Remove job from active jobs
        setActiveJobs(prev => ({
          ...prev,
          posts: undefined
        }));
      } else if (postsJob.status === 'failed') {
        setPostsLoading(false);
        setPostsError(postsJob.error || 'Failed to fetch posts');
        setActiveJobs(prev => ({
          ...prev,
          posts: undefined
        }));
      }
    }
  }, [postsJob]);
  
  // Handle download job updates
  useEffect(() => {
    if (downloadJob) {
      console.log('[Instagram] Download job update:', downloadJob.status);
      
      if (downloadJob.status === 'downloading' && downloadJob.progress !== undefined) {
        setDownloadProgress(downloadJob.progress);
        setDownloadStatus(`Downloading posts: ${downloadJob.progress}%`);
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
  
  // Fetch user function
  const fetchUser = useCallback(async (username: string) => {
    try {
      console.log('[Instagram] Fetching user:', username);
      setUserLoading(true);
      setUserError(null);
      
      // Clean username - handle URLs
      let cleanUsername = username.replace('@', '');
      if (cleanUsername.includes('instagram.com')) {
        // Extract username from URL
        const match = cleanUsername.match(/instagram\.com\/([^/?]+)/);
        if (match) {
          cleanUsername = match[1];
        }
      }
      
      // Create job
      const jobId = uuidv4();
      const result = await createUserFetchJob({
        jobId,
        username: cleanUsername,
        userId
      });
      
      console.log('[Instagram] Created user fetch job:', jobId, result);
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        user: jobId
      }));
      
    } catch (error) {
      console.error('[Instagram] Error fetching user:', error);
      setUserError(error instanceof Error ? error.message : 'Failed to fetch user');
      setUserLoading(false);
    }
  }, [createUserFetchJob, userId]);
  
  // Fetch posts function
  const fetchPosts = useCallback(async (username: string, count: number = 12) => {
    try {
      console.log('[Instagram] Fetching posts for user:', username);
      setPostsLoading(true);
      setPostsError(null);
      
      // Clean username
      let cleanUsername = username.replace('@', '');
      if (cleanUsername.includes('instagram.com')) {
        const match = cleanUsername.match(/instagram\.com\/([^/?]+)/);
        if (match) {
          cleanUsername = match[1];
        }
      }
      
      // Create job
      const jobId = uuidv4();
      const result = await createPostsFetchJob({
        jobId,
        username: cleanUsername,
        userId,
        count
      });
      
      console.log('[Instagram] Created posts fetch job:', jobId, result);
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        posts: jobId
      }));
      
    } catch (error) {
      console.error('[Instagram] Error fetching posts:', error);
      setPostsError(error instanceof Error ? error.message : 'Failed to fetch posts');
      setPostsLoading(false);
    }
  }, [createPostsFetchJob, userId]);
  
  // Download posts function
  const downloadPosts = useCallback(async (postIds: string[]) => {
    try {
      console.log('[Instagram] Downloading posts:', postIds.length, 'posts');
      setDownloadProgress(0);
      setDownloadStatus('Starting download...');
      
      // Create job
      const jobId = uuidv4();
      const username = posts[0]?.username || user?.username || '';
      
      const result = await createDownloadJob({
        jobId,
        postIds,
        userId,
        username
      });
      
      console.log('[Instagram] Created download job:', jobId, result);
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        download: jobId
      }));
      
    } catch (error) {
      console.error('[Instagram] Error downloading posts:', error);
      setDownloadStatus(error instanceof Error ? error.message : 'Failed to download posts');
    }
  }, [createDownloadJob, userId, posts, user]);
  
  // Check if user data is complete
  const userDataComplete = React.useMemo(() => {
    if (!user) return false;
    return !!(user.username);
  }, [user]);
  
  // Auto-fetch Instagram posts when user is loaded
  useEffect(() => {
    console.log('[Instagram] Auto-fetch check:', {
      hasUser: !!user,
      userDataComplete,
      postsLoading,
      postsLength: posts.length,
      username: user?.username
    });
    
    if (user && userDataComplete && !postsLoading) {
      const username = user.username;
      
      // Only fetch if we haven't already fetched for this user
      if (!fetchedUsernamesRef.current.has(username) && posts.length === 0) {
        console.log('[Instagram] Auto-fetching posts for user:', username);
        fetchedUsernamesRef.current.add(username);
        fetchPosts(username);
      }
    }
  }, [user, userDataComplete, postsLoading, posts.length, fetchPosts]);
  
  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      const username = user?.username || usernameFromJob;
      console.log('[Instagram] Cleaning up data for user:', userId, 'username:', username);
      
      // Call cleanup mutation with username if available
      const result = await cleanupMutation({ 
        userId,
        username: username || undefined
      });
      
      console.log('[Instagram] Cleanup result:', result);
      
      // Reset state
      setUser(null);
      setPosts([]);
      setUserLoading(false);
      setPostsLoading(false);
      setUserError(null);
      setPostsError(null);
      setDownloadProgress(0);
      setDownloadStatus(null);
      setActiveJobs({});
      setUsernameFromJob(null);
      fetchedUsernamesRef.current.clear();
      
      console.log('[Instagram] Cleanup completed');
    } catch (error) {
      console.error('[Instagram] Error during cleanup:', error);
    }
  }, [cleanupMutation, userId, user, usernameFromJob]);
  
  return {
    // User data
    user,
    userLoading,
    userError,
    userDataComplete,
    fetchUser,
    
    // Posts data
    posts,
    postsLoading,
    postsError,
    fetchPosts,
    
    // Download functionality
    downloadPosts,
    downloadProgress,
    downloadStatus,
    
    // Cleanup
    cleanup,
    
    // Rate limiting
    canFetchUser: userRateLimit?.canCreate ?? true,
    canFetchPosts: postsRateLimit?.canCreate ?? true,
    canDownloadPosts: downloadRateLimit?.canCreate ?? true,
    rateLimitInfo: userRateLimit && postsRateLimit && downloadRateLimit ? {
      fetch_user: {
        remaining: userRateLimit.remaining,
        resetAt: userRateLimit.resetAt,
      },
      fetch_posts: {
        remaining: postsRateLimit.remaining,
        resetAt: postsRateLimit.resetAt,
      },
      download_posts: {
        remaining: downloadRateLimit.remaining,
        resetAt: downloadRateLimit.resetAt,
      },
    } : null,
  };
}