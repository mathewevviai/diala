import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  verification_codes: defineTable({
    email: v.string(),
    code: v.string(),
    expires: v.number(),
    page: v.string(),
    attempts: v.number(),
    created: v.number(),
    delivered: v.optional(v.boolean()),
  })
  .index("by_email", ["email"])
  .index("by_expires", ["expires"]),

  email_events: defineTable({
    email: v.string(),
    event: v.string(),
    timestamp: v.number(),
    messageId: v.string(),
    page: v.string(),
  })
  .index("by_email", ["email"])
  .index("by_timestamp", ["timestamp"]),
});

// Updated convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);
export default app;

// Updated convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup-verification-codes",
  { hours: 1 },
  internal.verification.cleanupOldCodes
);

crons.interval(
  "cleanup-email-events",
  { hours: 24 },
  internal.verification.cleanupOldEvents
);

export default crons;