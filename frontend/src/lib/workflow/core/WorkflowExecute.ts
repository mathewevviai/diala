/**
 * Advanced workflow execution engine extracted from n8n
 */

import { Workflow } from './Workflow'
import { WorkflowDataProxy } from './WorkflowDataProxy'
import { ExpressionError } from './ExpressionError'
import {
  IExecuteData,
  INode,
  INodeExecutionData,
  IRunExecutionData,
  ITaskData,
  IWorkflowExecuteAdditionalData,
  ExecutionStatus,
  WorkflowExecuteMode,
  IDataObject,
  IExecuteResponsePromiseData,
  INodeType,
  INodeTypeRegistry
} from '../types'

export class WorkflowExecute {
  private additionalData: IWorkflowExecuteAdditionalData
  private mode: WorkflowExecuteMode
  private workflow: Workflow
  private nodeTypeRegistry: INodeTypeRegistry

  constructor(
    additionalData: IWorkflowExecuteAdditionalData,
    mode: WorkflowExecuteMode,
    nodeTypeRegistry: INodeTypeRegistry
  ) {
    this.additionalData = additionalData
    this.mode = mode
    this.workflow = new Workflow(additionalData.workflowData)
    this.nodeTypeRegistry = nodeTypeRegistry
  }

  /**
   * Main execution entry point
   */
  async run(
    workflow: Workflow,
    runData?: IRunExecutionData,
    destinationNode?: string
  ): Promise<IRunExecutionData> {
    this.workflow = workflow

    // Initialize run data if not provided
    if (!runData) {
      runData = {
        executionData: {
          contextData: {},
          nodeExecutionStack: [],
          waitingExecution: {},
          waitingExecutionSource: {},
        },
        resultData: {
          runData: {},
          lastNodeExecuted: '',
          executionData: {
            contextData: {},
            nodeExecutionStack: [],
            waitingExecution: {},
            waitingExecutionSource: {},
          }
        }
      }
    }

    // Start from trigger/start nodes
    const startNodes = this.getStartNodes(destinationNode)
    
    // Add start nodes to execution stack
    for (const startNode of startNodes) {
      const executeData: IExecuteData = {
        node: startNode,
        data: {
          main: [[{ json: {} }]]
        },
        source: null
      }
      
      runData.executionData!.nodeExecutionStack.push(executeData)
    }

    // Process execution stack
    return await this.processRunExecutionData(workflow, runData)
  }

  /**
   * Process the execution stack
   */
  private async processRunExecutionData(
    workflow: Workflow,
    runData: IRunExecutionData
  ): Promise<IRunExecutionData> {
    const executionData = runData.executionData!
    const executionStack = executionData.nodeExecutionStack

    while (executionStack.length > 0) {
      const executeData = executionStack.shift()!
      const node = executeData.node

      // Skip disabled nodes
      if (node.disabled === true) {
        continue
      }

      // Check if node should be executed
      if (!this.shouldNodeBeExecuted(node, runData)) {
        continue
      }

      try {
        // Execute the node
        const nodeExecutionData = await this.executeNode(
          executeData,
          runData,
          workflow
        )

        // Store execution result
        if (!runData.resultData.runData[node.name]) {
          runData.resultData.runData[node.name] = []
        }
        
        const taskData: ITaskData = {
          startTime: Date.now(),
          executionTime: 0,
          executionStatus: 'success' as ExecutionStatus,
          data: nodeExecutionData
        }
        
        runData.resultData.runData[node.name].push(taskData)
        runData.resultData.lastNodeExecuted = node.name

        // Add connected nodes to execution stack
        this.addNodeToExecutionStack(
          workflow,
          node,
          nodeExecutionData,
          runData
        )

      } catch (error) {
        // Handle node execution error
        const errorData: ITaskData = {
          startTime: Date.now(),
          executionTime: 0,
          executionStatus: 'error' as ExecutionStatus,
          error: error as Error
        }

        if (!runData.resultData.runData[node.name]) {
          runData.resultData.runData[node.name] = []
        }
        
        runData.resultData.runData[node.name].push(errorData)
        runData.resultData.error = error as Error

        // Stop execution on error (unless error workflow is configured)
        break
      }
    }

    return runData
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    executeData: IExecuteData,
    runData: IRunExecutionData,
    workflow: Workflow
  ): Promise<INodeExecutionData> {
    const node = executeData.node
    const nodeType = this.nodeTypeRegistry.getByNameAndVersion(node.type, node.typeVersion)

    if (!nodeType) {
      throw new Error(`Node type "${node.type}" is not known!`)
    }

    // Create execution context
    const context = this.createNodeExecutionContext(
      workflow,
      runData,
      executeData,
      nodeType
    )

    // Execute based on node execution type
    if (nodeType.execute) {
      // Regular execution
      const response = await nodeType.execute.call(context)
      return {
        main: response
      }
    } else if (nodeType.webhook) {
      // Webhook execution
      const response = await nodeType.webhook.call(context)
      return {
        webhookResponse: response
      }
    } else if (nodeType.trigger) {
      // Trigger execution
      const response = await nodeType.trigger.call(context)
      return {
        main: [response || []]
      }
    } else {
      throw new Error(`Node type "${node.type}" does not have any execution method!`)
    }
  }

