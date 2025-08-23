import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new lead search
export const createLeadSearch = internalMutation({
  args: {
    searchId: v.string(),
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
  handler: async (ctx, { searchId, userId, searchConfig }) => {
    const now = new Date().toISOString();
    
    // Get user subscription to determine tier
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const userTier = subscription?.tier || "free";
    
    // Calculate expiry date for free tier (7 days)
    let expiresAt = undefined;
    if (userTier === "free") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      expiresAt = expiryDate.toISOString();
    }
    
    await ctx.db.insert("leadSearches", {
      searchId,
      userId,
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
      status: "pending",
      progress: 0,
      createdAt: now,
      updatedAt: now,
      userTier,
      expiresAt,
    });
  },
});



// Update search progress
export const updateSearchProgress = internalMutation({
  args: {
    searchId: v.string(),
    progress: v.number(),
    currentStage: v.optional(v.string()),
  },
  handler: async (ctx, { searchId, progress, currentStage }) => {
    const search = await ctx.db
      .query("leadSearches")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .first();

    if (!search) {
      console.warn(`Search ${searchId} not found, creating placeholder...`);
      // Create a minimal search record with default values
      const now = new Date().toISOString();
      await ctx.db.insert("leadSearches", {
        searchId,
        userId: "unknown", // Will be updated when proper creation happens
        searchName: "Search " + searchId,
        searchObjective: "Auto-created search",
        selectedSources: ["web"],
        industry: "Unknown",
        location: "Unknown",
        jobTitles: [],
        includeEmails: true,
        includePhones: true,
        includeLinkedIn: false,
        status: "processing",
        progress: 0,
        createdAt: now,
        updatedAt: now,
      });
      
      // Get the newly created search
      const newSearch = await ctx.db
        .query("leadSearches")
        .withIndex("by_search", (q) => q.eq("searchId", searchId))
        .first();
      
      if (!newSearch) {
        throw new Error("Failed to create search record");
      }
      
      // Continue with the update using the new record
      const updates: any = {
        progress,
        updatedAt: new Date().toISOString(),
      };

      if (currentStage) {
        updates.currentStage = currentStage;
      }

      // Auto-update status based on progress
      if (progress >= 100) {
        updates.status = "completed";
        updates.completedAt = new Date().toISOString();
      } else if (progress > 0 && newSearch.status === "pending") {
        updates.status = "processing";
      }

      await ctx.db.patch(newSearch._id, updates);
      return;
    }

    const updates: any = {
      progress,
      updatedAt: new Date().toISOString(),
    };

    if (currentStage) {
      updates.currentStage = currentStage;
    }

    // Auto-update status based on progress
    if (progress >= 100) {
      updates.status = "completed";
      updates.completedAt = new Date().toISOString();
    } else if (progress > 0 && search.status === "pending") {
      updates.status = "processing";
    }

    await ctx.db.patch(search._id, updates);
  },
});

