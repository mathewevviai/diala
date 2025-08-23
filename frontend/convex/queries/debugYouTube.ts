import { query } from "../_generated/server";
import { v } from "convex/values";

// Debug query to check what's in the database
export const getAllYouTubeVideos = query({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db
      .query("youtubeVideos")
      .order("desc")
      .take(20);
    
    const channels = await ctx.db
      .query("youtubeChannels")
      .order("desc")
      .take(5);
    
    const recentJobs = await ctx.db
      .query("youtubeJobs")
      .order("desc")
      .take(10);
    
    return {
      videos: videos.map(v => ({
        videoId: v.videoId,
        channelId: v.channelId,
        title: v.title,
        cachedAt: v.cachedAt
      })),
      channels: channels.map(c => ({
        channelId: c.channelId,
        channelName: c.channelName,
        cachedAt: c.cachedAt
      })),
      recentJobs: recentJobs.map(j => ({
        jobId: j.jobId,
        action: j.action,
        status: j.status,
        channelId: j.channelId,
        createdAt: j.createdAt
      }))
    };
  },
});