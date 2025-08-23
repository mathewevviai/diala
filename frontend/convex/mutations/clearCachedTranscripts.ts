import { mutation } from "../_generated/server";

export const clearCachedTranscripts = mutation({
  handler: async (ctx) => {
    // Get all transcripts with placeholder text
    const transcripts = await ctx.db
      .query("youtubeTranscripts")
      .collect();

    let clearedCount = 0;
    
    // Delete transcripts with placeholder text
    for (const transcript of transcripts) {
      if (transcript.transcript === "Transcript functionality requires subtitle file parsing implementation") {
        await ctx.db.delete(transcript._id);
        clearedCount++;
      }
    }

    return { 
      message: `Cleared ${clearedCount} cached transcripts with placeholder text`,
    };
  },
});