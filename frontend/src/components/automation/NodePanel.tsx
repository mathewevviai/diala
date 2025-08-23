"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Webhook, Globe, Code, Phone, Zap, Database, Mail, Settings2 } from 'lucide-react'

interface NodePanelProps {
  onClose: () => void
}

const nodeCategories = [
  {
    name: 'Triggers',
    nodes: [
      { type: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger via HTTP request' },
    ],
  },
  {
    name: 'Actions',
    nodes: [
      { type: 'httpRequest', label: 'HTTP Request', icon: Globe, description: 'Make HTTP calls' },
      { type: 'dialaMakeCall', label: 'Make Call', icon: Phone, description: 'Initiate voice call' },
      { type: 'code', label: 'Code', icon: Code, description: 'Execute Python code' },
    ],
  },
  {
    name: 'Data',
    nodes: [
      { type: 'database', label: 'Database', icon: Database, description: 'Query database' },
      { type: 'set', label: 'Set', icon: Settings2, description: 'Set or transform data' },
    ],
  },
  {
    name: 'Communication',
    nodes: [
      { type: 'email', label: 'Send Email', icon: Mail, description: 'Send email messages' },
    ],
  },
]

export default function NodePanel({ onClose }: NodePanelProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('nodeData', JSON.stringify(nodeData))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card className="w-full h-full border-0 overflow-y-auto bg-white">
      <CardHeader className="border-b-4 border-black p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black uppercase">Add Node</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.name}>
            <h3 className="font-bold uppercase mb-3 text-sm">{category.name}</h3>
            <div className="space-y-2">
              {category.nodes.map((node) => {
                const Icon = node.icon
                return (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, 'custom', {
                      label: node.label,
                      type: node.type,
                      parameters: {},
                    })}
                    className="
                      p-3 border-4 border-black bg-white cursor-move
                      shadow-[4px_4px_0_rgba(0,0,0,1)]
                      hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]
                      transition-all flex items-center gap-3
                    "
                  >
                    <div className="w-10 h-10 bg-yellow-100 border-3 border-black flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{node.label}</div>
                      <div className="text-xs text-gray-600">{node.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}