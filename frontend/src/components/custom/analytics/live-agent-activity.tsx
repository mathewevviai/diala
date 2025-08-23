'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UilCircle, UilChart, UilPhone, UilMicrophone, UilUsers, UilBolt, UilEye, UilPlay } from '@tooni/iconscout-unicons-react';

interface ActivityItem {
  id: string;
  agentName: string;
  action: string;
  target: string;
  status: {
    text: string;
    color: string;
    bgColor: string;
  };
  timestamp: string;
  pulseColor: string;
}

interface LiveAgentActivityProps {
  title?: string;
  bgColor?: string;
  activities?: ActivityItem[];
  maxHeight?: string;
  showTimestamp?: boolean;
}

export default function LiveAgentActivity({
  title = "LIVE AGENT ACTIVITY",
  bgColor = "bg-white",
  activities,
  maxHeight = "max-h-64",
  showTimestamp = true
}: LiveAgentActivityProps) {
  
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      agentName: 'AI Agent Alpha',
      action: 'successfully booked demo with',
      target: 'Tech Solutions Inc',
      status: {
        text: 'DEMO SCHEDULED',
        color: 'text-black',
        bgColor: 'bg-green-400'
      },
      timestamp: '30s ago',
      pulseColor: 'bg-green-500'
    },
    {
      id: '2',
      agentName: 'AI Agent Beta',
      action: 'handling objection from',
      target: 'Marketing Director',
      status: {
        text: 'NEGOTIATING',
        color: 'text-white',
        bgColor: 'bg-blue-400'
      },
      timestamp: '1m ago',
      pulseColor: 'bg-blue-500'
    },
    {
      id: '3',
      agentName: 'AI Agent Gamma',
      action: 'completed discovery call with',
      target: 'Startup Founder',
      status: {
        text: 'FOLLOW-UP REQUIRED',
        color: 'text-black',
        bgColor: 'bg-yellow-400'
      },
      timestamp: '2m ago',
      pulseColor: 'bg-yellow-500'
    },
    {
      id: '4',
      agentName: 'AI Agent Delta',
      action: 'escalated technical question to',
      target: 'Sales Engineer',
      status: {
        text: 'ESCALATED',
        color: 'text-white',
        bgColor: 'bg-purple-400'
      },
      timestamp: '3m ago',
      pulseColor: 'bg-purple-500'
    },
    {
      id: '5',
      agentName: 'AI Agent Alpha',
      action: 'left voicemail for',
      target: 'Enterprise Client',
      status: {
        text: 'AWAITING CALLBACK',
        color: 'text-white',
        bgColor: 'bg-orange-400'
      },
      timestamp: '5m ago',
      pulseColor: 'bg-orange-500'
    }
  ];

  const displayActivities = activities || defaultActivities;

  return (
    <div className={`${bgColor} p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="header" size="header">
          <UilChart className="h-4 w-4" />
        </Button>
        <h3 className="font-black uppercase text-sm text-gray-600">{title}</h3>
      </div>
      <div className={`space-y-3 ${maxHeight} overflow-y-auto`}>
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
            <div className={`w-2 h-2 ${activity.pulseColor} rounded-full animate-pulse`}></div>
            <span className="font-bold text-sm">{activity.agentName}</span>
            <span className="text-sm">{activity.action}</span>
            <span className="font-bold text-sm">{activity.target}</span>
            <Badge className={`${activity.status.bgColor} ${activity.status.color} border border-black font-bold uppercase text-xs`}>
              {activity.status.text}
            </Badge>
            {showTimestamp && (
              <span className="text-xs text-gray-600 ml-auto">{activity.timestamp}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}