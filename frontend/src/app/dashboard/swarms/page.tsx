'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UilLayerGroup,
  UilPlus,
  UilRobot,
  UilUsersAlt,
  UilEdit,
  UilTrash,
  UilPhone,
  UilChart,
  UilClock,
  UilCheckCircle
} from '@tooni/iconscout-unicons-react';
import StatCard from '@/components/custom/stat-card';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'training';
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

export default function SwarmsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedSwarm, setSelectedSwarm] = React.useState<string | null>(null);
  const [swarmName, setSwarmName] = React.useState('');
  const [swarmDescription, setSwarmDescription] = React.useState('');
  const [swarmPurpose, setSwarmPurpose] = React.useState('');

  // Mock data for swarms
  const [swarms] = React.useState<Swarm[]>([
    {
      id: '1',
      name: 'SALES BATTALION',
      description: 'Elite cold calling agents focused on B2B outreach',
      agents: [
        { id: '1', name: 'Diala-Tone', type: 'Discovery Calls', status: 'active' },
        { id: '2', name: 'Echo-Diala', type: 'Discovery Calls', status: 'active' },
        { id: '3', name: 'Voice-Diala', type: 'Follow-ups', status: 'training' },
      ],
      purpose: 'Discovery',
      totalCalls: 1247,
      successRate: 68,
      created: '2024-01-15'
    },
    {
      id: '2',
      name: 'SUPPORT SQUAD',
      description: 'Customer support specialists handling inbound queries',
      agents: [
        { id: '4', name: 'Chat-Diala', type: 'Customer Support', status: 'active' },
        { id: '5', name: 'Diala-Belle', type: 'Technical Support', status: 'active' },
      ],
      purpose: 'Support',
      totalCalls: 892,
      successRate: 94,
      created: '2024-01-20'
    },
    {
      id: '3',
      name: 'APPOINTMENT ARMY',
      description: 'Dedicated to scheduling and managing appointments',
      agents: [
        { id: '6', name: 'Diala-Muse', type: 'Appointment Setter', status: 'active' },
      ],
      purpose: 'Appointment',
      totalCalls: 423,
      successRate: 82,
      created: '2024-01-01'
    }
  ]);

  // Mock available agents for assignment
  const availableAgents: Agent[] = [
    { id: '7', name: 'New-Diala', type: 'Unassigned', status: 'inactive' },
    { id: '8', name: 'Test-Diala', type: 'Unassigned', status: 'inactive' },
  ];

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-gray-600';
      case 'training': return 'bg-orange-600';
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

  const getAgentTypeColor = (type: string) => {
    if (type.includes('Discovery')) return 'bg-purple-600';
    if (type.includes('Support')) return 'bg-green-600';
    if (type.includes('Appointment')) return 'bg-orange-600';
    if (type.includes('Technical')) return 'bg-pink-600';
    return 'bg-gray-600';
  };

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black uppercase text-black mb-2">AGENT SWARMS</h1>
            <p className="text-lg text-gray-600">Group your agents into powerful teams for coordinated campaigns</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="lg"
            className="font-bold"
          >
            <UilPlus className="w-5 h-5 mr-2" />
            CREATE SWARM
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Swarms"
          value={swarms.length}
          icon={<UilLayerGroup className="w-6 h-6 text-white" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
        />

        <StatCard
          title="Active Agents"
          value={swarms.reduce((acc, swarm) => acc + swarm.agents.filter(a => a.status === 'active').length, 0)}
          icon={<UilRobot className="w-6 h-6 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
        />

        <StatCard
          title="Total Calls"
          value={swarms.reduce((acc, swarm) => acc + swarm.totalCalls, 0).toLocaleString()}
          icon={<UilPhone className="w-6 h-6 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
        />

        <StatCard
          title="Avg Success"
          value={`${Math.round(swarms.reduce((acc, swarm) => acc + swarm.successRate, 0) / swarms.length)}%`}
          icon={<UilChart className="w-6 h-6 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
        />
      </div>

      {/* Swarms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {swarms.map((swarm, index) => (
          <Card 
            key={swarm.id} 
            className={`border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all duration-200 bg-white transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} cursor-pointer`}
            onClick={() => router.push(`/dashboard/swarms/${swarm.id}`)}
          >
            <CardHeader className={`border-b-4 border-black ${getSwarmColor(swarm.purpose, '400')} relative overflow-hidden`}>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button 
                  size="icon" 
                  variant="default"
                  className="w-8 h-8 bg-white border-2 border-black hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/swarms/${swarm.id}`);
                  }}
                >
                  <UilEdit className="w-4 h-4 text-black" />
                </Button>
                <Button 
                  size="icon" 
                  variant="default"
                  className="w-8 h-8 bg-white border-2 border-black hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSwarm(swarm.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <UilTrash className="w-4 h-4 text-black" />
                </Button>
              </div>
              <CardTitle className="text-2xl font-black uppercase text-white">{swarm.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`border-2 border-black font-bold uppercase text-xs ${getSwarmColor(swarm.purpose, '600')} text-white`}>
                  {swarm.purpose}
                </Badge>
                <Badge className={`border-2 border-black font-bold uppercase text-xs ${getSwarmColor(swarm.purpose, '800')} text-white`}>
                  {swarm.agents.length} AGENTS
                </Badge>
              </div>
              <p className="text-white/90 text-sm mt-2">{swarm.description}</p>
              
              {/* Swarm Stats */}
              <div className="flex gap-4 mt-4">
                <div className="bg-white/20 backdrop-blur-sm border-2 border-white/50 px-3 py-1">
                  <p className="text-xs font-bold text-white/80">CALLS</p>
                  <p className="text-lg font-black text-white">{swarm.totalCalls}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm border-2 border-white/50 px-3 py-1">
                  <p className="text-xs font-bold text-white/80">SUCCESS</p>
                  <p className="text-lg font-black text-white">{swarm.successRate}%</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
              {/* Agents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-black uppercase text-gray-600">Agents ({swarm.agents.length})</p>
                  <Button
                    size="sm"
                    variant="neutral"
                    className="h-7 px-3 text-xs font-bold"
                  >
                    <UilPlus className="w-3 h-3 mr-1" />
                    ADD
                  </Button>
                </div>
                
                {swarm.agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${getStatusColor(agent.status)} rounded-full ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
                      <div>
                        <p className="font-bold text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-600">{agent.type}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`border-2 border-black font-bold uppercase text-xs ${getAgentTypeColor(agent.type)} text-white`}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Created Date */}
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <UilClock className="w-3 h-3" />
                  Created {new Date(swarm.created).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Swarm Card */}
        <Card 
          onClick={() => setShowCreateModal(true)}
          className="border-4 border-dashed border-gray-400 shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] hover:border-black transition-all duration-200 bg-gray-50 cursor-pointer group"
        >
          <CardContent className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-gray-200 border-4 border-gray-400 group-hover:border-black group-hover:bg-gray-300 rounded-full flex items-center justify-center mb-4 transition-all">
              <UilPlus className="w-10 h-10 text-gray-600 group-hover:text-black" />
            </div>
            <p className="text-xl font-black text-gray-600 group-hover:text-black uppercase">Create New Swarm</p>
            <p className="text-sm text-gray-500 mt-2 text-center">Group agents together for coordinated campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Swarm Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white">
            <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)]">
              <CardTitle className="text-3xl font-black uppercase text-white">CREATE NEW SWARM</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Swarm Name</label>
                  <Input
                    value={swarmName}
                    onChange={(e) => setSwarmName(e.target.value)}
                    className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-lg font-bold h-12 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 transition-all duration-200"
                    placeholder="E.g., SALES BATTALION"
                  />
                  <p className="text-xs text-gray-500 mt-1">Choose a bold, memorable name for your agent team</p>
                </div>

                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Purpose Category</label>
                  <select
                    value={swarmPurpose}
                    onChange={(e) => setSwarmPurpose(e.target.value)}
                    className="w-full border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-lg font-bold h-12 bg-white px-3 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 transition-all duration-200"
                  >
                    <option value="">Select primary purpose...</option>
                    <option value="Discovery">Discovery - Cold calling & lead generation</option>
                    <option value="Support">Support - Customer service & technical help</option>
                    <option value="Appointment">Appointment - Scheduling & calendar management</option>
                    <option value="Follow-up">Follow-up - Nurturing & relationship building</option>
                    <option value="Qualification">Qualification - Lead scoring & validation</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Define the main objective for this swarm's operations</p>
                </div>
                
                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Detailed Description</label>
                  <Input
                    value={swarmDescription}
                    onChange={(e) => setSwarmDescription(e.target.value)}
                    className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-lg h-12 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 transition-all duration-200"
                    placeholder="E.g., Elite cold calling agents focused on B2B software outreach..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Explain the specific tactics and target audience for this swarm</p>
                </div>

                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Available Agents</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                          <div>
                            <p className="font-bold text-sm">{agent.name}</p>
                            <p className="text-xs text-gray-600">{agent.type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="neutral"
                  size="lg"
                  className="flex-1 font-bold"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={() => {
                    // Handle create swarm
                    setShowCreateModal(false);
                    setSwarmName('');
                    setSwarmDescription('');
                    setSwarmPurpose('');
                  }}
                  variant="default"
                  size="lg"
                  className="flex-1 font-bold"
                >
                  CREATE SWARM
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSwarm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white">
            <CardHeader className="border-b-4 border-black bg-red-500">
              <CardTitle className="text-2xl font-black uppercase text-white">DELETE SWARM</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-lg mb-6">
                Are you sure you want to delete <strong>{swarms.find(s => s.id === selectedSwarm)?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSwarm(null);
                  }}
                  variant="neutral"
                  size="lg"
                  className="flex-1 font-bold"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={() => {
                    // Handle delete logic here
                    console.log('Deleting swarm:', selectedSwarm);
                    setShowDeleteModal(false);
                    setSelectedSwarm(null);
                  }}
                  variant="destructive"
                  size="lg"
                  className="flex-1 font-bold"
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