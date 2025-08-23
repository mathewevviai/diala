"use client"

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { 
  Webhook, Globe, Code, Phone, Zap, Database, Mail, 
  Settings2, FileText, GitBranch, Calculator
} from 'lucide-react'

interface CustomNodeData {
  label: string
  type: string
  icon?: string
  parameters?: any
  color?: string
}

// Icon mapping
const iconMap: Record<string, any> = {
  webhook: Webhook,
  httpRequest: Globe,
  code: Code,
  dialaMakeCall: Phone,
  database: Database,
  email: Mail,
  set: Settings2,
  default: Zap,
}

const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const Icon = iconMap[data.type] || iconMap[data.icon || ''] || iconMap.default
  const nodeColor = data.color || getNodeColor(data.type)
  const isExecuting = data.executing
  const isExecuted = data.executed

  return (
    <Card
      className={`
        min-w-[180px] border-4 p-0 bg-white transition-all
        ${selected ? 'shadow-[6px_6px_0_rgba(0,82,255,1)] border-blue-600' : 'shadow-[4px_4px_0_rgba(0,0,0,1)]'}
        ${isExecuting ? 'animate-pulse border-yellow-500 shadow-[6px_6px_0_rgba(250,204,21,1)]' : ''}
        ${isExecuted ? 'border-green-500 shadow-[6px_6px_0_rgba(34,197,94,1)]' : 'border-black'}
        hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-3 border-black shadow-[1px_1px_0_rgba(0,0,0,1)]"
      />
      
      <div className="border-b-4 border-black p-3 flex items-center gap-3" style={{ backgroundColor: nodeColor }}>
        <div className="w-10 h-10 bg-white border-3 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm uppercase">{data.label}</div>
          <div className="text-xs opacity-75">{data.type}</div>
        </div>
      </div>
      <div className="p-3 bg-white">
        <div className="text-xs text-gray-600">
          {isExecuting && <span className="text-yellow-600 font-bold">Executing...</span>}
          {isExecuted && <span className="text-green-600 font-bold">✓ Completed</span>}
          {!isExecuting && !isExecuted && (
            data.parameters ? `${Object.keys(data.parameters).length} parameters` : 'Not configured'
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-3 border-black shadow-[1px_1px_0_rgba(0,0,0,1)]"
      />
    </Card>
  )
})

CustomNode.displayName = 'CustomNode'

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    webhook: '#fde047',      // yellow-300
    httpRequest: '#60a5fa',  // blue-400
    code: '#c084fc',         // purple-400
    dialaMakeCall: '#f87171', // red-400
    trigger: '#fde047',      // yellow-300
    action: '#60a5fa',       // blue-400
    logic: '#c084fc',        // purple-400
    output: '#4ade80',       // green-400
  }
  return colors[type] || '#e5e5e5'
}

export default CustomNode