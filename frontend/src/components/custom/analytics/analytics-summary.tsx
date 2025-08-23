'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UilBullseye, UilRocket, UilChart } from '@tooni/iconscout-unicons-react';

interface AnalyticsSummaryProps {
  swarmData: any;
  swarmDetails: any;
}

export default function AnalyticsSummary({ swarmData, swarmDetails }: AnalyticsSummaryProps) {
  return (
    <div className="bg-yellow-400 p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="header" size="header" className="bg-white">
          <UilBullseye className="h-6 w-6 text-black" />
        </Button>
        <div>
          <h3 className="font-black uppercase text-xl text-white">ANALYTICS SUMMARY</h3>
          <div className="text-white/80 font-bold text-sm">AI-Powered Insights & Recommendations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="subheader" size="icon" className="bg-green-400">
              <UilRocket className="h-4 w-4 text-black" />
            </Button>
            <div className="font-black text-sm">PERFORMANCE HIGHLIGHTS</div>
          </div>
          <div className="space-y-2 text-sm">
            <div>• {swarmData.successRate}% success rate (↗ +12%)</div>
            <div>• {swarmDetails.performance.callsToday} calls completed today</div>
            <div>• {swarmDetails.performance.appointmentsBooked} demos scheduled</div>
            <div>• 96% script adherence rate</div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="subheader" size="icon" className="bg-blue-400">
              <UilChart className="h-4 w-4 text-white" />
            </Button>
            <div className="font-black text-sm">OPTIMIZATION INSIGHTS</div>
          </div>
          <div className="space-y-2 text-sm">
            <div>• Peak hours: 10AM-2PM (+23% efficiency)</div>
            <div>• Optimal call length: 3-4 minutes</div>
            <div>• Best conversion: Tuesday-Thursday</div>
            <div>• Quality scores trending upward</div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="subheader" size="icon" className="bg-purple-400">
              <UilChart className="h-4 w-4 text-white" />
            </Button>
            <div className="font-black text-sm">NEXT ACTIONS</div>
          </div>
          <div className="space-y-2 text-sm">
            <div>• Scale to 5 agents during peak hours</div>
            <div>• Optimize objection handling script</div>
            <div>• Focus on enterprise prospects</div>
            <div>• Implement advanced analytics</div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/20 backdrop-blur border-2 border-white/30 rounded-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            <span className="font-black text-white">REAL-TIME AI OPTIMIZATION ACTIVE</span>
          </div>
          <div className="text-white font-black text-sm">
            Next optimization: {Math.floor(Math.random() * 5) + 1} minutes
          </div>
        </div>
      </div>
    </div>
  );
}