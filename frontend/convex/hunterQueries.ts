import { query } from "./_generated/server";
import { v } from "convex/values";

// Get user subscription
export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get lead search by ID
export const getLeadSearch = query({
  args: { searchId: v.string() },
  handler: async (ctx, { searchId }) => {
    return await ctx.db
      .query("leadSearches")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .first();
  },
});

// Get search results count
export const getSearchResultsCount = query({
  args: { searchId: v.string() },
  handler: async (ctx, { searchId }) => {
    const results = await ctx.db
      .query("leadSearchResults")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .collect();
    
    return results.length;
  },
});

// Get search results with pagination and filters
export const getSearchResults = query({
  args: {
    searchId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filters: v.optional(v.object({
      emailVerified: v.optional(v.boolean()),
      phoneVerified: v.optional(v.boolean()),
      minConfidence: v.optional(v.number()),
      dataSources: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, { searchId, limit = 50, offset = 0, filters }) => {
    let query = ctx.db
      .query("leadSearchResults")
      .withIndex("by_search", (q) => q.eq("searchId", searchId));

    let results = await query.collect();

    // Apply filters
    if (filters) {
      if (filters.emailVerified !== undefined) {
        results = results.filter(r => r.emailVerified === filters.emailVerified);
      }
      if (filters.phoneVerified !== undefined) {
        results = results.filter(r => r.phoneVerified === filters.phoneVerified);
      }
      if (filters.minConfidence !== undefined) {
        results = results.filter(r => r.confidence >= filters.minConfidence);
      }
      if (filters.dataSources && filters.dataSources.length > 0) {
        results = results.filter(r => filters.dataSources.includes(r.dataSource));
      }
    }

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total: results.length,
      hasMore: offset + limit < results.length,
    };
  },
});

// Get user's search history
export const getUserSearchHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20, offset = 0 }) => {
    const searches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit + offset);

    return searches.slice(offset);
  },
});

// Get all user searches for the hunter page
export const getUserSearchesForHunter = query({
  args: { 
    userId: v.string(),
    includeStats: v.optional(v.boolean())
  },
  handler: async (ctx, { userId, includeStats = true }) => {
    const searches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // If includeStats is true, fetch result counts for each search
    if (includeStats) {
      const searchesWithStats = await Promise.all(
        searches.map(async (search) => {
          const resultsCount = await ctx.db
            .query("leadSearchResults")
            .withIndex("by_search", (q) => q.eq("searchId", search.searchId))
            .collect()
            .then(results => results.length);

          return {
            ...search,
            resultsCount
          };
        })
      );
      return searchesWithStats;
    }

    return searches;
  },
});

// Get user's recent searches with results summary
export const getUserDashboardData = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Get subscription info
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get recent searches
    const recentSearches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    // Get active searches
    const activeSearches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "processing"))
      .collect();

    // Calculate total leads found this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthStart = thisMonth.toISOString();

    const monthlySearches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), monthStart))
      .collect();

    const totalLeadsThisMonth = monthlySearches.reduce((sum, search) => 
      sum + (search.totalLeads || 0), 0
    );

    return {
      subscription,
      recentSearches,
      activeSearches,
      stats: {
        totalSearches: recentSearches.length,
        activeSearches: activeSearches.length,
        totalLeadsThisMonth,
        searchesToday: subscription?.searchesToday || 0,
      },
    };
  },
});

