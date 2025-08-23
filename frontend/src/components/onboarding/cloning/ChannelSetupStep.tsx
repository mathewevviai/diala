'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UilYoutube, UilPlay, UilVideo, UilArrowRight, UilArrowLeft, UilInfoCircle, UilUpload } from '@tooni/iconscout-unicons-react';
import { Platform } from './types';

interface ChannelSetupStepProps {
  selectedPlatform: Platform;
  channelName: string;
  setChannelName: (name: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  setAudioUrl: (url: string) => void;
  setCurrentStep: (step: number) => void;
  handleLoadContent: () => void;
  handleStepChange: (step: number) => void;
  fetchedChannelsRef: React.MutableRefObject<Set<string>>;
}

export function ChannelSetupStep({
  selectedPlatform,
  channelName,
  setChannelName,
  uploadedFile,
  setUploadedFile,
  setAudioUrl,
  setCurrentStep,
  handleLoadContent,
  handleStepChange,
  fetchedChannelsRef,
}: ChannelSetupStepProps) {
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const canProceedFromStep2 = () => {
    if (selectedPlatform === 'upload') {
      return uploadedFile !== null;
    }
    return channelName.trim() !== '';
  };

  return (
    <Card className="transform rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            {selectedPlatform === 'upload' ? 'UPLOAD MEDIA' : 'CHANNEL DETAILS'}
          </h1>
        </div>
        
        <div className="space-y-6">
          {selectedPlatform === 'upload' ? (
            <>
              <Card className="bg-pink-50">
                <CardContent className="p-8">
                  <div className="border-4 border-dashed border-border rounded-lg p-8 text-center bg-background">
                    <input
                      type="file"
                      accept=".mp4,.mov,.avi,.webm,.mp3,.wav"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Button size="icon" variant="default" className="w-16 h-16 mb-4">
                        <UilUpload className="h-8 w-8" />
                      </Button>
                      <p className="text-lg font-bold">Click to upload media file</p>
                      <p className="text-sm text-gray-600 mt-2">Supported: MP4, MOV, AVI, WebM, MP3, WAV</p>
                    </label>
                  </div>
                  {uploadedFile && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-border rounded">
                      <p className="font-bold">✓ {uploadedFile.name} uploaded</p>
                      <p className="text-sm text-gray-600">Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <div>
                <label className="text-xl font-black uppercase mb-3 block">
                  {selectedPlatform === 'youtube' && 'YOUTUBE CHANNEL URL OR HANDLE'}
                  {selectedPlatform === 'twitch' && 'TWITCH USERNAME'}
                  {selectedPlatform === 'tiktok' && 'TIKTOK USERNAME'}
                </label>
                <Input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder={
                    selectedPlatform === 'youtube' ? 'e.g., @channelname or youtube.com/c/channelname' :
                    selectedPlatform === 'twitch' ? 'e.g., streamername' :
                    selectedPlatform === 'tiktok' ? 'e.g., @username' :
                    ''
                  }
                  className="h-16 text-lg font-semibold border-4 border-border rounded-base"
                />
              </div>


              <Card className="bg-pink-50">
                <CardContent className="p-4">
                  <h4 className="font-black uppercase mb-2 flex items-center gap-2">
                    {selectedPlatform === 'youtube' && <UilYoutube className="h-5 w-5" />}
                    {selectedPlatform === 'twitch' && <UilPlay className="h-5 w-5" />}
                    {selectedPlatform === 'tiktok' && <UilVideo className="h-5 w-5" />}
                    {selectedPlatform.toUpperCase()} CHANNEL INFO
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedPlatform === 'youtube' && 'Enter the channel URL or @handle. We\'ll fetch all public videos, analyze content style, and prepare for cloning.'}
                    {selectedPlatform === 'twitch' && 'Enter the Twitch username. We\'ll access recent VODs and clips to analyze streaming style and personality.'}
                    {selectedPlatform === 'tiktok' && 'Enter the TikTok @username. We\'ll analyze recent videos to capture the creator\'s unique style and energy.'}
                  </p>
                </CardContent>
              </Card>

            </>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            variant="neutral"
            size="lg"
            className="flex-1 h-14 text-lg font-black uppercase"
            onClick={() => {
              fetchedChannelsRef.current.clear();
              handleStepChange(1);
            }}
          >
            <UilArrowLeft className="mr-2 h-6 w-6" />
            BACK
          </Button>
          <Button
            variant="default"
            size="lg"
            className={`flex-1 h-14 text-lg font-black uppercase ${!canProceedFromStep2() ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleLoadContent}
            disabled={!canProceedFromStep2()}
          >
            LOAD CONTENT
            <UilArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>

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
                <p className="text-sm font-bold">CHANNEL ACCESS</p>
                <p className="text-sm text-gray-700 mt-1">
                  The system only accesses publicly available content. Private videos or subscriber-only content 
                  are not included in the cloning process. Channels must have sufficient content for accurate analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}