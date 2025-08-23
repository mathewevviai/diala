import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

// HTTP endpoint for updating search progress
export const updateSearchProgress = httpAction(async (ctx, request) => {
  const data = await request.json();
  
  try {
    await ctx.runMutation(internal.hunterMutations.updateSearchProgress, {
      searchId: data.searchId,
      progress: data.progress,
      currentStage: data.currentStage,
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating search progress:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// HTTP endpoint for updating search status
export const updateSearchStatus = httpAction(async (ctx, request) => {
  const data = await request.json();
  
  try {
    await ctx.runMutation(internal.hunterMutations.updateSearchStatus, {
      searchId: data.searchId,
      status: data.status,
      error: data.error,
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating search status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// HTTP endpoint for updating search results
export const updateSearchResults = httpAction(async (ctx, request) => {
  const data = await request.json();
  
  try {
    await ctx.runMutation(internal.hunterMutations.updateSearchResults, {
      searchId: data.searchId,
      results: data.results,
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating search results:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});