import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Query to find web documents with empty or invalid content
 */
export const findEmptyWebDocuments = query({
  args: { workflowId: v.string() },
  handler: async (ctx, { workflowId }) => {
    const documents = await ctx.db
      .query("webDocuments")
      .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
      .collect();

    const emptyDocs = documents.filter(doc => 
      !doc.content || doc.content.trim().length === 0 || 
      doc.content.trim() === "Untitled" ||
      doc.metadata.wordCount === 0
    );

    return emptyDocs.map(doc => ({
      id: doc._id,
      url: doc.url,
      title: doc.title,
      contentLength: doc.content?.length || 0,
      wordCount: doc.metadata.wordCount,
      status: doc.status
    }));
  },
});

/**
 * Mutation to delete empty web documents
 */
export const deleteEmptyWebDocuments = mutation({
  args: { workflowId: v.string() },
  handler: async (ctx, { workflowId }) => {
    const emptyDocs = await ctx.runQuery(internal.cleanupWebDocuments.findEmptyWebDocuments, {
      workflowId
    });

    let deletedCount = 0;
    for (const doc of emptyDocs) {
      await ctx.db.delete(doc.id);
      deletedCount++;
    }

    return { deletedCount, totalEmpty: emptyDocs.length };
  },
});

/**
 * Action to reprocess web documents with better content extraction
 */
export const reprocessWebDocuments = action({
  args: { workflowId: v.string(), userId: v.string() },
  handler: async (ctx, { workflowId, userId }) => {
    const emptyDocs = await ctx.runQuery(internal.cleanupWebDocuments.findEmptyWebDocuments, {
      workflowId
    });

    const urls = emptyDocs.map(doc => doc.url);
    
    if (urls.length === 0) {
      return { success: true, message: "No empty documents to reprocess", reprocessed: 0 };
    }

    console.log(`[Reprocess] Reprocessing ${urls.length} empty documents`);

    // Delete existing empty documents
    await ctx.runMutation(internal.cleanupWebDocuments.deleteEmptyWebDocuments, {
      workflowId
    });

    // Reprocess URLs
    const result = await ctx.runAction(internal.ragActions.processWebUrlsBatch, {
      urls,
      workflowId,
      userId,
    });

    return {
      success: true,
      reprocessed: result.successful,
      failed: result.failed,
      total: urls.length,
      results: result.results
    };
  },
});