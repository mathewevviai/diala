import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";

// Cleanup expired free tier search data
export const cleanupExpiredSearches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Find expired searches
    const expiredSearches = await ctx.db
      .query("leadSearches")
      .withIndex("by_expiry")
      .filter((q) => q.and(
        q.neq(q.field("expiresAt"), undefined),
        q.lt(q.field("expiresAt"), now)
      ))
      .collect();

    let deletedSearches = 0;
    let deletedResults = 0;

    for (const search of expiredSearches) {
      // Delete all lead results for this search
      const results = await ctx.db
        .query("leadSearchResults")
        .withIndex("by_search", (q) => q.eq("searchId", search.searchId))
        .collect();

      for (const result of results) {
        await ctx.db.delete(result._id);
        deletedResults++;
      }

      // Delete the search itself
      await ctx.db.delete(search._id);
      deletedSearches++;
    }

    console.log(`Cleaned up ${deletedSearches} expired searches and ${deletedResults} lead results`);

    return {
      deletedSearches,
      deletedResults,
      timestamp: now,
    };
  },
});

// Reset daily usage counters for all users
export const resetDailyUsage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allSubscriptions = await ctx.db
      .query("userSubscriptions")
      .collect();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let resetCount = 0;

    for (const subscription of allSubscriptions) {
      const lastReset = new Date(subscription.lastResetDate);
      const lastResetDate = lastReset.toISOString().split('T')[0];

      if (today !== lastResetDate) {
        await ctx.db.patch(subscription._id, {
          searchesToday: 0,
          lastResetDate: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        resetCount++;
      }
    }

    console.log(`Reset daily usage for ${resetCount} users`);

    return {
      resetCount,
      timestamp: now.toISOString(),
    };
  },
});

// Reset monthly usage counters on the 1st of each month
export const resetMonthlyUsage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentDay = now.getDate();
    
    // Only run on the 1st of the month
    if (currentDay !== 1) {
      return { resetCount: 0, timestamp: now.toISOString() };
    }

    const allSubscriptions = await ctx.db
      .query("userSubscriptions")
      .collect();

    let resetCount = 0;

    for (const subscription of allSubscriptions) {
      await ctx.db.patch(subscription._id, {
        leadsThisMonth: 0,
        updatedAt: now.toISOString(),
      });
      resetCount++;
    }

    console.log(`Reset monthly usage for ${resetCount} users`);

    return {
      resetCount,
      timestamp: now.toISOString(),
    };
  },
});

// Configure cron jobs
const crons = cronJobs();

// Run cleanup every day at 2 AM UTC
crons.daily(
  "cleanup expired searches",
  { hourUTC: 2, minuteUTC: 0 },
  "scheduledFunctions:cleanupExpiredSearches"
);

// Reset daily usage at midnight UTC
crons.daily(
  "reset daily usage",
  { hourUTC: 0, minuteUTC: 0 },
  "scheduledFunctions:resetDailyUsage"
);

// Check for monthly reset every day (will only actually reset on the 1st)
crons.daily(
  "reset monthly usage",
  { hourUTC: 0, minuteUTC: 5 },
  "scheduledFunctions:resetMonthlyUsage"
);

export default crons;