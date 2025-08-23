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
  UilExchange,
  UilHeadphones,
  UilCircle,
  UilSquare,
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
  const [audioSectionHeight, setAudioSectionHeight] = React.useState(340);
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
    
    const audioSection = document.querySelector('.audio-section');
    if (!audioSection) return;
    
    const modalRect = modalContainer.getBoundingClientRect();
    const audioSectionTop = audioSection.getBoundingClientRect().top;
    const newHeight = e.clientY - audioSectionTop;
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    
    const minHeight = isMobile ? 340 : isTablet ? 290 : 250;
    const maxHeight = isMobile ? 400 : 500;
    
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
      <div className="live-modal-container bg-white border-0 sm:border-4 border-black shadow-none sm:shadow-[8px_8px_0_rgba(0,0,0,1)] w-full h-full sm:max-w-6xl sm:h-5/6 sm:max-h-[calc(100vh-2rem)] flex flex-col overflow-visible">
        
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
                    <UilCircle className="h-3 w-3" />
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
        <div className="border-b-2 sm:border-b-4 border-black bg-black flex-shrink-0 relative z-50 overflow-visible">
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
              <option value="settings">SYSTEM SETTINGS</option>
            </select>
          </div>
          
          {/* Desktop: Button Tabs */}
          <div className="hidden sm:block relative z-50 overflow-visible">
            <div className="flex overflow-x-auto relative z-50 overflow-visible">
              {['transcript', 'objectives', 'controls', 'analytics', 'settings'].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  variant="reverse"
                  size="lg"
                  className="whitespace-nowrap flex-shrink-0 border-0 relative z-[100]"
                  style={{ 
                    backgroundColor: activeTab === tab ? '' : 'white'
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
            className="audio-section border-b-2 sm:border-b-4 border-black bg-gray-50 relative flex-shrink-0"
            style={{ height: `${audioSectionHeight}px`, overflow: 'hidden' }}
          >
          {/* Simple Header Bar */}
          <div className="bg-gray-100 border-b-2 border-black p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-400 text-white px-3 py-1 border-2 border-black font-bold uppercase text-sm">
                <UilPhone className="h-4 w-4 inline mr-1" />
                LIVE OUTBOUND CALL
              </div>
              <span className="font-bold text-sm">{liveCallData.agentName} → {liveCallData.customerName}</span>
            </div>
            <div className="text-sm text-gray-600">Duration: {formatDuration(liveCallData.duration)}</div>
          </div>

          {/* Audio Timeline */}
          <div className="bg-white p-2 sm:p-4">
            {/* Live Waveform Panel */}
            <div className="mb-4 border-2 border-black">
              <LiveWaveformPanel
                agentName={liveCallData.agentName}
                customerName={liveCallData.customerName}
                agentGain={liveCallData.agentGain}
                customerGain={liveCallData.customerGain}
                currentSpeaker={liveCallData.currentSpeaker}
                isMuted={isMuted}
                className="h-32 sm:h-40"
                direction="horizontal"
              />
            </div>
            
            {/* Call Status Info */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-sm sm:text-lg font-black text-green-600">{formatDuration(liveCallData.duration)}</div>
                <div className="text-xs text-gray-600 font-bold">DURATION</div>
              </div>
              <div>
                <div className="text-sm sm:text-lg font-black text-blue-600 truncate">{liveCallData.currentPhase}</div>
                <div className="text-xs text-gray-600 font-bold">PHASE</div>
              </div>
              <div>
                <div className="text-sm sm:text-lg font-black text-purple-600 truncate">{liveCallData.campaignName}</div>
                <div className="text-xs text-gray-600 font-bold">CAMPAIGN</div>
              </div>
              <div>
                <div className={cn("text-sm sm:text-lg font-black", liveCallData.isRecording ? "text-red-600" : "text-gray-400")}>
                  {liveCallData.isRecording ? "REC" : "OFF"}
                </div>
                <div className="text-xs text-gray-600 font-bold">RECORDING</div>
              </div>
            </div>
          </div>
          
          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 h-4 sm:h-3 bg-gray-300 border-t-2 border-black cursor-ns-resize hover:bg-gray-400 active:bg-gray-400 flex items-center justify-center transition-colors touch-manipulation",
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
                const isMobile = window.innerWidth < 640;
                const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
                const defaultHeight = isMobile ? 340 : isTablet ? 290 : 250;
                setAudioSectionHeight(defaultHeight);
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
              <div className="space-y-4">
                {/* Live Transcript Section */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-sm text-gray-600">LIVE CONVERSATION TRANSCRIPT</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-green-600">STREAMING LIVE</span>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto space-y-3 border-2 border-gray-200 p-3 bg-gray-50">
                    {liveCallData.recentTranscript.map((entry, index) => (
                      <div 
                        key={index}
                        className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_rgba(0,0,0,1)]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 border-2 border-black rounded-full flex items-center justify-center text-xs font-black text-white",
                              entry.speaker === 'agent' ? 'bg-blue-400' : 'bg-green-400'
                            )}>
                              {entry.speaker.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-sm uppercase">{entry.speaker === 'agent' ? 'AI AGENT' : 'PROSPECT'}</div>
                              <div className="text-xs text-gray-600">{entry.timestamp}</div>
                            </div>
                          </div>
                          {entry.sentiment && (
                            <Badge className={cn(
                              "border border-black font-bold uppercase text-xs",
                              entry.sentiment === 'positive' ? 'bg-green-400 text-black' :
                              entry.sentiment === 'negative' ? 'bg-red-400 text-white' :
                              'bg-gray-400 text-black'
                            )}>
                              {entry.sentiment}
                            </Badge>
                          )}
                        </div>
                        <div className="bg-gray-50 border-2 border-gray-300 p-3">
                          <p className="text-sm leading-relaxed text-gray-900">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Live indicator at bottom */}
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-gray-600">CONVERSATION IN PROGRESS</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Live Sentiment Analysis */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">REAL-TIME SENTIMENT ANALYSIS</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600">72%</div>
                      <div className="text-xs text-gray-600 font-bold">POSITIVE</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-green-400" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-gray-600">23%</div>
                      <div className="text-xs text-gray-600 font-bold">NEUTRAL</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-gray-400" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-red-600">5%</div>
                      <div className="text-xs text-gray-600 font-bold">NEGATIVE</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-red-400" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'objectives' && (
              <div className="space-y-4">
                {/* Campaign Information */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">LIVE CAMPAIGN DETAILS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Campaign ID:</span>
                        <span className="text-sm">{liveCallData.callId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">AI Agent:</span>
                        <span className="text-sm">{liveCallData.agentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Prospect:</span>
                        <span className="text-sm">{liveCallData.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Phone:</span>
                        <span className="text-sm">{liveCallData.customerPhone}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Status:</span>
                        <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusBadgeColor(liveCallData.status))}>
                          {liveCallData.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Duration:</span>
                        <span className="font-black text-lg text-green-600">{formatDuration(liveCallData.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Phase:</span>
                        <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">
                          {liveCallData.currentPhase}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">Recording:</span>
                        <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", liveCallData.isRecording ? "bg-red-400 text-white" : "bg-gray-400 text-black")}>
                          {liveCallData.isRecording ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Objectives Progress */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">CAMPAIGN OBJECTIVES PROGRESS</h3>
                  <div className="space-y-4">
                    {liveCallData.callObjectives.map((objective, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 border-2 border-black">
                        <div className={cn(
                          "w-8 h-8 border-2 border-black flex items-center justify-center text-white font-black text-xs flex-shrink-0",
                          index < 2 ? "bg-green-400" : index < 3 ? "bg-yellow-400 text-black" : "bg-gray-400"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{objective}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {index < 2 ? "✓ Completed" : index < 3 ? "⚠ In Progress" : "⏳ Pending"}
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 border border-black text-xs font-bold uppercase",
                          index < 2 ? "bg-green-400 text-black" : index < 3 ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"
                        )}>
                          {index < 2 ? "DONE" : index < 3 ? "ACTIVE" : "QUEUE"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Next Actions */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">AI SUGGESTED NEXT ACTIONS</h3>
                  <div className="space-y-3">
                    {liveCallData.nextActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border-2 border-gray-300 bg-blue-50">
                        <div className="w-6 h-6 bg-blue-400 border-2 border-black flex items-center justify-center text-white font-black text-xs flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-800">{action}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {index === 0 ? "Recommended for immediate execution" : 
                             index === 1 ? "Prepare for next conversation phase" : 
                             "Follow-up action item"}
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-1 border border-black text-xs font-bold uppercase",
                          index === 0 ? "bg-green-400 text-black" : "bg-yellow-400 text-black"
                        )}>
                          {index === 0 ? "NOW" : "NEXT"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'controls' && (
              <div className="space-y-4">
                {/* Emergency Controls */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">LIVE CALL INTERVENTION</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-yellow-400 text-black flex items-center justify-center">
                      <UilHeadphones className="h-4 w-4 mr-2" />
                      COACH AI AGENT
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-blue-400 text-white flex items-center justify-center">
                      <UilMicrophone className="h-4 w-4 mr-2" />
                      JOIN CALL
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-orange-400 text-black flex items-center justify-center">
                      <UilExchange className="h-4 w-4 mr-2" />
                      TRANSFER CALL
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-purple-400 text-white flex items-center justify-center">
                      <UilCircle className="h-4 w-4 mr-2" />
                      START RECORDING
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-cyan-400 text-black flex items-center justify-center">
                      <UilEdit className="h-4 w-4 mr-2" />
                      ADD LIVE NOTE
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-red-400 text-white flex items-center justify-center">
                      <UilSquare className="h-4 w-4 mr-2" />
                      END CALL
                    </Button>
                  </div>
                </div>

                {/* AI Agent Performance */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">REAL-TIME AI PERFORMANCE</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600">94%</div>
                      <div className="text-xs text-gray-600 font-bold">ADHERENCE</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-green-400" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-blue-600">87%</div>
                      <div className="text-xs text-gray-600 font-bold">CONFIDENCE</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-blue-400" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-purple-600">91%</div>
                      <div className="text-xs text-gray-600 font-bold">QUALITY</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-purple-400" style={{ width: '91%' }}></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-yellow-600">78%</div>
                      <div className="text-xs text-gray-600 font-bold">PROSPECT ENGAGEMENT</div>
                      <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                        <div className="h-full bg-yellow-400" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Coaching Suggestions */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">AI COACHING RECOMMENDATIONS</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border-2 border-green-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-green-400 border border-black"></div>
                        <span className="font-bold text-sm text-green-800">EXCELLENT RAPPORT BUILDING</span>
                      </div>
                      <p className="text-xs text-green-700">AI agent is successfully building trust and connection with prospect. Maintain current approach.</p>
                    </div>
                    <div className="p-3 bg-yellow-50 border-2 border-yellow-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-yellow-400 border border-black"></div>
                        <span className="font-bold text-sm text-yellow-800">SUGGEST PAUSE FOR OBJECTION</span>
                      </div>
                      <p className="text-xs text-yellow-700">Prospect may have unspoken concerns. Consider prompting AI to ask clarifying questions.</p>
                    </div>
                    <div className="p-3 bg-blue-50 border-2 border-blue-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-blue-400 border border-black"></div>
                        <span className="font-bold text-sm text-blue-800">READY FOR DEMO TRANSITION</span>
                      </div>
                      <p className="text-xs text-blue-700">High engagement detected. AI should transition to product demonstration phase.</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">QUICK SUPERVISOR ACTIONS</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-gray-100 text-black border-2 border-black">
                      <UilLocationPoint className="h-4 w-4 mr-2" />
                      BOOKMARK MOMENT
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-gray-100 text-black border-2 border-black">
                      <UilEdit className="h-4 w-4 mr-2" />
                      FLAG FOR REVIEW
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {/* Live Call Metrics */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">LIVE CALL ANALYTICS</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600">{formatDuration(liveCallData.duration)}</div>
                      <div className="text-xs text-gray-600 font-bold">CALL DURATION</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-blue-600">142</div>
                      <div className="text-xs text-gray-600 font-bold">WORDS/MIN</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-purple-600">67%</div>
                      <div className="text-xs text-gray-600 font-bold">TALK TIME</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-yellow-600">3</div>
                      <div className="text-xs text-gray-600 font-bold">KEY MOMENTS</div>
                    </div>
                  </div>
                </div>

                {/* Conversation Flow Analysis */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">CONVERSATION FLOW ANALYSIS</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-green-50 border-2 border-black">
                      <div className="w-8 h-8 bg-green-400 border-2 border-black flex items-center justify-center text-white font-black text-xs">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">Opening & Rapport Building</div>
                        <div className="text-xs text-gray-600">✓ Completed - 2:15 duration - High engagement</div>
                      </div>
                      <div className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">
                        COMPLETED
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-blue-50 border-2 border-black">
                      <div className="w-8 h-8 bg-blue-400 border-2 border-black flex items-center justify-center text-white font-black text-xs">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">Needs Discovery & Pain Points</div>
                        <div className="text-xs text-gray-600">⚡ Active - 1:46 duration - Good responses</div>
                      </div>
                      <div className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">
                        ACTIVE
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-gray-50 border-2 border-black">
                      <div className="w-8 h-8 bg-gray-400 border-2 border-black flex items-center justify-center text-white font-black text-xs">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">Solution Presentation</div>
                        <div className="text-xs text-gray-600">⏳ Pending - Ready to transition</div>
                      </div>
                      <div className="px-2 py-1 bg-gray-400 border border-black text-xs font-bold uppercase text-white">
                        PENDING
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">PROSPECT ENGAGEMENT INDICATORS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Voice Energy Level</span>
                        <span className="text-sm font-black text-green-600">HIGH</span>
                      </div>
                      <div className="w-full bg-gray-300 border-2 border-black h-3">
                        <div className="h-full bg-green-400" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Response Quality</span>
                        <span className="text-sm font-black text-blue-600">GOOD</span>
                      </div>
                      <div className="w-full bg-gray-300 border-2 border-black h-3">
                        <div className="h-full bg-blue-400" style={{ width: '76%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Question Frequency</span>
                        <span className="text-sm font-black text-purple-600">MEDIUM</span>
                      </div>
                      <div className="w-full bg-gray-300 border-2 border-black h-3">
                        <div className="h-full bg-purple-400" style={{ width: '64%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Interest Signals</span>
                        <span className="text-sm font-black text-yellow-600">STRONG</span>
                      </div>
                      <div className="w-full bg-gray-300 border-2 border-black h-3">
                        <div className="h-full bg-yellow-400" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Predictions */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">AI OUTCOME PREDICTIONS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 border-2 border-green-300">
                      <div className="text-2xl font-black text-green-600">73%</div>
                      <div className="text-xs text-gray-600 font-bold">CONVERSION PROBABILITY</div>
                      <div className="text-xs text-green-700 mt-1">High likelihood of positive outcome</div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 border-2 border-blue-300">
                      <div className="text-2xl font-black text-blue-600">89%</div>
                      <div className="text-xs text-gray-600 font-bold">DEMO ACCEPTANCE</div>
                      <div className="text-xs text-blue-700 mt-1">Very likely to agree to demo</div>
                    </div>
                    
                    <div className="text-center p-3 bg-yellow-50 border-2 border-yellow-300">
                      <div className="text-2xl font-black text-yellow-600">45%</div>
                      <div className="text-xs text-gray-600 font-bold">IMMEDIATE CLOSE</div>
                      <div className="text-xs text-yellow-700 mt-1">May need nurturing sequence</div>
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

            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Live Call System Configuration */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">ACTIVE CALL INFRASTRUCTURE</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">SIP Provider</div>
                          <div className="text-xs text-gray-600">Voice carrier service</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">Telnyx</div>
                          <div className="text-xs text-green-600">✓ Connected</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Speech-to-Text</div>
                          <div className="text-xs text-gray-600">Real-time transcription</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">Deepgram</div>
                          <div className="text-xs text-green-600">✓ Streaming</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">AI Language Model</div>
                          <div className="text-xs text-gray-600">Conversation engine</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">OpenAI GPT-4</div>
                          <div className="text-xs text-green-600">✓ Active</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Text-to-Speech</div>
                          <div className="text-xs text-gray-600">Voice synthesis</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">ElevenLabs</div>
                          <div className="text-xs text-green-600">✓ Premium Voice</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Call Recording</div>
                          <div className="text-xs text-gray-600">Storage & compliance</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">AWS S3</div>
                          <div className="text-xs text-blue-600">⚡ Live Recording</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Analytics Engine</div>
                          <div className="text-xs text-gray-600">Real-time insights</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm">Diala AI</div>
                          <div className="text-xs text-purple-600">🎯 Processing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Cost Monitoring */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">LIVE CALL COST BREAKDOWN</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-black text-green-600">$0.0089</div>
                      <div className="text-xs text-gray-600 font-bold">PER MINUTE</div>
                      <div className="text-xs text-gray-500">SIP Carrier</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-blue-600">$0.0043</div>
                      <div className="text-xs text-gray-600 font-bold">STT COST</div>
                      <div className="text-xs text-gray-500">Deepgram</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-purple-600">$0.0156</div>
                      <div className="text-xs text-gray-600 font-bold">AI TOKENS</div>
                      <div className="text-xs text-gray-500">OpenAI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-yellow-600">$0.0298</div>
                      <div className="text-xs text-gray-600 font-bold">TOTAL/MIN</div>
                      <div className="text-xs text-gray-500">All Services</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border-2 border-yellow-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">Current Call Cost</div>
                        <div className="text-xs text-gray-600">Duration: {formatDuration(liveCallData.duration)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-green-600">${(liveCallData.duration * 0.0298 / 60).toFixed(4)}</div>
                        <div className="text-xs text-gray-600">Running Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Features & Limits */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">PREMIUM FEATURES & USAGE</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 border-2 border-green-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-green-800">Advanced AI Coaching</span>
                          <span className="px-2 py-1 bg-green-400 text-black border border-black text-xs font-bold">ACTIVE</span>
                        </div>
                        <div className="text-xs text-green-700">Real-time intervention suggestions</div>
                        <div className="mt-2">
                          <div className="w-full bg-green-200 border border-green-400 h-2">
                            <div className="h-full bg-green-400" style={{ width: '78%' }}></div>
                          </div>
                          <div className="text-xs text-green-600 mt-1">142/180 coaching events used</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border-2 border-blue-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-blue-800">Call Recording</span>
                          <span className="px-2 py-1 bg-blue-400 text-white border border-black text-xs font-bold">PREMIUM</span>
                        </div>
                        <div className="text-xs text-blue-700">High-quality audio storage</div>
                        <div className="mt-2">
                          <div className="w-full bg-blue-200 border border-blue-400 h-2">
                            <div className="h-full bg-blue-400" style={{ width: '34%' }}></div>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">3.2GB/10GB monthly limit</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-purple-50 border-2 border-purple-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-purple-800">Sentiment Analysis</span>
                          <span className="px-2 py-1 bg-purple-400 text-white border border-black text-xs font-bold">ACTIVE</span>
                        </div>
                        <div className="text-xs text-purple-700">Real-time emotion detection</div>
                        <div className="mt-2">
                          <div className="w-full bg-purple-200 border border-purple-400 h-2">
                            <div className="h-full bg-purple-400" style={{ width: '91%' }}></div>
                          </div>
                          <div className="text-xs text-purple-600 mt-1">4,560/5,000 API calls</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 border-2 border-gray-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-gray-800">Call Transfer</span>
                          <span className="px-2 py-1 bg-gray-400 text-white border border-black text-xs font-bold">LIMITED</span>
                        </div>
                        <div className="text-xs text-gray-700">Supervisor call takeover</div>
                        <div className="mt-2">
                          <button className="w-full px-3 py-2 bg-yellow-400 border-2 border-black font-bold text-xs hover:bg-yellow-500">
                            UPGRADE FOR UNLIMITED TRANSFERS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality & Compliance Settings */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">QUALITY & COMPLIANCE CONTROLS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Auto-Recording</div>
                          <div className="text-xs text-gray-600">All calls recorded by default</div>
                        </div>
                        <div className="w-10 h-6 bg-green-400 border-2 border-black relative">
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white border border-black"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Compliance Mode</div>
                          <div className="text-xs text-gray-600">GDPR/CCPA data protection</div>
                        </div>
                        <div className="w-10 h-6 bg-green-400 border-2 border-black relative">
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white border border-black"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border-2 border-black">
                        <div>
                          <div className="font-bold text-sm">Quality Alerts</div>
                          <div className="text-xs text-gray-600">Real-time performance warnings</div>
                        </div>
                        <div className="w-10 h-6 bg-green-400 border-2 border-black relative">
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white border border-black"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border-2 border-blue-300">
                        <div className="font-bold text-sm text-blue-800 mb-2">Call Quality Score</div>
                        <div className="text-2xl font-black text-blue-600">94/100</div>
                        <div className="text-xs text-blue-700">Excellent performance</div>
                      </div>
                      
                      <div className="p-3 bg-green-50 border-2 border-green-300">
                        <div className="font-bold text-sm text-green-800 mb-2">Compliance Status</div>
                        <div className="text-2xl font-black text-green-600">✓ PASS</div>
                        <div className="text-xs text-green-700">All regulations met</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Controls */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">SYSTEM EMERGENCY CONTROLS</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-red-400 text-white">
                      <UilSquare className="h-4 w-4 mr-2" />
                      EMERGENCY STOP
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-yellow-400 text-black">
                      <UilCircle className="h-4 w-4 mr-2" />
                      PAUSE AI
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-blue-400 text-white">
                      <UilExchange className="h-4 w-4 mr-2" />
                      FORCE TRANSFER
                    </Button>
                    <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-purple-400 text-white">
                      <UilEdit className="h-4 w-4 mr-2" />
                      INCIDENT LOG
                    </Button>
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