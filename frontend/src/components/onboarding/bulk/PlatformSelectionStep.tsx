'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star15 } from '@/components/ui/star';
import { UilYoutube, UilArrowRight, UilInfoCircle, UilDatabase, UilFileAlt, UilGlobe } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Platform, BulkOnboardingState } from './types';

interface PlatformSelectionStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  // Optionally disable certain platforms (e.g., 'youtube', 'twitch')
  disabledPlatforms?: Platform[];
  disabledTooltipText?: string;
}

export function PlatformSelectionStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange,
  disabledPlatforms = [],
  disabledTooltipText = 'Coming soon'
}: PlatformSelectionStepProps) {
  
  const canProceedFromStep1 = () => state.selectedPlatform !== '';

  const isDisabled = (platform: Platform) => disabledPlatforms.includes(platform);

  const handlePlatformSelect = (platform: Platform) => {
    console.log('Platform selected:', platform);
    if (isDisabled(platform)) {
      return;
    }
    if (platform === 'documents') {
      setState({ 
        selectedPlatform: platform,
        selectedInputMethod: 'upload' // Pre-set input method for documents
      });
    } else {
      setState({ selectedPlatform: platform });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              CHOOSE CONTENT SOURCE
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Select your content platform. We&apos;ll process the content to create vector embeddings for your knowledge base.
            </p>
          </div>
          
          <TooltipProvider>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <div className="relative">
                {state.selectedPlatform === 'youtube' && (
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
                      className={`shadow-shadow transition-all ${
                        state.selectedPlatform === 'youtube' ? 'bg-orange-100' : 'bg-background'
                      } ${isDisabled('youtube') ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none'}`}
                      onClick={() => handlePlatformSelect('youtube')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-red-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilYoutube className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">YOUTUBE</h4>
                        <p className="text-sm text-gray-600 mt-2">Process channel content</p>
                        {isDisabled('youtube') && (
                          <div className="mt-2 inline-block px-2 py-1 bg-gray-200 border-2 border-black text-xs font-bold uppercase">{disabledTooltipText}</div>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{isDisabled('youtube') ? disabledTooltipText : 'Extract transcripts from YouTube channels and videos. Perfect for educational content, tutorials, and long-form discussions.'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {state.selectedPlatform === 'twitch' && (
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
                      className={`shadow-shadow transition-all ${
                        state.selectedPlatform === 'twitch' ? 'bg-orange-100' : 'bg-background'
                      } ${isDisabled('twitch') ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none'}`}
                      onClick={() => handlePlatformSelect('twitch')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-purple-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <Image src="/twitch.svg" alt="Twitch" width={40} height={40} className="h-10 w-10 filter brightness-0 invert" />
                        </div>
                        <h4 className="font-black uppercase text-xl">TWITCH</h4>
                        <p className="text-sm text-gray-600 mt-2">Process stream content</p>
                        {isDisabled('twitch') && (
                          <div className="mt-2 inline-block px-2 py-1 bg-gray-200 border-2 border-black text-xs font-bold uppercase">{disabledTooltipText}</div>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{isDisabled('twitch') ? disabledTooltipText : 'Extract content from Twitch streams and VODs. Great for gaming discussions, live commentary, and community interactions.'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {state.selectedPlatform === 'tiktok' && (
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
                        state.selectedPlatform === 'tiktok' ? 'bg-orange-100' : 'bg-background'
                      }`}
                      onClick={() => handlePlatformSelect('tiktok')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-black border-4 border-border shadow-shadow flex items-center justify-center">
                          <Image src="/tiktok.svg" alt="TikTok" width={40} height={40} className="h-10 w-10 filter brightness-0 invert" />
                        </div>
                        <h4 className="font-black uppercase text-xl">TIKTOK</h4>
                        <p className="text-sm text-gray-600 mt-2">Process creator content</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Extract transcripts from TikTok videos. Ideal for short-form content, trends, and viral video analysis.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {state.selectedPlatform === 'documents' && (
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
                        state.selectedPlatform === 'documents' ? 'bg-orange-100' : 'bg-background'
                      }`}
                      onClick={() => handlePlatformSelect('documents')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-blue-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilFileAlt className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">DOCUMENTS</h4>
                        <p className="text-sm text-gray-600 mt-2">Upload your files</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Upload PDF, Word, text, and markdown documents. Perfect for creating knowledge bases from your own content.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {state.selectedPlatform === 'web' && (
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
                        state.selectedPlatform === 'web' ? 'bg-orange-100' : 'bg-background'
                      }`}
                      onClick={() => handlePlatformSelect('web')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-green-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilGlobe className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">WEB PAGES</h4>
                        <p className="text-sm text-gray-600 mt-2">Process website content</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Extract content from web pages and websites. Perfect for creating knowledge bases from online documentation, articles, and web content.</p>
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
                  <p className="text-sm font-bold">BULK PROCESSING INFO</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Bulk processing will extract transcripts from multiple videos, chunk the content, and create vector embeddings. 
                    Choose platforms with good audio quality for the best transcript accuracy.
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

      <Card className="transform -rotate-1 relative overflow-hidden bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0"
            >
              <UilDatabase className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                VECTOR DATABASE CREATION
              </h3>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Advanced AI technology extracts <span className="font-black text-orange-600">transcripts, creates embeddings, and builds searchable knowledge bases</span> from any content. 
                Perfect for creating AI assistants, content recommendations, and intelligent search systems.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-black font-medium">Automatic transcription</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-black font-medium">Smart content chunking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-black font-medium">Vector embeddings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-black font-medium">Multiple export formats</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}