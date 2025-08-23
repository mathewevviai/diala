import { v } from "convex/values";
import { query } from "../_generated/server";

// Get cached user data
export const getCachedUser = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("tiktokUsers")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      return null;
    }
    
    // Check if cache is stale (24 hours)
    const isStale = Date.now() - user.cachedAt > 24 * 60 * 60 * 1000;
    
    return {
      user,
      isStale,
    };
  },
});

// Get cached videos for a user
export const getCachedVideos = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
    refreshTrigger: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("tiktokVideos")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .order("desc")
      .take(args.limit || 30);
    
    if (videos.length === 0) {
      return null;
    }
    
    // Check if cache is stale (6 hours)
    const oldestVideo = videos[videos.length - 1];
    const isStale = Date.now() - oldestVideo.cachedAt > 6 * 60 * 60 * 1000;
    
    return {
      videos,
      isStale,
    };
  },
});

// Get job status
export const getJob = query({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    return job;
  },
});

// Check rate limit for user
export const checkRateLimit = query({
  args: {
    userId: v.string(),
    action: v.union(
      v.literal("fetch_user"),
      v.literal("fetch_videos"),
      v.literal("download_videos")
    ),
  },
  handler: async (ctx, args) => {
    const limits = {
      fetch_user: 20,
      fetch_videos: 10,
      download_videos: 5,
    };
    
    const limit = limits[args.action];
    
    // Count recent jobs
    const recentJobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), args.action),
          q.gte(q.field("createdAt"), Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
      .collect();
    
    const used = recentJobs.length;
    const remaining = Math.max(0, limit - used);
    const resetAt = recentJobs.length > 0 
      ? recentJobs[0].createdAt + 60 * 60 * 1000 
      : Date.now() + 60 * 60 * 1000;
    
    return {
      canCreate: remaining > 0,
      limit,
      used,
      remaining,
      resetAt,
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
    const jobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);
    
    return jobs;
  },
});

// Get video download status
export const getVideoDownloadStatus = query({
  args: {
    videoIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const videos = await Promise.all(
      args.videoIds.map(async (videoId) => {
        const video = await ctx.db
          .query("tiktokVideos")
          .withIndex("by_video", (q) => q.eq("videoId", videoId))
          .first();
        
        return {
          videoId,
          downloadStatus: video?.downloadStatus || "pending",
          localPath: video?.localPath,
        };
      })
    );
    
    return videos;
  },
});