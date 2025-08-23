import { v } from "convex/values";
import { query } from "../_generated/server";

// Get cached channel data
export const getChannel = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db
      .query("twitchChannels")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    return channel;
  },
});

// Get cached videos
export const getVideos = query({
  args: {
    channelUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("twitchVideos")
      .withIndex("by_channel", (q) => q.eq("channelUsername", args.channelUsername))
      .collect();
    
    // Sort by createdAt descending (newest first)
    videos.sort((a, b) => b.createdAt - a.createdAt);
    
    return videos;
  },
});

// Get job status
export const getJob = query({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("twitchJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    return job;
  },
});

// Get rate limit info for user
export const getRateLimitInfo = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    // Get jobs from last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const recentJobs = await ctx.db
      .query("twitchJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
      .collect();
    
    // Count by action type
    const fetchChannelCount = recentJobs.filter(j => j.action === "fetch_channel").length;
    const fetchVideosCount = recentJobs.filter(j => j.action === "fetch_videos").length;
    const downloadCount = recentJobs.filter(j => j.action === "download_videos").length;
    
    // Rate limits (matching backend)
    const FETCH_CHANNEL_LIMIT = 20;
    const FETCH_VIDEOS_LIMIT = 10;
    const DOWNLOAD_LIMIT = 5;
    
    return {
      fetch_channel: {
        remaining: Math.max(0, FETCH_CHANNEL_LIMIT - fetchChannelCount),
        resetAt: oneHourAgo + 60 * 60 * 1000,
      },
      fetch_videos: {
        remaining: Math.max(0, FETCH_VIDEOS_LIMIT - fetchVideosCount),
        resetAt: oneHourAgo + 60 * 60 * 1000,
      },
      download_videos: {
        remaining: Math.max(0, DOWNLOAD_LIMIT - downloadCount),
        resetAt: oneHourAgo + 60 * 60 * 1000,
      },
    };
  },
});

// Debug query to get all Twitch videos
export const getAllTwitchVideos = query({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("twitchVideos").collect();
    
    return {
      count: videos.length,
      videos: videos.map(v => ({
        videoId: v.videoId,
        title: v.title,
        channelUsername: v.channelUsername,
        type: v.type,
        cachedAt: new Date(v.cachedAt).toISOString(),
      })),
    };
  },
});