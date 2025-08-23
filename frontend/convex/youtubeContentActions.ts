import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// Backend API configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Initialize rate limiter
const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Channel fetch: 20 per hour per user
  channelFetch: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
  // Videos fetch: 10 per hour per user
  videosFetch: { kind: "token bucket", rate: 10, period: HOUR, capacity: 3 },
  // Download: 5 per hour per user
  videosDownload: { kind: "token bucket", rate: 5, period: HOUR, capacity: 2 },
});

// Extract channel ID from various YouTube URL formats
function extractChannelInfo(url: string): { identifier: string; type: string } | null {
  const patterns = [
    { regex: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, type: 'channel_id' },
    { regex: /youtube\.com\/@([a-zA-Z0-9_-]+)/, type: 'handle' },
    { regex: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/, type: 'user' },
    { regex: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/, type: 'custom' },
  ];
  
  for (const { regex, type } of patterns) {
    const match = url.match(regex);
    if (match) {
      return { identifier: match[1], type };
    }
  }
  
  // Try as direct input
  if (url.startsWith('@')) {
    return { identifier: url.substring(1), type: 'handle' };
  } else if (url.startsWith('UC') && url.length === 24) {
    return { identifier: url, type: 'channel_id' };
  }
  
  return { identifier: url, type: 'unknown' };
}

export const fetchYouTubeChannel = action({
  args: {
    channelUrl: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    try {
      await rateLimiter.limit(ctx, "channelFetch", { 
        key: args.userId, 
        throws: true 
      });
    } catch (error) {
      throw new Error("Rate limit exceeded. You can fetch up to 20 channels per hour.");
    }
    
    // Extract channel info
    const channelInfo = extractChannelInfo(args.channelUrl);
    if (!channelInfo) {
      throw new Error("Invalid YouTube channel URL");
    }
    
    // Check if channel already exists and is fresh
    let existingChannel;
    if (channelInfo.type === 'channel_id') {
      existingChannel = await ctx.runQuery(
        internal.queries.youtubeContent.getCachedChannel, 
        { channelId: channelInfo.identifier }
      );
    } else if (channelInfo.type === 'handle') {
      existingChannel = await ctx.runQuery(
        internal.queries.youtubeContent.getCachedChannel, 
        { channelHandle: channelInfo.identifier }
      );
    }
    
    if (existingChannel && !existingChannel.isStale) {
      return {
        jobId: `cached-${existingChannel.channel.channelId}`,
        status: "completed",
        channel: existingChannel.channel,
        cached: true,
      };
    }
    
    // Create a new job
    const jobId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await ctx.runMutation(internal.mutations.youtubeContent.createChannelFetchJob, {
      jobId,
      userId: args.userId,
      channelUrl: args.channelUrl,
    });
    
    // Call Python backend to fetch channel
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/youtube/channel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobId,
          channel_url: args.channelUrl,
          user_id: args.userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start channel fetch");
      }
      
      return {
        jobId,
        status: "processing",
        cached: false,
      };
    } catch (error) {
      // Update job status to failed
      await ctx.runMutation(internal.mutations.youtubeContent.jobWebhook, {
        jobId,
        status: "failed",
        error: error.message || "Failed to fetch channel",
      });
      
      throw new Error("Failed to fetch channel: " + error.message);
    }
  },
});

export const fetchYouTubeVideos = action({
  args: {
    channelId: v.string(),
    userId: v.string(),
    count: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    try {
      await rateLimiter.limit(ctx, "videosFetch", { 
        key: args.userId, 
        throws: true 
      });
    } catch (error) {
      throw new Error("Rate limit exceeded. You can fetch videos up to 10 times per hour.");
    }
    
    // Check if videos already exist and are fresh
    const existingVideos = await ctx.runQuery(
      internal.queries.youtubeContent.getCachedVideos, 
      { 
        channelId: args.channelId,
        limit: args.count,
      }
    );
    
    if (existingVideos && !existingVideos.isStale) {
      return {
        jobId: `cached-${args.channelId}`,
        status: "completed",
        videos: existingVideos.videos,
        cached: true,
      };
    }
    
    // Create a new job
    const jobId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await ctx.runMutation(internal.mutations.youtubeContent.createVideosFetchJob, {
      jobId,
      userId: args.userId,
      channelId: args.channelId,
      count: args.count,
      sortBy: args.sortBy,
    });
    
    // Call Python backend to fetch videos
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/youtube/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobId,
          channel_id: args.channelId,
          user_id: args.userId,
          count: args.count || 30,
          sort_by: args.sortBy || "newest",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start videos fetch");
      }
      
      return {
        jobId,
        status: "processing",
        cached: false,
      };
    } catch (error) {
      // Update job status to failed
      await ctx.runMutation(internal.mutations.youtubeContent.jobWebhook, {
        jobId,
        status: "failed",
        error: error.message || "Failed to fetch videos",
      });
      
      throw new Error("Failed to fetch videos: " + error.message);
    }
  },
});

