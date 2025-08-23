// convex/verification.ts - Production-ready verification system
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
  onEmailEvent: internal.verification.handleEmailEvent,
});

// Send verification email with production-grade features
export const sendVerificationEmail = internalMutation({
  args: { 
    email: v.string(), 
    page: v.string(), 
    userData: v.optional(v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
    }))
  },
  handler: async (ctx, { email, page, userData }) => {
    // Rate limiting: Max 3 emails per 15 minutes per email
    const recentAttempts = await ctx.db
      .query("verification_codes")
      .filter(q => q.eq(q.field("email"), email))
      .filter(q => q.gt(q.field("created"), Date.now() - 15 * 60 * 1000))
      .collect();
    
    if (recentAttempts.length >= 3) {
      throw new Error("Rate limit exceeded. Please try again in 15 minutes.");
    }

    // Generate secure OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store in database
    await ctx.db.insert("verification_codes", {
      email,
      code: otp,
      expires,
      page,
      attempts: 0,
      created: Date.now(),
    });

    // Send email with page-specific styling
    await resend.sendEmail(ctx, {
      from: "Diala <verify@diala.ai>",
      to: email,
      subject: `Verify your Diala account - ${page}`,
      html: generateEmailHTML(page, otp, userData),
    });

    return { success: true, messageId: email };
  },
});

// Verify OTP with attempt limiting
export const verifyOtp = internalMutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, { email, otp }) => {
    const record = await ctx.db
      .query("verification_codes")
      .filter(q => q.eq(q.field("email"), email))
      .filter(q => q.gt(q.field("expires"), Date.now()))
      .first();

    if (!record) {
      return { valid: false, error: "Verification code expired or not found" };
    }

    // Check attempt limits
    if (record.attempts >= 5) {
      await ctx.db.delete(record._id);
      return { valid: false, error: "Too many verification attempts" };
    }

    // Validate OTP
    if (record.code !== otp) {
      await ctx.db.patch(record._id, { attempts: record.attempts + 1 });
      return { valid: false, error: "Invalid verification code" };
    }

    // Success - clean up
    await ctx.db.delete(record._id);
    return { valid: true, page: record.page };
  },
});

// Resend verification with cleanup
export const resendVerification = internalMutation({
  args: { email: v.string(), page: v.string() },
  handler: async (ctx, { email, page }) => {
    // Clean up old codes for this email
    const oldCodes = await ctx.db
      .query("verification_codes")
      .filter(q => q.eq(q.field("email"), email))
      .collect();
    
    for (const oldCode of oldCodes) {
      await ctx.db.delete(oldCode._id);
    }

    return await sendVerificationEmail(ctx, { email, page });
  },
});

// Handle email delivery events
export const handleEmailEvent = internalAction({
  args: { id: v.string(), event: v.string() },
  handler: async (ctx, { id, event }) => {
    console.log(`Email event: ${id} - ${event}`);
    
    switch (event) {
      case "delivered":
        // Track successful delivery
        break;
      case "bounced":
        // Handle bounces
        break;
      case "complained":
        // Handle spam complaints
        break;
    }
  },
});

// Cleanup old verification codes
export const cleanupOldCodes = internalAction({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const oldCodes = await ctx.db
      .query("verification_codes")
      .filter(q => q.lt(q.field("expires"), cutoff))
      .collect();

    for (const code of oldCodes) {
      await ctx.db.delete(code._id);
    }
    
    return { cleaned: oldCodes.length };
  },
});

// Email template generator
function generateEmailHTML(page: string, otp: string, userData?: any) {
  const colors = {
    calls: { primary: "rgb(0,82,255)", secondary: "#FFD700" },
    transcribe: { primary: "#ff006e", secondary: "#FFD700" },
    hunter: { primary: "#8b5cf6", secondary: "#FFD700" },
    cloning: { primary: "#06ffa5", secondary: "#FFD700" },
    procedural: { primary: "#ff4757", secondary: "#FFD700" },
  };

  const color = colors[page] || colors.calls;

  return `
    <div style="
      font-family: 'Noyh-Bold', sans-serif; 
      max-width: 600px; 
      margin: 0 auto; 
      border: 3px solid black;
      box-shadow: 8px 8px 0px rgba(0,0,0,0.3);
    ">
      <div style="
        background: ${color.primary}; 
        color: white; 
        padding: 40px 30px; 
        text-align: center;
        border-bottom: 3px solid black;
      ">
        <h2 style="font-size: 28px; margin: 0; font-weight: 900; text-transform: uppercase;">
          Verify for ${page}
        </h2>
        <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">
          Complete your ${page} setup
        </p>
      </div>
      
      <div style="background: white; padding: 40px 30px;">
        <p style="font-size: 18px; margin-bottom: 30px;">
          Enter this verification code to continue:
        </p>
        
        <div style="
          background: ${color.secondary}; 
          padding: 30px; 
          text-align: center; 
          border: 3px solid black;
          margin: 20px 0;
        ">
          <div style="
            font-size: 36px; 
            font-weight: 900; 
            letter-spacing: 10px; 
            font-family: 'Courier New', monospace;
          ">
            ${otp}
          </div>
        </div>
        
        <div style="
          background: #f5f5f5; 
          padding: 20px; 
          border-left: 4px solid ${color.secondary};
          margin: 30px 0;
        ">
          <p style="margin: 0; font-weight: bold; font-size: 16px;">
            ⏰ This code expires in 15 minutes
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Didn't receive it? Check your spam folder or request a new code.
          </p>
        </div>
      </div>
      
      <div style="
        background: #f8f9fa; 
        padding: 20px 30px; 
        text-align: center; 
        font-size: 12px; 
        color: #666;
      ">
        <p>This is an automated email from Diala. Please do not reply.</p>
      </div>
    </div>
  `;
}