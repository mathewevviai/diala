'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  status: string;
  calls: number;
  success: number;
  currentCall?: string | null;
}

interface DailyPerformanceLeaderboardProps {
  title?: string;
  bgColor?: string;
  badgeText?: string;
  badgeColor?: string;
  agents: Agent[];
  sortBy?: 'success' | 'calls';
  maxItems?: number;
}

export default function DailyPerformanceLeaderboard({
  title = "DAILY PERFORMANCE LEADERBOARD",
  bgColor = "bg-white",
  badgeText = "LIVE RANKINGS",
  badgeColor = "bg-purple-400 text-white",
  agents,
  sortBy = 'success',
  maxItems = 10
}: DailyPerformanceLeaderboardProps) {
  
  const sortedAgents = agents
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, maxItems);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: "bg-yellow-50",
          badge: "bg-yellow-400 text-black"
        };
      case 1:
        return {
          bg: "bg-gray-50",
          badge: "bg-gray-400 text-white"
        };
      default:
        return {
          bg: "bg-gray-50",
          badge: "bg-orange-400 text-white"
        };
    }
  };

  return (
    <div className={`${bgColor} p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black uppercase text-sm text-gray-600">{title}</h3>
        <Badge className={`${badgeColor} border border-black font-bold uppercase text-xs`}>
          {badgeText}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {sortedAgents.map((agent, index) => {
          const rankStyle = getRankStyle(index);
          return (
            <div key={agent.id} className={cn(
              "p-4 border-2 border-black relative",
              rankStyle.bg
            )}>
              {/* Rank Badge */}
              <div className="absolute -top-2 -left-2">
                <div className={cn(
                  "w-10 h-10 border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0_rgba(0,0,0,1)]",
                  rankStyle.badge
                )}>
                  #{index + 1}
                </div>
              </div>

              {/* Agent Info */}
              <div className="flex items-center justify-between ml-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-400 border-2 border-black flex items-center justify-center font-black text-white text-xs">
                    AI
                  </div>
                  <div>
                    <div className="font-black text-sm">{agent.name}</div>
                    <div className="text-xs text-gray-600">Agent ID: {agent.id}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-black text-blue-600">{agent.calls}</div>
                    <div className="text-xs text-gray-600 font-bold">CALLS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-green-600">{agent.success}%</div>
                    <div className="text-xs text-gray-600 font-bold">SUCCESS</div>
                  </div>
                  <Badge className={cn(
                    "border border-black font-bold uppercase text-xs",
                    agent.status === 'active' ? "bg-green-400 text-black" : 
                    agent.status === 'paused' ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"
                  )}>
                    {agent.status}
                  </Badge>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-3 ml-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-600">PERFORMANCE</span>
                  <span className="text-xs font-bold">{agent.success}%</span>
                </div>
                <div className="w-full bg-gray-300 border border-black h-2">
                  <div 
                    className={cn(
                      "h-full", 
                      agent.success >= 90 ? "bg-green-400" : 
                      agent.success >= 80 ? "bg-yellow-400" : "bg-red-400"
                    )} 
                    style={{ width: `${agent.success}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}