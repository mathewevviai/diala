'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star15 } from '@/components/ui/star';
import { UilLink, UilArrowRight, UilArrowLeft, UilInfoCircle, UilListUl, UilChannel, UilPlay } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BulkOnboardingState, InputType } from './types';

interface InputMethodStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  handleLoadContent: () => Promise<void>;
}

export function InputMethodStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange,
  handleLoadContent
}: InputMethodStepProps) {
  
  const canProceedFromStep2 = () => {
    if (state.selectedInputMethod === 'urls' || state.selectedPlatform === 'web') {
      return state.pastedUrls.length > 0 && state.pastedUrls.length <= 20;
    }
    return state.channelUrl.trim() !== '';
  };

  const handleInputMethodSelect = (inputMethod: InputType) => {
    setState({ 
      selectedInputMethod: inputMethod,
      channelUrl: '',
      pastedUrls: []
    });
  };

  const handleChannelUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ channelUrl: e.target.value });
  };

  const handlePastedUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
    setState({ pastedUrls: urls });
  };

  const handleContinue = async () => {
    console.log("[InputMethodStep] Continue clicked. Triggering handleLoadContent.");
    await handleLoadContent();
  };

  const handlePreviewChannel = async () => {
    console.log("[InputMethodStep] Preview channel clicked");
    // This will trigger the preview mode in the parent component
    setState({ isLoading: true, currentStep: 3 });
    await handleLoadContent();
  };

  const getPlatformInfo = () => {
    switch (state.selectedPlatform) {
      case 'youtube':
        return {
          name: 'YouTube',
          channelPlaceholder: 'Enter YouTube channel URL or @username',
          urlsPlaceholder: 'https://youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://youtube.com/watch?v=...',
          channelExample: '@mkbhd or https://youtube.com/@mkbhd',
          urlsExample: 'YouTube video URLs, one per line'
        };
      case 'twitch':
        return {
          name: 'Twitch',
          channelPlaceholder: 'Enter Twitch channel URL or username',
          urlsPlaceholder: 'https://twitch.tv/videos/...\nhttps://twitch.tv/videos/...\nhttps://twitch.tv/videos/...',
          channelExample: 'shroud or https://twitch.tv/shroud',
          urlsExample: 'Twitch VOD URLs, one per line'
        };
      case 'tiktok':
        return {
          name: 'TikTok',
          channelPlaceholder: 'Enter TikTok user URL or @username',
          urlsPlaceholder: 'https://tiktok.com/@user/video/...\nhttps://tiktok.com/@user/video/...\nhttps://tiktok.com/@user/video/...',
          channelExample: '@username or https://tiktok.com/@username',
          urlsExample: 'TikTok video URLs, one per line'
        };
      case 'web':
        return {
          name: 'Web Pages',
          channelPlaceholder: 'Enter website URL',
          urlsPlaceholder: 'https://example.com/page1\nhttps://example.com/page2\nhttps://docs.example.com/article',
          channelExample: 'https://jina.ai or https://docs.example.com',
          urlsExample: 'Web page URLs, one per line'
        };
      default:
        return {
          name: 'Platform',
          channelPlaceholder: 'Enter channel URL or username',
          urlsPlaceholder: 'Enter URLs, one per line',
          channelExample: 'Channel name or URL',
          urlsExample: 'Video URLs, one per line'
        };
    }
  };

  const platformInfo = getPlatformInfo();

  if (state.selectedPlatform === 'web') {
    return (
      <div className="space-y-8">
        <Card className="transform -rotate-1">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                WEB PAGES
              </h1>
              <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
                ENTER YOUR URLs
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="pastedUrls" className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                  {platformInfo.name} URLs (Max 20)
                </label>
                <Textarea
                  id="pastedUrls"
                  placeholder={platformInfo.urlsPlaceholder}
                  value={state.pastedUrls.join('\n')}
                  onChange={handlePastedUrlsChange}
                  className="min-h-[120px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {platformInfo.urlsExample} ({state.pastedUrls.length}/20 URLs)
                </p>
              </div>
              
              {state.pastedUrls.length > 20 && (
                <div className="bg-red-100 border-2 border-red-500 p-3 rounded">
                  <p className="text-red-700 font-bold text-sm">
                    ⚠️ Maximum 20 URLs allowed. Please remove {state.pastedUrls.length - 20} URLs.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                variant="neutral"
                size="lg"
                className="flex-1 h-14 text-lg font-black uppercase"
                onClick={() => handleStepChange(1)}
              >
                <UilArrowLeft className="mr-2 h-6 w-6" />
                BACK
              </Button>
              <Button
                variant="default"
                size="lg"
                className={`flex-1 h-14 text-lg font-black uppercase ${!canProceedFromStep2() ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleContinue}
                disabled={!canProceedFromStep2()}
              >
                <span className="flex items-center justify-center">
                  CONTINUE
                  <UilArrowRight className="ml-2 h-6 w-6" />
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              INPUT METHOD
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Choose how to specify the {platformInfo.name} content you want to process.
            </p>
          </div>
          
          <TooltipProvider>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="relative">
                {state.selectedInputMethod === 'channel' && (
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
                        state.selectedInputMethod === 'channel' ? 'bg-orange-100' : 'bg-background'
                      }`}
                      onClick={() => handleInputMethodSelect('channel')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-blue-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilChannel className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">CHANNEL/USER</h4>
                        <p className="text-sm text-gray-600 mt-2">Process entire channel</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Enter a {platformInfo.name} channel or user URL. We'll automatically fetch the latest videos from the channel.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative">
                {state.selectedInputMethod === 'urls' && (
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
                        state.selectedInputMethod === 'urls' ? 'bg-orange-100' : 'bg-background'
                      }`}
                      onClick={() => handleInputMethodSelect('urls')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-green-600 border-4 border-border shadow-shadow flex items-center justify-center">
                          <UilListUl className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-xl">SPECIFIC URLS</h4>
                        <p className="text-sm text-gray-600 mt-2">Process selected videos</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Paste specific {platformInfo.name} video URLs (one per line) to process only those videos. Maximum 20 URLs.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>

          {state.selectedInputMethod === 'channel' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="channelUrl" className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                  {platformInfo.name} Channel URL or Username
                </label>
                <Input
                  id="channelUrl"
                  type="text"
                  placeholder={platformInfo.channelPlaceholder}
                  value={state.channelUrl}
                  onChange={handleChannelUrlChange}
                  className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Example: {platformInfo.channelExample}
                </p>
              </div>
            </div>
          )}

          {state.selectedInputMethod === 'urls' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="pastedUrls" className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                  {platformInfo.name} Video URLs (Max 20)
                </label>
                <Textarea
                  id="pastedUrls"
                  placeholder={platformInfo.urlsPlaceholder}
                  value={state.pastedUrls.join('\n')}
                  onChange={handlePastedUrlsChange}
                  className="min-h-[120px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {platformInfo.urlsExample} ({state.pastedUrls.length}/20 URLs)
                </p>
              </div>
              
              {state.pastedUrls.length > 20 && (
                <div className="bg-red-100 border-2 border-red-500 p-3 rounded">
                  <p className="text-red-700 font-bold text-sm">
                    ⚠️ Maximum 20 URLs allowed. Please remove {state.pastedUrls.length - 20} URLs.
                  </p>
                </div>
              )}
            </div>
          )}

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
                  <p className="text-sm font-bold">PROCESSING LIMITS</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {state.selectedInputMethod === 'channel' ? 
                      `Channel processing will fetch up to 20 recent videos automatically. For specific content, use the URL method.` :
                      `You can process up to 20 videos at once. Each video will be transcribed and processed into vector embeddings.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button
              variant="neutral"
              size="lg"
              className="flex-1 h-14 text-lg font-black uppercase"
              onClick={() => handleStepChange(1)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              variant="default"
              size="lg"
              className={`flex-1 h-14 text-lg font-black uppercase ${!canProceedFromStep2() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleContinue}
              disabled={!canProceedFromStep2()}
            >
              <span className="flex items-center justify-center">
                LOAD CONTENT
                <UilArrowRight className="ml-2 h-6 w-6" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
