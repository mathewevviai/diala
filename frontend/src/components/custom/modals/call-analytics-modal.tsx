'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  UilPlay,
  UilPause,
  UilSearch,
  UilExport,
  UilLocationPoint,
  UilEdit,
  UilAngleLeft,
  UilAngleRight,
  UilVolumeUp,
  UilVolumeMute
} from '@tooni/iconscout-unicons-react';
// import WaveformVisualizer from './waveform-visualizer';
// import { useWaveformData } from '@/hooks/useWaveformData';

interface CallAnalyticsData {
  callInfo: {
    callId: string;
    agent: string;
    customer: string;
    phone: string;
    status: string;
  };
  timing: {
    startTime: string;
    endTime: string;
    duration: string;
    queueTime: string;
    holdTime: string;
  };
  metrics: {
    resolution: string;
    transfer: boolean;
    sentiment: string;
    qualityScore: string;
  };
  callFlow: Array<{
    step: number;
    title: string;
    description: string;
    color: string;
  }>;
  customerProfile: {
    name: string;
    initials: string;
    type: string;
    accountType: string;
    customerSince: string;
    previousCalls: number;
    satisfaction: string;
    lastContact: string;
  };
  transcript: Array<{
    timestamp: string;
    speaker: 'agent' | 'customer' | 'system';
    content: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  aiInsights: {
    topics: Array<{
      name: string;
      type: 'positive' | 'negative' | 'empathetic' | 'unhelpful';
    }>;
    events: Array<{
      name: string;
      timestamp: string;
      type: 'green' | 'blue' | 'red' | 'orange';
    }>;
  };
  timeline: Array<{
    timestamp: string;
    event: string;
    description: string;
    type: 'incoming' | 'connected' | 'hold' | 'transfer' | 'resolution' | 'system';
    duration?: string;
  }>;
  qualitySummary: {
    overallScore: number;
    categories: Array<{
      name: string;
      score: number;
      maxScore: number;
      color: string;
    }>;
    improvements: Array<{
      area: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    strengths: Array<string>;
  };
  auditTrail: Array<{
    timestamp: string;
    user: string;
    action: string;
    details: string;
    system: string;
  }>;
  customerJourney: {
    touchpoints: Array<{
      date: string;
      type: string;
      channel: string;
      outcome: string;
      status: 'positive' | 'negative' | 'neutral';
    }>;
    satisfaction: Array<{
      date: string;
      score: number;
      feedback?: string;
    }>;
    issues: Array<{
      date: string;
      issue: string;
      resolution: string;
      status: 'resolved' | 'pending' | 'escalated';
    }>;
  };
}

interface CallAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CallAnalyticsData;
}

export default function CallAnalyticsModal({ isOpen, onClose, data }: CallAnalyticsModalProps) {
  const [activeTab, setActiveTab] = React.useState('transcript');
  const [audioSectionHeight, setAudioSectionHeight] = React.useState(200);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  // // MOCK: Initialize waveform data hook with call ID
  // const {
  //   callData,
  //   loading: waveformLoading,
  //   error: waveformError,
  //   playbackState,
  //   play,
  //   pause,
  //   seekTo,
  //   setPlaybackRate,
  //   setVolume,
  //   toggleMute,
  //   addAnnotation,
  //   isLive,
  //   getTranscriptAtTime
  // } = useWaveformData(data.callInfo.callId);
  
  // // Utility function to format time
  // const formatTime = (ms: number): string => {
  //   const seconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(seconds / 60);
  //   const remainingSeconds = seconds % 60;
  //   return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  // };

  // Ensure audio section height doesn't exceed available space on mount
  React.useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        const modalContainer = document.querySelector('.modal-container');
        if (modalContainer) {
          const modalRect = modalContainer.getBoundingClientRect();
          const isMobile = window.innerWidth < 640;
        const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
          
          // Calculate header heights dynamically
          const headerElement = modalContainer.querySelector('.border-b-2, .border-b-4');
          const tabsElement = modalContainer.querySelector('.bg-black');
          const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : (isMobile ? 120 : 140);
          const tabsHeight = tabsElement ? tabsElement.getBoundingClientRect().height : (isMobile ? 60 : 80);
          
          // Calculate available space more accurately
          const reservedSpace = headerHeight + tabsHeight + (isMobile ? 250 : 350); // content area + margins
          const availableHeight = Math.max(0, modalRect.height - reservedSpace);
          
          // Calculate minimum height needed for right panel content
          // Play button area (80px) + Speed control (60px) + Volume control (160px) + padding (20px) = 320px
          const rightPanelMinHeight = isMobile ? 150 : 320;
          const minHeight = Math.max(isMobile ? 120 : 180, rightPanelMinHeight);
          const maxHeight = isMobile ? 250 : 500;
          const optimalHeight = Math.min(maxHeight, Math.max(minHeight, availableHeight));
          
          setAudioSectionHeight(optimalHeight);
        }
      }, 150); // Increased timeout to ensure DOM is ready
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-400 text-black';
      case 'resolved': return 'bg-green-400 text-black';
      case 'pending': return 'bg-yellow-400 text-black';
      case 'failed': return 'bg-red-400 text-white';
      default: return 'bg-gray-400 text-black';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 font-black';
      case 'negative': return 'text-red-600 font-black';
      default: return '';
    }
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'agent': return 'bg-green-400';
      case 'customer': return 'bg-blue-400';
      case 'system': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getTopicBadgeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-400 text-black';
      case 'negative': return 'bg-red-400 text-white';
      case 'empathetic': return 'bg-blue-400 text-white';
      case 'unhelpful': return 'bg-orange-400 text-black';
      default: return 'bg-gray-400 text-black';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'green': return 'bg-green-400';
      case 'blue': return 'bg-blue-400';
      case 'red': return 'bg-red-400';
      case 'orange': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const getTimelineEventColor = (type: string) => {
    switch (type) {
      case 'incoming': return 'bg-blue-400';
      case 'connected': return 'bg-green-400';
      case 'hold': return 'bg-yellow-400';
      case 'transfer': return 'bg-purple-400';
      case 'resolution': return 'bg-green-600';
      case 'system': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-400 text-white';
      case 'medium': return 'bg-yellow-400 text-black';
      case 'low': return 'bg-green-400 text-black';
      default: return 'bg-gray-400 text-black';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'bg-green-400 text-black';
      case 'negative': return 'bg-red-400 text-white';
      case 'neutral': return 'bg-gray-400 text-black';
      case 'resolved': return 'bg-green-400 text-black';
      case 'pending': return 'bg-yellow-400 text-black';
      case 'escalated': return 'bg-red-400 text-white';
      default: return 'bg-gray-400 text-black';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    // Get the modal container and audio section elements
    const modalContainer = document.querySelector('.modal-container');
    const audioSection = document.querySelector('.audio-section');
    
    if (!audioSection || !modalContainer) return;
    
    const modalRect = modalContainer.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    
    // Calculate new height based on pointer position relative to audio section top
    const audioSectionTop = audioSection.getBoundingClientRect().top;
    const newHeight = clientY - audioSectionTop;
    
    // Calculate minimum height based on device type
    const deviceMinHeight = isMobile ? 340 : isTablet ? 290 : 250;
    const minHeight = deviceMinHeight;
    const contentAreaMinHeight = isMobile ? 200 : 300;
    
    // Calculate available space more precisely
    const headerElement = modalContainer.querySelector('.border-b-2, .border-b-4');
    const tabsElement = modalContainer.querySelector('.bg-black');
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : (isMobile ? 120 : 140);
    const tabsHeight = tabsElement ? tabsElement.getBoundingClientRect().height : (isMobile ? 60 : 80);
    
    // Calculate max height ensuring content area has minimum space
    const usedSpace = headerHeight + tabsHeight + contentAreaMinHeight + 40; // 40px margins
    const maxHeight = Math.max(minHeight, modalRect.height - usedSpace);
    
    // Apply constraints - ensure right panel is always fully visible
    const finalMaxHeight = Math.min(maxHeight, isMobile ? 300 : 600);
    
    if (newHeight < minHeight) {
      setIsCollapsed(true);
      setAudioSectionHeight(0);
    } else {
      setIsCollapsed(false);
      setAudioSectionHeight(Math.min(Math.max(newHeight, minHeight), finalMaxHeight));
    }
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      const handleTouchMove = (e: TouchEvent) => handleMouseMove(e);
      const handleTouchEnd = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize to adjust audio section height
  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      const modalContainer = document.querySelector('.modal-container');
      if (modalContainer && !isCollapsed) {
        const modalRect = modalContainer.getBoundingClientRect();
        const isMobile = window.innerWidth < 640;
        const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
        
        // Calculate all content heights
        const headerElement = modalContainer.querySelector('.border-b-2, .border-b-4');
        const tabsElement = modalContainer.querySelector('.bg-black');
        const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : (isMobile ? 120 : 140);
        const tabsHeight = tabsElement ? tabsElement.getBoundingClientRect().height : (isMobile ? 60 : 80);
        
        // Calculate minimum height based on mobile content
        // Mobile needs to fit all content without cutting off navigation
        const mobileContentHeight = isMobile ? 
          48 + // Header bar with transfer info
          8 + // Padding
          40 + // Play controls row + margin
          36 + // Volume row + margin  
          60 + // Waveform + margin
          40 + // Add buttons row + margin
          44 + // Navigation row + margin
          16 + // Resize handle
          8 : 0; // Extra padding
        
        const desktopContentHeight = !isMobile ?
          (40 + 16) + // Controls row + margin
          (80 + 16) + // Waveform + margin
          (40 + 12) + // Action buttons + margin
          12 : 0; // Resize handle
        
        const minContentHeight = isMobile ? mobileContentHeight : desktopContentHeight;
        const contentAreaMinHeight = isMobile ? 200 : 300;
        const reservedSpace = headerHeight + tabsHeight + contentAreaMinHeight;
        const availableHeight = Math.max(0, modalRect.height - reservedSpace);
        
        // Set minimum height based on device type
        const deviceMinHeight = isMobile ? 340 : isTablet ? 290 : 250;
        const minHeight = Math.max(minContentHeight, deviceMinHeight);
        const maxHeight = Math.min(isMobile ? 400 : 500, availableHeight);
        
        const currentHeight = audioSectionHeight;
        
        // Force adjustment when switching to mobile to ensure content fits
        if (isMobile && currentHeight < minHeight) {
          setAudioSectionHeight(minHeight);
        } else if (currentHeight > maxHeight) {
          setAudioSectionHeight(Math.max(minHeight, maxHeight));
        } else if (currentHeight < minHeight) {
          setAudioSectionHeight(minHeight);
        }
      }
    };
    
    // Run immediately and on resize
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, isCollapsed, audioSectionHeight]);

  // Initial setup effect to ensure proper mobile positioning
  React.useEffect(() => {
    if (!isOpen || isCollapsed) return;
    
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    
    // Set initial height based on device type
    const modalContainer = document.querySelector('.modal-container');
    if (modalContainer) {
      // Set minimum height based on device
      const deviceMinHeight = isMobile ? 340 : isTablet ? 290 : 250;
      if (audioSectionHeight < deviceMinHeight) {
        setAudioSectionHeight(deviceMinHeight);
      }
    }
  }, [isOpen, isCollapsed]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="modal-container bg-white border-0 sm:border-4 border-black shadow-none sm:shadow-[8px_8px_0_rgba(0,0,0,1)] w-full h-full sm:max-w-6xl sm:h-5/6 sm:max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Modal Header */}
        <div className="border-b-2 sm:border-b-4 border-black bg-gray-100 flex-shrink-0">
          {/* Mobile Header */}
          <div className="sm:hidden p-3 safe-area-top">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase truncate">OUTBOUND ANALYTICS</h2>
                <Badge className="bg-green-400 text-black border border-black font-bold uppercase text-xs px-1 flex-shrink-0">
                  TRANS
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
              <div className="font-black text-sm mb-1 truncate">{data.callInfo.agent}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">{data.timing.duration}</span>
                <span className="text-gray-600">{data.timing.startTime.split(' ')[1]}</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:block p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase">Outbound Campaign Analytics - {data.callInfo.agent}</h2>
                <Badge className="bg-green-400 text-black border-2 border-black font-bold uppercase">
                  TRANSFERRED
                </Badge>
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
              <span className="font-bold">CALL START TIME: {data.timing.startTime}</span>
              <span className="font-bold">DURATION: {data.timing.duration}</span>
              <span className="font-bold">CALL END TIME: {data.timing.endTime}</span>
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
              <option value="details">DETAILS</option>
              <option value="timeline">TIMELINE</option>
              <option value="quality-summary">QUALITY SUMMARY</option>
              <option value="transcript">TRANSCRIPT</option>
              <option value="audit-trail">AUDIT TRAIL</option>
              <option value="customer-journeys">CUSTOMER JOURNEYS</option>
            </select>
          </div>
          
          {/* Desktop: Button Tabs */}
          <div className="hidden sm:block relative z-20">
            <div className="flex overflow-x-auto relative z-20">
              {['details', 'timeline', 'quality-summary', 'transcript', 'audit-trail', 'customer-journeys'].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  variant="reverse"
                  size="lg"
                  className="whitespace-nowrap flex-shrink-0 border-0 relative z-30"
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
                  {tab.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Visualization Section */}
        {!isCollapsed && (
          <div 
            className="audio-section border-b-2 sm:border-b-4 border-black bg-gray-50 relative flex-shrink-0"
            style={{ height: `${audioSectionHeight}px` }}
          >
          {/* Simple Header Bar */}
          <div className="bg-gray-100 border-b-2 border-black p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-400 text-white px-3 py-1 border-2 border-black font-bold uppercase text-sm">
                ↗ TRANSFERRED
              </div>
              <span className="font-bold text-sm">AI Sales Agent → Taylor Smith</span>
            </div>
            <div className="text-sm text-gray-600">Duration: 4:01</div>
          </div>

          {/* Audio Timeline */}
          <div className="bg-white p-2 sm:p-4">
            {/* Mobile Controls Row */}
            <div className="sm:hidden">
              {/* First row: Play button and time */}
              <div className="flex items-center justify-between mb-3">
                <Button 
                  size="sm" 
                  variant="reverse"
                  className="bg-green-400 hover:bg-green-500 text-black px-3 py-2 text-xs border-0 relative z-10"
                >
                  <UilPlay className="h-3 w-3 mr-1" />
                  PLAY
                </Button>
                <div className="font-bold text-xs">00:43 / 4:01</div>
                <div className="bg-yellow-400 text-black px-2 py-1 border-2 border-black font-bold text-xs">1.0x</div>
              </div>
              {/* Second row: Volume */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold flex-shrink-0">VOL</span>
                <div className="flex-1 h-2 bg-gray-300 border border-black relative max-w-32">
                  <div className="absolute left-0 top-0 h-full bg-blue-400" style={{ width: '75%' }}></div>
                  <div className="absolute top-0 w-2 h-2 bg-white border border-black cursor-pointer" style={{ left: '75%', marginLeft: '-4px' }}></div>
                </div>
                <span className="text-xs font-bold flex-shrink-0">75%</span>
              </div>
            </div>
            
            {/* Desktop Controls Row */}
            <div className="hidden sm:flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="reverse"
                  className="bg-green-400 hover:bg-green-500 text-black border-0 relative z-10"
                >
                  <UilPlay className="h-4 w-4 mr-2" />
                  PLAY
                </Button>
                <div className="font-bold text-sm">00:43 / 4:01</div>
                <div className="bg-yellow-400 text-black px-3 py-1 border-2 border-black font-bold text-sm">1.0x</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold">VOLUME</span>
                <div className="w-24 h-3 bg-gray-300 border-2 border-black relative">
                  <div className="absolute left-0 top-0 h-full bg-blue-400" style={{ width: '75%' }}></div>
                  <div className="absolute top-0 w-3 h-3 bg-white border-2 border-black cursor-pointer" style={{ left: '75%', marginLeft: '-6px' }}></div>
                </div>
                <span className="text-xs font-bold">75%</span>
              </div>
            </div>
            
            {/* Mobile Waveform */}
            <div className="sm:hidden relative h-12 bg-gray-100 border border-black mb-3 overflow-hidden">
              <div className="flex items-end h-full px-1 gap-0.5">
                {Array.from({ length: 60 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-gray-400 flex-1 min-w-0"
                    style={{
                      height: `${Math.random() * 70 + 10}%`,
                      backgroundColor: i < 15 ? '#3b82f6' : i < 30 ? '#10b981' : i < 45 ? '#f59e0b' : '#6b7280'
                    }}
                  />
                ))}
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: '25%' }}></div>
            </div>
            
            {/* Desktop Waveform */}
            <div className="hidden sm:block relative h-20 bg-gray-100 border-2 border-black mb-4">
              <div className="flex items-end h-full px-2 gap-1">
                {Array.from({ length: 120 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-gray-400 w-1"
                    style={{
                      height: `${Math.random() * 70 + 10}%`,
                      backgroundColor: i < 30 ? '#3b82f6' : i < 60 ? '#10b981' : i < 90 ? '#f59e0b' : '#6b7280'
                    }}
                  />
                ))}
              </div>
              <div className="absolute top-0 bottom-0 w-1 bg-red-500 z-10" style={{ left: '25%' }}></div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="sm:hidden">
              {/* First row: Add buttons */}
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant="reverse" className="flex-1 text-xs py-2 border-0 relative z-10">
                  <UilEdit className="h-3 w-3 mr-1" />
                  Add Note
                </Button>
                <Button size="sm" variant="reverse" className="flex-1 text-xs py-2 border-0 relative z-10">
                  <UilLocationPoint className="h-3 w-3 mr-1" />
                  Mark Event
                </Button>
              </div>
              {/* Second row: Navigation */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button size="sm" variant="reverse" className="px-3 py-2 border-0 relative z-10">
                  <UilAngleLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs font-bold px-3 py-1 bg-gray-100 border border-black">1 of 2</span>
                <Button size="sm" variant="reverse" className="px-3 py-2 border-0 relative z-10">
                  <UilAngleRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="reverse" className="border-0 relative z-10">
                  <UilEdit className="h-3 w-3 mr-1" />
                  Add Note
                </Button>
                <Button size="sm" variant="reverse" className="border-0 relative z-10">
                  <UilLocationPoint className="h-3 w-3 mr-1" />
                  Mark Event
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="reverse" className="border-0 relative z-10">
                  <UilAngleLeft className="h-4 w-4 mr-1" />
                  PREV
                </Button>
                <span className="text-sm font-bold px-3">1 of 2</span>
                <Button size="sm" variant="reverse" className="border-0 relative z-10">
                  NEXT
                  <UilAngleRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 h-4 bg-gray-300 border-t-2 border-black cursor-ns-resize hover:bg-gray-400 active:bg-gray-400 flex items-center justify-center transition-colors touch-manipulation",
              isDragging && "bg-blue-300"
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              handleMouseDown({
                clientY: touch.clientY,
                preventDefault: () => e.preventDefault()
              } as React.MouseEvent);
            }}
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
                // Use minimum height that ensures right panel content is fully visible
                const rightPanelMinHeight = isMobile ? 150 : 320;
                setAudioSectionHeight(rightPanelMinHeight);
              }}
            >
              <span className="text-xs">↓ Show Audio Timeline</span>
            </Button>
          </div>
        )}

        {/* Modal Content */}
        <div className="modal-content-area flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
          {/* Main Content Area */}
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            {activeTab === 'details' && (
              <div className="p-2 sm:p-6 space-y-4 sm:space-y-6 pb-safe">
                {/* Call Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Basic Information */}
                  <div className="bg-white p-3 sm:p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-xs sm:text-sm mb-3 text-gray-600">CAMPAIGN INFORMATION</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">Campaign ID:</span>
                        <span>{data.callInfo.callId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">AI Agent:</span>
                        <span>{data.callInfo.agent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Prospect:</span>
                        <span>{data.callInfo.customer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Phone:</span>
                        <span>{data.callInfo.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Status:</span>
                        <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusBadgeColor(data.callInfo.status))}>
                          {data.callInfo.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timing Information */}
                  <div className="bg-white p-3 sm:p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-xs sm:text-sm mb-3 text-gray-600">TIMING</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">Start Time:</span>
                        <span>{data.timing.startTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">End Time:</span>
                        <span>{data.timing.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Duration:</span>
                        <span className="font-black text-lg">{data.timing.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Queue Time:</span>
                        <span>{data.timing.queueTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Hold Time:</span>
                        <span>{data.timing.holdTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Call Metrics */}
                  <div className="bg-white p-3 sm:p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-xs sm:text-sm mb-3 text-gray-600">METRICS</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">Resolution:</span>
                        <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusBadgeColor(data.metrics.resolution))}>
                          {data.metrics.resolution}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Transfer:</span>
                        <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", data.metrics.transfer ? "bg-blue-400 text-white" : "bg-gray-400 text-black")}>
                          {data.metrics.transfer ? 'YES' : 'NO'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Sentiment:</span>
                        <span className="px-2 py-1 bg-yellow-400 border border-black text-xs font-bold uppercase">{data.metrics.sentiment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Quality Score:</span>
                        <span className="font-black text-lg text-green-600">{data.metrics.qualityScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  {/* Call Flow */}
                  <div className="bg-white p-3 sm:p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-xs sm:text-sm mb-3 sm:mb-4 text-gray-600">CALL FLOW</h3>
                    <div className="space-y-2 sm:space-y-3">
                      {data.callFlow.map((step) => (
                        <div key={step.step} className="flex items-center gap-2 sm:gap-3">
                          <div className={cn("w-6 h-6 sm:w-8 sm:h-8 border-2 border-black flex items-center justify-center text-white font-black text-xs flex-shrink-0", step.color)}>
                            {step.step}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm truncate">{step.title}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{step.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-white p-3 sm:p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-xs sm:text-sm mb-3 sm:mb-4 text-gray-600">CUSTOMER PROFILE</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-400 border-2 border-black flex items-center justify-center font-black text-white text-sm sm:text-lg flex-shrink-0">
                          {data.customerProfile.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm sm:text-lg truncate">{data.customerProfile.name}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{data.customerProfile.type}</div>
                        </div>
                      </div>
                      <div className="border-t-2 border-gray-200 pt-2 sm:pt-3 space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold">Account Type:</span>
                          <span className="px-2 py-1 bg-yellow-400 border border-black text-xs font-bold uppercase">{data.customerProfile.accountType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">Customer Since:</span>
                          <span>{data.customerProfile.customerSince}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">Previous Calls:</span>
                          <span className="font-bold">{data.customerProfile.previousCalls}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">Satisfaction:</span>
                          <span className="font-black text-green-600">{data.customerProfile.satisfaction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">Last Contact:</span>
                          <span>{data.customerProfile.lastContact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-3 p-2 sm:p-0 pb-safe">
                {/* Mobile: Simplified Controls */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <Input 
                      placeholder="Search transcript..."
                      className="flex-1 text-sm h-9"
                    />
                    <Button size="sm" variant="reverse" className="px-3 h-9 flex-shrink-0 border-0 relative z-10">
                      <UilSearch className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="reverse" className="px-3 text-xs h-8 border-0 relative z-10">
                        <UilEdit className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button size="sm" variant="reverse" className="px-3 text-xs h-8 border-0 relative z-10">
                        <UilLocationPoint className="h-3 w-3 mr-1" />
                        Mark
                      </Button>
                    </div>
                    <Button size="sm" variant="reverse" className="px-3 text-xs h-8 border-0 relative z-10">
                      <UilExport className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {/* Desktop: Full Controls */}
                <div className="hidden sm:flex items-center gap-2 text-sm mb-4">
                  <Button size="sm" variant="reverse" className="border-0 relative z-10">
                    <UilEdit className="h-4 w-4 mr-2" />
                    Add Annotation
                  </Button>
                  <Button size="sm" variant="reverse" className="border-0 relative z-10">
                    <UilLocationPoint className="h-4 w-4 mr-2" />
                    Annotate
                  </Button>
                  <Input placeholder="Search transcript..." className="w-48" />
                  <Button size="sm" variant="reverse" className="border-0 relative z-10">
                    <UilSearch className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="reverse" className="border-0 relative z-10">
                    <UilExport className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Mobile: Compact Transcript */}
                <div className="sm:hidden space-y-3">
                  {data.transcript.map((entry, index) => (
                    <div key={index} className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      {/* Header with timing and speaker */}
                      <div className="flex items-center justify-between p-2 bg-gray-100 border-b-2 border-black">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 border border-black rounded-full flex items-center justify-center text-xs font-black text-white", getSpeakerColor(entry.speaker))}>
                            {entry.speaker.charAt(0).toUpperCase()}
                          </div>
                          <div className="bg-black text-white px-2 py-1 font-black text-xs">
                            {entry.timestamp}
                          </div>
                        </div>
                        {entry.sentiment && (
                          <span className={cn("text-xs px-2 py-1 border border-black font-bold uppercase", 
                            entry.sentiment === 'positive' ? 'bg-green-400 text-black' : 
                            entry.sentiment === 'negative' ? 'bg-red-400 text-white' : 'bg-gray-400 text-black'
                          )}>
                            {entry.sentiment}
                          </span>
                        )}
                      </div>
                      {/* Content with offset background */}
                      <div className="p-3 bg-white">
                        <div className="bg-gray-50 border border-gray-300 p-2 rounded-none">
                          <p className="text-sm leading-relaxed text-gray-900">{entry.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop: Full Transcript */}
                <div className="hidden sm:block space-y-3">
                  {data.transcript.map((entry, index) => (
                    <div key={index} className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <div className="flex gap-4 items-start">
                        {/* Timestamp with offset background */}
                        <div className="min-w-[80px]">
                          <div className="bg-black text-white px-2 py-1 font-black text-xs text-center border border-black">
                            {entry.timestamp}
                          </div>
                        </div>
                        
                        {/* Speaker and content */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className={cn("w-8 h-8 border-2 border-black rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0", getSpeakerColor(entry.speaker))}>
                              {entry.speaker.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              {/* Speaker label */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-black text-sm uppercase">{entry.speaker}</span>
                                {entry.sentiment && (
                                  <span className={cn("text-xs px-2 py-1 border border-black font-bold uppercase", 
                                    entry.sentiment === 'positive' ? 'bg-green-400 text-black' : 
                                    entry.sentiment === 'negative' ? 'bg-red-400 text-white' : 'bg-gray-400 text-black'
                                  )}>
                                    {entry.sentiment}
                                  </span>
                                )}
                              </div>
                              {/* Content with offset background */}
                              <div className="bg-gray-50 border-2 border-gray-300 p-3">
                                <p className="text-sm leading-relaxed text-gray-900">{entry.content}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="p-2 sm:p-6 space-y-4 sm:space-y-6 pb-safe">
                {/* Mobile: Compact Timeline */}
                <div className="sm:hidden">
                  <div className="bg-white border-2 border-black p-3 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black uppercase text-sm">CALL TIMELINE</h3>
                      <span className="text-xs text-gray-600">6 events</span>
                    </div>
                    
                    {/* Timeline entries */}
                    <div className="space-y-3">
                      {data.timeline?.slice(0, 4).map((event, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn("w-3 h-3 border border-black rounded-full", getTimelineEventColor(event.type))}></div>
                            {index < 3 && <div className="w-0.5 h-6 bg-gray-300 mt-1"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-black text-xs">{event.timestamp.split(' ')[1]}</span>
                              {event.duration && (
                                <span className="text-xs text-gray-600">{event.duration}</span>
                              )}
                            </div>
                            <div className="font-bold text-sm mb-1 truncate">{event.event}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{event.description}</div>
                          </div>
                        </div>
                      ))}
                      
                      {(data.timeline?.length || 0) > 4 && (
                        <div className="text-center pt-2 border-t border-gray-200">
                          <button className="text-xs font-bold text-blue-600 uppercase">Show {(data.timeline?.length || 0) - 4} more events</button>
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-200">
                      <button className="w-8 h-8 border-2 border-black bg-white active:bg-gray-100 flex items-center justify-center touch-manipulation">
                        <UilAngleLeft className="h-3 w-3" />
                      </button>
                      <div className="flex gap-1">
                        <button className="w-8 h-8 border-2 border-black bg-blue-400 text-white font-bold text-xs">1</button>
                        <button className="w-8 h-8 border-2 border-black bg-white hover:bg-gray-100 font-bold text-xs">2</button>
                        <button className="w-8 h-8 border-2 border-black bg-white hover:bg-gray-100 font-bold text-xs">3</button>
                      </div>
                      <button className="w-8 h-8 border-2 border-black bg-white active:bg-gray-100 flex items-center justify-center touch-manipulation">
                        <UilAngleRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Full Timeline */}
                <div className="hidden sm:block">
                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black uppercase text-lg">CALL TIMELINE</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Showing 1-6 of 6 events</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="reverse" disabled className="border-0 relative z-10">
                            <UilAngleLeft className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="reverse" className="bg-blue-400 text-white border-0 relative z-10">1</Button>
                          <Button size="sm" variant="reverse" disabled className="border-0 relative z-10">
                            <UilAngleRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {data.timeline?.map((event, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={cn("w-4 h-4 border-2 border-black", getTimelineEventColor(event.type))}></div>
                            {index < (data.timeline?.length || 0) - 1 && (
                              <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-black text-sm">{event.timestamp}</span>
                              {event.duration && (
                                <span className="text-xs text-gray-600">Duration: {event.duration}</span>
                              )}
                            </div>
                            <div className="font-bold text-sm mb-1">{event.event}</div>
                            <div className="text-sm text-gray-600">{event.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quality-summary' && (
              <div className="p-6 space-y-6">
                {/* Overall Score */}
                <div className="bg-white p-6 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-center">
                  <h3 className="font-black uppercase text-lg mb-4">OVERALL QUALITY SCORE</h3>
                  <div className="text-6xl font-black text-green-600 mb-2">{data.qualitySummary?.overallScore || 0}</div>
                  <div className="text-lg font-bold text-gray-600">OUT OF 100</div>
                </div>

                {/* Category Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {data.qualitySummary?.categories?.map((category, index) => (
                    <div key={index} className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black uppercase text-sm">{category.name}</h4>
                        <span className="font-black text-lg">{category.score}/{category.maxScore}</span>
                      </div>
                      <div className="w-full bg-gray-300 border-2 border-black h-4">
                        <div 
                          className={cn("h-full border-r-2 border-black", category.color)}
                          style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Strengths */}
                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h4 className="font-black uppercase text-sm mb-4 text-green-600">STRENGTHS</h4>
                    <div className="space-y-2">
                      {data.qualitySummary?.strengths?.map((strength, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 border border-black"></div>
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h4 className="font-black uppercase text-sm mb-4 text-red-600">AREAS FOR IMPROVEMENT</h4>
                    <div className="space-y-3">
                      {data.qualitySummary?.improvements?.map((improvement, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{improvement.area}</span>
                            <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getPriorityColor(improvement.priority))}>
                              {improvement.priority}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">{improvement.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit-trail' && (
              <div className="p-2 sm:p-6 pb-safe">
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  <div className="bg-gray-100 border-2 border-black p-3 mb-3">
                    <h3 className="font-black uppercase text-sm">SYSTEM AUDIT TRAIL</h3>
                    <span className="text-xs text-gray-600">{data.auditTrail?.length || 0} entries</span>
                  </div>
                  
                  {data.auditTrail?.map((entry, index) => (
                    <div key={index} className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      {/* Card Header */}
                      <div className="bg-gray-100 border-b-2 border-black p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{entry.timestamp.split(' ')[1]}</span>
                          <span className="px-2 py-0.5 bg-blue-400 border border-black text-xs font-bold uppercase text-white">
                            {entry.action}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-gray-600">{entry.system}</span>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">USER:</span>
                          <span className="font-bold text-sm">{entry.user}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-600 block mb-1">DETAILS:</span>
                          <div className="bg-gray-50 border border-gray-300 p-2">
                            <p className="text-xs leading-relaxed">{entry.details}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono pt-1">
                          {entry.timestamp.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Tablet View - Compact Table */}
                <div className="hidden sm:block lg:hidden">
                  <div className="bg-white border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <div className="border-b-4 border-black bg-gray-100 p-3">
                      <h3 className="font-black uppercase text-base">SYSTEM AUDIT TRAIL</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-black bg-gray-100">
                            <th className="text-left p-2 font-black uppercase text-xs">TIME</th>
                            <th className="text-left p-2 font-black uppercase text-xs">USER</th>
                            <th className="text-left p-2 font-black uppercase text-xs">ACTION</th>
                            <th className="text-left p-2 font-black uppercase text-xs">DETAILS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.auditTrail?.map((entry, index) => (
                            <tr key={index} className={cn(
                              "border-b border-gray-300",
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            )}>
                              <td className="p-2 font-mono text-xs">{entry.timestamp.split(' ')[1]}</td>
                              <td className="p-2 font-bold text-xs">{entry.user}</td>
                              <td className="p-2 text-xs">
                                <span className="px-1 py-0.5 bg-blue-400 border border-black text-xs font-bold uppercase text-white">
                                  {entry.action}
                                </span>
                              </td>
                              <td className="p-2 text-xs max-w-xs truncate">{entry.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Full Table */}
                <div className="hidden lg:block">
                  <div className="bg-white border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <div className="border-b-4 border-black bg-gray-100 p-4">
                      <h3 className="font-black uppercase text-lg">SYSTEM AUDIT TRAIL</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-4 border-black bg-gray-100">
                            <th className="text-left p-4 font-black uppercase text-sm">TIMESTAMP</th>
                            <th className="text-left p-4 font-black uppercase text-sm">USER</th>
                            <th className="text-left p-4 font-black uppercase text-sm">ACTION</th>
                            <th className="text-left p-4 font-black uppercase text-sm">DETAILS</th>
                            <th className="text-left p-4 font-black uppercase text-sm">SYSTEM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.auditTrail?.map((entry, index) => (
                            <tr key={index} className={cn(
                              "border-b-2 border-black",
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            )}>
                              <td className="p-4 font-mono text-sm">{entry.timestamp}</td>
                              <td className="p-4 font-bold text-sm">{entry.user}</td>
                              <td className="p-4 text-sm">
                                <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">
                                  {entry.action}
                                </span>
                              </td>
                              <td className="p-4 text-sm">{entry.details}</td>
                              <td className="p-4 text-sm font-mono">{entry.system}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customer-journeys' && (
              <div className="p-2 sm:p-6 space-y-3 sm:space-y-6 pb-safe">
                {/* Mobile View */}
                <div className="sm:hidden space-y-3">
                  {/* Mobile Touchpoints */}
                  <div className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <div className="bg-gray-100 border-b-2 border-black p-3">
                      <h3 className="font-black uppercase text-sm">CUSTOMER TOUCHPOINTS</h3>
                      <span className="text-xs text-gray-600">{data.customerJourney?.touchpoints?.length || 0} interactions</span>
                    </div>
                    <div className="p-3 space-y-3">
                      {data.customerJourney?.touchpoints?.map((touchpoint, index) => (
                        <div key={index} className="border border-gray-300 p-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{touchpoint.date}</span>
                            <span className={cn("px-2 py-0.5 border border-black text-xs font-bold uppercase", getStatusColor(touchpoint.status))}>
                              {touchpoint.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-400 border border-black text-xs font-bold uppercase text-white">
                              {touchpoint.type}
                            </span>
                            <span className="text-xs text-gray-600">{touchpoint.channel}</span>
                          </div>
                          <div className="text-xs">{touchpoint.outcome}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Satisfaction */}
                  <div className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <div className="bg-gray-100 border-b-2 border-black p-3">
                      <h4 className="font-black uppercase text-sm">SATISFACTION HISTORY</h4>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.customerJourney?.satisfaction?.map((entry, index) => (
                        <div key={index} className="border-b border-gray-200 pb-2 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{entry.date}</span>
                            <span className="font-black text-base text-green-600">{entry.score}/10</span>
                          </div>
                          {entry.feedback && (
                            <p className="text-xs text-gray-600 italic">"{entry.feedback}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Issues */}
                  <div className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <div className="bg-gray-100 border-b-2 border-black p-3">
                      <h4 className="font-black uppercase text-sm">ISSUES HISTORY</h4>
                    </div>
                    <div className="p-3 space-y-3">
                      {data.customerJourney?.issues?.map((issue, index) => (
                        <div key={index} className="border border-gray-300 p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{issue.date}</span>
                            <span className={cn("px-2 py-0.5 border border-black text-xs font-bold uppercase", getStatusColor(issue.status))}>
                              {issue.status}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-gray-800">{issue.issue}</div>
                          <div className="text-xs text-gray-600 bg-gray-50 p-1">{issue.resolution}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tablet View */}
                <div className="hidden sm:block lg:hidden space-y-4">
                  {/* Tablet Touchpoints */}
                  <div className="bg-white border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <div className="border-b-4 border-black bg-gray-100 p-3">
                      <h3 className="font-black uppercase text-base">CUSTOMER TOUCHPOINTS</h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.customerJourney?.touchpoints?.map((touchpoint, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-3 p-2 bg-gray-50 border-2 border-black">
                          <span className="font-bold text-sm">{touchpoint.date}</span>
                          <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">
                            {touchpoint.type}
                          </span>
                          <span className="text-sm">{touchpoint.channel}</span>
                          <span className="text-sm flex-1">{touchpoint.outcome}</span>
                          <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusColor(touchpoint.status))}>
                            {touchpoint.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tablet Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <h4 className="font-black uppercase text-sm mb-3">SATISFACTION HISTORY</h4>
                      <div className="space-y-2">
                        {data.customerJourney?.satisfaction?.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-0">
                            <span className="text-xs font-bold">{entry.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base text-green-600">{entry.score}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <h4 className="font-black uppercase text-sm mb-3">ISSUES HISTORY</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.customerJourney?.issues?.map((issue, index) => (
                          <div key={index} className="space-y-1 border-b border-gray-200 pb-2 last:border-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{issue.date}</span>
                              <span className={cn("px-1 py-0.5 border border-black text-xs font-bold uppercase", getStatusColor(issue.status))}>
                                {issue.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-800 font-medium">{issue.issue}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop View - Original Layout */}
                <div className="hidden lg:block space-y-6">
                  {/* Desktop Touchpoints */}
                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-lg mb-4">CUSTOMER TOUCHPOINTS</h3>
                    <div className="space-y-3">
                      {data.customerJourney?.touchpoints?.map((touchpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-sm">{touchpoint.date}</span>
                            <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">
                              {touchpoint.type}
                            </span>
                            <span className="text-sm">{touchpoint.channel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{touchpoint.outcome}</span>
                            <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusColor(touchpoint.status))}>
                              {touchpoint.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <h4 className="font-black uppercase text-sm mb-4">SATISFACTION HISTORY</h4>
                      <div className="space-y-3">
                        {data.customerJourney?.satisfaction?.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-bold">{entry.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-lg text-green-600">{entry.score}/10</span>
                              {entry.feedback && (
                                <span className="text-xs text-gray-600 max-w-32 truncate">"{entry.feedback}"</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <h4 className="font-black uppercase text-sm mb-4">ISSUES HISTORY</h4>
                      <div className="space-y-3">
                        {data.customerJourney?.issues?.map((issue, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">{issue.date}</span>
                              <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusColor(issue.status))}>
                                {issue.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-800">{issue.issue}</div>
                            <div className="text-xs text-gray-600">{issue.resolution}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Insights Sidebar */}
          {activeTab === 'transcript' && (
            <div className="w-full sm:w-80 border-t-2 sm:border-t-0 sm:border-l-4 border-black bg-white overflow-y-auto max-h-64 sm:max-h-full">
              {/* Mobile: Compact Insights */}
              <div className="sm:hidden">
                <div className="border-b-2 border-black bg-blue-400 p-3">
                  <h3 className="font-black uppercase text-sm text-white">AI INSIGHTS</h3>
                </div>
                <div className="p-3 space-y-3">
                  {/* Topics */}
                  <div className="bg-gray-50 border-2 border-black p-2">
                    <h4 className="font-black uppercase text-xs mb-2 text-gray-700">TOPICS</h4>
                    <div className="flex flex-wrap gap-1">
                      {data.aiInsights.topics.slice(0, 3).map((topic, index) => (
                        <Badge key={index} className={cn("border border-black font-bold text-xs", getTopicBadgeColor(topic.type))}>
                          {topic.name}
                        </Badge>
                      ))}
                      {data.aiInsights.topics.length > 3 && (
                        <Badge className="bg-gray-300 border border-black font-bold text-xs">
                          +{data.aiInsights.topics.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Key Events */}
                  <div className="bg-gray-50 border-2 border-black p-2">
                    <h4 className="font-black uppercase text-xs mb-2 text-gray-700">KEY EVENTS</h4>
                    <div className="space-y-2">
                      {data.aiInsights.events.slice(0, 3).map((event, index) => (
                        <div key={index} className="bg-white border border-black p-1 flex items-center gap-2">
                          <div className={cn("w-3 h-3 border border-black", getEventColor(event.type))}></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs truncate">{event.name}</div>
                            <div className="text-xs text-gray-600">{event.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Full Insights */}
              <div className="hidden sm:block">
                {/* Header */}
                <div className="border-b-4 border-black bg-blue-400 p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black uppercase text-lg text-white">AI INSIGHTS</h3>
                    <Badge className="bg-white text-black border-2 border-black font-bold uppercase text-xs">
                      LIVE
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Topics Section */}
                  <div className="bg-gray-50 border-2 border-black p-3">
                    <h4 className="font-black uppercase text-sm mb-3 text-gray-700">CONVERSATION TOPICS</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {data.aiInsights.topics.map((topic, index) => (
                        <Badge key={index} className={cn("border border-black font-bold text-xs text-center py-1", getTopicBadgeColor(topic.type))}>
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Events Timeline */}
                  <div className="bg-gray-50 border-2 border-black p-3">
                    <h4 className="font-black uppercase text-sm mb-3 text-gray-700">EVENT TIMELINE</h4>
                    <div className="space-y-2">
                      {data.aiInsights.events.map((event, index) => (
                        <div key={index} className="bg-white border-2 border-black p-2 flex items-center gap-3">
                          <div className={cn("w-4 h-4 border-2 border-black", getEventColor(event.type))}></div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{event.name}</div>
                            <div className="text-xs text-gray-600">{event.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="bg-gray-50 border-2 border-black p-3">
                    <h4 className="font-black uppercase text-sm mb-3 text-gray-700">ANALYSIS SUMMARY</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">SENTIMENT SCORE</span>
                        <Badge className="bg-green-400 text-black border border-black font-bold text-xs">POSITIVE</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">CALL QUALITY</span>
                        <Badge className="bg-blue-400 text-white border border-black font-bold text-xs">HIGH</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">RESOLUTION</span>
                        <Badge className="bg-green-400 text-black border border-black font-bold text-xs">RESOLVED</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}