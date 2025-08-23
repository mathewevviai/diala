'use client';

import React from 'react';

interface PlatformInsightsProps {
  swarmData: any;
  swarmDetails: any;
}

export default function PlatformInsights({ swarmData, swarmDetails }: PlatformInsightsProps) {
  return (
    <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
      <h3 className="font-black uppercase text-sm mb-4 text-gray-600">PLATFORM INSIGHTS</h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-green-50 border-2 border-green-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-green-400 border border-black"></div>
            <span className="font-bold text-sm text-green-800">OPTIMAL PERFORMANCE</span>
          </div>
          <p className="text-xs text-green-700">Swarm is operating at 96% efficiency with consistent quality scores above platform average.</p>
        </div>
        
        <div className="p-3 bg-blue-50 border-2 border-blue-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-blue-400 border border-black"></div>
            <span className="font-bold text-sm text-blue-800">CONVERSATION QUALITY</span>
          </div>
          <p className="text-xs text-blue-700">Agent responses maintain natural flow with 91% adherence to conversation guidelines.</p>
        </div>
        
        <div className="p-3 bg-purple-50 border-2 border-purple-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-purple-400 border border-black"></div>
            <span className="font-bold text-sm text-purple-800">SCALING RECOMMENDATION</span>
          </div>
          <p className="text-xs text-purple-700">Performance metrics indicate readiness for 2x agent scaling during peak hours.</p>
        </div>
        
        <div className="p-3 bg-yellow-50 border-2 border-yellow-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 border border-black"></div>
            <span className="font-bold text-sm text-yellow-800">OPTIMIZATION OPPORTUNITY</span>
          </div>
          <p className="text-xs text-yellow-700">Consider adjusting script timing during objection handling phase for improved conversion.</p>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="mt-4 p-3 bg-gray-50 border-2 border-black">
        <div className="font-bold text-sm mb-2">Today's Platform Metrics</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="font-bold">Calls Processed:</span>
            <span>{swarmDetails.performance.callsToday}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Quality Score:</span>
            <span className="text-green-600 font-bold">{swarmDetails.performance.qualityScore}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Objectives Met:</span>
            <span className="text-blue-600 font-bold">{Math.floor(swarmData.totalCalls * 0.32)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Platform Uptime:</span>
            <span className="text-green-600 font-bold">99.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
}