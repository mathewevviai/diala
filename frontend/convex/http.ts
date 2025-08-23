import { httpRouter } from "convex/server";
import { updateSearchProgress, updateSearchStatus, updateSearchResults } from "./hunterHttpEndpoints";

// Define HTTP routes for the hunter leadgen endpoints
const http = httpRouter();

// CORS configuration for local development
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
});

// Route for updating search progress
http.route({
  path: "/updateSearchProgress",
  method: "POST",
  handler: updateSearchProgress,
});

// Route for updating search status
http.route({
  path: "/updateSearchStatus",
  method: "POST",
  handler: updateSearchStatus,
});

// Route for updating search results
http.route({
  path: "/updateSearchResults",
  method: "POST",
  handler: updateSearchResults,
});

// CORS preflight handler for all routes
http.route({
  path: "/.*",
  method: "OPTIONS",
  handler: async (ctx, request) => {
    const origin = request.headers.get("Origin");
    return new Response(null, {
      status: 200,
      headers: new Headers(corsHeaders(origin)),
    });
  },
});

// Export the HTTP router
export default http;