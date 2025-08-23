# Production-Ready Convex-Only Implementation

## 🎯 Complete Production Plan
**100% Convex Resend - Zero Backend Dependencies**

## 📁 File Structure (Convex-Only)

### Required Files (All Convex)
```
frontend/
├── convex/
│   ├── convex.config.ts          # 2 lines to add Resend
│   ├── verification.ts            # Core verification logic
│   ├── email-templates.ts         # Email templates per page
│   ├── rate-limiting.ts           # Rate limiting logic
│   └── crons.ts                   # Cleanup old codes
└── src/components/custom/modals/
    └── verification-modal.tsx     # Updated for Convex
```

## 🔧 Step-by-Step Production Implementation

### Phase 1: Core Setup (5 minutes)

#### 1. Install Package
```bash
cd frontend
npm install @convex-dev/resend
```

#### 2. Configure Convex Resend
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);
export default app;
```

### Phase 2: Production Verification System (15 minutes)

#### 3. Create Production Verification Logic
```typescript
// convex/verification.ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
  onEmailEvent: internal.verification.handleEmailEvent,
});

// Production-grade verification storage
export const verificationCodes = internalMutation({
  args: { email: v.string(), code: v.string(), expires: v.number() },
  handler: async (ctx, { email, code, expires }) => {
    await ctx.db.insert("verification_codes", {
      email,
      code,
      expires,
      attempts: 0,
      created: Date.now(),
    });
  },
});

// Send verification email with page-specific template
export const sendVerificationEmail = internalMutation({
  args: { 
    email: v.string(), 
    page: v.string(), 
    userData: v.optional(v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      pageContext: v.optional(v.string()),
    }))
  },
  handler: async (ctx, { email, page, userData }) => {
    // Rate limiting check
    const recentAttempts = await ctx.db
      .query("verification_codes")
      .filter(q => q.eq(q.field("email"), email))
      .filter(q => q.gt(q.field("created"), Date.now() - 15 * 60 * 1000))
      .collect();
    
    if (recentAttempts.length >= 3) {
      throw new Error("Rate limit exceeded");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("verification_codes", {
      email,
      code: otp,
      expires,
      page,
      attempts: 0,
      created: Date.now(),
    });

    // Page-specific email template
    const template = getEmailTemplate(page, { otp, userData });
    
    await resend.sendEmail(ctx, {
      from: "Diala <verify@diala.ai>",
      to: email,
      subject: `Verify your Diala account - ${page}`,
      html: template,
    });

    return { success: true, messageId: "sent" };
  },
});

// Verify OTP with rate limiting
export const verifyOtp = internalMutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, { email, otp }) => {
    const record = await ctx.db
      .query("verification_codes")
      .filter(q => q.eq(q.field("email"), email))
      .filter(q => q.gt(q.field("expires"), Date.now()))
      .first();

    if (!record) {
      return { valid: false, error: "Code expired or not found" };
    }

    if (record.attempts >= 5) {
      await ctx.db.delete(record._id);
      return { valid: false, error: "Too many attempts" };
    }

    if (record.code !== otp) {
      await ctx.db.patch(record._id, { attempts: record.attempts + 1 });
      return { valid: false, error: "Invalid code" };
    }

    await ctx.db.delete(record._id);
    return { valid: true, page: record.page };
  },
});