  /**
   * Create node execution context
   */
  private createNodeExecutionContext(
    workflow: Workflow,
    runData: IRunExecutionData,
    executeData: IExecuteData,
    nodeType: INodeType
  ): any {
    const node = executeData.node
    const inputData = executeData.data
    
    return {
      getNode: () => node,
      getWorkflow: () => workflow,
      getMode: () => this.mode,
      getInputData: (inputIndex = 0, inputName = 'main') => {
        return inputData[inputName]?.[inputIndex] || []
      },
      getNodeParameter: (parameterName: string, itemIndex = 0, fallbackValue?: any) => {
        return this.getNodeParameter(
          workflow,
          runData,
          node,
          parameterName,
          itemIndex,
          fallbackValue
        )
      },
      helpers: {
        returnJsonArray: (data: IDataObject | IDataObject[]): IDataObject[] => {
          return Array.isArray(data) ? data : [data]
        },
        prepareBinaryData: async (binaryData: Buffer, filePath?: string, mimeType?: string) => {
          // Simplified binary data handling
          return {
            data: binaryData.toString('base64'),
            mimeType: mimeType || 'application/octet-stream',
            fileName: filePath || 'file'
          }
        }
      }
    }
  }

  /**
   * Get node parameter with expression resolution
   */
  private getNodeParameter(
    workflow: Workflow,
    runData: IRunExecutionData,
    node: INode,
    parameterName: string,
    itemIndex: number,
    fallbackValue?: any
  ): any {
    const parameter = node.parameters?.[parameterName]
    
    if (parameter === undefined) {
      return fallbackValue
    }

    // If it's an expression, evaluate it
    if (typeof parameter === 'string' && this.isExpression(parameter)) {
      const dataProxy = new WorkflowDataProxy(
        workflow,
        runData,
        itemIndex,
        node.name,
        []
      )
      
      return this.evaluateExpression(parameter, dataProxy)
    }

    return parameter
  }

  /**
   * Check if a value is an expression
   */
  private isExpression(value: string): boolean {
    return value.startsWith('={{') && value.endsWith('}}')
  }

  /**
   * Evaluate an expression
   */
  private evaluateExpression(expression: string, dataProxy: any): any {
    // Remove expression markers
    const code = expression.slice(3, -2).trim()
    
    try {
      // Create evaluation context
      const context = {
        $json: dataProxy.$json,
        $node: dataProxy.$node,
        $workflow: dataProxy.$workflow,
        $now: () => new Date(),
        $today: () => {
          const date = new Date()
          date.setHours(0, 0, 0, 0)
          return date
        },
        $jmespath: dataProxy.$jmespath,
        ...dataProxy
      }

      // Evaluate expression
      const func = new Function(...Object.keys(context), `return ${code}`)
      return func(...Object.values(context))
    } catch (error) {
      throw new ExpressionError(`Expression evaluation failed: ${error.message}`, {
        expression,
        itemIndex: dataProxy.$itemIndex
      })
    }
  }

  /**
   * Add node outputs to execution stack
   */
  private addNodeToExecutionStack(
    workflow: Workflow,
    node: INode,
    nodeExecutionData: INodeExecutionData,
    runData: IRunExecutionData
  ): void {
    const connections = workflow.connections[node.name]
    
    if (!connections) {
      return
    }

    for (const outputName in connections) {
      const outputConnections = connections[outputName]
      const outputData = nodeExecutionData[outputName]

      if (!outputData) {
        continue
      }

      for (let outputIndex = 0; outputIndex < outputConnections.length; outputIndex++) {
        const connectionGroup = outputConnections[outputIndex]
        
        for (const connection of connectionGroup) {
          const targetNode = workflow.getNode(connection.node)
          
          if (!targetNode) {
            continue
          }

          const executeData: IExecuteData = {
            node: targetNode,
            data: {
              [outputName]: outputData
            },
            source: {
              main: [{
                node: node.name,
                type: outputName as any,
                index: outputIndex
              }]
            }
          }

          runData.executionData!.nodeExecutionStack.push(executeData)
        }
      }
    }
  }

  /**
   * Check if node should be executed
   */
  private shouldNodeBeExecuted(node: INode, runData: IRunExecutionData): boolean {
    // Check if node has already been executed
    if (runData.resultData.runData[node.name]) {
      return false
    }

    // Check if node has required input data
    // This is simplified - real implementation would check all inputs
    return true
  }

  /**
   * Get start nodes for execution
   */
  private getStartNodes(destinationNode?: string): INode[] {
    if (destinationNode) {
      const node = this.workflow.getNode(destinationNode)
      return node ? [node] : []
    }

    // Get trigger nodes or nodes without inputs
    const triggerNodes = this.workflow.getTriggerNodes()
    if (triggerNodes.length > 0) {
      return triggerNodes
    }

    return this.workflow.getStartNodes()
  }
}