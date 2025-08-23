'use client';

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
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform>('');
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
    exaggeration: 1.0,    // Controls expressiveness (0.25-2.0)
    cfgWeight: 1.7,       // CFG/Pace control (0.5-3.0)
    chunkSize: 2048,      // Audio generation chunk size (512-4096)
  });
  const [selectedModel, setSelectedModel] = React.useState<ModelData | null>(null);
  const [testText, setTestText] = React.useState<string>('');
  const [devMode, setDevMode] = React.useState(false);
  
  // Rate limiting state
  const [lastDownloadTime, setLastDownloadTime] = React.useState<number>(0);
  const DOWNLOAD_COOLDOWN = 5000; // 5 seconds between batch downloads

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
    // TODO: Implement actual cleanup
  }, []);
  const cleanupYouTubeData = React.useCallback(async () => {
    console.log('[Cleanup] YouTube data cleanup called');
    // TODO: Implement actual cleanup
  }, []);
  const cleanupTwitchData = React.useCallback(async () => {
    console.log('[Cleanup] Twitch data cleanup called');
    // TODO: Implement actual cleanup
  }, []);

      // Selective cleanup - only remove unselected content
      const cleanupUnselectedContent = async () => {
        console.log('[Cleanup] Cleaning up unselected content, keeping:', selectedContent);
        const selectedIds = new Set(selectedContent);
        
        if (selectedPlatform === 'tiktok' && tiktokVideos.length > 0) {
          // TODO: Implement selective cleanup for TikTok
          const unselectedVideos = tiktokVideos.filter(v => !selectedIds.has(v.videoId));
          console.log('[Cleanup] Would remove TikTok videos:', unselectedVideos.map(v => v.videoId));
        } else if (selectedPlatform === 'youtube' && youtubeVideos.length > 0) {
          // TODO: Implement selective cleanup for YouTube
          const unselectedVideos = youtubeVideos.filter(v => !selectedIds.has(v.videoId));
          console.log('[Cleanup] Would remove YouTube videos:', unselectedVideos.map(v => v.videoId));
        } else if (selectedPlatform === 'twitch' && twitchVideos.length > 0) {
          // TODO: Implement selective cleanup for Twitch
          const unselectedVideos = twitchVideos.filter(v => !selectedIds.has(v.videoId));
          console.log('[Cleanup] Would remove Twitch videos:', unselectedVideos.map(v => v.videoId));
        }
      };
  // Complete cleanup - remove all content
  const cleanupAllContent = async () => {
    console.log('[Cleanup] Complete cleanup of all content');
    if (selectedPlatform === 'tiktok') {
      await cleanupTikTokData();
    } else if (selectedPlatform === 'youtube') {
      await cleanupYouTubeData();
    } else if (selectedPlatform === 'twitch') {
      await cleanupTwitchData();
    }
    setSelectedContent([]);
  };

  // TikTok user data complete fallback
  const tiktokUserDataComplete = !!tiktokUser;

  // Voice cloning hook
  const {
    createClone,
    jobId,
    jobStatus,
    voiceId,
    sampleAudioUrl,
    isProcessing: voiceCloneProcessing,
    error: voiceCloneError,
    testVoice,
    reset: resetVoiceClone,
  } = useVoiceCloning();

  // Track if we've already attempted to fetch videos for this channel
  const fetchedChannelsRef = React.useRef<Set<string>>(new Set());

  // Dev mode auto-fill effect
  React.useEffect(() => {
    if (devMode) {
      // Auto-fill TikTok username
      setSelectedPlatform('tiktok');
      setChannelName('dylan.page');
      
      // Auto-select first 5 videos when available
      if (tiktokVideos.length > 0) {
        const firstFiveVideos = tiktokVideos.slice(0, 5).map(v => v.videoId);
        setSelectedContent(firstFiveVideos);
      }
      
      // Set test text
      setTestText('Hello, this is a test of the voice clone. How does it sound?');
    }
  }, [devMode, tiktokVideos]);

  // Auto-load content when dev mode is enabled and we have the channel name
  // Note: Removed auto-trigger to allow manual control
  React.useEffect(() => {
    // Dev mode now only pre-fills, doesn't auto-trigger
  }, [devMode, selectedPlatform, channelName, isLoading]);

  // Update process progress based on voice cloning job status
  React.useEffect(() => {
    if (jobStatus) {
      switch (jobStatus.status) {
        case 'pending':
          setProcessProgress(10);
          break;
        case 'processing':
          setProcessProgress(50);
          break;
        case 'completed':
          setProcessProgress(100);
          setIsProcessing(false);
          if (jobStatus.result_url) {
            setAudioUrl(jobStatus.result_url);
          }
          break;
        case 'failed':
          setProcessProgress(0);
          setIsProcessing(false);
          console.error('[Cloning] Voice clone failed:', jobStatus.error);
          break;
      }
    }
  }, [jobStatus]);

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
    // Rate limiting check
    const now = Date.now();
    if (now - lastDownloadTime < DOWNLOAD_COOLDOWN) {
      const waitTime = Math.ceil((DOWNLOAD_COOLDOWN - (now - lastDownloadTime)) / 1000);
      console.log(`[RateLimit] Please wait ${waitTime} seconds before loading more content`);
      // Could show a toast/notification here
      return;
    }
    
    setLastDownloadTime(now);
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
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading TikTok content:', error);
        setIsLoading(false);
        // Allow user to continue even if content loading fails
        setLoadProgress(100);
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
        console.log('Fetching YouTube channel with URL:', channelUrl);
        await fetchYouTubeChannel(channelUrl);
        setLoadProgress(50);

        setLoadProgress(100);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading YouTube content:', error);
        setIsLoading(false);
        // Allow user to continue even if content loading fails
        setLoadProgress(100);
      }
    } else if (selectedPlatform === 'twitch') {

      try {

        if (twitchChannel || twitchVideos.length > 0) {
          console.log('[Cloning] Cleaning up existing Twitch data before new search');
          await cleanupTwitchData();
        }
        
        setLoadProgress(10);

        let channelUrl = channelName;
        if (!channelName.includes('twitch.tv')) {
          channelUrl = `https://twitch.tv/${channelName}`;
        }
        console.log('Fetching Twitch channel:', channelUrl);
        await fetchTwitchChannel(channelUrl);
        setLoadProgress(50);
        setIsLoading(false);
        setLoadProgress(100);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Twitch content:', error);
        setIsLoading(false);
        // Allow user to continue even if content loading fails
        setLoadProgress(100);
      }
    }
  };


  const canProceedFromStep1 = () => selectedPlatform !== '';
  const canProceedFromStep2 = () => {
    if (selectedPlatform === 'upload') {
      return uploadedFile !== null;
    }
    return channelName.trim() !== '';
  };
  const canProceedFromStep3 = () => {
    if (selectedPlatform === 'upload') {
      return voiceCloneReady;
    }
    return selectedContent.length > 0;
  };

  const toggleContentSelection = (contentId: string) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleExportAudio = () => {
    if (!audioUrl && !sampleAudioUrl) {
      console.error('[Cloning] No audio URL available for export');
      return;
    }
    
    const exportUrl = sampleAudioUrl || audioUrl;
    const link = document.createElement('a');
    link.href = exportUrl;
    link.download = `voice-clone-${voiceId || Date.now()}.mp3`;
    link.click();
  };


  const handleStepChange = async (step: number) => {
    // Going forward
    if (step > currentStep) {
      // Leaving content selection (step 3) to voice settings (step 4)
      if (currentStep === 3 && step === 4) {
        console.log('[Navigation] Moving forward from content selection, cleaning up unselected');
        await cleanupUnselectedContent();
      }
    } 
    // Going backward
    else if (step < currentStep) {
      // Going back to content selection from later steps
      if (step === 3 && currentStep > 3) {
        console.log('[Navigation] Going back to content selection');
        // Videos should still be available if they were selected
        // If not available, they'll be re-downloaded when needed
      }
      // Going back before content selection (clearing everything)
      else if (step <= 2 && currentStep >= 3) {
        console.log('[Navigation] Going back before content selection, full cleanup');
        await cleanupAllContent();
        setChannelName('');
      }
    }
    
    setCurrentStep(step);
  };

  const handleVerificationComplete = async (email: string, phone: string) => {
    setShowVerificationModal(false);
    setIsVerified(true);
    setIsProcessing(true);
    setCurrentStep(8);
    
    try {
      // Prepare audio file based on platform
      let audioFile: File | null = null;
      let voiceName = '';

      if (selectedPlatform === 'upload' && uploadedFile) {
        // Direct upload - use the uploaded file
        audioFile = uploadedFile;
        voiceName = uploadedFile.name.replace(/\.[^/.]+$/, '') + ' AI';
      } else if (selectedPlatform && selectedContent.length > 0) {
        // Platform content - download audio from first selected video
        const firstVideoId = selectedContent[0];
        
        try {
          let audioBlob: Blob | null = null;
          
          if (selectedPlatform === 'tiktok') {
            // Use TikTok audio extraction endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/tiktok/audio/${firstVideoId}?format=mp3`, {
              headers: {
                'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-secret-key-here',
              },
            });
            
            if (response.ok) {
              audioBlob = await response.blob();
            }
          } else if (selectedPlatform === 'youtube') {
            // For YouTube, we'll need to use the video file directly
            // The voice cloning API will extract audio from the video
            const videoUrl = youtubeVideos.find(v => v.id === firstVideoId)?.url;
            if (videoUrl) {
              // Download video and submit it directly
              const response = await fetch(videoUrl);
              if (response.ok) {
                audioBlob = await response.blob();
              }
            }
          } else if (selectedPlatform === 'twitch') {
            // Similar to YouTube, use video directly
            const videoUrl = twitchVideos.find(v => v.id === firstVideoId)?.url;
            if (videoUrl) {
              const response = await fetch(videoUrl);
              if (response.ok) {
                audioBlob = await response.blob();
              }
            }
          }

          if (audioBlob) {
            audioFile = new File([audioBlob], `${channelName}-voice.mp3`, { 
              type: selectedPlatform === 'tiktok' ? 'audio/mp3' : 'video/mp4' 
            });
            voiceName = `${channelName} AI`;
          } else {
            throw new Error('Failed to download audio from platform content');
          }
        } catch (error) {
          console.error('[Cloning] Error downloading audio:', error);
          throw error;
        }
      }

      if (audioFile && testText) {
        // Create voice clone
        await createClone(
          audioFile,
          voiceName,
          testText,
          voiceSettings
        );
        
        // If we get here without error, voice clone was created successfully
        // Safe to cleanup all content now
        console.log('[Verification] Voice clone created successfully, cleaning up all content');
        await cleanupAllContent();
      } else {
        throw new Error('Missing audio file or test text');
      }
    } catch (error) {
      console.error('[Cloning] Error creating voice clone:', error);
      setIsProcessing(false);
      // Error will be shown in ReviewCompleteStep via voiceCloneError prop
    }
  };

  const handleProcessContent = async () => {
    setIsProcessing(true);
    setCurrentStep(5);
    
    if (selectedPlatform === 'tiktok' && tiktokUser) {
      await downloadTikTokVideos(tiktokUser.username, selectedContent);
    } else if (selectedPlatform === 'youtube' && youtubeChannel) {
      await downloadYouTubeVideos(youtubeChannel.channelId, selectedContent);
    } else if (selectedPlatform === 'twitch' && twitchChannel) {
      await downloadTwitchVideos(twitchChannel.username, selectedContent);
    }
    
    setIsProcessing(false);
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
  };

  return (
    <VideoPreviewProvider>
      <div 
        className="min-h-screen bg-pink-500 relative pb-8" 
        style={{ 
          fontFamily: 'Noyh-Bold, sans-serif',
          backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
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
                {currentStep === 4 && 'SELECT MODEL'}
                {currentStep === 5 && 'VOICE SETTINGS'}
                {currentStep === 6 && 'TEST VOICE'}
                {currentStep === 7 && 'VERIFY IDENTITY'}
                {currentStep === 8 && 'REVIEW & COMPLETE'}
              </CardTitle>
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                {currentStep === 1 && 'SELECT YOUR CONTENT SOURCE'}
                {currentStep === 2 && 'ENTER CHANNEL INFORMATION'}
                {currentStep === 3 && (isLoading ? 'FETCHING CHANNEL DATA' : selectedPlatform === 'upload' ? 'PROCESS YOUR MEDIA' : 'CHOOSE VIDEOS TO CLONE')}
                {currentStep === 4 && 'CHOOSE YOUR AI VOICE MODEL'}
                {currentStep === 5 && 'CUSTOMIZE VOICE PARAMETERS'}
                {currentStep === 6 && 'TEST YOUR VOICE CLONE'}
                {currentStep === 7 && 'CONFIRM YOUR IDENTITY'}
                {currentStep === 8 && (isProcessing ? 'CREATING YOUR AI CLONE' : 'YOUR CLONE IS READY')}
              </p>
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-pink-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-pink-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-pink-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>

          {currentStep === 1 && (
            <PlatformSelectionStep
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              setCurrentStep={setCurrentStep}
            />
          )}

          {currentStep === 2 && (
            <ChannelSetupStep
              selectedPlatform={selectedPlatform}
              channelName={channelName}
              setChannelName={setChannelName}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              setAudioUrl={setAudioUrl}
              setCurrentStep={setCurrentStep}
              handleLoadContent={handleLoadContent}
              handleStepChange={handleStepChange}
              fetchedChannelsRef={fetchedChannelsRef}
            />
          )}

          {currentStep === 3 && (
            <ContentSelectionStep
              selectedPlatform={selectedPlatform}
              channelName={channelName}
              uploadedFile={uploadedFile}
              audioUrl={audioUrl}
              isLoading={isLoading}
              loadProgress={loadProgress}
              processingProgress={processingProgress}
              voiceCloneReady={voiceCloneReady}
              selectedContent={selectedContent}
              toggleContentSelection={toggleContentSelection}
              setSelectedContent={setSelectedContent}
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

          {currentStep === 4 && (
            <ModelSelectionStep
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
          )}

          {currentStep === 5 && (
            <VoiceSettingsStep
              voiceSettings={voiceSettings}
              setVoiceSettings={setVoiceSettings}
              handleStepChange={handleStepChange}
              setCurrentStep={setCurrentStep}
              selectedContent={selectedContent}
              selectedPlatform={selectedPlatform}
              selectedModel={selectedModel}
              tiktokVideos={tiktokVideos}
              youtubeVideos={youtubeVideos}
              twitchVideos={twitchVideos}
            />
          )}

          {currentStep === 6 && (
            <TextInputStep
              testText={testText}
              setTestText={setTestText}
              setCurrentStep={setCurrentStep}
              handleStepChange={handleStepChange}
            />
          )}

          {currentStep === 7 && (
            <IdentityVerificationStep
              setShowVerificationModal={setShowVerificationModal}
              handleStepChange={handleStepChange}
            />
          )}

          {currentStep === 8 && (
            <ReviewCompleteStep
              isProcessing={isProcessing}
              processProgress={processProgress}
              selectedPlatform={selectedPlatform}
              uploadedFile={uploadedFile}
              channelName={channelName}
              selectedContent={selectedContent}
              voiceSettings={voiceSettings}
              audioUrl={audioUrl}
              handleExportAudio={handleExportAudio}
              handleStepChange={handleStepChange}
              setSelectedPlatform={setSelectedPlatform}
              setChannelName={setChannelName}
              setSelectedContent={setSelectedContent}
              setUploadedFile={setUploadedFile}
              setAudioUrl={setAudioUrl}
              setVoiceCloneReady={setVoiceCloneReady}
              setIsVerified={setIsVerified}
              cleanupTikTokData={cleanupTikTokData}
              cleanupYouTubeData={cleanupYouTubeData}
              cleanupTwitchData={cleanupTwitchData}
              voiceId={voiceId}
              voiceCloneError={voiceCloneError}
              testText={testText}
              testVoice={testVoice}
              resetVoiceClone={resetVoiceClone}
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
    </VideoPreviewProvider>
  );
}