"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Backend API configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Create channel fetch job action
export const createChannelFetchJob = action({
  args: {
    jobId: v.string(),
    channelUrl: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, channelUrl, userId } = args;
    
    console.log('[Convex Action] Creating Twitch channel fetch job:', jobId);
    
    // First create the job record in the database
    await ctx.runMutation(api.mutations.twitchContent.createJobRecord, {
      jobId,
      userId,
      channelUrl,
      action: "fetch_channel",
    });
    
    // Call backend API
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/twitch/channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          channel_url: channelUrl,
          user_id: userId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[Convex Action] Twitch channel fetch job created:', result);
      
      // Update job status to processing
      await ctx.runMutation(api.mutations.twitchContent.updateJobStatus, {
        jobId,
        status: "processing",
      });
      
      return { success: true, result };
      
    } catch (error) {
      console.error('[Convex Action] Error creating Twitch channel fetch job:', error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.twitchContent.updateJobStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  },
});

// Create videos fetch job action
export const createVideosFetchJob = action({
  args: {
    jobId: v.string(),
    channelName: v.string(),
    userId: v.string(),
    count: v.optional(v.number()),
    videoType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, channelName, userId, count = 6, videoType = "archive" } = args;
    
    console.log('[Convex Action] Creating Twitch videos fetch job:', jobId);
    
    // First create the job record in the database
    await ctx.runMutation(api.mutations.twitchContent.createJobRecord, {
      jobId,
      userId,
      channelName,
      action: "fetch_videos",
      count,
      videoType,
    });
    
    // Call backend API
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/twitch/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          channel_name: channelName,
          user_id: userId,
          count,
          video_type: videoType,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[Convex Action] Twitch videos fetch job created:', result);
      
      // Update job status to processing
      await ctx.runMutation(api.mutations.twitchContent.updateJobStatus, {
        jobId,
        status: "processing",
      });
      
      return { success: true, result };
      
    } catch (error) {
      console.error('[Convex Action] Error creating Twitch videos fetch job:', error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.twitchContent.updateJobStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  },
});

// Create download job action
export const createDownloadJob = action({
  args: {
    jobId: v.string(),
    videoIds: v.array(v.string()),
    userId: v.string(),
    channelName: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, videoIds, userId, channelName } = args;
    
    console.log('[Convex Action] Creating Twitch download job:', jobId, 'videos:', videoIds.length);
    
    // First create the job record in the database
    await ctx.runMutation(api.mutations.twitchContent.createJobRecord, {
      jobId,
      userId,
      channelName,
      action: "download_videos",
      videoIds,
    });
    
    // Call backend API
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/twitch/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          video_ids: videoIds,
          user_id: userId,
          channel_name: channelName,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[Convex Action] Twitch download job created:', result);
      
      // Update job status to processing
      await ctx.runMutation(api.mutations.twitchContent.updateJobStatus, {
        jobId,
        status: "processing",
      });
      
      return { success: true, result };
      
    } catch (error) {
      console.error('[Convex Action] Error creating Twitch download job:', error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.twitchContent.updateJobStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  },
});