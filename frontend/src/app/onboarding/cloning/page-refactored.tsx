'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { UilYoutube, UilChannel, UilCheckCircle, UilVideo, UilCog, UilQuestionCircle, UilCopy } from '@tooni/iconscout-unicons-react';
import { useTikTokContent } from '@/hooks/useTikTokContent';
import { useYouTubeContent } from '@/hooks/useYouTubeContent';
import { useTwitchContent } from '@/hooks/useTwitchContent';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

// Import all step components
import { PlatformSelectionStep } from '@/components/onboarding/cloning/PlatformSelectionStep';
import { ChannelSetupStep } from '@/components/onboarding/cloning/ChannelSetupStep';
import { ContentSelectionStep } from '@/components/onboarding/cloning/ContentSelectionStep';
import { VoiceSettingsStep } from '@/components/onboarding/cloning/VoiceSettingsStep';
import { IdentityVerificationStep } from '@/components/onboarding/cloning/IdentityVerificationStep';
import { ReviewCompleteStep } from '@/components/onboarding/cloning/ReviewCompleteStep';

interface ContentItem {
  id: string; 
  title: string;
  duration: string;
  views: string;
  likes: string;
  published: string;
  thumbnail?: string;
}

export default function CloningOnboarding() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedPlatform, setSelectedPlatform] = React.useState('');
  const [channelName, setChannelName] = React.useState('');
  const [selectedContent, setSelectedContent] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadProgress, setLoadProgress] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processProgress, setProcessProgress] = React.useState(0);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string>('');
  const [processingProgress, setProcessingProgress] = React.useState(0);
  const [voiceCloneReady, setVoiceCloneReady] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);
  const [isVerified, setIsVerified] = React.useState(false);
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);
  const [voiceSettings, setVoiceSettings] = React.useState({
    exaggeration: 0.5,    // Controls expressiveness (0.25-2.0)
    cfgWeight: 0.5,       // CFG/Pace control (0.2-1.0)
    temperature: 0.8,     // Controls randomness (0.05-5.0)
    seed: 0,              // Random seed (0 for random)
    refWav: null as File | null  // Optional reference audio
  });

  // TikTok content hook
  const {
    user: tiktokUser,
    userLoading: tiktokUserLoading,
    userError: tiktokUserError,
    fetchUser: fetchTikTokUser,
    videos: tiktokVideos,
    videosLoading: tiktokVideosLoading,
    videosError: tiktokVideosError,
    fetchVideos: fetchTikTokVideos,
    downloadVideos: downloadTikTokVideos,
    downloadProgress: tiktokDownloadProgress,
    downloadStatus: tiktokDownloadStatus,
  } = useTikTokContent();

  // YouTube content hook
  const {
    channel: youtubeChannel,
    channelLoading: youtubeChannelLoading,
    channelError: youtubeChannelError,
    fetchChannel: fetchYouTubeChannel,
    videos: youtubeVideos,
    videosLoading: youtubeVideosLoading,
    videosError: youtubeVideosError,
    fetchVideos: fetchYouTubeVideos,
    downloadVideos: downloadYouTubeVideos,
    downloadProgress: youtubeDownloadProgress,
    downloadStatus: youtubeDownloadStatus,
  } = useYouTubeContent();

  // Twitch content hook
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
    downloadVideos: downloadTwitchVideos,
    downloadProgress: twitchDownloadProgress,
    downloadStatus: twitchDownloadStatus,
  } = useTwitchContent();

  const cleanupTikTokData = React.useCallback(async () => {
    console.log('[Cleanup] TikTok data cleanup called');
  }, []);
  const cleanupYouTubeData = React.useCallback(async () => {
    console.log('[Cleanup] YouTube data cleanup called');
  }, []);
  const cleanupTwitchData = React.useCallback(async () => {
    console.log('[Cleanup] Twitch data cleanup called');
  }, []);

  // TikTok user data complete fallback
  const tiktokUserDataComplete = !!tiktokUser;

  // Track if we've already attempted to fetch videos for this channel
  const fetchedChannelsRef = React.useRef<Set<string>>(new Set());

  // Auto-fetch YouTube videos when channel is loaded
  React.useEffect(() => {
    if (selectedPlatform === 'youtube' && youtubeChannel && !youtubeVideosLoading) {
      const channelId = youtubeChannel.channelId;
      
      // Only fetch if we haven't already fetched for this channel
      if (!fetchedChannelsRef.current.has(channelId) && youtubeVideos.length === 0) {
        console.log('Auto-fetching YouTube videos for channel:', channelId);
        fetchedChannelsRef.current.add(channelId);
        fetchYouTubeVideos(channelId, 6);
      }
    }
  }, [youtubeChannel, selectedPlatform, youtubeVideosLoading, youtubeVideos.length, fetchYouTubeVideos]);
  
  // Auto-fetch Twitch videos when channel is loaded
  React.useEffect(() => {
    if (selectedPlatform === 'twitch' && twitchChannel && !twitchVideosLoading) {
      const username = twitchChannel.username;
      
      // Only fetch if we haven't already fetched for this channel
      if (!fetchedChannelsRef.current.has(username) && twitchVideos.length === 0) {
        console.log('Auto-fetching Twitch videos for channel:', username);
        fetchedChannelsRef.current.add(username);
        fetchTwitchVideos(username, 6, 'archive');
      }
    }
  }, [twitchChannel, selectedPlatform, twitchVideosLoading, twitchVideos.length, fetchTwitchVideos]);
  
  // Debug YouTube videos
  React.useEffect(() => {
    console.log('[YouTube Debug] Videos state:', {
      videosLength: youtubeVideos.length,
      videos: youtubeVideos,
      loading: youtubeVideosLoading,
      error: youtubeVideosError
    });
  }, [youtubeVideos, youtubeVideosLoading, youtubeVideosError]);

  // Debug query to check database state
  const debugYouTubeData = useQuery(api.queries.debugYouTube.getAllYouTubeVideos);
  // const debugTwitchData = useQuery(api.queries.twitchContent.getAllTwitchVideos); // TODO: Add twitchContent queries
  React.useEffect(() => {
    if (debugYouTubeData) {
      console.log('[Debug] YouTube Database state:', debugYouTubeData);
    }
    // if (debugTwitchData) {
    //   console.log('[Debug] Twitch Database state:', debugTwitchData);
    // }
  }, [debugYouTubeData]);
  
  // Debug TikTok videos
  React.useEffect(() => {
    console.log('[TikTok Debug] Videos state:', {
      videosLength: tiktokVideos.length,
      videos: tiktokVideos,
      loading: tiktokVideosLoading,
      error: tiktokVideosError,
      user: tiktokUser
    });
  }, [tiktokVideos, tiktokVideosLoading, tiktokVideosError, tiktokUser]);
  
  // Debug TikTok user loading state
  React.useEffect(() => {
    console.log('[TikTok Debug] User profile state:', {
      hasUser: !!tiktokUser,
      userLoading: tiktokUserLoading,
      userDataComplete: tiktokUserDataComplete,
      shouldShowSkeleton: tiktokUserLoading || (!tiktokUser || !tiktokUserDataComplete),
      avatar: tiktokUser?.avatar,
      followerCount: tiktokUser?.followerCount
    });
  }, [tiktokUser, tiktokUserLoading, tiktokUserDataComplete]);
  
  // Debug Twitch videos
  React.useEffect(() => {
    console.log('[Twitch Debug] Videos state:', {
      videosLength: twitchVideos.length,
      videos: twitchVideos,
      loading: twitchVideosLoading,
      error: twitchVideosError,
      channel: twitchChannel
    });
  }, [twitchVideos, twitchVideosLoading, twitchVideosError, twitchChannel]);
  
  // Debug Twitch channel loading state
  React.useEffect(() => {
    console.log('[Twitch Debug] Channel state:', {
      hasChannel: !!twitchChannel,
      channelLoading: twitchChannelLoading,
      channelDataComplete: twitchChannelDataComplete,
      shouldShowSkeleton: twitchChannelLoading || (!twitchChannel || !twitchChannelDataComplete),
      profileImage: twitchChannel?.profileImage,
      followerCount: twitchChannel?.followerCount,
      isLive: twitchChannel?.isLive
    });
  }, [twitchChannel, twitchChannelLoading, twitchChannelDataComplete]);
  
  // Cleanup when platform changes
  React.useEffect(() => {
    const cleanup = async () => {
      if (selectedPlatform !== 'tiktok' && tiktokUser) {
        console.log('[Cloning] Platform changed from TikTok, cleaning up data');
        try {
          await cleanupTikTokData();
        } catch (error) {
          console.error('[Cloning] Error cleaning up TikTok data:', error);
        }
      }
      if (selectedPlatform !== 'youtube' && youtubeChannel) {
        console.log('[Cloning] Platform changed from YouTube, cleaning up data');
        try {
          await cleanupYouTubeData();
        } catch (error) {
          console.error('[Cloning] Error cleaning up YouTube data:', error);
        }
      }
      if (selectedPlatform !== 'twitch' && twitchChannel) {
        console.log('[Cloning] Platform changed from Twitch, cleaning up data');
        try {
          await cleanupTwitchData();
        } catch (error) {
          console.error('[Cloning] Error cleaning up Twitch data:', error);
        }
      }
    };
    
    cleanup();
  }, [selectedPlatform, tiktokUser, youtubeChannel, twitchChannel, cleanupTikTokData, cleanupYouTubeData, cleanupTwitchData]);
  
  // Cleanup when channel name is cleared
  React.useEffect(() => {
    if (channelName === '' && (tiktokUser || tiktokVideos.length > 0) && selectedPlatform === 'tiktok') {
      console.log('[Cloning] Channel name cleared, cleaning up TikTok data');
      cleanupTikTokData();
    }
    if (channelName === '' && (youtubeChannel || youtubeVideos.length > 0) && selectedPlatform === 'youtube') {
      console.log('[Cloning] Channel name cleared, cleaning up YouTube data');
      cleanupYouTubeData();
    }
    if (channelName === '' && (twitchChannel || twitchVideos.length > 0) && selectedPlatform === 'twitch') {
      console.log('[Cloning] Channel name cleared, cleaning up Twitch data');
      cleanupTwitchData();
    }
  }, [channelName, tiktokUser, tiktokVideos.length, youtubeChannel, youtubeVideos.length, twitchChannel, twitchVideos.length, selectedPlatform, cleanupTikTokData, cleanupYouTubeData, cleanupTwitchData]);
  
  React.useEffect(() => {
    if (isLoading && currentStep === 3) {
      if (selectedPlatform === 'tiktok' && !tiktokUserLoading && !tiktokVideosLoading) {
        if (tiktokVideos.length > 0 || tiktokVideosError) {
          console.log('[Cloning] TikTok loading complete, videos:', tiktokVideos.length);
          setIsLoading(false);
        }
      }
      else if (selectedPlatform === 'youtube' && !youtubeChannelLoading && !youtubeVideosLoading) {
        if (youtubeVideos.length > 0 || youtubeVideosError) {
          console.log('[Cloning] YouTube loading complete, videos:', youtubeVideos.length);
          setIsLoading(false);
        }
      }
      else if (selectedPlatform === 'twitch' && !twitchChannelLoading && !twitchVideosLoading) {
        if (twitchVideos.length > 0 || twitchVideosError) {
          console.log('[Cloning] Twitch loading complete, videos:', twitchVideos.length);
          setIsLoading(false);
        }
      }
    }
  }, [isLoading, currentStep, selectedPlatform, tiktokUserLoading, tiktokVideosLoading, 
      tiktokVideos.length, tiktokVideosError, youtubeChannelLoading, youtubeVideosLoading, 
      youtubeVideos.length, youtubeVideosError, twitchChannelLoading, twitchVideosLoading,
      twitchVideos.length, twitchVideosError, ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleLoadContent = async () => {
    setIsLoading(true);
    setCurrentStep(3);
    
    if (selectedPlatform === 'upload') {
      setProcessingProgress(0);
      for (let i = 0; i <= 100; i += 10) {
        setProcessingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setVoiceCloneReady(true);
      setIsLoading(false);
    } else if (selectedPlatform === 'tiktok') {
      try {
        if (tiktokUser || tiktokVideos.length > 0) {
          console.log('[Cloning] Cleaning up existing TikTok data before new search');
          await cleanupTikTokData();
        }
        
        setLoadProgress(10);
        console.log('Fetching TikTok user:', channelName);
        await fetchTikTokUser(channelName);
        setLoadProgress(50);
        setLoadProgress(100);
      } catch (error) {
        console.error('Error loading TikTok content:', error);
        setIsLoading(false);
      }
    } else if (selectedPlatform === 'youtube') {
      try {
        if (youtubeChannel || youtubeVideos.length > 0) {
          console.log('[Cloning] Cleaning up existing YouTube data before new search');
          await cleanupYouTubeData();
        }
        
        setLoadProgress(10);
        let channelUrl = channelName;
        if (!channelName.includes('youtube.com') && !channelName.includes('youtu.be')) {
          if (channelName.startsWith('@')) {
            channelUrl = `https://youtube.com/${channelName}`;
          } else if (channelName.startsWith('UC') && channelName.length === 24) {
            channelUrl = `https://youtube.com/channel/${channelName}`;
          } else {
            channelUrl = `https://youtube.com/@${channelName}`;
          }
        }
        
        console.log('Fetching YouTube channel:', channelUrl);
        await fetchYouTubeChannel(channelUrl);
        setLoadProgress(50);
        setLoadProgress(100);
      } catch (error) {
        console.error('Error loading YouTube content:', error);
        setIsLoading(false);
      }
    } else if (selectedPlatform === 'twitch') {
      try {
        if (twitchChannel || twitchVideos.length > 0) {
          console.log('[Cloning] Cleaning up existing Twitch data before new search');
          await cleanupTwitchData();
        }
        
        setLoadProgress(10);
        console.log('Fetching Twitch channel:', channelName);
        await fetchTwitchChannel(channelName);
        setLoadProgress(50);
        setLoadProgress(100);
      } catch (error) {
        console.error('Error loading Twitch content:', error);
        setIsLoading(false);
      }
    }
  };

  const handleProcessClone = async () => {
    setIsProcessing(true);
    setProcessProgress(0);
    
    // Download content based on platform
    if (selectedPlatform === 'tiktok' && selectedContent.length > 0) {
      await downloadTikTokVideos(selectedContent);
    } else if (selectedPlatform === 'youtube' && selectedContent.length > 0) {
      await downloadYouTubeVideos(selectedContent);
    } else if (selectedPlatform === 'twitch' && selectedContent.length > 0) {
      await downloadTwitchVideos(selectedContent);
    }
    
    // Simulate clone processing
    for (let i = 0; i <= 100; i += 10) {
      setProcessProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsProcessing(false);
    setCurrentStep(6);
  };

  const handleContinue = () => {
    if (currentStep === 5) {
      handleProcessClone();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3 && selectedPlatform !== 'upload') {
        setChannelName('');
        setSelectedContent([]);
      }
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleIdentityVerificationComplete = () => {
    setIsVerified(true);
    setShowVerificationModal(false);
  };

  const handleVerificationComplete = () => {
    setIsVerified(true);
    setShowVerificationModal(false);
    handleContinue();
  };

  const isNextEnabled = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== '';
      case 2:
        return selectedPlatform === 'upload' ? uploadedFile !== null : channelName !== '';
      case 3:
        return selectedPlatform === 'upload' ? voiceCloneReady : selectedContent.length > 0;
      case 4:
        return true;
      case 5:
        return selectedAction !== null && isVerified;
      default:
        return false;
    }
  };

  const getProgressPercentage = () => {
    const totalSteps = 6;
    return (currentStep / totalSteps) * 100;
  };

  // Get current platform-specific data
  const getCurrentPlatformData = () => {
    switch (selectedPlatform) {
      case 'tiktok':
        return {
          channel: tiktokUser,
          videos: tiktokVideos,
          loading: tiktokUserLoading || tiktokVideosLoading,
          error: tiktokUserError || tiktokVideosError,
          downloadProgress: tiktokDownloadProgress,
          downloadStatus: tiktokDownloadStatus
        };
      case 'youtube':
        return {
          channel: youtubeChannel,
          videos: youtubeVideos,
          loading: youtubeChannelLoading || youtubeVideosLoading,
          error: youtubeChannelError || youtubeVideosError,
          downloadProgress: youtubeDownloadProgress,
          downloadStatus: youtubeDownloadStatus
        };
      case 'twitch':
        return {
          channel: twitchChannel,
          videos: twitchVideos,
          loading: twitchChannelLoading || twitchVideosLoading,
          error: twitchChannelError || twitchVideosError,
          downloadProgress: twitchDownloadProgress,
          downloadStatus: twitchDownloadStatus
        };
      default:
        return {
          channel: null,
          videos: [],
          loading: false,
          error: null,
          downloadProgress: {},
          downloadStatus: ''
        };
    }
  };

  return (
    <div 
      className="min-h-screen bg-pink-500 relative pb-8" 
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
              <div className="absolute top-2 left-4 w-8 h-8 bg-pink-600 border-2 border-black flex items-center justify-center">
                <UilCopy className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-pink-500 border-2 border-black flex items-center justify-center">
                <UilVideo className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-pink-600 hover:bg-pink-700 border-4 border-black p-0">
                  {currentStep === 1 && <UilChannel className="h-12 w-12 text-white" />}
                  {currentStep === 2 && <UilYoutube className="h-12 w-12 text-white" />}
                  {currentStep === 3 && <UilVideo className="h-12 w-12 text-white" />}
                  {currentStep === 4 && <UilCog className="h-12 w-12 text-white" />}
                  {currentStep === 5 && <UilQuestionCircle className="h-12 w-12 text-white" />}
                  {currentStep === 6 && <UilCheckCircle className="h-12 w-12 text-white" />}
                </Button>
              </div>
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                {currentStep === 1 && 'CHOOSE PLATFORM'}
                {currentStep === 2 && 'CHANNEL SETUP'}
                {currentStep === 3 && (isLoading ? 'LOADING CONTENT' : selectedPlatform === 'upload' ? 'VOICE STUDIO' : 'SELECT CONTENT')}
                {currentStep === 4 && 'VOICE SETTINGS'}
                {currentStep === 5 && 'VERIFY IDENTITY'}
                {currentStep === 6 && 'REVIEW & COMPLETE'}
              </CardTitle>
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                {currentStep === 1 && 'SELECT YOUR CONTENT SOURCE'}
                {currentStep === 2 && 'ENTER CHANNEL INFORMATION'}
                {currentStep === 3 && (isLoading ? 'FETCHING CHANNEL DATA' : selectedPlatform === 'upload' ? 'PROCESS YOUR MEDIA' : 'CHOOSE VIDEOS TO CLONE')}
                {currentStep === 4 && 'CUSTOMIZE VOICE PARAMETERS'}
                {currentStep === 5 && 'CONFIRM YOUR IDENTITY'}
                {currentStep === 6 && (isProcessing ? 'CREATING YOUR AI CLONE' : 'YOUR CLONE IS READY')}
              </p>
              <div className="mt-6">
                <Progress value={getProgressPercentage()} className="h-4 border-2 border-black" />
                <p className="text-center mt-2 font-bold text-black">
                  STEP {currentStep} OF 6
                </p>
              </div>
            </CardHeader>
          </Card>

          {currentStep === 1 && (
            <PlatformSelectionStep
              selectedPlatform={selectedPlatform}
              onSelectPlatform={setSelectedPlatform}
              onNext={() => setCurrentStep(2)}
              onBack={handleBack}
            />
          )}

          {currentStep === 2 && (
            <ChannelSetupStep
              selectedPlatform={selectedPlatform}
              channelName={channelName}
              onChannelNameChange={setChannelName}
              uploadedFile={uploadedFile}
              onFileUpload={handleFileUpload}
              onNext={handleLoadContent}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <ContentSelectionStep
              selectedPlatform={selectedPlatform}
              isLoading={isLoading}
              loadProgress={loadProgress}
              selectedContent={selectedContent}
              onContentSelect={setSelectedContent}
              platformData={getCurrentPlatformData()}
              processingProgress={processingProgress}
              voiceCloneReady={voiceCloneReady}
              audioUrl={audioUrl}
              onNext={handleContinue}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <VoiceSettingsStep
              voiceSettings={voiceSettings}
              onSettingsChange={setVoiceSettings}
              onNext={handleContinue}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 5 && (
            <IdentityVerificationStep
              selectedAction={selectedAction}
              onActionSelect={setSelectedAction}
              isVerified={isVerified}
              onShowVerificationModal={() => setShowVerificationModal(true)}
              onNext={handleContinue}
              onBack={handleBack}
            />
          )}

          {currentStep === 6 && (
            <ReviewCompleteStep
              isProcessing={isProcessing}
              processProgress={processProgress}
              selectedPlatform={selectedPlatform}
              channelData={getCurrentPlatformData().channel}
              selectedContent={selectedContent}
              contentItems={getCurrentPlatformData().videos}
            />
          )}
        </div>

        <div className="mt-8">
          <OnboardingFooter />
        </div>
      </div>
      
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={handleVerificationComplete}
      />
    </div>
  );
}