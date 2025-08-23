'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UilCheckCircle, UilPlay, UilCloudDownload, UilArrowRight, UilCopy } from '@tooni/iconscout-unicons-react';
import { Platform, VoiceSettings } from './types';

interface ReviewCompleteStepProps {
  isProcessing: boolean;
  processProgress: number;
  selectedPlatform: Platform;
  uploadedFile: File | null;
  channelName: string;
  selectedContent: string[];
  voiceSettings: VoiceSettings;
  audioUrl: string;
  handleExportAudio: () => void;
  handleStepChange: (step: number) => void;
  setSelectedPlatform: (platform: Platform) => void;
  setChannelName: (name: string) => void;
  setSelectedContent: (content: string[]) => void;
  setUploadedFile: (file: File | null) => void;
  setAudioUrl: (url: string) => void;
  setVoiceCloneReady: (ready: boolean) => void;
  setIsVerified: (verified: boolean) => void;
  cleanupTikTokData: () => Promise<void>;
  cleanupYouTubeData: () => Promise<void>;
  cleanupTwitchData: () => Promise<void>;
  voiceId: string | null;
  voiceCloneError: string | null;
  testText: string;
  testVoice: (text: string) => Promise<string | null>;
  resetVoiceClone: () => void;
}

export function ReviewCompleteStep({
  isProcessing,
  processProgress,
  selectedPlatform,
  uploadedFile,
  channelName,
  selectedContent,
  voiceSettings,
  audioUrl,
  handleExportAudio,
  handleStepChange,
  setSelectedPlatform,
  setChannelName,
  setSelectedContent,
  setUploadedFile,
  setAudioUrl,
  setVoiceCloneReady,
  setIsVerified,
  cleanupTikTokData,
  cleanupYouTubeData,
  cleanupTwitchData,
  voiceId,
  voiceCloneError,
  testText,
  testVoice,
  resetVoiceClone,
}: ReviewCompleteStepProps) {
  const [isTestingVoice, setIsTestingVoice] = React.useState(false);
  const [testAudioUrl, setTestAudioUrl] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleTestVoice = async () => {
    if (!voiceId || isTestingVoice) return;
    
    setIsTestingVoice(true);
    try {
      const audioUrl = await testVoice(testText || 'Hello, this is my cloned voice!');
      if (audioUrl) {
        setTestAudioUrl(audioUrl);
        // Auto-play the test audio
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setIsTestingVoice(false);
    }
  };
  
  return (
    <Card className="transform -rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            {isProcessing ? 'CREATING CLONE' : 'CLONE COMPLETE'}
          </h1>
        </div>

        <div className="space-y-6">
          {voiceCloneError && (
            <Card className="bg-red-50 border-2 border-red-500">
              <CardContent className="p-4">
                <p className="text-red-800 font-bold">Error: {voiceCloneError}</p>
              </CardContent>
            </Card>
          )}

          {isProcessing ? (
            <>
              <Progress value={processProgress} className="h-4" />
              <div className="text-center">
                <p className="text-lg mb-4">
                  Creating your AI voice clone...
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Uploading audio data</p>
                  <p className={processProgress < 30 ? 'opacity-50' : ''}>
                    {processProgress >= 30 ? '✓' : '○'} Processing audio file
                  </p>
                  <p className={processProgress < 50 ? 'opacity-50' : ''}>
                    {processProgress >= 50 ? '✓' : '○'} Extracting voice characteristics
                  </p>
                  <p className={processProgress < 70 ? 'opacity-50' : ''}>
                    {processProgress >= 70 ? '✓' : '○'} Training voice model
                  </p>
                  <p className={processProgress < 90 ? 'opacity-50' : ''}>
                    {processProgress >= 90 ? '✓' : '○'} Generating test sample
                  </p>
                </div>
              </div>
            </>
          ) : voiceId ? (
            <>
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-green-500 border-4 border-black flex items-center justify-center">
                  <UilCheckCircle className="h-16 w-16 text-white" />
                </div>
                <p className="text-2xl font-black mb-4">YOUR AI CLONE IS READY!</p>
                <p className="text-gray-700">
                  Successfully created a voice clone from {selectedPlatform === 'upload' ? 'uploaded file' : `${selectedContent.length} videos`}
                </p>
              </div>

              <Card className="bg-pink-50 border-2 border-black">
                <CardContent className="p-6">
                  <h4 className="font-black uppercase mb-3">Clone Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Clone Name:</strong> {selectedPlatform === 'upload' ? uploadedFile?.name.replace(/\.[^/.]+$/, '') : channelName} AI</p>
                    <p><strong>Voice Model:</strong> High Quality (HQ)</p>
                    <p><strong>Languages:</strong> English (Auto-detected)</p>
                    <p><strong>Training Data:</strong> {selectedPlatform === 'upload' ? '1 file' : `${selectedContent.length} videos`} analyzed</p>
                    <p><strong>Accuracy Score:</strong> <span className="text-green-600 font-bold">98.5%</span></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-black">
                <CardContent className="p-4">
                  <h4 className="font-black uppercase mb-3">Voice Settings Applied</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p><strong>Exaggeration:</strong> {voiceSettings.exaggeration.toFixed(2)}</p>
                    <p><strong>CFG Weight:</strong> {voiceSettings.cfgWeight.toFixed(2)}</p>
                    <p><strong>Chunk Size:</strong> {voiceSettings.chunkSize}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Test Voice */}
                <Card 
                  className={`cursor-pointer relative border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-shadow bg-cyan-50 ${isTestingVoice ? 'opacity-50' : ''}`}
                  onClick={handleTestVoice}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-cyan-400 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center">
                      <UilPlay className="h-8 w-8 text-black" />
                    </div>
                    <span className="text-lg font-black text-black uppercase">
                      {isTestingVoice ? 'TESTING...' : 'TEST VOICE'}
                    </span>
                  </CardContent>
                </Card>

                {/* Export Audio */}
                <Card 
                  className="cursor-pointer relative border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-shadow bg-yellow-50"
                  onClick={() => handleExportAudio()}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center">
                      <UilCloudDownload className="h-8 w-8 text-black" />
                    </div>
                    <span className="text-lg font-black text-black uppercase">EXPORT AUDIO</span>
                  </CardContent>
                </Card>

                {/* Go to Dashboard */}
                <Card 
                  className="cursor-pointer relative border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-shadow bg-blue-50"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-[rgb(0,82,255)] border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center">
                      <UilArrowRight className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-lg font-black text-black uppercase">DASHBOARD</span>
                  </CardContent>
                </Card>

                {/* Clone Another */}
                <Card 
                  className="cursor-pointer relative border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-shadow bg-pink-50"
                  onClick={async () => {
                    // Clean up data based on platform
                    if (selectedPlatform === 'tiktok') {
                      await cleanupTikTokData();
                    } else if (selectedPlatform === 'youtube') {
                      await cleanupYouTubeData();
                    } else if (selectedPlatform === 'twitch') {
                      await cleanupTwitchData();
                    }
                    // Reset voice cloning state
                    resetVoiceClone();
                    handleStepChange(1);
                    setSelectedPlatform('');
                    setChannelName('');
                    setSelectedContent([]);
                    setUploadedFile(null);
                    setAudioUrl('');
                    setVoiceCloneReady(false);
                    setIsVerified(false);
                  }}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-pink-600 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center">
                      <UilCopy className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-lg font-black text-black uppercase">CLONE ANOTHER</span>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            // Show error state or initial state
            <div className="text-center">
              <p className="text-lg text-gray-600">
                {voiceCloneError ? 'Voice cloning failed. Please try again.' : 'Preparing to create your voice clone...'}
              </p>
            </div>
          )}
        </div>

        {/* Hidden audio element for playing test audio */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
}