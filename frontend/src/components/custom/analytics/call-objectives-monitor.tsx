'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UilBullseye, UilCheckCircle, UilInfoCircle, UilLightbulb } from '@tooni/iconscout-unicons-react';

interface CallData {
  callId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  status: string;
  duration: number;
  campaignName: string;
  currentPhase: string;
  isRecording: boolean;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
}

interface NextAction {
  id: string;
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface CallObjectivesMonitorProps {
  title?: string;
  bgColor?: string;
  callData?: CallData;
  objectives?: Objective[];
  nextActions?: NextAction[];
}

export default function CallObjectivesMonitor({
  title = "CALL OBJECTIVES & PROGRESS",
  bgColor = "bg-blue-50",
  callData,
  objectives,
  nextActions
}: CallObjectivesMonitorProps) {
  
  const defaultObjectives: Objective[] = [
    {
      id: '1',
      title: 'Introduce AI voice solution benefits',
      description: 'Present core value proposition and competitive advantages',
      status: 'completed',
      progress: 100
    },
    {
      id: '2',
      title: 'Address cost concerns',
      description: 'Discuss ROI and pricing structure',
      status: 'in-progress',
      progress: 65
    },
    {
      id: '3',
      title: 'Schedule product demonstration',
      description: 'Book demo meeting with decision makers',
      status: 'pending',
      progress: 0
    },
    {
      id: '4',
      title: 'Qualify decision-making authority',
      description: 'Identify who makes the final purchasing decision',
      status: 'pending',
      progress: 0
    }
  ];

  const defaultNextActions: NextAction[] = [
    {
      id: '1',
      action: 'Provide ROI case studies',
      description: 'Share specific examples from similar companies',
      priority: 'high'
    },
    {
      id: '2',
      action: 'Address technical implementation questions',
      description: 'Explain integration process and timeline',
      priority: 'medium'
    },
    {
      id: '3',
      action: 'Propose trial period',
      description: 'Offer 30-day pilot program to reduce risk',
      priority: 'medium'
    }
  ];

  const displayObjectives = objectives || defaultObjectives;
  const displayNextActions = nextActions || defaultNextActions;
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400 text-black';
      case 'paused': return 'bg-yellow-400 text-black';
      case 'stopped': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-blue-400">
          <UilBullseye className="h-5 w-5 text-white" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">{title}</h3>
      </div>
      
      {/* Campaign Information */}
      {callData && (
        <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="subheader" size="icon" className="bg-purple-400">
              <UilInfoCircle className="h-3 w-3 text-white" />
            </Button>
            <div className="font-black text-sm">LIVE CAMPAIGN DETAILS</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-bold text-sm">Campaign ID:</span>
                <span className="text-sm">{callData.callId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-sm">AI Agent:</span>
                <span className="text-sm">{callData.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-sm">Prospect:</span>
                <span className="text-sm">{callData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-sm">Phone:</span>
                <span className="text-sm">{callData.customerPhone}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-bold text-sm">Status:</span>
                <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusColor(callData.status))}>
                  {callData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-sm">Duration:</span>
                <span className="font-black text-lg text-green-600">{formatDuration(callData.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-sm">Phase:</span>
                <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">
                  {callData.currentPhase}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-sm">Recording:</span>
                <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", callData.isRecording ? "bg-red-400 text-white" : "bg-gray-400 text-black")}>
                  {callData.isRecording ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Objectives Progress */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-green-400">
            <UilCheckCircle className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">CAMPAIGN OBJECTIVES PROGRESS</div>
        </div>
        <div className="space-y-4">
          {displayObjectives.map((objective, index) => (
            <div key={objective.id} className="flex items-center gap-4 p-3 bg-gray-50 border-2 border-black">
              <div className={cn(
                "w-8 h-8 border-2 border-black flex items-center justify-center text-white font-black text-xs flex-shrink-0",
                objective.status === 'completed' ? "bg-green-400" : 
                objective.status === 'in-progress' ? "bg-yellow-400 text-black" : "bg-gray-400"
              )}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{objective.title}</div>
                <div className="text-xs text-gray-600 mt-1">{objective.description}</div>
                <div className="w-full bg-gray-300 border border-black h-2 mt-2">
                  <div 
                    className={cn(
                      "h-full",
                      objective.status === 'completed' ? "bg-green-400" : 
                      objective.status === 'in-progress' ? "bg-yellow-400" : "bg-gray-400"
                    )} 
                    style={{ width: `${objective.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 border border-black text-xs font-bold uppercase",
                objective.status === 'completed' ? "bg-green-400 text-black" : 
                objective.status === 'in-progress' ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"
              )}>
                {objective.status === 'completed' ? "DONE" : 
                 objective.status === 'in-progress' ? "ACTIVE" : "QUEUE"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggested Next Actions */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-orange-400">
            <UilLightbulb className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">AI SUGGESTED NEXT ACTIONS</div>
        </div>
        <div className="space-y-3">
          {displayNextActions.map((action, index) => (
            <div key={action.id} className="flex items-start gap-3 p-3 border-2 border-gray-300 bg-blue-50">
              <div className="w-6 h-6 bg-blue-400 border-2 border-black flex items-center justify-center text-white font-black text-xs flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-800">{action.action}</div>
                <div className="text-xs text-gray-600 mt-1">{action.description}</div>
              </div>
              <div className={cn(
                "px-2 py-1 border border-black text-xs font-bold uppercase",
                action.priority === 'high' ? "bg-red-400 text-white" :
                action.priority === 'medium' ? "bg-yellow-400 text-black" : "bg-green-400 text-black"
              )}>
                {action.priority}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}