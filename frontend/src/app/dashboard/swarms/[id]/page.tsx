'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UilArrowLeft,
  UilEdit,
  UilTrash, 
  UilPlus,
  UilRobot,
  UilPhone,
  UilChart,
  UilClock,
  UilCheckCircle,
  UilUsersAlt,
  UilPlay,
  UilPause,
  UilBooks,
  UilBrain,
  UilDatabase,
  UilMessage,
  UilStar,
  UilLock,
  UilAnalytics,
  UilMicrophone,
  UilHeadphones,
  UilBuilding,
  UilUser
} from '@tooni/iconscout-unicons-react';
import StatCard from '@/components/custom/stat-card';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'training';
  systemPrompt: string;
  ragSources: string[];
  responseType: 'conversational' | 'direct' | 'empathetic' | 'aggressive';
  currentCalls: number;
  todayCalls: number;
  successRate: number;
  currentContact?: {
    name: string;
    company: string;
    duration: string;
  };
  premiumFeatures: {
    advancedAnalytics: boolean;
    customVoices: boolean;
    realTimeCoaching: boolean;
  };
}

interface Swarm {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  purpose: string;
  totalCalls: number;
  successRate: number;
  created: string;
}

export default function SwarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');

  // Mock data - in real app this would come from API
  const [swarm, setSwarm] = React.useState<Swarm>({
    id: '1',
    name: 'SALES BATTALION',
    description: 'Elite cold calling agents focused on B2B outreach',
    agents: [
      { 
        id: '1', 
        name: 'Diala-Tone', 
        type: 'Discovery Calls', 
        status: 'active',
        systemPrompt: 'You are a professional B2B sales representative specializing in software discovery calls. Be consultative, ask qualifying questions, and focus on understanding pain points.',
        ragSources: ['B2B Sales Playbook', 'Product Documentation', 'Competitor Analysis'],
        responseType: 'conversational',
        currentCalls: 2,
        todayCalls: 24,
        successRate: 72,
        currentContact: {
          name: 'Sarah Johnson',
          company: 'TechCorp Inc',
          duration: '8:42'
        },
        premiumFeatures: {
          advancedAnalytics: true,
          customVoices: false,
          realTimeCoaching: false
        }
      },
      { 
        id: '2', 
        name: 'Echo-Diala', 
        type: 'Discovery Calls', 
        status: 'active',
        systemPrompt: 'You are an energetic sales agent focused on quickly qualifying leads and setting appointments. Be direct and goal-oriented.',
        ragSources: ['Sales Scripts', 'Objection Handling Guide', 'Lead Qualification Framework'],
        responseType: 'direct',
        currentCalls: 1,
        todayCalls: 18,
        successRate: 68,
        currentContact: {
          name: 'Mike Chen',
          company: 'StartupXYZ',
          duration: '12:15'
        },
        premiumFeatures: {
          advancedAnalytics: false,
          customVoices: true,
          realTimeCoaching: false
        }
      },
      { 
        id: '3', 
        name: 'Voice-Diala', 
        type: 'Follow-ups', 
        status: 'training',
        systemPrompt: 'You specialize in nurturing warm leads through thoughtful follow-up conversations. Be empathetic and relationship-focused.',
        ragSources: ['Follow-up Templates', 'Relationship Building Guide'],
        responseType: 'empathetic',
        currentCalls: 0,
        todayCalls: 6,
        successRate: 45,
        premiumFeatures: {
          advancedAnalytics: false,
          customVoices: false,
          realTimeCoaching: true
        }
      },
    ],
    purpose: 'Discovery',
    totalCalls: 1247,
    successRate: 68,
    created: '2024-01-15'
  });

  React.useEffect(() => {
    setEditName(swarm.name);
    setEditDescription(swarm.description);
  }, [swarm]);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-gray-600';
      case 'training': return 'bg-orange-600';
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': return <UilPlay className="w-3 h-3" />;
      case 'inactive': return <UilPause className="w-3 h-3" />;
      case 'training': return <UilBooks className="w-3 h-3" />;
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'conversational': return 'bg-blue-500';
      case 'direct': return 'bg-orange-500';
      case 'empathetic': return 'bg-green-500';
      case 'aggressive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getResponseTypeIcon = (type: string) => {
    switch (type) {
      case 'conversational': return <UilMessage className="w-3 h-3" />;
      case 'direct': return <UilChart className="w-3 h-3" />;
      case 'empathetic': return <UilHeadphones className="w-3 h-3" />;
      case 'aggressive': return <UilPhone className="w-3 h-3" />;
      default: return <UilMessage className="w-3 h-3" />;
    }
  };

  const getSwarmColor = (purpose: string, shade: '400' | '600' | '800') => {
    switch (purpose) {
      case 'Discovery': return `bg-purple-${shade}`;
      case 'Support': return `bg-green-${shade}`;
      case 'Appointment': return `bg-orange-${shade}`;
      default: return `bg-gray-${shade}`;
    }
  };

  const handleSave = () => {
    setSwarm(prev => ({
      ...prev,
      name: editName,
      description: editDescription
    }));
    setIsEditing(false);
  };

  const handleDelete = () => {
    // Handle delete logic here
    router.push('/dashboard/swarms');
  };

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => router.push('/dashboard/swarms')}
            variant="neutral"
            size="lg"
          >
            <UilArrowLeft className="w-5 h-5 mr-2" />
            BACK TO SWARMS
          </Button>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-3xl font-black h-16 mb-2"
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-lg h-12"
                />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-black uppercase text-black mb-2">{swarm.name}</h1>
                <p className="text-lg text-gray-600">{swarm.description}</p>
              </>
            )}
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="neutral"
                  size="lg"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleSave}
                  variant="default"
                  size="lg"
                >
                  SAVE CHANGES
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="default"
                  size="lg"
                >
                  <UilEdit className="w-5 h-5 mr-2" />
                  EDIT SWARM
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="neutral"
                  size="lg"
                  className="bg-red-500"
                >
                  <UilTrash className="w-5 h-5 mr-2" />
                  DELETE
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Agents"
          value={swarm.agents.length}
          icon={<UilRobot className="w-6 h-6 text-white" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
        />

        <StatCard
          title="Active Agents"
          value={swarm.agents.filter(a => a.status === 'active').length}
          icon={<UilCheckCircle className="w-6 h-6 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
        />

        <StatCard
          title="Total Calls"
          value={swarm.totalCalls.toLocaleString()}
          icon={<UilPhone className="w-6 h-6 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
        />

        <StatCard
          title="Success Rate"
          value={`${swarm.successRate}%`}
          icon={<UilChart className="w-6 h-6 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
        />
      </div>

      {/* Agents Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase text-black">AGENT MANAGEMENT</h2>
          <Button variant="default" size="lg">
            <UilPlus className="w-5 h-5 mr-2" />
            ADD AGENT
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {swarm.agents.map((agent) => (
            <Card key={agent.id} className="overflow-hidden">
              {/* Agent Header */}
              <CardHeader className={`border-b-4 border-black ${getSwarmColor(swarm.purpose, '400')} relative`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${getStatusColor(agent.status)} rounded-full ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
                    <div>
                      <CardTitle className="text-xl font-black uppercase text-white">{agent.name}</CardTitle>
                      <p className="text-white/80 text-sm">{agent.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1 bg-white/20 border-white/50 text-white">
                    {getStatusIcon(agent.status)}
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Current Activity */}
                  {agent.currentContact && (
                    <div className="bg-white border-2 border-black p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-yellow-400 border-2 border-black p-1">
                          <UilPhone className="w-4 h-4 text-black" />
                        </div>
                        <p className="text-sm font-black uppercase text-black">ON CALL</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-black">{agent.currentContact.name}</p>
                          <p className="text-sm text-gray-600">{agent.currentContact.company}</p>
                        </div>
                        <Badge className="bg-yellow-400 text-black border-2 border-black font-black">
                          {agent.currentContact.duration}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="bg-white border-2 border-black p-4">
                    <p className="text-sm font-black uppercase text-black mb-3">PERFORMANCE</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="neutral" className="h-auto p-3 flex-col">
                        <p className="text-xl font-black text-black">{agent.todayCalls}</p>
                        <p className="text-xs text-black uppercase font-black">TODAY</p>
                      </Button>
                      <Button variant="neutral" className="h-auto p-3 flex-col bg-yellow-400">
                        <p className="text-xl font-black text-black">{agent.currentCalls}</p>
                        <p className="text-xs text-black uppercase font-black">ACTIVE</p>
                      </Button>
                      <Button variant="neutral" className="h-auto p-3 flex-col">
                        <p className="text-xl font-black text-black">{agent.successRate}%</p>
                        <p className="text-xs text-black uppercase font-black">SUCCESS</p>
                      </Button>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="bg-white border-2 border-black p-4">
                    <p className="text-sm font-black uppercase text-black mb-3">CONFIGURATION</p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Personality Button */}
                      <Button variant="neutral" className="h-auto p-3 flex-col items-start">
                        <div className="flex items-center gap-2 mb-1">
                          {getResponseTypeIcon(agent.responseType)}
                          <p className="text-xs font-black uppercase">PERSONALITY</p>
                        </div>
                        <p className="text-xs text-gray-600">{agent.responseType.toUpperCase()}</p>
                      </Button>
                      
                      {/* Training Data Buttons */}
                      {agent.ragSources.map((source, index) => (
                        <Button key={index} variant="neutral" className="h-auto p-3 flex-col items-start">
                          <div className="flex items-center gap-2 mb-1">
                            <UilBooks className="w-3 h-3" />
                            <p className="text-xs font-black uppercase">TRAINING</p>
                          </div>
                          <p className="text-xs text-gray-600 text-left">{source}</p>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* System Instructions */}
                  <div className="bg-white border-2 border-black p-4">
                    <p className="text-sm font-black uppercase text-black mb-3">SYSTEM INSTRUCTIONS</p>
                    <div className="bg-gray-50 border-2 border-black p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{agent.systemPrompt}</p>
                    </div>
                  </div>

                  {/* Premium Features */}
                  <div>
                    <p className="text-xs font-black uppercase text-gray-600 mb-2">PREMIUM FEATURES</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={agent.premiumFeatures.advancedAnalytics ? 'bg-yellow-400 text-black' : 'bg-gray-300 text-gray-600'}>
                        ANALYTICS
                      </Badge>
                      <Badge className={agent.premiumFeatures.customVoices ? 'bg-yellow-400 text-black' : 'bg-gray-300 text-gray-600'}>
                        VOICES
                      </Badge>
                      <Badge className={agent.premiumFeatures.realTimeCoaching ? 'bg-yellow-400 text-black' : 'bg-gray-300 text-gray-600'}>
                        COACHING
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button size="sm" variant="neutral" className="flex-1 bg-orange-400">
                      <UilEdit className="w-3 h-3 mr-1" />
                      EDIT
                    </Button>
                    <Button size="sm" variant="neutral" className="flex-1 bg-red-500">
                      <UilTrash className="w-3 h-3 mr-1" />
                      REMOVE
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white">
            <CardHeader className="border-b-4 border-black bg-red-500">
              <CardTitle className="text-2xl font-black uppercase text-white">DELETE SWARM</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-lg mb-6">
                Are you sure you want to delete <strong>{swarm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="neutral"
                  size="lg"
                  className="flex-1"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="neutral"
                  size="lg"
                  className="flex-1 bg-red-500"
                >
                  DELETE SWARM
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}