'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  UilChart, 
  UilCheckCircle, 
  UilClock, 
  UilInfoCircle, 
  UilTimesCircle, 
  UilCircle 
} from '@tooni/iconscout-unicons-react';

interface CallOutcomeAnalyticsProps {
  totalCalls: number;
  successRate?: number;
}

export default function CallOutcomeAnalytics({ totalCalls }: CallOutcomeAnalyticsProps) {
  return (
    <div className="bg-orange-50 p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-orange-400">
          <UilChart className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">CALL OUTCOME DISTRIBUTION</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-green-400">
                <UilCheckCircle className="h-3 w-3 text-black" />
              </Button>
              <span className="font-black text-sm">DEMO SCHEDULED</span>
            </div>
            <span className="font-black text-green-600">32%</span>
          </div>
          <div className="w-full bg-gray-300 border-2 border-black h-6">
            <div className="h-full bg-green-400 flex items-center justify-end pr-3" style={{ width: '32%' }}>
              <span className="text-xs font-black text-black">{Math.floor(totalCalls * 0.32)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-blue-400">
                <UilClock className="h-3 w-3 text-white" />
              </Button>
              <span className="font-black text-sm">FOLLOW-UP NEEDED</span>
            </div>
            <span className="font-black text-blue-600">25%</span>
          </div>
          <div className="w-full bg-gray-300 border-2 border-black h-6">
            <div className="h-full bg-blue-400 flex items-center justify-end pr-3" style={{ width: '25%' }}>
              <span className="text-xs font-black text-white">{Math.floor(totalCalls * 0.25)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-yellow-400">
                <UilInfoCircle className="h-3 w-3 text-black" />
              </Button>
              <span className="font-black text-sm">INFO PROVIDED</span>
            </div>
            <span className="font-black text-yellow-600">18%</span>
          </div>
          <div className="w-full bg-gray-300 border-2 border-black h-6">
            <div className="h-full bg-yellow-400 flex items-center justify-end pr-3" style={{ width: '18%' }}>
              <span className="text-xs font-black text-black">{Math.floor(totalCalls * 0.18)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-red-400">
                <UilTimesCircle className="h-3 w-3 text-white" />
              </Button>
              <span className="font-black text-sm">NOT INTERESTED</span>
            </div>
            <span className="font-black text-red-600">15%</span>
          </div>
          <div className="w-full bg-gray-300 border-2 border-black h-6">
            <div className="h-full bg-red-400 flex items-center justify-end pr-3" style={{ width: '15%' }}>
              <span className="text-xs font-black text-white">{Math.floor(totalCalls * 0.15)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Button variant="subheader" size="icon" className="bg-gray-400">
                <UilCircle className="h-3 w-3 text-white" />
              </Button>
              <span className="font-black text-sm">NO ANSWER</span>
            </div>
            <span className="font-black text-gray-600">10%</span>
          </div>
          <div className="w-full bg-gray-300 border-2 border-black h-6">
            <div className="h-full bg-gray-400 flex items-center justify-end pr-3" style={{ width: '10%' }}>
              <span className="text-xs font-black text-white">{Math.floor(totalCalls * 0.10)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Trends Over Time */}
      <div className="mt-6 bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-orange-400">
            <UilChart className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">SUCCESS RATE TRENDS (LAST 30 DAYS)</div>
        </div>
        <div className="bg-gray-50 border-2 border-black p-3">
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 30 }, (_, i) => {
              const successRate = 65 + Math.sin(i * 0.2) * 10 + Math.random() * 8;
              const normalizedHeight = Math.max((successRate - 50) / 50 * 100, 10);
              const color = successRate > 80 ? 'bg-green-400' : successRate > 70 ? 'bg-blue-400' : successRate > 60 ? 'bg-yellow-400' : 'bg-red-400';
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full border-r border-black last:border-r-0 ${color} relative group cursor-pointer`}
                    style={{ height: `${normalizedHeight}%` }}
                    title={`${30 - i} days ago: ${successRate.toFixed(1)}% success rate`}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 bg-black text-white px-1 py-0.5 rounded whitespace-nowrap">
                      {successRate.toFixed(0)}%
                    </div>
                  </div>
                  {i % 7 === 0 && (
                    <div className="text-xs font-bold text-gray-600 mt-1">
                      {i === 0 ? 'Today' : `${30 - i}d`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="font-bold text-gray-600">30 days ago</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 border border-black"></div>
                <span>80%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 border border-black"></div>
                <span>70-80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 border border-black"></div>
                <span>60-70%</span>
              </div>
            </div>
            <span className="font-bold text-gray-600">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}