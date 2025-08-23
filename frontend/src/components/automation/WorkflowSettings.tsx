"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { Node } from '@xyflow/react'

interface WorkflowSettingsProps {
  onClose: () => void
  selectedNode: Node | null
  onNodeUpdate: (nodeId: string, data: any) => void
}

export default function WorkflowSettings({ onClose, selectedNode, onNodeUpdate }: WorkflowSettingsProps) {
  const [nodeParams, setNodeParams] = useState(selectedNode?.data.parameters || {})

  const handleParamChange = (key: string, value: any) => {
    const newParams = { ...nodeParams, [key]: value }
    setNodeParams(newParams)
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { parameters: newParams })
    }
  }

  const renderNodeSettings = () => {
    if (!selectedNode) {
      return <p className="text-gray-500">Select a node to configure</p>
    }

    const nodeType = selectedNode.data.type

    switch (nodeType) {
      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold uppercase">Path</label>
              <Input
                value={nodeParams.path || ''}
                onChange={(e) => handleParamChange('path', e.target.value)}
                placeholder="/webhook/my-webhook"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase">Method</label>
              <select
                value={nodeParams.method || 'POST'}
                onChange={(e) => handleParamChange('method', e.target.value)}
                className="w-full mt-1 p-2 border-3 border-black"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        )

      case 'httpRequest':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold uppercase">URL</label>
              <Input
                value={nodeParams.url || ''}
                onChange={(e) => handleParamChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase">Method</label>
              <select
                value={nodeParams.method || 'GET'}
                onChange={(e) => handleParamChange('method', e.target.value)}
                className="w-full mt-1 p-2 border-3 border-black"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold uppercase">Headers (JSON)</label>
              <Textarea
                value={nodeParams.headers || '{}'}
                onChange={(e) => handleParamChange('headers', e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>
            {['POST', 'PUT', 'PATCH'].includes(nodeParams.method) && (
              <div>
                <label className="text-sm font-bold uppercase">Body (JSON)</label>
                <Textarea
                  value={nodeParams.body || '{}'}
                  onChange={(e) => handleParamChange('body', e.target.value)}
                  placeholder='{"key": "value"}'
                  className="mt-1 font-mono text-sm"
                  rows={4}
                />
              </div>
            )}
          </div>
        )

      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold uppercase">Python Code</label>
              <Textarea
                value={nodeParams.code || '# Access input data via input_data variable\n# Set output variable to return data\n\noutput = input_data'}
                onChange={(e) => handleParamChange('code', e.target.value)}
                className="mt-1 font-mono text-sm"
                rows={10}
              />
            </div>
          </div>
        )

      case 'dialaMakeCall':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold uppercase">Phone Number</label>
              <Input
                value={nodeParams.phone_number || ''}
                onChange={(e) => handleParamChange('phone_number', e.target.value)}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase">Agent ID</label>
              <Input
                value={nodeParams.agent_id || ''}
                onChange={(e) => handleParamChange('agent_id', e.target.value)}
                placeholder="agent-123"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase">Initial Message</label>
              <Textarea
                value={nodeParams.initial_message || ''}
                onChange={(e) => handleParamChange('initial_message', e.target.value)}
                placeholder="Hello, this is a call from..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return <p className="text-gray-500">No settings available for this node type</p>
    }
  }

  return (
    <Card className="w-96 h-full border-l-3 border-black overflow-y-auto">
      <CardHeader className="border-b-3 border-black p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black uppercase">
            {selectedNode ? `Configure ${selectedNode.data.label}` : 'Node Settings'}
          </CardTitle>
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
      <CardContent className="p-4">
        {renderNodeSettings()}
      </CardContent>
    </Card>
  )
}