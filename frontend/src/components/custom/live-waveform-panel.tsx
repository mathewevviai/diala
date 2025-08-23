'use client';

import * as React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { UilMicrophone, UilRobot } from '@tooni/iconscout-unicons-react';

interface LiveWaveformPanelProps {
  agentName: string;
  customerName: string;
  agentGain: number;
  customerGain: number;
  currentSpeaker: 'agent' | 'customer' | null;
  isMuted?: boolean;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

export default function LiveWaveformPanel({
  agentName,
  customerName,
  agentGain,
  customerGain,
  currentSpeaker,
  isMuted = false,
  className = '',
  direction = 'horizontal'
}: LiveWaveformPanelProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (direction === 'horizontal') {
    return (
      <div className={`flex ${className}`}>
        <ResizablePanelGroup direction="horizontal">
          {/* Agent audio */}
          <ResizablePanel 
            defaultSize={50} 
            minSize={20}
            style={{ flexBasis: `${Math.max(20, Math.min(80, agentGain))}%` }}
            className="transition-all duration-200"
          >
            <div className="h-full bg-[rgb(0,82,255)] p-3 flex items-center justify-center relative">
              <div className="text-center">
                <UilRobot className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white mb-2 mx-auto block`} />
                <p className={`text-white font-black ${isMobile ? 'text-xs' : 'text-sm'} uppercase`}>{agentName}</p>
                <p className={`text-white/80 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {currentSpeaker === 'agent' ? 'SPEAKING' : 'AI AGENT'}
                </p>
              </div>
              <div className={`absolute ${isMobile ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3'}`}>
                <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100"
                    style={{ width: `${agentGain}%` }}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          <div className="w-[2px] bg-black"></div>

          {/* Customer audio */}
          <ResizablePanel 
            defaultSize={50}
            minSize={20}
            style={{ flexBasis: `${Math.max(20, Math.min(80, customerGain))}%` }}
            className="transition-all duration-200"
          >
            <div className="h-full bg-green-500 p-3 flex items-center justify-center relative">
              <div className="text-center">
                <UilMicrophone className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white mb-2 mx-auto block`} />
                <p className={`text-white font-black ${isMobile ? 'text-xs' : 'text-sm'} uppercase`}>{customerName}</p>
                <p className={`text-white/80 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {isMuted ? 'MUTED' : currentSpeaker === 'customer' ? 'SPEAKING' : 'CUSTOMER'}
                </p>
              </div>
              <div className={`absolute ${isMobile ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3'}`}>
                <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100"
                    style={{ width: `${customerGain}%` }}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className={`flex flex-col ${className}`}>
      <ResizablePanelGroup direction="vertical">
        {/* Agent audio */}
        <ResizablePanel 
          defaultSize={50} 
          minSize={20}
          style={{ flexBasis: `${Math.max(20, Math.min(80, agentGain))}%` }}
          className="transition-all duration-200"
        >
          <div className="h-full bg-[rgb(0,82,255)] p-6 flex items-center justify-center relative">
            <div className="text-center">
              <UilRobot className="h-16 w-16 text-white mb-4 mx-auto block" />
              <p className="text-white font-black text-2xl uppercase">{agentName}</p>
              <p className="text-white/80">
                {currentSpeaker === 'agent' ? 'SPEAKING' : 'AI AGENT'}
              </p>
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

        <ResizableHandle className="h-2 bg-black hover:bg-gray-800 transition-colors" />

        {/* Customer audio */}
        <ResizablePanel 
          defaultSize={50}
          minSize={20}
          style={{ flexBasis: `${Math.max(20, Math.min(80, customerGain))}%` }}
          className="transition-all duration-200"
        >
          <div className="h-full bg-green-500 p-6 flex items-center justify-center relative">
            <div className="text-center">
              <UilMicrophone className="h-16 w-16 text-white mb-4 mx-auto block" />
              <p className="text-white font-black text-2xl uppercase">{customerName}</p>
              <p className="text-white/80">
                {isMuted ? 'MUTED' : currentSpeaker === 'customer' ? 'SPEAKING' : 'CUSTOMER'}
              </p>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{ width: `${customerGain}%` }}
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}