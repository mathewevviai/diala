import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// Backend API configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Initialize rate limiter
const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Allow 100 transcript requests per hour per user
  transcriptFetch: { kind: "token bucket", rate: 100, period: HOUR, capacity: 10 },
});

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

export const fetchYoutubeTranscript = action({
  args: {
    youtubeUrl: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    try {
      await rateLimiter.limit(ctx, "transcriptFetch", { 
        key: args.userId, 
        throws: true 
      });
    } catch (error) {
      throw new Error("Rate limit exceeded. You can fetch up to 100 transcripts per hour.");
    }

    // Extract video ID
    const videoId = extractVideoId(args.youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // Check if transcript already exists
    const existingTranscript = await ctx.runQuery(
      internal.youtubeTranscripts.getTranscriptByVideoId, 
      { videoId }
    );
    
    if (existingTranscript) {
      return {
        jobId: `cached-${videoId}`,
        status: "completed",
        transcript: existingTranscript.transcript,
        cached: true,
      };
    }

    // Create a new job
    const jobId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await ctx.runMutation(internal.youtubeTranscripts.createJob, {
      jobId,
      userId: args.userId,
      youtubeUrl: args.youtubeUrl,
      videoId,
    });

    // Call Python backend to fetch transcript
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/youtube/transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobId,
          youtube_url: args.youtubeUrl,
          user_id: args.userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start transcript fetch");
      }

      return {
        jobId,
        status: "processing",
        cached: false,
      };
    } catch (error) {
      // Update job status to failed
      await ctx.runMutation(internal.youtubeTranscripts.updateJobStatus, {
        jobId,
        status: "failed",
        error: error.message || "Failed to fetch transcript",
      });

      throw new Error("Failed to fetch transcript: " + error.message);
    }
  },
});

export const getJobStatus = action({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    // Handle cached job IDs
    if (args.jobId.startsWith("cached-")) {
      const videoId = args.jobId.replace("cached-", "");
      const transcript = await ctx.runQuery(
        internal.youtubeTranscripts.getTranscriptByVideoId,
        { videoId }
      );
      
      if (transcript) {
        return {
          status: "completed",
          transcript: transcript.transcript,
          wordCount: transcript.wordCount,
        };
      }
    }

    // Get job from database
    const job = await ctx.runQuery(internal.youtubeTranscripts.getJob, {
      jobId: args.jobId,
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status === "completed") {
      const transcript = await ctx.runQuery(
        internal.youtubeTranscripts.getTranscriptByVideoId,
        { videoId: job.videoId }
      );
      
      return {
        status: job.status,
        transcript: transcript?.transcript,
        wordCount: transcript?.wordCount,
        videoTitle: transcript?.videoTitle || job.videoTitle,
        videoAuthor: transcript?.videoAuthor || job.videoAuthor,
        videoDuration: transcript?.videoDuration,
      };
    }

    return {
      status: job.status,
      error: job.error,
    };
  },
});