import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Create job record (called by action)
export const createJobRecord = mutation({
  args: {
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
    action: v.string(),
    postIds: v.optional(v.array(v.string())),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log('[Convex Mutation] Creating Instagram job record:', args.jobId, args.action);
    
    const jobData: any = {
      jobId: args.jobId,
      userId: args.userId,
      username: args.username,
      action: args.action,
      status: "pending",
      createdAt: Date.now(),
    };
    
    if (args.postIds) {
      jobData.postIds = args.postIds;
      jobData.totalPosts = args.postIds.length;
      jobData.progress = 0;
    }
    if (args.count !== undefined) jobData.count = args.count;
    
    const id = await ctx.db.insert("instagramJobs", jobData);
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
      .query("instagramJobs")
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
    userData: v.optional(v.any()),
    postsData: v.optional(v.any()),
    downloadData: v.optional(v.any()),
    progress: v.optional(v.number()),
    totalPosts: v.optional(v.number()),
    completedPosts: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, status, userData, postsData, downloadData, progress, error } = args;
    
    console.log('[Convex] Instagram job webhook received:', jobId, status);
    
    // Find the job
    const job = await ctx.db
      .query("instagramJobs")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();
    
    if (!job) {
      console.error('[Convex] Job not found:', jobId);
      return;
    }
    
    // Update job status
    const updates: Partial<Doc<"instagramJobs">> = {
      status: status as any,
    };
    
    if (progress !== undefined) {
      updates.progress = progress;
    }
    
    if (args.totalPosts !== undefined) {
      updates.totalPosts = args.totalPosts;
    }
    
    if (args.completedPosts !== undefined) {
      updates.completedPosts = args.completedPosts;
    }
    
    if (error) {
      updates.error = error;
    }
    
    if (status === "completed") {
      updates.completedAt = Date.now();
      
      // Store user data
      if (userData) {
        console.log('[Convex] Storing Instagram user data:', userData.username);
        
        // Store result in job
        updates.result = { userData };
        
        // Upsert user record
        const existingUser = await ctx.db
          .query("instagramUsers")
          .withIndex("by_username", (q) => q.eq("username", userData.username))
          .first();
        
        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            ...userData,
            cachedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("instagramUsers", {
            ...userData,
            cachedAt: Date.now(),
          });
        }
      }
      
      // Store posts data
      if (postsData && postsData.posts) {
        console.log('[Convex] Storing Instagram posts:', postsData.posts.length);
        
        // Store result in job
        updates.result = { postsData };
        
        // Get username from job
        const username = job.username;
        
        if (username) {
          // Delete existing posts for this user to avoid duplicates
          const existingPosts = await ctx.db
            .query("instagramPosts")
            .withIndex("by_username", (q) => q.eq("username", username))
            .collect();
          
          for (const post of existingPosts) {
            await ctx.db.delete(post._id);
          }
          
          // Insert new posts
          for (const post of postsData.posts) {
            await ctx.db.insert("instagramPosts", {
              ...post,
              username,
              cachedAt: Date.now(),
            });
          }
        }
      }
      
      // Store download data
      if (downloadData) {
        console.log('[Convex] Instagram download completed:', downloadData);
        updates.result = { downloadData };
      }
    }
    
    await ctx.db.patch(job._id, updates);
  },
});

// Cleanup Instagram data
export const cleanup = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[Convex] Cleaning up Instagram data for user:', args.userId);
    
    let deletedCount = {
      jobs: 0,
      users: 0,
      posts: 0,
    };
    
    // Get all usernames from jobs for this user
    const usernames = new Set<string>();
    
    // Delete all jobs for this user and collect usernames
    const jobs = await ctx.db
      .query("instagramJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    console.log(`[Instagram Cleanup] Found ${jobs.length} jobs for user ${args.userId}`);
    
    for (const job of jobs) {
      // Collect usernames from jobs
      if (job.username) {
        usernames.add(job.username);
      }
      await ctx.db.delete(job._id);
    }
    deletedCount.jobs = jobs.length;
    
    // If username is provided directly, add it to the set
    if (args.username) {
      usernames.add(args.username);
    }
    
    // Delete all users and posts for collected usernames
    for (const username of usernames) {
      console.log(`[Instagram Cleanup] Cleaning up data for username: ${username}`);
      
      // Delete user data
      const users = await ctx.db
        .query("instagramUsers")
        .withIndex("by_username", (q) => q.eq("username", username))
        .collect();
      
      for (const user of users) {
        await ctx.db.delete(user._id);
        deletedCount.users++;
      }
      
      // Delete all posts for this username
      const posts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_username", (q) => q.eq("username", username))
        .collect();
      
      console.log(`[Instagram Cleanup] Found ${posts.length} posts for ${username}`);
      
      for (const post of posts) {
        await ctx.db.delete(post._id);
      }
      deletedCount.posts += posts.length;
    }
    
    console.log(`[Instagram Cleanup] Cleanup complete:`, deletedCount);
    
    return {
      success: true,
      deleted: deletedCount,
      usernames: Array.from(usernames),
    };
  },
});