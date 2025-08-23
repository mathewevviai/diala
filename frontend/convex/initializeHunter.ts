import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Initialize a user's subscription (called when they first access Hunter)
export const initializeUserSubscription = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Check if user already has a subscription
    const existingSubscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSubscription) {
      return existingSubscription;
    }

    // Create default free tier subscription
    const now = new Date().toISOString();
    const subscriptionId = await ctx.db.insert("userSubscriptions", {
      userId,
      tier: "free",
      searchesPerDay: 5,
      leadsPerSearch: 50,
      totalLeadsPerMonth: 250,
      searchesToday: 0,
      leadsThisMonth: 0,
      lastResetDate: now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(subscriptionId);
  },
});

// Upgrade user subscription
export const upgradeUserSubscription = mutation({
  args: {
    userId: v.string(),
    newTier: v.union(v.literal("premium"), v.literal("enterprise")),
    subscriptionId: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, { userId, newTier, subscriptionId, expiresAt }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      throw new Error("User subscription not found");
    }

    const tierLimits = {
      premium: { searchesPerDay: 100, leadsPerSearch: 500, totalLeadsPerMonth: 50000 },
      enterprise: { searchesPerDay: -1, leadsPerSearch: -1, totalLeadsPerMonth: -1 },
    };

    const limits = tierLimits[newTier];

    await ctx.db.patch(subscription._id, {
      tier: newTier,
      searchesPerDay: limits.searchesPerDay,
      leadsPerSearch: limits.leadsPerSearch,
      totalLeadsPerMonth: limits.totalLeadsPerMonth,
      subscriptionId,
      status: "active",
      updatedAt: new Date().toISOString(),
      expiresAt,
    });

    return await ctx.db.get(subscription._id);
  },
});

// Reset daily usage for all users (to be run daily via cron)
export const resetDailyUsageForAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("userSubscriptions")
      .collect();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    for (const subscription of subscriptions) {
      const lastReset = new Date(subscription.lastResetDate);
      const lastResetDate = lastReset.toISOString().split('T')[0];

      // Reset if it's a new day
      if (today !== lastResetDate) {
        await ctx.db.patch(subscription._id, {
          searchesToday: 0,
          lastResetDate: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    }

    return { message: "Daily usage reset completed", processedCount: subscriptions.length };
  },
});

// Get system stats (for admin dashboard)
export const getSystemStats = mutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("userSubscriptions").collect();
    const searches = await ctx.db.query("leadSearches").collect();
    const results = await ctx.db.query("leadSearchResults").collect();

    const tierCounts = subscriptions.reduce((acc, sub) => {
      acc[sub.tier] = (acc[sub.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusCounts = searches.reduce((acc, search) => {
      acc[search.status] = (acc[search.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const today = new Date().toISOString().split('T')[0];
    const todaySearches = searches.filter(s => s.createdAt.startsWith(today));

    return {
      users: {
        total: subscriptions.length,
        byTier: tierCounts,
      },
      searches: {
        total: searches.length,
        today: todaySearches.length,
        byStatus: statusCounts,
      },
      leads: {
        total: results.length,
      },
      generatedAt: new Date().toISOString(),
    };
  },
});