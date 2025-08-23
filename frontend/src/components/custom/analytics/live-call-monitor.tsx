'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UilChart } from '@tooni/iconscout-unicons-react';

interface LiveCallMonitorProps {
  agents?: any[];
  swarmData?: any;
}

export default function LiveCallMonitor({ agents, swarmData }: LiveCallMonitorProps) {
  return (
    <div className="bg-green-50 p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-green-400">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">LIVE CALL MONITOR</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="font-black text-sm">AI Agent Alpha → TechCorp CEO</div>
              <div className="text-xs text-gray-600">Discovery phase • 2m 34s elapsed</div>
            </div>
            <div className="bg-green-400 border-2 border-black px-2 py-1 text-xs font-black">LIVE</div>
          </div>
          <div className="w-full bg-gray-300 border border-black h-2">
            <div className="h-full bg-green-400 animate-pulse" style={{ width: '45%' }}></div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="font-black text-sm">AI Agent Beta → Marketing Dir</div>
              <div className="text-xs text-gray-600">Objection handling • 4m 12s elapsed</div>
            </div>
            <div className="bg-blue-400 border-2 border-black px-2 py-1 text-xs font-black text-white">NEGO</div>
          </div>
          <div className="w-full bg-gray-300 border border-black h-2">
            <div className="h-full bg-blue-400 animate-pulse" style={{ width: '72%' }}></div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="font-black text-sm">AI Agent Gamma → Enterprise VP</div>
              <div className="text-xs text-gray-600">Closing phase • 6m 45s elapsed</div>
            </div>
            <div className="bg-purple-400 border-2 border-black px-2 py-1 text-xs font-black text-white">CLOSE</div>
          </div>
          <div className="w-full bg-gray-300 border border-black h-2">
            <div className="h-full bg-purple-400 animate-pulse" style={{ width: '91%' }}></div>
          </div>
        </div>
      </div>

      {/* Real-time Activity Timeline */}
      <div className="mt-6 bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-green-400">
            <UilChart className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">ACTIVITY TIMELINE (LAST 60 MINUTES)</div>
        </div>
        <div className="bg-gray-50 border-2 border-black p-3">
          <div className="flex items-end gap-0.5 h-16">
            {Array.from({ length: 60 }, (_, i) => {
              const activity = Math.sin(i * 0.1) * 30 + 40 + Math.random() * 20;
              const normalizedHeight = Math.max(activity / 100 * 100, 5);
              const color = activity > 70 ? 'bg-green-400' : activity > 50 ? 'bg-blue-400' : activity > 30 ? 'bg-yellow-400' : 'bg-gray-400';
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full border-r border-black last:border-r-0 ${color}`}
                    style={{ height: `${normalizedHeight}%` }}
                    title={`${60 - i} min ago: ${activity.toFixed(0)}% activity`}
                  ></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="font-bold text-gray-600">60m ago</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 border border-black"></div>
                <span>High Activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 border border-black"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 border border-black"></div>
                <span>Low</span>
              </div>
            </div>
            <span className="font-bold text-gray-600">Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}