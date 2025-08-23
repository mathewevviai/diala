import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { SUBSCRIPTION_TIERS } from "./rateLimitHelpers";

// Create a test user subscription for development
export const createTestSubscription = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      console.log("Subscription already exists for user:", userId);
      return existing._id;
    }

    // Create a free tier subscription for testing
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

    console.log("Created test subscription for user:", userId);
    return subscriptionId;
  },
});

// Create a premium test subscription
export const createPremiumTestSubscription = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update to premium
      await ctx.db.patch(existing._id, {
        tier: "premium",
        searchesPerDay: SUBSCRIPTION_TIERS.premium.searchesPerDay,
        leadsPerSearch: SUBSCRIPTION_TIERS.premium.leadsPerSearch,
        totalLeadsPerMonth: SUBSCRIPTION_TIERS.premium.totalLeadsPerMonth,
        status: "active",
        updatedAt: new Date().toISOString(),
      });
      console.log("Updated subscription to premium for user:", userId);
      return existing._id;
    }

    // Create a premium subscription
    const now = new Date().toISOString();
    const subscriptionId = await ctx.db.insert("userSubscriptions", {
      userId,
      tier: "premium",
      searchesPerDay: SUBSCRIPTION_TIERS.premium.searchesPerDay,
      leadsPerSearch: SUBSCRIPTION_TIERS.premium.leadsPerSearch,
      totalLeadsPerMonth: SUBSCRIPTION_TIERS.premium.totalLeadsPerMonth,
      searchesToday: 0,
      leadsThisMonth: 0,
      lastResetDate: now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    console.log("Created premium subscription for user:", userId);
    return subscriptionId;
  },
});

// Update existing subscription limits to match new SUBSCRIPTION_TIERS
export const updateSubscriptionLimits = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      console.log("No subscription found for user:", userId);
      return null;
    }

    const tier = subscription.tier as keyof typeof SUBSCRIPTION_TIERS;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    // Update with new limits from SUBSCRIPTION_TIERS
    await ctx.db.patch(subscription._id, {
      searchesPerDay: tierConfig.searchesPerDay,
      leadsPerSearch: tierConfig.leadsPerSearch,
      totalLeadsPerMonth: tierConfig.totalLeadsPerMonth,
      updatedAt: new Date().toISOString(),
    });

    console.log(`Updated ${tier} subscription limits for user:`, userId);
    console.log(`New limits - Searches/day: ${tierConfig.searchesPerDay}, Leads/search: ${tierConfig.leadsPerSearch}, Leads/month: ${tierConfig.totalLeadsPerMonth}`);
    
    return subscription._id;
  },
});