# Convex Resend Component Quick Start

## Installation
```bash
cd frontend
npm install @convex-dev/resend
```

## Convex Setup

### 1. Configure Convex
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);

export default app;
```

### 2. Create Verification Functions
```typescript
// convex/verification.ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false, // Set to true for development
});

export const sendVerificationEmail = internalMutation({
  args: { email: v.string(), phone: v.optional(v.string()) },
  handler: async (ctx, { email }) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await resend.sendEmail(ctx, {
      from: "Diala <verify@diala.ai>",
      to: email,
      subject: "Verify your Diala account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Use the code below to verify your Diala account:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This code expires in 15 minutes.</p>
        </div>
      `,
    });

    return { otp };
  },
});

export const verifyOtp = internalMutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, { email, otp }) => {
    // Add your verification logic here
    return { success: true };
  },
});
```

## Environment Variables
```bash
# Add to your Convex environment variables
RESEND_API_KEY=re_test_...
```

## Frontend Integration

### Update Verification Modal
```typescript
// Update verification-modal.tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const VerificationModal = ({ isOpen, onClose, onComplete }) => {
  const sendVerificationEmail = useMutation(api.verification.sendVerificationEmail);
  const verifyOtp = useMutation(api.verification.verifyOtp);
  
  // Use Convex mutations instead of REST API
};
```

## Testing Commands
```bash
# Test email sending
npm run convex:dev
# Then call the function from Convex dashboard
```

## Email Templates
- **Verification Code**: HTML template with 6-digit OTP
- **Welcome**: Post-verification welcome email
- **Resend**: OTP resend template