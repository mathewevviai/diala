'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import StatCard from '@/components/custom/stat-card';
import { 
  UilPhone,
  UilUserCircle,
  UilClock,
  UilChart,
  UilUsersAlt,
  UilInfoCircle,
  UilFilter,
  UilExport,
  UilToggleOn,
  UilToggleOff,
  UilAngleDown,
  UilPhoneVolume,
  UilCommentAlt,
  UilListUl,
  UilCircle,
  UilTachometerFast,
  UilRobot,
  UilAnalytics
} from '@tooni/iconscout-unicons-react';
import CallAnalyticsModal from '@/components/custom/modals/call-analytics-modal';
import LiveCallMonitorModal from '@/components/custom/modals/live-call-monitor-modal';
import SwarmOverviewModal from '@/components/custom/modals/swarm-overview-modal';

// Mock agents data for the table
interface AgentCall {
  id: string;
  agent: string;
  avatar?: string;
  outbound: number;
  answeredInbound: number;
  pickedUp: number;
  notPickedUp: number;
  status: 'online' | 'offline' | 'available';
  onMobile?: boolean;
  onDesktop?: boolean;
  convexEntryPoint?: string; // Added for Convex integration
}

// Phone numbers data structure
interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  type: 'sip' | 'pstn' | 'virtual';
  status: 'active' | 'inactive' | 'maintenance';
  provider: string;
  location: string;
  assignedUser?: string;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  successRate: number;
  avgCallDuration: string;
  lastUsed: string;
  sipConfig?: {
    endpoint: string;
    username: string;
    domain: string;
    port: number;
    protocol: 'UDP' | 'TCP' | 'TLS';
    codec: string[];
  };
  features: string[];
}

const mockAgents: AgentCall[] = [
  { id: '1', agent: 'AI Sales Agent Alpha', outbound: 156, answeredInbound: 89, pickedUp: 142, notPickedUp: 14, status: 'online', onMobile: true, onDesktop: true, convexEntryPoint: 'agents.salesAlpha' },
  { id: '2', agent: 'AI Support Agent Beta', outbound: 43, answeredInbound: 231, pickedUp: 198, notPickedUp: 33, status: 'offline', onDesktop: true, convexEntryPoint: 'agents.supportBeta' }
];

const mockPhoneNumbers: PhoneNumber[] = [
  {
    id: '1',
    number: '+1 (555) 123-4567',
    displayName: 'Main Sales Line',
    type: 'pstn',
    status: 'active',
    provider: 'Telnyx',
    location: 'New York, NY',
    assignedUser: 'Ruben Test1',
    callsToday: 23,
    callsThisWeek: 156,
    callsThisMonth: 687,
    successRate: 85,
    avgCallDuration: '3m 45s',
    lastUsed: '2 minutes ago',
    features: ['Call Recording', 'Analytics', 'Voicemail']
  },
  {
    id: '2',
    number: '+1 (555) 987-6543',
    displayName: 'Support Hotline',
    type: 'pstn',
    status: 'active',
    provider: 'Telnyx',
    location: 'Los Angeles, CA',
    assignedUser: 'Seb Staging Mingel',
    callsToday: 45,
    callsThisWeek: 312,
    callsThisMonth: 1243,
    successRate: 92,
    avgCallDuration: '5m 12s',
    lastUsed: '5 minutes ago',
    features: ['Call Recording', 'Analytics', 'Auto Attendant']
  },
  {
    id: '3',
    number: 'sip:agent@diala.ai',
    displayName: 'AI Agent Endpoint',
    type: 'sip',
    status: 'active',
    provider: 'Internal',
    location: 'Cloud Infrastructure',
    callsToday: 128,
    callsThisWeek: 892,
    callsThisMonth: 3654,
    successRate: 98,
    avgCallDuration: '2m 34s',
    lastUsed: 'Active now',
    sipConfig: {
      endpoint: 'agent.diala.ai',
      username: 'ai_agent_001',
      domain: 'diala.ai',
      port: 5060,
      protocol: 'UDP',
      codec: ['G.711', 'G.722', 'Opus']
    },
    features: ['Real-time Analytics', 'AI Monitoring', 'Auto Scaling']
  },
  {
    id: '4',
    number: '+44 20 7123 4567',
    displayName: 'UK Sales Office',
    type: 'pstn',
    status: 'active',
    provider: 'Telnyx',
    location: 'London, UK',
    assignedUser: 'Jane Green',
    callsToday: 17,
    callsThisWeek: 89,
    callsThisMonth: 432,
    successRate: 78,
    avgCallDuration: '4m 23s',
    lastUsed: '1 hour ago',
    features: ['International Routing', 'Call Recording']
  },
  {
    id: '5',
    number: 'sip:outbound@diala.ai',
    displayName: 'Outbound Campaign Pool',
    type: 'sip',
    status: 'active',
    provider: 'Internal',
    location: 'Multi-Region',
    callsToday: 234,
    callsThisWeek: 1567,
    callsThisMonth: 6890,
    successRate: 73,
    avgCallDuration: '1m 56s',
    lastUsed: 'Active now',
    sipConfig: {
      endpoint: 'outbound.diala.ai',
      username: 'campaign_pool',
      domain: 'diala.ai',
      port: 5061,
      protocol: 'TLS',
      codec: ['G.711', 'Opus']
    },
    features: ['Load Balancing', 'Campaign Analytics', 'DNC Filtering']
  },
  {
    id: '6',
    number: '+1 (555) 456-7890',
    displayName: 'Enterprise Support',
    type: 'virtual',
    status: 'active',
    provider: 'Telnyx',
    location: 'Virtual',
    assignedUser: 'Alexandra Sarfati',
    callsToday: 8,
    callsThisWeek: 45,
    callsThisMonth: 198,
    successRate: 95,
    avgCallDuration: '8m 15s',
    lastUsed: '30 minutes ago',
    features: ['Priority Routing', 'Escalation Management', 'SLA Tracking']
  },
  {
    id: '7',
    number: '+1 (555) 321-0987',
    displayName: 'Demo Line',
    type: 'pstn',
    status: 'maintenance',
    provider: 'Telnyx',
    location: 'Chicago, IL',
    callsToday: 0,
    callsThisWeek: 12,
    callsThisMonth: 76,
    successRate: 87,
    avgCallDuration: '6m 42s',
    lastUsed: '2 days ago',
    features: ['Screen Recording', 'Demo Analytics']
  },
  {
    id: '8',
    number: 'sip:testing@dev.diala.ai',
    displayName: 'Development Testing',
    type: 'sip',
    status: 'inactive',
    provider: 'Internal',
    location: 'Development Environment',
    callsToday: 5,
    callsThisWeek: 23,
    callsThisMonth: 67,
    successRate: 45,
    avgCallDuration: '1m 12s',
    lastUsed: '4 hours ago',
    sipConfig: {
      endpoint: 'testing.dev.diala.ai',
      username: 'test_user',
      domain: 'dev.diala.ai',
      port: 5062,
      protocol: 'TCP',
      codec: ['G.711']
    },
    features: ['Debug Logging', 'Call Simulation']
  }
];

