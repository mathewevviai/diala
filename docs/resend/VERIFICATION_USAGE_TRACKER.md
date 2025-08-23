# Verification Modal Usage Tracker

## Current Usage Analysis

### Pages Using VerificationModal
| Page | File Path | Status | Notes |
|------|-----------|--------|-------|
| **Calls** | `/frontend/src/app/onboarding/calls/page.tsx` | ✅ Active | Needs Resend integration |
| **Transcribe** | `/frontend/src/app/onboarding/transcribe/page.tsx` | ✅ Active | Needs Resend integration |
| **Hunter** | `/frontend/src/app/onboarding/hunter/page.tsx` | ✅ Active | Needs Resend integration |
| **Cloning** | `/frontend/src/app/onboarding/cloning/page.tsx` | ✅ Active | Needs Resend integration |
| **Procedural** | `/frontend/src/app/onboarding/procedural/page.tsx` | ✅ Active | Needs Resend integration |
| **Voice** | `/frontend/src/app/onboarding/voice/page.tsx` | ❌ Not used | No verification needed |
| **RAG** | `/frontend/src/app/onboarding/rag/page.tsx` | ❌ Not used | No verification needed |

## Implementation Checklist

### Phase 1: Backend API (Priority: High)
- [ ] Create `/api/v1/verification/email` endpoint
- [ ] Create `/api/v1/verification/verify` endpoint
- [ ] Create `/api/v1/verification/resend` endpoint
- [ ] Set up Resend client configuration
- [ ] Create email templates
- [ ] Add Redis session management

### Phase 2: Frontend Updates (Priority: High)
- [ ] Update verification-modal.tsx with real API calls
- [ ] Add error handling for API failures
- [ ] Add loading states
- [ ] Add resend functionality
- [ ] Update all 5 onboarding pages to use new verification modal

### Phase 3: Testing (Priority: Medium)
- [ ] Test email delivery across all pages
- [ ] Test OTP verification flow
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test mobile responsiveness

## Code Changes Required

### 1. Backend API Creation
```bash
# New files to create:
backend/src/api/v1/verification/
├── __init__.py
├── routes.py
├── schemas.py
└── service.py

backend/src/services/
├── email/
│   ├── __init__.py
│   ├── resend_client.py
│   └── templates/
│       ├── verification.html
│       └── welcome.html
└── verification/
    ├── __init__.py
    ├── service.py
    └── rate_limiter.py
```

### 2. Frontend Updates
```typescript
// Update verification-modal.tsx
const handleContactSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (email && phone && agreedToTerms) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/verification/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setStep('otp');
      } else {
        setError('Failed to send verification email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setIsLoading(false);
  }
};
```

### 3. Environment Configuration
```bash
# Add to backend/.env
RESEND_API_KEY=re_test_...
RESEND_FROM_EMAIL=onboarding@diala.ai
RESEND_FROM_NAME=Diala Verification
REDIS_URL=redis://localhost:6379

# Add to frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testing Strategy

### Test Email Addresses
```bash
# Valid test emails
test@example.com
test-user@gmail.com
demo@diala.ai

# Invalid test emails
invalid-email@test
@invalid.com
test@
```

### Test OTP Codes
```bash
# Valid OTP (from email)
123456

# Invalid OTP
000000
12345
abcdef
```

## Deployment Steps

### 1. Backend Deployment
```bash
cd backend
pip install -r requirements.txt
python -m src.main
```

### 2. Frontend Update
```bash
cd frontend
npm run dev:all
```

### 3. Verification
```bash
# Test each onboarding page
curl http://localhost:3000/onboarding/calls
curl http://localhost:3000/onboarding/transcribe
curl http://localhost:3000/onboarding/hunter
curl http://localhost:3000/onboarding/cloning
curl http://localhost:3000/onboarding/procedural
```

## Success Metrics
- [ ] All 5 onboarding pages successfully send verification emails
- [ ] OTP verification works across all pages
- [ ] Resend functionality works
- [ ] Error handling displays user-friendly messages
- [ ] Rate limiting prevents abuse
- [ ] Mobile experience is smooth

## Rollback Plan
If issues occur:
1. Revert verification-modal.tsx to mock implementation
2. Disable verification API endpoints
3. Use feature flag to turn off Resend integration
4. Monitor error rates and user complaints

## Next Steps
1. Complete Phase 1 backend implementation
2. Update verification-modal.tsx with new API calls
3. Test each onboarding page individually
4. Deploy to staging for final testing
5. Deploy to production with monitoring