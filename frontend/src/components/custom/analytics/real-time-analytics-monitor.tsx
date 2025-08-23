'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  UilChart, 
  UilBrain, 
  UilBullseye, 
  UilVolumeUp, 
  UilVolumeMute,
  UilTrophy,
  UilLocationPoint
} from '@tooni/iconscout-unicons-react';

interface CallMetric {
  label: string;
  value: string;
  color: string;
}

interface ConversationPhase {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  duration?: string;
}

interface EngagementIndicator {
  label: string;
  level: string;
  percentage: number;
  color: string;
}

interface OutcomePrediction {
  title: string;
  percentage: number;
  description: string;
  color: string;
  bgColor: string;
}

interface RealTimeAnalyticsMonitorProps {
  title?: string;
  bgColor?: string;
  callMetrics?: CallMetric[];
  conversationPhases?: ConversationPhase[];
  engagementIndicators?: EngagementIndicator[];
  outcomePredictions?: OutcomePrediction[];
  isMuted?: boolean;
  volume?: number;
  onMuteToggle?: () => void;
  onVolumeChange?: (volume: number) => void;
}

export default function RealTimeAnalyticsMonitor({
  title = "REAL-TIME CALL ANALYTICS",
  bgColor = "bg-yellow-50",
  callMetrics,
  conversationPhases,
  engagementIndicators,
  outcomePredictions,
  isMuted = false,
  volume = 75,
  onMuteToggle,
  onVolumeChange
}: RealTimeAnalyticsMonitorProps) {
  
  const defaultCallMetrics: CallMetric[] = [
    { label: "CALL DURATION", value: "4:23", color: "green" },
    { label: "WORDS/MIN", value: "142", color: "blue" },
    { label: "TALK TIME", value: "67%", color: "purple" },
    { label: "KEY MOMENTS", value: "3", color: "yellow" }
  ];

  const defaultConversationPhases: ConversationPhase[] = [
    {
      id: '1',
      title: 'Opening & Rapport Building',
      description: '✓ Completed - 2:15 duration - High engagement',
      status: 'completed',
      duration: '2:15'
    },
    {
      id: '2',
      title: 'Needs Discovery & Pain Points',
      description: '⚡ Active - 1:46 duration - Good responses',
      status: 'active',
      duration: '1:46'
    },
    {
      id: '3',
      title: 'Solution Presentation',
      description: '⏳ Pending - Ready to transition',
      status: 'pending'
    }
  ];

  const defaultEngagementIndicators: EngagementIndicator[] = [
    { label: "Voice Energy Level", level: "HIGH", percentage: 82, color: "green" },
    { label: "Response Quality", level: "GOOD", percentage: 76, color: "blue" },
    { label: "Question Frequency", level: "MEDIUM", percentage: 64, color: "purple" },
    { label: "Interest Signals", level: "STRONG", percentage: 88, color: "yellow" }
  ];

  const defaultOutcomePredictions: OutcomePrediction[] = [
    {
      title: "CONVERSION PROBABILITY",
      percentage: 73,
      description: "High likelihood of positive outcome",
      color: "green",
      bgColor: "bg-green-50"
    },
    {
      title: "DEMO ACCEPTANCE",
      percentage: 89,
      description: "Very likely to agree to demo",
      color: "blue",
      bgColor: "bg-blue-50"
    },
    {
      title: "IMMEDIATE CLOSE",
      percentage: 45,
      description: "May need nurturing sequence",
      color: "yellow",
      bgColor: "bg-yellow-50"
    }
  ];

  const displayCallMetrics = callMetrics || defaultCallMetrics;
  const displayConversationPhases = conversationPhases || defaultConversationPhases;
  const displayEngagementIndicators = engagementIndicators || defaultEngagementIndicators;
  const displayOutcomePredictions = outcomePredictions || defaultOutcomePredictions;

  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-yellow-400">
          <UilChart className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">{title}</h3>
      </div>
      
      {/* Live Call Metrics */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-green-400">
            <UilTrophy className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">LIVE CALL METRICS</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {displayCallMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-black text-${metric.color}-600`}>{metric.value}</div>
              <div className="text-xs text-gray-600 font-bold">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Flow Analysis */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-blue-400">
            <UilBrain className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">CONVERSATION FLOW ANALYSIS</div>
        </div>
        <div className="space-y-3">
          {displayConversationPhases.map((phase, index) => (
            <div key={phase.id} className={cn(
              "flex items-center gap-4 p-3 border-2 border-black",
              phase.status === 'completed' ? "bg-green-50" :
              phase.status === 'active' ? "bg-blue-50" : "bg-gray-50"
            )}>
              <div className={cn(
                "w-8 h-8 border-2 border-black flex items-center justify-center text-white font-black text-xs",
                phase.status === 'completed' ? "bg-green-400" :
                phase.status === 'active' ? "bg-blue-400" : "bg-gray-400"
              )}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{phase.title}</div>
                <div className="text-xs text-gray-600">{phase.description}</div>
              </div>
              <div className={cn(
                "px-2 py-1 border border-black text-xs font-bold uppercase",
                phase.status === 'completed' ? "bg-green-400 text-black" :
                phase.status === 'active' ? "bg-blue-400 text-white" : "bg-gray-400 text-white"
              )}>
                {phase.status === 'completed' ? "COMPLETED" :
                 phase.status === 'active' ? "ACTIVE" : "PENDING"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prospect Engagement Indicators */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-purple-400">
            <UilBullseye className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">PROSPECT ENGAGEMENT INDICATORS</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayEngagementIndicators.map((indicator, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{indicator.label}</span>
                <span className={`text-sm font-black text-${indicator.color}-600`}>{indicator.level}</span>
              </div>
              <div className="w-full bg-gray-300 border-2 border-black h-3">
                <div 
                  className={`h-full bg-${indicator.color}-400`} 
                  style={{ width: `${indicator.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Outcome Predictions */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-orange-400">
            <UilLocationPoint className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">AI OUTCOME PREDICTIONS</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {displayOutcomePredictions.map((prediction, index) => (
            <div key={index} className={cn("text-center p-3 border-2", `${prediction.bgColor} border-${prediction.color}-300`)}>
              <div className={`text-2xl font-black text-${prediction.color}-600`}>{prediction.percentage}%</div>
              <div className="text-xs text-gray-600 font-bold">{prediction.title}</div>
              <div className={`text-xs text-${prediction.color}-700 mt-1`}>{prediction.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitor Controls */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="subheader" size="icon" className="bg-gray-400">
            <UilVolumeUp className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">MONITOR CONTROLS</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            size="sm"
            variant="reverse"
            className="px-3 py-2"
            onClick={onMuteToggle}
          >
            {isMuted ? <UilVolumeMute className="h-4 w-4 mr-1" /> : <UilVolumeUp className="h-4 w-4 mr-1" />}
            {isMuted ? "MUTED" : "AUDIO"}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">VOLUME</span>
            <div 
              className="w-20 h-3 bg-gray-300 border-2 border-black relative cursor-pointer"
              onClick={(e) => {
                if (onVolumeChange) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const newVolume = Math.round((x / rect.width) * 100);
                  onVolumeChange(Math.max(0, Math.min(100, newVolume)));
                }
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
  );
}