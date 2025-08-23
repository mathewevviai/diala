// frontend/convex/jinaIntegration.ts
import { RAG } from "@convex-dev/rag"; // <-- ADD THIS LINE
import { createOpenAI } from "@ai-sdk/openai";
import { components } from "./_generated/api";

// 1. Create a custom OpenAI provider instance that points to the Jina API
const jina = createOpenAI({
  // Use the Jina API endpoint for embeddings
  baseURL: "https://api.jina.ai/v1",
  // IMPORTANT: Set your JINA_API_KEY in the Convex dashboard environment variables
  apiKey: process.env.JINA_API_KEY,
  // Recommended to avoid potential streaming issues with some proxies
  headers: {
    "Accept-Encoding": "identity",
  },
});

// 2. Define the embedding model using our custom Jina provider
// Your logs show you are using a model with 1024 dimensions.
const jinaEmbeddingModel = jina.embedding("jina-embeddings-v4", {
  dimensions: 1024,
});

// 3. Initialize and export the RAG component instance
// This is what we'll use in our actions to add and search content.
console.log("[Jina Integration] Initializing RAG with Jina v4 model");
console.log("[Jina Integration] Embedding dimension: 1024");

export const rag = new RAG(components.rag, {
  textEmbeddingModel: jinaEmbeddingModel,
  embeddingDimension: 1024, // This MUST match your model's output dimension
});
