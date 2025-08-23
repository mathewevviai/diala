import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { checkRateLimit } from "./rateLimitHelpers";

// Lead search configuration interface
interface LeadSearchConfig {
  searchName: string;
  searchObjective: string;
  selectedSources: string[];
  industry: string;
  location: string;
  companySize?: string;
  jobTitles: string[];
  keywords?: string;
  includeEmails: boolean;
  includePhones: boolean;
  includeLinkedIn: boolean;
  validationCriteria?: {
    mustHaveWebsite: boolean;
    mustHaveContactInfo: boolean;
    mustHaveSpecificKeywords: string[];
    mustBeInIndustry: boolean;
    customValidationRules: string;
  };
}

// Create a new lead search
export const createLeadSearch = action({
  args: {
    userId: v.string(),
    searchConfig: v.object({
      searchName: v.string(),
      searchObjective: v.string(),
      selectedSources: v.array(v.string()),
      industry: v.string(),
      location: v.string(),
      companySize: v.optional(v.string()),
      jobTitles: v.array(v.string()),
      keywords: v.optional(v.string()),
      includeEmails: v.boolean(),
      includePhones: v.boolean(),
      includeLinkedIn: v.boolean(),
      validationCriteria: v.optional(v.object({
        mustHaveWebsite: v.boolean(),
        mustHaveContactInfo: v.boolean(),
        mustHaveSpecificKeywords: v.array(v.string()),
        mustBeInIndustry: v.boolean(),
        customValidationRules: v.string(),
      })),
    }),
  },
  handler: async (ctx, { userId, searchConfig }) => {
    // Get user subscription and check limits
    let subscription = await ctx.runMutation(internal.rateLimitHelpers.getUserSubscription, { userId });
    if (!subscription) {
      // Create a default free subscription for testing
      console.log("No subscription found, creating default free subscription for user:", userId);
      subscription = await ctx.runMutation(internal.rateLimitHelpers.getUserSubscription, { userId });
      if (!subscription) {
        throw new Error("Failed to create user subscription");
      }
    }

    // NEW: Reset usage counters before checking limits
    await ctx.runMutation(internal.rateLimitHelpers.resetUsageCountersIfNeeded, { userId });

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(ctx, userId, "leadSearch", subscription.tier as any);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error);
    }

    // Check subscription limits (this is now a safe read-only query)
    const limitsCheck = await ctx.runQuery(internal.rateLimitHelpers.checkSubscriptionLimits, {
      userId,
      feature: "search",
      additionalLeads: subscription.leadsPerSearch,
    });

    if (!limitsCheck.allowed) {
      throw new Error(limitsCheck.error);
    }

    // Check if premium features are being used
    const premiumSources = ["database", "directory"];
    const usingPremiumSources = searchConfig.selectedSources.some(source => 
      premiumSources.includes(source)
    );

    if (usingPremiumSources && subscription.tier === "free") {
      throw new Error("Premium data sources require a paid subscription");
    }

    if (searchConfig.includeLinkedIn && subscription.tier === "free") {
      throw new Error("LinkedIn data requires a premium subscription");
    }

    // Generate unique search ID
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Create search record
    await ctx.runMutation(internal.hunterMutations.createLeadSearch, {
      searchId,
      userId,
      searchConfig,
    });

    // Increment usage for this search
    await ctx.runMutation(internal.rateLimitHelpers.incrementUsage, {
      userId,
      feature: "search",
    });

    // Start the search process
    try {
      await initiateBackendSearch(ctx, searchId, searchConfig, userId);
    } catch (error: any) {
      // Update search status to failed
      await ctx.runMutation(internal.hunterMutations.updateSearchStatus, {
        searchId,
        status: "failed",
        error: error.message || "Failed to initiate search",
      });
      throw error;
    }

    return {
      searchId,
      status: "initializing",
      message: "Search initiated successfully",
    };
  },
});

