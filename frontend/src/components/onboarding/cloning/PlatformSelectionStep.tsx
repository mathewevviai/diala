'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star15 } from '@/components/ui/star';
import { UilYoutube, UilArrowRight, UilInfoCircle, UilUpload, UilCopy } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Platform } from './types';

interface PlatformSelectionStepProps {
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  setCurrentStep: (step: number) => void;
}

export function PlatformSelectionStep({ 
  selectedPlatform, 
  setSelectedPlatform, 
  setCurrentStep 
}: PlatformSelectionStepProps) {
  
  const canProceedFromStep1 = () => selectedPlatform !== '';

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              CHOOSE CONTENT SOURCE
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Select where your content comes from. We&apos;ll analyze the voice patterns and style to create your AI clone.
            </p>
          </div>
          
          <TooltipProvider>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="relative">
                {selectedPlatform === 'youtube' && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          SELECTED
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`cursor-pointer shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all ${
                        selectedPlatform === 'youtube' ? 'bg-pink-100' : 'bg-background'
                      }`}
                      onClick={() => setSelectedPlatform('youtube')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-red-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilYoutube className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">YOUTUBE</h4>
                        <p className="text-sm text-gray-600 mt-2">Clone from channel videos</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Clone YouTube channels and videos. Supports playlists, individual videos, and entire channel libraries.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {selectedPlatform === 'twitch' && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          SELECTED
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`cursor-pointer shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all ${
                        selectedPlatform === 'twitch' ? 'bg-pink-100' : 'bg-background'
                      }`}
                      onClick={() => setSelectedPlatform('twitch')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-purple-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <Image src="/twitch.svg" alt="Twitch" width={40} height={40} className="h-10 w-10 filter brightness-0 invert" />
                        </div>
                        <h4 className="font-black uppercase text-xl">TWITCH</h4>
                        <p className="text-sm text-gray-600 mt-2">Clone from stream archives</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Import Twitch streams and VODs. Perfect for gaming content, live commentary, and interactive streams.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {selectedPlatform === 'tiktok' && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          SELECTED
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`cursor-pointer shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all ${
                        selectedPlatform === 'tiktok' ? 'bg-pink-100' : 'bg-background'
                      }`}
                      onClick={() => setSelectedPlatform('tiktok')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-black border-4 border-border shadow-shadow flex items-center justify-center">
                          <Image src="/tiktok.svg" alt="TikTok" width={40} height={40} className="h-10 w-10 filter brightness-0 invert" />
                        </div>
                        <h4 className="font-black uppercase text-xl">TIKTOK</h4>
                        <p className="text-sm text-gray-600 mt-2">Clone from creator videos</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Clone TikTok creators and their content style. Ideal for short-form, engaging video content.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                {selectedPlatform === 'upload' && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          SELECTED
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`cursor-pointer shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all ${
                        selectedPlatform === 'upload' ? 'bg-pink-100' : 'bg-background'
                      }`}
                      onClick={() => setSelectedPlatform('upload')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-pink-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilUpload className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">UPLOAD</h4>
                        <p className="text-sm text-gray-600 mt-2">Use your own files</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Upload video or audio files directly. Support for MP4, MOV, AVI, WebM, MP3, and WAV formats.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>

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
                  <p className="text-sm font-bold">GETTING STARTED</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Pick your content source above. For best results, choose platforms with clear speech and consistent voice quality. 
                    You&apos;ll need access to the content (channel name, video links, or files).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="default"
            size="lg"
            className={`w-full mt-8 h-14 text-lg font-black uppercase ${!canProceedFromStep1() ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setCurrentStep(2)}
            disabled={!canProceedFromStep1()}
          >
            <span className="flex items-center justify-center">
              CONTINUE
              <UilArrowRight className="ml-2 h-6 w-6" />
            </span>
          </Button>
        </CardContent>
      </Card>

      <Card className="transform -rotate-1 relative overflow-hidden bg-pink-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0"
            >
              <UilCopy className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                AI VOICE CLONING TECHNOLOGY
              </h3>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Advanced AI technology analyzes <span className="font-black text-pink-600">speech patterns, tone, and personality</span> from any content. 
                Create digital twins that sound and communicate just like the original creator, perfect for scaling presence across multiple channels.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                  <span className="text-black font-medium">Voice pattern analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                  <span className="text-black font-medium">Personality matching</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                  <span className="text-black font-medium">Content style learning</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                  <span className="text-black font-medium">Multi-language support</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}