export const downloadYouTubeVideos = action({
  args: {
    videoIds: v.array(v.string()),
    channelId: v.string(),
    channelName: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    try {
      await rateLimiter.limit(ctx, "videosDownload", { 
        key: args.userId, 
        throws: true 
      });
    } catch (error) {
      throw new Error("Rate limit exceeded. You can download videos up to 5 times per hour.");
    }
    
    // Validate video count
    if (args.videoIds.length > 20) {
      throw new Error("Maximum 20 videos can be downloaded at once");
    }
    
    // Create a new job
    const jobId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await ctx.runMutation(internal.mutations.youtubeContent.createDownloadJob, {
      jobId,
      userId: args.userId,
      channelId: args.channelId,
      channelName: args.channelName,
      videoIds: args.videoIds,
    });
    
    // Call Python backend to download videos
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/youtube/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobId,
          video_ids: args.videoIds,
          user_id: args.userId,
          channel_name: args.channelName,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start video download");
      }
      
      return {
        jobId,
        status: "processing",
      };
    } catch (error) {
      // Update job status to failed
      await ctx.runMutation(internal.mutations.youtubeContent.jobWebhook, {
        jobId,
        status: "failed",
        error: error.message || "Failed to download videos",
      });
      
      throw new Error("Failed to download videos: " + error.message);
    }
  },
});

export const getJobStatus = action({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    // Handle cached job IDs
    if (args.jobId.startsWith("cached-")) {
      const channelId = args.jobId.replace("cached-", "");
      
      // Try to get channel data
      const channel = await ctx.runQuery(
        internal.queries.youtubeContent.getCachedChannel,
        { channelId }
      );
      
      if (channel) {
        return {
          status: "completed",
          channel: channel.channel,
        };
      }
      
      // Try to get videos data
      const videos = await ctx.runQuery(
        internal.queries.youtubeContent.getCachedVideos,
        { channelId }
      );
      
      if (videos) {
        return {
          status: "completed",
          videos: videos.videos,
        };
      }
    }
    
    // Get job from database
    const job = await ctx.runQuery(internal.queries.youtubeContent.getJob, {
      jobId: args.jobId,
    });
    
    if (!job) {
      throw new Error("Job not found");
    }
    
    if (job.status === "completed") {
      // Get the results based on job action
      if (job.action === "fetch_channel" && job.channelId) {
        const channel = await ctx.runQuery(
          internal.queries.youtubeContent.getCachedChannel,
          { channelId: job.channelId }
        );
        
        return {
          status: job.status,
          channel: channel?.channel,
        };
      } else if (job.action === "fetch_videos" && job.channelId) {
        const videos = await ctx.runQuery(
          internal.queries.youtubeContent.getCachedVideos,
          { channelId: job.channelId }
        );
        
        return {
          status: job.status,
          videos: videos?.videos,
        };
      } else if (job.action === "download_videos") {
        const downloadStatus = await ctx.runQuery(
          internal.queries.youtubeContent.getVideoDownloadStatus,
          { videoIds: job.videoIds || [] }
        );
        
        return {
          status: job.status,
          downloadStatus,
          totalVideos: job.totalVideos,
          completedVideos: job.completedVideos,
        };
      }
    }
    
    return {
      status: job.status,
      error: job.error,
      progress: job.progress,
    };
  },
});