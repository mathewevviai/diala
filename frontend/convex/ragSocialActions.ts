import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Backend API configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Process social media content using yt-dlp (aligned with bulk/cloning flows)
export const processSocialMediaContent = action({
  args: {
    workflowId: v.string(),
    userId: v.string(),
    sources: v.array(v.object({
      type: v.union(v.literal("youtube"), v.literal("tiktok"), v.literal("twitch")),
      value: v.string(), // URL or username
      metadata: v.optional(v.any()),
    })),
    config: v.object({
      chunkSize: v.number(),
      overlap: v.number(),
      embeddingModel: v.string(),
    }),
  },
  handler: async (ctx, { workflowId, userId, sources, config }) => {
    try {
      console.log(`[RAG Social] Starting social media processing workflow`);
      console.log(`[RAG Social] Workflow ID: ${workflowId}`);
      console.log(`[RAG Social] User ID: ${userId}`);
      console.log(`[RAG Social] Total sources: ${sources.length}`);
      console.log(`[RAG Social] Config: ${JSON.stringify(config)}`);

      // Update workflow status
      await ctx.runMutation(internal.ragMutations.updateWorkflowStatus, {
        workflowId,
        status: "processing",
        progress: 10,
        currentStage: "Initializing social media processing...",
      });

      let processedSources = 0;
      const totalSources = sources.length;

      for (const source of sources) {
        try {
          console.log(`[RAG Social] Processing source ${processedSources + 1}/${totalSources}`);
          console.log(`[RAG Social] Source type: ${source.type}`);
          console.log(`[RAG Social] Source value: ${source.value}`);

          const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2)}`;
          
          // Update progress
          const progress = 10 + (processedSources / totalSources) * 30;
          await ctx.runMutation(internal.ragMutations.updateWorkflowStatus, {
            workflowId,
            status: "processing",
            progress,
            currentStage: `Processing ${source.type} content...`,
          });

          // Extract content based on platform using yt-dlp
          let content = "";
          let metadata = {};

          if (source.type === "youtube") {
            console.log(`[RAG Social] Fetching YouTube transcript for: ${source.value}`);
            const result = await fetchYouTubeTranscriptWithYtdlp(source.value);
            content = result.transcript;
            metadata = result.metadata;
            console.log(`[RAG Social] YouTube content length: ${content.length} chars`);
          } else if (source.type === "tiktok") {
            console.log(`[RAG Social] Fetching TikTok content for: ${source.value}`);
            const result = await fetchTikTokContentWithYtdlp(source.value);
            content = result.content;
            metadata = result.metadata;
            console.log(`[RAG Social] TikTok content length: ${content.length} chars`);
          } else if (source.type === "twitch") {
            console.log(`[RAG Social] Fetching Twitch content for: ${source.value}`);
            const result = await fetchTwitchContentWithYtdlp(source.value);
            content = result.content;
            metadata = result.metadata;
            console.log(`[RAG Social] Twitch content length: ${content.length} chars`);
          }

          // Create source record
          console.log(`[RAG Social] Creating source record: ${sourceId}`);
          await ctx.runMutation(internal.ragMutations.createSource, {
            sourceId,
            workflowId,
            userId,
            sourceType: `${source.type}_video`,
            sourceUrl: source.value,
            metadata,
          });

          // Update source with content
          console.log(`[RAG Social] Updating source with content: ${sourceId}`);
          await ctx.runMutation(internal.ragMutations.updateSourceContent, {
            sourceId,
            content,
            metadata,
          });

          // Chunk and process
          console.log(`[RAG Social] Chunking content with size: ${config.chunkSize}, overlap: ${config.overlap}`);
          const chunks = chunkText(content, config.chunkSize, config.overlap);
          console.log(`[RAG Social] Generated ${chunks.length} chunks`);
          
          // Generate embeddings
          console.log(`[RAG Social] Generating embeddings with model: ${config.embeddingModel}`);
          const embeddings = await generateEmbeddings(chunks, config.embeddingModel);
          console.log(`[RAG Social] Generated ${embeddings.length} embeddings`);

          // Store embeddings
          console.log(`[RAG Social] Storing embeddings in database`);
          for (let i = 0; i < chunks.length; i++) {
            const embeddingId = `emb_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            await ctx.runMutation(internal.ragMutations.storeEmbedding, {
              embeddingId,
              workflowId,
              sourceId,
              userId,
              chunkIndex: i,
              chunkText: chunks[i],
              chunkTokens: chunks[i].split(' ').length,
              embedding: embeddings[i],
              embeddingModel: config.embeddingModel,
              dimensions: embeddings[i].length,
            });
          }

          processedSources++;
          console.log(`[RAG Social] Completed processing source ${processedSources}/${totalSources}`);

        } catch (error) {
          console.error(`[RAG Social] Error processing ${source.type} source:`, error);
          // Continue with next source
        }
      }

      // Complete workflow
      await ctx.runMutation(internal.ragMutations.updateWorkflowStatus, {
        workflowId,
        status: "completed",
        progress: 100,
        currentStage: "Processing completed!",
      });

      return {
        success: true,
        workflowId,
        processedSources,
        totalSources,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Social media processing failed";
      console.error("[RAG Social] Processing failed:", error);
      await ctx.runMutation(internal.ragMutations.updateWorkflowStatus, {
        workflowId,
        status: "failed",
        error: errorMessage,
      });
      throw error;
    }
  },
});

