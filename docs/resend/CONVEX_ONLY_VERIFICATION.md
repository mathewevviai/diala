# Convex-Only Verification Implementation

## 🎯 Objective
**Use ONLY `@convex-dev/resend` with Convex functions - No FastAPI backend involved**

## 📦 Installation
```bash
cd frontend
npm install @convex-dev/resend
```

## 🔧 Convex Setup (Single Step)

### 1. Configure Convex Resend
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
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false, // Set to true for development
});

// Store verification codes temporarily
const verificationCodes = new Map<string, { code: string; expires: number }>();

export const sendVerificationEmail = internalMutation({
  args: { email: v.string(), phone: v.optional(v.string()) },
  handler: async (ctx, { email, phone }) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    verificationCodes.set(email, { code: otp, expires });
    
    await resend.sendEmail(ctx, {
      from: "Diala <verify@diala.ai>",
      to: email,
      subject: "Verify your Diala account",
      html: `
        <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: rgb(0,82,255); color: white; padding: 30px; text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 24px; margin: 0; font-weight: 900;">VERIFY YOUR IDENTITY</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Enter this code to continue</p>
          </div>
          
          <div style="background: #FFD700; padding: 30px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: black;">
              ${otp}
            </div>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #FFD700;">
            <p style="margin: 0; font-weight: bold;">This code expires in 15 minutes</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Didn't receive it? Check spam folder or request a new code.</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  },
});

export const verifyOtp = query({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, { email, otp }) => {
    const stored = verificationCodes.get(email);
    
    if (!stored) return { valid: false, error: "Code expired" };
    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return { valid: false, error: "Code expired" };
    }
    if (stored.code !== otp) return { valid: false, error: "Invalid code" };
    
    verificationCodes.delete(email);
    return { valid: true };
  },
});

export const resendVerificationEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    verificationCodes.delete(email); // Clear old code
    return await sendVerificationEmail(ctx, { email });
  },
});
```

## 🎨 Updated Verification Modal

```typescript
// Updated verification-modal.tsx
import { useState } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function VerificationModal({ isOpen, onClose, onComplete, devMode }) {
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sendVerification = useMutation(api.verification.sendVerificationEmail);
  const verifyCode = useQuery(api.verification.verifyOtp);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && phone && agreedToTerms) {
      setIsLoading(true);
      try {
        await sendVerification({ email, phone });
        setStep('otp');
        setError('');
      } catch (error) {
        setError('Failed to send verification email. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (otp.length === 6) {
      setIsLoading(true);
      try {
        const result = await verifyCode({ email, otp });
        if (result.valid) {
          onComplete(email, phone);
        } else {
          setError(result.error || 'Invalid code');
        }
      } catch (error) {
        setError('Verification failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // Auto-verify in dev mode
  if (devMode && otp === '000000') {
    handleOTPSubmit();
  }

  // Rest of component remains the same...
}
```

## 🔄 Environment Variables

Add to your Convex deployment environment:
```bash
RESEND_API_KEY=re_test_... # or re_... for production
```

## 📋 Implementation Checklist

### Phase 1: Setup (5 minutes)
- [ ] Install `@convex-dev/resend`
- [ ] Update `convex/convex.config.ts`
- [ ] Add `RESEND_API_KEY` to Convex environment

### Phase 2: Create Functions (10 minutes)
- [ ] Create `convex/verification.ts` with send/verify/resend functions
- [ ] Test email sending via Convex dashboard

### Phase 3: Update Modal (15 minutes)
- [ ] Replace mock API calls with Convex mutations
- [ ] Test verification flow on all 5 onboarding pages
- [ ] Verify error handling works

### Phase 4: Testing (5 minutes)
- [ ] Test on `/onboarding/calls`
- [ ] Test on `/onboarding/transcribe`
- [ ] Test on `/onboarding/hunter`
- [ ] Test on `/onboarding/cloning`
- [ ] Test on `/onboarding/procedural`

## 🧪 Testing Commands

### Test Email Sending
```bash
npm run convex:dev
# Go to Convex dashboard → Functions → verification → sendVerificationEmail
# Run with: {"email": "test@example.com", "phone": "+1234567890"}
```

### Test OTP Verification
```bash
# In Convex dashboard → Functions → verification → verifyOtp
# Run with: {"email": "test@example.com", "otp": "123456"}
```

## 🚨 Important Notes

### **No FastAPI Backend Needed**
- All verification happens through Convex functions
- Resend integration is handled by Convex
- Sessions managed by Convex
- No Redis or separate backend required

### **Deployment Ready**
- Works with `npm run convex:deploy`
- Environment variables set in Convex dashboard
- No additional infrastructure needed

### **Dev Mode Test Email**
- Use `delivered@resend.dev` for testing
- Real email addresses only work with `testMode: false`

## 🎯 Success Criteria
- [ ] Emails sent via Convex Resend component
- [ ] OTP verification works across all 5 onboarding pages
- [ ] No FastAPI backend involved
- [ ] Environment variables configured in Convex
- [ ] Ready for production deployment

## 🚀 Next Steps
1. Install the package
2. Configure convex.config.ts
3. Create verification.ts
4. Update verification-modal.tsx
5. Test on each onboarding page
6. Deploy with `npm run convex:deploy`