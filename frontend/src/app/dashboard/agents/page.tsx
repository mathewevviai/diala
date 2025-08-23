'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/custom/stat-card';
import CreateAgentModal from '@/components/custom/modals/create-agent-modal';
import AgentDetailModal from '@/components/custom/modals/agent-detail-modal';
import { cn } from '@/lib/utils';
import { 
  UilRobot,
  UilMicrophone,
  UilPlay,
  UilPause,
  UilEdit,
  UilTrash,
  UilCopy,
  UilSetting,
  UilChart,
  UilClock,
  UilPhone,
  UilCheckCircle,
  UilExclamationTriangle,
  UilPlus,
  UilStop,
  UilRefresh,
  UilLanguage,
  UilHistory,
  UilStar
} from '@tooni/iconscout-unicons-react';

// Augmented voice agents data structure
const voiceAgents = [
  {
    id: 1,
    name: 'Diala-Tone',
    voice: 'Professional',
    language: 'English (US)',
    purpose: 'Sales & Discovery',
    status: 'active',
    performance: {
      totalCalls: 1250,
      successRate: 92,
      avgDuration: '7:45',
      satisfaction: 4.8
    },
    description: 'Professional sales agent focused on discovery calls and lead qualification.',
    lastActive: '2 mins ago',
    systemPrompt: 'You are a professional sales agent. Your goal is to conduct discovery calls, identify pain points, and qualify leads for the sales team. Be polite, concise, and inquisitive.',
    ragSources: [
      { id: 'M1', name: 'Objection Mindset', description: 'Reframes objections as opportunities for clarification and builds resilience.' },
      { id: 'M4', name: 'Price Objections', description: 'Focuses on reframing price to ROI and value-based selling.' }
    ],
    businessHunt: {
      huntId: 'bh-001',
      huntName: 'Silicon Valley SaaS Startups',
      status: 'active',
      config: {
        industry: "Technology",
        businessTypes: ["SaaS", "Software"],
        locations: ["San Francisco, CA", "Palo Alto, CA"],
        companySize: "Startup",
      }
    }
  },
  {
    id: 2,
    name: 'Echo-Diala',
    voice: 'Friendly',
    language: 'English (US)',
    purpose: 'Customer Support',
    status: 'active',
    performance: {
      totalCalls: 980,
      successRate: 88,
      avgDuration: '12:30',
      satisfaction: 4.6
    },
    description: 'Empathetic support agent specialized in resolving customer issues.',
    lastActive: '5 mins ago',
    systemPrompt: 'You are a friendly and empathetic customer support agent. Listen carefully to customer issues, provide clear solutions, and ensure a positive customer experience.',
    ragSources: [
      { id: 'M2', name: 'Objection Discovery', description: 'Techniques for understanding the real objection and finding the root cause.' },
      { id: 'M3', name: 'Frameworks', description: 'Utilizes frameworks like Feel-Felt-Found and LAARC for systematic issue resolution.' }
    ],
    swarmInfo: {
      swarmId: 'swarm-support-alpha',
      swarmName: 'Alpha Support Swarm',
      swarmPurpose: 'Handling high-priority customer support tickets.'
    }
  },
  {
    id: 3,
    name: 'Voice-Diala',
    voice: 'Energetic',
    language: 'Spanish (MX)',
    purpose: 'Appointment Setting',
    status: 'idle',
    performance: {
      totalCalls: 2100,
      successRate: 95,
      avgDuration: '4:20',
      satisfaction: 4.9
    },
    description: 'High-energy agent optimized for quick appointment scheduling.',
    lastActive: '1 hour ago',
    systemPrompt: 'You are an energetic and persuasive agent focused on setting appointments. Be enthusiastic, clear, and efficient in your communication.',
    ragSources: [
      { id: 'M5', name: '"Think About It" Handling', description: 'Strategies for uncovering hidden concerns and creating urgency without pressure.' },
      { id: 'M6', name: '"Not Interested" Response', description: 'Techniques to gently probe and diagnose disinterest.' }
    ],
    businessHunt: {
      huntId: 'bh-002',
      huntName: 'Texas Medical Practices',
      status: 'completed',
      config: {
        industry: "Healthcare",
        businessTypes: ["Medical Practice", "Clinic"],
        locations: ["Houston, TX", "Dallas, TX", "Austin, TX"],
      }
    }
  },
  {
    id: 4,
    name: 'Diala-Belle',
    voice: 'Calm',
    language: 'French (FR)',
    purpose: 'Technical Support',
    status: 'offline',
    performance: {
      totalCalls: 650,
      successRate: 90,
      avgDuration: '15:00',
      satisfaction: 4.7
    },
    description: 'Patient technical support specialist with deep product knowledge.',
    lastActive: '2 days ago',
    systemPrompt: 'You are a calm and patient technical support specialist. Guide users through complex technical issues with clear, step-by-step instructions.',
    ragSources: [
        { id: 'M7', name: 'Competitive Objections', description: 'Focuses on unique value framing without attacking competitors.' },
        { id: 'M8', name: 'Time & Budget Constraints', description: 'Strategies for offering micro-commitments and phased solutions.' }
    ]
  }
];

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = React.useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const handleCreateAgent = async (agentData: any) => {
    // TODO: Implement actual agent creation logic
    console.log('Creating agent:', agentData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsCreateModalOpen(false);
  };

  const handleCardClick = (agent: any) => {
    setSelectedAgent(agent);
    setIsDetailModalOpen(true);
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="TOTAL AGENTS"
          value={voiceAgents.length.toString()}
          icon={<UilRobot className="h-5 w-5 text-white" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
          subtitle="Configured agents"
        />

        <StatCard
          title="ACTIVE NOW"
          value="2"
          icon={<UilMicrophone className="h-5 w-5 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
          subtitle="Currently on calls"
          status={{
            label: "Currently on calls",
            color: "bg-green-100"
          }}
        />

        <StatCard
          title="AVG SUCCESS"
          value="91%"
          icon={<UilCheckCircle className="h-5 w-5 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
          progress={91}
        />

        <StatCard
          title="TOTAL CALLS"
          value="4,980"
          icon={<UilPhone className="h-5 w-5 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
          subtitle="Last 30 days"
        />
      </div>

      {/* Create New Agent Button */}
      <div className="flex justify-end">
        <Button 
          variant="default"
          className="font-black uppercase"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <UilPlus className="h-5 w-5 mr-2" />
          CREATE NEW AGENT
        </Button>
      </div>

      {/* Voice Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {voiceAgents.map((agent) => (
          <Card 
            key={agent.id}
            className="cursor-pointer"
            onClick={() => handleCardClick(agent)}
          >
            <CardHeader className={cn(
              "border-b-4 border-black",
              agent.purpose.includes('Discovery') && "bg-[#C084FC]",
              agent.purpose.includes('Support') && "bg-[#4ADE80]",
              agent.purpose.includes('Appointment') && "bg-[#FB923C]",
              agent.purpose.includes('Technical') && "bg-[#F472B6]"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    size="icon"
                    variant="default"
                    className="w-12 h-12 bg-white border-4 border-black"
                  >
                    <UilRobot className="h-6 w-6" />
                  </Button>
                  <div>
                    <CardTitle className="text-xl font-black text-white">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn(
                        "font-black uppercase border-2 border-black text-white",
                        agent.purpose.includes('Discovery') && "bg-purple-600",
                        agent.purpose.includes('Support') && "bg-green-600",
                        agent.purpose.includes('Appointment') && "bg-orange-600",
                        agent.purpose.includes('Technical') && "bg-pink-600"
                      )}>
                        {agent.purpose}
                      </Badge>
                      <Badge className={cn(
                        "font-black uppercase border-2 border-black text-white",
                        agent.purpose.includes('Discovery') && "bg-purple-800",
                        agent.purpose.includes('Support') && "bg-green-800",
                        agent.purpose.includes('Appointment') && "bg-orange-800",
                        agent.purpose.includes('Technical') && "bg-pink-800"
                      )}>
                        {agent.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon"
                    variant="default" 
                    className="h-8 w-8 bg-white border-2 border-black"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UilEdit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon"
                    variant="default" 
                    className="h-8 w-8 bg-white border-2 border-black"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UilCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Description Section */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{agent.description}</p>
              </div>
              
              {/* Agent Configuration */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-gray-50 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UilMicrophone className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-black uppercase text-gray-600">Voice Model</span>
                    </div>
                    <p className="font-black text-black">{agent.voice}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UilLanguage className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-black uppercase text-gray-600">Language</span>
                    </div>
                    <p className="font-black text-black">{agent.language}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="mb-4">
                <h4 className="text-xs font-black uppercase text-black mb-3">PERFORMANCE METRICS</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-gray-600">Total Calls</span>
                        <UilPhone className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-black text-black">{agent.performance.totalCalls}</p>
                      <p className="text-xs text-gray-600">Last 30 days</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-gray-600">Success Rate</span>
                        <UilCheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-black text-green-600">{agent.performance.successRate}%</p>
                      <div className="w-full bg-gray-200 h-1 mt-1">
                        <div className="bg-green-500 h-1" style={{ width: `${agent.performance.successRate}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-gray-600">Avg Duration</span>
                        <UilHistory className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-black text-blue-600">{agent.performance.avgDuration}</p>
                      <p className="text-xs text-gray-600">Per conversation</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-gray-600">Satisfaction</span>
                        <UilStar className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-black text-yellow-600">{agent.performance.satisfaction}</p>
                      <p className="text-xs text-gray-600">Customer rating</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-bold">Last active:</span> {agent.lastActive}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="neutral"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UilChart className="h-4 w-4" />
                    STATS
                  </Button>
                  <Button 
                    size="sm"
                    variant={agent.status === 'active' ? 'neutral' : 'default'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {agent.status === 'active' ? <UilPause className="h-4 w-4" /> : <UilPlay className="h-4 w-4" />}
                    {agent.status === 'active' ? 'PAUSE' : 'START'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateAgent}
      />

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          agentData={selectedAgent}
        />
      )}
    </div>
  );
}