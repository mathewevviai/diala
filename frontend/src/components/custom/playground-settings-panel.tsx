'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import PremiumFeatureCard from './premium-feature-card'
import { cn } from '@/lib/utils'
import { 
  UilDollarSign, 
  UilHeadphonesAlt, 
  UilCalendarAlt, 
  UilDesktop, 
  UilSetting,
  UilCheckCircle,
  UilBrain,
  UilInfoCircle,
  UilLock,
  UilUser,
  UilCreditCard,
  UilKeyboard,
  UilUsersAlt,
  UilUserPlus,
  UilEnvelope,
  UilCommentAlt,
  UilPlusCircle,
  UilPlus,
  UilGithub,
  UilQuestionCircle,
  UilCloud,
  UilSignOutAlt,
  UilMicrophone,
  UilGlobe,
  UilAngleDown,
  UilMusicNote,
  UilVolumeUp,
  UilUpload
} from '@tooni/iconscout-unicons-react'

interface PlaygroundSettingsPanelProps {
  configuration: any
  onConfigurationChange: (config: any) => void
  currentAgent?: any
}

export default function PlaygroundSettingsPanel({ 
  configuration, 
  onConfigurationChange,
  currentAgent 
}: PlaygroundSettingsPanelProps) {
  // Audio files from app.tsx
  const mockAudioFiles = [
    { name: 'CrowdedOfficeAudio.m4a', category: 'Crowded Office', description: 'Busy office environment with typing and conversations' },
    { name: 'CafeAudio.m4a', category: 'Café Ambience', description: 'Coffee shop atmosphere with light chatter' },
    { name: 'CoworkingAudio.m4a', category: 'Co-Working Space', description: 'Modern workspace with collaborative energy' },
    { name: 'TrainstationAudio.m4a', category: 'Train Station', description: 'Transit hub with announcements and movement' },
    { name: 'LibraryAudio.m4a', category: 'Library', description: 'Quiet study environment with subtle sounds' },
  ];

  const handleSelectAudio = (fileName: string) => {
    const selectedAudio = configuration.selectedAudio === fileName ? null : fileName;
    updateConfig({ selectedAudio });
  };

  const handleFileUpload = (file: File) => {
    const fileName = file.name;
    updateConfig({ selectedAudio: fileName });
    console.log('File uploaded:', fileName);
  };

  // Use configuration from props instead of local state
  const model = configuration.model
  const voice = configuration.voice
  const language = configuration.language
  const temperature = configuration.temperature
  const maxTokens = configuration.maxTokens
  const systemPrompt = configuration.systemPrompt
  const selectedRagWorkflows = configuration.selectedRagWorkflows
  const relevanceThreshold = configuration.relevanceThreshold
  const maxResults = configuration.maxResults
  const codeExecution = configuration.codeExecution
  const functionCalling = configuration.functionCalling
  const automaticFunction = configuration.automaticFunction
  const groundingSearch = configuration.groundingSearch
  const urlContext = configuration.urlContext

  const updateConfig = (updates: any) => {
    onConfigurationChange(updates)
  }

  const RAG_WORKFLOWS = [
    {
      id: 'sales-objection-master',
      name: 'Sales Objection Master',
      description: 'Comprehensive sales objection handling with 9 focus areas',
      stats: { embeddings: 2847, sources: 'YouTube + Documents', focusAreas: 9 },
      icon: UilDollarSign,
      color: 'purple'
    },
    {
      id: 'customer-support-kb',
      name: 'Customer Support Knowledge',
      description: 'Product documentation, FAQs, and troubleshooting procedures',
      stats: { embeddings: 1523, sources: 'Documents + URLs', focusAreas: 6 },
      icon: UilHeadphonesAlt,
      color: 'green'
    },
    {
      id: 'appointment-scripts',
      name: 'Appointment Setting Playbook',
      description: 'Proven scripts and techniques for booking meetings',
      stats: { embeddings: 892, sources: 'Documents', focusAreas: 4 },
      icon: UilCalendarAlt,
      color: 'orange'
    },
    {
      id: 'technical-docs',
      name: 'Technical Documentation Hub',
      description: 'API docs, integration guides, and technical specifications',
      stats: { embeddings: 3156, sources: 'Documents + URLs', focusAreas: 8 },
      icon: UilDesktop,
      color: 'pink'
    }
  ]

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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-80 bg-white border-l-4 border-black p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Current Agent Information */}
            {currentAgent && (
              <div>
            <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Current Agent
            </label>
            <Card className="border-2 border-black bg-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 border-2 border-black flex items-center justify-center bg-${getPurposeColor(currentAgent.purpose)}-200`}>
                    {(() => {
                      const Icon = getPurposeIcon(currentAgent.purpose)
                      return <Icon className={`h-5 w-5 text-${getPurposeColor(currentAgent.purpose)}-600`} />
                    })()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-black mb-1">{currentAgent.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{currentAgent.description}</p>
                    <div className="flex items-center gap-1 mb-2">
                      <Badge className={`bg-${getPurposeColor(currentAgent.purpose)}-600 text-white border-1 border-black text-xs`}>
                        {currentAgent.purpose.toUpperCase()}
                      </Badge>
                      <Badge className={cn(
                        "border-1 border-black text-xs",
                        currentAgent.voiceProvider === 'chatterbox' 
                          ? "bg-green-600 text-white" 
                          : "bg-blue-600 text-white"
                      )}>
                        {currentAgent.voiceProvider.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">Voice:</span>
                    <span>{currentAgent.voiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Language:</span>
                    <span>{currentAgent.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Temperature:</span>
                    <span>{currentAgent.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Knowledge Base:</span>
                    <span>{currentAgent.ragWorkflows?.length || 0} workflows</span>
                  </div>
                  {currentAgent.isCustom && (
                    <div className="flex justify-between">
                      <span className="font-bold">Created:</span>
                      <span>{currentAgent.createdAt}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Model Selection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              AI Model
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0 bg-transparent border-none outline-none">
                  <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Choose the underlying AI model for conversation logic</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            <Card 
              onClick={() => updateConfig({ model: 'Gemini Live 002' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                model === 'Gemini Live 002' 
                  ? "bg-purple-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm">Gemini Live 002</span>
                    <Badge className="bg-purple-600 text-white border-2 border-black text-xs ml-2">FAST</Badge>
                    <p className="text-xs text-gray-600 mt-1">Ultra-fast inference, real-time</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 border-2 border-black",
                    model === 'Gemini Live 002' && "bg-purple-600"
                  )} />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              onClick={() => updateConfig({ model: 'OpenAI GPT-4o Realtime' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                model === 'OpenAI GPT-4o Realtime' 
                  ? "bg-blue-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm">GPT-4o Realtime</span>
                    <Badge className="bg-blue-600 text-white border-2 border-black text-xs ml-2">PREMIUM</Badge>
                    <p className="text-xs text-gray-600 mt-1">Advanced reasoning, fast inference</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 border-2 border-black",
                    model === 'OpenAI GPT-4o Realtime' && "bg-blue-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ model: 'Claude 3.5 Sonnet' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                model === 'Claude 3.5 Sonnet' 
                  ? "bg-orange-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm">Claude 3.5 Sonnet</span>
                    <Badge className="bg-orange-600 text-white border-2 border-black text-xs ml-2">SMART</Badge>
                    <p className="text-xs text-gray-600 mt-1">Excellent reasoning, coding</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 border-2 border-black",
                    model === 'Claude 3.5 Sonnet' && "bg-orange-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ model: 'Llama 3.2 90B' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                model === 'Llama 3.2 90B' 
                  ? "bg-green-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm">Llama 3.2 90B</span>
                    <Badge className="bg-green-600 text-white border-2 border-black text-xs ml-2">OPEN SOURCE</Badge>
                    <p className="text-xs text-gray-600 mt-1">Free, fast open-source model</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 border-2 border-black",
                    model === 'Llama 3.2 90B' && "bg-green-600"
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Voice/TTS Provider */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Voice Provider
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0 bg-transparent border-none outline-none">
                  <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Choose the text-to-speech provider for voice generation</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="space-y-2 mb-3">
            <Card 
              onClick={() => updateConfig({ voiceProvider: 'openai' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'openai' 
                  ? "bg-blue-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">OpenAI TTS</span>
                    <p className="text-xs text-gray-600">Natural voices, fast</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'openai' && "bg-blue-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'google' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'google' 
                  ? "bg-red-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">Google TTS</span>
                    <p className="text-xs text-gray-600">Multilingual, WaveNet</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'google' && "bg-red-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'elevenlabs' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'elevenlabs' 
                  ? "bg-purple-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">ElevenLabs</span>
                    <Badge className="bg-purple-600 text-white border-1 border-black text-xs ml-1">PREMIUM</Badge>
                    <p className="text-xs text-gray-600">Ultra-realistic voices</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'elevenlabs' && "bg-purple-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'chatterbox' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'chatterbox' 
                  ? "bg-green-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">Chatterbox</span>
                    <Badge className="bg-green-600 text-white border-1 border-black text-xs ml-1">OPEN SOURCE</Badge>
                    <p className="text-xs text-gray-600">Free, local TTS</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'chatterbox' && "bg-green-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'kokoro' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'kokoro' 
                  ? "bg-cyan-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">Kokoro TTS</span>
                    <Badge className="bg-cyan-600 text-white border-1 border-black text-xs ml-1">LOCAL</Badge>
                    <p className="text-xs text-gray-600">Fast neural TTS</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'kokoro' && "bg-cyan-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'dia' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'dia' 
                  ? "bg-teal-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">Dia TTS</span>
                    <Badge className="bg-teal-600 text-white border-1 border-black text-xs ml-1">LOCAL</Badge>
                    <p className="text-xs text-gray-600">Voice cloning TTS</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'dia' && "bg-teal-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'orpheus' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'orpheus' 
                  ? "bg-indigo-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">Orpheus TTS</span>
                    <Badge className="bg-indigo-600 text-white border-1 border-black text-xs ml-1">LOCAL</Badge>
                    <p className="text-xs text-gray-600">Expressive speech</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'orpheus' && "bg-indigo-600"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => updateConfig({ voiceProvider: 'chattts' })}
              className={cn(
                "cursor-pointer border-2 border-black transition-all bg-white",
                configuration.voiceProvider === 'chattts' 
                  ? "bg-lime-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                  : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs">ChatTTS</span>
                    <Badge className="bg-lime-600 text-white border-1 border-black text-xs ml-1">LOCAL</Badge>
                    <p className="text-xs text-gray-600">Conversational TTS</p>
                  </div>
                  <div className={cn(
                    "w-3 h-3 border-2 border-black",
                    configuration.voiceProvider === 'chattts' && "bg-lime-600"
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voice Selection */}
          <div className="relative">
            <label className="block text-xs font-black uppercase text-black mb-1">Voice Selection</label>
            <div className="relative">
              <UilMicrophone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-black pointer-events-none" />
              <select 
                value={voice} 
                onChange={(e) => updateConfig({ voice: e.target.value })}
                className="w-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] p-2 pl-8 text-xs font-bold appearance-none bg-white cursor-pointer hover:bg-gray-50"
              >
                {configuration.voiceProvider === 'openai' && (
                  <>
                    <option value="Nova">Nova</option>
                    <option value="Alloy">Alloy</option>
                    <option value="Echo">Echo</option>
                    <option value="Fable">Fable</option>
                    <option value="Onyx">Onyx</option>
                    <option value="Shimmer">Shimmer</option>
                  </>
                )}
                {configuration.voiceProvider === 'google' && (
                  <>
                    <option value="en-US-Neural2-A">en-US-Neural2-A</option>
                    <option value="en-US-Neural2-C">en-US-Neural2-C</option>
                    <option value="en-US-Neural2-D">en-US-Neural2-D</option>
                    <option value="en-US-Neural2-E">en-US-Neural2-E</option>
                    <option value="en-US-Neural2-F">en-US-Neural2-F</option>
                  </>
                )}
                {configuration.voiceProvider === 'elevenlabs' && (
                  <>
                    <option value="Rachel">Rachel</option>
                    <option value="Drew">Drew</option>
                    <option value="Clyde">Clyde</option>
                    <option value="Paul">Paul</option>
                    <option value="Domi">Domi</option>
                    <option value="Dave">Dave</option>
                  </>
                )}
                {configuration.voiceProvider === 'chatterbox' && (
                  <>
                    <option value="Female-1">Female-1</option>
                    <option value="Male-1">Male-1</option>
                    <option value="Neutral-1">Neutral-1</option>
                    <option value="Child-1">Child-1</option>
                  </>
                )}
                {configuration.voiceProvider === 'kokoro' && (
                  <>
                    <option value="af_heart">af_heart</option>
                    <option value="af_sky">af_sky</option>
                    <option value="af_wave">af_wave</option>
                    <option value="am_adam">am_adam</option>
                    <option value="am_michael">am_michael</option>
                    <option value="bf_emma">bf_emma</option>
                    <option value="bf_isabella">bf_isabella</option>
                    <option value="bm_george">bm_george</option>
                    <option value="bm_lewis">bm_lewis</option>
                  </>
                )}
                {configuration.voiceProvider === 'dia' && (
                  <>
                    <option value="default">default</option>
                    <option value="custom-clone-1">custom-clone-1</option>
                    <option value="custom-clone-2">custom-clone-2</option>
                    <option value="custom-clone-3">custom-clone-3</option>
                  </>
                )}
                {configuration.voiceProvider === 'orpheus' && (
                  <>
                    <option value="tara">tara</option>
                    <option value="leah">leah</option>
                    <option value="zac">zac</option>
                    <option value="pierre">pierre</option>
                    <option value="max">max</option>
                    <option value="sophia">sophia</option>
                  </>
                )}
                {configuration.voiceProvider === 'chattts' && (
                  <>
                    <option value="Speaker-1">Speaker-1</option>
                    <option value="Speaker-2">Speaker-2</option>
                    <option value="Speaker-3">Speaker-3</option>
                    <option value="Speaker-4">Speaker-4</option>
                    <option value="Speaker-5">Speaker-5</option>
                    <option value="Random">Random</option>
                  </>
                )}
              </select>
              <UilAngleDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-black pointer-events-none" />
            </div>
          </div>
          
          {/* Voice Cloning Premium Feature */}
          <div className="mt-3">
            <Card className="relative overflow-hidden border-2 border-black bg-gray-100">
              <div className="absolute inset-0 bg-gray-200 opacity-60"></div>
              <CardContent className="p-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-xs uppercase text-black">Voice Cloning</h4>
                      <Badge className="bg-yellow-400 text-black border-1 border-black text-xs px-1 py-0">
                        PREMIUM
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-tight">Clone custom voices</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">$99/mo</span>
                    <div className="w-6 h-6 bg-gray-400 border-2 border-black flex items-center justify-center">
                      <UilLock className="h-3 w-3 text-gray-700" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Background Audio Selection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <label className="block text-sm font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Background Audio
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0 bg-transparent border-none outline-none">
                  <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Choose background audio environment for your agent</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="space-y-2 mb-3">
            {mockAudioFiles.map((file) => (
              <Card
                key={file.name}
                onClick={() => handleSelectAudio(file.name)}
                className={cn(
                  "cursor-pointer border-2 border-black transition-all bg-white",
                  configuration.selectedAudio === file.name
                    ? "bg-yellow-100 shadow-[4px_4px_0_rgba(0,0,0,1)]"
                    : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-[rgb(0,82,255)]">
                        <UilMusicNote className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="font-black text-sm">{file.category}</span>
                        <p className="text-xs text-gray-600">{file.description}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 border-2 border-black",
                      configuration.selectedAudio === file.name && "bg-yellow-600"
                    )} />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* File Upload Option */}
            <Card
              className="cursor-pointer border-2 border-black transition-all bg-white hover:shadow-[2px_2px_0_rgba(0,0,0,1)] border-dashed"
            >
              <CardContent className="p-3">
                <div 
                  className="flex items-center justify-between"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file && file.type.startsWith('audio/')) {
                        handleFileUpload(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-gray-200">
                      <UilUpload className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <span className="font-black text-sm">Upload Custom Audio</span>
                      <p className="text-xs text-gray-600">Drag & drop or click to browse</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 border-2 border-black" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            Language
          </label>
          <div className="relative">
            <UilGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
            <select 
              value={language} 
              onChange={(e) => updateConfig({ language: e.target.value })}
              className="w-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] p-2 pl-10 text-sm font-bold appearance-none bg-white"
            >
              <option>English (United States)</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
            <UilAngleDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              System Prompt
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0 bg-transparent border-none outline-none">
                  <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Define your AI's personality, behavior, and instructions</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            value={systemPrompt}
            onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
            placeholder="Define the AI's personality and behavior..."
            rows={3}
            className="border-2 border-black font-mono text-xs"
          />
        </div>

        {/* Model Parameters */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-black uppercase">Temperature</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-0 bg-transparent border-none outline-none">
                      <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Controls response creativity: 0 = focused, 2 = creative</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-bold">{temperature[0].toFixed(1)}</span>
            </div>
            <Slider
              value={temperature}
              onValueChange={(value) => updateConfig({ temperature: value })}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-gray-600 mt-1">Response creativity</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-black uppercase">Max Tokens</label>
                <Tooltip>
                  <TooltipTrigger>
                    <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum length of AI responses (higher = longer responses)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-bold">{maxTokens[0]}</span>
            </div>
            <Slider
              value={maxTokens}
              onValueChange={(value) => updateConfig({ maxTokens: value })}
              min={50}
              max={2000}
              step={50}
            />
            <p className="text-xs text-gray-600 mt-1">Response length limit</p>
          </div>
        </div>

        {/* RAG Knowledge Base */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              <UilBrain className="inline w-4 h-4 mr-1" />
              Knowledge Base (RAG)
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Retrieval Augmented Generation - Add specialized knowledge to your AI</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {RAG_WORKFLOWS.map((workflow) => {
              const Icon = workflow.icon
              const isSelected = selectedRagWorkflows.includes(workflow.id)
              return (
                <Card
                  key={workflow.id}
                  onClick={() => {
                    if (isSelected) {
                      updateConfig({ selectedRagWorkflows: selectedRagWorkflows.filter(id => id !== workflow.id) })
                    } else {
                      updateConfig({ selectedRagWorkflows: [...selectedRagWorkflows, workflow.id] })
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-2 border-black transition-all bg-white",
                    isSelected
                      ? `bg-${workflow.color}-100 shadow-[4px_4px_0_rgba(0,0,0,1)]`
                      : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-8 h-8 border-2 border-black flex items-center justify-center flex-shrink-0",
                        isSelected ? `bg-${workflow.color}-200` : "bg-gray-100"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isSelected ? `text-${workflow.color}-600` : "text-gray-600"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xs text-black mb-1">{workflow.name}</h4>
                        <p className="text-xs text-gray-600 mb-1">{workflow.description}</p>
                        <p className="text-xs font-bold">{workflow.stats.embeddings.toLocaleString()} embeddings</p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 border-2 border-black flex items-center justify-center",
                        isSelected ? `bg-${workflow.color}-600` : "bg-white"
                      )}>
                        {isSelected && <UilCheckCircle className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* RAG Settings */}
        {selectedRagWorkflows.length > 0 && (
          <div>
            <h4 className="text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              RAG Settings
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-black uppercase">Relevance Threshold</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Minimum similarity score for retrieving knowledge (higher = more strict)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-xs font-bold">{(relevanceThreshold[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={relevanceThreshold}
                  onValueChange={(value) => updateConfig({ relevanceThreshold: value })}
                  min={0.5}
                  max={1}
                  step={0.05}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-black uppercase">Max Results</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum number of knowledge pieces to retrieve per query</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-xs font-bold">{maxResults[0]}</span>
                </div>
                <Slider
                  value={maxResults}
                  onValueChange={(value) => updateConfig({ maxResults: value })}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tools */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Tools
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced capabilities for your AI agent</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Code Execution</span>
                <Tooltip>
                  <TooltipTrigger>
                    <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Allow AI to run and execute code snippets</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={codeExecution}
                onCheckedChange={(checked) => updateConfig({ codeExecution: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Function calling</span>
                <Tooltip>
                  <TooltipTrigger>
                    <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enable AI to call external functions and APIs</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={functionCalling}
                onCheckedChange={(checked) => updateConfig({ functionCalling: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Automatic Function Response</span>
              <Switch
                checked={automaticFunction}
                onCheckedChange={(checked) => updateConfig({ automaticFunction: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Grounding with Google Search</span>
                <Tooltip>
                  <TooltipTrigger>
                    <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Allow AI to search Google for real-time information</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={groundingSearch}
                onCheckedChange={(checked) => updateConfig({ groundingSearch: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">URL context</span>
              <Switch
                checked={urlContext}
                onCheckedChange={(checked) => updateConfig({ urlContext: checked })}
              />
            </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}