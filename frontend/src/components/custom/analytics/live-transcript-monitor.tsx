'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UilCommentAlt, UilChart, UilBrain } from '@tooni/iconscout-unicons-react';

interface TranscriptEntry {
  timestamp: string;
  speaker: 'agent' | 'customer';
  text: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface LiveTranscriptMonitorProps {
  title?: string;
  bgColor?: string;
  transcript?: TranscriptEntry[];
  isLive?: boolean;
}

export default function LiveTranscriptMonitor({
  title = "LIVE CONVERSATION TRANSCRIPT",
  bgColor = "bg-green-50",
  transcript,
  isLive = true
}: LiveTranscriptMonitorProps) {
  
  const defaultTranscript: TranscriptEntry[] = [
    {
      timestamp: '2:15',
      speaker: 'agent',
      text: 'Our AI solution can reduce your call center costs by up to 40% while improving customer satisfaction.',
      sentiment: 'positive'
    },
    {
      timestamp: '2:16',
      speaker: 'customer',
      text: 'That sounds interesting, but how does it handle complex customer issues?',
      sentiment: 'neutral'
    },
    {
      timestamp: '2:17',
      speaker: 'agent',
      text: 'Great question! Our AI agents are trained on thousands of real conversations and can escalate to human agents when needed.',
      sentiment: 'positive'
    },
    {
      timestamp: '2:18',
      speaker: 'customer',
      text: 'What about the implementation timeline and cost?',
      sentiment: 'neutral'
    }
  ];

  const displayTranscript = transcript || defaultTranscript;

  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-green-400">
          <UilCommentAlt className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">{title}</h3>
        {isLive && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-green-600">STREAMING LIVE</span>
          </div>
        )}
      </div>
      
      {/* Live Transcript Section */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="max-h-80 overflow-y-auto space-y-3 border-2 border-gray-200 p-3 bg-gray-50">
          {displayTranscript.map((entry, index) => (
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
          {isLive && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-gray-600">CONVERSATION IN PROGRESS</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Sentiment Analysis */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-purple-400">
            <UilBrain className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">REAL-TIME SENTIMENT ANALYSIS</div>
        </div>
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
  );
}