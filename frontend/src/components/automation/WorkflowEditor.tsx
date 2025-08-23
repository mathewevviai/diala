"use client"

import React, { useCallback, useState, useRef, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Panel,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Play, Save, Plus, Settings2, Trash2, ChevronLeft,
  Webhook, Code, Phone, Globe, Zap, Loader2, X,
  History, Variable, FileJson, Copy, Undo, Redo
} from 'lucide-react'
import CustomNode from './CustomNode'
import NodePanel from './NodePanel'
import WorkflowSettings from './WorkflowSettings'
import NodePropertiesPanel from './NodePropertiesPanel'
import ExecutionHistory from './ExecutionHistory'
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution'
import { IWorkflowData } from '@/lib/workflow/workflow-executor'

// Custom node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

// Initial nodes for new workflows
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Webhook Trigger',
      type: 'webhook',
      parameters: {
        path: '/webhook/start',
        method: 'POST'
      },
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Make Call',
      type: 'dialaMakeCall',
      parameters: {
        phoneNumber: '+1234567890',
        agent: 'default'
      },
    },
  },
]

// Initial edges for demo
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'default',
  },
]

interface WorkflowEditorProps {
  workflowId?: string
  workflowName?: string
  onSave?: (workflow: any) => void
  onExecute?: (workflow: any) => void
  onBack?: () => void
}

