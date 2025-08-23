'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  UilUserCheck, 
  UilHeadphones, 
  UilMicrophone, 
  UilExchange, 
  UilCircle, 
  UilEdit, 
  UilSquare,
  UilLocationPoint,
  UilShield,
  UilChart
} from '@tooni/iconscout-unicons-react';

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  color: string;
}

interface CoachingRecommendation {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

interface SupervisorControlsMonitorProps {
  title?: string;
  bgColor?: string;
  performanceMetrics?: PerformanceMetric[];
  coachingRecommendations?: CoachingRecommendation[];
}

export default function SupervisorControlsMonitor({
  title = "LIVE CALL INTERVENTION & CONTROL",
  bgColor = "bg-orange-50",
  performanceMetrics,
  coachingRecommendations
}: SupervisorControlsMonitorProps) {
  
  const defaultPerformanceMetrics: PerformanceMetric[] = [
    { label: "ADHERENCE", value: 94, unit: "%", color: "green" },
    { label: "CONFIDENCE", value: 87, unit: "%", color: "blue" },
    { label: "QUALITY", value: 91, unit: "%", color: "purple" },
    { label: "ENGAGEMENT", value: 78, unit: "%", color: "yellow" }
  ];

  const defaultCoachingRecommendations: CoachingRecommendation[] = [
    {
      id: '1',
      type: 'success',
      title: 'EXCELLENT RAPPORT BUILDING',
      description: 'AI agent is successfully building trust and connection with prospect. Maintain current approach.',
      bgColor: 'bg-green-50',
      iconColor: 'bg-green-400'
    },
    {
      id: '2',
      type: 'warning',
      title: 'SUGGEST PAUSE FOR OBJECTION',
      description: 'Prospect may have unspoken concerns. Consider prompting AI to ask clarifying questions.',
      bgColor: 'bg-yellow-50',
      iconColor: 'bg-yellow-400'
    },
    {
      id: '3',
      type: 'info',
      title: 'READY FOR DEMO TRANSITION',
      description: 'High engagement detected. AI should transition to product demonstration phase.',
      bgColor: 'bg-blue-50',
      iconColor: 'bg-blue-400'
    }
  ];

  const displayMetrics = performanceMetrics || defaultPerformanceMetrics;
  const displayRecommendations = coachingRecommendations || defaultCoachingRecommendations;

  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-orange-400">
          <UilUserCheck className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">{title}</h3>
      </div>
      
      {/* Emergency Controls */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-red-400">
            <UilShield className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">LIVE CALL INTERVENTION</div>
        </div>
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
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-purple-400">
            <UilChart className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">REAL-TIME AI PERFORMANCE</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {displayMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-black text-${metric.color}-600`}>{metric.value}{metric.unit}</div>
              <div className="text-xs text-gray-600 font-bold">{metric.label}</div>
              <div className="w-full bg-gray-300 border border-black h-2 mt-1">
                <div className={`h-full bg-${metric.color}-400`} style={{ width: `${metric.value}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Coaching Suggestions */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-cyan-400">
            <UilHeadphones className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">AI COACHING RECOMMENDATIONS</div>
        </div>
        <div className="space-y-3">
          {displayRecommendations.map((recommendation) => (
            <div key={recommendation.id} className={`p-3 ${recommendation.bgColor} border-2 border-${recommendation.type === 'success' ? 'green' : recommendation.type === 'warning' ? 'yellow' : 'blue'}-300`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 ${recommendation.iconColor} border border-black`}></div>
                <span className={`font-bold text-sm text-${recommendation.type === 'success' ? 'green' : recommendation.type === 'warning' ? 'yellow' : 'blue'}-800`}>
                  {recommendation.title}
                </span>
              </div>
              <p className={`text-xs text-${recommendation.type === 'success' ? 'green' : recommendation.type === 'warning' ? 'yellow' : 'blue'}-700`}>
                {recommendation.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-gray-400">
            <UilLocationPoint className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">QUICK SUPERVISOR ACTIONS</div>
        </div>
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
  );
}