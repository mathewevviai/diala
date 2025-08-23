'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/custom/stat-card';
import AgentCard from '@/components/custom/analytics/agent-card';
import DailyPerformanceLeaderboard from '@/components/custom/analytics/daily-performance-leaderboard';
import AnalyticsSummary from '@/components/custom/analytics/analytics-summary';
import { 
  UilPhone,
  UilMicrophone,
  UilClock,
  UilPlay,
  UilRobot,
  UilCheckCircle,
} from '@tooni/iconscout-unicons-react';

// Active Voice Agents
const activeAgents = [
  {
    id: 1,
    name: 'Diala-Tone',
    status: 'active',
    currentCall: {
      contact: 'John Smith',
      duration: '5:23',
      type: 'Discovery Call'
    },
    callsToday: 45,
    successRate: 92
  },
  {
    id: 2,
    name: 'Echo-Diala',
    status: 'active',
    currentCall: {
      contact: 'Sarah Johnson',
      duration: '12:45',
      type: 'Customer Support'
    },
    callsToday: 38,
    successRate: 88
  },
  {
    id: 3,
    name: 'Voice-Diala',
    status: 'idle',
    currentCall: null,
    callsToday: 52,
    successRate: 95
  },
  {
    id: 4,
    name: 'Diala-Belle',
    status: 'offline',
    currentCall: null,
    callsToday: 0,
    successRate: 90
  }
];

// Analytics agents for the new components
const analyticsAgents = [
  {
    id: 'agent_001',
    name: 'Diala-Tone',
    status: 'active' as const,
    calls: 45,
    success: 92,
    currentCall: 'John Smith'
  },
  {
    id: 'agent_002', 
    name: 'Echo-Diala',
    status: 'active' as const,
    calls: 38,
    success: 88,
    currentCall: 'Sarah Johnson'
  },
  {
    id: 'agent_003',
    name: 'Voice-Diala', 
    status: 'paused' as const,
    calls: 52,
    success: 95,
    currentCall: null
  },
  {
    id: 'agent_004',
    name: 'Diala-Belle',
    status: 'active' as const,
    calls: 31,
    success: 85,
    currentCall: 'Michael Chen'
  },
  {
    id: 'agent_005',
    name: 'Neo-Diala',
    status: 'inactive' as const,
    calls: 67,
    success: 98,
    currentCall: null
  }
];

// Mock analytics data
const mockSwarmData = {
  successRate: 89,
  totalCalls: 247,
  activeAgents: 3
};

const mockSwarmDetails = {
  performance: {
    callsToday: 135,
    appointmentsBooked: 12,
    qualityScore: 92
  }
};

type RecentCall = {
  id: number;
  agent: string;
  contact: string;
  duration: string;
  status: 'completed' | 'failed';
  sentiment: 'positive' | 'neutral' | 'negative';
};

// Recent calls
const recentCalls: RecentCall[] = [
  { id: 1, agent: 'Diala-Tone', contact: 'Emma Davis', duration: '8:12', status: 'completed', sentiment: 'positive' },
  { id: 2, agent: 'Echo-Diala', contact: 'Michael Chen', duration: '3:45', status: 'completed', sentiment: 'neutral' },
  { id: 3, agent: 'Voice-Diala', contact: 'Robert Wilson', duration: '15:30', status: 'completed', sentiment: 'positive' },
  { id: 4, agent: 'Diala-Tone', contact: 'Lisa Anderson', duration: '6:20', status: 'failed', sentiment: 'negative' },
];

export default function DashboardPage() {
  const totalCallsToday = activeAgents.reduce((sum, agent) => sum + agent.callsToday, 0);
  const activeCallsCount = activeAgents.filter(a => a.status === 'active' && a.currentCall).length;
  const avgSuccessRate = Math.round(activeAgents.reduce((sum, agent) => sum + agent.successRate, 0) / activeAgents.length);

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="TOTAL CALLS TODAY"
          value={totalCallsToday}
          icon={<UilPhone className="h-5 w-5 text-white" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
          trend={{
            value: "+15%",
            type: "positive",
            label: "vs yesterday"
          }}
        />

        <StatCard
          title="ACTIVE CALLS"
          value={activeCallsCount}
          icon={<UilMicrophone className="h-5 w-5 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
          status={{
            label: "Live conversations",
            color: "bg-green-100"
          }}
        />

        <StatCard
          title="SUCCESS RATE"
          value={`${avgSuccessRate}%`}
          icon={<UilCheckCircle className="h-5 w-5 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
          progress={avgSuccessRate}
        />

        <StatCard
          title="AVG CALL TIME"
          value="7:45"
          subtitle="MINUTES"
          icon={<UilClock className="h-5 w-5 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
          trend={{
            value: "-0:30",
            type: "neutral",
            label: "optimal"
          }}
        />
      </div>


      {/* Active Voice Agents and Daily Performance Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Voice Agents */}
        <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <CardHeader className="border-b-4 border-black">
            <div className="flex items-center gap-3">
              <Button 
                size="icon"
                variant="default"
                className="w-12 h-12 bg-[rgb(0,82,255)] border-4 border-black"
              >
                <UilRobot className="h-6 w-6 text-white" />
              </Button>
              <CardTitle className="text-xl font-black uppercase">ACTIVE VOICE AGENTS</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsAgents.slice(0, 2).map((agent, index) => (
                <AgentCard 
                  key={agent.id}
                  agent={agent}
                  avatarColor={
                    index === 0 ? "bg-blue-400" : 
                    "bg-purple-400"
                  }
                  showCurrentStatus={true}
                  showMetrics={true}
                />
              ))}
            </div>
            
            {/* View All Button */}
            <div className="mt-6 text-center">
              <Button 
                onClick={() => {
                  const url = new URL('/dashboard/calls', window.location.origin);
                  url.searchParams.set('tab', 'calls');
                  window.location.href = url.toString();
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all px-6 py-3 text-lg"
              >
                VIEW ALL AGENTS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Performance Leaderboard */}
        <DailyPerformanceLeaderboard 
          agents={analyticsAgents}
          sortBy="success"
          maxItems={5}
        />
      </div>

      {/* Analytics Summary */}
      <AnalyticsSummary swarmData={mockSwarmData} swarmDetails={mockSwarmDetails} />
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}