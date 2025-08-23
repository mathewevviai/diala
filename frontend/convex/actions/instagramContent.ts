"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Action to create user fetch job (calls backend API)
export const createUserFetchJob = action({
  args: {
    jobId: v.string(),
    username: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, username, userId } = args;
    
    console.log('[Convex Action] Creating Instagram user fetch job:', jobId, username);
    
    // First create job record in database
    await ctx.runMutation(api.mutations.instagramContent.createJobRecord, {
      jobId,
      userId,
      username,
      action: "fetch_user",
    });
    
    try {
      // Call backend API
      const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/public/instagram/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.API_KEY || '',
        },
        body: JSON.stringify({
          job_id: jobId,
          username,
          user_id: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Convex Action] Instagram user job created:', result);
      
      return { success: true, jobId };
    } catch (error) {
      console.error('[Convex Action] Error creating Instagram user job:', error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.instagramContent.updateJobStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },
});

// Action to create posts fetch job (calls backend API)
export const createPostsFetchJob = action({
  args: {
    jobId: v.string(),
    username: v.string(),
    userId: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { jobId, username, userId, count = 12 } = args;
    
    console.log('[Convex Action] Creating Instagram posts fetch job:', jobId, username, count);
    
    // First create job record in database
    await ctx.runMutation(api.mutations.instagramContent.createJobRecord, {
      jobId,
      userId,
      username,
      action: "fetch_posts",
      count,
    });
    
    try {
      // Call backend API
      const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/public/instagram/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.API_KEY || '',
        },
        body: JSON.stringify({
          job_id: jobId,
          username,
          user_id: userId,
          count,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Convex Action] Instagram posts job created:', result);
      
      return { success: true, jobId };
    } catch (error) {
      console.error('[Convex Action] Error creating Instagram posts job:', error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.instagramContent.updateJobStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },
});

// Action to create download job (calls backend API)
export const createDownloadJob = action({
  args: {
    jobId: v.string(),
    postIds: v.array(v.string()),
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, postIds, userId, username } = args;
    
    console.log('[Convex Action] Creating Instagram download job:', jobId, postIds.length, 'posts');
    
    // First create job record in database
    await ctx.runMutation(api.mutations.instagramContent.createJobRecord, {
      jobId,
      userId,
      username,
      action: "download_posts",
      postIds,
    });
    
    try {
      // Call backend API
      const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/public/instagram/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.API_KEY || '',
        },
        body: JSON.stringify({
          job_id: jobId,
          post_ids: postIds,
          user_id: userId,
          username,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Convex Action] Instagram download job created:', result);
      
      return { success: true, jobId };
    } catch (error) {
      console.error('[Convex Action] Error creating Instagram download job:', error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.instagramContent.updateJobStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },
});