// Initiate backend search using Jina Reader integration
async function initiateBackendSearch(
  ctx: any,
  searchId: string,
  searchConfig: LeadSearchConfig,
  userId: string
) {
  // Update status to initializing
  await ctx.runMutation(internal.hunterMutations.updateSearchProgress, {
    searchId,
    progress: 10,
    currentStage: "Initializing search...",
  });

  // Prepare search payload for backend (matching LeadSearchRequest model)
  const searchPayload = {
    search_id: searchId,
    user_id: userId,
    search_config: {
      searchName: searchConfig.searchName,
      searchObjective: searchConfig.searchObjective,
      selectedSources: searchConfig.selectedSources,
      industry: searchConfig.industry,
      location: searchConfig.location,
      companySize: searchConfig.companySize,
      jobTitles: searchConfig.jobTitles,
      keywords: searchConfig.keywords,
      includeEmails: searchConfig.includeEmails,
      includePhones: searchConfig.includePhones,
      includeLinkedIn: searchConfig.includeLinkedIn,
      validationCriteria: searchConfig.validationCriteria,
    },
  };

  // Call backend LeadGen service
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
  
  let result;
  try {
    const response = await fetch(`${backendUrl}/api/public/hunter/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend search failed: ${errorText}`);
    }

    result = await response.json();
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error;
  }
  
  // Update search status
  await ctx.runMutation(internal.hunterMutations.updateSearchProgress, {
    searchId,
    progress: 20,
    currentStage: "Search submitted to processing pipeline",
  });

  return result;
}

// Get search status and progress
export const getSearchStatus = action({
  args: { searchId: v.string() },
  handler: async (ctx, { searchId }) => {
    const search = await ctx.runQuery(internal.hunterQueries.getLeadSearch, { searchId });
    
    if (!search) {
      throw new Error("Search not found");
    }

    // If search is completed, get results summary
    if (search.status === "completed") {
      const resultsCount = await ctx.runQuery(internal.hunterQueries.getSearchResultsCount, { searchId });
      
      return {
        ...search,
        resultsCount,
      };
    }

    return search;
  },
});

// Get search results with pagination
export const getSearchResults = action({
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
    // Verify user has access to this search
    const search = await ctx.runQuery(internal.hunterQueries.getLeadSearch, { searchId });
    if (!search) {
      throw new Error("Search not found");
    }

    const results = await ctx.runQuery(internal.hunterQueries.getSearchResults, {
      searchId,
      limit,
      offset,
      filters,
    });

    return {
      results,
      total: search.totalLeads || 0,
      hasMore: offset + limit < (search.totalLeads || 0),
    };
  },
});

// Export search results
export const exportSearchResults = action({
  args: {
    userId: v.string(),
    searchId: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("xlsx")),
    fields: v.array(v.string()),
    filters: v.optional(v.object({
      emailVerified: v.optional(v.boolean()),
      phoneVerified: v.optional(v.boolean()),
      minConfidence: v.optional(v.number()),
      dataSources: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, { userId, searchId, format, fields, filters }) => {
    // Check if user has export permissions
    const subscription = await ctx.runQuery(internal.hunterQueries.getUserSubscription, { userId });
    if (!subscription) {
      throw new Error("User subscription not found");
    }

    if (subscription.tier === "free") {
      throw new Error("Export feature requires a premium subscription");
    }

    // Check rate limits for exports
    const rateLimitCheck = await checkRateLimit(ctx, userId, "leadExport", subscription.tier as any);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error);
    }

    // Verify user owns this search
    const search = await ctx.runQuery(internal.hunterQueries.getLeadSearch, { searchId });
    if (!search || search.userId !== userId) {
      throw new Error("Search not found or access denied");
    }

    // Generate export ID
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Create export job
    await ctx.runMutation(internal.hunterMutations.createExportJob, {
      exportId,
      userId,
      searchId,
      format,
      fields,
      filters,
    });

    // Trigger export processing
    await processExportJob(ctx, exportId);

    return {
      exportId,
      status: "processing",
      message: "Export job created successfully",
    };
  },
});

