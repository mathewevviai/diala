/**
 * Complete workflow engine with all n8n features integrated
 */

import { Workflow } from './core/Workflow'
import { WorkflowExecute } from './core/WorkflowExecute'
import { WorkflowDataProxy } from './core/WorkflowDataProxy'
import { ExpressionParser } from './core/ExpressionParser'
import { ExpressionError } from './core/ExpressionError'

// Import all node types
import { BaseNode } from './nodes/BaseNode'
import { HttpRequestNode } from './nodes/HttpRequestNode'
import { IfNode } from './nodes/IfNode'
import { WebhookNode } from './nodes/WebhookNode'
import { CodeNode } from './nodes/CodeNode'
import { SetNode } from './nodes/SetNode'
import { DialaMakeCallNode } from './nodes/DialaMakeCallNode'

import {
  IWorkflowBase,
  IRunExecutionData,
  INodeTypeRegistry,
  INodeType,
  WorkflowExecuteMode,
  IWorkflowExecuteAdditionalData,
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  IHttpRequestOptions
} from './types'

/**
 * Node type registry implementation
 */
class NodeTypeRegistry implements INodeTypeRegistry {
  private nodeTypes = new Map<string, INodeType>()

  constructor() {
    // Register all available node types
    this.register('httpRequest', new HttpRequestNode())
    this.register('if', new IfNode())
    this.register('webhook', new WebhookNode())
    this.register('code', new CodeNode())
    this.register('set', new SetNode())
    this.register('dialaMakeCall', new DialaMakeCallNode())
  }

  register(name: string, nodeType: INodeType): void {
    this.nodeTypes.set(name, nodeType)
  }

  getByNameAndVersion(nodeType: string, version?: number): INodeType | undefined {
    return this.nodeTypes.get(nodeType)
  }

  getByName(nodeType: string): Array<{ type: INodeType; version: number }> {
    const node = this.nodeTypes.get(nodeType)
    return node ? [{ type: node, version: 1 }] : []
  }

  getAllNodeTypes(): INodeType[] {
    return Array.from(this.nodeTypes.values())
  }
}

/**
 * Main workflow engine class
 */
export class WorkflowEngine {
  private nodeTypeRegistry: NodeTypeRegistry
  private executionId: string
  private mode: WorkflowExecuteMode

