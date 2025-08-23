'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UilMicrophone, UilVolumeUp } from '@tooni/iconscout-unicons-react'
import PlaygroundChatInterface from '@/components/custom/playground-chat-interface'
import PlaygroundSettingsPanel from '@/components/custom/playground-settings-panel'

export default function PlaygroundPage() {
  const [configuration, setConfiguration] = useState({
    model: 'OpenAI GPT-4o Realtime',
    voice: 'Rachel',
    language: 'English (United States)',
    systemPrompt: '',
    temperature: [0.7],
    maxTokens: [500],
    selectedRagWorkflows: [] as string[],
    voiceProvider: 'elevenlabs',
    codeExecution: false,
    functionCalling: false,
    automaticFunction: false,
    groundingSearch: false,
    urlContext: false,
    relevanceThreshold: [0.7],
    maxResults: [5],
  })

  const [currentAgent, setCurrentAgent] = useState<any>(null)
  const [devMode, setDevMode] = useState(false)

  const handleConfigurationChange = (newConfig: any) => {
    setConfiguration(prev => ({ ...prev, ...newConfig }))
  }

  const handleAgentChange = (agent: any) => {
    setCurrentAgent(agent)
  }

  useEffect(() => {
    if (devMode) {
      // Auto-fill with realistic Voice Agent defaults
      setConfiguration(prev => ({
        ...prev,
        model: 'OpenAI GPT-4o Realtime',
        voiceProvider: 'elevenlabs',
        voice: 'Rachel',
        language: 'English (United States)',
        systemPrompt:
          "You are Sarah, a professional sales assistant. Be concise, proactive, and courteous. Ask clarifying questions and keep responses under 3 sentences.",
        temperature: [0.7],
        maxTokens: [500],
        selectedRagWorkflows: ['sales-objection-master', 'technical-docs'],
        codeExecution: false,
        functionCalling: true,
        automaticFunction: false,
        groundingSearch: false,
        urlContext: false,
        relevanceThreshold: [0.75],
        maxResults: [5],
      }))
    }
  }, [devMode])

  return (
    <div
      className="min-h-screen bg-pink-500 relative pb-8"
      style={{
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage:
          'linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    >
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setDevMode(!devMode)}
            className={`h-10 px-4 text-sm font-black uppercase ${
              devMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-black'
            } border-2 border-black`}
          >
            DEV MODE {devMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Persistent Title Card */}
          <Card className="transform rotate-1 relative overflow-visible border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <CardHeader className="relative">
              {/* Decorative elements */}
              <div className="absolute top-2 left-4 w-8 h-8 bg-pink-600 border-2 border-black flex items-center justify-center">
                <UilMicrophone className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-pink-500 border-2 border-black flex items-center justify-center">
                <UilVolumeUp className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>

              {/* Central icon button */}
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-pink-600 hover:bg-pink-700 border-4 border-black p-0">
                  <UilMicrophone className="h-12 w-12 text-white" />
                </Button>
              </div>

              {/* Dynamic title */}
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                Voice Playground
              </CardTitle>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                Configure your agent and test real-time conversation
              </p>

              {/* Animated decorative bars */}
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-pink-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-pink-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-pink-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>

          {/* Content grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-4 border-black bg-white shadow-[6px_6px_0_rgba(0,0,0,1)]">
              <CardContent className="p-0">
                <PlaygroundChatInterface
                  currentConfiguration={configuration}
                  onConfigurationChange={handleConfigurationChange}
                  onAgentChange={handleAgentChange}
                />
              </CardContent>
            </Card>

            <Card className="border-4 border-black bg-white shadow-[6px_6px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <PlaygroundSettingsPanel
                  configuration={configuration}
                  onConfigurationChange={handleConfigurationChange}
                  currentAgent={currentAgent}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}