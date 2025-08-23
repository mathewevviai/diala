'use client';

import * as React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { UilMicrophone, UilMicrophoneSlash, UilPhone, UilRobot } from '@tooni/iconscout-unicons-react';

// Custom hook for mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

interface WebVoiceInterfaceProps {
  userName: string;
  selectedVoiceAgent: string;
  selectedLanguage: string;
}

interface TranscriptEntry {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export default function WebVoiceInterface({ userName, selectedVoiceAgent, selectedLanguage }: WebVoiceInterfaceProps) {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [userGain, setUserGain] = React.useState(30);
  const [agentGain, setAgentGain] = React.useState(30);
  const [transcript, setTranscript] = React.useState<TranscriptEntry[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = React.useState<'user' | 'agent' | null>(null);
  const isMobile = useIsMobile();
  const transcriptEndRef = React.useRef<HTMLDivElement>(null);

  // Pre-generate stable particle positions to prevent re-render jittering
  const userParticles = React.useMemo(() => 
    Array.from({ length: isMobile ? 8 : 20 }, (_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2
    })), [isMobile]
  );

  const agentParticles = React.useMemo(() => 
    Array.from({ length: isMobile ? 8 : 20 }, (_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2
    })), [isMobile]
  );

  // Mock audio gain simulation
  React.useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        // Simulate conversation flow
        const random = Math.random();
        if (random < 0.3) {
          // User speaking
          setUserGain(50 + Math.random() * 40);
          setAgentGain(10 + Math.random() * 20);
          setCurrentSpeaker('user');
        } else if (random < 0.6) {
          // Agent speaking
          setUserGain(10 + Math.random() * 20);
          setAgentGain(50 + Math.random() * 40);
          setCurrentSpeaker('agent');
        } else {
          // Silence
          setUserGain(20 + Math.random() * 10);
          setAgentGain(20 + Math.random() * 10);
          setCurrentSpeaker(null);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Mock transcript generation
  React.useEffect(() => {
    if (isConnected) {
      const mockConversation = [
        { speaker: 'agent' as const, text: `Hello ${userName}! I'm ${selectedVoiceAgent}, your AI voice assistant. How can I help you today?`, delay: 2000 },
        { speaker: 'user' as const, text: "Hi! I'd like to know more about your voice capabilities.", delay: 5000 },
        { speaker: 'agent' as const, text: "I can help you with a variety of tasks through natural conversation. I support multiple languages and can assist with information, scheduling, and much more.", delay: 8000 },
        { speaker: 'user' as const, text: "That sounds great! Can you tell me what the weather is like?", delay: 12000 },
        { speaker: 'agent' as const, text: "I'd be happy to help with weather information. However, as this is a demo, I'm not connected to live weather data. In a real implementation, I could provide current conditions and forecasts.", delay: 15000 },
      ];

      mockConversation.forEach(({ speaker, text, delay }) => {
        setTimeout(() => {
          setTranscript(prev => [...prev, { speaker, text, timestamp: new Date() }]);
        }, delay);
      });
    }
  }, [isConnected, userName, selectedVoiceAgent]);

  // Auto-scroll to bottom when new transcript entries are added
  React.useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const requestMicrophonePermission = async () => {
    setIsConnecting(true);
    try {
      // Mock permission request
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHasPermission(true);
      setIsConnecting(false);
      
      // Connect to "service"
      setTimeout(() => {
        setIsConnected(true);
      }, 1000);
    } catch (error) {
      console.error('Microphone permission denied');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    setIsConnected(false);
    setHasPermission(false);
    setTranscript([]);
  };

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-[rgb(0,82,255)] flex items-center justify-center p-4" style={{ 
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage: `
          linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }}>
        <Card className="w-full max-w-md transform -rotate-1">
          <div className="text-center p-8">
            <Button
              onClick={requestMicrophonePermission}
              disabled={isConnecting}
              className="w-32 h-32 p-8 mb-6"
            >
              <UilMicrophone className="h-16 w-16 text-white" />
            </Button>
            
            <h2 className="text-3xl font-black uppercase mb-6">MICROPHONE ACCESS</h2>
            
            <p className="text-gray-600 mb-8 px-4">
              {isConnecting ? 'Connecting to microphone...' : 'Click the microphone above to grant access and start your voice conversation.'}
            </p>
            
            <p className="text-sm text-gray-500 mt-6 px-4">
              Your privacy is important. Audio is processed in real-time and not stored.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      {/* Header */}
      <div className="bg-[rgb(0,82,255)] border-b-4 border-black p-2 md:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]`}>
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-white font-bold text-sm md:text-base">CONNECTED</p>
              <p className="text-white/80 text-xs md:text-sm">{isMobile ? selectedVoiceAgent : `${selectedVoiceAgent} • ${selectedLanguage}`}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="neutral"
              className={`${isMobile ? 'p-2' : 'p-3'}`}
            >
              {isMuted ? <UilMicrophoneSlash className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} /> : <UilMicrophone className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />}
            </Button>
            
