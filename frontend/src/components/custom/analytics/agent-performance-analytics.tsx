'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  UilUsersAlt, 
  UilStar, 
  UilCheckCircle, 
  UilExclamationTriangle,
  UilChart
} from '@tooni/iconscout-unicons-react';

interface Agent {
  id: string;
  name: string;
  status: string;
  calls: number;
  success: number;
  currentCall: string | null;
}

interface AgentPerformanceAnalyticsProps {
  agents: Agent[];
  swarmData?: any;
}

export default function AgentPerformanceAnalytics({ agents }: AgentPerformanceAnalyticsProps) {
  return (
    <div className="bg-indigo-50 p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-indigo-400">
          <UilUsersAlt className="h-5 w-5 text-white" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">AGENT PERFORMANCE ANALYTICS</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <div key={agent.id} className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 border-3 border-black flex items-center justify-center font-black text-white text-sm",
                  index === 0 ? "bg-yellow-400" : index === 1 ? "bg-blue-400" : "bg-purple-400"
                )}>
                  AI
                </div>
                <div>
                  <div className="font-black text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-600">Agent ID: {agent.id}</div>
                </div>
              </div>
              <Badge className={cn(
                "border-2 border-black font-bold uppercase text-xs shadow-[2px_2px_0_rgba(0,0,0,1)]",
                agent.success >= 90 ? "bg-green-400 text-black" :
                agent.success >= 80 ? "bg-yellow-400 text-black" :
                "bg-red-400 text-white"
              )}>
                {agent.success >= 90 ? (
                  <><UilStar className="h-3 w-3 inline mr-1" /> EXCELLENT</>
                ) : agent.success >= 80 ? (
                  <><UilCheckCircle className="h-3 w-3 inline mr-1" /> GOOD</>
                ) : (
                  <><UilExclamationTriangle className="h-3 w-3 inline mr-1" /> IMPROVING</>
                )}
              </Badge>
            </div>
            
            {/* Performance metrics with enhanced design */}
            <div className="space-y-4">
              <div className="bg-gray-50 border-2 border-black p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-black text-blue-600">{agent.calls}</div>
                    <div className="text-xs font-bold text-gray-600">CALLS TODAY</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-green-600">{agent.success}%</div>
                    <div className="text-xs font-bold text-gray-600">SUCCESS RATE</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 border border-black">
                  <span className="text-xs font-black">AVG CALL TIME:</span>
                  <span className="text-xs font-black text-blue-600">{Math.floor(Math.random() * 2) + 2}m {Math.floor(Math.random() * 60)}s</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 border border-black">
                  <span className="text-xs font-black">QUALITY SCORE:</span>
                  <span className="text-xs font-black text-purple-600">{Math.floor(Math.random() * 15) + 85}/100</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 border border-black">
                  <span className="text-xs font-black">DEMOS BOOKED:</span>
                  <span className="text-xs font-black text-orange-600">{Math.floor(agent.calls * (agent.success / 100) * 0.8)}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Performance trend */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-cyan-400 border border-black"></div>
                <div className="text-sm font-black">7-DAY PERFORMANCE TREND</div>
              </div>
              <div className="bg-gray-50 border-2 border-black p-2">
                <div className="flex items-end gap-1 h-12">
                  {Array.from({ length: 7 }, (_, i) => {
                    const height = Math.random() * 80 + 20;
                    const isToday = i === 6;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className={cn(
                            "w-full border border-black",
                            isToday ? "bg-green-400" : "bg-cyan-400"
                          )}
                          style={{ height: `${height}%` }}
                        ></div>
                        {isToday && (
                          <div className="text-xs font-bold text-green-600 mt-1">
                            <UilChart className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mt-2">
                  <span>MON</span>
                  <span>TODAY</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}