'use client';

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

export default function BulkOnboarding() {
  const [devMode, setDevMode] = React.useState(true);
  const [verificationOpen, setVerificationOpen] = React.useState(false);
  const [userContact, setUserContact] = React.useState<{email: string, phone: string} | null>(null);

  const [state, setState] = React.useState<BulkOnboardingState>({
    currentStep: 1,
    selectedPlatform: '',
    selectedInputMethod: '',
    channelUrl: '',
    pastedUrls: [],
    selectedContent: [],
    uploadedDocuments: [],
    selectedDocuments: [],
    uploadProgress: 0,
    selectedEmbeddingModel: null,
    selectedVectorDb: null,
    bulkSettings: {
      chunkSize: 1024,
      chunkOverlap: 100,
      maxTokens: 2048,
      // JINA V4 specific settings for transcript processing
      transcriptProcessing: {
        task: 'retrieval.passage',
        lateChunking: true,
        multiVector: false,
        optimizeForRag: true,
        dimensions: 1024,
      },
    },
    processingJob: null,
    exportFormat: 'json',
    isLoading: false,
    loadProgress: 0,
    isProcessing: false,
    processProgress: 0,
    isTranscriptMode: false,
  });

  // Content hooks
  const {
    user: tiktokUser,
    userLoading: tiktokUserLoading,
    userError: tiktokUserError,
    fetchUser: fetchTikTokUser,
    videos: tiktokVideos,
    videosLoading: tiktokVideosLoading,
    videosError: tiktokVideosError,
    fetchVideos: fetchTikTokVideos,
  } = useTikTokContent();

  const {
    channel: youtubeChannel,
    channelLoading: youtubeChannelLoading,
    channelError: youtubeChannelError,
    fetchChannel: fetchYouTubeChannel,
    videos: youtubeVideos,
    videosLoading: youtubeVideosLoading,
    videosError: youtubeVideosError,
    fetchVideos: fetchYouTubeVideos,
  } = useYouTubeContent();

  const {
    channel: twitchChannel,
    channelLoading: twitchChannelLoading,
    channelError: twitchChannelError,
    channelDataComplete: twitchChannelDataComplete,
    fetchChannel: fetchTwitchChannel,
    videos: twitchVideos,
    videosLoading: twitchVideosLoading,
    videosError: twitchVideosError,
    fetchVideos: fetchTwitchVideos,
  } = useTwitchContent();

  // Rate limiting state
  const [lastDownloadTime, setLastDownloadTime] = React.useState<number>(0);
  const DOWNLOAD_COOLDOWN = 5000; // 5 seconds between batch downloads

  // Track if we've already attempted to fetch videos for this channel
  const fetchedChannelsRef = React.useRef<Set<string>>(new Set());

  const updateState = React.useCallback((updates: Partial<BulkOnboardingState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  const setCurrentStep = React.useCallback((step: number) => {
    updateState({ currentStep: step });
  }, [updateState]);

  // Auto-fetch YouTube videos when channel is loaded
  React.useEffect(() => {
    if (state.selectedPlatform === 'youtube' && youtubeChannel && !youtubeVideosLoading) {
      const channelId = youtubeChannel.channelId;
      
      if (!fetchedChannelsRef.current.has(channelId) && youtubeVideos.length === 0) {
        console.log('Auto-fetching YouTube videos for channel:', channelId);
        fetchedChannelsRef.current.add(channelId);
        fetchYouTubeVideos(channelId); // Increased limit for bulk processing
      }
    }
  }, [youtubeChannel, state.selectedPlatform, youtubeVideosLoading, youtubeVideos.length, fetchYouTubeVideos]);
  
  // Auto-fetch Twitch videos when channel is loaded
  React.useEffect(() => {
    if (state.selectedPlatform === 'twitch' && twitchChannel && !twitchVideosLoading) {
      const username = twitchChannel.username;
      
      if (!fetchedChannelsRef.current.has(username) && twitchVideos.length === 0) {
        console.log('Auto-fetching Twitch videos for channel:', username);
        fetchedChannelsRef.current.add(username);
        fetchTwitchVideos(username); // Increased limit for bulk processing
      }
    }
  }, [twitchChannel, state.selectedPlatform, twitchVideosLoading, twitchVideos.length, fetchTwitchVideos]);

  // Auto-fetch TikTok videos when user is loaded
  React.useEffect(() => {
    if (state.selectedPlatform === 'tiktok' && tiktokUser && !tiktokVideosLoading) {
      const username = tiktokUser.username;
      
      if (!fetchedChannelsRef.current.has(username) && tiktokVideos.length === 0) {
        console.log('Auto-fetching TikTok videos for user:', username);
        fetchedChannelsRef.current.add(username);
        fetchTikTokVideos(username); // Increased limit for bulk processing
      }
    }
  }, [tiktokUser, state.selectedPlatform, tiktokVideosLoading, tiktokVideos.length, fetchTikTokVideos]);

  // Dev mode auto-fill effect - pre-selects web platform with URLs
  React.useEffect(() => {
    if (devMode) {
      updateState({
        selectedPlatform: 'web',
        selectedInputMethod: 'urls', 
        pastedUrls: [
          'http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there',
          'https://dergipark.org.tr/en/download/article-file/4570887'
        ],
        selectedEmbeddingModel: {
          id: 'jina-embeddings-v4',
          label: 'JINA EMBEDDER V4',
          Icon: null,
          color: 'bg-blue-600',
          tooltip: 'State-of-the-art multilingual embedding model optimized for RAG applications',
          dimensions: 1024,
          maxTokens: 8192,
          description: 'State-of-the-art multilingual embedding model with 1024 dimensions. Optimized for RAG applications with excellent performance across languages and domains.',
          mtebScore: 67.32,
          supportsLateChunking: true,
          supportsMultiVector: true,
          supportedTasks: ['retrieval.passage', 'retrieval.query', 'text-matching'],
          contextLength: 8192,
          version: 'v4',
          isTranscriptOptimized: true
        },
        selectedVectorDb: {
          id: 'convex',
          label: 'CONVEX',
          Icon: null,
          color: 'bg-purple-600',
          tooltip: 'Serverless vector database with real-time sync and built-in auth',
          description: 'Convex provides a serverless vector database with real-time synchronization, built-in authentication, and seamless integration with your application. Perfect for real-time RAG applications.',
          isPremium: false,
          hosting: 'Serverless',
          scalability: 'Auto-scaling',
          setup: 'One-click',
          bestFor: 'Real-time applications',
          pricing: 'Pay-as-you-go',
          features: ['Real-time sync', 'Built-in auth', 'Serverless', 'TypeScript SDK']
        }
      });
    }
  }, [devMode, updateState]);

  // Auto-fill web URLs when web platform is selected
  React.useEffect(() => {
    if (state.selectedPlatform === 'web') {
      updateState({
        selectedInputMethod: 'urls',
        pastedUrls: [
          'http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there',
          'https://dergipark.org.tr/en/download/article-file/4570887'
        ]
      });
    }
  }, [state.selectedPlatform, updateState]);

  // Auto-stop loading when content is available
  React.useEffect(() => {
    if (state.isLoading && state.currentStep === 3) {
      if (state.selectedPlatform === 'tiktok' && !tiktokUserLoading && !tiktokVideosLoading) {
        if (tiktokVideos.length > 0 || tiktokVideosError) {
          console.log('[Bulk] TikTok loading complete, videos:', tiktokVideos.length);
          updateState({ isLoading: false });
        }
      }
      else if (state.selectedPlatform === 'youtube' && !youtubeChannelLoading && !youtubeVideosLoading) {
        if (youtubeVideos.length > 0 || youtubeVideosError) {
          console.log('[Bulk] YouTube loading complete, videos:', youtubeVideos.length);
          updateState({ isLoading: false });
        }
      }
      else if (state.selectedPlatform === 'twitch' && !twitchChannelLoading && !twitchVideosLoading) {
        if (twitchVideos.length > 0 || twitchVideosError) {
          console.log('[Bulk] Twitch loading complete, videos:', twitchVideos.length);
          updateState({ isLoading: false });
        }
      }
    }
  }, [state.isLoading, state.currentStep, state.selectedPlatform, tiktokUserLoading, tiktokVideosLoading, 
      tiktokVideos.length, tiktokVideosError, youtubeChannelLoading, youtubeVideosLoading, 
      youtubeVideos.length, youtubeVideosError, twitchChannelLoading, twitchVideosLoading,
      twitchVideos.length, twitchVideosError, updateState]);

  const handleLoadContent = async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastDownloadTime < DOWNLOAD_COOLDOWN) {
      const waitTime = Math.ceil((DOWNLOAD_COOLDOWN - (now - lastDownloadTime)) / 1000);
      console.log(`[RateLimit] Please wait ${waitTime} seconds before loading more content`);
      return;
    }
    
    setLastDownloadTime(now);
    updateState({ isLoading: true, currentStep: 3 });
    
    if (state.selectedInputMethod === 'urls') {
      // Go to embedding model selection for URLs
      console.log('Processing URLs - going to embedding model selection');
      updateState({ 
        isLoading: false,
        currentStep: 4, // Go to embedding model selection
        selectedContent: state.pastedUrls // Keep as strings for URLs
      });
      return;
    }
    
    // Handle channel-based loading
    if (state.selectedPlatform === 'tiktok') {
      try {
        updateState({ loadProgress: 10 });
        console.log('Fetching TikTok user:', state.channelUrl);
        await fetchTikTokUser(state.channelUrl);
        updateState({ loadProgress: 100 });
      } catch (error) {
        console.error('Error loading TikTok content:', error);
        updateState({ isLoading: false });
      }
    } else if (state.selectedPlatform === 'youtube') {
      try {
        updateState({ loadProgress: 10 });
        let channelUrl = state.channelUrl;
        if (!state.channelUrl.includes('youtube.com') && !state.channelUrl.includes('youtu.be')) {
          if (state.channelUrl.startsWith('@')) {
            channelUrl = `https://youtube.com/${state.channelUrl}`;
          } else if (state.channelUrl.startsWith('UC') && state.channelUrl.length === 24) {
            channelUrl = `https://youtube.com/channel/${state.channelUrl}`;
          } else {
            channelUrl = `https://youtube.com/@${state.channelUrl}`;
          }
        }
        console.log('Fetching YouTube channel with URL:', channelUrl);
        await fetchYouTubeChannel(channelUrl);
        updateState({ loadProgress: 100 });
      } catch (error) {
        console.error('Error loading YouTube content:', error);
        updateState({ isLoading: false });
      }
    } else if (state.selectedPlatform === 'twitch') {
      try {
        updateState({ loadProgress: 10 });
        let channelUrl = state.channelUrl;
        if (!state.channelUrl.includes('twitch.tv')) {
          channelUrl = `https://twitch.tv/${state.channelUrl}`;
        }
        console.log('Fetching Twitch channel:', channelUrl);
        await fetchTwitchChannel(channelUrl);
        updateState({ loadProgress: 100 });
      } catch (error) {
        console.error('Error loading Twitch content:', error);
        updateState({ isLoading: false });
      }
    }
  };

  const handleStepChange = async (step: number) => {
    // Handle backwards navigation for URLs
    if (state.selectedInputMethod === 'urls') {
      if (step === 5) {
        // Go back to step 4 (embedding model) instead of step 3
        setCurrentStep(4);
        return;
      } else if (step === 4) {
        // Go back to step 2 (input method) instead of step 3
        setCurrentStep(2);
        return;
      } else if (step === 3) {
        // Skip content selection for URLs
        setCurrentStep(5);
        return;
      }
    }
    setCurrentStep(step);
  };

  const handleStartProcessing = () => {
    // Start processing immediately without verification
    console.log('Starting processing without verification...');
    // Pass empty contact for now, will get during processing
    setUserContact({ email: 'pending@verification.com', phone: '+0000000000' });
  };

  const handleVerificationComplete = (email: string, phone: string) => {
    setUserContact({ email, phone });
    setVerificationOpen(false);
    // Allow processing to continue with captured contact info
    console.log('Contact captured:', { email, phone });
  };

  const canProceedFromStep1 = () => state.selectedPlatform !== '';
  const canProceedFromStep2 = () => {
    let result;
    if (state.selectedInputMethod === 'urls') {
      result = state.pastedUrls.length > 0;
    } else if (state.selectedInputMethod === 'upload' || state.selectedPlatform === 'documents') {
      result = state.uploadedDocuments.length > 0;
    } else {
      result = state.channelUrl.trim() !== '';
    }
    
    console.log('Main page canProceedFromStep2:', {
      selectedInputMethod: state.selectedInputMethod,
      selectedPlatform: state.selectedPlatform,
      uploadedDocumentsLength: state.uploadedDocuments.length,
      pastedUrlsLength: state.pastedUrls.length,
      channelUrl: state.channelUrl,
      result
    });
    
    return result;
  };
  const canProceedFromStep3 = () => {
    // URLs skip step 3 entirely, so always proceed
    if (state.selectedInputMethod === 'urls') {
      return true;
    }
    return state.selectedContent.length > 0;
  };
  const canProceedFromStep4 = () => state.selectedEmbeddingModel !== null;
  const canProceedFromStep5 = () => state.selectedVectorDb !== null;

  const getStepTitle = () => {
    switch (state.currentStep) {
      case 1: return 'CHOOSE PLATFORM';
      case 2: return state.selectedPlatform === 'documents' ? 'UPLOAD DOCUMENTS' : 'INPUT METHOD';
      case 3: return state.isLoading ? 'LOADING CONTENT' : 'SELECT CONTENT';
      case 4: return 'SELECT EMBEDDING MODEL';
      case 5: return 'CHOOSE VECTOR DATABASE';
      case 6: return state.isProcessing ? 'PROCESSING CONTENT' : 'REVIEW & PROCESS';
      case 7: return 'VERIFY & TEST';
      case 8: return 'EXPORT & COMPLETE';
      default: return 'BULK PROCESSING';
    }
  };

  const getStepDescription = () => {
    switch (state.currentStep) {
      case 1: return 'SELECT YOUR CONTENT SOURCE';
      case 2: return state.selectedPlatform === 'documents' ? 'UPLOAD YOUR FILES FOR PROCESSING' : 'CHOOSE INPUT METHOD';
      case 3: return state.isLoading ? 'FETCHING CONTENT DATA' : 'CHOOSE CONTENT TO PROCESS';
      case 4: return 'CHOOSE YOUR EMBEDDING MODEL';
      case 5: return 'SELECT VECTOR DATABASE';
      case 6: return state.isProcessing ? 'CREATING VECTOR EMBEDDINGS' : 'CONFIGURE AND START PROCESSING';
      case 7: return 'TEST VECTOR DATABASE QUALITY';
      case 8: return 'EXPORT AND VISUALIZE RESULTS';
      default: return 'BULK VECTOR DATABASE CREATION';
    }
  };

  const getStepIcon = () => {
    switch (state.currentStep) {
      case 1: return <UilCloudDownload className="h-12 w-12 text-white" />;
      case 2: return state.selectedPlatform === 'documents' ? <UilCloudDownload className="h-12 w-12 text-white" /> : <UilCog className="h-12 w-12 text-white" />;
      case 3: return <UilChart className="h-12 w-12 text-white" />;
      case 4: return <UilBrain className="h-12 w-12 text-white" />;
      case 5: return <UilDatabase className="h-12 w-12 text-white" />;
      case 6: return <UilCog className="h-12 w-12 text-white" />;
      case 7: return <UilSearch className="h-12 w-12 text-white" />;
      case 8: return <UilExport className="h-12 w-12 text-white" />;
      default: return <UilDatabase className="h-12 w-12 text-white" />;
    }
  };

  return (
    <VideoPreviewProvider>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setDevMode(!devMode)}
            className={`h-10 px-4 text-sm font-black uppercase ${
              devMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-black'
            } border-2 border-black`}
          >
            DEV MODE {devMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      )}
      <div 
        className="min-h-screen bg-orange-500 relative pb-8" 
        style={{ 
          fontFamily: 'Noyh-Bold, sans-serif',
          backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          <Card className="transform rotate-1 relative overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute top-2 left-4 w-8 h-8 bg-orange-600 border-2 border-black flex items-center justify-center">
                <UilDatabase className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
                <UilBrain className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-orange-600 hover:bg-orange-700 border-4 border-black p-0">
                  {getStepIcon()}
                </Button>
              </div>
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                {getStepTitle()}
              </CardTitle>
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                {getStepDescription()}
              </p>
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-orange-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-orange-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-orange-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>

          {state.currentStep === 1 && (
            <PlatformSelectionStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
              disabledPlatforms={['youtube','twitch']}
              disabledTooltipText="Temporarily disabled"
            />
          )}

          {state.currentStep === 2 && state.selectedPlatform === 'documents' && (
            <DocumentUploadStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
            />
          )}

          {state.currentStep === 2 && state.selectedPlatform !== 'documents' && (
            <InputMethodStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
              handleLoadContent={handleLoadContent}
            />
          )}

          {(state.currentStep === 3 && state.selectedPlatform !== 'documents' && state.selectedInputMethod !== 'urls') && (
            <ContentSelectionStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
              tiktokUser={tiktokUser}
              tiktokVideos={tiktokVideos}
              youtubeChannel={youtubeChannel}
              youtubeVideos={youtubeVideos}
              twitchChannel={twitchChannel}
              twitchVideos={twitchVideos}
              twitchChannelDataComplete={twitchChannelDataComplete}
            />
          )}

          {state.currentStep === 4 && (
            <ModelSelectionStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
            />
          )}

          {state.currentStep === 5 && (
            <VectorDbSelectionStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
            />
          )}

          {(state.currentStep === 6 || (state.selectedInputMethod === 'urls' && state.currentStep === 5)) && (
            <ProcessingStepConvex
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
              tiktokUser={tiktokUser}
              tiktokVideos={tiktokVideos}
              youtubeChannel={youtubeChannel}
              youtubeVideos={youtubeVideos}
              twitchChannel={twitchChannel}
              twitchVideos={twitchVideos}
              twitchChannelDataComplete={twitchChannelDataComplete}
              onStartProcessing={handleStartProcessing}
            />
          )}

          {/* Verification Modal */}
          <VerificationModal
            isOpen={verificationOpen}
            onClose={() => setVerificationOpen(false)}
            onComplete={handleVerificationComplete}
            devMode={devMode}
          />

          {state.currentStep === 7 && (
            <ExportStep
              state={state}
              setState={updateState}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
            />
          )}
        </div>

        <div className="mt-8">
          <OnboardingFooter />
        </div>
        </div>
      </div>
    </VideoPreviewProvider>
  );
}