// Process export job
async function processExportJob(ctx: any, exportId: string) {
  // This would typically call a backend service to generate the export file
  // For now, we'll simulate the process
  
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
  
  try {
    const response = await fetch(`${backendUrl}/api/hunter/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({ export_id: exportId }),
    });

    if (!response.ok) {
      await ctx.runMutation(internal.hunterMutations.updateExportStatus, {
        exportId,
        status: "failed",
        error: "Export processing failed",
      });
      throw new Error("Export processing failed");
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    // Ensure export status is updated even if there's an error
    await ctx.runMutation(internal.hunterMutations.updateExportStatus, {
      exportId,
      status: "failed",
      error: error.message || "Export processing failed",
    });
    throw error;
  }
}

// Get user's search history
export const getSearchHistory = action({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20, offset = 0 }) => {
    const searches = await ctx.runQuery(internal.hunterQueries.getUserSearchHistory, {
      userId,
      limit,
      offset,
    });

    return searches;
  },
});

// Delete a search and its results
export const deleteSearch = action({
  args: {
    userId: v.string(),
    searchId: v.string(),
  },
  handler: async (ctx, { userId, searchId }) => {
    // Verify ownership
    const search = await ctx.runQuery(internal.hunterQueries.getLeadSearch, { searchId });
    if (!search || search.userId !== userId) {
      throw new Error("Search not found or access denied");
    }

    // Delete search and all related data
    await ctx.runMutation(internal.hunterMutations.deleteSearch, { searchId });

    return { success: true, message: "Search deleted successfully" };
  },
});

// Webhook endpoint for backend to update search progress
export const updateSearchProgress = action({
  args: {
    searchId: v.string(),
    progress: v.number(),
    currentStage: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    results: v.optional(v.object({
      totalLeads: v.number(),
      verifiedEmails: v.number(),
      verifiedPhones: v.number(),
      businessWebsites: v.number(),
      avgResponseRate: v.string(),
      searchTime: v.string(),
    })),
    error: v.optional(v.string()),
    authKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify API key only if configured; allow missing key in dev when not set
    const requiredKey = process.env.API_KEY;
    if (requiredKey && args.authKey !== requiredKey) {
      throw new Error("API key invalid");
    }

    // Update search progress
    await ctx.runMutation(internal.hunterMutations.updateSearchProgress, {
      searchId: args.searchId,
      progress: args.progress,
      currentStage: args.currentStage,
    });

    // If status is provided, update it
    if (args.status) {
      await ctx.runMutation(internal.hunterMutations.updateSearchStatus, {
        searchId: args.searchId,
        status: args.status,
        error: args.error,
      });
    }

    // If results are provided, update them
    if (args.results) {
      await ctx.runMutation(internal.hunterMutations.updateSearchResults, {
        searchId: args.searchId,
        results: args.results,
      });

      // Update user's monthly lead count
      if (args.results.totalLeads > 0) {
        const search = await ctx.runQuery(internal.hunterQueries.getLeadSearch, { 
          searchId: args.searchId 
        });
        
        if (search) {
          await ctx.runMutation(internal.rateLimitHelpers.incrementUsage, {
            userId: search.userId,
            feature: "search",
            leadsCount: args.results.totalLeads,
          });
        }
      }
    }

    return { success: true };
  },
});

// Store lead results from backend
export const storeLeadResults = mutation({
  args: {
    searchId: v.string(),
    leads: v.array(v.object({
      leadId: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      linkedInUrl: v.optional(v.string()),
      websiteUrl: v.optional(v.string()),
      companyName: v.optional(v.string()),
      companySize: v.optional(v.string()),
      industry: v.optional(v.string()),
      location: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      department: v.optional(v.string()),
      seniority: v.optional(v.string()),
      emailVerified: v.boolean(),
      phoneVerified: v.boolean(),
      confidence: v.number(),
      dataSource: v.string(),
    })),
  },
  handler: async (ctx, { searchId, leads }) => {
    // Store lead results in batches
    const batchSize = 100;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      await ctx.runMutation(internal.hunterMutations.storeLeadResults, {
        searchId,
        leads: batch,
      });
    }

    return { 
      success: true, 
      message: `Stored ${leads.length} leads for search ${searchId}` 
    };
  },
});