// Get search analytics for a specific search
export const getSearchAnalytics = query({
  args: { searchId: v.string() },
  handler: async (ctx, { searchId }) => {
    const search = await ctx.db
      .query("leadSearches")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .first();

    if (!search) {
      return null;
    }

    const results = await ctx.db
      .query("leadSearchResults")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .collect();

    // Calculate analytics
    const totalResults = results.length;
    const verifiedEmails = results.filter(r => r.emailVerified).length;
    const verifiedPhones = results.filter(r => r.phoneVerified).length;
    const avgConfidence = totalResults > 0 
      ? results.reduce((sum, r) => sum + r.confidence, 0) / totalResults 
      : 0;

    // Source breakdown
    const sourceBreakdown = results.reduce((acc, result) => {
      acc[result.dataSource] = (acc[result.dataSource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Industry breakdown
    const industryBreakdown = results.reduce((acc, result) => {
      const industry = result.industry || "Unknown";
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Company size breakdown
    const companySizeBreakdown = results.reduce((acc, result) => {
      const size = result.companySize || "Unknown";
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      search,
      analytics: {
        totalResults,
        verifiedEmails,
        verifiedPhones,
        emailVerificationRate: totalResults > 0 ? (verifiedEmails / totalResults) * 100 : 0,
        phoneVerificationRate: totalResults > 0 ? (verifiedPhones / totalResults) * 100 : 0,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        sourceBreakdown,
        industryBreakdown,
        companySizeBreakdown,
      },
    };
  },
});

// Get export job status
export const getExportJob = query({
  args: { exportId: v.string() },
  handler: async (ctx, { exportId }) => {
    return await ctx.db
      .query("leadExportJobs")
      .withIndex("by_export", (q) => q.eq("exportId", exportId))
      .first();
  },
});

// Get user's export history
export const getUserExportHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    return await ctx.db
      .query("leadExportJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// Search for existing leads across all searches
export const searchExistingLeads = query({
  args: {
    userId: v.string(),
    query: v.string(),
    searchField: v.union(
      v.literal("email"),
      v.literal("name"),
      v.literal("company"),
      v.literal("phone")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, query: searchQuery, searchField, limit = 50 }) => {
    // Get all user's searches first
    const userSearches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const searchIds = userSearches.map(s => s.searchId);

    // Search across all results from user's searches
    const allResults = await ctx.db
      .query("leadSearchResults")
      .collect();

    // Filter by user's searches and search query
    const filteredResults = allResults
      .filter(result => searchIds.includes(result.searchId))
      .filter(result => {
        const fieldValue = result[searchField]?.toLowerCase() || "";
        return fieldValue.includes(searchQuery.toLowerCase());
      })
      .slice(0, limit);

    return filteredResults;
  },
});

// Get lead details by ID
export const getLeadDetails = query({
  args: { leadId: v.string() },
  handler: async (ctx, { leadId }) => {
    return await ctx.db
      .query("leadSearchResults")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .first();
  },
});

// Get similar leads (same company or industry)
export const getSimilarLeads = query({
  args: {
    leadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { leadId, limit = 10 }) => {
    const lead = await ctx.db
      .query("leadSearchResults")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .first();

    if (!lead) {
      return [];
    }

    // Find leads from same company or industry
    const similarLeads = await ctx.db
      .query("leadSearchResults")
      .collect();

    return similarLeads
      .filter(l => 
        l.leadId !== leadId && (
          (l.companyName && l.companyName === lead.companyName) ||
          (l.industry && l.industry === lead.industry)
        )
      )
      .slice(0, limit);
  },
});

// Get search performance metrics
export const getSearchPerformanceMetrics = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const searches = await ctx.db
      .query("leadSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const completedSearches = searches.filter(s => s.status === "completed");
    const totalLeads = completedSearches.reduce((sum, s) => sum + (s.totalLeads || 0), 0);
    const avgLeadsPerSearch = completedSearches.length > 0 
      ? totalLeads / completedSearches.length 
      : 0;

    // Calculate average search time
    const searchesWithTime = completedSearches.filter(s => s.searchTime);
    const avgSearchTime = searchesWithTime.length > 0
      ? searchesWithTime.reduce((sum, s) => {
          const timeMatch = s.searchTime?.match(/(\d+)m\s*(\d+)s/);
          if (timeMatch) {
            return sum + (parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]));
          }
          return sum;
        }, 0) / searchesWithTime.length
      : 0;

    return {
      totalSearches: searches.length,
      completedSearches: completedSearches.length,
      failedSearches: searches.filter(s => s.status === "failed").length,
      activeSearches: searches.filter(s => s.status === "processing").length,
      totalLeads,
      avgLeadsPerSearch: Math.round(avgLeadsPerSearch),
      avgSearchTimeSeconds: Math.round(avgSearchTime),
      successRate: searches.length > 0 
        ? (completedSearches.length / searches.length) * 100 
        : 0,
    };
  },
});