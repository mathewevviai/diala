import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a new channel fetch job
export const createChannelFetchJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    channelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if job already exists
    const existingJob = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (existingJob) {
      return existingJob._id;
    }
    
    // Create new job
    return await ctx.db.insert("youtubeJobs", {
      jobId: args.jobId,
      userId: args.userId,
      channelUrl: args.channelUrl,
      action: "fetch_channel",
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Create a new videos fetch job
export const createVideosFetchJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    channelId: v.string(),
    count: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if job already exists
    const existingJob = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (existingJob) {
      return existingJob._id;
    }
    
    // Create new job
    return await ctx.db.insert("youtubeJobs", {
      jobId: args.jobId,
      userId: args.userId,
      channelId: args.channelId,
      action: "fetch_videos",
      status: "pending",
      count: args.count || 30,
      sortBy: args.sortBy || "newest",
      createdAt: Date.now(),
    });
  },
});

// Create a new download job
export const createDownloadJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    channelId: v.string(),
    channelName: v.string(),
    videoIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if job already exists
    const existingJob = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (existingJob) {
      return existingJob._id;
    }
    
    // Create new job
    return await ctx.db.insert("youtubeJobs", {
      jobId: args.jobId,
      userId: args.userId,
      channelId: args.channelId,
      action: "download_videos",
      status: "pending",
      videoIds: args.videoIds,
      totalVideos: args.videoIds.length,
      progress: 0,
      createdAt: Date.now(),
    });
  },
});

// Handle webhook from backend
export const jobWebhook = mutation({
  args: {
    jobId: v.string(),
    status: v.string(),
    channelData: v.optional(v.object({
      channelId: v.string(),
      channelName: v.string(),
      channelHandle: v.optional(v.string()),
      channelUrl: v.string(),
      avatar: v.optional(v.string()),
      banner: v.optional(v.string()),
      description: v.optional(v.string()),
      subscriberCount: v.optional(v.number()),
      videoCount: v.optional(v.number()),
    })),
    videosData: v.optional(v.object({
      videos: v.array(v.object({
        videoId: v.string(),
        channelId: v.string(),
        title: v.string(),
        url: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        thumbnails: v.optional(v.array(v.object({
          quality: v.string(),
          url: v.string(),
          width: v.number(),
          height: v.number(),
        }))),
        duration: v.number(),
        viewCount: v.optional(v.number()),
        likeCount: v.optional(v.number()),
        uploadDate: v.optional(v.string()),
        description: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      })),
      count: v.number(),
      channelId: v.string(),
    })),
    downloadData: v.optional(v.object({
      totalVideos: v.number(),
      successfulDownloads: v.number(),
      tempDirectory: v.string(),
      files: v.array(v.object({
        videoId: v.string(),
        filePath: v.string(),
        fileSize: v.number(),
        title: v.optional(v.string()),
        duration: v.optional(v.number()),
      })),
    })),
    progress: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    completedVideos: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the job
    const job = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!job) {
      console.error(`Job ${args.jobId} not found`);
      return;
    }
    
    // Update job status
    const updates: any = {
      status: args.status as any,
      progress: args.progress,
      totalVideos: args.totalVideos,
      completedVideos: args.completedVideos,
      error: args.error,
      completedAt: args.status === "completed" || args.status === "failed" ? Date.now() : undefined,
    };
    
    // If channel data is provided, store the channelId in the job
    if (args.channelData && args.channelData.channelId) {
      updates.channelId = args.channelData.channelId;
    }
    
    await ctx.db.patch(job._id, updates);
    
    // Handle specific webhook data
    if (args.status === "completed") {
      if (args.channelData) {
        // Cache channel data
        await cacheChannelData(ctx, args.channelData);
      }
      
      if (args.videosData) {
        // Cache videos data
        console.log('[jobWebhook] Caching videos data:', {
          videoCount: args.videosData.videos.length,
          channelId: args.videosData.channelId
        });
        await cacheVideosData(ctx, args.videosData);
      }
      
      if (args.downloadData) {
        // Update video download status
        await updateDownloadStatus(ctx, args.downloadData);
      }
    }
  },
});

// Helper function to cache channel data
async function cacheChannelData(ctx: any, channelData: any) {
  const existing = await ctx.db
    .query("youtubeChannels")
    .withIndex("by_channel", (q: any) => q.eq("channelId", channelData.channelId))
    .first();
  
  if (existing) {
    // Update existing channel
    await ctx.db.patch(existing._id, {
      ...channelData,
      cachedAt: Date.now(),
    });
  } else {
    // Insert new channel
    await ctx.db.insert("youtubeChannels", {
      ...channelData,
      cachedAt: Date.now(),
    });
  }
}