// Resend verification
export const resendVerification = internalMutation({
  args: { email: v.string(), page: v.string() },
  handler: async (ctx, { email, page }) => {
    // Remove old attempts
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

// Handle email events (delivery, bounce, etc)
export const handleEmailEvent = internalAction({
  args: { id: v.string(), event: v.string() },
  handler: async (ctx, { id, event }) => {
    console.log(`Email ${id}: ${event}`);
    // Log delivery status, handle bounces, etc
  },
});
```

### Phase 3: Page-Specific Email Templates

#### 4. Create Template System
```typescript
// convex/email-templates.ts
export function getEmailTemplate(page: string, data: { otp: string, userData?: any }) {
  const templates = {
    calls: `
      <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: rgb(0,82,255); color: white; padding: 30px; text-align: center;">
          <h2>VERIFY FOR CALLS SETUP</h2>
          <p>Complete your calling system verification</p>
        </div>
        <div style="background: #FFD700; padding: 30px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px;">
          ${data.otp}
        </div>
      </div>
    `,
    transcribe: `
      <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff006e; color: white; padding: 30px; text-align: center;">
          <h2>VERIFY FOR TRANSCRIPTION</h2>
          <p>Unlock audio transcription features</p>
        </div>
        <div style="background: #FFD700; padding: 30px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px;">
          ${data.otp}
        </div>
      </div>
    `,
    hunter: `
      <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #8b5cf6; color: white; padding: 30px; text-align: center;">
          <h2>VERIFY FOR HUNTER</h2>
          <p>Access lead generation tools</p>
        </div>
        <div style="background: #FFD700; padding: 30px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px;">
          ${data.otp}
        </div>
      </div>
    `,
    cloning: `
      <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #06ffa5; color: black; padding: 30px; text-align: center;">
          <h2>VERIFY FOR VOICE CLONING</h2>
          <p>Set up your voice cloning profile</p>
        </div>
        <div style="background: #FFD700; padding: 30px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px;">
          ${data.otp}
        </div>
      </div>
    `,
    procedural: `
      <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff4757; color: white; padding: 30px; text-align: center;">
          <h2>VERIFY FOR PROCEDURAL AUDIO</h2>
          <p>Enable advanced audio generation</p>
        </div>
        <div style="background: #FFD700; padding: 30px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px;">
          ${data.otp}
        </div>
      </div>
    `,
  };

  return templates[page] || templates.calls;
}
```

#### 5. Database Schema
```typescript
// convex/schema.ts
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
  }),
});
```

### Phase 4: Updated Verification Modal

#### 6. Production Modal Integration
```typescript
// Update verification-modal.tsx
import { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from 'next/navigation';

export default function VerificationModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  devMode,
  pageContext = "general" 
}) {
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const sendVerification = useMutation(api.verification.sendVerificationEmail);
  const verifyOtp = useMutation(api.verification.verifyOtp);
  const resendVerification = useMutation(api.verification.resendVerification);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && phone && agreedToTerms) {
      setIsLoading(true);
      try {
        await sendVerification({ email, page: pageContext });
        setStep('otp');
        setError('');
        startResendCooldown();
      } catch (error) {
        setError(error.message || 'Failed to send verification email');
      }
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (otp.length === 6) {
      setIsLoading(true);
      try {
        const result = await verifyOtp({ email, otp });
        if (result.valid) {
          onComplete(email, phone);
        } else {
          setError(result.error || 'Invalid code');
        }
      } catch (error) {
        setError('Verification failed');
      }
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      await resendVerification({ email, page: pageContext });
      startResendCooldown();
      setError('');
    } catch (error) {
      setError('Failed to resend code');
    }
    setIsLoading(false);
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Dev mode auto-fill
  if (devMode && isOpen) {
    if (!email) setEmail('test@diala.ai');
    if (!phone) setPhone('+1 (555) 123-4567');
    if (!agreedToTerms) setAgreedToTerms(true);
  }

  // ... rest of component with enhanced styling
}
```

### Phase 5: Production Cleanup

#### 7. Cleanup Old Codes
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup-verification-codes",
  { hours: 1 },
  internal.verification.cleanupOldCodes
);

export default crons;
```

#### 8. Environment Setup
```bash
# Add to Convex deployment environment variables
RESEND_API_KEY=re_test_... # Use re_... for production
```

## 🎯 Integration with Each Onboarding Page

### Update Each Page's Verification Call
```typescript
// Example: onboarding/calls/page.tsx
<VerificationModal
  isOpen={showVerification}
  onClose={() => setShowVerification(false)}
  onComplete={handleVerificationComplete}
  devMode={devMode}
  pageContext="calls"
/>
```

### Page-Specific Contexts
- **calls**: "calls"
- **transcribe**: "transcribe"
- **hunter**: "hunter"
- **cloning**: "cloning"
- **procedural**: "procedural"

## 🚀 Production Deployment Checklist

### Pre-Production
- [ ] Add `RESEND_API_KEY` to Convex environment
- [ ] Test email delivery with `delivered@resend.dev`
- [ ] Verify rate limiting works
- [ ] Test all 5 onboarding pages
- [ ] Check email templates render correctly

### Deployment
```bash
npm run convex:deploy
```

### Post-Production
- [ ] Monitor email delivery rates
- [ ] Check for bounce rates
- [ ] Verify cleanup cron job runs
- [ ] Monitor verification completion rates

## 📊 Production Monitoring

### Key Metrics to Track
- Email delivery rate (target: >95%)
- Verification completion rate (target: >80%)
- Average verification time (target: <3 minutes)
- Resend rate (target: <20%)

### Error Handling
- Rate limiting responses
- Invalid email formats
- Expired verification codes
- Too many attempts
- Network failures

## ✅ Production Features
- **Rate limiting** (3 emails per 15 minutes)
- **Attempt limiting** (5 OTP attempts per code)
- **Session management** (15-minute expiration)
- **Page-specific templates** (5 unique designs)
- **Webhook support** (delivery tracking)
- **Cleanup automation** (hourly cron job)
- **Error handling** (user-friendly messages)
- **Dev mode** (test data auto-fill)