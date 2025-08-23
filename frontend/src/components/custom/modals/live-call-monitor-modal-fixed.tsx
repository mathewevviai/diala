'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  UilPhone,
  UilMicrophone,
  UilVolumeUp,
  UilVolumeMute,
  UilEdit,
  UilLocationPoint,
  UilTransferAlt,
  UilHeadphones,
  UilRecord,
  UilStop,
  UilClock
} from '@tooni/iconscout-unicons-react';
import LiveWaveformPanel from '../live-waveform-panel';

interface LiveCallData {
  callId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  status: 'connecting' | 'ringing' | 'connected' | 'on-hold' | 'transferring';
  duration: number;
  campaignName: string;
  startTime: string;
  currentPhase: string;
  isRecording: boolean;
  agentGain: number;
  customerGain: number;
  currentSpeaker: 'agent' | 'customer' | null;
  recentTranscript: Array<{
    timestamp: string;
    speaker: 'agent' | 'customer';
    text: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  callObjectives: string[];
  nextActions: string[];
}

interface LiveCallMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  callData: LiveCallData;
}

export default function LiveCallMonitorModal({ isOpen, onClose, callData }: LiveCallMonitorModalProps) {
  const [activeTab, setActiveTab] = React.useState('transcript');
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(75);
  const [audioSectionHeight, setAudioSectionHeight] = React.useState(200);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // MOCK: Real-time updates simulation
  const [liveCallData, setLiveCallData] = React.useState(callData);
  
  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };
  
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const modalContainer = document.querySelector('.live-modal-container');
    if (!modalContainer) return;
    
    const modalRect = modalContainer.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    
    const newHeight = e.clientY - modalRect.top - 200;
    const minHeight = isMobile ? 150 : 200;
    const maxHeight = isMobile ? 300 : 400;
    
    if (newHeight < minHeight) {
      setIsCollapsed(true);
      setAudioSectionHeight(0);
    } else {
      setIsCollapsed(false);
      setAudioSectionHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
    }
  }, [isDragging]);
  
  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);
  
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  React.useEffect(() => {
    if (!isOpen) return;
    
    // MOCK: Simulate real-time call updates
    const interval = setInterval(() => {
      setLiveCallData(prev => ({
        ...prev,
        duration: prev.duration + 1,
        agentGain: 20 + Math.random() * 60,
        customerGain: 15 + Math.random() * 50,
        currentSpeaker: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'agent' : 'customer') : null
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-400 text-black';
      case 'connecting': return 'bg-yellow-400 text-black';
      case 'ringing': return 'bg-blue-400 text-white';
      case 'on-hold': return 'bg-orange-400 text-black';
      case 'transferring': return 'bg-purple-400 text-white';
      default: return 'bg-gray-400 text-black';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="live-modal-container bg-white border-0 sm:border-4 border-black shadow-none sm:shadow-[8px_8px_0_rgba(0,0,0,1)] w-full h-full sm:max-w-6xl sm:h-5/6 sm:max-h-[calc(100vh-2rem)] flex flex-col">
        
        {/* Modal Header */}
        <div className="border-b-2 sm:border-b-4 border-black bg-gray-100 flex-shrink-0">
          {/* Mobile Header */}
          <div className="sm:hidden p-3 safe-area-top">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase truncate">LIVE CALL MONITOR</h2>
                <Badge className={cn("border border-black font-bold uppercase text-xs px-1 flex-shrink-0", getStatusBadgeColor(liveCallData.status))}>
                  {liveCallData.status}
                </Badge>
              </div>
              <Button 
                onClick={onClose}
                size="sm"
                className="w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black text-lg flex-shrink-0"
              >
                ×
              </Button>
            </div>
            <div className="bg-white border-2 border-black p-2">
              <div className="font-black text-sm mb-1 truncate">{liveCallData.agentName} → {liveCallData.customerName}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">{formatDuration(liveCallData.duration)}</span>
                <span className="text-gray-600">{liveCallData.campaignName}</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:block p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase">Live Call Monitor - {liveCallData.agentName}</h2>
                <Badge className={cn("border-2 border-black font-bold uppercase", getStatusBadgeColor(liveCallData.status))}>
                  {liveCallData.status}
                </Badge>
                {liveCallData.isRecording && (
                  <Badge className="bg-red-500 text-white border-2 border-black font-bold uppercase animate-pulse flex items-center gap-1">
                    <UilRecord className="h-3 w-3" />
                    RECORDING
                  </Badge>
                )}
              </div>
              <Button 
                onClick={onClose}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black text-xl px-3 py-2"
              >
                ×
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-2 text-sm">
              <span className="font-bold">PROSPECT: {liveCallData.customerName} ({liveCallData.customerPhone})</span>
              <span className="font-bold flex items-center gap-1">
                <UilClock className="h-4 w-4" />
                DURATION: {formatDuration(liveCallData.duration)}
              </span>
              <span className="font-bold">CAMPAIGN: {liveCallData.campaignName}</span>
            </div>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="border-b-2 sm:border-b-4 border-black bg-black flex-shrink-0">
          {/* Mobile: Dropdown Tabs */}
          <div className="sm:hidden p-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-3 border-2 border-black font-bold uppercase text-sm bg-white focus:outline-none appearance-none"
            >
              <option value="transcript">LIVE TRANSCRIPT</option>
              <option value="objectives">CALL OBJECTIVES</option>
              <option value="controls">SUPERVISOR CONTROLS</option>
              <option value="analytics">REAL-TIME ANALYTICS</option>
            </select>
          </div>
          
          {/* Desktop: Button Tabs */}
          <div className="hidden sm:block">
            <div className="flex overflow-x-auto">
              {['transcript', 'objectives', 'controls', 'analytics'].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  variant="reverse"
                  size="lg"
                  className="whitespace-nowrap flex-shrink-0"
                  style={{ 
                    outline: 'none',
                    backgroundColor: activeTab === tab ? '' : 'white',
                    borderWidth: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.setProperty('background-color', '#7dd3fc', 'important');
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.setProperty('background-color', 'white', 'important');
                    }
                  }}
                >
                  {tab.replace('-', ' ').toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Audio Visualization Section - Resizable */}
        {!isCollapsed && (
          <div 
            className="border-b-2 sm:border-b-4 border-black bg-gray-50 relative flex-shrink-0"
            style={{ height: `${audioSectionHeight}px` }}
          >
            {/* Status Bar */}
            <div className="bg-gray-100 border-b-2 border-black p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-400 text-white px-3 py-1 border-2 border-black font-bold uppercase text-sm flex items-center gap-2">
                  <UilPhone className="h-4 w-4" />
                  LIVE OUTBOUND CALL
                </div>
                <span className="font-bold text-sm">{liveCallData.currentPhase}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Duration: {formatDuration(liveCallData.duration)}</div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Live Waveform */}
            <div className="flex-1">
              <LiveWaveformPanel
                agentName={liveCallData.agentName}
                customerName={liveCallData.customerName}
                agentGain={liveCallData.agentGain}
                customerGain={liveCallData.customerGain}
                currentSpeaker={liveCallData.currentSpeaker}
                isMuted={isMuted}
                className="h-full"
                direction="horizontal"
              />
            </div>
            
            {/* Resize Handle */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 h-4 bg-gray-300 border-t-2 border-black cursor-ns-resize hover:bg-gray-400 active:bg-gray-400 flex items-center justify-center transition-colors touch-manipulation",
                isDragging && "bg-blue-300"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="w-16 h-1 sm:w-12 bg-gray-600 rounded"></div>
            </div>
          </div>
        )}
        
        {/* Collapsed Audio Section Indicator */}
        {isCollapsed && (
          <div className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-2 flex items-center justify-center">
            <Button 
              size="sm" 
              variant="neutral"
              onClick={() => {
                setIsCollapsed(false);
                setAudioSectionHeight(200);
              }}
            >
              <span className="text-xs flex items-center gap-1">
                <UilHeadphones className="h-3 w-3" />
                Show Live Audio Monitor
              </span>
            </Button>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
          {/* Main Content Area */}
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            {activeTab === 'transcript' && (
              <div className="space-y-3">
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">LIVE TRANSCRIPT</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {liveCallData.recentTranscript.map((entry, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "p-2 border-2 border-black text-sm",
                          entry.speaker === 'agent' ? 'bg-blue-100' : 'bg-green-100'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xs uppercase">{entry.speaker}</span>
                          <span className="text-xs text-gray-600">{entry.timestamp}</span>
                          {entry.sentiment && (
                            <Badge className={cn(
                              "text-xs",
                              entry.sentiment === 'positive' ? 'bg-green-400 text-black' :
                              entry.sentiment === 'negative' ? 'bg-red-400 text-white' :
                              'bg-gray-400 text-black'
                            )}>
                              {entry.sentiment}
                            </Badge>
                          )}
                        </div>
                        <p>{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'objectives' && (
              <div className="space-y-4">
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">CALL OBJECTIVES</h3>
                  <div className="space-y-2">
                    {liveCallData.callObjectives.map((objective, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 border border-black"></div>
                        <span className="text-sm">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">NEXT ACTIONS</h3>
                  <div className="space-y-2">
                    {liveCallData.nextActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 border border-black"></div>
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'controls' && (
              <div className="space-y-4">
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">SUPERVISOR CONTROLS</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-yellow-400 text-black">
                      <UilHeadphones className="h-4 w-4 mr-2" />
                      WHISPER
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-orange-400 text-black">
                      <UilTransferAlt className="h-4 w-4 mr-2" />
                      TRANSFER
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-red-400 text-white">
                      <UilStop className="h-4 w-4 mr-2" />
                      END CALL
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }}>
                      <UilEdit className="h-4 w-4 mr-2" />
                      ADD NOTE
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }}>
                      <UilLocationPoint className="h-4 w-4 mr-2" />
                      MARK EVENT
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {/* Real-time Call Status */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">REAL-TIME CALL STATUS</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-black text-green-600">{formatDuration(liveCallData.duration)}</div>
                      <div className="text-xs text-gray-600 font-bold">DURATION</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-black text-blue-600">{liveCallData.currentPhase}</div>
                      <div className="text-xs text-gray-600 font-bold">PHASE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-black text-purple-600">{liveCallData.campaignName}</div>
                      <div className="text-xs text-gray-600 font-bold">CAMPAIGN</div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-lg sm:text-2xl font-black", liveCallData.isRecording ? "text-red-600" : "text-gray-400")}>
                        {liveCallData.isRecording ? "REC" : "OFF"}
                      </div>
                      <div className="text-xs text-gray-600 font-bold">RECORDING</div>
                    </div>
                  </div>
                </div>

                {/* Monitor Controls */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">MONITOR CONTROLS</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <Button
                      size="sm"
                      variant="reverse"
                      style={{ outline: 'none' }}
                      className="px-3 py-2"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <UilVolumeMute className="h-4 w-4 mr-1" /> : <UilVolumeUp className="h-4 w-4 mr-1" />}
                      {isMuted ? "MUTED" : "AUDIO"}
                    </Button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">VOLUME</span>
                      <div 
                        className="w-20 h-3 bg-gray-300 border-2 border-black relative cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const newVolume = Math.round((x / rect.width) * 100);
                          setVolume(Math.max(0, Math.min(100, newVolume)));
                        }}
                      >
                        <div 
                          className="absolute left-0 top-0 h-full bg-blue-400" 
                          style={{ width: `${isMuted ? 0 : volume}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">{isMuted ? 0 : volume}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}