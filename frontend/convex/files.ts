// frontend/convex/files.ts
import { action } from "./_generated/server";

/**
 * Generates a short-lived upload URL for the client to upload a file to.
 * The client will then use this URL to POST the file content.
 */
export const generateUploadUrl = action(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