// Helper function to cache videos data
async function cacheVideosData(ctx: any, videosData: any) {
  const { videos, channelId } = videosData;
  
  console.log('[cacheVideosData] Starting to cache videos:', {
    videoCount: videos.length,
    channelId
  });
  
  // Get channel name from channel data
  const channel = await ctx.db
    .query("youtubeChannels")
    .withIndex("by_channel", (q: any) => q.eq("channelId", channelId))
    .first();
  
  const channelName = channel?.channelName || "Unknown Channel";
  console.log('[cacheVideosData] Found channel:', channelName);
  
  // Cache each video
  for (const video of videos) {
    const existing = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_video", (q: any) => q.eq("videoId", video.videoId))
      .first();
    
    if (existing) {
      // Update existing video
      console.log('[cacheVideosData] Updating existing video:', video.videoId);
      await ctx.db.patch(existing._id, {
        ...video,
        channelName,
        cachedAt: Date.now(),
      });
    } else {
      // Insert new video
      console.log('[cacheVideosData] Inserting new video:', video.videoId, video.title);
      await ctx.db.insert("youtubeVideos", {
        ...video,
        channelName,
        cachedAt: Date.now(),
      });
    }
  }
  
  console.log('[cacheVideosData] Finished caching videos');
}

// Helper function to update download status
async function updateDownloadStatus(ctx: any, downloadData: any) {
  const { files } = downloadData;
  
  for (const file of files) {
    const video = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_video", (q: any) => q.eq("videoId", file.videoId))
      .first();
    
    if (video) {
      await ctx.db.patch(video._id, {
        downloadStatus: "completed",
        localPath: file.filePath,
        fileSize: file.fileSize,
      });
    }
  }
}

// Clean up all YouTube data for a user
export const cleanupAllData = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let deletedCount = {
      jobs: 0,
      channels: 0,
      videos: 0,
    };
    
    // Delete all jobs for this user
    const jobs = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .collect();
    
    console.log(`[cleanupAllData] Found ${jobs.length} jobs for user ${args.userId}`);
    
    // Collect all unique channel IDs from jobs
    const channelIds = new Set<string>();
    for (const job of jobs) {
      await ctx.db.delete(job._id);
      if (job.channelId) {
        channelIds.add(job.channelId);
      }
    }
    deletedCount.jobs = jobs.length;
    
    // Delete all channel data for the collected channel IDs
    for (const channelId of channelIds) {
      const channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_channel", (q) => q.eq("channelId", channelId))
        .first();
      
      if (channel) {
        console.log(`[cleanupAllData] Deleting channel: ${channel.channelName}`);
        await ctx.db.delete(channel._id);
        deletedCount.channels++;
      }
      
      // Delete all videos for this channel
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_channel", (q) => q.eq("channelId", channelId))
        .collect();
      
      console.log(`[cleanupAllData] Found ${videos.length} videos for channel ${channelId}`);
      
      for (const video of videos) {
        await ctx.db.delete(video._id);
      }
      deletedCount.videos += videos.length;
    }
    
    console.log(`[cleanupAllData] Cleanup complete:`, deletedCount);
    
    return { 
      success: true,
      deleted: deletedCount,
      channelIds: Array.from(channelIds),
    };
  },
});

// Clean up YouTube data for a specific channel
export const cleanupChannelData = mutation({
  args: {
    userId: v.string(),
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let deletedCount = {
      jobs: 0,
      channel: 0,
      videos: 0,
    };
    
    // Delete all jobs for this user
    const jobs = await ctx.db
      .query("youtubeJobs")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .collect();
    
    console.log(`[cleanupChannelData] Found ${jobs.length} jobs for user ${args.userId}`);
    
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }
    deletedCount.jobs = jobs.length;
    
    // If channelId provided, delete channel and video data
    if (args.channelId) {
      console.log(`[cleanupChannelData] Cleaning up data for channel: ${args.channelId}`);
      
      // Delete channel data
      const channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
        .first();
      
      if (channel) {
        console.log(`[cleanupChannelData] Deleting channel: ${channel.channelName}`);
        await ctx.db.delete(channel._id);
        deletedCount.channel = 1;
      }
      
      // Delete all videos for this channel
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
        .collect();
      
      console.log(`[cleanupChannelData] Found ${videos.length} videos for ${args.channelId}`);
      
      for (const video of videos) {
        await ctx.db.delete(video._id);
      }
      deletedCount.videos = videos.length;
    }
    
    console.log(`[cleanupChannelData] Cleanup complete:`, deletedCount);
    
    return { 
      success: true,
      deleted: deletedCount
    };
  },
});