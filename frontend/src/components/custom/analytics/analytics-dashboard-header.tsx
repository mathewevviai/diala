'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UilChart } from '@tooni/iconscout-unicons-react';

interface MetricCard {
  value: string | number;
  label: string;
  description: string;
  color: string;
  progressWidth: string;
}

interface AnalyticsDashboardHeaderProps {
  totalCalls: number;
  title?: string;
  subtitle?: string;
  bgColor?: string;
  cards?: MetricCard[];
}

export default function AnalyticsDashboardHeader({ 
  totalCalls, 
  title = "ANALYTICS DASHBOARD", 
  subtitle = "Advanced Swarm Intelligence",
  bgColor = "bg-purple-400",
  cards
}: AnalyticsDashboardHeaderProps) {
  
  const defaultCards: MetricCard[] = [
    {
      value: Math.floor(totalCalls * 0.32),
      label: "OBJECTIVES MET",
      description: "↗ +12% vs last week",
      color: "text-green-600",
      progressWidth: "85%"
    },
    {
      value: Math.floor(totalCalls * 0.68),
      label: "QUALITY CALLS",
      description: "96% pass rate",
      color: "text-blue-600",
      progressWidth: "96%"
    },
    {
      value: "4.8/5",
      label: "AVG RATING",
      description: "Customer feedback",
      color: "text-purple-600",
      progressWidth: "96%"
    },
    {
      value: "94%",
      label: "EFFICIENCY",
      description: "↗ Above target",
      color: "text-orange-600",
      progressWidth: "94%"
    }
  ];

  const displayCards = cards || defaultCards;
  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="header" size="header" className="bg-white">
            <UilChart className="h-6 w-6 text-black" />
          </Button>
          <div>
            <h3 className="font-black uppercase text-xl text-white">{title}</h3>
            <div className="text-white/80 font-bold text-sm">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-black text-white">LIVE DATA • {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className={`grid gap-6 ${displayCards.length <= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'}`}>
        {displayCards.map((card, index) => (
          <div key={index} className="bg-white/90 backdrop-blur border-2 border-black p-4 text-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
            <div className={`text-4xl font-black ${card.color} mb-2`}>{card.value}</div>
            <div className="text-sm font-bold text-gray-700 uppercase">{card.label}</div>
            <div className={`text-sm ${card.color} font-bold`}>{card.description}</div>
            <div className="w-full bg-gray-300 border border-black h-2 mt-3">
              <div className={`h-full ${card.color.replace('text-', 'bg-').replace('-600', '-400')}`} style={{ width: card.progressWidth }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}