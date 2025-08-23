// frontend/convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();

// Use the Agent component configuration
app.use(agent);

// Use the RAG component configuration
app.use(rag);

// Use the rate limiter component configuration
app.use(rateLimiter);

export default app;