export default function CallsPage() {
  const [showKPIs, setShowKPIs] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('agents');
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['calls', 'agents', 'numbers', 'swarm'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  const [timeRange, setTimeRange] = React.useState('today');
  const [selectedFilters, setSelectedFilters] = React.useState({
    numbers: '',
    agents: '',
    teams: ''
  });
  const [selectedLiveCall, setSelectedLiveCall] = React.useState<any>(null);
  const [showLiveCallModal, setShowLiveCallModal] = React.useState(false);
  const [selectedSwarm, setSelectedSwarm] = React.useState<SwarmCampaign | null>(null);
  const [showSwarmModal, setShowSwarmModal] = React.useState(false);
  const [selectedAgentForAnalytics, setSelectedAgentForAnalytics] = React.useState<AgentCall | null>(null);
  const [showCallAnalyticsModal, setShowCallAnalyticsModal] = React.useState(false);

  // KPI values
  const slaPercentage = 98.9;
  const totalCalls = 26;
  const inbound = 100;
  const outbound = 74;
  const answered = 110;
  const unanswered = 110;
  const unansweredPercentage = 50;
  const avgTimeToAnswer = '1min 57s';
  const longestWaiting = '7s';
  const callsWaiting = 50;
  const availableUsers = 6;
  const userStatusTotal = 521;
  
  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStatusBadgeColorLive = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-400 text-black';
      case 'ringing': return 'bg-blue-400 text-white';
      case 'on-hold': return 'bg-yellow-400 text-black';
      case 'transferring': return 'bg-purple-400 text-white';
      default: return 'bg-gray-400 text-black';
    }
  };

  const getNumberStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400 text-black';
      case 'inactive': return 'bg-gray-400 text-white';
      case 'maintenance': return 'bg-yellow-400 text-black';
      default: return 'bg-gray-400 text-black';
    }
  };

  const getNumberTypeIcon = (type: string) => {
    switch (type) {
      case 'sip': return '🌐';
      case 'pstn': return '📞';
      case 'virtual': return '☁️';
      default: return '📱';
    }
  };

  const handleRowClick = (agent: AgentCall) => {
    setSelectedAgentForAnalytics(agent);
    setShowCallAnalyticsModal(true);
  };

  const closeCallAnalyticsModal = () => {
    setShowCallAnalyticsModal(false);
    setSelectedAgentForAnalytics(null);
  };

  const closeLiveCallModal = () => {
    setShowLiveCallModal(false);
    setSelectedLiveCall(null);
  };

  const handleLiveCallClick = (liveCall: any) => {
    setSelectedLiveCall(liveCall);
    setShowLiveCallModal(true);
  };

  const handleSwarmClick = (swarm: SwarmCampaign) => {
    setSelectedSwarm(swarm);
    setShowSwarmModal(true);
  };

  const closeSwarmModal = () => {
    setShowSwarmModal(false);
    setSelectedSwarm(null);
  };

  // Generate mock call analytics data for the selected user
  const getCallAnalyticsData = (agent: AgentCall) => ({
    callInfo: {
      callId: `a6cd4cba-2e2a-4692-990f-f152e6f7-${agent.id}`,
      agent: agent.agent,
      customer: 'Taylor Smith',
      phone: '+1 201-232-1152',
      status: 'COMPLETED'
    },
    timing: {
      startTime: 'Mon, February 24, 2025 10:14:34 AM',
      endTime: 'Mon, February 24, 2025 10:18:35 AM',
      duration: '4m 01s',
      queueTime: '12s',
      holdTime: '0s'
    },
    metrics: {
      resolution: 'RESOLVED',
      transfer: true,
      sentiment: 'MIXED',
      qualityScore: '8.5/10'
    },
    callFlow: [
      { step: 1, title: 'Call Initiated', description: 'Outbound campaign call started', color: 'bg-purple-400' },
      { step: 2, title: 'Contact Connected', description: 'AI agent connected to prospect', color: 'bg-blue-400' },
      { step: 3, title: 'Pitch Delivered', description: 'Product introduction and value proposition', color: 'bg-cyan-400' },
      { step: 4, title: 'Objection Handled', description: 'Addressed pricing concerns professionally', color: 'bg-yellow-400' },
      { step: 5, title: 'Appointment Set', description: 'Demo scheduled for next Tuesday', color: 'bg-green-600' }
    ],
    customerProfile: {
      name: 'Taylor Smith',
      initials: 'TS',
      type: 'Sales Prospect',
      accountType: 'LEAD',
      customerSince: 'New Prospect',
      previousCalls: 2,
      satisfaction: 'Not Rated',
      lastContact: 'First Contact'
    },
    transcript: [
      {
        timestamp: '00:43',
        speaker: 'agent' as const,
        content: 'Hi Taylor! I\'m calling from Diala about our new AI voice solutions that could transform your customer engagement.',
        sentiment: 'positive' as const
      },
      {
        timestamp: '00:46',
        speaker: 'customer' as const,
        content: 'Oh, hi there. I wasn\'t expecting a call today. What kind of solutions are you talking about?',
        sentiment: 'neutral' as const
      },
      {
        timestamp: '00:54',
        speaker: 'agent' as const,
        content: 'Great question! We help businesses like yours automate outbound calling with AI that sounds completely natural and converts 40% better than traditional methods.'
      },
      {
        timestamp: '01:12',
        speaker: 'customer' as const,
        content: 'That does sound interesting. We do a lot of cold calling for our sales team. What makes your solution different?'
      },
      {
        timestamp: '01:28',
        speaker: 'agent' as const,
        content: 'Excellent! Our AI agents can handle objections, book appointments, and even do follow-ups. Would you be interested in a quick 15-minute demo this week?'
      },
      {
        timestamp: '01:45',
        speaker: 'customer' as const,
        content: 'Sure, I\'d like to see how this works. Tuesday afternoon would be good for me.'
      }
    ],
    aiInsights: {
      topics: [
        { name: 'Positive', type: 'positive' as const },
        { name: 'Negative', type: 'negative' as const },
        { name: 'Empathetic', type: 'empathetic' as const },
        { name: 'Unhelpful', type: 'unhelpful' as const }
      ],
      events: [
        { name: 'Greeting', timestamp: '00:22', type: 'green' as const },
        { name: 'Greeting', timestamp: '00:23', type: 'green' as const },
        { name: 'Build Rapport', timestamp: '00:23', type: 'blue' as const },
        { name: 'Website Issue', timestamp: '00:34', type: 'blue' as const },
        { name: 'Website Issue', timestamp: '00:38', type: 'blue' as const },
        { name: 'Dissatisfaction', timestamp: '00:39', type: 'red' as const },
        { name: 'Oh, I\'m sorry. You\'re having a pr...', timestamp: '00:43', type: 'green' as const },
        { name: 'Express Empathy', timestamp: '00:44', type: 'blue' as const }
      ]
    },
    timeline: [
      { timestamp: '10:14:34', event: 'Outbound Call Started', description: 'AI agent initiated call to prospect', type: 'incoming' as const },
      { timestamp: '10:14:46', event: 'Contact Answered', description: 'Prospect picked up the call', type: 'connected' as const, duration: '12s' },
      { timestamp: '10:15:12', event: 'Opening Pitch', description: 'Delivered value proposition and company introduction', type: 'system' as const },
      { timestamp: '10:16:05', event: 'Interest Expressed', description: 'Prospect showed interest in the solution', type: 'system' as const, duration: '53s' },
      { timestamp: '10:17:18', event: 'Demo Requested', description: 'Prospect asked for product demonstration', type: 'transfer' as const },
      { timestamp: '10:18:35', event: 'Appointment Scheduled', description: 'Demo booked for Tuesday 2PM EST', type: 'resolution' as const }
    ],
    qualitySummary: {
      overallScore: 85,
      categories: [
        { name: 'Rapport Building', score: 9, maxScore: 10, color: 'bg-green-400' },
        { name: 'Value Communication', score: 8, maxScore: 10, color: 'bg-blue-400' },
        { name: 'Objection Handling', score: 10, maxScore: 10, color: 'bg-green-400' },
        { name: 'Call Efficiency', score: 7, maxScore: 10, color: 'bg-yellow-400' },
        { name: 'Prospect Interest', score: 9, maxScore: 10, color: 'bg-green-400' },
        { name: 'Closing Technique', score: 8, maxScore: 10, color: 'bg-cyan-400' }
      ],
      improvements: [
        { area: 'Urgency Creation', suggestion: 'Add time-sensitive offers to increase immediate interest', priority: 'high' as const },
        { area: 'Pain Point Discovery', suggestion: 'Ask more probing questions about current challenges', priority: 'medium' as const },
        { area: 'Competitive Positioning', suggestion: 'Highlight unique advantages over competitors earlier', priority: 'medium' as const }
      ],
      strengths: [
        'Strong opening that captured prospect attention immediately',
        'Clear value proposition delivered with confidence',
        'Excellent objection handling and reframing techniques',
        'Natural conversation flow without sounding scripted',
        'Successfully moved prospect to next stage of sales funnel'
      ]
    },
    auditTrail: [
      { timestamp: '2025-02-24 10:14:34', user: 'SYSTEM', action: 'OUTBOUND_INITIATED', details: 'Outbound call started to +1 201-232-1152', system: 'DIALER-01' },
      { timestamp: '2025-02-24 10:14:46', user: 'SYSTEM', action: 'CALL_CONNECTED', details: 'Prospect answered the call', system: 'PBX-01' },
      { timestamp: '2025-02-24 10:14:47', user: 'AI Agent', action: 'GREETING_DELIVERED', details: 'Opening script executed successfully', system: 'AI-ENGINE' },
      { timestamp: '2025-02-24 10:15:12', user: 'AI Agent', action: 'PITCH_DELIVERED', details: 'Value proposition presented to prospect', system: 'AI-ENGINE' },
      { timestamp: '2025-02-24 10:16:05', user: 'SYSTEM', action: 'INTEREST_DETECTED', details: 'Prospect engagement level: HIGH', system: 'AI-ANALYTICS' },
      { timestamp: '2025-02-24 10:17:18', user: 'AI Agent', action: 'DEMO_REQUESTED', details: 'Prospect asked for product demonstration', system: 'AI-ENGINE' },
      { timestamp: '2025-02-24 10:17:25', user: 'AI Agent', action: 'CALENDAR_ACCESSED', details: 'Scheduling system integrated for booking', system: 'CALENDAR-API' },
      { timestamp: '2025-02-24 10:18:30', user: 'AI Agent', action: 'APPOINTMENT_BOOKED', details: 'Demo scheduled for Tuesday 2PM EST', system: 'CRM-DB' },
      { timestamp: '2025-02-24 10:18:35', user: 'SYSTEM', action: 'CALL_COMPLETED', details: 'Successful outcome: Appointment scheduled', system: 'DIALER-01' }
    ],
    customerJourney: {
      touchpoints: [
        { date: '2025-02-24', type: 'OUTBOUND', channel: 'Phone', outcome: 'Demo appointment scheduled', status: 'positive' as const },
        { date: '2025-02-20', type: 'OUTBOUND', channel: 'Phone', outcome: 'Initial contact - showed interest', status: 'positive' as const },
        { date: '2025-02-18', type: 'MARKETING', channel: 'Email', outcome: 'Opened email campaign', status: 'neutral' as const },
        { date: '2025-02-15', type: 'MARKETING', channel: 'LinkedIn', outcome: 'Profile viewed', status: 'neutral' as const },
        { date: '2025-02-10', type: 'LEAD_GEN', channel: 'Website', outcome: 'Downloaded whitepaper', status: 'positive' as const }
      ],
      satisfaction: [
        { date: '2025-02-24', score: 8, feedback: 'Professional and informative call' },
        { date: '2025-02-20', score: 7, feedback: 'Interesting but need more details' }
      ],
      issues: [
        { date: '2025-02-24', issue: 'Requested pricing information', resolution: 'Demo scheduled to discuss pricing options', status: 'pending' as const },
        { date: '2025-02-20', issue: 'Concerns about implementation timeline', resolution: 'Provided case studies and timeline examples', status: 'resolved' as const }
      ]
    }
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-yellow-400 border-b-2 sm:border-b-4 border-black px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              size="icon"
              variant="default"
              className="w-12 h-12 bg-orange-600 hover:bg-orange-700 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]"
            >
              <UilPhone className="h-6 w-6 text-white" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-3xl font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                LIVE CALL MONITORING
              </h1>
              <p className="text-sm sm:text-base text-black font-bold">
                Real-time insights • AI-powered analytics • Performance optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              variant="default"
              className="bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] text-black font-black uppercase"
            >
              <UilInfoCircle className="w-4 h-4 mr-1" />
              HELP
            </Button>
            <div className="w-3 h-3 bg-green-400 border-2 border-black animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b-2 sm:border-b-4 border-black px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <select 
              className="px-2 py-1 sm:px-3 sm:py-2 border-2 border-black font-bold uppercase text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(0,82,255)] shadow-[2px_2px_0_rgba(0,0,0,1)] flex-1 sm:flex-none"
              value={selectedFilters.numbers}
              onChange={(e) => setSelectedFilters({...selectedFilters, numbers: e.target.value})}
            >
              <option value="">NUMBERS</option>
              {mockPhoneNumbers.map((number) => (
                <option key={number.id} value={number.number}>
                  {number.displayName} ({number.number})
                </option>
              ))}
            </select>
            <select 
              className="px-2 py-1 sm:px-3 sm:py-2 border-2 border-black font-bold uppercase text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(0,82,255)] shadow-[2px_2px_0_rgba(0,0,0,1)] flex-1 sm:flex-none"
              value={selectedFilters.agents}
              onChange={(e) => setSelectedFilters({...selectedFilters, agents: e.target.value})}
            >
              <option value="">AGENTS</option>
            </select>
            <select 
              className="px-2 py-1 sm:px-3 sm:py-2 border-2 border-black font-bold uppercase text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(0,82,255)] shadow-[2px_2px_0_rgba(0,0,0,1)] flex-1 sm:flex-none"
              value={selectedFilters.teams}
              onChange={(e) => setSelectedFilters({...selectedFilters, teams: e.target.value})}
            >
              <option value="">TEAMS</option>
            </select>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button 
              onClick={() => setShowKPIs(!showKPIs)}
              className="flex items-center gap-1 sm:gap-2 font-bold uppercase text-xs sm:text-sm"
            >
              <div className={cn(
                "relative inline-flex h-5 w-9 sm:h-6 sm:w-12 items-center border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all",
                showKPIs ? "bg-green-400" : "bg-gray-300"
              )}>
                <span className={cn(
                  "inline-block h-3 w-3 sm:h-4 sm:w-4 transform bg-white border-2 border-black transition-transform",
                  showKPIs ? "translate-x-4 sm:translate-x-6" : "translate-x-0.5 sm:translate-x-1"
                )} />
              </div>
              <span className="hidden sm:inline">SHOW KPIS</span>
              <span className="sm:hidden">KPIS</span>
            </button>
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-2 py-1 sm:px-3 sm:py-2 pr-6 sm:pr-8 border-2 border-black font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(0,82,255)] shadow-[2px_2px_0_rgba(0,0,0,1)] appearance-none bg-white"
              >
                <option value="last24h">24h</option>
                <option value="lasthour">1h</option>
                <option value="today">Today</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                <UilAngleDown className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Section */}
      {showKPIs && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-orange-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              title="SLA PERFORMANCE"
              value={`${slaPercentage}%`}
              icon={<UilChart className="h-5 w-5 text-white" />}
              iconBgColor="bg-green-600"
              bgGradient="from-green-50 to-green-100"
              progress={slaPercentage}
              trend={{
                value: "+2.3%",
                type: "positive",
                label: "vs yesterday"
              }}
            />

            <StatCard
              title="TOTAL CALLS TODAY"
              value={totalCalls}
              subtitle={`↗️ Inbound: ${inbound} | ↗️ Outbound: ${outbound}`}
              icon={<UilPhone className="h-5 w-5 text-white" />}
              iconBgColor="bg-blue-600"
              bgGradient="from-blue-50 to-blue-100"
              trend={{
                value: "+12%",
                type: "positive",
                label: "vs yesterday"
              }}
            />

            <StatCard
              title="CONNECTION RATE"
              value={`${Math.round((answered / (answered + unanswered)) * 100)}%`}
              subtitle={`✅ ${answered} Connected | ❌ ${unanswered} Missed`}
              icon={<UilPhoneVolume className="h-5 w-5 text-white" />}
              iconBgColor="bg-purple-600"
              bgGradient="from-purple-50 to-purple-100"
              progress={Math.round((answered / (answered + unanswered)) * 100)}
            />

            <StatCard
              title="AVG RESPONSE TIME"
              value={avgTimeToAnswer}
              subtitle={`⚡ Fastest: 3s | 🐌 Longest: ${longestWaiting}`}
              icon={<UilClock className="h-5 w-5 text-white" />}
              iconBgColor="bg-orange-600"
              bgGradient="from-orange-50 to-orange-100"
              trend={{
                value: "-15s",
                type: "positive",
                label: "improvement"
              }}
            />

            <StatCard
              title="ACTIVE QUEUE"
              value={callsWaiting}
              subtitle={`🤖 ${availableUsers} AI Agents Available`}
              icon={<UilUsersAlt className="h-5 w-5 text-white" />}
              iconBgColor="bg-red-600"
              bgGradient="from-red-50 to-red-100"
              status={{
                label: "Optimal",
                color: "bg-green-400"
              }}
            />

          </div>
        </div>
      )}

      {/* Performance Tips Section */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform -rotate-1 bg-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm"
                  variant="default"
                  className="w-8 h-8 bg-yellow-400 hover:bg-yellow-500 border-2 border-black flex-shrink-0"
                >
                  <UilTachometerFast className="h-4 w-4 text-black" />
                </Button>
                <div className="flex-1">
                  <h4 className="font-black uppercase text-sm mb-2">PERFORMANCE TIP</h4>
                  <p className="text-xs text-gray-700">
                    Peak call times are 10-11AM and 2-4PM local time. Schedule campaigns during these windows for 40% better connection rates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-cyan-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm"
                  variant="default"
                  className="w-8 h-8 bg-cyan-400 hover:bg-cyan-500 border-2 border-black flex-shrink-0"
                >
                  <UilRobot className="h-4 w-4 text-black" />
                </Button>
                <div className="flex-1">
                  <h4 className="font-black uppercase text-sm mb-2">AI INSIGHT</h4>
                  <p className="text-xs text-gray-700">
                    Your agents are performing 15% above average today. Consider scaling up successful campaigns to maximize results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1 bg-pink-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm"
                  variant="default"
                  className="w-8 h-8 bg-pink-400 hover:bg-pink-500 border-2 border-black flex-shrink-0"
                >
                  <UilAnalytics className="h-4 w-4 text-black" />
                </Button>
                <div className="flex-1">
                  <h4 className="font-black uppercase text-sm mb-2">QUICK ACTION</h4>
                  <p className="text-xs text-gray-700">
                    3 high-quality leads are waiting for follow-up calls. Review them in the Agent Analytics tab for immediate action.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
          {/* Tabs */}
          <div className="border-b-2 sm:border-b-4 border-black bg-gray-100">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('calls');
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'calls');
                  window.history.pushState({}, '', url.toString());
                }}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-3 border-r-2 border-black font-black uppercase transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0",
                  activeTab === 'calls' 
                    ? "bg-[rgb(0,82,255)] text-white" 
                    : "bg-gray-100 text-black hover:bg-gray-200"
                )}
              >
                <UilPhone className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                CALLS
              </button>
              <button
                onClick={() => {
                  setActiveTab('agents');
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'agents');
                  window.history.pushState({}, '', url.toString());
                }}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-3 border-r-2 border-black font-black uppercase transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0",
                  activeTab === 'agents' 
                    ? "bg-[rgb(0,82,255)] text-white" 
                    : "bg-gray-100 text-black hover:bg-gray-200"
                )}
              >
                <UilUserCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                AGENTS
              </button>
              <button
                onClick={() => {
                  setActiveTab('numbers');
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'numbers');
                  window.history.pushState({}, '', url.toString());
                }}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-3 border-r-2 border-black font-black uppercase transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0",
                  activeTab === 'numbers' 
                    ? "bg-[rgb(0,82,255)] text-white" 
                    : "bg-gray-100 text-black hover:bg-gray-200"
                )}
              >
                <UilListUl className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                NUMBERS
              </button>
              <button
                onClick={() => {
                  setActiveTab('swarm');
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'swarm');
                  window.history.pushState({}, '', url.toString());
                }}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-3 border-r-2 border-black font-black uppercase transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0",
                  activeTab === 'swarm' 
                    ? "bg-[rgb(0,82,255)] text-white" 
                    : "bg-gray-100 text-black hover:bg-gray-200"
                )}
              >
                <UilUsersAlt className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                SWARM
              </button>
            </div>
          </div>

          {/* Filter info */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-yellow-400 border-b-2 sm:border-b-4 border-black flex items-center justify-between">
            <button className="font-bold uppercase flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              {activeTab === 'calls' ? 'FILTER LIVE CALLS' : 
               activeTab === 'agents' ? 'FILTER AGENTS' :
               activeTab === 'swarm' ? 'FILTER SWARM CAMPAIGNS' : 'FILTER NUMBERS'} <UilAngleDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <Badge className="bg-black text-white font-black uppercase px-2 sm:px-3 py-1 text-xs sm:text-sm">
              {activeTab === 'calls' ? '3 LIVE CALLS' : 
               activeTab === 'agents' ? '2 AGENTS' :
               activeTab === 'swarm' ? '8 ACTIVE SWARMS' : `${mockPhoneNumbers.length} NUMBERS`}
            </Badge>
          </div>

          {/* Table */}
          {activeTab === 'agents' && (
            <div>
              {/* Mobile: Card Layout */}
              <div className="sm:hidden space-y-3 p-3">
                {mockAgents.map((agent, index) => (
                  <div 
                    key={agent.id} 
                    onClick={() => handleRowClick(agent)}
                    className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] cursor-pointer hover:bg-yellow-100 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-3 border-b-2 border-black bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-pink-400 border-2 border-black flex items-center justify-center font-black text-white">
                            {agent.agent.charAt(0).toUpperCase()}
                          </div>
                          {agent.status === 'online' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border border-black" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-sm">{agent.agent.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600">{agent.agent.split(' ').slice(1).join(' ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "px-2 py-1 border border-black font-bold uppercase text-xs",
                          agent.status === 'online' ? "bg-green-400 text-black" :
                          agent.status === 'available' ? "bg-blue-400 text-white" :
                          "bg-gray-400 text-white"
                        )}>
                          {agent.status}
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="font-black text-lg text-blue-600">{agent.outbound}</div>
                            <div className="text-xs text-gray-600 font-bold">OUTBOUND</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-green-600">{agent.answeredInbound}</div>
                            <div className="text-xs text-gray-600 font-bold">ANSWERED</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-purple-600">{agent.pickedUp}</div>
                            <div className="text-xs text-gray-600 font-bold">PICKED UP</div>
                          </div>
                          {agent.notPickedUp > 0 && (
                            <div className="text-center">
                              <div className="font-black text-lg text-red-600">{agent.notPickedUp}</div>
                              <div className="text-xs text-gray-600 font-bold">MISSED</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {agent.convexEntryPoint && (
                            <div className="text-xs bg-violet-400 text-white px-2 py-1 border border-black font-bold">
                              {agent.convexEntryPoint}
                            </div>
                          )}
                          <div className="flex gap-1">
                            {agent.onMobile && (
                              <div className="w-5 h-5 bg-cyan-400 border border-black flex items-center justify-center">
                                <span className="text-xs font-bold">M</span>
                              </div>
                            )}
                            {agent.onDesktop && (
                              <div className="w-5 h-5 bg-purple-400 border border-black flex items-center justify-center">
                                <span className="text-xs font-bold text-white">D</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-black bg-gray-100">
                      <th className="text-left p-4 font-black uppercase text-sm">USER</th>
                      <th className="text-center p-4 font-black uppercase text-sm">OUTBOUND <UilAngleDown className="h-3 w-3 inline" /></th>
                      <th className="text-center p-4 font-black uppercase text-sm">ANSWERED INBOUND</th>
                      <th className="text-center p-4 font-black uppercase text-sm">🎧 PICKED-UP</th>
                      <th className="text-center p-4 font-black uppercase text-sm">❌ NOT PICKED-UP</th>
                      <th className="text-right p-4 font-black uppercase text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAgents.map((agent, index) => (
                      <tr 
                        key={agent.id} 
                        onClick={() => handleRowClick(agent)}
                        className={cn(
                          "border-b-2 border-black cursor-pointer hover:bg-yellow-100 transition-colors",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-pink-400 border-2 border-black flex items-center justify-center font-black text-white">
                                {agent.agent.charAt(0).toUpperCase()}
                              </div>
                              {agent.status === 'online' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-black" />
                              )}
                            </div>
                            <span className="font-bold">{agent.agent}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-black text-lg">{agent.outbound}</td>
                        <td className="p-4 text-center font-black text-lg">{agent.answeredInbound}</td>
                        <td className="p-4 text-center font-black text-lg">{agent.pickedUp}</td>
                        <td className="p-4 text-center font-black text-lg">{agent.notPickedUp}</td>
                        <td className="p-4 text-right">
                          <div className="space-y-1">
                            {agent.convexEntryPoint && (
                              <Badge className="bg-violet-400 text-white border-2 border-black font-bold uppercase text-xs">
                                CONVEX: {agent.convexEntryPoint}
                              </Badge>
                            )}
                            {agent.onMobile && (
                              <Badge className="bg-cyan-400 text-black border-2 border-black font-bold uppercase text-xs">
                                ON MOBILE • 16M
                              </Badge>
                            )}
                            {agent.onDesktop && (
                              <Badge className="bg-purple-400 text-white border-2 border-black font-bold uppercase text-xs ml-2">
                                ON DESKTOP • 4:49M
                              </Badge>
                            )}
                            {agent.status === 'available' && (
                              <Badge className="bg-green-400 text-black border-2 border-black font-bold uppercase text-xs">
                                AVAILABLE • 1H 41M
                              </Badge>
                            )}
                            {agent.status === 'offline' && (
                              <Badge className="bg-gray-400 text-white border-2 border-black font-bold uppercase text-xs">
                                OFFLINE • 4:49M
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div>
              {/* Mobile: Card Layout */}
              <div className="sm:hidden space-y-3 p-3">
                {mockLiveCalls.map((call, index) => (
                  <div 
                    key={call.callId} 
                    onClick={() => handleLiveCallClick(call)}
                    className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] cursor-pointer hover:bg-yellow-100 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-3 border-b-2 border-black bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-400 border-2 border-black flex items-center justify-center font-black text-white">
                            {call.agentName.charAt(0).toUpperCase()}
                          </div>
                          {call.status === 'connected' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border border-black" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-sm">{call.agentName.split(' ')[0]}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "px-2 py-1 border border-black font-bold uppercase text-xs",
                          getStatusBadgeColorLive(call.status)
                        )}>
                          {call.status}
                        </div>
                      </div>
                    </div>
                    {/* Stats Row */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-pink-400 border-2 border-black flex items-center justify-center font-black text-white text-lg mx-auto mb-1">
                              {call.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-600 font-bold">CUSTOMER</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-green-600">{formatDuration(call.duration)}</div>
                            <div className="text-xs text-gray-600 font-bold">DURATION</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-purple-600">{call.currentPhase}</div>
                            <div className="text-xs text-gray-600 font-bold">PHASE</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {call.isRecording && (
                            <div className="w-5 h-5 bg-red-500 border border-black flex items-center justify-center">
                              <UilCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div className="w-5 h-5 bg-blue-400 border border-black flex items-center justify-center">
                            <UilPhone className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-black bg-gray-100">
                      <th className="text-left p-4 font-black uppercase text-sm">STATUS</th>
                      <th className="text-left p-4 font-black uppercase text-sm">AI AGENT</th>
                      <th className="text-left p-4 font-black uppercase text-sm">PROSPECT</th>
                      <th className="text-center p-4 font-black uppercase text-sm">
                        <UilClock className="h-4 w-4 inline mr-1" />DURATION
                      </th>
                      <th className="text-center p-4 font-black uppercase text-sm">CALL PHASE</th>
                      <th className="text-center p-4 font-black uppercase text-sm">CAMPAIGN</th>
                      <th className="text-right p-4 font-black uppercase text-sm">LIVE ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLiveCalls.map((call, index) => (
                      <tr 
                        key={call.callId} 
                        onClick={() => handleLiveCallClick(call)}
                        className={cn(
                          "border-b-2 border-black cursor-pointer hover:bg-yellow-100 transition-colors",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="p-4">
                          <Badge className={cn("border-2 border-black font-bold uppercase text-xs", getStatusBadgeColorLive(call.status))}>
                            {call.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-400 border-2 border-black flex items-center justify-center font-black text-white text-xs">
                              AI
                            </div>
                            <div className="font-bold">{call.agentName}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-400 border-2 border-black flex items-center justify-center font-black text-white text-xs">
                              {call.customerName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold">{call.customerName}</div>
                              <div className="text-xs text-gray-600">{call.customerPhone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-black text-lg text-green-600">{formatDuration(call.duration)}</div>
                          <div className="text-xs text-gray-600">ACTIVE</div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className="bg-purple-400 text-white border-2 border-black font-bold uppercase text-xs">
                            {call.currentPhase}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-sm font-bold">{call.campaignName}</div>
                          <div className="text-xs text-gray-600">OUTBOUND</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            {call.isRecording && (
                              <Badge className="bg-red-500 text-white border-2 border-black font-bold uppercase text-xs flex items-center gap-1">
                                <UilCircle className="h-3 w-3" />
                                REC
                              </Badge>
                            )}
                            <Badge className="bg-green-500 text-white border-2 border-black font-bold uppercase text-xs flex items-center gap-1 animate-pulse">
                              <UilPhone className="h-3 w-3" />
                              LIVE
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {mockLiveCalls.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-300 border-4 border-black mx-auto mb-4 flex items-center justify-center">
                    <UilPhone className="h-10 w-10 text-black" />
                  </div>
                  <p className="font-black uppercase text-xl">NO ACTIVE CALLS</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'numbers' && (
            <div>
              {/* Mobile: Card Layout */}
              <div className="sm:hidden space-y-3 p-3">
                {mockPhoneNumbers.map((number, index) => (
                  <div 
                    key={number.id} 
                    className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] cursor-pointer hover:bg-yellow-100 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-3 border-b-2 border-black bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-cyan-400 border-2 border-black flex items-center justify-center font-black text-white text-lg">
                            {getNumberTypeIcon(number.type)}
                          </div>
                          {number.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border border-black" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-sm">{number.displayName}</div>
                          <div className="text-xs text-gray-600">{number.number}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "px-2 py-1 border border-black font-bold uppercase text-xs",
                          getNumberStatusBadgeColor(number.status)
                        )}>
                          {number.status}
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="font-black text-lg text-blue-600">{number.callsToday}</div>
                            <div className="text-xs text-gray-600 font-bold">TODAY</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-green-600">{number.successRate}%</div>
                            <div className="text-xs text-gray-600 font-bold">SUCCESS</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-purple-600">{number.avgCallDuration}</div>
                            <div className="text-xs text-gray-600 font-bold">AVG CALL</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Badge className={cn(
                            "border border-black font-bold uppercase text-xs",
                            number.type === 'sip' ? "bg-purple-400 text-white" :
                            number.type === 'pstn' ? "bg-blue-400 text-white" :
                            "bg-gray-400 text-black"
                          )}>
                            {number.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-black bg-gray-100">
                      <th className="text-left p-4 font-black uppercase text-sm">NUMBER</th>
                      <th className="text-center p-4 font-black uppercase text-sm">CALLS TODAY</th>
                      <th className="text-center p-4 font-black uppercase text-sm">SUCCESS RATE</th>
                      <th className="text-center p-4 font-black uppercase text-sm">📞 TOTAL CALLS</th>
                      <th className="text-center p-4 font-black uppercase text-sm">⏱️ AVG DURATION</th>
                      <th className="text-right p-4 font-black uppercase text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPhoneNumbers.map((number, index) => (
                      <tr 
                        key={number.id} 
                        className={cn(
                          "border-b-2 border-black cursor-pointer hover:bg-yellow-100 transition-colors",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-cyan-400 border-2 border-black flex items-center justify-center font-black text-white">
                                {getNumberTypeIcon(number.type)}
                              </div>
                              {number.status === 'active' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-black" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold">{number.displayName}</span>
                              <div className="text-xs text-gray-600">{number.number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-black text-lg">{number.callsToday}</td>
                        <td className="p-4 text-center font-black text-lg">{number.successRate}%</td>
                        <td className="p-4 text-center font-black text-lg">{number.callsThisMonth}</td>
                        <td className="p-4 text-center font-black text-lg">{number.avgCallDuration}</td>
                        <td className="p-4 text-right">
                          <div className="space-y-1">
                            <Badge className={cn(
                              "border-2 border-black font-bold uppercase text-xs",
                              number.type === 'sip' ? "bg-purple-400 text-white" :
                              number.type === 'pstn' ? "bg-blue-400 text-white" :
                              "bg-gray-400 text-black"
                            )}>
                              {number.type.toUpperCase()}
                            </Badge>
                            {number.assignedUser && (
                              <Badge className="bg-pink-400 text-black border-2 border-black font-bold uppercase text-xs ml-2">
                                {number.assignedUser.split(' ')[0]}
                              </Badge>
                            )}
                            <Badge className={cn(
                              "bg-green-400 text-black border-2 border-black font-bold uppercase text-xs",
                              getNumberStatusBadgeColor(number.status)
                            )}>
                              {number.status} • {number.lastUsed}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'swarm' && (
            <div>
              {/* Mobile: Card Layout */}
              <div className="sm:hidden space-y-3 p-3">
                {mockSwarmCampaigns.map((swarm, index) => (
                  <div 
                    key={swarm.id} 
                    onClick={() => handleSwarmClick(swarm)}
                    className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] cursor-pointer hover:bg-yellow-100 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-3 border-b-2 border-black bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-purple-400 border-2 border-black flex items-center justify-center font-black text-white">
                            <UilUsersAlt className="h-5 w-5" />
                          </div>
                          {swarm.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border border-black" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-sm">{swarm.name}</div>
                          <div className="text-xs text-gray-600">{swarm.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "px-2 py-1 border border-black font-bold uppercase text-xs",
                          swarm.status === 'active' ? "bg-green-400 text-black" :
                          swarm.status === 'paused' ? "bg-yellow-400 text-black" :
                          "bg-gray-400 text-white"
                        )}>
                          {swarm.status}
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="font-black text-lg text-blue-600">{swarm.activeAgents}</div>
                            <div className="text-xs text-gray-600 font-bold">AGENTS</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-green-600">{swarm.totalCalls}</div>
                            <div className="text-xs text-gray-600 font-bold">CALLS</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-purple-600">{swarm.successRate}%</div>
                            <div className="text-xs text-gray-600 font-bold">SUCCESS</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Badge className={cn(
                            "border border-black font-bold uppercase text-xs",
                            swarm.purpose === 'Discovery' ? "bg-purple-400 text-white" :
                            swarm.purpose === 'Support' ? "bg-green-400 text-black" :
                            swarm.purpose === 'Appointment' ? "bg-orange-400 text-black" :
                            "bg-cyan-400 text-black"
                          )}>
                            {swarm.purpose}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-black bg-gray-100">
                      <th className="text-left p-4 font-black uppercase text-sm">SWARM CAMPAIGN</th>
                      <th className="text-center p-4 font-black uppercase text-sm">ACTIVE AGENTS</th>
                      <th className="text-center p-4 font-black uppercase text-sm">TOTAL CALLS</th>
                      <th className="text-center p-4 font-black uppercase text-sm">SUCCESS RATE</th>
                      <th className="text-center p-4 font-black uppercase text-sm">PURPOSE</th>
                      <th className="text-right p-4 font-black uppercase text-sm">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSwarmCampaigns.map((swarm, index) => (
                      <tr 
                        key={swarm.id} 
                        onClick={() => handleSwarmClick(swarm)}
                        className={cn(
                          "border-b-2 border-black cursor-pointer hover:bg-yellow-100 transition-colors",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-purple-400 border-2 border-black flex items-center justify-center font-black text-white">
                                <UilUsersAlt className="h-5 w-5" />
                              </div>
                              {swarm.status === 'active' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-black" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{swarm.name}</div>
                              <div className="text-xs text-gray-600">{swarm.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-black text-lg text-blue-600">{swarm.activeAgents}</div>
                          <div className="text-xs text-gray-600">of {swarm.totalAgents}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-black text-lg text-green-600">{swarm.totalCalls}</div>
                          <div className="text-xs text-gray-600">total</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-black text-lg text-purple-600">{swarm.successRate}%</div>
                          <div className="text-xs text-gray-600">success</div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={cn(
                            "border-2 border-black font-bold uppercase text-xs",
                            swarm.purpose === 'Discovery' ? "bg-purple-400 text-white" :
                            swarm.purpose === 'Support' ? "bg-green-400 text-black" :
                            swarm.purpose === 'Appointment' ? "bg-orange-400 text-black" :
                            "bg-cyan-400 text-black"
                          )}>
                            {swarm.purpose}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="space-y-1">
                            <Badge className={cn(
                              "border-2 border-black font-bold uppercase text-xs",
                              swarm.status === 'active' ? "bg-green-400 text-black" :
                              swarm.status === 'paused' ? "bg-yellow-400 text-black" :
                              "bg-gray-400 text-white"
                            )}>
                              {swarm.status}
                            </Badge>
                            <div className="text-xs text-gray-600">
                              Created: {new Date(swarm.created).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Feedback button */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6">
          <Button 
            variant="default"
            size="sm"
            className="bg-violet-400 hover:bg-violet-500 text-black font-black uppercase border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all text-xs sm:text-sm px-2 sm:px-4"
          >
            <UilCommentAlt className="h-3 w-3 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">SHARE YOUR FEEDBACK</span>
            <span className="sm:hidden ml-1">FEEDBACK</span>
          </Button>
        </div>
      </div>

      {/* Call Analytics Modal */}
      {selectedAgentForAnalytics && (
        <CallAnalyticsModal
          isOpen={showCallAnalyticsModal}
          onClose={closeCallAnalyticsModal}
          data={getCallAnalyticsData(selectedAgentForAnalytics)}
        />
      )}
      
      {/* Live Call Monitor Modal */}
      {selectedLiveCall && (
        <LiveCallMonitorModal
          isOpen={showLiveCallModal}
          onClose={closeLiveCallModal}
          callData={selectedLiveCall}
        />
      )}
      
      {/* Swarm Overview Modal */}
      {selectedSwarm && (
        <SwarmOverviewModal
          isOpen={showSwarmModal}
          onClose={closeSwarmModal}
          swarmData={selectedSwarm}
        />
      )}
    </div>
  );
}

// MOCK: Live calls data
const mockLiveCalls = [
  {
    callId: 'live_001',
    agentName: 'AI Agent Sarah',
    customerName: 'Michael Chen',
    customerPhone: '+1 415-555-0123',
    status: 'connected' as const,
    duration: 127, // seconds
    campaignName: 'Q1 Sales Outreach',
    startTime: '2:14 PM',
    currentPhase: 'Pitch Delivery',
    isRecording: true,
    agentGain: 65,
    customerGain: 45,
    currentSpeaker: 'agent' as const,
    recentTranscript: [
      { timestamp: '2:15', speaker: 'agent' as const, text: 'Our AI solution can reduce your call center costs by up to 40% while improving customer satisfaction.', sentiment: 'positive' as const },
      { timestamp: '2:16', speaker: 'customer' as const, text: 'That sounds interesting, but how does it handle complex customer issues?', sentiment: 'neutral' as const },
    ],
    callObjectives: [
      'Introduce AI voice solution benefits',
      'Address cost concerns',
      'Schedule product demonstration',
      'Qualify decision-making authority'
    ],
    nextActions: [
      'Provide ROI case studies',
      'Address technical implementation questions',
      'Propose trial period'
    ]
  },
  {
    callId: 'live_002',
    agentName: 'AI Agent David',
    customerName: 'Lisa Rodriguez',
    customerPhone: '+1 312-555-0456',
    status: 'ringing' as const,
    duration: 23,
    campaignName: 'Healthcare Leads',
    startTime: '2:16 PM',
    currentPhase: 'Connection Attempt',
    isRecording: false,
    agentGain: 20,
    customerGain: 15,
    currentSpeaker: null,
    recentTranscript: [],
    callObjectives: [
      'Connect with healthcare administrator',
      'Introduce HIPAA-compliant voice solution',
      'Discuss patient communication automation'
    ],
    nextActions: [
      'Wait for connection',
      'Deliver healthcare-focused opening'
    ]
  },
  {
    callId: 'live_003',
    agentName: 'AI Agent Emma',
    customerName: 'Robert Kim',
    customerPhone: '+1 206-555-0789',
    status: 'on-hold' as const,
    duration: 312,
    campaignName: 'Enterprise Follow-up',
    startTime: '2:11 PM',
    currentPhase: 'Waiting for Decision Maker',
    isRecording: true,
    agentGain: 25,
    customerGain: 20,
    currentSpeaker: null,
    recentTranscript: [
      { timestamp: '2:14', speaker: 'customer' as const, text: 'Let me put you on hold while I get our IT director on the line.', sentiment: 'positive' as const },
      { timestamp: '2:13', speaker: 'agent' as const, text: 'Perfect! I\'d love to discuss the technical integration with your IT team.', sentiment: 'positive' as const },
    ],
    callObjectives: [
      'Connect with IT decision maker',
      'Discuss technical requirements',
      'Present enterprise pricing options'
    ],
    nextActions: [
      'Engage IT director when available',
      'Present technical documentation',
      'Propose pilot program'
    ]
  }
];

// MOCK: Swarm campaigns data
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

const mockSwarmCampaigns: SwarmCampaign[] = [
  {
    id: '1',
    name: 'SALES BATTALION',
    description: 'Elite cold calling agents focused on B2B outreach',
    status: 'active',
    activeAgents: 2,
    totalAgents: 3,
    totalCalls: 1247,
    successRate: 68,
    purpose: 'Discovery',
    created: '2024-01-15'
  },
  {
    id: '2',
    name: 'SUPPORT SQUAD',
    description: 'Customer support specialists handling inbound queries',
    status: 'active',
    activeAgents: 2,
    totalAgents: 2,
    totalCalls: 892,
    successRate: 94,
    purpose: 'Support',
    created: '2024-01-20'
  },
  {
    id: '3',
    name: 'APPOINTMENT ARMY',
    description: 'Dedicated to scheduling and managing appointments',
    status: 'active',
    activeAgents: 1,
    totalAgents: 1,
    totalCalls: 423,
    successRate: 82,
    purpose: 'Appointment',
    created: '2024-01-01'
  },
  {
    id: '4',
    name: 'ENTERPRISE SALES BLITZ',
    description: 'High-value B2B prospects targeting Fortune 500 companies',
    status: 'active',
    activeAgents: 12,
    totalAgents: 15,
    totalCalls: 284,
    successRate: 85,
    purpose: 'Discovery',
    created: '2024-02-01'
  },
  {
    id: '5',
    name: 'HEALTHCARE OUTREACH',
    description: 'Medical facility decision makers for compliance solutions',
    status: 'active',
    activeAgents: 8,
    totalAgents: 10,
    totalCalls: 156,
    successRate: 92,
    purpose: 'Discovery',
    created: '2024-02-05'
  },
  {
    id: '6',
    name: 'SMB LEAD GENERATION',
    description: 'Small to medium business owners for productivity tools',
    status: 'paused',
    activeAgents: 0,
    totalAgents: 20,
    totalCalls: 432,
    successRate: 75,
    purpose: 'Discovery',
    created: '2024-01-28'
  },
  {
    id: '7',
    name: 'TECH STARTUP WARM LEADS',
    description: 'Pre-qualified startup founders from product demos',
    status: 'active',
    activeAgents: 6,
    totalAgents: 6,
    totalCalls: 89,
    successRate: 96,
    purpose: 'Follow-up',
    created: '2024-02-10'
  },
  {
    id: '8',
    name: 'E-COMMERCE FOLLOW-UP',
    description: 'Online retailers who downloaded our integration guide',
    status: 'stopped',
    activeAgents: 0,
    totalAgents: 8,
    totalCalls: 167,
    successRate: 89,
    purpose: 'Follow-up',
    created: '2024-01-25'
  }
];

// Helper functions
function getStatusBadgeColorLive(status: string) {
  switch (status) {
    case 'connected': return 'bg-green-400 text-black';
    case 'ringing': return 'bg-blue-400 text-white';
    case 'on-hold': return 'bg-yellow-400 text-black';
    case 'transferring': return 'bg-purple-400 text-white';
    default: return 'bg-gray-400 text-black';
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}