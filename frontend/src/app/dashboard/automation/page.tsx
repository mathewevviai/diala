"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronLeft, PlayCircle, Save, FolderOpen, 
  Settings2, RefreshCw, ExternalLink, Zap, Plus,
  Phone, Code, Globe
} from 'lucide-react'
import Link from 'next/link'
import WorkflowEditor from '@/components/automation/WorkflowEditor'
import '@/styles/automation.css'

export default function AutomationPage() {
  const [showEditor, setShowEditor] = useState(false)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    // Fetch workflows from API
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    // For development - show demo workflows without backend
    setWorkflows([
      {
        id: '1',
        name: 'Welcome Call Automation',
        description: 'Automatically call new users after signup',
        active: true,
        nodes: [
          { id: '1', type: 'webhook', label: 'User Signup' },
          { id: '2', type: 'dialaMakeCall', label: 'Make Welcome Call' }
        ]
      },
      {
        id: '2',
        name: 'Lead Qualification',
        description: 'Call and qualify incoming leads',
        active: false,
        nodes: [
          { id: '1', type: 'webhook', label: 'New Lead' },
          { id: '2', type: 'code', label: 'Score Lead' },
          { id: '3', type: 'dialaMakeCall', label: 'Qualification Call' }
        ]
      }
    ])
    
    // Uncomment below when backend is ready
    // try {
    //   const response = await fetch('/api/automation/workflows', {
    //     headers: {
    //       'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`,
    //     },
    //   })
    //   if (response.ok) {
    //     const data = await response.json()
    //     setWorkflows(data)
    //   }
    // } catch (error) {
    //   console.error('Error fetching workflows:', error)
    // }
  }

  const handleSaveWorkflow = async (workflow: any) => {
    // For development - just log the workflow
    console.log('Saving workflow:', workflow)
    alert('Workflow saved! (Development mode - not persisted)')
    
    // Uncomment below when backend is ready
    // try {
    //   const url = selectedWorkflow 
    //     ? `/api/automation/workflows/${selectedWorkflow.id}`
    //     : '/api/automation/workflows'
    //   
    //   const method = selectedWorkflow ? 'PUT' : 'POST'
    //   
    //   const response = await fetch(url, {
    //     method,
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`,
    //     },
    //     body: JSON.stringify({
    //       name: selectedWorkflow?.name || 'New Workflow',
    //       ...workflow,
    //     }),
    //   })
    //   
    //   if (response.ok) {
    //     fetchWorkflows()
    //     // Show success message
    //   }
    // } catch (error) {
    //   console.error('Error saving workflow:', error)
    // }
  }

  const handleExecuteWorkflow = async (workflow: any) => {
    // For development - simulate execution
    console.log('Executing workflow:', workflow)
    alert('Workflow executed! (Development mode - simulated)')
    
    // Uncomment below when backend is ready
    // if (!selectedWorkflow?.id) return
    // 
    // try {
    //   const response = await fetch(`/api/automation/workflows/${selectedWorkflow.id}/execute`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`,
    //     },
    //     body: JSON.stringify({ trigger_data: {} }),
    //   })
    //   
    //   if (response.ok) {
    //     const execution = await response.json()
    //     console.log('Workflow executed:', execution)
    //     // Show execution result
    //   }
    // } catch (error) {
    //   console.error('Error executing workflow:', error)
    // }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b-4 border-black p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="subheader" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 border-4 border-black flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black uppercase">Automation Workflows</h1>
            </div>
          </div>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              setSelectedWorkflow(null)
              setShowEditor(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            CREATE WORKFLOW
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map((filter) => (
            <Button
              key={filter}
              variant={filterActive === filter ? 'default' : 'neutral'}
              size="sm"
              onClick={() => setFilterActive(filter as any)}
            >
              {filter.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        {!showEditor ? (
          <div className="h-full overflow-y-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase">Total Workflows</span>
                    <div className="w-8 h-8 bg-blue-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black">{workflows.length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase">Active</span>
                    <div className="w-8 h-8 bg-green-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black">{workflows.filter(w => w.active).length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-gradient-to-br from-yellow-50 to-yellow-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase">Executions Today</span>
                    <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black">42</div>
                </CardContent>
              </Card>
              
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase">Success Rate</span>
                    <div className="w-8 h-8 bg-purple-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <Settings2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black">98%</div>
                </CardContent>
              </Card>
            </div>

            {/* Workflows List */}
            <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-[rgb(0,82,255)]"></div>
              Your Workflows
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {workflows
                .filter(w => filterActive === 'all' || (filterActive === 'active' ? w.active : !w.active))
                .map((workflow) => (
                <Card 
                  key={workflow.id}
                  className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all cursor-pointer bg-white relative overflow-hidden group"
                  onClick={() => {
                    setSelectedWorkflow(workflow)
                    setShowEditor(true)
                  }}
                >
                  {/* Decorative Pattern */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400 transform rotate-45 translate-x-8 -translate-y-8 group-hover:rotate-90 transition-transform" />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                        <Zap className="w-7 h-7" />
                      </div>
                      <div className={`px-3 py-1 text-xs font-black uppercase ${
                        workflow.active ? 'bg-green-400' : 'bg-gray-300'
                      } border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]`}>
                        {workflow.active ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <h3 className="font-black uppercase text-lg mb-2">{workflow.name}</h3>
                    <p className="text-sm mb-4">
                      {workflow.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t-2 border-black">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-purple-400 border-2 border-black" />
                          <span className="text-xs font-bold">{workflow.nodes?.length || 0} NODES</span>
                        </div>
                      </div>
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle settings
                        }}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Workflow Templates */}
            <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-yellow-400"></div>
              Quick Start Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'CALL AUTOMATION',
                  description: 'Automate outbound calls based on triggers and conditions',
                  color: 'from-blue-50 to-blue-100',
                  iconBg: 'bg-blue-400',
                  icon: Phone
                },
                {
                  title: 'DATA PROCESSING',
                  description: 'Process uploads, generate embeddings, update databases',
                  color: 'from-yellow-50 to-yellow-100',
                  iconBg: 'bg-yellow-400',
                  icon: Code
                },
                {
                  title: 'LEAD ROUTING',
                  description: 'Route leads to agents based on scoring and availability',
                  color: 'from-purple-50 to-purple-100',
                  iconBg: 'bg-purple-400',
                  icon: Globe
                }
              ].map((template, idx) => {
                const Icon = template.icon
                return (
                  <Card 
                    key={idx}
                    className={`border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all cursor-pointer bg-gradient-to-br ${template.color} relative group`}
                    onClick={() => {
                      // Handle template selection
                      setSelectedWorkflow(null)
                      setShowEditor(true)
                    }}
                  >
                    {/* Decorative Elements */}
                    <div className="absolute top-2 right-2 w-8 h-8 border-3 border-black bg-white opacity-50 transform rotate-12" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full border-3 border-black bg-white opacity-50" />
                    
                    <CardContent className="p-6 relative">
                      <div className={`w-16 h-16 ${template.iconBg} border-4 border-black flex items-center justify-center mb-4 shadow-[3px_3px_0_rgba(0,0,0,1)] transform group-hover:rotate-3 transition-transform`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-black uppercase text-lg mb-2">{template.title}</h3>
                      <p className="text-sm mb-4">
                        {template.description}
                      </p>
                      <Button
                        variant="neutral"
                        size="sm"
                        className="w-full"
                      >
                        USE TEMPLATE
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="workflow-editor-container">
            <WorkflowEditor
              workflowId={selectedWorkflow?.id}
              workflowName={selectedWorkflow?.name || 'New Workflow'}
              onSave={handleSaveWorkflow}
              onExecute={handleExecuteWorkflow}
              onBack={() => setShowEditor(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}