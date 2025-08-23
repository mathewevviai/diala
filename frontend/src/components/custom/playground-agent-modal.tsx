'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'
import {
  UilTimes,
  UilRobot,
  UilSetting,
  UilPlay,
  UilStar,
  UilDollarSign,
  UilHeadphonesAlt,
  UilCalendarAlt,
  UilDesktop,
  UilBrain,
  UilSave
} from '@tooni/iconscout-unicons-react'

interface Agent {
  id: string
  name: string
  description: string
  purpose: 'sales' | 'support' | 'appointment' | 'technical' | 'custom'
  voiceProvider: 'elevenlabs' | 'chatterbox'
  voiceId: string
  language: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  ragWorkflows: string[]
  isCustom?: boolean
  createdAt?: string
}

interface PlaygroundAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAgent: (agent: Agent) => void
  onSaveConfiguration: (name: string, configuration: any) => void
  currentConfiguration?: any
}

export default function PlaygroundAgentModal({ 
  isOpen, 
  onClose, 
  onSelectAgent, 
  onSaveConfiguration,
  currentConfiguration 
}: PlaygroundAgentModalProps) {
  const [activeTab, setActiveTab] = React.useState<'prebuilt' | 'custom'>('prebuilt')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [saveModalOpen, setSaveModalOpen] = React.useState(false)
  const [configName, setConfigName] = React.useState('')

  const PREBUILT_AGENTS: Agent[] = [
    // Chatterbox (Open Source) Agents
    {
      id: 'sales-pro-3000',
      name: 'Sales Pro 3000',
      description: 'Advanced sales agent with objection handling and lead qualification',
      purpose: 'sales',
      voiceProvider: 'chatterbox',
      voiceId: 'nova',
      language: 'en-US',
      systemPrompt: 'You are a professional sales agent focused on understanding customer needs and providing value-driven solutions.',
      temperature: 0.7,
      maxTokens: 500,
      ragWorkflows: ['sales-objection-master', 'product-catalog']
    },
    {
      id: 'support-specialist',
      name: 'Support Specialist',
      description: 'Customer support agent with technical knowledge and troubleshooting skills',
      purpose: 'support',
      voiceProvider: 'chatterbox',
      voiceId: 'alloy',
      language: 'en-US',
      systemPrompt: 'You are a helpful customer support specialist. Always be patient, understanding, and solution-focused.',
      temperature: 0.5,
      maxTokens: 400,
      ragWorkflows: ['customer-support-kb', 'technical-docs']
    },
    {
      id: 'appointment-setter',
      name: 'Appointment Setter',
      description: 'Efficient scheduling agent for booking meetings and managing calendars',
      purpose: 'appointment',
      voiceProvider: 'chatterbox',
      voiceId: 'echo',
      language: 'en-US',
      systemPrompt: 'You are a professional appointment setter. Be concise, friendly, and focus on finding suitable meeting times.',
      temperature: 0.3,
      maxTokens: 300,
      ragWorkflows: ['appointment-scripts']
    },
    {
      id: 'technical-expert',
      name: 'Technical Expert',
      description: 'Advanced technical support with API and integration expertise',
      purpose: 'technical',
      voiceProvider: 'chatterbox',
      voiceId: 'fable',
      language: 'en-US',
      systemPrompt: 'You are a technical expert. Provide clear, accurate technical guidance and solutions.',
      temperature: 0.4,
      maxTokens: 600,
      ragWorkflows: ['technical-docs']
    },
    // ElevenLabs (Commercial) Agents
    {
      id: 'premium-sales-executive',
      name: 'Premium Sales Executive',
      description: 'High-end sales agent with premium voice quality and advanced conversational skills',
      purpose: 'sales',
      voiceProvider: 'elevenlabs',
      voiceId: 'rachel',
      language: 'en-US',
      systemPrompt: 'You are an elite sales executive with exceptional communication skills. Focus on building rapport and closing deals.',
      temperature: 0.8,
      maxTokens: 600,
      ragWorkflows: ['sales-objection-master', 'product-catalog']
    },
    {
      id: 'enterprise-support',
      name: 'Enterprise Support',
      description: 'Premium customer support for enterprise clients with sophisticated problem-solving',
      purpose: 'support',
      voiceProvider: 'elevenlabs',
      voiceId: 'drew',
      language: 'en-US',
      systemPrompt: 'You are an enterprise-level support specialist. Provide comprehensive, professional assistance with complex issues.',
      temperature: 0.6,
      maxTokens: 700,
      ragWorkflows: ['customer-support-kb', 'technical-docs']
    },
    {
      id: 'executive-scheduler',
      name: 'Executive Scheduler',
      description: 'Premium appointment scheduling for C-level executives and VIP clients',
      purpose: 'appointment',
      voiceProvider: 'elevenlabs',
      voiceId: 'clyde',
      language: 'en-US',
      systemPrompt: 'You are an executive assistant specializing in high-level appointment scheduling. Be sophisticated and efficient.',
      temperature: 0.4,
      maxTokens: 400,
      ragWorkflows: ['appointment-scripts']
    },
    {
      id: 'senior-technical-architect',
      name: 'Senior Technical Architect',
      description: 'Premium technical consultation with advanced system architecture expertise',
      purpose: 'technical',
      voiceProvider: 'elevenlabs',
      voiceId: 'paul',
      language: 'en-US',
      systemPrompt: 'You are a senior technical architect. Provide sophisticated technical guidance with enterprise-level insights.',
      temperature: 0.5,
      maxTokens: 800,
      ragWorkflows: ['technical-docs']
    }
  ]

  const [customAgents, setCustomAgents] = React.useState<Agent[]>([
    {
      id: 'custom-demo-agent',
      name: 'My Custom Agent',
      description: 'Custom playground configuration',
      purpose: 'custom',
      voiceProvider: 'chatterbox',
      voiceId: 'nova',
      language: 'en-US',
      systemPrompt: 'You are a helpful AI assistant.',
      temperature: 0.7,
      maxTokens: 500,
      ragWorkflows: [],
      isCustom: true,
      createdAt: '2024-01-15'
    }
  ])

  const filteredPrebuiltAgents = PREBUILT_AGENTS.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCustomAgents = customAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'sales': return UilDollarSign
      case 'support': return UilHeadphonesAlt
      case 'appointment': return UilCalendarAlt
      case 'technical': return UilDesktop
      default: return UilSetting
    }
  }

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'sales': return 'purple'
      case 'support': return 'green'
      case 'appointment': return 'orange'
      case 'technical': return 'pink'
      default: return 'gray'
    }
  }

  const handleSaveConfiguration = () => {
    if (configName.trim() && currentConfiguration) {
      const newCustomAgent: Agent = {
        id: `custom-${Date.now()}`,
        name: configName,
        description: 'Custom playground configuration',
        purpose: 'custom',
        voiceProvider: currentConfiguration.voiceProvider || 'chatterbox',
        voiceId: currentConfiguration.voice || 'nova',
        language: currentConfiguration.language || 'en-US',
        systemPrompt: currentConfiguration.systemPrompt || '',
        temperature: currentConfiguration.temperature?.[0] || 0.7,
        maxTokens: currentConfiguration.maxTokens?.[0] || 500,
        ragWorkflows: currentConfiguration.selectedRagWorkflows || [],
        isCustom: true,
        createdAt: new Date().toISOString().split('T')[0]
      }
      
      setCustomAgents(prev => [newCustomAgent, ...prev])
      onSaveConfiguration(configName, currentConfiguration)
      setSaveModalOpen(false)
      setConfigName('')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative sticky top-0 z-10">
            <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              SELECT AGENT FOR PLAYGROUND
            </CardTitle>
            <Button
              variant="neutral"
              size="sm"
              className="absolute top-4 right-16"
              onClick={() => setSaveModalOpen(true)}
              disabled={!currentConfiguration}
            >
              <UilSave className="h-4 w-4 mr-2" />
              SAVE CONFIG
            </Button>
            <Button
              variant="neutral"
              size="sm"
              className="absolute top-4 right-4"
              onClick={onClose}
            >
              <UilTimes className="h-5 w-5 text-black" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents..."
                className="border-2 border-black font-bold"
              />
            </div>

            {/* Tabs */}
            <div className="flex mb-6">
              <Button
                onClick={() => setActiveTab('prebuilt')}
                className={cn(
                  "border-2 border-black font-bold mr-2",
                  activeTab === 'prebuilt' 
                    ? "bg-[rgb(0,82,255)] text-white shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                    : "bg-white text-black hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                )}
              >
                <UilRobot className="h-4 w-4 mr-2" />
                PREBUILT AGENTS ({filteredPrebuiltAgents.length})
              </Button>
              <Button
                onClick={() => setActiveTab('custom')}
                className={cn(
                  "border-2 border-black font-bold",
                  activeTab === 'custom' 
                    ? "bg-[rgb(0,82,255)] text-white shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                    : "bg-white text-black hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                )}
              >
                <UilStar className="h-4 w-4 mr-2" />
                MY AGENTS ({filteredCustomAgents.length})
              </Button>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === 'prebuilt' ? (
                filteredPrebuiltAgents.length > 0 ? (
                  filteredPrebuiltAgents.map((agent) => {
                    const Icon = getPurposeIcon(agent.purpose)
                    const color = getPurposeColor(agent.purpose)
                    return (
                      <Card
                        key={agent.id}
                        className="cursor-pointer border-2 border-black transition-all bg-white hover:shadow-[4px_4px_0_rgba(0,0,0,1)]"
                        onClick={() => onSelectAgent(agent)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 border-2 border-black flex items-center justify-center bg-${color}-200`}>
                              <Icon className={`h-6 w-6 text-${color}-600`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black text-lg text-black mb-1">{agent.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge className={`bg-${color}-600 text-white border-2 border-black text-xs`}>
                                  {agent.purpose.toUpperCase()}
                                </Badge>
                                <Badge className="bg-green-600 text-white border-2 border-black text-xs">
                                  {agent.voiceProvider.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="font-bold">Voice:</span>
                              <span>{agent.voiceId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold">Language:</span>
                              <span>{agent.language}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold">Temperature:</span>
                              <span>{agent.temperature}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold">Knowledge Base:</span>
                              <span>{agent.ragWorkflows.length} workflows</span>
                            </div>
                          </div>

                          <Button
                            className="w-full mt-4 bg-[rgb(0,82,255)] text-white border-2 border-black font-bold"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectAgent(agent)
                            }}
                          >
                            <UilPlay className="h-4 w-4 mr-2" />
                            LOAD AGENT
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-500">No prebuilt agents found matching your search.</p>
                  </div>
                )
              ) : (
                filteredCustomAgents.length > 0 ? (
                  filteredCustomAgents.map((agent) => (
                    <Card
                      key={agent.id}
                      className="cursor-pointer border-2 border-black transition-all bg-white hover:shadow-[4px_4px_0_rgba(0,0,0,1)]"
                      onClick={() => onSelectAgent(agent)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 border-2 border-black flex items-center justify-center bg-gray-200">
                            <UilBrain className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-lg text-black mb-1">{agent.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gray-600 text-white border-2 border-black text-xs">
                                CUSTOM
                              </Badge>
                              <Badge className="bg-green-600 text-white border-2 border-black text-xs">
                                {agent.voiceProvider.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-bold">Created:</span>
                            <span>{agent.createdAt}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold">Voice:</span>
                            <span>{agent.voiceId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold">Temperature:</span>
                            <span>{agent.temperature}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold">Knowledge Base:</span>
                            <span>{agent.ragWorkflows.length} workflows</span>
                          </div>
                        </div>

                        <Button
                          className="w-full mt-4 bg-[rgb(0,82,255)] text-white border-2 border-black font-bold"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectAgent(agent)
                          }}
                        >
                          <UilPlay className="h-4 w-4 mr-2" />
                          LOAD AGENT
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-500 mb-4">No custom agents found.</p>
                    <p className="text-sm text-gray-400">Configure settings in the playground and save them as custom agents.</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Configuration Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background">
            <CardHeader className="border-b-4 border-black bg-[rgb(147,51,234)]">
              <CardTitle className="text-xl font-black uppercase text-white" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                SAVE CONFIGURATION
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                    Configuration Name
                  </label>
                  <Input
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., My Custom Sales Agent"
                    className="border-2 border-black font-bold"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="neutral"
                    onClick={() => setSaveModalOpen(false)}
                    className="flex-1"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleSaveConfiguration}
                    disabled={!configName.trim()}
                    className="flex-1 bg-[rgb(147,51,234)] text-white"
                  >
                    <UilSave className="h-4 w-4 mr-2" />
                    SAVE
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}