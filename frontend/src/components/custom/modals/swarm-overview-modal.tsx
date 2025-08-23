'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  UilUsersAlt,
  UilPhone,
  UilChart,
  UilPlay,
  UilPause,
  UilStopCircle,
  UilEdit,
  UilCopy,
  UilClock,
  UilCheckCircle,
  UilInfoCircle,
  UilTimesCircle,
  UilCircle,
  UilStar,
  UilTrophyAlt,
  UilBullseye,
  UilExclamationTriangle,
  UilCheckSquare,
  UilArrowUp,
  UilRocket,
  UilLightbulb
} from '@tooni/iconscout-unicons-react';

// Analytics Components
import AnalyticsDashboardHeader from '../analytics/analytics-dashboard-header';
import CallVolumeAnalysis from '../analytics/call-volume-analysis';
import ConversationQualityAnalysis from '../analytics/conversation-quality-analysis';
import LiveCallMonitor from '../analytics/live-call-monitor';
import CallOutcomeAnalytics from '../analytics/call-outcome-analytics';
import AgentPerformanceAnalytics from '../analytics/agent-performance-analytics';
import RecentCallsTable from '../analytics/recent-calls-table';
import PlatformInsights from '../analytics/platform-insights';
import AnalyticsSummary from '../analytics/analytics-summary';
import DailyPerformanceLeaderboard from '../analytics/daily-performance-leaderboard';
import LiveAgentActivity from '../analytics/live-agent-activity';
import AgentCard from '../analytics/agent-card';

interface SwarmCampaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'stopped';
  activeAgents: number;
  totalAgents: number;
  totalCalls: number;
  successRate: number;
  purpose: string;
  created: string;
}

interface SwarmOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  swarmData: SwarmCampaign;
}

