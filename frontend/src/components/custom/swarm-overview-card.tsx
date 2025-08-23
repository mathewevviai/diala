'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SwarmConfig } from '@/types/calls';
import {
  UilRobot,
  UilPhone,
  UilChart,
  UilCheckCircle,
  UilClock,
  UilSetting,
  UilLayerGroup
} from '@tooni/iconscout-unicons-react';

interface SwarmOverviewCardProps {
  swarm: SwarmConfig;
  isSelected: boolean;
  onClick: () => void;
  onConfigure: () => void;
}

const getSwarmTypeColor = (name: string) => {
  if (name.toLowerCase().includes('sales')) return 'purple';
  if (name.toLowerCase().includes('support')) return 'green';
  if (name.toLowerCase().includes('discovery')) return 'orange';
  return 'pink';
};

export default function SwarmOverviewCard({ 
  swarm, 
  isSelected, 
  onClick,
  onConfigure 
}: SwarmOverviewCardProps) {
  const activePercentage = (swarm.activeAgents / swarm.agents.length) * 100;
  const swarmColor = getSwarmTypeColor(swarm.name);

  return (
    <Card 
      className={cn(
        "border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all cursor-pointer hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transform hover:translate-x-[-2px] hover:translate-y-[-2px]",
        isSelected && "shadow-[6px_6px_0_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px] ring-4 ring-[rgb(0,82,255)]"
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(
        "border-b-4 border-black relative",
        swarmColor === 'purple' && "bg-purple-400",
        swarmColor === 'green' && "bg-green-400", 
        swarmColor === 'orange' && "bg-orange-400",
        swarmColor === 'pink' && "bg-pink-400"
      )}>
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant="neutral"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
            className="bg-white border-2 border-black hover:bg-gray-50 p-2 w-8 h-8"
          >
            <UilSetting className="w-4 h-4 text-black" />
          </Button>
        </div>
        
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 border-4 border-black flex items-center justify-center",
            swarmColor === 'purple' && "bg-purple-600",
            swarmColor === 'green' && "bg-green-600", 
            swarmColor === 'orange' && "bg-orange-600",
            swarmColor === 'pink' && "bg-pink-600"
          )}>
            <UilLayerGroup className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-black uppercase text-white leading-tight">
              {swarm.name}
            </CardTitle>
            <p className="text-white/90 text-sm mt-1 line-clamp-2">
              {swarm.description}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Badge className={cn(
            "border-2 border-black font-bold uppercase text-xs",
            swarmColor === 'purple' && "bg-purple-600 text-white",
            swarmColor === 'green' && "bg-green-600 text-white", 
            swarmColor === 'orange' && "bg-orange-600 text-white",
            swarmColor === 'pink' && "bg-pink-600 text-white"
          )}>
            {swarm.activeAgents}/{swarm.agents.length} ACTIVE
          </Badge>
          <Badge className={cn(
            "border-2 border-black font-bold uppercase text-xs",
            swarmColor === 'purple' && "bg-purple-800 text-white",
            swarmColor === 'green' && "bg-green-800 text-white", 
            swarmColor === 'orange' && "bg-orange-800 text-white",
            swarmColor === 'pink' && "bg-pink-800 text-white"
          )}>
            {swarm.totalCalls} CALLS
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 bg-gradient-to-br from-white to-gray-50">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white border-2 border-black p-3 text-center">
            <div className="w-8 h-8 bg-green-400 border-2 border-black flex items-center justify-center mx-auto mb-2">
              <UilCheckCircle className="w-4 h-4 text-black" />
            </div>
            <p className="text-xs font-bold uppercase text-gray-600">Convert</p>
            <p className="text-xl font-black">{swarm.performance.conversionRate}%</p>
          </div>
          
          <div className="bg-white border-2 border-black p-3 text-center">
            <div className="w-8 h-8 bg-orange-400 border-2 border-black flex items-center justify-center mx-auto mb-2">
              <UilChart className="w-4 h-4 text-black" />
            </div>
            <p className="text-xs font-bold uppercase text-gray-600">Sentiment</p>
            <p className="text-xl font-black">{swarm.performance.avgSentiment}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold uppercase text-gray-600 flex items-center gap-1">
              <UilClock className="w-3 h-3" />
              Talk Time
            </span>
            <span className="font-black">{swarm.performance.totalTalkTime}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold uppercase text-gray-600 flex items-center gap-1">
              <UilRobot className="w-3 h-3" />
              Agents
            </span>
            <span className="font-black">{swarm.agents.length} total</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="flex flex-wrap gap-1">
            {swarm.agents.slice(0, 3).map((agent) => (
              <div 
                key={agent.id}
                className={cn(
                  "w-2 h-2 border border-black",
                  agent.status === 'active' && "bg-green-400",
                  agent.status === 'idle' && "bg-gray-400",
                  agent.status === 'processing' && "bg-yellow-400"
                )}
              />
            ))}
            {swarm.agents.length > 3 && (
              <span className="text-xs font-bold text-gray-500 ml-1">
                +{swarm.agents.length - 3}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}