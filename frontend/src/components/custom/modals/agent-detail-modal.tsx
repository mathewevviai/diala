'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  UilRobot,
  UilBooks,
  UilBullseye,
  UilUsersAlt,
  UilTimes,
  UilInfoCircle,
  UilBookOpen,
  UilBrain,
  UilCheckCircle,
  UilFileSearchAlt,
  UilAnalytics,
  UilClipboardNotes,
  UilDollarSign,
  UilHeadphonesAlt,
  UilCalendarAlt,
  UilDesktop,
  UilSetting,
  UilPlay,
  UilPause,
  UilTrashAlt,
  UilEditAlt,
  UilPlus,
  UilYoutube,
  UilFileAlt,
  UilLinkAlt,
  UilDownloadAlt,
  UilUploadAlt,
  UilCog
} from '@tooni/iconscout-unicons-react';
import AnalyticsDashboardHeader from '@/components/custom/analytics/analytics-dashboard-header';
import ConversationQualityAnalysis from '@/components/custom/analytics/conversation-quality-analysis';

interface RAGWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'processing' | 'failed' | 'completed';
  progress: number;
  type: 'youtube' | 'documents' | 'urls' | 'mixed';
  stats: {
    embeddings: number;
    sources: number;
    focusAreas: number;
    lastUpdated: string;
  };
  parameters: {
    chunkSize: number;
    overlap: number;
    embeddingModel: string;
    vectorStore: string;
  };
  sources: Array<{
    id: string;
    url: string;
    type: 'youtube' | 'document' | 'url';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    metadata?: {
      title?: string;
      duration?: string;
      fileSize?: string;
    };
  }>;
}

interface TrainingConfig {
  chunkSize: number;
  overlap: number;
  embeddingModel: string;
  vectorStore: string;
  relevanceThreshold: number;
  maxResults: number;
  autoRetrain: boolean;
  retrainFrequency: 'daily' | 'weekly' | 'monthly';
}

interface AgentData {
  id: number;
  name: string;
  voice: string;
  language: string;
  purpose: string;
  status: 'active' | 'idle' | 'offline';
  performance: {
    totalCalls: number;
    successRate: number;
    avgDuration: string;
    satisfaction: number;
  };
  description: string;
  lastActive: string;
  systemPrompt?: string;
  ragSources?: {
      id: string;
      name: string;
      description: string;
  }[];
  ragWorkflows?: RAGWorkflow[];
  trainingConfig?: TrainingConfig;
  businessHunt?: {
      huntId: string;
      huntName: string;
      status: 'active' | 'paused' | 'completed';
      config: any;
  };
  swarmInfo?: {
      swarmId: string;
      swarmName: string;
      swarmPurpose: string;
  };
}

