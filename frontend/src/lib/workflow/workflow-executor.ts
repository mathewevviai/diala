/**
 * Simplified workflow execution engine extracted from n8n
 */

import { DateTime } from 'luxon'

export interface INode {
  id: string
  name: string
  type: string
  parameters: Record<string, any>
  position: [number, number]
  disabled?: boolean
}

export interface INodeExecutionData {
  main: IDataObject[][]
}

export interface IDataObject {
  [key: string]: any
}

export interface IConnection {
  node: string
  type: string
  index: number
}

export interface IConnections {
  [outputIndex: string]: IConnection[][]
}

export interface IWorkflowData {
  id?: string
  name?: string
  nodes: INode[]
  connections: Record<string, IConnections>
  settings?: Record<string, any>
}

export interface IExecuteData {
  node: INode
  data: INodeExecutionData
  source: IConnection | null
}

export interface IRunExecutionData {
  resultData: {
    runData: Record<string, INodeExecutionData[]>
    lastNodeExecuted?: string
    executionData?: Record<string, IExecuteData[]>
    error?: Error
  }
  executionData?: {
    contextData: Record<string, any>
    nodeExecutionStack: IExecuteData[]
    waitingExecution: Record<string, IExecuteData[]>
    waitingExecutionSource: Record<string, IExecuteData>
  }
}

export type ExecutionStatus = 'running' | 'success' | 'error' | 'canceled'

export interface ITaskData {
  startTime: number
  executionTime: number
  executionStatus: ExecutionStatus
  data?: INodeExecutionData
  error?: Error
}

export abstract class NodeType {
  abstract description: {
    displayName: string
    name: string
    group: string[]
    version: number
    description: string
    defaults: {
      name: string
    }
    inputs: string[]
    outputs: string[]
    properties: any[]
  }

  abstract execute(context: IExecuteContext): Promise<INodeExecutionData[][]>
}

export interface IExecuteContext {
  getNode(): INode
  getInputData(inputIndex?: number, inputName?: string): IDataObject[]
  getNodeParameter(parameterName: string, itemIndex?: number, fallbackValue?: any): any
  helpers: {
    returnJsonArray(data: IDataObject | IDataObject[]): IDataObject[]
  }
}

export class WorkflowExecutor {
  private workflow: IWorkflowData
  private nodeTypes: Map<string, NodeType>
  private runExecutionData: IRunExecutionData
  private executionId: string
  private mode: 'manual' | 'trigger' = 'manual'

  constructor(workflow: IWorkflowData, nodeTypes: Map<string, NodeType>) {
    this.workflow = workflow
    this.nodeTypes = nodeTypes
    this.executionId = this.generateExecutionId()
    this.runExecutionData = this.initializeRunExecutionData()
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private initializeRunExecutionData(): IRunExecutionData {
    return {
      resultData: {
        runData: {},
      },
      executionData: {
        contextData: {},
        nodeExecutionStack: [],
        waitingExecution: {},
        waitingExecutionSource: {},
      },
    }
  }

  async execute(
    destinationNode?: string,
    inputData?: INodeExecutionData
  ): Promise<IRunExecutionData> {
    try {
      // Find start nodes (nodes without incoming connections)
      const startNodes = this.findStartNodes()
      
      // Initialize execution queue
      const executionQueue: IExecuteData[] = []
      
      // Add start nodes to queue
      for (const node of startNodes) {
        executionQueue.push({
          node,
          data: inputData || { main: [[]] },
          source: null,
        })
      }

      // Process nodes
      while (executionQueue.length > 0) {
        const executeData = executionQueue.shift()!
        
        if (executeData.node.disabled) {
          continue
        }

        // Execute node
        const nodeOutput = await this.executeNode(executeData)
        
        // Store execution result
        if (!this.runExecutionData.resultData.runData[executeData.node.name]) {
          this.runExecutionData.resultData.runData[executeData.node.name] = []
        }
        this.runExecutionData.resultData.runData[executeData.node.name].push(nodeOutput)
        
        // Add connected nodes to queue
        const connections = this.workflow.connections[executeData.node.name]
        if (connections) {
          for (const outputIndex in connections) {
            const outputConnections = connections[outputIndex]
            for (const connectionGroup of outputConnections) {
              for (const connection of connectionGroup) {
                const nextNode = this.workflow.nodes.find(n => n.name === connection.node)
                if (nextNode && (!destinationNode || nextNode.name === destinationNode)) {
                  executionQueue.push({
                    node: nextNode,
                    data: nodeOutput,
                    source: {
                      node: executeData.node.name,
                      type: outputIndex,
                      index: connection.index,
                    },
                  })
                }
              }
            }
          }
        }
        
        this.runExecutionData.resultData.lastNodeExecuted = executeData.node.name
      }

      return this.runExecutionData
    } catch (error) {
      this.runExecutionData.resultData.error = error as Error
      throw error
    }
  }

  private findStartNodes(): INode[] {
    const nodesWithIncomingConnections = new Set<string>()
    
    for (const nodeName in this.workflow.connections) {
      const nodeConnections = this.workflow.connections[nodeName]
      for (const outputIndex in nodeConnections) {
        for (const connectionGroup of nodeConnections[outputIndex]) {
          for (const connection of connectionGroup) {
            nodesWithIncomingConnections.add(connection.node)
          }
        }
      }
    }
    
    return this.workflow.nodes.filter(node => !nodesWithIncomingConnections.has(node.name))
  }

  private async executeNode(executeData: IExecuteData): Promise<INodeExecutionData> {
    const { node, data } = executeData
    const nodeType = this.nodeTypes.get(node.type)
    
    if (!nodeType) {
      throw new Error(`Unknown node type: ${node.type}`)
    }

    const context: IExecuteContext = {
      getNode: () => node,
      getInputData: (inputIndex = 0) => {
        return data.main[inputIndex] || []
      },
      getNodeParameter: (parameterName: string, itemIndex = 0, fallbackValue?: any) => {
        const parameter = node.parameters[parameterName]
        return parameter !== undefined ? parameter : fallbackValue
      },
      helpers: {
        returnJsonArray: (data: IDataObject | IDataObject[]): IDataObject[] => {
          if (Array.isArray(data)) {
            return data
          }
          return [data]
        },
      },
    }

    try {
      const result = await nodeType.execute(context)
      return {
        main: result,
      }
    } catch (error) {
      console.error(`Error executing node ${node.name}:`, error)
      throw error
    }
  }

  getExecutionResult(): IRunExecutionData {
    return this.runExecutionData
  }

  getNodeExecutionData(nodeName: string): INodeExecutionData[] | undefined {
    return this.runExecutionData.resultData.runData[nodeName]
  }
}