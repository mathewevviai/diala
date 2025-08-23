'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UilUsersAlt, UilChart, UilStar } from '@tooni/iconscout-unicons-react';

interface QualityMetric {
  label: string;
  value: number;
  percentage: number;
  color: string;
  description: string;
}

interface ConversationQualityAnalysisProps {
  title?: string;
  bgColor?: string;
  iconBgColor?: string;
  metrics?: QualityMetric[];
}

export default function ConversationQualityAnalysis({
  title = "CONVERSATION QUALITY METRICS",
  bgColor = "bg-purple-50",
  iconBgColor = "bg-purple-400",
  metrics
}: ConversationQualityAnalysisProps) {
  
  const defaultMetrics: QualityMetric[] = [
    {
      label: "SCRIPT ADHERENCE",
      value: 96,
      percentage: 96,
      color: "green",
      description: "EXCELLENT"
    },
    {
      label: "OBJECTIVE COMPLETION",
      value: 84,
      percentage: 84,
      color: "blue",
      description: "STRONG"
    },
    {
      label: "CONVERSATION FLOW",
      value: 91,
      percentage: 91,
      color: "purple",
      description: "SMOOTH"
    },
    {
      label: "RESPONSE QUALITY",
      value: 88,
      percentage: 88,
      color: "orange",
      description: "GOOD"
    }
  ];

  const displayMetrics = metrics || defaultMetrics;
  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className={iconBgColor}>
          <UilUsersAlt className="h-5 w-5 text-white" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">{title}</h3>
      </div>
      
      <div className="space-y-5">
        {displayMetrics.map((metric, index) => (
          <div key={index} className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 bg-${metric.color}-400 border border-black`}></div>
                <span className="font-black text-sm">{metric.label}</span>
              </div>
              <span className={`text-lg font-black text-${metric.color}-600`}>{metric.value}%</span>
            </div>
            <div className="w-full bg-gray-300 border-2 border-black h-4">
              <div 
                className={`h-full bg-${metric.color}-400 flex items-center justify-end pr-2`} 
                style={{ width: `${metric.percentage}%` }}
              >
                <span className={`text-xs font-bold ${metric.color === 'orange' ? 'text-black' : 'text-white'}`}>
                  {metric.description}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quality Trends Over Time */}
      <div className="mt-6 p-4 bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-purple-400">
            <UilChart className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">QUALITY TRENDS (LAST 14 DAYS)</div>
        </div>
        <div className="bg-gray-50 border-2 border-black p-3">
          <div className="flex items-end gap-1 h-20">
            {Array.from({ length: 14 }, (_, i) => {
              const qualityScore = 75 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
              const normalizedHeight = (qualityScore - 60) / 40 * 100;
              const color = qualityScore > 90 ? 'bg-green-400' : qualityScore > 80 ? 'bg-blue-400' : qualityScore > 70 ? 'bg-yellow-400' : 'bg-red-400';
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full border border-black ${color} relative group cursor-pointer`}
                    style={{ height: `${Math.max(normalizedHeight, 10)}%` }}
                    title={`Day ${i + 1}: ${qualityScore.toFixed(1)}%`}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 bg-black text-white px-1 py-0.5 rounded">
                      {qualityScore.toFixed(0)}%
                    </div>
                  </div>
                  {i % 3 === 0 && (
                    <div className="text-xs font-bold text-gray-600 mt-1">
                      {Math.floor((14 - i) / 7) === 0 ? 'Today' : `${14 - i}d`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="font-bold text-gray-600">14 days ago</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 border border-black"></div>
                <span>90%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 border border-black"></div>
                <span>80-89%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 border border-black"></div>
                <span>70-79%</span>
              </div>
            </div>
            <span className="font-bold text-gray-600">Today</span>
          </div>
        </div>
      </div>

      {/* Enhanced Quality Score Distribution */}
      <div className="mt-6 p-4 bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-yellow-400">
            <UilChart className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">QUALITY SCORE DISTRIBUTION</div>
        </div>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div>
            <div className="h-12 bg-red-400 border-2 border-black flex items-end shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <div className="w-full bg-red-500 h-3"></div>
            </div>
            <div className="text-xs font-black mt-2 flex items-center justify-center gap-1">1-2 <UilStar className="h-3 w-3" /></div>
            <div className="text-xs font-bold text-red-600">2%</div>
          </div>
          <div>
            <div className="h-12 bg-yellow-400 border-2 border-black flex items-end shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <div className="w-full bg-yellow-500 h-4"></div>
            </div>
            <div className="text-xs font-black mt-2 flex items-center justify-center gap-1">3-4 <UilStar className="h-3 w-3" /></div>
            <div className="text-xs font-bold text-yellow-600">8%</div>
          </div>
          <div>
            <div className="h-12 bg-blue-400 border-2 border-black flex items-end shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <div className="w-full bg-blue-500 h-6"></div>
            </div>
            <div className="text-xs font-black mt-2 flex items-center justify-center gap-1">5-6 <UilStar className="h-3 w-3" /></div>
            <div className="text-xs font-bold text-blue-600">22%</div>
          </div>
          <div>
            <div className="h-12 bg-green-400 border-2 border-black flex items-end shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <div className="w-full bg-green-500 h-8"></div>
            </div>
            <div className="text-xs font-black mt-2 flex items-center justify-center gap-1">7-8 <UilStar className="h-3 w-3" /></div>
            <div className="text-xs font-bold text-green-600">38%</div>
          </div>
          <div>
            <div className="h-12 bg-purple-400 border-2 border-black flex items-end shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <div className="w-full bg-purple-500 h-9"></div>
            </div>
            <div className="text-xs font-black mt-2 flex items-center justify-center gap-1">9-10 <UilStar className="h-3 w-3" /></div>
            <div className="text-xs font-bold text-purple-600">30%</div>
          </div>
        </div>
      </div>
    </div>
  );
}