// Update search status
export const updateSearchStatus = internalMutation({
  args: {
    searchId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("initializing"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { searchId, status, error }) => {
    const search = await ctx.db
      .query("leadSearches")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .first();

    if (!search) {
      console.warn(`Search ${searchId} not found, creating placeholder...`);
      // Create a minimal search record with default values
      const now = new Date().toISOString();
      await ctx.db.insert("leadSearches", {
        searchId,
        userId: "unknown", // Will be updated when proper creation happens
        searchName: "Search " + searchId,
        searchObjective: "Auto-created search",
        selectedSources: ["web"],
        industry: "Unknown",
        location: "Unknown",
        jobTitles: [],
        includeEmails: true,
        includePhones: true,
        includeLinkedIn: false,
        status: "processing",
        progress: 0,
        createdAt: now,
        updatedAt: now,
      });
      
      // Get the newly created search
      const newSearch = await ctx.db
        .query("leadSearches")
        .withIndex("by_search", (q) => q.eq("searchId", searchId))
        .first();
      
      if (!newSearch) {
        throw new Error("Failed to create search record");
      }
      
      // Continue with the update using the new record
      const updates: any = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (error) {
        updates.error = error;
      }

      if (status === "completed") {
        updates.completedAt = new Date().toISOString();
        updates.progress = 100;
      } else if (status === "failed") {
        updates.completedAt = new Date().toISOString();
      }

      await ctx.db.patch(newSearch._id, updates);
      return;
    }

    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (error) {
      updates.error = error;
    }

    if (status === "completed") {
      updates.completedAt = new Date().toISOString();
      updates.progress = 100;
    } else if (status === "failed") {
      updates.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(search._id, updates);
  },
});

// Update search results summary
export const updateSearchResults = internalMutation({
  args: {
    searchId: v.string(),
    results: v.object({
      totalLeads: v.number(),
      verifiedEmails: v.number(),
      verifiedPhones: v.number(),
      businessWebsites: v.number(),
      avgResponseRate: v.string(),
      searchTime: v.string(),
    }),
  },
  handler: async (ctx, { searchId, results }) => {
    const search = await ctx.db
      .query("leadSearches")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .first();

    if (!search) {
      console.warn(`Search ${searchId} not found, creating placeholder for results update...`);
      // Create a minimal search record with default values
      const now = new Date().toISOString();
      await ctx.db.insert("leadSearches", {
        searchId,
        userId: "unknown", // Will be updated when proper creation happens
        searchName: "Search " + searchId,
        searchObjective: "Auto-created search",
        selectedSources: ["web"],
        industry: "Unknown",
        location: "Unknown",
        jobTitles: [],
        includeEmails: true,
        includePhones: true,
        includeLinkedIn: false,
        status: "completed", // Set to completed since we're updating results
        progress: 100,
        createdAt: now,
        updatedAt: now,
      });
      
      // Get the newly created search
      const newSearch = await ctx.db
        .query("leadSearches")
        .withIndex("by_search", (q) => q.eq("searchId", searchId))
        .first();
      
      if (!newSearch) {
        throw new Error("Failed to create search record for results update");
      }
      
      // Continue with the update using the new record
      await ctx.db.patch(newSearch._id, {
        totalLeads: results.totalLeads,
        verifiedEmails: results.verifiedEmails,
        verifiedPhones: results.verifiedPhones,
        businessWebsites: results.businessWebsites,
        avgResponseRate: results.avgResponseRate,
        searchTime: results.searchTime,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await ctx.db.patch(search._id, {
      totalLeads: results.totalLeads,
      verifiedEmails: results.verifiedEmails,
      verifiedPhones: results.verifiedPhones,
      businessWebsites: results.businessWebsites,
      avgResponseRate: results.avgResponseRate,
      searchTime: results.searchTime,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Store lead search results
export const storeLeadResults = internalMutation({
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
    const now = new Date().toISOString();
    
    // Store each lead result
    for (const lead of leads) {
      // Check if lead already exists to avoid duplicates
      const existingLead = await ctx.db
        .query("leadSearchResults")
        .withIndex("by_lead", (q) => q.eq("leadId", lead.leadId))
        .first();

      if (!existingLead) {
        await ctx.db.insert("leadSearchResults", {
          searchId,
          leadId: lead.leadId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          linkedInUrl: lead.linkedInUrl,
          websiteUrl: lead.websiteUrl,
          companyName: lead.companyName,
          companySize: lead.companySize,
          industry: lead.industry,
          location: lead.location,
          jobTitle: lead.jobTitle,
          department: lead.department,
          seniority: lead.seniority,
          emailVerified: lead.emailVerified,
          phoneVerified: lead.phoneVerified,
          confidence: lead.confidence,
          dataSource: lead.dataSource,
          extractedAt: now,
          lastUpdated: now,
        });
      }
    }
  },
});

// Create export job
export const createExportJob = internalMutation({
  args: {
    exportId: v.string(),
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
  handler: async (ctx, { exportId, userId, searchId, format, fields, filters }) => {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await ctx.db.insert("leadExportJobs", {
      exportId,
      userId,
      searchId,
      format,
      fields,
      filters,
      status: "pending",
      progress: 0,
      createdAt: now,
      expiresAt,
    });
  },
});

// Update export job status
export const updateExportStatus = internalMutation({
  args: {
    exportId: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()),
    recordCount: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const exportJob = await ctx.db
      .query("leadExportJobs")
      .withIndex("by_export", (q) => q.eq("exportId", args.exportId))
      .first();

    if (!exportJob) {
      throw new Error("Export job not found");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.progress !== undefined) {
      updates.progress = args.progress;
    }

    if (args.recordCount !== undefined) {
      updates.recordCount = args.recordCount;
    }

    if (args.fileUrl) {
      updates.fileUrl = args.fileUrl;
    }

    if (args.fileSize !== undefined) {
      updates.fileSize = args.fileSize;
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.status === "completed") {
      updates.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(exportJob._id, updates);
  },
});

// Delete a search and all its related data
export const deleteSearch = internalMutation({
  args: { searchId: v.string() },
  handler: async (ctx, { searchId }) => {
    // Delete search record
    const search = await ctx.db
      .query("leadSearches")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .first();

    if (search) {
      await ctx.db.delete(search._id);
    }

    // Delete all lead results for this search
    const results = await ctx.db
      .query("leadSearchResults")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .collect();

    for (const result of results) {
      await ctx.db.delete(result._id);
    }

    // Delete any export jobs for this search
    const exportJobs = await ctx.db
      .query("leadExportJobs")
      .withIndex("by_search", (q) => q.eq("searchId", searchId))
      .collect();

    for (const job of exportJobs) {
      await ctx.db.delete(job._id);
    }
  },
});

// Update user subscription
export const updateUserSubscription = internalMutation({
  args: {
    userId: v.string(),
    tier: v.union(v.literal("free"), v.literal("premium"), v.literal("enterprise")),
    subscriptionId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired"),
      v.literal("trial")
    )),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, { userId, tier, subscriptionId, status, expiresAt }) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tierLimits = {
      free: { searchesPerDay: 5, leadsPerSearch: 50, totalLeadsPerMonth: 250 },
      premium: { searchesPerDay: 100, leadsPerSearch: 500, totalLeadsPerMonth: 50000 },
      enterprise: { searchesPerDay: -1, leadsPerSearch: -1, totalLeadsPerMonth: -1 },
    };

    const limits = tierLimits[tier];
    const now = new Date().toISOString();

    if (subscription) {
      // Update existing subscription
      const updates: any = {
        tier,
        searchesPerDay: limits.searchesPerDay,
        leadsPerSearch: limits.leadsPerSearch,
        totalLeadsPerMonth: limits.totalLeadsPerMonth,
        updatedAt: now,
      };

      if (subscriptionId) updates.subscriptionId = subscriptionId;
      if (status) updates.status = status;
      if (expiresAt) updates.expiresAt = expiresAt;

      await ctx.db.patch(subscription._id, updates);
    } else {
      // Create new subscription
      await ctx.db.insert("userSubscriptions", {
        userId,
        tier,
        searchesPerDay: limits.searchesPerDay,
        leadsPerSearch: limits.leadsPerSearch,
        totalLeadsPerMonth: limits.totalLeadsPerMonth,
        searchesToday: 0,
        leadsThisMonth: 0,
        lastResetDate: now,
        subscriptionId,
        status: status || "active",
        createdAt: now,
        updatedAt: now,
        expiresAt,
      });
    }
  },
});

// Cleanup expired export jobs
export const cleanupExpiredExports = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    const expiredJobs = await ctx.db
      .query("leadExportJobs")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const job of expiredJobs) {
      await ctx.db.delete(job._id);
    }

    return { deletedJobs: expiredJobs.length };
  },
});

// Reset daily usage counters
export const resetDailyUsage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allSubscriptions = await ctx.db
      .query("userSubscriptions")
      .collect();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    for (const subscription of allSubscriptions) {
      const lastReset = new Date(subscription.lastResetDate);
      const lastResetDate = lastReset.toISOString().split('T')[0];

      if (today !== lastResetDate) {
        await ctx.db.patch(subscription._id, {
          searchesToday: 0,
          lastResetDate: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    }
  },
});

// Update lead verification status
export const updateLeadVerification = internalMutation({
  args: {
    leadId: v.string(),
    emailVerified: v.optional(v.boolean()),
    phoneVerified: v.optional(v.boolean()),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, { leadId, emailVerified, phoneVerified, confidence }) => {
    const lead = await ctx.db
      .query("leadSearchResults")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .first();

    if (!lead) {
      throw new Error("Lead not found");
    }

    const updates: any = {
      lastUpdated: new Date().toISOString(),
    };

    if (emailVerified !== undefined) {
      updates.emailVerified = emailVerified;
    }

    if (phoneVerified !== undefined) {
      updates.phoneVerified = phoneVerified;
    }

    if (confidence !== undefined) {
      updates.confidence = confidence;
    }

    await ctx.db.patch(lead._id, updates);
  },
});