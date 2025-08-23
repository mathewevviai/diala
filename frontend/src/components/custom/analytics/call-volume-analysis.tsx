'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UilPhone, UilChart, UilStar } from '@tooni/iconscout-unicons-react';

interface CallVolumeAnalysisProps {
  callsToday: number;
  callsThisWeek: number;
}

export default function CallVolumeAnalysis({ callsToday, callsThisWeek }: CallVolumeAnalysisProps) {
  return (
    <div className="bg-cyan-50 p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-cyan-400">
          <UilPhone className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">CALL VOLUME INSIGHTS</h3>
      </div>
      
      {/* Hourly distribution */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-black text-lg text-gray-800">Peak Performance Hours</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-black">10AM-2PM OPTIMAL</span>
          </div>
        </div>
        <div className="relative">
          <div className="flex items-end gap-2 h-24 border-4 border-black p-3 bg-white shadow-[3px_3px_0_rgba(0,0,0,1)]">
            {Array.from({ length: 12 }, (_, i) => {
              const height = i >= 2 && i <= 6 ? 60 + Math.random() * 30 : 20 + Math.random() * 40;
              const isOptimal = i >= 2 && i <= 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full border-2 border-black ${isOptimal ? 'bg-green-400' : 'bg-blue-400'}`}
                    style={{ height: `${height}%` }}
                  ></div>
                  {isOptimal && <div className="text-xs font-bold text-green-600 mt-1">
                    <UilStar className="h-3 w-3" />
                  </div>}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-700 mt-2">
            <span>8AM</span>
            <span>12PM</span>
            <span>4PM</span>
            <span>8PM</span>
          </div>
        </div>
      </div>

      {/* Enhanced Daily trends */}
      <div className="space-y-4">
        <div className="bg-green-400 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-white">
                <UilChart className="h-4 w-4 text-black" />
              </Button>
              <div>
                <div className="font-black text-lg text-black">TODAY'S PERFORMANCE</div>
                <div className="text-sm font-bold text-black/80">{callsToday} calls completed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-black">+23%</div>
              <div className="text-sm font-bold text-black/80">vs yesterday</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-400 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-white">
                <UilChart className="h-4 w-4 text-black" />
              </Button>
              <div>
                <div className="font-black text-lg text-white">WEEKLY TREND</div>
                <div className="text-sm font-bold text-white/90">{callsThisWeek} calls this week</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">+8%</div>
              <div className="text-sm font-bold text-white/90">vs last week</div>
            </div>
          </div>
          {/* Weekly trend line chart */}
          <div className="bg-white border-2 border-black p-2">
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 7 }, (_, i) => {
                const baseHeight = 30;
                const variation = [10, 25, 35, 45, 55, 40, 50][i];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-white border-2 border-black relative"
                      style={{ height: `${baseHeight + variation}%` }}
                    >
                      <div className="absolute top-0 left-0 right-0 bg-blue-600 h-full"></div>
                    </div>
                    <div className="text-xs font-bold text-black mt-1">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}