// Fetch YouTube transcript using yt-dlp (aligned with bulk/cloning)
async function fetchYouTubeTranscriptWithYtdlp(url: string): Promise<{ transcript: string; metadata: any }> {
  const response = await fetch(`${BACKEND_URL}/api/public/youtube/transcript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      youtube_url: url,
      job_id: `rag_${Date.now()}`,
      user_id: "rag_user",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube transcript: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    transcript: result.transcript,
    metadata: {
      title: result.metadata?.title,
      author: result.metadata?.author,
      duration: result.metadata?.duration,
      url,
    },
  };
}

// Fetch TikTok content using yt-dlp (aligned with bulk/cloning)
async function fetchTikTokContentWithYtdlp(url: string): Promise<{ content: string; metadata: any }> {
  const response = await fetch(`${BACKEND_URL}/api/public/tiktok/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      url,
      job_id: `rag_${Date.now()}`,
      user_id: "rag_user",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch TikTok content: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    content: result.content,
    metadata: {
      title: result.metadata?.title,
      author: result.metadata?.author,
      platform: "tiktok",
      url,
    },
  };
}

// Fetch Twitch content using yt-dlp (aligned with bulk/cloning)
async function fetchTwitchContentWithYtdlp(url: string): Promise<{ content: string; metadata: any }> {
  const response = await fetch(`${BACKEND_URL}/api/public/twitch/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      url,
      job_id: `rag_${Date.now()}`,
      user_id: "rag_user",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Twitch content: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    content: result.content,
    metadata: {
      title: result.metadata?.title,
      author: result.metadata?.author,
      platform: "twitch",
      url,
    },
  };
}

// Chunk text with overlap
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

// Generate embeddings using Jina AI
async function generateEmbeddings(texts: string[], model: string = "jina-clip-v2"): Promise<number[][]> {
  const JINA_API_KEY = process.env.JINA_API_KEY;
  const JINA_EMBEDDING_URL = "https://api.jina.ai/v1/embeddings";

  if (!JINA_API_KEY) {
    throw new Error("Jina API key not configured");
  }

  const input = texts.map(text => ({ text }));

  const response = await fetch(JINA_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input,
      encoding_type: "float",
      dimensions: 1024,
      task: "text-matching",
      normalize: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jina API error: ${error}`);
  }

  const result = await response.json();
  return result.data.map((item: any) => item.embedding);
}