function WorkflowEditorContent({ workflowId, workflowName, onSave, onExecute, onBack }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showNodePanel, setShowNodePanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [showExecutionHistory, setShowExecutionHistory] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const { screenToFlowPosition } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { executeWorkflow, isExecuting, executionResult, error } = useWorkflowExecution()
  
  // Node type properties mapping
  const nodeProperties = {
    webhook: [
      { displayName: 'Path', name: 'path', type: 'string' as const, default: '/webhook', required: true },
      { displayName: 'Method', name: 'method', type: 'options' as const, default: 'GET', options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' },
        { name: 'PUT', value: 'PUT' },
        { name: 'DELETE', value: 'DELETE' }
      ]},
    ],
    dialaMakeCall: [
      { displayName: 'Phone Number', name: 'phoneNumber', type: 'string' as const, default: '', required: true },
      { displayName: 'Agent', name: 'agent', type: 'options' as const, default: 'default', options: [
        { name: 'Default', value: 'default' },
        { name: 'Sales', value: 'sales' },
        { name: 'Support', value: 'support' }
      ]},
    ],
    httpRequest: [
      { displayName: 'URL', name: 'url', type: 'string' as const, default: '', required: true },
      { displayName: 'Method', name: 'method', type: 'options' as const, default: 'GET', options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' }
      ]},
    ],
    code: [
      { displayName: 'Code', name: 'code', type: 'string' as const, default: '// Write your code here\nreturn items;', typeOptions: { rows: 10 } },
    ],
  }

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'black', strokeWidth: 3 },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      const nodeDataStr = event.dataTransfer.getData('nodeData')
      
      if (!type || !nodeDataStr) {
        return
      }

      const nodeData = JSON.parse(nodeDataStr)
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      
      if (!reactFlowBounds) return

      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: nodeData,
      }

      setNodes((nds) => nds.concat(newNode))
      
      // Auto-open properties panel for new node
      setSelectedNode(newNode)
      setShowPropertiesPanel(true)
    },
    [screenToFlowPosition, setNodes]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setShowPropertiesPanel(true)
  }, [])
  
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
    }
  }, [selectedNode, setNodes, setEdges])

  const saveWorkflow = useCallback(() => {
    const workflow = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        position: node.position,
        parameters: node.data.parameters || {},
      })),
      connections: edges.reduce((acc, edge) => {
        if (!acc[edge.source]) {
          acc[edge.source] = { main: [[]] }
        }
        acc[edge.source].main[0].push({
          node: edge.target,
          type: 'main',
          index: 0,
        })
        return acc
      }, {} as any),
    }
    
    onSave?.(workflow)
  }, [nodes, edges, onSave])

  const handleExecuteWorkflow = useCallback(async () => {
    // For demo purposes, simulate execution with visual feedback
    // Convert to n8n workflow format
    const workflowData: IWorkflowData = {
      id: workflowId || 'temp-workflow',
      name: 'Test Workflow',
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.data.label || node.id,
        type: node.data.type,
        position: [node.position.x, node.position.y],
        parameters: node.data.parameters || {},
      })),
      connections: edges.reduce((acc, edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        
        if (sourceNode && targetNode) {
          const sourceName = sourceNode.data.label || sourceNode.id
          const targetName = targetNode.data.label || targetNode.id
          
          if (!acc[sourceName]) {
            acc[sourceName] = { main: [[]] }
          }
          acc[sourceName].main[0].push({
            node: targetName,
            type: 'main',
            index: 0,
          })
        }
        return acc
      }, {} as any),
    }

    try {
      // Simulate execution with visual feedback
      setExecutionResults(null)
      
      // Show nodes executing one by one
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        
        // Highlight current node as executing
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              executing: n.id === node.id,
              executed: false,
            }
          }))
        )
        
        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mark node as executed
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              executing: false,
              executed: n.id === node.id || n.data.executed,
            }
          }))
        )
      }
      
      // Create mock execution result
      const mockResult = {
        resultData: {
          runData: nodes.reduce((acc, node) => {
            acc[node.data.label || node.id] = [{
              startTime: Date.now() - 1000,
              executionTime: Math.random() * 1000,
              data: {
                main: [[{
                  json: {
                    success: true,
                    nodeType: node.data.type,
                    message: `Node ${node.data.label} executed successfully`,
                    ...(node.data.type === 'dialaMakeCall' ? {
                      callId: 'call-' + Math.random().toString(36).substr(2, 9),
                      duration: Math.floor(Math.random() * 300) + ' seconds'
                    } : {})
                  }
                }]]
              }
            }]
            return acc
          }, {} as any)
        }
      }
      
      setExecutionResults(mockResult)
      
      // Reset node states after 3 seconds
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              executing: false,
              executed: false,
            }
          }))
        )
      }, 3000)
      
      onExecute?.(workflowData)
    } catch (err) {
      console.error('Workflow execution error:', err)
    }
  }, [nodes, workflowId, onExecute, setNodes, setExecutionResults])

  useEffect(() => {
    // Close properties panel when no node is selected
    if (!selectedNode) {
      setShowPropertiesPanel(false)
    }
  }, [selectedNode])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        deleteSelectedNode()
      }
      // Toggle node panel
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShowNodePanel(!showNodePanel)
      }
      // Save workflow
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        saveWorkflow()
      }
      // Execute workflow
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleExecuteWorkflow()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, showNodePanel, deleteSelectedNode, saveWorkflow, handleExecuteWorkflow])

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="p-4 bg-white flex items-center justify-between border-b-4 border-black">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="subheader"
              size="sm"
              onClick={onBack}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-400 border-3 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black uppercase">
              {workflowName || 'New Workflow'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            size="icon"
            disabled={!canUndo}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="neutral"
            size="icon"
            disabled={!canRedo}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-black" />
          <Button
            variant="neutral"
            size="icon"
            onClick={() => setShowExecutionHistory(!showExecutionHistory)}
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="neutral"
            size="icon"
          >
            <Variable className="w-4 h-4" />
          </Button>
          <Button
            variant="neutral"
            size="icon"
          >
            <FileJson className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.2}
          maxZoom={4}
          className="workflow-canvas"
          connectionLineStyle={{ stroke: 'black', strokeWidth: 3 }}
          defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={2}
            color="#ddd"
          />
          <MiniMap 
            className="react-flow__minimap"
            maskColor="rgba(0, 82, 255, 0.1)"
          />
          <Controls className="react-flow__controls" />
          
          {/* Floating Action Bar */}
          <Panel position="top-left" className="m-4">
            <Card className="border-4 border-black bg-white p-3 shadow-[6px_6px_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowNodePanel(!showNodePanel)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ADD NODE
                </Button>
                <div className="w-px h-8 bg-black" />
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={saveWorkflow}
                >
                  <Save className="w-4 h-4 mr-2" />
                  SAVE
                </Button>
                <Button
                  variant="header"
                  size="sm"
                  onClick={handleExecuteWorkflow}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      RUNNING
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      EXECUTE
                    </>
                  )}
                </Button>
                {selectedNode && (
                  <>
                    <div className="w-px h-8 bg-black" />
                    <Button
                      variant="neutral"
                      size="icon"
                      onClick={deleteSelectedNode}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </Panel>

          {/* Help Panel */}
          <Panel position="bottom-left" className="m-4">
            <Card className="border-4 border-black bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <div className="text-xs space-y-2">
                <div className="font-black uppercase mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-black"></div>
                  KEYBOARD SHORTCUTS
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_rgba(0,0,0,1)]">Ctrl+A</kbd>
                  <span className="font-medium">Add Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_rgba(0,0,0,1)]">Ctrl+S</kbd>
                  <span className="font-medium">Save</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_rgba(0,0,0,1)]">Ctrl+Enter</kbd>
                  <span className="font-medium">Execute</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_rgba(0,0,0,1)]">Delete</kbd>
                  <span className="font-medium">Remove Node</span>
                </div>
              </div>
            </Card>
          </Panel>
          
          {/* Execution Results Panel */}
          {executionResults && (
            <Panel position="bottom-right" className="m-4 max-w-md">
              <Card className="border-4 border-black bg-white shadow-[6px_6px_0_rgba(0,0,0,1)]">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                      Execution Results
                    </h3>
                    <Button
                      variant="neutral"
                      size="icon"
                      onClick={() => setExecutionResults(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <pre className="text-xs bg-gray-100 p-3 border-3 border-black overflow-auto max-h-48 shadow-[2px_2px_0_rgba(0,0,0,1)] font-mono">
                    {JSON.stringify(executionResults.resultData?.runData || executionResults, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Node Panel - Slide in from left */}
      <div className={`node-panel ${showNodePanel ? 'open' : ''}`}>
        <NodePanel onClose={() => setShowNodePanel(false)} />
      </div>

      {/* Properties Panel - Right side */}
      {showPropertiesPanel && selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          nodeType={selectedNode.data.type}
          properties={nodeProperties[selectedNode.data.type as keyof typeof nodeProperties] || []}
          onClose={() => {
            setShowPropertiesPanel(false)
            setSelectedNode(null)
          }}
          onUpdate={(nodeId, data) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId ? { ...node, data } : node
              )
            )
          }}
        />
      )}
      
      {/* Execution History - Slide in from right */}
      {showExecutionHistory && (
        <div className="absolute top-0 right-0 h-full w-96 z-40 animate-in slide-in-from-right border-l-4 border-black shadow-[-6px_0_0_rgba(0,0,0,1)]">
          <ExecutionHistory
            workflowId={workflowId}
            onSelectExecution={(execution) => {
              console.log('Selected execution:', execution)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent {...props} />
    </ReactFlowProvider>
  )
}