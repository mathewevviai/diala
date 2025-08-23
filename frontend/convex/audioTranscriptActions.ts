import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Process audio transcription
export const processTranscription = action({
  args: {
    jobId: v.string(),
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileFormat: v.string(),
    language: v.optional(v.string()),
    prompt: v.optional(v.string()),
    audioData: v.string(), // Base64 encoded audio data
  },
  handler: async (ctx, args) => {
    try {
      // Create job in database
      await ctx.runMutation(api.mutations.audioTranscripts.createJob, {
        jobId: args.jobId,
        userId: args.userId,
        fileName: args.fileName,
        fileSize: args.fileSize,
        fileFormat: args.fileFormat,
        language: args.language,
        prompt: args.prompt,
      });
      
      // Update status to processing
      await ctx.runMutation(api.mutations.audioTranscripts.updateJobStatus, {
        jobId: args.jobId,
        status: "processing",
      });
      
      // Call backend API
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      
      // Convert base64 to blob
      const base64Data = args.audioData.split(',')[1] || args.audioData;
      const binaryData = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([uint8Array], { type: `audio/${args.fileFormat}` });
      
      formData.append("file", blob, args.fileName);
      formData.append("job_id", args.jobId);
      formData.append("user_id", args.userId);
      if (args.language) {
        formData.append("language", args.language);
      }
      if (args.prompt) {
        formData.append("prompt", args.prompt);
      }
      
      const response = await fetch(`${backendUrl}/api/public/audio/transcribe`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Backend response:", result);
      
      return { success: true, jobId: args.jobId };
      
    } catch (error) {
      console.error("Error processing transcription:", error);
      
      // Update job status to failed
      await ctx.runMutation(api.mutations.audioTranscripts.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },
});

// Create transcription job without audio data (for direct file upload)
export const createTranscriptionJob = action({
  args: {
    jobId: v.string(),
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileFormat: v.string(),
    language: v.optional(v.string()),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    const canCreate = await ctx.runQuery(api.queries.audioTranscripts.canCreateTranscription, {
      userId: args.userId,
    });
    
    if (!canCreate.canCreate) {
      throw new Error(`Rate limit exceeded. You have ${canCreate.remaining} transcriptions remaining. Resets at ${canCreate.resetAt}`);
    }
    
    // Create job in database
    await ctx.runMutation(api.mutations.audioTranscripts.createJob, args);
    
    return { success: true, jobId: args.jobId };
  },
});