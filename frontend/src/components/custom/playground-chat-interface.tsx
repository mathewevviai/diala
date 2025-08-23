'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UilSetting, UilTimes, UilTrash, UilRobot, UilPlay } from '@tooni/iconscout-unicons-react'
import PlaygroundAgentModal from './playground-agent-modal'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

interface Agent {
  id: string
  name: string
  description: string
  purpose: string
  voiceProvider: string
  voiceId: string
  language: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  ragWorkflows: string[]
  isCustom?: boolean
}

interface PlaygroundChatInterfaceProps {
  currentConfiguration?: any
  onConfigurationChange?: (config: any) => void
  onAgentChange?: (agent: Agent | null) => void
}

export default function PlaygroundChatInterface({ 
  currentConfiguration, 
  onConfigurationChange,
  onAgentChange 
}: PlaygroundChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'This is a simulated response from the assistant.',
        sender: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }

  const handleConnect = () => {
    setIsConnected(!isConnected)
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const handleSelectAgent = (agent: Agent) => {
    setCurrentAgent(agent)
    setAgentModalOpen(false)
    
    // Notify parent component about agent change
    if (onAgentChange) {
      onAgentChange(agent)
    }
    
    // Apply agent configuration to settings panel
    if (onConfigurationChange) {
      onConfigurationChange({
        model: agent.voiceProvider === 'chatterbox' ? 'Chatterbox (Open Source)' : 'OpenAI GPT-4',
        voice: agent.voiceId,
        language: agent.language,
        systemPrompt: agent.systemPrompt,
        temperature: [agent.temperature],
        maxTokens: [agent.maxTokens],
        selectedRagWorkflows: agent.ragWorkflows,
        voiceProvider: agent.voiceProvider
      })
    }

    // Add system message about agent
    const systemMessage = {
      id: Date.now().toString(),
      content: `Loaded agent: ${agent.name}. ${agent.description}`,
      sender: 'assistant' as const,
      timestamp: new Date(),
    }
    setMessages([systemMessage])
  }

  const handleSaveConfiguration = (name: string, configuration: any) => {
    // Here you would typically save to a backend or local storage
    console.log('Saving configuration:', { name, configuration })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b-4 border-black">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            Stream Realtime
          </h1>
          {currentAgent && (
            <div className="flex items-center gap-2">
              <Badge className="bg-[rgb(0,82,255)] text-white border-2 border-black">
                {currentAgent.name}
              </Badge>
              <Badge className="bg-green-600 text-white border-2 border-black text-xs">
                {currentAgent.voiceProvider.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="neutral" 
            className="border-2 border-black font-bold"
            onClick={() => setAgentModalOpen(true)}
          >
            <UilRobot className="h-4 w-4 mr-2" />
            {currentAgent ? 'CHANGE AGENT' : 'SELECT AGENT'}
          </Button>
          <Button 
            variant="neutral" 
            size="sm"
            className="border-2 border-black font-bold"
          >
            <UilSetting className="h-4 w-4" />
          </Button>
          <Button 
            variant="neutral" 
            size="sm"
            className="border-2 border-black font-bold"
          >
            <UilTimes className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-4">
                <div className={`w-16 h-16 mx-auto border-2 border-black ${isConnected ? 'bg-green-400' : 'bg-red-400'} flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
                  <span className="text-2xl font-black text-white">
                    {isConnected ? '✓' : '✕'}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 font-bold">
                {isConnected ? 'Connected' : 'Connection failed'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`
                  p-4 border-2 border-black text-sm
                  ${message.sender === 'user' 
                    ? 'bg-[rgb(0,82,255)] text-white ml-8 shadow-[4px_4px_0_rgba(0,0,0,1)]' 
                    : 'bg-gray-100 mr-8 shadow-[4px_4px_0_rgba(0,0,0,1)]'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 border-2 border-black flex items-center justify-center ${message.sender === 'user' ? 'bg-white' : 'bg-green-500'}`}>
                    {message.sender === 'user' ? (
                      <span className="text-[rgb(0,82,255)] font-black text-xs">U</span>
                    ) : (
                      <span className="text-white font-black text-xs">A</span>
                    )}
                  </div>
                  <p className="font-bold text-sm uppercase">
                    {message.sender === 'user' ? 'USER' : 'ASSISTANT'}
                  </p>
                </div>
                <p>{message.content}</p>
                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t-4 border-black">
        <div className="flex gap-2 mb-3">
          <Button
            onClick={handleClearChat}
            variant="neutral"
            className="border-2 border-black font-bold"
          >
            <UilTrash className="h-4 w-4 mr-2" />
            Clear the chat to start a new stream
          </Button>
          <Button
            onClick={handleConnect}
            className={`border-2 border-black font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] ${
              isConnected 
                ? 'bg-red-400 hover:bg-red-500 text-black' 
                : 'bg-green-400 hover:bg-green-500 text-black'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 border-2 border-black font-bold"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !inputValue.trim()}
            className="bg-blue-400 hover:bg-blue-500 border-2 border-black font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] text-black"
          >
            Run Ctrl+↵
          </Button>
        </div>
      </div>

      {/* Agent Selection Modal */}
      <PlaygroundAgentModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        onSelectAgent={handleSelectAgent}
        onSaveConfiguration={handleSaveConfiguration}
        currentConfiguration={currentConfiguration}
      />
    </div>
  )
}