"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

// Action to create user fetch job (calls backend API)
export const createUserFetchJob = action({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // First create job record in database
    await ctx.runMutation("mutations/tiktokContent:createUserFetchJob", {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
    });

    // Call backend API to process the job
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

    const response = await fetch(`${BACKEND_URL}/api/public/tiktok/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        job_id: args.jobId,
        username: args.username,
        user_id: args.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  },
});

// Action to create videos fetch job (calls backend API)
export const createVideosFetchJob = action({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
    count: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // First create job record in database
    await ctx.runMutation("mutations/tiktokContent:createVideosFetchJob", {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
    });

    // Call backend API to process the job
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

    const response = await fetch(`${BACKEND_URL}/api/public/tiktok/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        job_id: args.jobId,
        username: args.username,
        user_id: args.userId,
        count: args.count || 30,
        cursor: args.cursor || 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  },
});

// Action to create download job (calls backend API)
export const createDownloadJob = action({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
    videoIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // First create job record in database
    await ctx.runMutation("mutations/tiktokContent:createDownloadJob", {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
      videoIds: args.videoIds,
    });

    // Call backend API to process the job
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

    const response = await fetch(`${BACKEND_URL}/api/public/tiktok/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        job_id: args.jobId,
        video_ids: args.videoIds,
        user_id: args.userId,
        username: args.username,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  },
});