            <Button
              onClick={endCall}
              className={`${isMobile ? 'p-2' : 'p-3'} bg-red-500 text-white`}
            >
              <UilPhone className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} rotate-135`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {isMobile ? (
        /* Mobile Layout: Vertical split - Waveforms on top, Transcript on bottom */
        <div className="flex-1 flex flex-col">
          {/* Top panel - Audio visualization (horizontal split) */}
          <div className="h-1/4 flex">
            <ResizablePanelGroup direction="horizontal">
              {/* User audio */}
              <ResizablePanel 
                defaultSize={50} 
                minSize={20}
                style={{ flexBasis: `${Math.max(20, Math.min(80, userGain))}%` }}
                className="transition-all duration-200"
              >
                <div className="h-full bg-[rgb(0,82,255)] p-3 flex items-center justify-center relative">
                  <div className="text-center">
                    <UilMicrophone className="h-8 w-8 text-white mb-2 mx-auto block" />
                    <p className="text-white font-black text-sm uppercase">{userName}</p>
                    <p className="text-white/80 text-xs">{isMuted ? 'MUTED' : 'SPEAKING'}</p>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${userGain}%` }}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <div className="w-2 bg-black"></div>

              {/* Agent audio */}
              <ResizablePanel 
                defaultSize={50}
                minSize={20}
                style={{ flexBasis: `${Math.max(20, Math.min(80, agentGain))}%` }}
                className="transition-all duration-200"
              >
                <div className="h-full bg-green-500 p-3 flex items-center justify-center relative">
                  <div className="text-center">
                    <UilRobot className="h-8 w-8 text-white mb-2 mx-auto block" />
                    <p className="text-white font-black text-sm uppercase">{selectedVoiceAgent}</p>
                    <p className="text-white/80 text-xs">AI AGENT</p>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${agentGain}%` }}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          <div className="h-2 bg-black"></div>

          {/* Bottom panel - Transcript */}
          <div className="flex-1">
            <div className="h-full bg-white p-3 overflow-hidden flex flex-col">
              <h3 className="text-lg font-black uppercase mb-3">LIVE TRANSCRIPT</h3>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`
                      p-3 rounded-lg border-2 border-black text-sm
                      ${entry.speaker === 'user' 
                        ? 'bg-[rgb(0,82,255)] text-white ml-4 shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                        : 'bg-gray-100 mr-4 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${entry.speaker === 'user' ? 'bg-white' : 'bg-green-500'}`}>
                        {entry.speaker === 'user' ? (
                          <UilMicrophone className="h-3 w-3 text-[rgb(0,82,255)]" />
                        ) : (
                          <UilRobot className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <p className="font-bold text-xs uppercase">
                        {entry.speaker === 'user' ? userName : selectedVoiceAgent}
                      </p>
                    </div>
                    <p className="text-sm">{entry.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                
                {transcript.length === 0 && (
                  <div className="text-center text-gray-400 mt-8">
                    <p className="text-sm">Conversation will appear here...</p>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout: Horizontal split - Transcript left, Waveforms right */
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left panel - Transcript */}
          <ResizablePanel defaultSize={35} minSize={20}>
            <div className="h-full bg-white border-r-4 border-black p-6 overflow-hidden flex flex-col">
              <h3 className="text-2xl font-black uppercase mb-4">LIVE TRANSCRIPT</h3>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-lg border-2 border-black
                      ${entry.speaker === 'user' 
                        ? 'bg-[rgb(0,82,255)] text-white ml-8 shadow-[4px_4px_0_rgba(0,0,0,1)]' 
                        : 'bg-gray-100 mr-8 shadow-[4px_4px_0_rgba(0,0,0,1)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center ${entry.speaker === 'user' ? 'bg-white' : 'bg-green-500'}`}>
                        {entry.speaker === 'user' ? (
                          <UilMicrophone className="h-4 w-4 text-[rgb(0,82,255)]" />
                        ) : (
                          <UilRobot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <p className="font-bold text-sm uppercase">
                        {entry.speaker === 'user' ? userName : selectedVoiceAgent}
                      </p>
                    </div>
                    <p>{entry.text}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                
                {transcript.length === 0 && (
                  <div className="text-center text-gray-400 mt-12">
                    <p>Conversation will appear here...</p>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-black hover:bg-gray-800 transition-colors" />

          {/* Right panel - Audio visualization */}
          <ResizablePanel defaultSize={65}>
            <ResizablePanelGroup direction="vertical">
              {/* User audio */}
              <ResizablePanel 
                defaultSize={50} 
                minSize={20}
                style={{ flexBasis: `${Math.max(20, Math.min(80, userGain))}%` }}
                className="transition-all duration-200"
              >
                <div className="h-full bg-[rgb(0,82,255)] p-6 flex items-center justify-center relative">
                  <div className="text-center">
                    <UilMicrophone className="h-16 w-16 text-white mb-4 mx-auto block" />
                    <p className="text-white font-black text-2xl uppercase">{userName}</p>
                    <p className="text-white/80">{isMuted ? 'MUTED' : 'SPEAKING'}</p>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${userGain}%` }}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle className="h-2 bg-black hover:bg-gray-800 transition-colors" />

              {/* Agent audio */}
              <ResizablePanel 
                defaultSize={50}
                minSize={20}
                style={{ flexBasis: `${Math.max(20, Math.min(80, agentGain))}%` }}
                className="transition-all duration-200"
              >
                <div className="h-full bg-green-500 p-6 flex items-center justify-center relative">
                  <div className="text-center">
                    <UilRobot className="h-16 w-16 text-white mb-4 mx-auto block" />
                    <p className="text-white font-black text-2xl uppercase">{selectedVoiceAgent}</p>
                    <p className="text-white/80">AI AGENT</p>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${agentGain}%` }}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}