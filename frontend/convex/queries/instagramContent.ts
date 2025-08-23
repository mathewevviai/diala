import { v } from "convex/values";
import { query } from "../_generated/server";

// Get cached user data
export const getCachedUser = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("instagramUsers")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      return null;
    }
    
    // Check if cache is stale (older than 1 hour)
    const isStale = Date.now() - user.cachedAt > 60 * 60 * 1000;
    
    return {
      user,
      isStale,
    };
  },
});

// Get cached posts
export const getCachedPosts = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .collect();
    
    // Sort by timestamp descending (newest first)
    posts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Check if cache is stale (older than 1 hour)
    const isStale = posts.length > 0 && Date.now() - posts[0].cachedAt > 60 * 60 * 1000;
    
    return {
      posts,
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
      .query("instagramJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    return job;
  },
});

// Check rate limit for specific action
export const checkRateLimit = query({
  args: {
    userId: v.string(),
    action: v.union(
      v.literal("fetch_user"),
      v.literal("fetch_posts"),
      v.literal("download_posts")
    ),
  },
  handler: async (ctx, args) => {
    const { userId, action } = args;
    
    // Get jobs from last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const recentJobs = await ctx.db
      .query("instagramJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), action),
          q.gte(q.field("createdAt"), oneHourAgo)
        )
      )
      .collect();
    
    // Rate limits (matching backend)
    const limits = {
      fetch_user: 20,
      fetch_posts: 10,
      download_posts: 5,
    };
    
    const limit = limits[action];
    const remaining = Math.max(0, limit - recentJobs.length);
    
    return {
      canCreate: remaining > 0,
      remaining,
      resetAt: oneHourAgo + 60 * 60 * 1000,
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
      .query("instagramJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);
    
    return jobs;
  },
});

// Debug query to get all Instagram posts
export const getAllInstagramPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("instagramPosts").collect();
    
    return {
      count: posts.length,
      posts: posts.map(p => ({
        postId: p.postId,
        username: p.username,
        mediaType: p.mediaType,
        likeCount: p.likeCount,
        cachedAt: new Date(p.cachedAt).toISOString(),
      })),
    };
  },
});