import { RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Time constants (in milliseconds)
const HOUR = 60 * 60 * 1000; // 1 hour
const DAY = 24 * 60 * 60 * 1000; // 24 hours

// Initialize rate limiter
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Lead search limits
  leadSearchFree: { kind: "token bucket", rate: 100, period: DAY, capacity: 100 },
  leadSearchPremium: { kind: "token bucket", rate: 500, period: DAY, capacity: 100 },
  leadSearchEnterprise: { kind: "token bucket", rate: 1000, period: DAY, capacity: 200 },
  
  // Lead export limits
  leadExportFree: { kind: "token bucket", rate: 10, period: DAY, capacity: 10 },
  leadExportPremium: { kind: "token bucket", rate: 50, period: DAY, capacity: 20 },
  leadExportEnterprise: { kind: "token bucket", rate: 200, period: DAY, capacity: 50 },
  
  // RAG embedding limits
  ragEmbeddingsFree: { kind: "token bucket", rate: 100, period: DAY, capacity: 100 },
  ragEmbeddingsPremium: { kind: "token bucket", rate: 1000, period: DAY, capacity: 200 },
  ragEmbeddingsEnterprise: { kind: "token bucket", rate: 10000, period: DAY, capacity: 1000 },
  
  // RAG workflow limits
  ragWorkflowsFree: { kind: "token bucket", rate: 3, period: DAY, capacity: 3 },
  ragWorkflowsPremium: { kind: "token bucket", rate: 10, period: DAY, capacity: 5 },
  ragWorkflowsEnterprise: { kind: "token bucket", rate: 100, period: DAY, capacity: 20 },
  
  // API request limits (general)
  apiRequestsFree: { kind: "token bucket", rate: 1000, period: HOUR, capacity: 100 },
  apiRequestsPremium: { kind: "token bucket", rate: 5000, period: HOUR, capacity: 500 },
  apiRequestsEnterprise: { kind: "token bucket", rate: 10000, period: HOUR, capacity: 1000 },
  
  // Audio transcription limits
  audioTranscriptionsFree: { kind: "token bucket", rate: 10, period: HOUR, capacity: 10 },
  audioTranscriptionsPremium: { kind: "token bucket", rate: 50, period: HOUR, capacity: 20 },
  audioTranscriptionsEnterprise: { kind: "token bucket", rate: 200, period: HOUR, capacity: 50 },
});

// Default subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    searchesPerDay: 100,
    leadsPerSearch: 100,
    totalLeadsPerMonth: 10000,
    ragWorkflowsPerDay: 3,
    ragEmbeddingsPerDay: 100,
    ragMaxFileSize: 10 * 1024 * 1024, // 10MB
    ragDataRetention: 7, // days
    audioTranscriptionsPerHour: 10,
    audioMaxFileSize: 25 * 1024 * 1024, // 25MB (OpenAI limit)
    audioDataRetention: 7, // days
    features: ["basic_search", "web_sources", "rag_json_export", "audio_transcription"],
  },
  premium: {
    searchesPerDay: 500,
    leadsPerSearch: 1000,
    totalLeadsPerMonth: 500000,
    ragWorkflowsPerDay: 10,
    ragEmbeddingsPerDay: 1000,
    ragMaxFileSize: 100 * 1024 * 1024, // 100MB
    ragDataRetention: 30, // days
    audioTranscriptionsPerHour: 50,
    audioMaxFileSize: 25 * 1024 * 1024, // 25MB (OpenAI limit)
    audioDataRetention: 30, // days
    features: ["advanced_search", "all_sources", "email_verification", "export", "rag_csv_export", "audio_transcription"],
  },
  enterprise: {
    searchesPerDay: -1, // unlimited
    leadsPerSearch: -1, // unlimited
    totalLeadsPerMonth: -1, // unlimited
    ragWorkflowsPerDay: -1, // unlimited
    ragEmbeddingsPerDay: -1, // unlimited
    ragMaxFileSize: -1, // unlimited
    ragDataRetention: -1, // permanent
    audioTranscriptionsPerHour: -1, // unlimited
    audioMaxFileSize: 25 * 1024 * 1024, // 25MB (OpenAI limit)
    audioDataRetention: -1, // permanent
    features: ["unlimited_search", "all_sources", "priority_support", "api_access", "rag_all_exports", "audio_transcription"],
  },
} as const;

// Get or create user subscription
export const getUserSubscription = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    let subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      // Create default free subscription
      const now = new Date().toISOString();
      const subscriptionId = await ctx.db.insert("userSubscriptions", {
        userId,
        tier: "free",
        searchesPerDay: SUBSCRIPTION_TIERS.free.searchesPerDay,
        leadsPerSearch: SUBSCRIPTION_TIERS.free.leadsPerSearch,
        totalLeadsPerMonth: SUBSCRIPTION_TIERS.free.totalLeadsPerMonth,
        searchesToday: 0,
        leadsThisMonth: 0,
        lastResetDate: now,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      return await ctx.db.get(subscriptionId);
    }

    return subscription;
  },
});


