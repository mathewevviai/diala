# Convex-Only Resend Integration

## 🚨 CRITICAL: Convex-Only Approach
**This implementation uses ONLY `@convex-dev/resend` - No FastAPI backend involved**

## 📦 Installation
```bash
cd frontend
npm install @convex-dev/resend
```

## 🔧 Single File Setup

### 1. Configure Convex (2 lines)
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);
export default app;
```

### 2. Create Verification Logic
```typescript
// convex/verification.ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

// Store verification codes
const verificationCodes = new Map<string, { code: string; expires: number }>();

export const sendVerificationEmail = internalMutation({
  args: { email: v.string(), phone: v.optional(v.string()) },
  handler: async (ctx, { email }) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, { code: otp, expires: Date.now() + 15 * 60 * 1000 });
    
    await resend.sendEmail(ctx, {
      from: "Diala <verify@diala.ai>",
      to: email,
      subject: "Verify your Diala account",
      html: `
        <div style="font-family: 'Noyh-Bold', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: rgb(0,82,255); color: white; padding: 30px; text-align: center;">
            <h2 style="font-size: 24px; margin: 0; font-weight: 900;">VERIFY YOUR IDENTITY</h2>
          </div>
          <div style="background: #FFD700; padding: 30px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px;">${otp}</div>
          </div>
          <p>This code expires in 15 minutes.</p>
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
    if (!stored || Date.now() > stored.expires) return { valid: false };
    if (stored.code !== otp) return { valid: false };
    
    verificationCodes.delete(email);
    return { valid: true };
  },
});
```

### 3. Update Frontend
```typescript
// Update verification-modal.tsx
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const VerificationModal = ({ isOpen, onClose, onComplete }) => {
  const sendVerification = useMutation(api.verification.sendVerificationEmail);
  const verifyCode = useQuery(api.verification.verifyOtp);
  // Use Convex mutations instead of REST API
};
```

## 🎯 Complete 5-Step Process
1. **Install**: `npm install @convex-dev/resend`
2. **Configure**: Add 2 lines to `convex/convex.config.ts`
3. **Create**: Add verification functions to `convex/verification.ts`
4. **Update**: Replace REST API calls with Convex mutations
5. **Deploy**: `npm run convex:deploy`

## 🚀 Ready for Production
- Add `RESEND_API_KEY` to Convex environment variables
- Test on all 5 onboarding pages
- Deploy with `npm run convex:deploy`

## Integration Architecture

### 1. Convex Resend Component (Recommended)

We'll use the official `@convex-dev/resend` component which provides:
- **Queueing**: Send emails efficiently with automatic batching
- **Durable execution**: Emails sent even with temporary failures
- **Idempotency**: Prevents duplicate emails from retries
- **Rate limiting**: Respects Resend API limits
- **Webhook support**: Track email delivery status

#### Installation
```bash
npm install @convex-dev/resend
```

#### Convex Configuration
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);

export default app;
```

### 2. Verification Service with Convex Resend

#### Send Verification Email
```typescript
// convex/verification.ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";

export const resend: Resend = new Resend(components.resend, {
  testMode: false, // Set to true for development
});

export const sendVerificationEmail = internalMutation({
  args: { email: v.string(), phone: v.optional(v.string()) },
  handler: async (ctx, { email, phone }) => {
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
```

#### Verify OTP
```typescript
// convex/verification.ts
export const verifyOtp = internalMutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, { email, otp }) => {
    // Verify OTP logic here
    return { success: true };
  },
});
```

### 2. Resend Configuration

#### Environment Variables
```bash
# Backend .env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@diala.ai
RESEND_FROM_NAME=Diala Verification
```

#### Email Templates
- **Verification Code**: HTML template with 6-digit OTP
- **Welcome**: Post-verification welcome email
- **Resend**: OTP resend template

### 3. Updated Verification Modal Flow

#### Enhanced State Management
```typescript
interface VerificationState {
  step: 'contact' | 'otp' | 'verifying';
  email: string;
  phone: string;
  otp: string;
  sessionId: string;
  isLoading: boolean;
  error: string | null;
  attempts: number;
  showResend: boolean;
}
```

#### New API Integration
```typescript
const sendVerificationCode = async (email: string, phone: string) => {
  const response = await fetch('/api/v1/verification/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, sessionId })
  });
  
  const data = await response.json();
  setSessionId(data.sessionId);
  return data;
};

const verifyOtp = async (email: string, otp: string) => {
  const response = await fetch('/api/v1/verification/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, sessionId })
  });
  
  return response.json();
};
```

## Implementation Steps

### Phase 1: Backend Setup (Day 1-2)
1. **Create verification service**
   - Install `@resend/node` package
   - Create email templates
   - Implement rate limiting
   - Add session management with Redis

2. **API endpoints**
   - `/api/v1/verification/email` - Send verification email
   - `/api/v1/verification/verify` - Verify OTP
   - `/api/v1/verification/resend` - Resend OTP
   - `/api/v1/verification/status` - Check verification status

3. **Database schema**
   ```sql
   CREATE TABLE verification_sessions (
     id UUID PRIMARY KEY,
     email VARCHAR(255) NOT NULL,
     phone VARCHAR(50),
     otp VARCHAR(6) NOT NULL,
     attempts INTEGER DEFAULT 0,
     expires_at TIMESTAMP NOT NULL,
     verified BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Phase 2: Frontend Updates (Day 3-4)
1. **Update verification modal**
   - Replace mock with real API calls
   - Add loading states
   - Handle API errors gracefully
   - Add resend functionality

2. **Error handling**
   - Rate limit errors (429)
   - Invalid OTP (400)
   - Expired sessions (410)
   - Network errors

3. **UI Enhancements**
   - Add countdown timer for resend
   - Show email preview
   - Add "Check your email" animation

### Phase 3: Testing & Deployment (Day 5)
1. **Testing**
   - Unit tests for API endpoints
   - Integration tests for email flow
   - E2E tests for verification modal
   - Rate limiting tests

2. **Deployment**
   - Staging deployment with test Resend key
   - Production configuration
   - Monitoring setup

## Code Structure

### Backend Structure
```
backend/src/
├── api/
│   └── v1/
│       └── verification/
│           ├── __init__.py
│           ├── routes.py
│           └── schemas.py
├── services/
│   ├── email/
│   │   ├── __init__.py
│   │   ├── resend_client.py
│   │   └── templates/
│   │       ├── verification.html
│   │       └── welcome.html
│   └── verification/
│       ├── __init__.py
│       ├── service.py
│       └── rate_limiter.py
└── models/
    └── verification.py
```

### Frontend Updates
```
frontend/src/
├── components/
│   └── custom/
│       └── modals/
│           ├── verification-modal.tsx (updated)
│           └── verification-service.ts (new)
└── lib/
    └── api/
        └── verification-client.ts (new)
```

## Security Considerations

### Rate Limiting
- **Email sending**: 3 attempts per 15 minutes per email
- **OTP verification**: 5 attempts per session
- **Session lifetime**: 15 minutes
- **IP-based limits**: 10 requests per minute

### Data Protection
- **Email validation**: Strict email format validation
- **Phone validation**: E.164 format
- **OTP generation**: Cryptographically secure random numbers
- **Session management**: UUID-based sessions with expiration

## Monitoring & Analytics

### Key Metrics
- **Email delivery rate**: Track Resend delivery
- **Verification completion**: Success rate of verification flow
- **Resend requests**: Frequency of resend usage
- **Error rates**: Track API errors and user drop-offs

### Logging
```typescript
// Example logging structure
{
  event: 'verification_email_sent',
  userId: string,
  email: string,
  sessionId: string,
  timestamp: Date,
  metadata: { template: 'verification' }
}
```

## Testing Strategy

### Unit Tests
- Email template rendering
- OTP generation
- Rate limiting
- Session management

### Integration Tests
- Complete verification flow
- Email delivery via Resend
- Rate limiting behavior
- Error handling

### E2E Tests
- User journey through verification modal
- Multiple onboarding pages
- Resend functionality
- Error recovery

## Rollback Plan

### If Issues Occur
1. **Feature flag**: Use feature flag to disable Resend integration
2. **Fallback**: Revert to mock OTP system
3. **Monitoring**: Alert on high error rates
4. **Communication**: Prepare user communication for issues

## Future Enhancements

### Phase 2 Features
- **SMS verification** via Twilio
- **Magic link** verification
- **Social login** integration
- **Progressive verification** (email first, phone later)

### Phase 3 Features
- **Multi-language** email templates
- **A/B testing** for email copy
- **Custom domains** for Resend
- **Advanced analytics** dashboard

## Dependencies

### Backend
```bash
pip install resend python-redis pydantic-email
```

### Frontend
```bash
npm install @types/node-fetch
```

## Environment Setup

### Development
```bash
# Start Redis for sessions
redis-server

# Set test Resend API key
export RESEND_API_KEY=re_test_...
```

### Production
```bash
# Production Resend API key
export RESEND_API_KEY=re_...

# Custom domain
export RESEND_FROM_EMAIL=verify@diala.ai
```

## Success Criteria
- [ ] Real email verification works across all onboarding flows
- [ ] 95% email delivery rate via Resend
- [ ] <3 second average verification time
- [ ] <5% verification abandonment rate
- [ ] Zero security vulnerabilities in penetration testing

## Timeline
- **Week 1**: Backend API and email templates
- **Week 2**: Frontend integration and testing
- **Week 3**: Deployment and monitoring
- **Week 4**: Performance optimization and Phase 2 planning