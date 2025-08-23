'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useConvex, useAction, useMutation, useQuery } from 'convex/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilPhone, UilPhoneVolume, UilWifi, UilMicrophone, UilCheckCircle, UilRocket, UilInfoCircle, UilChartGrowth } from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import InfoSection from '@/components/custom/info-section';
import { RTCPhoneDialer } from '@/components/custom/rtc/rtc-phone-dialer-realistic';
import { api } from '@convex/_generated/api';
import { toast } from 'sonner';

// --- Main RTC App with Convex Integration ---
export default function RTCOnboardingPage() {
  const convex = useConvex();
  const [currentStep, setCurrentStep] = useState(1);
  const [callId, setCallId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [sentiment, setSentiment] = useState<string>('neutral');
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  
  // Real Convex actions
  const startCall = useAction(api.telephonyActions.startCall);
  const processAudioChunk = useAction(api.telephonyActions.processAudioChunk);
  const endCall = useAction(api.telephonyActions.endCall);
  const getRealtimeTranscript = api.queries.telephony.getRealtimeTranscript;
  
  // WebRTC refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique call ID
  const generateCallId = () => `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle dialer call completion
  const handleDialerCallComplete = (duration: number, voiceType: string, wasRecorded: boolean) => {
    setCallDuration(duration);
    setIsRecording(wasRecorded);
    setCurrentStep(4); // Move to call complete
    
    toast.success('Call Completed', {
      description: `Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div 
        className="min-h-screen bg-orange-500 relative pb-8"
        style={{ 
          fontFamily: 'Noyh-Bold, sans-serif',
          backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
          <div className="w-full max-w-6xl space-y-8">
            {/* Header Title Card */}
            <Card className="transform rotate-1 relative overflow-hidden">
              <CardHeader className="relative">
                {/* Decorative elements */}
                <div className="absolute top-2 left-4 w-8 h-8 bg-orange-600 border-2 border-black flex items-center justify-center">
                  <UilWifi className="h-4 w-4 text-white" />
                </div>
                <div className="absolute top-2 right-4 w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
                  <UilPhoneVolume className="h-4 w-4 text-white" />
                </div>
                <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                  <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
                </div>
                <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
                
                {/* Central icon button */}
                <div className="flex justify-center mb-4">
                  <Button variant="header" className="w-20 h-20 bg-orange-600 hover:bg-orange-700 p-0">
                    {currentStep === 1 && <UilWifi className="h-12 w-12 text-white" />}
                    {currentStep === 2 && <UilPhone className="h-12 w-12 text-white" />}
                    {currentStep === 3 && <UilMicrophone className="h-12 w-12 text-white" />}
                    {currentStep === 4 && <UilCheckCircle className="h-12 w-12 text-white" />}
                  </Button>
                </div>
                
                {/* Dynamic title */}
                <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                  {currentStep === 1 && 'CONVEX TELEPHONY DEMO'}
                  {currentStep === 2 && 'PHONE DIALER'}
                  {currentStep === 3 && 'LIVE CALL'}
                  {currentStep === 4 && 'CALL COMPLETE'}
                </CardTitle>
                
                {/* Subtitle */}
                <p className="text-lg md:text-xl text-gray-700 mt-4 text-center">
                  {currentStep === 1 && 'Experience real-time ASR with Convex'}
                  {currentStep === 2 && 'Enter a phone number to call'}
                  {currentStep === 3 && `Duration: ${formatDuration(callDuration)}`}
                  {currentStep === 4 && 'Your telephony journey begins here'}
                </p>
                
                {/* Animated decorative bars */}
                <div className="flex justify-center items-center mt-3 gap-2">
                  <div className="w-3 h-3 bg-orange-600 animate-pulse"></div>
                  <div className="w-2 h-6 bg-black"></div>
                  <div className="w-4 h-4 bg-orange-500 animate-pulse delay-150"></div>
                  <div className="w-2 h-8 bg-black"></div>
                  <div className="w-3 h-3 bg-orange-600 animate-pulse delay-300"></div>
                </div>
              </CardHeader>
            </Card>

            {/* Step-based Content */}
            {currentStep === 1 && (
              <Card className="bg-white border-2 border-black">
                <CardContent className="text-center space-y-6 py-8">
                  <h2 className="text-3xl font-bold text-black">Real-Time Telephony with Convex</h2>
                  <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                    Experience live audio processing with automatic speech recognition, sentiment analysis, and speaker diarization using Convex actions and real-timers.
                  </p>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-bold"
                  >
                    Open Phone Dialer
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-white border-2 border-black">
                <CardContent className="py-8">
                  <h2 className="text-2xl font-bold text-black text-center mb-6">Phone Dialer</h2>
                  <RTCPhoneDialer 
                    onCallComplete={handleDialerCallComplete}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Live Call Interface */}
                <Card className="bg-white border-2 border-black">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-black">Live Call - {formatDuration(callDuration)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Real-time Transcript */}
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="font-bold text-black mb-2">Live Transcript:</h3>
                      <div className="text-sm text-gray-700 h-20 overflow-y-auto">
                        {transcript || 'Listening...'}
                      </div>
                    </div>

                    {/* Sentiment Analysis */}
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-black">Sentiment:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        sentiment === 'positive' ? 'bg-green-200 text-green-800' :
                        sentiment === 'negative' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {sentiment}
                      </span>
                    </div>

                    {/* Speaker Detection */}
                    <div>
                      <span className="font-bold text-black">Speakers:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {speakers.map((speaker, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                            {speaker}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Call Controls */}
                    <div className="flex justify-center space-x-4">
                      <Button 
                        onClick={() => setCurrentStep(4)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                      >
                        End Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Visualization */}
                <Card className="bg-white border-2 border-black">
                  <CardContent className="text-center py-8">
                    <div className="text-6xl mb-4">
                      {isRecording ? '🎤' : '📞'}
                    </div>
                    <p className="text-lg text-gray-700">
                      {isRecording ? 'Recording audio...' : 'Click Start to begin'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold text-black">Call Complete!</h2>
                <div className="bg-white p-6 rounded-lg border-2 border-black">
                  <h3 className="text-xl font-bold mb-4">Call Summary</h3>
                  <div className="space-y-2 text-left">
                    <p><strong>Duration:</strong> {formatDuration(callDuration)}</p>
                    <p><strong>Final Sentiment:</strong> {sentiment}</p>
                    <p><strong>Speakers Detected:</strong> {speakers.length}</p>
                    <p><strong>Transcript Length:</strong> {transcript.length} characters</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setCurrentStep(1);
                    setCallId('');
                    setTranscript('');
                    setSentiment('neutral');
                    setSpeakers([]);
                    setCallDuration(0);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-bold"
                >
                  Start New Call
                </Button>
              </div>
            )}

            {/* Real-time Features */}
            {currentStep === 3 && (
              <Card className="bg-white border-2 border-black">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold text-black mb-4">Real-time Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <UilWifi className="h-4 w-4 text-orange-600" />
                      <span>WebRTC Connection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UilMicrophone className="h-4 w-4 text-orange-600" />
                      <span>Live Audio Processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UilPhone className="h-4 w-4 text-orange-600" />
                      <span>ASR Transcription</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UilChartGrowth className="h-4 w-4 text-orange-600" />
                      <span>Sentiment Analysis</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <div className="mt-8">
              <OnboardingFooter />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