// NEW: Internal mutation to reset usage counters
export const resetUsageCountersIfNeeded = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return; // No subscription to reset
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastReset = new Date(subscription.lastResetDate);
    const lastResetDate = lastReset.toISOString().split('T')[0];
    
    const updates: Partial<typeof subscription> = {};

    // Reset daily counters if it's a new day
    if (today !== lastResetDate) {
      updates.searchesToday = 0;
      updates.lastResetDate = now.toISOString();
    }

    // Reset monthly counters if it's a new month
    const currentMonth = now.getMonth();
    const lastResetMonth = lastReset.getMonth();
    if (currentMonth !== lastResetMonth) {
      updates.leadsThisMonth = 0;
      // Also update lastResetDate to prevent daily reset on the same day
      updates.lastResetDate = now.toISOString();
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now.toISOString();
      await ctx.db.patch(subscription._id, updates);
    }
  }
});


// Check rate limits for a feature
export async function checkRateLimit(
  ctx: any,
  userId: string,
  feature: "leadSearch" | "leadExport" | "apiRequests" | "ragEmbeddings" | "ragWorkflows",
  userTier: "free" | "premium" | "enterprise"
) {
  const rateLimitKey = `${feature}${userTier.charAt(0).toUpperCase() + userTier.slice(1)}`;
  
  try {
    await rateLimiter.limit(ctx, rateLimitKey as any, {
      key: userId,
      throws: true,
    });
    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      error: `Rate limit exceeded for ${feature}. Please upgrade your plan or try again later.`,
    };
  }
}

// Check if user has reached their subscription limits (NOW READ-ONLY)
export const checkSubscriptionLimits = query({
  args: {
    userId: v.string(),
    feature: v.union(v.literal("search"), v.literal("export")),
    additionalLeads: v.optional(v.number()),
  },
  handler: async (ctx, { userId, feature, additionalLeads = 0 }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return { allowed: false, error: "No subscription found" };
    }

    // Check limits based on feature
    if (feature === "search") {
      if (subscription.tier !== "enterprise" && subscription.searchesToday >= subscription.searchesPerDay) {
        return {
          allowed: false,
          error: `Daily search limit reached (${subscription.searchesPerDay}). Upgrade for more searches.`,
          limit: subscription.searchesPerDay,
          used: subscription.searchesToday,
        };
      }
    }

    // Check monthly lead limits
    const potentialLeads = subscription.leadsThisMonth + additionalLeads;
    if (subscription.tier !== "enterprise" && potentialLeads > subscription.totalLeadsPerMonth) {
      return {
        allowed: false,
        error: `Monthly lead limit would be exceeded. Upgrade for more leads.`,
        limit: subscription.totalLeadsPerMonth,
        used: subscription.leadsThisMonth,
        wouldUse: potentialLeads,
      };
    }

    return { 
      allowed: true,
      subscription,
      limits: {
        searchesPerDay: subscription.searchesPerDay,
        searchesToday: subscription.searchesToday,
        leadsPerSearch: subscription.leadsPerSearch,
        totalLeadsPerMonth: subscription.totalLeadsPerMonth,
        leadsThisMonth: subscription.leadsThisMonth,
      }
    };
  },
});

// Increment usage counters
export const incrementUsage = mutation({
  args: {
    userId: v.string(),
    feature: v.union(v.literal("search"), v.literal("export")),
    leadsCount: v.optional(v.number()),
  },
  handler: async (ctx, { userId, feature, leadsCount = 0 }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      throw new Error("No subscription found");
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (feature === "search") {
      updates.searchesToday = (subscription.searchesToday || 0) + 1;
    }

    if (leadsCount > 0) {
      updates.leadsThisMonth = (subscription.leadsThisMonth || 0) + leadsCount;
    }

    await ctx.db.patch(subscription._id, updates);
    return await ctx.db.get(subscription._id);
  },
});


// Get user's current usage stats
export const getUserUsageStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return null;
    }

    // Get recent searches
    const recentSearches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    return {
      subscription,
      usage: {
        searchesToday: subscription.searchesToday,
        searchesRemaining: subscription.tier === "enterprise" ? -1 : 
          Math.max(0, subscription.searchesPerDay - subscription.searchesToday),
        leadsThisMonth: subscription.leadsThisMonth,
        leadsRemaining: subscription.tier === "enterprise" ? -1 :
          Math.max(0, subscription.totalLeadsPerMonth - subscription.leadsThisMonth),
      },
      recentSearches: recentSearches.length,
      features: SUBSCRIPTION_TIERS[subscription.tier].features,
    };
  },
});
