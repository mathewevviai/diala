"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  X, ChevronDown, ChevronUp, Code, 
  Info, AlertCircle, HelpCircle
} from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExpressionEditor from './ExpressionEditor'

interface NodeProperty {
  displayName: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'options' | 'collection' | 'json' | 'multiOptions'
  default?: any
  required?: boolean
  description?: string
  placeholder?: string
  options?: Array<{ name: string; value: string }>
  typeOptions?: any
  displayOptions?: {
    show?: { [key: string]: any[] }
    hide?: { [key: string]: any[] }
  }
}

interface NodePropertiesPanelProps {
  node: any
  nodeType: string
  properties: NodeProperty[]
  onClose: () => void
  onUpdate: (nodeId: string, data: any) => void
}

export default function NodePropertiesPanel({
  node,
  nodeType,
  properties = [],
  onClose,
  onUpdate
}: NodePropertiesPanelProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('parameters')
  const [showExpressionEditor, setShowExpressionEditor] = useState<string | null>(null)

  useEffect(() => {
    // Initialize values from node data
    if (node?.data?.parameters) {
      setValues(node.data.parameters)
    }
  }, [node])

  const handleValueChange = (name: string, value: any) => {
    const newValues = { ...values, [name]: value }
    setValues(newValues)
    
    // Update node data
    if (node) {
      onUpdate(node.id, {
        ...node.data,
        parameters: newValues
      })
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const shouldShowProperty = (property: NodeProperty): boolean => {
    if (!property.displayOptions) return true

    const { show, hide } = property.displayOptions

    if (show) {
      for (const [param, expectedValues] of Object.entries(show)) {
        const currentValue = values[param]
        if (!expectedValues.includes(currentValue)) {
          return false
        }
      }
    }

    if (hide) {
      for (const [param, expectedValues] of Object.entries(hide)) {
        const currentValue = values[param]
        if (expectedValues.includes(currentValue)) {
          return false
        }
      }
    }

    return true
  }

  const renderPropertyInput = (property: NodeProperty) => {
    const value = values[property.name] ?? property.default ?? ''

    switch (property.type) {
      case 'string':
        if (property.typeOptions?.rows) {
          return (
            <div className="relative">
              <Textarea
                value={value}
                onChange={(e) => handleValueChange(property.name, e.target.value)}
                placeholder={property.placeholder}
                rows={property.typeOptions.rows}
                className="border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] focus:shadow-[4px_4px_0_rgba(0,0,0,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setShowExpressionEditor(property.name)}
              >
                <Code className="w-4 h-4" />
              </Button>
            </div>
          )
        }
        return (
          <div className="relative">
            <Input
              value={value}
              onChange={(e) => handleValueChange(property.name, e.target.value)}
              placeholder={property.placeholder}
              className="border-3 border-black focus:shadow-[4px_4px_0_rgba(0,0,0,1)]"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0"
              onClick={() => setShowExpressionEditor(property.name)}
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(property.name, parseFloat(e.target.value) || 0)}
            placeholder={property.placeholder}
            className="border-3 border-black focus:shadow-[4px_4px_0_rgba(0,0,0,1)]"
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={value}
              onCheckedChange={(checked) => handleValueChange(property.name, checked)}
            />
            <span className="text-sm font-medium">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )

      case 'options':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleValueChange(property.name, val)}
          >
            <SelectTrigger className="border-3 border-black focus:shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'json':
        return (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExpressionEditor(property.name)}
              className="w-full"
            >
              <Code className="w-4 h-4 mr-2" />
              Edit JSON
            </Button>
            <pre className="p-3 bg-gray-100 border-3 border-black text-xs overflow-auto max-h-32 shadow-[2px_2px_0_rgba(0,0,0,1)]">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        )

      default:
        return (
          <div className="text-sm text-gray-500">
            Unsupported field type: {property.type}
          </div>
        )
    }
  }

  // Group properties by category
  const groupedProperties = properties.reduce((acc, prop) => {
    const category = prop.typeOptions?.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(prop)
    return acc
  }, {} as Record<string, NodeProperty[]>)

  return (
    <>
      <Card className="node-properties-panel border-0">
        <CardHeader className="border-b-4 border-black p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black uppercase">
              {node?.data?.label || 'Node Properties'}
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

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 border-b-3 border-black">
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="p-4 space-y-6">
              {Object.entries(groupedProperties).map(([category, props]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center justify-between p-3 bg-gray-100 border-3 border-black hover:bg-gray-200 transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)]"
                  >
                    <span className="font-bold uppercase text-sm">{category}</span>
                    {expandedSections.has(category) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedSections.has(category) && (
                    <div className="p-4 border-2 border-t-0 border-black space-y-4">
                      {props.filter(shouldShowProperty).map((property) => (
                        <div key={property.name}>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-bold">
                              {property.displayName}
                            </label>
                            {property.required && (
                              <span className="text-xs text-red-500 font-bold">*</span>
                            )}
                            {property.description && (
                              <HelpCircle className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          {renderPropertyInput(property)}
                          {property.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {property.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="p-4 space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">Node Name</label>
                <Input
                  value={node?.data?.label || ''}
                  onChange={(e) => onUpdate(node.id, {
                    ...node.data,
                    label: e.target.value
                  })}
                  className="border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] focus:shadow-[4px_4px_0_rgba(0,0,0,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-2 block">Notes</label>
                <Textarea
                  value={node?.data?.notes || ''}
                  onChange={(e) => onUpdate(node.id, {
                    ...node.data,
                    notes: e.target.value
                  })}
                  placeholder="Add notes about this node..."
                  rows={4}
                  className="border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] focus:shadow-[4px_4px_0_rgba(0,0,0,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={node?.data?.disabled !== true}
                  onCheckedChange={(checked) => onUpdate(node.id, {
                    ...node.data,
                    disabled: !checked
                  })}
                />
                <span className="text-sm font-medium">
                  {node?.data?.disabled ? 'Node Disabled' : 'Node Enabled'}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="info" className="p-4 space-y-4">
              <div className="p-4 bg-blue-100 border-3 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm mb-1">Node Type: {nodeType}</h4>
                    <p className="text-xs text-gray-700">
                      This node type handles specific operations in your workflow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase">Node Information</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Node ID:</span>
                    <span className="font-mono">{node?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span>{node?.data?.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span>x: {Math.round(node?.position?.x || 0)}, y: {Math.round(node?.position?.y || 0)}</span>
                  </div>
                </div>
              </div>

              {node?.data?.error && (
                <div className="p-4 bg-red-100 border-3 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm mb-1">Error</h4>
                      <p className="text-xs text-gray-700">{node.data.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Expression Editor Modal */}
      {showExpressionEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle>Expression Editor - {showExpressionEditor}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExpressionEditor(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ExpressionEditor
                value={values[showExpressionEditor] || ''}
                onChange={(value) => {
                  handleValueChange(showExpressionEditor, value)
                }}
                context={{
                  $json: node?.data || {},
                  $node: { name: node?.data?.label },
                  $workflow: { name: 'Current Workflow' }
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}