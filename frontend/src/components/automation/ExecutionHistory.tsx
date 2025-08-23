"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  Loader2, ChevronRight, RefreshCw, Filter,
  Download, Trash2, Eye, EyeOff
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'

interface ExecutionItem {
  id: string
  workflowId: string
  workflowName: string
  status: 'success' | 'error' | 'running' | 'waiting'
  startedAt: string
  finishedAt?: string
  mode: 'manual' | 'trigger' | 'webhook' | 'schedule'
  data?: any
  error?: string
  retryOf?: string
  retrySuccessId?: string
}

interface ExecutionHistoryProps {
  workflowId?: string
  onSelectExecution?: (execution: ExecutionItem) => void
}

// Mock data for development
const mockExecutions: ExecutionItem[] = [
  {
    id: 'exec-1',
    workflowId: 'wf-1',
    workflowName: 'Welcome Call Automation',
    status: 'success',
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    mode: 'manual',
    data: { callsPlaced: 3, successfulCalls: 3 }
  },
  {
    id: 'exec-2',
    workflowId: 'wf-1',
    workflowName: 'Welcome Call Automation',
    status: 'error',
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    mode: 'trigger',
    error: 'Failed to connect to phone service'
  },
  {
    id: 'exec-3',
    workflowId: 'wf-2',
    workflowName: 'Lead Qualification',
    status: 'running',
    startedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    mode: 'webhook'
  },
  {
    id: 'exec-4',
    workflowId: 'wf-2',
    workflowName: 'Lead Qualification',
    status: 'success',
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 30).toISOString(),
    mode: 'schedule',
    data: { leadsProcessed: 15, qualified: 8 }
  }
]

export default function ExecutionHistory({
  workflowId,
  onSelectExecution
}: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<ExecutionItem[]>([])
  const [selectedExecution, setSelectedExecution] = useState<ExecutionItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'running'>('all')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchExecutions()
  }, [workflowId, filter])

  const fetchExecutions = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      let filtered = mockExecutions
      if (workflowId) {
        filtered = filtered.filter(e => e.workflowId === workflowId)
      }
      if (filter !== 'all') {
        filtered = filtered.filter(e => e.status === filter)
      }
      setExecutions(filtered)
      setLoading(false)
    }, 500)
  }

  const getStatusIcon = (status: ExecutionItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <XCircle className="w-4 h-4" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'waiting':
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: ExecutionItem['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-400'
      case 'error':
        return 'bg-red-400'
      case 'running':
        return 'bg-blue-400'
      case 'waiting':
        return 'bg-yellow-400'
    }
  }

  const getModeIcon = (mode: ExecutionItem['mode']) => {
    switch (mode) {
      case 'manual':
        return '👤'
      case 'trigger':
        return '⚡'
      case 'webhook':
        return '🔗'
      case 'schedule':
        return '⏰'
    }
  }

  const handleExecutionClick = (execution: ExecutionItem) => {
    setSelectedExecution(execution)
    setShowDetails(true)
    onSelectExecution?.(execution)
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Running...'
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  return (
    <Card className="h-full border-0 flex flex-col bg-white">
      <CardHeader className="border-b-4 border-black bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black uppercase">
            Execution History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-32 border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExecutions}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : executions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No executions found</p>
            <p className="text-sm text-gray-500">
              {workflowId ? 'This workflow hasn\'t been executed yet' : 'Start executing workflows to see history'}
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="execution-history-item"
                onClick={() => handleExecutionClick(execution)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`execution-status ${getStatusColor(execution.status)}`}>
                    {getStatusIcon(execution.status)}
                    {execution.status}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{execution.workflowName}</span>
                      <span className="text-xs text-gray-500">
                        {getModeIcon(execution.mode)} {execution.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}</span>
                      <span>Duration: {formatDuration(execution.startedAt, execution.finishedAt)}</span>
                    </div>
                    {execution.error && (
                      <p className="text-xs text-red-600 mt-1">{execution.error}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Execution Details Modal */}
      {showDetails && selectedExecution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Execution Details</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedExecution.workflowName} • {selectedExecution.id}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 overflow-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold mb-1">Status</p>
                    <div className={`execution-status inline-flex ${getStatusColor(selectedExecution.status)}`}>
                      {getStatusIcon(selectedExecution.status)}
                      {selectedExecution.status}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1">Mode</p>
                    <p className="text-sm">
                      {getModeIcon(selectedExecution.mode)} {selectedExecution.mode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1">Started</p>
                    <p className="text-sm">
                      {new Date(selectedExecution.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1">Duration</p>
                    <p className="text-sm">
                      {formatDuration(selectedExecution.startedAt, selectedExecution.finishedAt)}
                    </p>
                  </div>
                </div>

                {selectedExecution.error && (
                  <div className="p-4 bg-red-100 border-3 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    <p className="font-bold text-sm mb-1">Error</p>
                    <p className="text-sm">{selectedExecution.error}</p>
                  </div>
                )}

                {selectedExecution.data && (
                  <div>
                    <p className="font-bold text-sm mb-2">Execution Data</p>
                    <pre className="p-3 bg-gray-100 border-3 border-black text-xs overflow-auto shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      {JSON.stringify(selectedExecution.data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}