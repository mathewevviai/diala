'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UilSpinner, UilArrowRight, UilArrowLeft, UilCheckCircle, UilInfoCircle, UilPlay, UilYoutube, UilVideo, UilClock, UilEye, UilThumbsUp, UilVolume, UilVolumeMute } from '@tooni/iconscout-unicons-react';
import { ContentItem, Platform } from './types';
import { useVideoPreviewContext } from '@/contexts/VideoPreviewContext';

interface ContentSelectionStepProps {
  selectedPlatform: Platform;
  channelName: string;
  uploadedFile: File | null;
  audioUrl: string;
  isLoading: boolean;
  loadProgress: number;
  processingProgress: number;
  voiceCloneReady: boolean;
  selectedContent: string[];
  toggleContentSelection: (contentId: string) => void;
  setSelectedContent: (content: string[]) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  // Platform specific data
  tiktokUser: any;
  tiktokVideos: any[];
  youtubeChannel: any;
  youtubeVideos: any[];
  twitchChannel: any;
  twitchVideos: any[];
  twitchChannelDataComplete: boolean;
}

export function ContentSelectionStep({
  selectedPlatform,
  channelName,
  uploadedFile,
  audioUrl,
  isLoading,
  loadProgress,
  processingProgress,
  voiceCloneReady,
  selectedContent,
  toggleContentSelection,
  setSelectedContent,
  setCurrentStep,
  handleStepChange,
  tiktokUser,
  tiktokVideos,
  youtubeChannel,
  youtubeVideos,
  twitchChannel,
  twitchVideos,
  twitchChannelDataComplete,
}: ContentSelectionStepProps) {
  const { generateMultiplePreviews, previewsLoading, generatePreview, getPreview, extractAudio, cancelPreview, clearCache, previews } = useVideoPreviewContext();
  const [hoveredVideoId, setHoveredVideoId] = React.useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = React.useState<Set<string>>(new Set());
  const [previewQueue, setPreviewQueue] = React.useState<Set<string>>(new Set());
  const [hoverStartTime, setHoverStartTime] = React.useState<number | null>(null);
  const [videoLoadingStates, setVideoLoadingStates] = React.useState<Map<string, 'idle' | 'preparing' | 'loading' | 'canplay' | 'loaded'>>(new Map());
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const videoLoadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const videos = React.useMemo(() => {
    return selectedPlatform === 'tiktok' ? tiktokVideos : 
           selectedPlatform === 'youtube' ? youtubeVideos : 
           selectedPlatform === 'twitch' ? twitchVideos : [];
  }, [selectedPlatform, tiktokVideos, youtubeVideos, twitchVideos]);

  const channel = selectedPlatform === 'tiktok' ? tiktokUser : 
                  selectedPlatform === 'youtube' ? youtubeChannel : 
                  selectedPlatform === 'twitch' ? twitchChannel : null;
  
  // Cleanup when platform changes or component unmounts
  React.useEffect(() => {
    return () => {
      // Clear any pending hover timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Clear preview cache when leaving
      clearCache();
    };
  }, [clearCache, selectedPlatform]);
  
  // Cleanup videos when component unmounts or step changes
  React.useEffect(() => {
    return () => {
      // Stop all videos when leaving this step
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        video.pause();
        video.muted = true;
        video.src = '';
        video.load();
      });
    };
  }, []);

  // Smart prefetching - warm backend cache via hidden video elements (download temp)
  React.useEffect(() => {
    if (selectedPlatform === 'tiktok' && videos.length > 0) {
      const videosToPreload = videos.slice(0, 3);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const preloads: HTMLVideoElement[] = [];
      const timeout = setTimeout(() => {
        videosToPreload.forEach((video) => {
          const videoId = video.id || video.video_id || video.videoId;
          const preloadVideo = document.createElement('video');
          preloadVideo.src = `${baseUrl}/api/public/tiktok/download/${videoId}`;
          preloadVideo.preload = 'auto';
          preloadVideo.muted = true;
          preloadVideo.style.display = 'none';
          document.body.appendChild(preloadVideo);
          preloads.push(preloadVideo);
          preloadVideo.addEventListener('loadeddata', () => {
            // Loaded into tmp/cache on backend; element can be removed
            try { document.body.removeChild(preloadVideo); } catch {}
          });
          // Trigger load
          try { preloadVideo.load(); } catch {}
        });
      }, 500);
      return () => {
        clearTimeout(timeout);
        preloads.forEach((el) => { try { document.body.removeChild(el); } catch {} });
      };
    }
  }, [selectedPlatform, videos]);
  
  const canProceedFromStep3 = () => {
    if (selectedPlatform === 'upload') {
      return voiceCloneReady;
    }
    return selectedContent.length > 0;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Helper function to update video loading state
  const updateVideoLoadingState = React.useCallback((videoId: string, state: 'idle' | 'preparing' | 'loading' | 'canplay' | 'loaded') => {
    setVideoLoadingStates(prev => new Map(prev).set(videoId, state));
  }, []);

  // Helper function to get video loading state
  const getVideoLoadingState = React.useCallback((videoId: string) => {
    return videoLoadingStates.get(videoId) || 'idle';
  }, [videoLoadingStates]);

  // Handle video hover for preview generation with debounce
  const handleVideoHover = React.useCallback((videoId: string, videoUrl?: string) => {
    // Clear any existing timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current);
    }
    
    // Set hovered video immediately for UI feedback (shows thumbnail)
    setHoveredVideoId(videoId);
    setHoverStartTime(Date.now()); // Track hover start time for immediate feedback
    
    // Set preparing state immediately for instant visual feedback
    updateVideoLoadingState(videoId, 'preparing');
    
    // Check if preview already exists and is ready
    if (selectedPlatform === 'tiktok') {
      const existingPreview = getPreview(videoId, 'tiktok');
      if (existingPreview?.previewUrl && !existingPreview.error) {
        // If preview already exists, it will be shown automatically due to hover state
        console.log('[ContentSelection] Preview already exists for:', videoId);
        return;
      }
    }
    
    // First timeout: After 0.5 seconds of sustained hover, start loading video
    hoverTimeoutRef.current = setTimeout(() => {
      if (selectedPlatform === 'tiktok') {
        const preview = getPreview(videoId, 'tiktok');
        
        // Check if we're already loading this preview or in the queue
        const isAlreadyQueued = previewQueue.has(videoId);
        const hasExistingPreview = preview && (preview.previewUrl || preview.loading);
        
        // Only generate preview if not already loaded/loading and not in queue
        if (!isAlreadyQueued && !hasExistingPreview) {
          console.log('[ContentSelection] Starting preview generation after sustained hover for:', videoId);
          
          // Update to loading state
          updateVideoLoadingState(videoId, 'loading');
          
          // Track that we're generating this preview
          setPreviewQueue(prev => new Set(prev).add(videoId));
          
          generatePreview(videoId, 'tiktok', videoUrl)
            .then((result) => {
              // Video will be shown automatically if user is still hovering and preview exists
              if (result?.previewUrl) {
                console.log('[ContentSelection] Preview generated successfully for:', videoId);
                updateVideoLoadingState(videoId, 'canplay');
              } else {
                console.log('[ContentSelection] Preview generation failed for:', videoId, result);
                updateVideoLoadingState(videoId, 'idle');
              }
            })
            .finally(() => {
              // Remove from queue when done
              setPreviewQueue(prev => {
                const newSet = new Set(prev);
                newSet.delete(videoId);
                return newSet;
              });
            });
        } else if (preview?.previewUrl && !preview.error) {
          // Preview already exists and will be shown due to hover state
          console.log('[ContentSelection] Preview already loaded for:', videoId);
        }
      }
    }, 500); // 0.5 second delay before starting video load
  }, [generatePreview, getPreview, selectedPlatform, previewQueue, updateVideoLoadingState]);
  
  // Handle mouse leave
  const handleVideoLeave = React.useCallback(() => {
    // Clear any pending preview generation
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current);
      videoLoadTimeoutRef.current = null;
    }
    
    // Cancel any ongoing preview request for the currently hovered video
    if (hoveredVideoId && selectedPlatform === 'tiktok') {
      cancelPreview(hoveredVideoId, 'tiktok');
    }
    
    setHoveredVideoId(null);
    setHoverStartTime(null);
    
    // Reset loading state when not hovering
    if (hoveredVideoId) {
      updateVideoLoadingState(hoveredVideoId, 'idle');
    }
  }, [hoveredVideoId, selectedPlatform, cancelPreview, updateVideoLoadingState]);

  // Handle audio mute toggle
  const handleAudioToggle = React.useCallback((videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  return (
    <Card className="transform -rotate-1">
      <CardContent className="p-8">
        {isLoading ? (
          <Card className="bg-gradient-to-br from-pink-50 to-yellow-50">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-pink-500 border-4 border-border shadow-shadow flex items-center justify-center">
                    <UilSpinner className="h-12 w-12 animate-spin text-white" />
                  </div>
                  <h2 className="text-3xl font-black uppercase text-foreground">
                    {selectedPlatform === 'upload' ? 'PROCESSING VOICE' : 'LOADING CONTENT'}
                  </h2>
                </div>
                <Progress value={selectedPlatform === 'upload' ? processingProgress : loadProgress} className="h-6 border-2 border-border" />
                <p className="text-center text-muted-foreground text-lg font-bold">
                  {selectedPlatform === 'upload' 
                    ? `Analyzing voice patterns in ${uploadedFile?.name}...`
                    : `Fetching videos from ${channelName}...`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : selectedPlatform === 'upload' ? (
          <>
            {/* Voice Studio UI for Upload */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                VOICE CLONE STUDIO
              </h1>
              <p className="text-lg text-gray-700 mt-2">
                Process and clone voice from your uploaded file
              </p>
            </div>

            <div className="mb-8">
              <Card className="bg-pink-50">
                <CardContent className="p-6">
                  {/* File Info */}
                  <div className="mb-4">
                    <Badge className="bg-pink-500 text-white border-2 border-black px-3 py-1 text-sm font-bold">
                      {uploadedFile?.type.startsWith('video/') ? 'VIDEO FILE' : 'AUDIO FILE'}
                    </Badge>
                    <h3 className="text-2xl font-black uppercase text-black mt-2">
                      {uploadedFile?.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-bold text-gray-700">SIZE:</span>
                      <span className="text-sm font-black text-black">
                        {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm font-bold text-gray-700">FORMAT:</span>
                      <span className="text-sm font-black text-black">
                        {uploadedFile?.name.split('.').pop()?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Media Player */}
                  <div className="rounded-lg bg-gray-100 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden p-4">
                    {uploadedFile?.type.startsWith('video/') ? (
                      <video 
                        controls 
                        className="w-full max-h-[400px]"
                        src={audioUrl}
                      >
                        Your browser does not support the video element.
                      </video>
                    ) : (
                      <audio 
                        controls 
                        className="w-full"
                        src={audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Message */}
            {voiceCloneReady && (
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UilCheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-bold">Voice Analysis Complete!</p>
                      <p className="text-sm text-gray-700">Your voice clone is ready. Choose an action above to continue.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 mt-8">
              <Button
                variant="neutral"
                size="lg"
                className="flex-1 h-14 text-lg font-black uppercase"
                onClick={() => handleStepChange(2)}
              >
                <UilArrowLeft className="mr-2 h-6 w-6" />
                BACK
              </Button>
              <Button
                variant="default"
                size="lg"
                className={`flex-1 h-14 text-lg font-black uppercase ${!voiceCloneReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setCurrentStep(4)}
                disabled={!voiceCloneReady}
              >
                CONTINUE
                <UilArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Content Selection UI for Platform Videos */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                SELECT CONTENT
              </h1>
              <p className="text-lg text-gray-700 mt-2">
                Choose videos to include in your AI clone training
              </p>
            </div>

            {/* Platform-specific channel info */}
            {channel && (
              <Card className="bg-pink-50 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {channel.avatar && (
                      <Image 
                        src={channel.avatar} 
                        alt={channel.username || channel.title}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full border-2 border-black"
                        unoptimized={channel.avatar.includes('tiktokcdn') || channel.avatar.includes('twitch') || channel.avatar.includes('youtube')}
                        onError={(e) => {
                          console.warn('[ContentSelection] Channel avatar failed to load:', channel.avatar);
                          e.currentTarget.src = '/placeholder-avatar.png';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-black uppercase">
                        {channel.username || channel.channelName || channel.displayName || channel.title || channel.display_name}
                      </h3>
                      {channel.follower_count !== undefined && (
                        <p className="text-sm text-gray-700">
                          {formatViews(channel.follower_count)} followers
                        </p>
                      )}
                      {channel.followerCount !== undefined && (
                        <p className="text-sm text-gray-700">
                          {formatViews(channel.followerCount)} followers
                        </p>
                      )}
                      {channel.subscriberCount !== undefined && (
                        <p className="text-sm text-gray-700">
                          {formatViews(parseInt(channel.subscriberCount))} subscribers
                        </p>
                      )}
                      {channel.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {channel.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Video selection controls */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-sm font-bold">
                {selectedContent.length} of {videos.length} videos selected
              </p>
              <Button
                size="sm"
                variant="neutral"
                onClick={() => {
                  if (selectedContent.length === videos.length) {
                    setSelectedContent([]);
                  } else {
                    setSelectedContent(videos.map(v => v.id || v.video_id || v.videoId));
                  }
                }}
              >
                {selectedContent.length === videos.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </Button>
            </div>

            {/* Help text for video previews */}
            {selectedPlatform === 'tiktok' && (
              <Card className="bg-blue-50 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UilInfoCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-bold text-sm">Video Preview Tip</p>
                      <p className="text-xs text-gray-700">Hover and hold on a video for 0.5 seconds to see a preview</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video: any, index: number) => {
                const videoId = video.id || video.video_id || video.videoId;
                const isSelected = selectedContent.includes(videoId);
                const preview = getPreview(videoId, selectedPlatform as 'tiktok' | 'youtube' | 'twitch');
                const isHovered = hoveredVideoId === videoId;
                
                if (isHovered && preview) {
                  console.log('[ContentSelection] Preview state for', videoId, ':', {
                    loading: preview.loading,
                    hasUrl: !!preview.previewUrl,
                    url: preview.previewUrl,
                    error: preview.error
                  });
                }
                
                return (
                  <div
                    key={videoId || `video-${index}`}
                    className="relative cursor-pointer transform transition-all hover:scale-105"
                    onClick={() => toggleContentSelection(videoId)}
                  >
                    <Card className={`border-4 border-border overflow-hidden shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${
                      isSelected ? 'ring-4 ring-pink-500 bg-pink-50' : 'bg-background'
                    }`}>
                      <div 
                        className="relative"
                        onMouseEnter={() => handleVideoHover(videoId, video.playAddr || video.downloadAddr || video.url || video.videoUrl)}
                        onMouseLeave={handleVideoLeave}
                      >
                        {/* Base thumbnail - always visible */}
                        <Image 
                          src={video.thumbnail || video.thumbnails?.[0]?.url || '/placeholder.jpg'} 
                          alt={video.title || video.description}
                          width={180}
                          height={320}
                          className={`w-full object-cover aspect-[9/16]`}
                          unoptimized={(video.thumbnail && video.thumbnail.includes('tiktokcdn')) || (video.thumbnails?.[0]?.url && video.thumbnails[0].url.includes('tiktokcdn'))}
                          onError={(e) => {
                            console.warn('[ContentSelection] Video thumbnail failed to load:', video.thumbnail || video.thumbnails?.[0]?.url);
                            e.currentTarget.src = '/placeholder.jpg';
                          }}
                        />
                        
                        {/* Video overlay - show cached download playback for hover (TikTok only) */}
                        {isHovered && selectedPlatform === 'tiktok' && (
                          <div className="absolute inset-0">
                            <video
                              key={`video-${videoId}`}
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download/${videoId}`}
                              className={`w-full h-full object-cover transition-opacity duration-300 ${getVideoLoadingState(videoId) === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                              loop
                              playsInline
                              preload="metadata"
                              onCanPlay={() => {
                                updateVideoLoadingState(videoId, 'loaded');
                              }}
                              onLoadedData={(e) => {
                                const el = e.currentTarget as HTMLVideoElement;
                                try {
                                  el.muted = false;
                                  el.volume = 0.6;
                                  const p = el.play();
                                  if (p && typeof p.then === 'function') {
                                    p.catch(() => {/* autoplay with sound may be blocked */});
                                  }
                                } catch {}
                              }}
                              onError={() => {
                                updateVideoLoadingState(videoId, 'idle');
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Progressive loading overlay - hidden when loaded */}
                        {isHovered && getVideoLoadingState(videoId) !== 'loaded' && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center transition-opacity duration-300">
                            <div className="flex flex-col items-center">
                              {(() => {
                                const loadingState = getVideoLoadingState(videoId);
                                
                                if (loadingState === 'preparing' && hoverStartTime && Date.now() - hoverStartTime < 500) {
                                  return (
                                    <>
                                      <UilSpinner className="h-8 w-8 text-white animate-spin mb-2" />
                                      <p className="text-white text-xs font-semibold">Preparing preview...</p>
                                    </>
                                  );
                                } else if (loadingState === 'loading') {
                                  return (
                                    <>
                                      <UilSpinner className="h-10 w-10 text-white animate-spin mb-2" />
                                      <p className="text-white text-xs font-semibold">Loading video...</p>
                                    </>
                                  );
                                } else if (loadingState === 'canplay') {
                                  return (
                                    <>
                                      <UilSpinner className="h-8 w-8 text-white animate-spin mb-2" />
                                      <p className="text-white text-xs font-semibold">Starting playback...</p>
                                    </>
                                  );
                                } else if (!preview?.previewUrl && !preview?.loading) {
                                  return (
                                    <>
                                      <UilPlay className="h-12 w-12 text-white mb-2" />
                                      <p className="text-white text-xs font-semibold">Hold to preview</p>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {/* Error overlay */}
                        {isHovered && preview?.error && (
                          <div className="absolute inset-0 bg-red-900 bg-opacity-50 flex flex-col items-center justify-center p-2">
                            <p className="text-white text-xs font-bold text-center">Preview unavailable</p>
                            <p className="text-white text-xs mt-1">Try hovering again</p>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 border-2 border-black flex items-center justify-center">
                            <UilCheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-bold text-sm line-clamp-2">
                          {video.title || video.description || 'Untitled'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <UilClock className="h-3 w-3" />
                            <span>{formatDuration(video.duration || 0)}</span>
                          </div>
                          {video.viewCount !== undefined && (
                            <>
                              <span>·</span>
                              <div className="flex items-center gap-1">
                                <UilEye className="h-3 w-3" />
                                <span>{formatViews(video.viewCount)}</span>
                              </div>
                            </>
                          )}
                          {video.play_count !== undefined && (
                            <>
                              <span>·</span>
                              <div className="flex items-center gap-1">
                                <UilEye className="h-3 w-3" />
                                <span>{formatViews(video.play_count)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                variant="neutral"
                size="lg"
                className="flex-1 h-14 text-lg font-black uppercase"
                onClick={() => {
                  setSelectedContent([]);
                  handleStepChange(2);
                }}
              >
                <UilArrowLeft className="mr-2 h-6 w-6" />
                BACK
              </Button>
              <Button
                variant="default"
                size="lg"
                className={`flex-1 h-14 text-lg font-black uppercase ${!canProceedFromStep3() ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setCurrentStep(4)}
                disabled={!canProceedFromStep3()}
              >
                CONTINUE
                <UilArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>

            {/* Info Box */}
            <Card className="bg-yellow-100 mt-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="flex-shrink-0"
                  >
                    <UilInfoCircle className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-bold">CONTENT SELECTION TIPS</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Select videos that best represent your communication style. Longer videos with clear speech 
                      provide better training data. Mix different content types for a well-rounded AI clone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}