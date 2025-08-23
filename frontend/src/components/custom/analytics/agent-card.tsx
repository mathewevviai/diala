'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'inactive';
  calls: number;
  success: number;
  currentCall?: string | null;
}

interface AgentMetric {
  label: string;
  value: string | number;
}

interface AgentCardProps {
  agent: Agent;
  showCurrentStatus?: boolean;
  showMetrics?: boolean;
  additionalMetrics?: AgentMetric[];
  avatarColor?: string;
  bgColor?: string;
}

export default function AgentCard({
  agent,
  showCurrentStatus = true,
  showMetrics = true,
  additionalMetrics,
  avatarColor = "bg-blue-400",
  bgColor = "bg-white"
}: AgentCardProps) {
  
  const defaultAdditionalMetrics: AgentMetric[] = [
    {
      label: "Appointments:",
      value: Math.floor(agent.calls * (agent.success / 100) * 0.8)
    },
    {
      label: "Avg Call:",
      value: `${Math.floor(Math.random() * 2) + 2}m ${Math.floor(Math.random() * 60)}s`
    },
    {
      label: "Follow-ups:",
      value: Math.floor(agent.calls * 0.3)
    },
    {
      label: "Conversion:",
      value: `${Math.floor(agent.success * 0.8)}%`
    }
  ];

  const displayMetrics = additionalMetrics || defaultAdditionalMetrics;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-400 text-black";
      case 'paused':
        return "bg-yellow-400 text-black";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getPerformanceBarColor = (success: number) => {
    if (success >= 90) return "bg-green-400";
    if (success >= 80) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className={`${bgColor} p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${avatarColor} border-2 border-black flex items-center justify-center font-black text-white text-sm`}>
            AI
          </div>
          <div>
            <div className="font-black text-sm">{agent.name}</div>
            <div className="text-xs text-gray-600">Agent ID: {agent.id}</div>
          </div>
        </div>
        <Badge className={cn(
          "border border-black font-bold uppercase text-xs",
          getStatusStyle(agent.status)
        )}>
          {agent.status}
        </Badge>
      </div>

      {/* Current Activity Status */}
      {showCurrentStatus && (
        <div className="mb-4 p-3 bg-gray-50 border-2 border-black">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs uppercase text-gray-600">CURRENT STATUS</span>
            {agent.currentCall && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
          {agent.currentCall ? (
            <div>
              <div className="font-bold text-sm text-green-600">ON CALL</div>
              <div className="text-xs text-gray-700">Speaking with {agent.currentCall}</div>
              <div className="text-xs text-gray-500">Duration: {Math.floor(Math.random() * 180) + 60}s</div>
            </div>
          ) : (
            <div>
              <div className="font-bold text-sm text-blue-600">AVAILABLE</div>
              <div className="text-xs text-gray-700">Ready for next call</div>
              <div className="text-xs text-gray-500">Idle: {Math.floor(Math.random() * 30) + 10}s</div>
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      {showMetrics && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-black text-blue-600">{agent.calls}</div>
              <div className="text-xs text-gray-600 font-bold">CALLS TODAY</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-green-600">{agent.success}%</div>
              <div className="text-xs text-gray-600 font-bold">SUCCESS RATE</div>
            </div>
          </div>
          
          {/* Success Rate Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-600">PERFORMANCE</span>
              <span className="text-xs font-bold">{agent.success}%</span>
            </div>
            <div className="w-full bg-gray-300 border border-black h-2">
              <div 
                className={cn("h-full", getPerformanceBarColor(agent.success))} 
                style={{ width: `${agent.success}%` }}
              />
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {displayMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-bold">{metric.label}</span>
                <span>{metric.value}</span>
              </div>
            ))}
          </div>

          {/* Quality Score */}
          <div className="p-2 bg-blue-50 border-2 border-black">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-blue-800">QUALITY SCORE</span>
              <span className="font-black text-sm text-blue-600">
                {Math.floor(agent.success * 0.9 + Math.random() * 10)}/100
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-1">Conversation quality rating</div>
          </div>
        </div>
      )}
    </div>
  );
}