export default function SwarmOverviewModal({ isOpen, onClose, swarmData }: SwarmOverviewModalProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400 text-black';
      case 'paused': return 'bg-yellow-400 text-black';
      case 'stopped': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'Discovery': return 'bg-purple-400 text-white';
      case 'Support': return 'bg-green-400 text-black';
      case 'Appointment': return 'bg-orange-400 text-black';
      case 'Follow-up': return 'bg-cyan-400 text-black';
      default: return 'bg-blue-400 text-white';
    }
  };

  // Mock detailed swarm data
  const getSwarmDetails = (swarm: SwarmCampaign) => {
    return {
      performance: {
        callsToday: Math.floor(swarm.totalCalls * 0.1),
        callsThisWeek: Math.floor(swarm.totalCalls * 0.3),
        avgCallDuration: '3m 42s',
        conversionRate: swarm.successRate,
        appointmentsBooked: Math.floor(swarm.totalCalls * (swarm.successRate / 100) * 0.8),
        qualityScore: '94'
      },
      agents: [
        { id: '1', name: 'AI Agent Alpha', status: 'active', calls: 45, success: 92, currentCall: 'Michael Johnson' },
        { id: '2', name: 'AI Agent Beta', status: 'active', calls: 38, success: 85, currentCall: null },
        { id: '3', name: 'AI Agent Gamma', status: 'paused', calls: 22, success: 78, currentCall: null }
      ].slice(0, swarm.totalAgents),
      objectives: [
        'Identify decision makers in target companies',
        'Present value proposition effectively',
        'Handle common objections professionally',
        'Schedule qualified product demonstrations',
        'Maintain conversation flow and rapport'
      ],
      callFlow: [
        { step: 1, phase: 'Opening', description: 'Professional greeting and company introduction', avgDuration: '30s' },
        { step: 2, phase: 'Discovery', description: 'Identify pain points and business needs', avgDuration: '90s' },
        { step: 3, phase: 'Value Prop', description: 'Present tailored solution benefits', avgDuration: '120s' },
        { step: 4, phase: 'Objection Handling', description: 'Address concerns and questions', avgDuration: '60s' },
        { step: 5, phase: 'Close', description: 'Schedule demo or next steps', avgDuration: '45s' }
      ],
      recentCalls: [
        { time: '2:45 PM', prospect: 'Sarah Chen', company: 'TechCorp', outcome: 'Demo Scheduled', agent: 'Alpha' },
        { time: '2:32 PM', prospect: 'Mark Rodriguez', company: 'InnovateLLC', outcome: 'Follow-up Needed', agent: 'Beta' },
        { time: '2:18 PM', prospect: 'Lisa Wang', company: 'DataSystems', outcome: 'Not Interested', agent: 'Alpha' },
        { time: '2:05 PM', prospect: 'John Smith', company: 'CloudTech', outcome: 'Demo Scheduled', agent: 'Beta' }
      ]
    };
  };

  const swarmDetails = getSwarmDetails(swarmData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white border-0 sm:border-4 border-black shadow-none sm:shadow-[8px_8px_0_rgba(0,0,0,1)] w-full h-full sm:max-w-6xl sm:h-5/6 sm:max-h-[calc(100vh-2rem)] flex flex-col overflow-visible">
        
        {/* Modal Header */}
        <div className="border-b-2 sm:border-b-4 border-black bg-gray-100 flex-shrink-0">
          {/* Mobile Header */}
          <div className="sm:hidden p-3 safe-area-top">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase truncate">SWARM OVERVIEW</h2>
                <Badge className={cn("border border-black font-bold uppercase text-xs px-1 flex-shrink-0", getStatusColor(swarmData.status))}>
                  {swarmData.status}
                </Badge>
              </div>
              <Button 
                onClick={onClose}
                size="sm"
                className="w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black text-lg flex-shrink-0"
              >
                ×
              </Button>
            </div>
            <div className="bg-white border-2 border-black p-2">
              <div className="font-black text-sm mb-1 truncate">{swarmData.name}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">{swarmData.activeAgents}/{swarmData.totalAgents} agents</span>
                <span className="text-gray-600">{swarmData.purpose}</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:block p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase">Swarm Overview - {swarmData.name}</h2>
                <Badge className={cn("border-2 border-black font-bold uppercase", getStatusColor(swarmData.status))}>
                  {swarmData.status}
                </Badge>
                <Badge className={cn("border-2 border-black font-bold uppercase", getPurposeColor(swarmData.purpose))}>
                  {swarmData.purpose}
                </Badge>
              </div>
              <Button 
                onClick={onClose}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black text-xl px-3 py-2"
              >
                ×
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-2 text-sm">
              <span className="font-bold">ACTIVE AGENTS: {swarmData.activeAgents}/{swarmData.totalAgents}</span>
              <span className="font-bold">TOTAL CALLS: {swarmData.totalCalls}</span>
              <span className="font-bold">SUCCESS RATE: {swarmData.successRate}%</span>
            </div>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="border-b-2 sm:border-b-4 border-black bg-black flex-shrink-0 relative z-50 overflow-visible">
          {/* Mobile: Dropdown Tabs */}
          <div className="sm:hidden p-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-3 border-2 border-black font-bold uppercase text-sm bg-white focus:outline-none appearance-none"
            >
              <option value="overview">OVERVIEW</option>
              <option value="agents">AGENTS</option>
              <option value="performance">PERFORMANCE</option>
              <option value="analytics">ANALYTICS</option>
              <option value="settings">SETTINGS</option>
            </select>
          </div>
          
          {/* Desktop: Button Tabs */}
          <div className="hidden sm:block relative z-50 overflow-visible">
            <div className="flex overflow-x-auto relative z-50 overflow-visible">
              {['overview', 'agents', 'performance', 'analytics', 'settings'].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  variant="reverse"
                  size="lg"
                  className="whitespace-nowrap flex-shrink-0 border-0 relative z-[100]"
                  style={{ 
                    backgroundColor: activeTab === tab ? '' : 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.setProperty('background-color', '#7dd3fc', 'important');
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.setProperty('background-color', 'white', 'important');
                    }
                  }}
                >
                  {tab.replace('-', ' ').toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
          {/* Main Content Area */}
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Overview Dashboard Header */}
                <AnalyticsDashboardHeader 
                  totalCalls={swarmData.totalCalls}
                  title="SWARM OVERVIEW DASHBOARD"
                  subtitle="Real-time Performance Monitoring"
                  bgColor="bg-green-400"
                  cards={[
                    {
                      value: swarmDetails.performance.callsToday,
                      label: "CALLS TODAY",
                      description: `+${swarmDetails.performance.callsThisWeek} this week`,
                      color: "text-blue-600",
                      progressWidth: "73%"
                    },
                    {
                      value: `${swarmData.successRate}%`,
                      label: "SUCCESS RATE",
                      description: "Target: 75%",
                      color: "text-green-600",
                      progressWidth: `${swarmData.successRate}%`
                    },
                    {
                      value: `${swarmData.activeAgents}/${swarmData.totalAgents}`,
                      label: "ACTIVE AGENTS",
                      description: `Utilization: ${Math.round((swarmData.activeAgents / swarmData.totalAgents) * 100)}%`,
                      color: "text-purple-600",
                      progressWidth: `${Math.round((swarmData.activeAgents / swarmData.totalAgents) * 100)}%`
                    },
                    {
                      value: swarmDetails.performance.appointmentsBooked,
                      label: "APPOINTMENTS",
                      description: `This week: ${Math.floor(swarmDetails.performance.appointmentsBooked * 1.4)}`,
                      color: "text-orange-600",
                      progressWidth: "82%"
                    },
                    {
                      value: swarmDetails.performance.qualityScore,
                      label: "QUALITY SCORE",
                      description: "Conversation rating",
                      color: "text-cyan-600",
                      progressWidth: "94%"
                    },
                    {
                      value: "3m 42s",
                      label: "AVG CALL TIME",
                      description: "Target: 4m",
                      color: "text-pink-600",
                      progressWidth: "92%"
                    }
                  ]}
                />

                {/* Real-time Status Banner */}
                <div className="bg-green-400 p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-black uppercase text-black">SWARM LIVE - {swarmData.activeAgents} AGENTS ACTIVE</span>
                    </div>
                    <div className="text-black font-black">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Control Panel */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-3 text-gray-600">SWARM CONTROLS</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilPlay className="h-4 w-4 mr-2" />
                      START SWARM
                    </Button>
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilPause className="h-4 w-4 mr-2" />
                      PAUSE SWARM
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilStopCircle className="h-4 w-4 mr-2" />
                      STOP SWARM
                    </Button>
                    <Button variant="outline" className="font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilEdit className="h-4 w-4 mr-2" />
                      EDIT CONFIG
                    </Button>
                    <Button variant="outline" className="font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilCopy className="h-4 w-4 mr-2" />
                      CLONE SWARM
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilChart className="h-4 w-4 mr-2" />
                      SCALE UP
                    </Button>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <LiveAgentActivity 
                  title="LIVE ACTIVITY FEED"
                  activities={[
                    {
                      id: '1',
                      agentName: 'AI Agent Alpha',
                      action: 'completed call with',
                      target: 'Sarah Chen',
                      status: {
                        text: 'DEMO SCHEDULED',
                        color: 'text-black',
                        bgColor: 'bg-green-400'
                      },
                      timestamp: '2 min ago',
                      pulseColor: 'bg-green-500'
                    },
                    {
                      id: '2',
                      agentName: 'AI Agent Beta',
                      action: 'started call with',
                      target: 'Mark Rodriguez',
                      status: {
                        text: 'IN PROGRESS',
                        color: 'text-white',
                        bgColor: 'bg-blue-400'
                      },
                      timestamp: 'Just now',
                      pulseColor: 'bg-blue-500'
                    },
                    {
                      id: '3',
                      agentName: 'AI Agent Gamma',
                      action: 'completed call with',
                      target: 'Lisa Wang',
                      status: {
                        text: 'FOLLOW-UP',
                        color: 'text-black',
                        bgColor: 'bg-yellow-400'
                      },
                      timestamp: '4 min ago',
                      pulseColor: 'bg-yellow-500'
                    },
                    {
                      id: '4',
                      agentName: 'SYSTEM',
                      action: 'Auto-scaled swarm from',
                      target: '2 to 3 agents',
                      status: {
                        text: 'AUTO-SCALE',
                        color: 'text-white',
                        bgColor: 'bg-purple-400'
                      },
                      timestamp: '8 min ago',
                      pulseColor: 'bg-purple-500'
                    }
                  ]}
                />

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-3 text-gray-600">QUICK ACTIONS</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        📊 VIEW DETAILED ANALYTICS
                      </Button>
                      <Button variant="outline" className="w-full justify-start font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        📞 MONITOR LIVE CALLS
                      </Button>
                      <Button variant="outline" className="w-full justify-start font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        📈 EXPORT PERFORMANCE REPORT
                      </Button>
                      <Button variant="outline" className="w-full justify-start font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        ⚙️ ADJUST SCALING RULES
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-4 text-gray-600">SWARM HEALTH MONITOR</h3>
                    
                    {/* Overall Health Status */}
                    <div className="mb-4 p-3 bg-green-50 border-2 border-black">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-black text-sm uppercase">SYSTEM STATUS</span>
                        </div>
                        <Badge className="bg-green-400 text-black border border-black font-bold uppercase text-xs">OPTIMAL</Badge>
                      </div>
                      <div className="text-xs text-green-700">All agents operating within normal parameters</div>
                    </div>

                    {/* Health Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 border-2 border-black text-center">
                        <div className="text-lg font-black text-green-600">127ms</div>
                        <div className="text-xs font-bold text-gray-600 uppercase">API LATENCY</div>
                        <div className="w-full bg-gray-300 border border-black h-1 mt-1">
                          <div className="h-full bg-green-400" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 border-2 border-black text-center">
                        <div className="text-lg font-black text-green-600">0.02%</div>
                        <div className="text-xs font-bold text-gray-600 uppercase">ERROR RATE</div>
                        <div className="w-full bg-gray-300 border border-black h-1 mt-1">
                          <div className="h-full bg-green-400" style={{ width: '98%' }}></div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 border-2 border-black text-center">
                        <div className="text-lg font-black text-blue-600">12</div>
                        <div className="text-xs font-bold text-gray-600 uppercase">QUEUE DEPTH</div>
                        <div className="w-full bg-gray-300 border border-black h-1 mt-1">
                          <div className="h-full bg-blue-400" style={{ width: '24%' }}></div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 border-2 border-black text-center">
                        <div className="text-lg font-black text-purple-600">99.8%</div>
                        <div className="text-xs font-bold text-gray-600 uppercase">UPTIME</div>
                        <div className="w-full bg-gray-300 border border-black h-1 mt-1">
                          <div className="h-full bg-purple-400" style={{ width: '99%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Auto-scaling Status */}
                    <div className="mt-4 p-3 bg-blue-50 border-2 border-black">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-bold text-xs uppercase text-blue-800">AUTO-SCALING</span>
                        </div>
                        <span className="font-black text-xs text-blue-600">NEXT EVENT: ~2 MIN</span>
                      </div>
                      <div className="text-xs text-blue-700 mt-1">Ready to scale based on queue depth</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="space-y-4">
                {/* Agent Fleet Dashboard Header */}
                <AnalyticsDashboardHeader 
                  totalCalls={swarmData.totalCalls}
                  title="AGENT FLEET OVERVIEW"
                  subtitle={`${swarmData.activeAgents} Agents Live • Auto-Scaling On`}
                  bgColor="bg-green-400"
                  cards={[
                    {
                      value: swarmData.activeAgents,
                      label: "ACTIVE NOW",
                      description: "Currently running",
                      color: "text-green-600",
                      progressWidth: `${Math.min((swarmData.activeAgents / swarmData.totalAgents) * 100, 100)}%`
                    },
                    {
                      value: swarmData.totalAgents,
                      label: "TOTAL FLEET",
                      description: "Available agents",
                      color: "text-blue-600",
                      progressWidth: "100%"
                    },
                    {
                      value: `${Math.round((swarmData.activeAgents / swarmData.totalAgents) * 100)}%`,
                      label: "UTILIZATION",
                      description: "Fleet efficiency",
                      color: "text-purple-600",
                      progressWidth: `${Math.round((swarmData.activeAgents / swarmData.totalAgents) * 100)}%`
                    },
                    {
                      value: "2.4m",
                      label: "AVG CALL TIME",
                      description: "Per conversation",
                      color: "text-orange-600",
                      progressWidth: "75%"
                    }
                  ]}
                />

                {/* Agent Performance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {swarmDetails.agents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      showCurrentStatus={true}
                      showMetrics={true}
                    />
                  ))}
                </div>

                {/* Agent Management Controls */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">FLEET MANAGEMENT</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      ADD AGENT
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      SCALE UP
                    </Button>
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      PAUSE ALL
                    </Button>
                    <Button variant="outline" className="font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      BULK ACTIONS
                    </Button>
                    <Button variant="outline" className="font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      AGENT LOGS
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      ANALYTICS
                    </Button>
                  </div>
                </div>

                {/* Real-time Agent Activity */}
                <LiveAgentActivity 
                  title="LIVE AGENT ACTIVITY"
                  activities={[
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
                      target: 'Enterprise Client',
                      status: {
                        text: 'QUALIFIED LEAD',
                        color: 'text-black',
                        bgColor: 'bg-yellow-400'
                      },
                      timestamp: '2m ago',
                      pulseColor: 'bg-yellow-500'
                    },
                    {
                      id: '4',
                      agentName: 'SYSTEM',
                      action: 'Auto-scaled fleet capacity from',
                      target: '2 to 3 agents',
                      status: {
                        text: 'SCALING EVENT',
                        color: 'text-white',
                        bgColor: 'bg-purple-400'
                      },
                      timestamp: '3m ago',
                      pulseColor: 'bg-purple-500'
                    }
                  ]}
                />

                {/* Agent Performance Leaderboard */}
                <DailyPerformanceLeaderboard 
                  agents={swarmDetails.agents}
                  title="DAILY PERFORMANCE LEADERBOARD"
                  badgeText="LIVE RANKINGS"
                  badgeColor="bg-purple-400 text-white"
                  sortBy="success"
                  maxItems={swarmDetails.agents.length}
                />
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-4">
                {/* Performance Dashboard Header */}
                <AnalyticsDashboardHeader 
                  totalCalls={swarmData.totalCalls}
                  title="PERFORMANCE DASHBOARD"
                  subtitle="Real-time Swarm Metrics"
                  bgColor="bg-blue-400"
                  cards={[
                    {
                      value: `${swarmData.successRate}%`,
                      label: "SUCCESS RATE",
                      description: "+5% vs yesterday",
                      color: "text-green-600",
                      progressWidth: `${swarmData.successRate}%`
                    },
                    {
                      value: swarmDetails.performance.callsToday,
                      label: "CALLS TODAY",
                      description: "Target: 150",
                      color: "text-blue-600",
                      progressWidth: `${Math.min((swarmDetails.performance.callsToday / 150) * 100, 100)}%`
                    },
                    {
                      value: swarmDetails.performance.appointmentsBooked,
                      label: "DEMOS BOOKED",
                      description: "82% of target",
                      color: "text-purple-600",
                      progressWidth: "82%"
                    },
                    {
                      value: swarmDetails.performance.avgCallDuration,
                      label: "AVG DURATION",
                      description: "Optimal range",
                      color: "text-orange-600",
                      progressWidth: "75%"
                    },
                    {
                      value: swarmDetails.performance.qualityScore,
                      label: "QUALITY SCORE",
                      description: "+6% this month",
                      color: "text-cyan-600",
                      progressWidth: `${parseFloat(swarmDetails.performance.qualityScore)}%`
                    },
                    {
                      value: "98%",
                      label: "ADHERENCE",
                      description: "Script compliance",
                      color: "text-pink-600",
                      progressWidth: "98%"
                    }
                  ]}
                />

                {/* Call Performance Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Conversation Quality Metrics */}
                  <ConversationQualityAnalysis 
                    title="CONVERSATION QUALITY METRICS"
                    bgColor="bg-green-50"
                    iconBgColor="bg-green-400"
                    metrics={[
                      {
                        label: "OBJECTIVE COMPLETION",
                        value: Math.round((swarmData.totalCalls * 0.32 / swarmData.totalCalls) * 100),
                        percentage: Math.round((swarmData.totalCalls * 0.32 / swarmData.totalCalls) * 100),
                        color: "green",
                        description: "EXCELLENT"
                      },
                      {
                        label: "FOLLOW-UP QUALITY",
                        value: Math.round((swarmData.totalCalls * 0.25 / swarmData.totalCalls) * 100),
                        percentage: Math.round((swarmData.totalCalls * 0.25 / swarmData.totalCalls) * 100),
                        color: "blue",
                        description: "STRONG"
                      },
                      {
                        label: "INFORMATION ACCURACY",
                        value: Math.round((swarmData.totalCalls * 0.18 / swarmData.totalCalls) * 100),
                        percentage: Math.round((swarmData.totalCalls * 0.18 / swarmData.totalCalls) * 100),
                        color: "purple",
                        description: "GOOD"
                      },
                      {
                        label: "RESPONSE EFFICIENCY",
                        value: 85,
                        percentage: 85,
                        color: "orange",
                        description: "OPTIMAL"
                      }
                    ]}
                  />

                  <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-4 text-gray-600">PERFORMANCE TRENDS</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">Success Rate Trend</span>
                          <span className="text-green-600 font-bold text-xs">↗ +8% this week</span>
                        </div>
                        <div className="w-full bg-gray-300 border-2 border-black h-4">
                          <div className="h-full bg-green-400" style={{ width: `${swarmData.successRate}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">Call Volume</span>
                          <span className="text-blue-600 font-bold text-xs">↗ +15% vs last week</span>
                        </div>
                        <div className="w-full bg-gray-300 border-2 border-black h-4">
                          <div className="h-full bg-blue-400" style={{ width: '73%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">Agent Efficiency</span>
                          <span className="text-purple-600 font-bold text-xs">↗ +12% improvement</span>
                        </div>
                        <div className="w-full bg-gray-300 border-2 border-black h-4">
                          <div className="h-full bg-purple-400" style={{ width: '89%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">Response Quality</span>
                          <span className="text-orange-600 font-bold text-xs">↗ +6% this month</span>
                        </div>
                        <div className="w-full bg-gray-300 border-2 border-black h-4">
                          <div className="h-full bg-orange-400" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Flow Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-4 text-gray-600">OPTIMIZED CALL FLOW</h3>
                    <div className="space-y-4">
                      {swarmDetails.callFlow.map((phase, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                          <div className="w-8 h-8 bg-cyan-400 border-2 border-black flex items-center justify-center font-black text-xs flex-shrink-0">
                            {phase.step}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{phase.phase}</div>
                            <div className="text-xs text-gray-600">{phase.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-500">{phase.avgDuration}</div>
                            <div className="text-xs text-green-600">✓ Optimized</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-4 text-gray-600">CAMPAIGN OBJECTIVES STATUS</h3>
                    <div className="space-y-4">
                      {swarmDetails.objectives.map((objective, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                          <div className={cn(
                            "w-8 h-8 border-2 border-black flex items-center justify-center font-black text-white text-xs flex-shrink-0",
                            index < 3 ? "bg-green-400" : index < 4 ? "bg-yellow-400 text-black" : "bg-gray-400"
                          )}>
                            {index < 3 ? "✓" : index < 4 ? "⚠" : "⏳"}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{objective}</div>
                            <div className="text-xs text-gray-600">
                              {index < 3 ? "Consistently achieved across swarm" : 
                               index < 4 ? "Needs improvement in 30% of calls" : 
                               "In development phase"}
                            </div>
                          </div>
                          <div className={cn(
                            "px-2 py-1 border border-black text-xs font-bold uppercase",
                            index < 3 ? "bg-green-400 text-black" : 
                            index < 4 ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"
                          )}>
                            {index < 3 ? "MASTERED" : index < 4 ? "TRAINING" : "PENDING"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advanced Performance Metrics */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">ADVANCED SWARM ANALYTICS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h4 className="font-bold text-sm mb-3">CONVERSION FUNNEL</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Calls Made</span>
                          <span className="font-bold text-xs">{swarmData.totalCalls}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Connected</span>
                          <span className="font-bold text-xs">{Math.floor(swarmData.totalCalls * 0.85)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Interested</span>
                          <span className="font-bold text-xs">{Math.floor(swarmData.totalCalls * 0.68)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Qualified</span>
                          <span className="font-bold text-xs">{Math.floor(swarmData.totalCalls * 0.48)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                          <span className="text-xs font-bold">Converted</span>
                          <span className="font-black text-xs text-green-600">{Math.floor(swarmData.totalCalls * (swarmData.successRate / 100))}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm mb-3">CALL TIMING ANALYSIS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Peak Hours</span>
                          <span className="font-bold text-xs">10AM-2PM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Best Days</span>
                          <span className="font-bold text-xs">Tue-Thu</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Avg Ring Time</span>
                          <span className="font-bold text-xs">4.2 rings</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Connection Rate</span>
                          <span className="font-bold text-xs">85%</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                          <span className="text-xs font-bold">Optimal Window</span>
                          <span className="font-black text-xs text-blue-600">11AM-1PM</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm mb-3">PERFORMANCE METRICS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Baseline Score</span>
                          <span className="font-bold text-xs">45%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Current Score</span>
                          <span className="font-bold text-xs text-green-600">{swarmData.successRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Improvement</span>
                          <span className="font-bold text-xs text-green-600">+{swarmData.successRate - 45}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Performance</span>
                          <span className="font-bold text-xs">Excellent</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                          <span className="text-xs font-bold">Efficiency</span>
                          <span className="font-black text-xs text-purple-600">3.8x</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm mb-3">QUALITY INDICATORS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Script Adherence</span>
                          <span className="font-bold text-xs">96%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Objection Handling</span>
                          <span className="font-bold text-xs">92%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Prospect Satisfaction</span>
                          <span className="font-bold text-xs">4.7/5</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Compliance Score</span>
                          <span className="font-bold text-xs">100%</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                          <span className="text-xs font-bold">Overall Grade</span>
                          <span className="font-black text-xs text-green-600">A+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Performance Analytics */}
                <AgentPerformanceAnalytics 
                  agents={swarmDetails.agents}
                  swarmData={swarmData}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {/* Analytics Dashboard Header */}
                <AnalyticsDashboardHeader totalCalls={swarmData.totalCalls} />

                {/* Call Analytics & Performance Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Call Volume Analysis */}
                  <CallVolumeAnalysis 
                    callsToday={swarmDetails.performance.callsToday}
                    callsThisWeek={swarmDetails.performance.callsThisWeek}
                  />

                  {/* Conversation Quality Analysis */}
                  <ConversationQualityAnalysis />
                </div>

                {/* Real-time Activity & Call Outcomes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Live Call Monitor */}
                  <LiveCallMonitor 
                    agents={swarmDetails.agents}
                    swarmData={swarmData}
                  />

                  {/* Call Outcome Analytics */}
                  <CallOutcomeAnalytics 
                    totalCalls={swarmData.totalCalls}
                    successRate={swarmData.successRate}
                  />
                </div>

                {/* Agent Performance Analytics */}
                <AgentPerformanceAnalytics 
                  agents={swarmDetails.agents}
                  swarmData={swarmData}
                />

                {/* Recent Calls and Platform Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Recent Calls Table */}
                  <RecentCallsTable 
                    recentCalls={swarmDetails.recentCalls}
                  />

                  {/* Platform Insights */}
                  <PlatformInsights 
                    swarmData={swarmData}
                    swarmDetails={swarmDetails}
                  />
                </div>

                {/* Analytics Summary Dashboard */}
                <AnalyticsSummary 
                  swarmData={swarmData}
                  swarmDetails={swarmDetails}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Swarm Configuration */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">SWARM CONFIGURATION</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-bold">Swarm ID:</span>
                        <span className="font-mono text-sm">{swarmData.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Created:</span>
                        <span>{new Date(swarmData.created).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Max Agents:</span>
                        <span>{swarmData.totalAgents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Campaign Type:</span>
                        <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getPurposeColor(swarmData.purpose))}>
                          {swarmData.purpose}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-bold">Auto-scaling:</span>
                        <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ENABLED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Call Recording:</span>
                        <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Analytics:</span>
                        <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">REAL-TIME</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Priority:</span>
                        <span className="px-2 py-1 bg-yellow-400 border border-black text-xs font-bold uppercase text-black">HIGH</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Agent Configuration */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">AI AGENT CONFIGURATION</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-2 text-gray-700">VOICE & SPEECH</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Voice Model:</span>
                            <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">RACHEL</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Speaking Rate:</span>
                            <span className="font-bold">1.1x</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Voice Clarity:</span>
                            <span className="font-bold">Enhanced</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Language:</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">EN-US</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-2 text-gray-700">CONVERSATION STYLE</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Personality:</span>
                            <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">PROFESSIONAL</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Tone:</span>
                            <span className="font-bold">Confident</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Formality:</span>
                            <span className="font-bold">Business</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Objection Style:</span>
                            <span className="px-2 py-1 bg-yellow-400 border border-black text-xs font-bold uppercase text-black">EMPATHETIC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-2 text-gray-700">PERFORMANCE LIMITS</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Max Call Duration:</span>
                            <span className="font-bold">8 minutes</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Retry Attempts:</span>
                            <span className="font-bold">3 calls</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Queue Timeout:</span>
                            <span className="font-bold">45 seconds</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Success Threshold:</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">75%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-2 text-gray-700">ESCALATION RULES</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Auto-Transfer:</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ENABLED</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Escalation Trigger:</span>
                            <span className="font-bold">Objection x3</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Supervisor Alert:</span>
                            <span className="px-2 py-1 bg-yellow-400 border border-black text-xs font-bold uppercase text-black">ACTIVE</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Quality Check:</span>
                            <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">REAL-TIME</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Script & Knowledge Base */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">SCRIPT & KNOWLEDGE MANAGEMENT</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">ACTIVE SCRIPTS</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white border border-black">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-400 border border-black"></div>
                              <span className="font-bold text-sm">Opening Script v2.3</span>
                            </div>
                            <Badge className="bg-green-400 text-black border border-black font-bold uppercase text-xs">
                              ACTIVE
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white border border-black">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-400 border border-black"></div>
                              <span className="font-bold text-sm">Objection Responses v1.8</span>
                            </div>
                            <Badge className="bg-blue-400 text-white border border-black font-bold uppercase text-xs">
                              TESTING
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white border border-black">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-400 border border-black"></div>
                              <span className="font-bold text-sm">Closing Techniques v1.5</span>
                            </div>
                            <Badge className="bg-purple-400 text-white border border-black font-bold uppercase text-xs">
                              DEPLOYED
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">SCRIPT PERFORMANCE</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Script Adherence:</span>
                            <span className="font-black text-green-600">94%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Success Rate:</span>
                            <span className="font-black text-blue-600">87%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Avg Call Time:</span>
                            <span className="font-bold">3m 42s</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Quality Score:</span>
                            <span className="font-black text-purple-600">9.2/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">KNOWLEDGE BASE</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white border border-black">
                            <div>
                              <div className="font-bold text-sm">Product Catalog</div>
                              <div className="text-xs text-gray-600">1,247 entries</div>
                            </div>
                            <Badge className="bg-green-400 text-black border border-black font-bold uppercase text-xs">
                              SYNCED
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white border border-black">
                            <div>
                              <div className="font-bold text-sm">FAQ Database</div>
                              <div className="text-xs text-gray-600">342 Q&As</div>
                            </div>
                            <Badge className="bg-yellow-400 text-black border border-black font-bold uppercase text-xs">
                              UPDATING
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white border border-black">
                            <div>
                              <div className="font-bold text-sm">Competitor Intel</div>
                              <div className="text-xs text-gray-600">89 profiles</div>
                            </div>
                            <Badge className="bg-blue-400 text-white border border-black font-bold uppercase text-xs">
                              CURRENT
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">AI TRAINING DATA</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Training Calls:</span>
                            <span className="font-bold">12,847</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Success Examples:</span>
                            <span className="font-bold">8,934</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Objection Samples:</span>
                            <span className="font-bold">3,421</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Last Update:</span>
                            <span className="font-bold">2 hours ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Optimization */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">CAMPAIGN OPTIMIZATION</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <h4 className="font-black uppercase text-xs mb-3 text-gray-700">TIMING OPTIMIZATION</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Best Call Times:</span>
                          <span className="font-bold">10AM-2PM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Optimal Days:</span>
                          <span className="font-bold">Tue-Thu</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Timezone Aware:</span>
                          <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ON</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>DNC Filtering:</span>
                          <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <h4 className="font-black uppercase text-xs mb-3 text-gray-700">LEAD PRIORITIZATION</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Scoring Model:</span>
                          <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">AI-DRIVEN</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Hot Leads First:</span>
                          <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ENABLED</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Min Lead Score:</span>
                          <span className="font-bold">65</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Callback Window:</span>
                          <span className="font-bold">24 hours</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <h4 className="font-black uppercase text-xs mb-3 text-gray-700">ADAPTIVE LEARNING</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Real-time Updates:</span>
                          <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ON</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>A/B Testing:</span>
                          <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">RUNNING</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Learning Rate:</span>
                          <span className="font-bold">Aggressive</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Model Version:</span>
                          <span className="font-bold">v4.2.1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security & Compliance */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">SECURITY & COMPLIANCE</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">DATA PROTECTION</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Call Recording Encryption</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">AES-256</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Data Retention</span>
                            <span className="font-bold text-sm">90 days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">PII Masking</span>
                            <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">ENABLED</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">GDPR Compliance</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">ACTIVE</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">AUDIT TRAIL</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Event Logging:</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">FULL</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Access Control:</span>
                            <span className="px-2 py-1 bg-purple-400 border border-black text-xs font-bold uppercase text-white">RBAC</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Session Monitoring:</span>
                            <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">REAL-TIME</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">REGULATORY COMPLIANCE</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">TCPA Compliance</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">VERIFIED</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Consent Management</span>
                            <span className="px-2 py-1 bg-blue-400 border border-black text-xs font-bold uppercase text-white">AUTOMATED</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">DNC List Updates</span>
                            <span className="font-bold text-sm">Daily</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Disclosure Requirements</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">MET</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-2 border-black p-3">
                        <h4 className="font-black uppercase text-xs mb-3 text-gray-700">QUALITY ASSURANCE</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Call Monitoring:</span>
                            <span className="font-bold">100%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Quality Scoring:</span>
                            <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">AI-POWERED</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Supervisor Alerts:</span>
                            <span className="px-2 py-1 bg-yellow-400 border border-black text-xs font-bold uppercase text-black">ENABLED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integration & API Settings */}
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">INTEGRATION & API SETTINGS</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <h4 className="font-black uppercase text-xs mb-3 text-gray-700">CRM INTEGRATION</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white border border-black">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 border border-black"></div>
                            <span className="font-bold text-sm">Salesforce</span>
                          </div>
                          <Badge className="bg-green-400 text-black border border-black font-bold uppercase text-xs">
                            CONNECTED
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white border border-black">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 border border-black"></div>
                            <span className="font-bold text-sm">HubSpot</span>
                          </div>
                          <Badge className="bg-blue-400 text-white border border-black font-bold uppercase text-xs">
                            SYNCING
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Last sync: 5 minutes ago
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <h4 className="font-black uppercase text-xs mb-3 text-gray-700">TELEPHONY STACK</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>SIP Provider:</span>
                          <span className="font-bold">Telnyx</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Codec:</span>
                          <span className="font-bold">G.711</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Redundancy:</span>
                          <span className="px-2 py-1 bg-green-400 border border-black text-xs font-bold uppercase text-black">MULTI-REGION</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Latency:</span>
                          <span className="font-bold text-green-600">23ms</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <h4 className="font-black uppercase text-xs mb-3 text-gray-700">WEBHOOK ENDPOINTS</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white border border-black">
                          <div>
                            <div className="font-bold text-sm">Call Events</div>
                            <div className="text-xs text-gray-600">https://api.example.com/...</div>
                          </div>
                          <Badge className="bg-green-400 text-black border border-black font-bold uppercase text-xs">
                            ACTIVE
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white border border-black">
                          <div>
                            <div className="font-bold text-sm">Lead Updates</div>
                            <div className="text-xs text-gray-600">https://crm.example.com/...</div>
                          </div>
                          <Badge className="bg-yellow-400 text-black border border-black font-bold uppercase text-xs">
                            PENDING
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}