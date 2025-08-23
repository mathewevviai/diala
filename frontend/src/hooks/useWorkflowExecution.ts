/**
 * React hook for workflow execution using the comprehensive workflow engine
 */

import { useState, useCallback } from 'react'
import { WorkflowEngine, IWorkflowBase, IRunExecutionData } from '@/lib/workflow'

interface ExecutionState {
  isExecuting: boolean
  executionResult: IRunExecutionData | null
  error: Error | null
  executionProgress: number
}

interface ExecutionOptions {
  destinationNode?: string
  pinData?: any
  startNodes?: string[]
}

export function useWorkflowExecution() {
  const [state, setState] = useState<ExecutionState>({
    isExecuting: false,
    executionResult: null,
    error: null,
    executionProgress: 0,
  })

  const executeWorkflow = useCallback(async (
    workflow: IWorkflowBase, 
    inputData?: any,
    options?: ExecutionOptions
  ) => {
    setState({ isExecuting: true, executionResult: null, error: null, executionProgress: 0 })

    try {
      // Create workflow engine
      const engine = new WorkflowEngine('manual')
      
      // Validate workflow before execution
      const validation = engine.validateWorkflow(workflow)
      if (!validation.valid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`)
      }
      
      // Execute workflow
      const result = await engine.execute(workflow, inputData, options)
      
      setState({
        isExecuting: false,
        executionResult: result,
        error: null,
        executionProgress: 100,
      })

      return result
    } catch (error) {
      setState({
        isExecuting: false,
        executionResult: null,
        error: error as Error,
        executionProgress: 0,
      })
      throw error
    }
  }, [])

  const getNodeTypes = useCallback(() => {
    const engine = new WorkflowEngine()
    return engine.getNodeTypes()
  }, [])

  const validateWorkflow = useCallback((workflow: IWorkflowBase) => {
    const engine = new WorkflowEngine()
    return engine.validateWorkflow(workflow)
  }, [])

  const reset = useCallback(() => {
    setState({
      isExecuting: false,
      executionResult: null,
      error: null,
      executionProgress: 0,
    })
  }, [])

  return {
    executeWorkflow,
    isExecuting: state.isExecuting,
    executionResult: state.executionResult,
    error: state.error,
    executionProgress: state.executionProgress,
    getNodeTypes,
    validateWorkflow,
    reset,
  }
}