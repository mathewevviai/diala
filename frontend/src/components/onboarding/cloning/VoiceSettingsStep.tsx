'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { UilArrowRight, UilArrowLeft, UilInfoCircle, UilUpload, UilPlay, UilSpinner } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VoiceSettings, Platform, ModelData } from './types';
import { useVideoPreviewContext } from '@/contexts/VideoPreviewContext';

interface VoiceSettingsStepProps {
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  selectedContent: string[];
  selectedPlatform: Platform;
  selectedModel: ModelData | null;
  tiktokVideos: any[];
  youtubeVideos: any[];
  twitchVideos: any[];
}

export function VoiceSettingsStep({
  voiceSettings,
  setVoiceSettings,
  setCurrentStep,
  handleStepChange,
  selectedContent,
  selectedPlatform,
  selectedModel,
  tiktokVideos,
  youtubeVideos,
  twitchVideos,
}: VoiceSettingsStepProps) {
  
  const { generatePreview, getPreview } = useVideoPreviewContext();
  const [tooltipOpen, setTooltipOpen] = React.useState<string | null>(null);
  const currentVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [tooltipLoadingStates, setTooltipLoadingStates] = React.useState<Map<string, 'idle' | 'loading' | 'loaded'>>(new Map());

  const setTooltipVideoState = React.useCallback((videoId: string, state: 'idle' | 'loading' | 'loaded') => {
    setTooltipLoadingStates(prev => new Map(prev).set(videoId, state));
  }, []);

  const getTooltipVideoState = React.useCallback((videoId: string) => {
    return tooltipLoadingStates.get(videoId) || 'idle';
  }, [tooltipLoadingStates]);
  
  // Get the selected videos based on platform
  const videos = selectedPlatform === 'tiktok' ? tiktokVideos :
                 selectedPlatform === 'youtube' ? youtubeVideos :
                 selectedPlatform === 'twitch' ? twitchVideos : [];
  
  // Filter to only selected videos
  const selectedVideos = videos.filter((video: any) => {
    const videoId = video.id || video.video_id || video.videoId;
    return selectedContent.includes(videoId);
  });

  
  // Cleanup videos when component unmounts
  React.useEffect(() => {
    return () => {
      // Stop current video when leaving this step
      if (currentVideoRef.current) {
        currentVideoRef.current.pause();
        currentVideoRef.current.muted = true;
        currentVideoRef.current = null;
      }
      setTooltipOpen(null);
    };
  }, []);
  
  return (
    <Card className="transform -rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            VOICE CUSTOMIZATION
          </h1>
          <p className="text-lg text-gray-700 mt-2">
            Fine-tune voice parameters for optimal results
          </p>
        </div>

        {/* Selected Model Display */}
        {selectedModel && (
          <Card className="mb-8 bg-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 border-4 border-border shadow-shadow ${selectedModel.color} flex-shrink-0`}>
                  <selectedModel.Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase">{selectedModel.label}</h3>
                  <p className="text-gray-600">{selectedModel.tooltip}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedModel.voices.map((voice) => (
                      <Badge key={voice.id} variant="outline" className="border-2 border-black">
                        {voice.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <TooltipProvider>
          {/* Voice Exaggeration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-lg font-black uppercase block">
                VOICE EXAGGERATION: {voiceSettings.exaggeration.toFixed(2)}
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0 bg-transparent border-none outline-none">
                    <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Controls expressiveness. 0.5 is neutral, higher values are more extreme.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider 
              value={[voiceSettings.exaggeration]}
              onValueChange={(value) => setVoiceSettings({...voiceSettings, exaggeration: value[0]})}
              min={0.25}
              max={2.0}
              step={0.05}
              className="mb-2"
            />
            <p className="text-sm text-gray-600">
              {voiceSettings.exaggeration < 0.4 ? 'Very subtle - minimal expression' :
               voiceSettings.exaggeration > 1.5 ? 'Very extreme - may sound unstable' :
               voiceSettings.exaggeration === 0.5 ? 'Neutral expression' :
               'Balanced expressiveness'}
            </p>
          </div>

          {/* CFG Weight */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-lg font-black uppercase block">
                CFG/PACE CONTROL: {voiceSettings.cfgWeight.toFixed(2)}
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0 bg-transparent border-none outline-none">
                    <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Controls generation pace and consistency. Higher values follow prompt more closely.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider 
              value={[voiceSettings.cfgWeight]}
              onValueChange={(value) => setVoiceSettings({...voiceSettings, cfgWeight: value[0]})}
              min={0.5}
              max={3.0}
              step={0.1}
              className="mb-2"
            />
            <p className="text-sm text-gray-600">
              {voiceSettings.cfgWeight < 1.0 ? 'More creative, less controlled' :
               voiceSettings.cfgWeight > 2.5 ? 'Very controlled, may sound rigid' :
               'Balanced control and naturalness'}
            </p>
          </div>

          {/* Chunk Size */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-lg font-black uppercase block">
                CHUNK SIZE: {voiceSettings.chunkSize}
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0 bg-transparent border-none outline-none">
                    <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Controls audio generation chunk size. Larger = better quality but slower.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider 
              value={[voiceSettings.chunkSize]}
              onValueChange={(value) => setVoiceSettings({...voiceSettings, chunkSize: value[0]})}
              min={512}
              max={4096}
              step={256}
              className="mb-2"
            />
            <p className="text-sm text-gray-600">
              {voiceSettings.chunkSize < 1024 ? 'Fast generation, lower quality' :
               voiceSettings.chunkSize > 3072 ? 'High quality, slower generation' :
               'Balanced quality and speed'}
            </p>
          </div>

          {/* Selected Videos as Reference Audio */}
          <Card className="bg-pink-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-black uppercase mb-4">REFERENCE AUDIO SOURCE</h3>
              <div className="space-y-4">
                {selectedVideos.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-700">
                      Using audio from {selectedVideos.length} selected {selectedVideos.length === 1 ? 'video' : 'videos'} for voice cloning:
                    </p>
                    <div className="space-y-2">
                      {selectedVideos.map((video: any, index: number) => {
                        const videoId = video.id || video.video_id || video.videoId;
                        const thumbnail = video.thumbnail || video.thumbnails?.[0]?.url || '/placeholder.jpg';
                        const preview = getPreview(videoId, selectedPlatform as 'tiktok' | 'youtube' | 'twitch');
                        
                        return (
                          <div key={videoId || index} className="flex items-center gap-3 p-2 bg-background border-2 border-border relative">
                            <div className="w-5 h-5 bg-pink-500 border-2 border-border flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <Tooltip delayDuration={0} onOpenChange={(open) => {
                              if (open) {
                                // Only generate preview if needed
                                const preview = getPreview(videoId, selectedPlatform as 'tiktok' | 'youtube' | 'twitch');
                                if (!preview && selectedPlatform === 'tiktok') {
                                  generatePreview(videoId, 'tiktok', video.url || video.videoUrl);
                                }
                                setTooltipOpen(videoId);
                              } else {
                                setTooltipOpen(null);
                                // Pause current video when tooltip closes
                                if (currentVideoRef.current) {
                                  currentVideoRef.current.pause();
                                  currentVideoRef.current = null;
                                }
                              }
                            }}>
                              <TooltipTrigger asChild>
                                <div className="relative cursor-pointer">
                                  <Image 
                                    src={thumbnail}
                                    alt={video.title || video.description || 'Video thumbnail'}
                                    width={selectedPlatform === 'tiktok' ? 27 : 85}
                                    height={48}
                                    className={`h-12 object-cover border-2 border-border flex-shrink-0 ${
                                      selectedPlatform === 'tiktok' ? 'w-[27px]' : 'w-[85px]'
                                    }`}
                                    unoptimized={thumbnail.includes('tiktokcdn')}
                                    onError={(e) => {
                                      console.warn('[VoiceSettings] Tooltip thumbnail failed to load:', thumbnail);
                                      e.currentTarget.src = '/placeholder.jpg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                    <UilPlay className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="p-0 bg-transparent border-none">
                                <div className="bg-background border-4 border-border p-3 shadow-shadow min-w-[200px] max-w-[300px] relative">
                                  {selectedPlatform === 'tiktok' ? (
                                    <div className="relative">
                                      <video
                                        key={`tooltip-video-${videoId}`}
                                        ref={(el) => {
                                          if (el && tooltipOpen === videoId) {
                                            currentVideoRef.current = el;
                                          }
                                        }}
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download/${videoId}`}
                                        className={`w-full object-cover border-2 border-border mb-2 aspect-[9/16] max-h-[300px] transition-opacity duration-300 ${getTooltipVideoState(videoId) === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                                        loop
                                        playsInline
                                        preload="metadata"
                                        onLoadStart={() => setTooltipVideoState(videoId, 'loading')}
                                        onCanPlay={() => setTooltipVideoState(videoId, 'loaded')}
                                        onPlay={(e) => {
                                          const el = e.currentTarget as HTMLVideoElement;
                                          if (currentVideoRef.current && currentVideoRef.current !== el) {
                                            currentVideoRef.current.pause();
                                          }
                                          currentVideoRef.current = el;
                                        }}
                                        onLoadedData={(e) => {
                                          const el = e.currentTarget as HTMLVideoElement;
                                          try {
                                            el.muted = false;
                                            el.volume = 0.6;
                                            const p = el.play();
                                            if (p && typeof p.then === 'function') { p.catch(() => {}); }
                                          } catch {}
                                        }}
                                      />
                                      {getTooltipVideoState(videoId) !== 'loaded' && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                            <UilSpinner className="w-8 h-8 animate-spin text-white" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : preview?.previewUrl ? (
                                    <video
                                      key={`tooltip-video-${videoId}`}
                                      ref={(el) => {
                                        if (el && tooltipOpen === videoId) {
                                          currentVideoRef.current = el;
                                        }
                                      }}
                                      src={preview.previewUrl}
                                      className="w-full object-cover border-2 border-border mb-2 aspect-[9/16] max-h-[300px]"
                                      autoPlay
                                      muted={tooltipOpen !== videoId}
                                      loop
                                      playsInline
                                      onPlay={(e) => {
                                        const videoElement = e.currentTarget as HTMLVideoElement;
                                        if (currentVideoRef.current && currentVideoRef.current !== videoElement) {
                                          currentVideoRef.current.pause();
                                        }
                                        currentVideoRef.current = videoElement;
                                      }}
                                      onLoadedData={(e) => {
                                        const videoElement = e.currentTarget as HTMLVideoElement;
                                        videoElement.volume = 0.3;
                                      }}
                                    />
                                  ) : preview?.loading ? (
                                    <div className="w-full border-2 border-border mb-2 bg-secondary-background flex items-center justify-center aspect-[9/16] max-h-[300px]">
                                      <UilSpinner className="w-8 h-8 animate-spin text-pink-500" />
                                    </div>
                                  ) : (
                                    <Image 
                                      src={thumbnail}
                                      alt={video.title || video.description || 'Video preview'}
                                      width={180}
                                      height={320}
                                      className="w-full object-cover border-2 border-border mb-2 aspect-[9/16] max-h-[300px]"
                                      unoptimized={thumbnail.includes('tiktokcdn')}
                                      onError={(e) => {
                                        console.warn('[VoiceSettings] Preview thumbnail failed to load:', thumbnail);
                                        e.currentTarget.src = '/placeholder.jpg';
                                      }}
                                    />
                                  )}
                                  <p className="font-black text-sm mb-1 line-clamp-2">
                                    {video.title || video.description || 'Untitled Video'}
                                  </p>
                                  {video.duration && (
                                    <p className="text-xs text-gray-600 font-bold">
                                      Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                    </p>
                                  )}
                                  {video.viewCount !== undefined && (
                                    <p className="text-xs text-gray-600 font-bold">
                                      Views: {video.viewCount.toLocaleString()}
                                    </p>
                                  )}
                                  {preview?.error && (
                                    <p className="text-xs text-red-600 font-bold mt-1">
                                      Preview unavailable
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <p className="text-sm font-bold truncate flex-1">
                              {video.title || video.description || 'Untitled Video'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-yellow-100 border-2 border-border">
                      <UilInfoCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-xs font-bold">
                        Audio will be extracted and combined from these videos to create your custom voice clone.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 font-bold">NO VIDEOS SELECTED</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please go back and select videos to use as reference audio.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Premium Features Card */}
          <Card className="bg-gradient-to-br from-yellow-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase">PREMIUM VOICE FEATURES</h3>
                <Badge className="bg-yellow-400 text-black border-2 border-border px-3 py-1">
                  PRO
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase">Multi-Language Cloning</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-0 bg-transparent border-none outline-none">
                          <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Clone voices in 50+ languages with accent preservation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch disabled checked={false} />
                    <span className="text-xs font-bold text-yellow-600">LOCKED</span>
                  </div>
                </div>
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase">Real-Time Voice Morphing</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-0 bg-transparent border-none outline-none">
                          <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Change voice characteristics during live calls</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch disabled checked={false} />
                    <span className="text-xs font-bold text-yellow-600">LOCKED</span>
                  </div>
                </div>
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase">Emotional Intelligence</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-0 bg-transparent border-none outline-none">
                          <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>AI adapts emotional tone based on conversation context</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch disabled checked={false} />
                    <span className="text-xs font-bold text-yellow-600">LOCKED</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t-2 border-border">
                <Button 
                  variant="default"
                  size="lg"
                  className="w-full h-12 font-black uppercase"
                  onClick={() => window.location.href = '/pricing'}
                >
                  UPGRADE TO PRO
                  <UilArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
          </TooltipProvider>

          <div className="flex gap-4 mt-8">
            <Button
              variant="neutral"
              size="lg"
              className="flex-1 h-14 text-lg font-black uppercase"
              onClick={() => handleStepChange(4)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              variant="default"
              size="lg"
              className="flex-1 h-14 text-lg font-black uppercase"
              onClick={() => setCurrentStep(5)}
            >
              CONTINUE
              <UilArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}