interface AgentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentData: AgentData;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ isOpen, onClose, agentData }) => {
  const [activeTab, setActiveTab] = React.useState('overview');
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-400 text-black';
      case 'idle': return 'bg-yellow-400 text-black';
      case 'offline': return 'bg-gray-400 text-black';
      case 'completed': return 'bg-blue-400 text-white';
      case 'paused': return 'bg-orange-400 text-black';
      default: return 'bg-gray-400 text-black';
    }
  };

  const performanceCards = [
    {
      value: agentData.performance.totalCalls,
      label: 'TOTAL CALLS',
      description: 'All time',
      color: 'text-blue-600',
      progressWidth: '100%',
    },
    {
      value: `${agentData.performance.successRate}%`,
      label: 'SUCCESS RATE',
      description: 'Objectives Met',
      color: 'text-green-600',
      progressWidth: `${agentData.performance.successRate}%`,
    },
    {
      value: agentData.performance.avgDuration,
      label: 'AVG DURATION',
      description: 'Per call',
      color: 'text-indigo-600',
      progressWidth: '70%',
    },
    {
      value: `${agentData.performance.satisfaction}/5`,
      label: 'SATISFACTION',
      description: 'Customer Rating',
      color: 'text-orange-600',
      progressWidth: `${(agentData.performance.satisfaction / 5) * 100}%`,
    },
  ];

  const overviewCards = [
    {
      value: agentData.performance.totalCalls,
      label: 'ACTIVE SESSIONS',
      description: 'Current',
      color: 'text-purple-600',
      progressWidth: '80%',
    },
    {
      value: agentData.lastActive,
      label: 'LAST ACTIVE',
      description: 'Time',
      color: 'text-blue-600',
      progressWidth: '100%',
    },
    {
      value: agentData.ragSources?.length || 0,
      label: 'KNOWLEDGE SOURCES',
      description: 'Connected',
      color: 'text-green-600',
      progressWidth: '60%',
    },
    {
      value: agentData.language,
      label: 'LANGUAGE',
      description: 'Primary',
      color: 'text-pink-600',
      progressWidth: '90%',
    },
  ];

  const trainingCards = [
    {
      value: agentData.ragSources?.length || 0,
      label: 'RAG SOURCES',
      description: 'Total',
      color: 'text-indigo-600',
      progressWidth: '100%',
    },
    {
      value: '24hrs',
      label: 'LAST TRAINED',
      description: 'Time',
      color: 'text-green-600',
      progressWidth: '75%',
    },
    {
      value: '98%',
      label: 'ACCURACY',
      description: 'Knowledge Base',
      color: 'text-blue-600',
      progressWidth: '98%',
    },
    {
      value: '2.1s',
      label: 'AVG RESPONSE',
      description: 'Speed',
      color: 'text-orange-600',
      progressWidth: '85%',
    },
  ];

  const campaignCards = [
    {
      value: agentData.businessHunt ? 1 : 0,
      label: 'ACTIVE CAMPAIGNS',
      description: 'Current',
      color: 'text-purple-600',
      progressWidth: '50%',
    },
    {
      value: '85%',
      label: 'CAMPAIGN SUCCESS',
      description: 'Rate',
      color: 'text-green-600',
      progressWidth: '85%',
    },
    {
      value: '150',
      label: 'LEADS GENERATED',
      description: 'Total',
      color: 'text-blue-600',
      progressWidth: '75%',
    },
    {
      value: '4.2/5',
      label: 'CAMPAIGN RATING',
      description: 'Average',
      color: 'text-orange-600',
      progressWidth: '84%',
    },
  ];

  const promptCards = [
    {
      value: agentData.systemPrompt ? '✓' : '✗',
      label: 'PROMPT STATUS',
      description: 'Active',
      color: 'text-purple-600',
      progressWidth: agentData.systemPrompt ? '100%' : '0%',
    },
    {
      value: '250',
      label: 'TOKEN COUNT',
      description: 'Current',
      color: 'text-blue-600',
      progressWidth: '50%',
    },
    {
      value: '3',
      label: 'VERSIONS',
      description: 'Total',
      color: 'text-green-600',
      progressWidth: '60%',
    },
    {
      value: '12hrs',
      label: 'LAST UPDATED',
      description: 'Time',
      color: 'text-orange-600',
      progressWidth: '70%',
    },
  ];

  const tabs = [
    { value: 'overview', label: 'Overview', icon: UilInfoCircle },
    { value: 'performance', label: 'Performance', icon: UilAnalytics },
    { value: 'training', label: 'Training', icon: UilBookOpen },
    { value: 'campaigns', label: 'Campaigns', icon: UilFileSearchAlt },
    { value: 'prompt', label: 'System Prompt', icon: UilClipboardNotes },
  ];
  if (agentData.swarmInfo) {
    tabs.push({ value: 'swarm', label: 'Swarm', icon: UilUsersAlt });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white border-0 sm:border-4 border-black shadow-none sm:shadow-[8px_8px_0_rgba(0,0,0,1)] w-full h-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b-2 sm:border-b-4 border-black bg-purple-500 text-white flex-shrink-0">
          {/* Mobile Header */}
          <div className="sm:hidden p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-black uppercase truncate">{agentData.name}</h2>
              <Button onClick={onClose} size="sm" className="w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black text-lg">×</Button>
            </div>
            <div className="bg-white border-2 border-black p-2 text-black">
              <div className="font-black text-sm mb-1 truncate">{agentData.purpose}</div>
              <div className="flex items-center justify-between text-xs">
                <span className={cn("px-2 py-1 border border-black text-xs font-bold uppercase", getStatusColor(agentData.status))}>{agentData.status}</span>
                <span className="text-gray-600">Last active: {agentData.lastActive}</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-400 border-2 border-black flex items-center justify-center">
                <UilRobot className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-black text-2xl uppercase">{agentData.name}</h2>
                  <Badge className={cn("border-2 border-black font-bold uppercase", getStatusColor(agentData.status))}>{agentData.status}</Badge>
                </div>
                <p className="font-bold">{agentData.purpose}</p>
              </div>
            </div>
            <Button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black text-xl px-3 py-2">×</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b-2 sm:border-b-4 border-black bg-black flex-shrink-0">
           {/* Mobile: Dropdown Tabs */}
           <div className="sm:hidden p-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-3 border-2 border-black font-bold uppercase text-sm bg-white focus:outline-none appearance-none"
            >
              {tabs.map(tab => <option key={tab.value} value={tab.value}>{tab.label}</option>)}
            </select>
          </div>
          
          {/* Desktop: Button Tabs */}
          <div className="hidden sm:block">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <Button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  variant="reverse"
                  size="lg"
                  className="whitespace-nowrap flex-shrink-0 border-0"
                  style={{ backgroundColor: activeTab === tab.value ? '' : 'white' }}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsDashboardHeader
                totalCalls={agentData.performance.totalCalls}
                title="AGENT OVERVIEW"
                subtitle={`Current status for ${agentData.name}`}
                bgColor="bg-white"
                cards={overviewCards}
              />
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                  <CardTitle className="font-black uppercase text-sm sm:text-base">Agent Details</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 text-sm space-y-2">
                   <p>{agentData.description}</p>
                   <div className="grid grid-cols-2 gap-2 pt-2">
                      <div><span className="font-bold">Voice:</span> {agentData.voice}</div>
                      <div><span className="font-bold">Language:</span> {agentData.language}</div>
                      <div><span className="font-bold">Last Active:</span> {agentData.lastActive}</div>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'performance' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsDashboardHeader
                totalCalls={agentData.performance.totalCalls}
                title="AGENT PERFORMANCE"
                subtitle={`Key metrics for ${agentData.name}`}
                bgColor="bg-white"
                cards={performanceCards}
              />
              
              {/* Call Performance Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversation Quality Metrics */}
                <ConversationQualityAnalysis 
                  title="CONVERSATION QUALITY METRICS"
                  bgColor="bg-blue-50"
                  iconBgColor="bg-blue-400"
                  metrics={[
                    {
                      label: "SCRIPT ADHERENCE",
                      value: 94,
                      percentage: 94,
                      color: "green",
                      description: "EXCELLENT"
                    },
                    {
                      label: "OBJECTIVE COMPLETION",
                      value: agentData.performance.successRate,
                      percentage: agentData.performance.successRate,
                      color: "blue",
                      description: "STRONG"
                    },
                    {
                      label: "CONVERSATION FLOW",
                      value: 88,
                      percentage: 88,
                      color: "purple",
                      description: "SMOOTH"
                    },
                    {
                      label: "RESPONSE QUALITY",
                      value: Math.round(agentData.performance.satisfaction * 20),
                      percentage: Math.round(agentData.performance.satisfaction * 20),
                      color: "orange",
                      description: "GOOD"
                    }
                  ]}
                />

                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">PERFORMANCE TRENDS</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Success Rate Trend</span>
                        <span className="text-green-600 font-bold text-xs">↗ +{Math.round(agentData.performance.successRate * 0.1)}% this week</span>
                      </div>
                      <div className="w-full bg-gray-300 border-2 border-black h-4">
                        <div className="h-full bg-green-400" style={{ width: `${agentData.performance.successRate}%` }}></div>
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

              {/* Call Flow Analysis & Objectives */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">OPTIMIZED CALL FLOW</h3>
                  <div className="space-y-4">
                    {[
                      { step: '1', phase: 'Opening & Rapport', description: 'Greeting and connection building', avgDuration: '45s' },
                      { step: '2', phase: 'Discovery Questions', description: 'Understanding needs and pain points', avgDuration: '2m 30s' },
                      { step: '3', phase: 'Solution Presentation', description: 'Tailored value proposition', avgDuration: '3m 15s' },
                      { step: '4', phase: 'Objection Handling', description: 'Address concerns and resistance', avgDuration: '1m 45s' },
                      { step: '5', phase: 'Closing & Next Steps', description: 'Commitment and follow-up', avgDuration: '1m 15s' }
                    ].map((phase, index) => (
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
                  <h3 className="font-black uppercase text-sm mb-4 text-gray-600">PERFORMANCE OBJECTIVES STATUS</h3>
                  <div className="space-y-4">
                    {[
                      'Maintain 85%+ conversation success rate',
                      'Complete discovery phase within 3 minutes',
                      'Handle objections with confidence',
                      'Achieve natural conversation flow',
                      'Follow company compliance guidelines'
                    ].map((objective, index) => (
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
                            {index < 3 ? "Consistently achieved in recent calls" : 
                             index < 4 ? "Needs improvement in some interactions" : 
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
                <h3 className="font-black uppercase text-sm mb-4 text-gray-600">ADVANCED PERFORMANCE ANALYTICS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h4 className="font-bold text-sm mb-3">CONVERSION FUNNEL</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Calls Made</span>
                        <span className="font-bold text-xs">{agentData.performance.totalCalls}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Connected</span>
                        <span className="font-bold text-xs">{Math.floor(agentData.performance.totalCalls * 0.85)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Interested</span>
                        <span className="font-bold text-xs">{Math.floor(agentData.performance.totalCalls * 0.68)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Qualified</span>
                        <span className="font-bold text-xs">{Math.floor(agentData.performance.totalCalls * 0.48)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                        <span className="text-xs font-bold">Converted</span>
                        <span className="font-black text-xs text-green-600">{Math.floor(agentData.performance.totalCalls * (agentData.performance.successRate / 100))}</span>
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
                        <span className="font-bold text-xs">4.2s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Call Duration</span>
                        <span className="font-bold text-xs">{agentData.performance.avgDuration}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                        <span className="text-xs font-bold">Efficiency Score</span>
                        <span className="font-black text-xs text-blue-600">92%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm mb-3">QUALITY METRICS</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Script Adherence</span>
                        <span className="font-bold text-xs">94%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Tone Quality</span>
                        <span className="font-bold text-xs">4.6/5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Information Accuracy</span>
                        <span className="font-bold text-xs">98%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Compliance Score</span>
                        <span className="font-bold text-xs">100%</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                        <span className="text-xs font-bold">Overall Rating</span>
                        <span className="font-black text-xs text-purple-600">{agentData.performance.satisfaction}/5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm mb-3">IMPROVEMENT AREAS</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Objection Handling</span>
                        <span className="font-bold text-xs text-yellow-600">Training</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Closing Techniques</span>
                        <span className="font-bold text-xs text-green-600">Strong</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Product Knowledge</span>
                        <span className="font-bold text-xs text-green-600">Expert</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Active Listening</span>
                        <span className="font-bold text-xs text-blue-600">Good</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                        <span className="text-xs font-bold">Focus Area</span>
                        <span className="font-black text-xs text-orange-600">Objections</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Performance Monitor */}
              <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <h3 className="font-black uppercase text-sm mb-4 text-gray-600">REAL-TIME PERFORMANCE MONITOR</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 border-2 border-black">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Current Status</span>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-lg font-black text-green-600">{agentData.status.toUpperCase()}</div>
                    <div className="text-xs text-gray-600">Last active: {agentData.lastActive}</div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border-2 border-black">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Today's Calls</span>
                      <UilAnalytics className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-black text-blue-600">{Math.floor(agentData.performance.totalCalls * 0.15)}</div>
                    <div className="text-xs text-gray-600">Target: {Math.floor(agentData.performance.totalCalls * 0.2)}</div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border-2 border-black">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Success Today</span>
                      <span className="text-xs font-bold text-purple-600">↗ +8%</span>
                    </div>
                    <div className="text-lg font-black text-purple-600">{Math.round(agentData.performance.successRate * 1.08)}%</div>
                    <div className="text-xs text-gray-600">Above average</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'training' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsDashboardHeader
                totalCalls={agentData.performance.totalCalls}
                title="TRAINING METRICS"
                subtitle={`Learning progress for ${agentData.name}`}
                bgColor="bg-white"
                cards={trainingCards}
              />
              
              {/* Training Configuration */}
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                  <CardTitle className="font-black uppercase flex items-center text-sm sm:text-base">
                    <UilCog className="h-5 w-5 mr-2" />Training Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-black uppercase">Chunk Size</label>
                        <span className="text-sm font-bold">{agentData.trainingConfig?.chunkSize || 512}</span>
                      </div>
                      <Slider
                        value={[agentData.trainingConfig?.chunkSize || 512]}
                        min={128}
                        max={1024}
                        step={64}
                        className="mb-1"
                      />
                      <p className="text-xs text-gray-600">Text chunk size for embeddings</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-black uppercase">Overlap</label>
                        <span className="text-sm font-bold">{agentData.trainingConfig?.overlap || 50}</span>
                      </div>
                      <Slider
                        value={[agentData.trainingConfig?.overlap || 50]}
                        min={0}
                        max={100}
                        step={5}
                        className="mb-1"
                      />
                      <p className="text-xs text-gray-600">Overlap between chunks</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-black uppercase mb-2 block">Embedding Model</label>
                      <select className="w-full px-3 py-2 border-2 border-black rounded-[3px] bg-white text-sm font-bold">
                        <option>text-embedding-ada-002</option>
                        <option>text-embedding-3-small</option>
                        <option>text-embedding-3-large</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-black uppercase mb-2 block">Vector Store</label>
                      <select className="w-full px-3 py-2 border-2 border-black rounded-[3px] bg-white text-sm font-bold">
                        <option>Pinecone</option>
                        <option>Chroma</option>
                        <option>Weaviate</option>
                        <option>Qdrant</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-2 border-black">
                      <UilDownloadAlt className="h-4 w-4 mr-2" />
                      Export Config
                    </Button>
                    <Button variant="outline" size="sm" className="border-2 border-black">
                      <UilUploadAlt className="h-4 w-4 mr-2" />
                      Import Config
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* RAG Workflows Management */}
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-black uppercase flex items-center text-sm sm:text-base">
                      <UilBrain className="h-5 w-5 mr-2" />RAG Workflows
                    </CardTitle>
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600 border-2 border-black">
                      <UilPlus className="h-4 w-4 mr-2" />
                      Add Workflow
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-3">
                  {agentData.ragWorkflows?.map(workflow => (
                    <div key={workflow.id} className="p-3 border-2 border-black bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-black">{workflow.name}</h4>
                            <Badge className={cn(
                              "border-2 border-black font-bold uppercase text-xs",
                              workflow.status === 'active' ? 'bg-green-400 text-black' :
                              workflow.status === 'processing' ? 'bg-yellow-400 text-black' :
                              workflow.status === 'failed' ? 'bg-red-400 text-white' :
                              'bg-blue-400 text-white'
                            )}>
                              {workflow.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="font-bold">{workflow.stats.embeddings.toLocaleString()} embeddings</span>
                            <span className="text-gray-600">•</span>
                            <span className="font-bold">{workflow.stats.sources} sources</span>
                            <span className="text-gray-600">•</span>
                            <span className="font-bold">Updated {workflow.stats.lastUpdated}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-2 border-black">
                            <UilEditAlt className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-2 border-black">
                            {workflow.status === 'active' ? 
                              <UilPause className="h-4 w-4" /> : 
                              <UilPlay className="h-4 w-4" />
                            }
                          </Button>
                          <Button variant="outline" size="sm" className="border-2 border-black text-red-600">
                            <UilTrashAlt className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {workflow.status === 'processing' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold">Processing...</span>
                            <span className="font-bold">{workflow.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 border border-black">
                            <div 
                              className="bg-purple-500 h-full transition-all duration-300"
                              style={{ width: `${workflow.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Workflow Sources */}
                      <div className="mt-3 space-y-2">
                        <h5 className="font-bold text-xs uppercase">Sources ({workflow.sources.length})</h5>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {workflow.sources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 text-xs">
                              <div className="flex items-center gap-2">
                                {source.type === 'youtube' && <UilYoutube className="h-3 w-3 text-red-500" />}
                                {source.type === 'document' && <UilFileAlt className="h-3 w-3 text-blue-500" />}
                                {source.type === 'url' && <UilLinkAlt className="h-3 w-3 text-green-500" />}
                                <span className="font-bold truncate max-w-48">{source.metadata?.title || source.url}</span>
                              </div>
                              <Badge className={cn(
                                "text-xs",
                                source.status === 'completed' ? 'bg-green-200 text-green-800' :
                                source.status === 'processing' ? 'bg-yellow-200 text-yellow-800' :
                                source.status === 'failed' ? 'bg-red-200 text-red-800' :
                                'bg-gray-200 text-gray-800'
                              )}>
                                {source.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!agentData.ragWorkflows || agentData.ragWorkflows.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <UilBrain className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="font-bold">No RAG workflows configured</p>
                      <p className="text-sm">Add workflows to enhance agent knowledge</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Add Sources */}
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-purple-100 p-3 sm:p-4">
                  <CardTitle className="font-black uppercase text-sm sm:text-base">Quick Add Training Sources</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card className="cursor-pointer border-2 border-black hover:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all bg-red-50">
                      <CardContent className="p-3 text-center">
                        <UilYoutube className="h-8 w-8 mx-auto mb-2 text-red-500" />
                        <p className="font-bold text-sm">YouTube Video</p>
                        <p className="text-xs text-gray-600">Add video transcripts</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer border-2 border-black hover:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all bg-blue-50">
                      <CardContent className="p-3 text-center">
                        <UilFileAlt className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="font-bold text-sm">Documents</p>
                        <p className="text-xs text-gray-600">Upload PDF, TXT, DOCX</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer border-2 border-black hover:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all bg-green-50">
                      <CardContent className="p-3 text-center">
                        <UilLinkAlt className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="font-bold text-sm">Web URLs</p>
                        <p className="text-xs text-gray-600">Scrape web content</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Paste YouTube URL, web URL, or upload documents..."
                      className="border-2 border-black rounded-[3px]"
                    />
                    <div className="flex gap-2">
                      <Button variant="header" size="sm" className="flex-1">
                        <UilPlus className="h-4 w-4 mr-2" />
                        Add Source
                      </Button>
                      <Button variant="outline" size="sm" className="border-2 border-black">
                        <UilUploadAlt className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Training History & Logs */}
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                  <CardTitle className="font-black uppercase text-sm sm:text-base">Training History</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {[
                      { time: '2 hours ago', action: 'Added YouTube playlist', status: 'completed' },
                      { time: '1 day ago', action: 'Updated embeddings', status: 'completed' },
                      { time: '3 days ago', action: 'Added product documentation', status: 'completed' },
                      { time: '1 week ago', action: 'Initial training setup', status: 'completed' },
                    ].map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 text-xs">
                        <div>
                          <span className="font-bold">{log.action}</span>
                          <span className="text-gray-600 ml-2">{log.time}</span>
                        </div>
                        <Badge className="bg-green-200 text-green-800 text-xs">
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'campaigns' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsDashboardHeader
                totalCalls={agentData.performance.totalCalls}
                title="CAMPAIGN ANALYTICS"
                subtitle={`Campaign performance for ${agentData.name}`}
                bgColor="bg-white"
                cards={campaignCards}
              />
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                  <CardTitle className="font-black uppercase text-sm sm:text-base">Business Hunt Details</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  {agentData.businessHunt ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">{agentData.businessHunt.huntName}</h4>
                        <Badge className={cn("border-2 border-black font-bold uppercase", getStatusColor(agentData.businessHunt.status))}>
                          {agentData.businessHunt.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">Hunt ID: {agentData.businessHunt.huntId}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No active business hunt campaigns.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'prompt' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsDashboardHeader
                totalCalls={agentData.performance.totalCalls}
                title="PROMPT METRICS"
                subtitle={`System prompt analysis for ${agentData.name}`}
                bgColor="bg-white"
                cards={promptCards}
              />
              <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                  <CardTitle className="font-black uppercase text-sm sm:text-base">System Prompt</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <p className="text-sm bg-gray-100 p-4 border-2 border-gray-300 font-mono">{agentData.systemPrompt || 'No system prompt configured.'}</p>
                </CardContent>
              </Card>
            </div>
          )}
          {agentData.swarmInfo && activeTab === 'swarm' && (
            <Card className="border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardHeader className="border-b-2 sm:border-b-4 border-black bg-gray-100 p-3 sm:p-4">
                <CardTitle className="font-black uppercase flex items-center text-sm sm:text-base"><UilUsersAlt className="h-5 w-5 mr-2" />Swarm Membership</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <p className="text-sm">This agent is part of the following swarm:</p>
                <h4 className="font-black text-lg mt-2">{agentData.swarmInfo.swarmName}</h4>
                <p className="text-gray-600">{agentData.swarmInfo.swarmPurpose}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
                  View Swarm Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetailModal;