import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Create a job to fetch TikTok user information
export const createUserFetchJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit (20 per hour)
    const recentJobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), "fetch_user"),
          q.gte(q.field("createdAt"), Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
      .collect();
    
    if (recentJobs.length >= 20) {
      throw new Error("Rate limit exceeded: 20 user fetches per hour");
    }
    
    // Create job
    await ctx.db.insert("tiktokJobs", {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
      action: "fetch_user",
      status: "pending",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Create a job to fetch TikTok videos
export const createVideosFetchJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit (10 per hour)
    const recentJobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), "fetch_videos"),
          q.gte(q.field("createdAt"), Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
      .collect();
    
    if (recentJobs.length >= 10) {
      throw new Error("Rate limit exceeded: 10 video fetches per hour");
    }
    
    // Create job
    await ctx.db.insert("tiktokJobs", {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
      action: "fetch_videos",
      status: "pending",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Create a job to download TikTok videos
export const createDownloadJob = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
    videoIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check rate limit (5 per hour)
    const recentJobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), "download_videos"),
          q.gte(q.field("createdAt"), Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
      .collect();
    
    if (recentJobs.length >= 5) {
      throw new Error("Rate limit exceeded: 5 download jobs per hour");
    }
    
    // Create job
    await ctx.db.insert("tiktokJobs", {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
      action: "download_videos",
      status: "pending",
      videoIds: args.videoIds,
      totalVideos: args.videoIds.length,
      completedVideos: 0,
      progress: 0,
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Webhook handler for job updates from backend
export const jobWebhook = mutation({
  args: {
    jobId: v.string(),
    status: v.string(),
    userData: v.optional(v.object({
      username: v.string(),
      userId: v.string(),
      secUid: v.string(),
      nickname: v.optional(v.string()),
      avatar: v.optional(v.string()),
      signature: v.optional(v.string()),
      verified: v.optional(v.boolean()),
      followerCount: v.optional(v.number()),
      followingCount: v.optional(v.number()),
      videoCount: v.optional(v.number()),
      heartCount: v.optional(v.number()),
      privateAccount: v.optional(v.boolean()),
    })),
    videosData: v.optional(v.object({
      videos: v.array(v.any()),
      count: v.number(),
      hasMore: v.boolean(),
      cursor: v.number(),
    })),
    downloadData: v.optional(v.object({
      totalVideos: v.number(),
      successfulDownloads: v.number(),
      tempDirectory: v.string(),
      files: v.array(v.object({
        videoId: v.string(),
        filePath: v.string(),
        fileSize: v.number(),
      })),
    })),
    testData: v.optional(v.any()),
    progress: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    completedVideos: v.optional(v.number()),
    error: v.optional(v.string()),
  },  handler: async (ctx, args) => {
    // Find and update the job
    const job = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job ${args.jobId} not found`);
    }
    
    // Update job status
    const updates: any = {
      status: args.status as any,
    };
    
    if (args.progress !== undefined) {
      updates.progress = args.progress;
    }
    
    if (args.totalVideos !== undefined) {
      updates.totalVideos = args.totalVideos;
    }
    
    if (args.completedVideos !== undefined) {
      updates.completedVideos = args.completedVideos;
    }
    
    if (args.error) {
      updates.error = args.error;
    }
    
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }
    
    await ctx.db.patch(job._id, updates);
    
    // Handle specific data updates based on job type
    if (args.status === "completed" && job.action === "fetch_user" && args.userData) {
      // Store or update user data
      const existingUser = await ctx.db
        .query("tiktokUsers")
        .withIndex("by_username", (q) => q.eq("username", args.userData!.username))
        .first();
      
      if (existingUser) {
        await ctx.db.patch(existingUser._id, {
          ...args.userData,
          cachedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("tiktokUsers", {
          ...args.userData,
          cachedAt: Date.now(),
        });
      }
    }
    
    if (args.status === "completed" && job.action === "fetch_videos" && args.videosData) {
      // Store videos data
      for (const video of args.videosData.videos) {
        const existingVideo = await ctx.db
          .query("tiktokVideos")
          .withIndex("by_video", (q) => q.eq("videoId", video.videoId))
          .first();
        
        const videoData = {
          videoId: video.videoId,
          username: job.username,
          title: video.title || "",
          thumbnail: video.thumbnail,
          dynamicCover: video.dynamicCover,
          duration: video.duration || 0,
          createTime: video.createTime || 0,
          views: video.stats?.views || 0,
          likes: video.stats?.likes || 0,
          comments: video.stats?.comments || 0,
          shares: video.stats?.shares || 0,
          saves: video.stats?.saves || 0,
          playAddr: video.playAddr,
          downloadAddr: video.downloadAddr,
          musicId: video.music?.id,
          musicTitle: video.music?.title,
          musicAuthor: video.music?.author,
          musicOriginal: video.music?.original,
          hashtags: video.hashtags,
          cachedAt: Date.now(),
        };
        
        if (existingVideo) {
          await ctx.db.patch(existingVideo._id, videoData);
        } else {
          await ctx.db.insert("tiktokVideos", videoData);
        }
      }
    }
    
    if (args.status === "completed" && job.action === "download_videos" && args.downloadData) {
      // Update video download status
      for (const file of args.downloadData.files) {
        const video = await ctx.db
          .query("tiktokVideos")
          .withIndex("by_video", (q) => q.eq("videoId", file.videoId))
          .first();
        
        if (video) {
          await ctx.db.patch(video._id, {
            downloadStatus: "completed",
            localPath: file.filePath,
          });
        }
      }
    }
    
    return { success: true };
  },
});

// Clean up ALL TikTok data (for development/testing)
export const cleanupAllData = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let deletedCount = {
      jobs: 0,
      users: 0,
      videos: 0,
    };
    
    // Get all usernames from jobs for this user
    const usernames = new Set<string>();
    
    // Delete all jobs for this user and collect usernames
    const jobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .collect();
    
    console.log(`[cleanupAllData] Found ${jobs.length} jobs for user ${args.userId}`);
    
    for (const job of jobs) {
      if (job.username) {
        let username = job.username;
        // Extract username from URL if needed
        if (username.startsWith('http')) {
          const match = username.match(/tiktok\.com\/@?([^/?]+)/);
          if (match) {
            username = match[1];
          }
        }
        usernames.add(username);
      }
      await ctx.db.delete(job._id);
    }
    deletedCount.jobs = jobs.length;
    
    // Delete all users and videos for collected usernames
    for (const username of Array.from(usernames)) {
      console.log(`[cleanupAllData] Cleaning up data for username: ${username}`);
      
      // Delete user data
      const user = await ctx.db
        .query("tiktokUsers")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();
      
      if (user) {
        await ctx.db.delete(user._id);
        deletedCount.users++;
      }
      
      // Delete all videos for this username
      const videos = await ctx.db
        .query("tiktokVideos")
        .withIndex("by_username", (q) => q.eq("username", username))
        .collect();
      
      for (const video of videos) {
        await ctx.db.delete(video._id);
      }
      deletedCount.videos += videos.length;
    }
    
    console.log(`[cleanupAllData] Cleanup complete:`, deletedCount);
    
    return { 
      success: true,
      deleted: deletedCount,
      usernames: Array.from(usernames) as string[],
    };
  },
});

// Clean up all TikTok data for a user
export const cleanupUserData = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let deletedCount = {
      jobs: 0,
      user: 0,
      videos: 0,
    };
    
    // Delete all jobs for this user
    const jobs = await ctx.db
      .query("tiktokJobs")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId))
      .collect();
    
    console.log(`[cleanupUserData] Found ${jobs.length} jobs for user ${args.userId}`);
    
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }
    deletedCount.jobs = jobs.length;
    
    // If username provided, delete user and video data
    if (args.username) {
      console.log(`[cleanupUserData] Cleaning up data for username: ${args.username}`);
      
      // Delete user data
      const user = await ctx.db
        .query("tiktokUsers")
        .withIndex("by_username", (q) => q.eq("username", args.username || ""))
        .first();
      
      if (user) {
        console.log(`[cleanupUserData] Deleting user: ${user.username}`);
        await ctx.db.delete(user._id);
        deletedCount.user = 1;
      }
      
      // Delete all videos for this username
      const videos = await ctx.db
        .query("tiktokVideos")
        .withIndex("by_username", (q) => q.eq("username", args.username || ""))
        .collect();
      
      console.log(`[cleanupUserData] Found ${videos.length} videos for ${args.username}`);
      
      for (const video of videos) {
        await ctx.db.delete(video._id);
      }
      deletedCount.videos = videos.length;
    }
    
    console.log(`[cleanupUserData] Cleanup complete:`, deletedCount);
    
    return { 
      success: true,
      deleted: deletedCount
    };
  },
});