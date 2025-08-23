## Onboarding page imports

### hunter/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import SimpleOnboardingNav from '@/components/custom/simple-onboarding-nav';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { useConvexErrorHandler } from '@/hooks/useConvexErrorHandler';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  UilSearch, 
  UilPhone, 
  UilAnalytics,
  UilFilter,
  UilUserCheck,
  UilPlay,
  UilCheckCircle,
  UilCrosshair,
  UilGlobe,
  UilDatabase,
  UilBuilding
} from '@tooni/iconscout-unicons-react';

// Import step components
import { SearchDefinitionStep, SearchDefinitionInfoSections } from '@/components/onboarding/hunter/SearchDefinitionStep';
import { IndustryLocationStep } from '@/components/onboarding/hunter/IndustryLocationStep';
import { CompanyDetailsStep } from '@/components/onboarding/hunter/CompanyDetailsStep';
import { SearchKeywordsStep } from '@/components/onboarding/hunter/SearchKeywordsStep';
import { ContactPreferencesStep } from '@/components/onboarding/hunter/ContactPreferencesStep';
import { ValidationCriteriaStep } from '@/components/onboarding/hunter/ValidationCriteriaStep';
import { SearchPreviewStep } from '@/components/onboarding/hunter/SearchPreviewStep';
import { SearchProgressStep } from '@/components/onboarding/hunter/SearchProgressStep';
import { SearchResultsStep } from '@/components/onboarding/hunter/SearchResultsStep';

import { 
  SearchCriteria, 
  ValidationCriteria, 
  ContactPreferences, 
  SearchResults, 
  LeadSource,
  StepProps 
} from '@/components/onboarding/hunter/types';
```

### transcribe/page.tsx
```tsx
import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CopyTranscriptModal from '@/components/onboarding/modals/CopyTranscriptModal';
import BulkDownloadModal from '@/components/onboarding/modals/BulkDownloadModal';
import ChatWithDialaModal from '@/components/onboarding/modals/ChatWithDialaModal';
import VoiceCloneModal from '@/components/onboarding/modals/VoiceCloneModal';
import VerificationModal from '@/components/custom/modals/verification-modal';
import TranscriptSkeleton from '@/components/custom/transcript-skeleton';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { UilFileAlt, UilUpload, UilArrowRight, UilCopy, UilCloudDownload, UilCommentDots, UilMicrophone, UilMusicNote, UilVolumeUp, UilPlay, UilPause, UilUser } from '@tooni/iconscout-unicons-react';
import { DragDropUpload } from './DragDropUpload';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Star15 } from '@/components/ui/star';
import { SpeakerTimeline } from '@/components/transcripts/SpeakerTimeline';
```

### cloning/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import VerificationModal from '@/components/custom/modals/verification-modal';
import SimpleOnboardingNav from '@/components/custom/simple-onboarding-nav';
import { Star15 } from '@/components/ui/star' ;
import { UilYoutube, UilPlay, UilChannel, UilArrowRight, UilArrowLeft, UilCheckCircle, UilInfoCircle, UilVideo, UilClock, UilEye, UilThumbsUp, UilCopy, UilSpinner, UilUpload, UilCloudDownload, UilCog, UilQuestionCircle, UilUser } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTikTokContent } from '@/hooks/useTikTokContent';
import { useYouTubeContent } from '@/hooks/useYouTubeContent';
import { useTwitchContent } from '@/hooks/useTwitchContent';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { VideoPreviewProvider } from '@/contexts/VideoPreviewContext';
import { useVoiceCloning } from '@/hooks/useVoiceCloning';

// Import step components
import { PlatformSelectionStep } from '@/components/onboarding/cloning/PlatformSelectionStep';
import { ChannelSetupStep } from '@/components/onboarding/cloning/ChannelSetupStep';
import { ContentSelectionStep } from '@/components/onboarding/cloning/ContentSelectionStep';
import { VoiceSettingsStep } from '@/components/onboarding/cloning/VoiceSettingsStep';
import { TextInputStep } from '@/components/onboarding/cloning/TextInputStep';
import { IdentityVerificationStep } from '@/components/onboarding/cloning/IdentityVerificationStep';
import { ReviewCompleteStep } from '@/components/onboarding/cloning/ReviewCompleteStep';
import ModelSelectionStep from '@/components/onboarding/cloning/ModelSelectionStep';
import { Platform, ModelData } from '@/components/onboarding/cloning/types';
```

### rag/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { UilDatabase, UilBrain, UilChart, UilSearch, UilCloudDownload, UilCog, UilCheckCircle, UilExport } from '@tooni/iconscout-unicons-react';
import { useTikTokContent } from '@/hooks/useTikTokContent';
import { useYouTubeContent } from '@/hooks/useYouTubeContent';
import { useTwitchContent } from '@/hooks/useTwitchContent';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

