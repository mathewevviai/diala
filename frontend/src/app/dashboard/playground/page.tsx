'use client'

import { useState } from 'react'
import PlaygroundChatInterface from '@/components/custom/playground-chat-interface'
import PlaygroundSettingsPanel from '@/components/custom/playground-settings-panel'

export default function PlaygroundPage() {
  const [configuration, setConfiguration] = useState({
    model: 'Chatterbox (Open Source)',
    voice: 'Nova',
    language: 'English (United States)',
    systemPrompt: '',
    temperature: [0.7],
    maxTokens: [500],
    selectedRagWorkflows: [],
    voiceProvider: 'chatterbox',
    codeExecution: false,
    functionCalling: false,
    automaticFunction: false,
    groundingSearch: false,
    urlContext: false,
    relevanceThreshold: [0.7],
    maxResults: [5]
  })

  const [currentAgent, setCurrentAgent] = useState<any>(null)

  const handleConfigurationChange = (newConfig: any) => {
    setConfiguration(prev => ({ ...prev, ...newConfig }))
  }

  const handleAgentChange = (agent: any) => {
    setCurrentAgent(agent)
  }

  return (
    <div className="h-full overflow-y-auto flex bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1">
        <PlaygroundChatInterface 
          currentConfiguration={configuration}
          onConfigurationChange={handleConfigurationChange}
          onAgentChange={handleAgentChange}
        />
      </div>
      
      {/* Settings Panel */}
      <PlaygroundSettingsPanel 
        configuration={configuration}
        onConfigurationChange={handleConfigurationChange}
        currentAgent={currentAgent}
      />
    </div>
  )
}