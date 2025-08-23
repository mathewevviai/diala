import { query } from "../_generated/server";
import { v } from "convex/values";

// Check if user can create a new job (rate limiting)
export const checkRateLimit = query({
  args: {
    userId: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    // Define rate limits
    const rateLimits: Record<string, { limit: number; window: number }> = {
      fetch_channel: { limit: 20, window: 60 * 60 * 1000 }, // 20 per hour
      fetch_videos: { limit: 10, window: 60 * 60 * 1000 }, // 10 per hour
      download_videos: { limit: 5, window: 60 * 60 * 1000 }, // 5 per hour
    };
    
    const rateLimit = rateLimits[args.action];
    if (!rateLimit) {
      return { canCreate: true, remaining: 0, resetAt: 0 };
    }
    
    // Get jobs in the current window
    const windowStart = Date.now() - rateLimit.window;
    const recentJobs = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), args.action),
          q.gte(q.field("createdAt"), windowStart)
        )
      )
      .collect();
    
    const canCreate = recentJobs.length < rateLimit.limit;
    const remaining = Math.max(0, rateLimit.limit - recentJobs.length);
    const resetAt = windowStart + rateLimit.window;
    
    return { canCreate, remaining, resetAt };
  },
});

// Get cached channel data
export const getCachedChannel = query({
  args: {
    channelId: v.optional(v.string()),
    channelHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.channelId && !args.channelHandle) {
      return null;
    }
    
    let channel;
    if (args.channelId) {
      channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
        .first();
    } else if (args.channelHandle) {
      channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_handle", (q) => q.eq("channelHandle", args.channelHandle))
        .first();
    }
    
    if (!channel) {
      return null;
    }
    
    // Check if cache is stale (older than 24 hours)
    const isStale = Date.now() - channel.cachedAt > 24 * 60 * 60 * 1000;
    
    return {
      channel,
      isStale,
    };
  },
});

// Get cached videos for a channel
export const getCachedVideos = query({
  args: {
    channelId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log('[getCachedVideos] Querying for channelId:', args.channelId);
    const limit = args.limit || 30;
    
    // First try with index (can't use order with this index)
    let videos = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .take(limit);
    
    console.log('[getCachedVideos] Found videos with index:', videos.length);
    
    // Log what we found
    if (videos.length === 0) {
      console.log('[getCachedVideos] No videos found with index query');
    }
    
    // If still no videos, try without index at all
    if (videos.length === 0) {
      console.log('[getCachedVideos] Trying without index...');
      const allVideos = await ctx.db
        .query("youtubeVideos")
        .take(100);
      
      videos = allVideos.filter(v => v.channelId === args.channelId).slice(0, limit);
      console.log('[getCachedVideos] Found videos without index:', videos.length);
      console.log('[getCachedVideos] Sample video channelIds:', allVideos.slice(0, 3).map(v => ({ 
        videoId: v.videoId,
        channelId: v.channelId,
        title: v.title 
      })));
    }
    
    if (videos.length === 0) {
      console.log('[getCachedVideos] No videos found, returning empty array');
      return {
        videos: [],
        isStale: false,
      };
    }
    
    // Check if cache is stale (older than 24 hours)
    const oldestVideo = videos[videos.length - 1];
    const isStale = Date.now() - oldestVideo.cachedAt > 24 * 60 * 60 * 1000;
    
    console.log('[getCachedVideos] Returning videos:', videos.length);
    return {
      videos,
      isStale,
    };
  },
});

// Get user's recent jobs
export const getUserJobs = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    return await ctx.db
      .query("youtubeJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get specific job by ID
export const getJob = query({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("youtubeJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

// Get download status for videos
export const getVideoDownloadStatus = query({
  args: {
    videoIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const statuses: Record<string, string> = {};
    
    for (const videoId of args.videoIds) {
      const video = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_video", (q) => q.eq("videoId", videoId))
        .first();
      
      if (video) {
        statuses[videoId] = video.downloadStatus || "pending";
      } else {
        statuses[videoId] = "not_found";
      }
    }
    
    return statuses;
  },
});

// Search videos by title or tags
export const searchVideos = query({
  args: {
    query: v.string(),
    channelId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const searchQuery = args.query.toLowerCase();
    
    let videos = await ctx.db
      .query("youtubeVideos")
      .order("desc")
      .take(100); // Get more videos to filter
    
    // Filter by channel if specified
    if (args.channelId) {
      videos = videos.filter(v => v.channelId === args.channelId);
    }
    
    // Search in title and tags
    const results = videos.filter(video => {
      const titleMatch = video.title.toLowerCase().includes(searchQuery);
      const tagsMatch = video.tags?.some(tag => 
        tag.toLowerCase().includes(searchQuery)
      );
      return titleMatch || tagsMatch;
    });
    
    return results.slice(0, limit);
  },
});