  constructor(mode: WorkflowExecuteMode = 'manual') {
    this.nodeTypeRegistry = new NodeTypeRegistry()
    this.executionId = this.generateExecutionId()
    this.mode = mode
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflowData: IWorkflowBase,
    inputData?: INodeExecutionData,
    options?: {
      destinationNode?: string
      pinData?: any
      startNodes?: string[]
    }
  ): Promise<IRunExecutionData> {
    // Create workflow instance
    const workflow = new Workflow(workflowData)
    
    // Validate workflow
    const validation = workflow.validateWorkflow()
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`)
    }

    // Create additional data for execution
    const additionalData = this.createAdditionalData(workflowData)

    // Create executor
    const workflowExecute = new WorkflowExecute(
      additionalData,
      this.mode,
      this.nodeTypeRegistry
    )

    // Prepare run data
    const runData: IRunExecutionData = {
      executionData: {
        contextData: {},
        nodeExecutionStack: [],
        waitingExecution: {},
        waitingExecutionSource: {},
      },
      resultData: {
        runData: {},
      }
    }

    // Add pinned data if provided
    if (options?.pinData) {
      workflow.pinData = options.pinData
    }

    // Execute workflow
    try {
      const result = await workflowExecute.run(
        workflow,
        runData,
        options?.destinationNode
      )

      return result
    } catch (error) {
      console.error('Workflow execution error:', error)
      runData.resultData.error = error as Error
      throw error
    }
  }

  /**
   * Create execution context
   */
  private createExecutionContext(
    workflow: Workflow,
    runData: IRunExecutionData,
    node: any,
    itemIndex: number,
    connectionInputData: IDataObject[]
  ): IExecuteFunctions {
    const dataProxy = new WorkflowDataProxy(
      workflow,
      runData,
      itemIndex,
      node.name,
      connectionInputData
    )

    return {
      getNode: () => node,
      getWorkflow: () => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.active
      }),
      getMode: () => this.mode,
      getExecutionId: () => this.executionId,
      getTimezone: () => 'UTC',
      getInstanceId: () => 'instance-1',
      getRestApiUrl: () => 'http://localhost:5678',
      continueOnFail: () => node.continueOnFail || false,
      
      getInputData: (inputIndex = 0, inputName = 'main') => connectionInputData,
      
      getNodeParameter: (parameterName: string, itemIndex: number, fallbackValue?: any) => {
        const value = node.parameters?.[parameterName]
        
        if (value === undefined) {
          return fallbackValue
        }

        // Evaluate expressions
        if (typeof value === 'string' && ExpressionParser.isExpression(value)) {
          return ExpressionParser.evaluate(value, dataProxy as any)
        }

        return value
      },

      getCredentials: async (type: string) => {
        // Mock credentials for now
        return {}
      },

      getWorkflowDataProxy: (itemIndex: number) => dataProxy as any,

      prepareOutputData: async (outputData: INodeExecutionData[][], outputIndex = 0) => {
        return outputData
      },

      putExecutionToWait: async (waitTill: Date) => {
        // Not implemented in this version
      },

      sendMessageToUI: (message: string) => {
        console.log('UI Message:', message)
      },

      helpers: {
        returnJsonArray: (data: IDataObject | IDataObject[]): IDataObject[] => {
          return Array.isArray(data) ? data : [data]
        },

        normalizeItems: (items: INodeExecutionData | INodeExecutionData[]): INodeExecutionData[] => {
          return Array.isArray(items) ? items : [items]
        },

        getBinaryDataBuffer: async (itemIndex: number, propertyName: string): Promise<Buffer> => {
          // Mock implementation
          return Buffer.from('')
        },

        prepareBinaryData: async (binaryData: Buffer, filePath?: string, mimeType?: string) => {
          return {
            data: binaryData.toString('base64'),
            mimeType: mimeType || 'application/octet-stream',
            fileName: filePath || 'file'
          }
        },

        httpRequest: async (requestOptions: IHttpRequestOptions): Promise<any> => {
          const response = await fetch(requestOptions.url, {
            method: requestOptions.method,
            headers: requestOptions.headers as HeadersInit,
            body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
          })

          const data = await response.json()
          
          return {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: data
          }
        },

        constructExecutionMetaData: (inputData: INodeExecutionData[], options: any) => {
          return inputData.map(item => ({
            ...item,
            pairedItem: options.itemData
          }))
        },

        assertBinaryData: async (itemIndex: number, propertyName: string) => {
          throw new Error('Binary data not found')
        },

        setBinaryDataBuffer: async (data: any, binaryData: Buffer) => {
          return {
            ...data,
            data: binaryData.toString('base64')
          }
        },

        binaryToString: async (body: Buffer, encoding = 'utf8') => {
          return body.toString(encoding as BufferEncoding)
        },

        httpRequestWithAuthentication: async (
          credentialType: string,
          requestOptions: IHttpRequestOptions
        ) => {
          // Simplified version without actual auth
          return this.helpers.httpRequest(requestOptions)
        }
      }
    } as IExecuteFunctions
  }

  /**
   * Create additional data for workflow execution
   */
  private createAdditionalData(workflowData: IWorkflowBase): IWorkflowExecuteAdditionalData {
    return {
      executionId: this.executionId,
      userId: 'user-1',
      workflowData,
      instanceId: 'instance-1',
      
      httpRequest: async (requestOptions: IHttpRequestOptions) => {
        const response = await fetch(requestOptions.url, {
          method: requestOptions.method,
          headers: requestOptions.headers as HeadersInit,
          body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
        })

        return response.json()
      },

      httpRequestWithAuthentication: async (
        credentialType: string,
        requestOptions: IHttpRequestOptions
      ) => {
        // Simplified version
        return this.httpRequest!(requestOptions)
      }
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get available node types
   */
  getNodeTypes(): Array<{ name: string; description: any }> {
    return Array.from(this.nodeTypeRegistry.getAllNodeTypes()).map(nodeType => ({
      name: nodeType.description.name,
      description: nodeType.description
    }))
  }

  /**
   * Validate workflow
   */
  validateWorkflow(workflowData: IWorkflowBase): { valid: boolean; errors: string[] } {
    const workflow = new Workflow(workflowData)
    return workflow.validateWorkflow()
  }

  /**
   * Get workflow metadata
   */
  getWorkflowMetadata(workflowData: IWorkflowBase): {
    nodeCount: number
    connectionCount: number
    hasErrors: boolean
    triggerNodes: string[]
  } {
    const workflow = new Workflow(workflowData)
    const validation = workflow.validateWorkflow()
    
    let connectionCount = 0
    for (const connections of Object.values(workflow.connections)) {
      for (const outputConnections of Object.values(connections)) {
        connectionCount += outputConnections.flat().length
      }
    }

    return {
      nodeCount: workflow.nodes.length,
      connectionCount,
      hasErrors: !validation.valid,
      triggerNodes: workflow.getTriggerNodes().map(n => n.name)
    }
  }
}