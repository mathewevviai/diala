import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Create job record for channel fetch (called by action)
export const createJobRecord = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    channelUrl: v.optional(v.string()),
    channelName: v.optional(v.string()),
    action: v.string(),
    videoIds: v.optional(v.array(v.string())),
    count: v.optional(v.number()),
    videoType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[Convex Mutation] Creating Twitch job record:', args.jobId, args.action);
    
    const jobData: any = {
      jobId: args.jobId,
      userId: args.userId,
      action: args.action,
      status: "pending",
      createdAt: Date.now(),
    };
    
    if (args.channelUrl) jobData.channelUrl = args.channelUrl;
    if (args.channelName) jobData.channelName = args.channelName;
    if (args.videoIds) {
      jobData.videoIds = args.videoIds;
      jobData.totalVideos = args.videoIds.length;
      jobData.progress = 0;
    }
    if (args.count !== undefined) jobData.count = args.count;
    if (args.videoType) jobData.videoType = args.videoType;
    
    const id = await ctx.db.insert("twitchJobs", jobData);
    return id;
  },
});

// Update job status (called by action)
export const updateJobStatus = mutation({
  args: {
    jobId: v.string(),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("twitchJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job ${args.jobId} not found`);
    }
    
    const updates: any = {
      status: args.status,
    };
    
    if (args.error) {
      updates.error = args.error;
      updates.completedAt = Date.now();
    }
    
    await ctx.db.patch(job._id, updates);
  },
});



// Job webhook handler (called by backend)
export const jobWebhook = mutation({
  args: {
    jobId: v.string(),
    status: v.string(),
    channelData: v.optional(v.any()),
    videosData: v.optional(v.any()),
    downloadData: v.optional(v.any()),
    progress: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    completedVideos: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, status, channelData, videosData, downloadData, progress, error } = args;
    
    console.log('[Convex] Twitch job webhook received:', jobId, status);
    
    // Find the job
    const job = await ctx.db
      .query("twitchJobs")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();
    
    if (!job) {
      console.error('[Convex] Job not found:', jobId);
      return;
    }
    
    // Update job status
    const updates: Partial<Doc<"twitchJobs">> = {
      status: status as any,
    };
    
    if (progress !== undefined) {
      updates.progress = progress;
    }
    
    if (args.totalVideos !== undefined) {
      updates.totalVideos = args.totalVideos;
    }
    
    if (args.completedVideos !== undefined) {
      updates.completedVideos = args.completedVideos;
    }
    
    if (error) {
      updates.error = error;
    }
    
    if (status === "completed") {
      updates.completedAt = Date.now();
      
      // Store channel data
      if (channelData) {
        console.log('[Convex] Storing Twitch channel data:', channelData.username);
        
        // Store result in job
        updates.result = { channelData };
        
        // Upsert channel record
        const existingChannel = await ctx.db
          .query("twitchChannels")
          .withIndex("by_username", (q) => q.eq("username", channelData.username))
          .first();
        
        if (existingChannel) {
          await ctx.db.patch(existingChannel._id, {
            ...channelData,
            cachedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("twitchChannels", {
            ...channelData,
            cachedAt: Date.now(),
          });
        }
      }
      
      // Store videos data
      if (videosData && videosData.videos) {
        console.log('[Convex] Storing Twitch videos:', videosData.videos.length);
        
        // Store result in job
        updates.result = { videosData };
        
        // Get channel username from job
        const channelUsername = job.channelName;
        
        if (channelUsername) {
          // Delete existing videos for this channel to avoid duplicates
          const existingVideos = await ctx.db
            .query("twitchVideos")
            .withIndex("by_channel", (q) => q.eq("channelUsername", channelUsername))
            .collect();
          
          for (const video of existingVideos) {
            await ctx.db.delete(video._id);
          }
          
          // Insert new videos
          for (const video of videosData.videos) {
            await ctx.db.insert("twitchVideos", {
              ...video,
              channelUsername,
              cachedAt: Date.now(),
            });
          }
        }
      }
      
      // Store download data
      if (downloadData) {
        console.log('[Convex] Twitch download completed:', downloadData);
        updates.result = { downloadData };
      }
    }
    
    await ctx.db.patch(job._id, updates);
  },
});

// Cleanup Twitch data
export const cleanup = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[Convex] Cleaning up Twitch data for user:', args.userId);
    
    let deletedCount = {
      jobs: 0,
      channels: 0,
      videos: 0,
    };
    
    // Get all usernames from jobs for this user
    const usernames = new Set<string>();
    
    // Delete all jobs for this user and collect usernames
    const jobs = await ctx.db
      .query("twitchJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    console.log(`[Twitch Cleanup] Found ${jobs.length} jobs for user ${args.userId}`);
    
    for (const job of jobs) {
      // Collect channel names from jobs
      if (job.channelName) {
        usernames.add(job.channelName);
      }
      // Also check channelUrl and extract username if it's a URL
      if (job.channelUrl) {
        const match = job.channelUrl.match(/twitch\.tv\/([^/?]+)/);
        if (match) {
          usernames.add(match[1]);
        }
      }
      await ctx.db.delete(job._id);
    }
    deletedCount.jobs = jobs.length;
    
    // If username is provided directly, add it to the set
    if (args.username) {
      usernames.add(args.username);
    }
    
    // Delete all channels and videos for collected usernames
    for (const username of usernames) {
      console.log(`[Twitch Cleanup] Cleaning up data for username: ${username}`);
      
      // Delete channel data
      const channels = await ctx.db
        .query("twitchChannels")
        .withIndex("by_username", (q) => q.eq("username", username))
        .collect();
      
      for (const channel of channels) {
        await ctx.db.delete(channel._id);
        deletedCount.channels++;
      }
      
      // Delete all videos for this channel
      const videos = await ctx.db
        .query("twitchVideos")
        .withIndex("by_channel", (q) => q.eq("channelUsername", username))
        .collect();
      
      console.log(`[Twitch Cleanup] Found ${videos.length} videos for ${username}`);
      
      for (const video of videos) {
        await ctx.db.delete(video._id);
      }
      deletedCount.videos += videos.length;
    }
    
    console.log(`[Twitch Cleanup] Cleanup complete:`, deletedCount);
    
    return {
      success: true,
      deleted: deletedCount,
      usernames: Array.from(usernames),
    };
  },
});