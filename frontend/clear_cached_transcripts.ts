// Script to clear cached transcripts with placeholder text
import { components } from "./convex/_generated/api";

// Run this script to clear cached transcripts
// npx convex run clearCachedTranscripts

export default async function clearCachedTranscripts(ctx: any) {
  // Get all transcripts with placeholder text
  const transcripts = await ctx.db
    .query("youtubeTranscripts")
    .filter((q) => q.eq(q.field("transcript"), "Transcript functionality requires subtitle file parsing implementation"))
    .collect();

  console.log(`Found ${transcripts.length} cached transcripts with placeholder text`);

  // Delete these cached transcripts
  for (const transcript of transcripts) {
    await ctx.db.delete(transcript._id);
    console.log(`Deleted cached transcript for video: ${transcript.videoId}`);
  }

  // Also clear any failed jobs
  const failedJobs = await ctx.db
    .query("transcriptJobs")
    .filter((q) => q.eq(q.field("status"), "failed"))
    .collect();

  for (const job of failedJobs) {
    await ctx.db.delete(job._id);
    console.log(`Deleted failed job: ${job.jobId}`);
  }

  return { 
    message: `Cleared ${transcripts.length} cached transcripts and ${failedJobs.length} failed jobs`,
    clearedTranscripts: transcripts.map(t => t.videoId),
    clearedJobs: failedJobs.map(j => j.jobId)
  };
}