// Import step components
import { PlatformSelectionStep } from '@/components/onboarding/bulk/PlatformSelectionStep';
import { InputMethodStep } from '@/components/onboarding/bulk/InputMethodStep';
import { DocumentUploadStep } from '@/components/onboarding/bulk/DocumentUploadStep';
import { ContentSelectionStep } from '@/components/onboarding/bulk/ContentSelectionStep';
import { ModelSelectionStep } from '@/components/onboarding/bulk/ModelSelectionStep';
import { VectorDbSelectionStep } from '@/components/onboarding/bulk/VectorDbSelectionStep';
import { ProcessingStepConvex } from '@/components/onboarding/bulk/ProcessingStepConvex';

import { ExportStep } from '@/components/onboarding/bulk/ExportStep';
import { Platform, InputType, BulkOnboardingState, EmbeddingModel, VectorDatabase, ProcessingJob } from '@/components/onboarding/bulk/types';
import { VideoPreviewProvider } from '@/contexts/VideoPreviewContext';
import VerificationModal from '@/components/custom/modals/verification-modal';
```

### calls/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OnboardingNav from '@/components/custom/onboarding-nav';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import InfoSection from '@/components/custom/info-section';
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexErrorHandler } from '@/hooks/useConvexErrorHandler';
import { StarBadge, Star15 } from '@/components/ui/star';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UilPhone,
  UilPhoneVolume,
  UilOutgoingCall,
  UilMissedCall,
  UilCalendarAlt,
  UilClock,
  UilUpload,
  UilUsersAlt,
  UilRobot,
  UilArrowRight,
  UilArrowLeft,
  UilCheckCircle,
  UilPlay,
  UilPause,
  UilInfoCircle,
  UilChartGrowth,
  UilBell,
  UilVoicemail,
  UilClipboardNotes,
  UilListUl,
  UilAnalytics,
  UilTachometerFast,
  UilBriefcase,
  UilQuestionCircle
} from '@tooni/iconscout-unicons-react';
```

### rtc/page.tsx
```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useConvex, useAction, useMutation, useQuery } from 'convex/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilPhone, UilPhoneVolume, UilWifi, UilMicrophone, UilCheckCircle, UilRocket, UilInfoCircle, UilChartGrowth } from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import InfoSection from '@/components/custom/info-section';
import { RTCPhoneDialer } from '@/components/custom/rtc/rtc-phone-dialer-realistic';
import { api } from '@convex/_generated/api';
import { toast } from 'sonner';
```

### voice/page.tsx
```tsx
import App from '@/components/custom/app';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
```

### transcripts/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CopyTranscriptModal from '@/components/onboarding/modals/CopyTranscriptModal';
import BulkDownloadModal from '@/components/onboarding/modals/BulkDownloadModal';
import ChatWithDialaModal from '@/components/onboarding/modals/ChatWithDialaModal';
import TranscriptSkeleton from '@/components/custom/transcript-skeleton';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { UilFileAlt, UilClipboardNotes, UilDocumentInfo, UilYoutube, UilDownloadAlt, UilArrowRight, UilTwitter, UilFacebookF, UilInstagram, UilLinkedin, UilShare, UilWhatsapp, UilThumbsUp, UilBell, UilCopy, UilCloudDownload, UilCommentDots, UilQuestionCircle, UilFileDownloadAlt, UilBrain, UilDatabase, UilAnalysis } from '@tooni/iconscout-unicons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
```

### procedural/page.tsx
```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UilMicrophone, UilMusic, UilInfoCircle, UilArrowRight, UilArrowLeft, UilPlay, UilCheck, UilDownloadAlt, UilSpinner } from '@tooni/iconscout-unicons-react';
import { Star15 } from '@/components/ui/star';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { AudioGenerationProgress } from '@/components/onboarding/procedural/AudioGenerationProgress';
```

### blog/[blogId]/page.tsx
```tsx
import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UilArrowLeft } from '@tooni/iconscout-unicons-react';
```

### blog/page.tsx
```tsx
import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilBook,
  UilClock,
  UilUser,
  UilArrowRight,
  UilFire,
  UilStar,
  UilBookOpen,
  UilApps,
  UilRocket,
  UilChart,
  UilMicrophone,
  UilBrain
} from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { Star15 } from '@/components/ui/star';
```

### courses/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UilGraduationCap,
  UilClock,
  UilVideo,
  UilArrowRight,
  UilAward,
  UilStar,
  UilCheckCircle,
  UilLock,
  UilPlay,
  UilFileAlt
} from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { Star15 } from '@/components/ui/star';
```

### guides/page.tsx
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilBookAlt,
  UilClock,
  UilChartGrowth,
  UilArrowRight,
  UilRocket,
  UilStar,
  UilFileAlt,
  UilLightbulbAlt
} from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { Star15 } from '@/components/ui/star';
```