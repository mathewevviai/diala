/**
 * WorkflowDataProxy - Provides reactive access to workflow data
 * Extracted from n8n's workflow data proxy implementation
 */

import { Workflow } from './Workflow'
import { IRunExecutionData, ITaskData, IDataObject } from '../types'
import jmespath from 'jmespath'
import { DateTime } from 'luxon'

export class WorkflowDataProxy {
  private workflow: Workflow
  private runExecutionData: IRunExecutionData
  private itemIndex: number
  private nodeName: string
  private connectionInputData: IDataObject[]
  private defaultTimezone: string

  constructor(
    workflow: Workflow,
    runExecutionData: IRunExecutionData,
    itemIndex: number,
    nodeName: string,
    connectionInputData: IDataObject[],
    defaultTimezone: string = 'UTC'
  ) {
    this.workflow = workflow
    this.runExecutionData = runExecutionData
    this.itemIndex = itemIndex
    this.nodeName = nodeName
    this.connectionInputData = connectionInputData
    this.defaultTimezone = defaultTimezone

    // Return a proxy to handle dynamic property access
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver)
        }

        // Handle special properties
        if (prop in target) {
          return target[prop as keyof WorkflowDataProxy]
        }

        // Handle $node access
        if (prop === '$node') {
          return this.getNodeDataProxy()
        }

        // Handle $() function
        if (prop === '$') {
          return (nodeName: string) => this.getNodeOutput(nodeName)
        }

        // Default behavior
        return Reflect.get(target, prop, receiver)
      }
    })
  }

  /**
   * Get current input data
   */
  get $json(): IDataObject {
    if (this.connectionInputData.length === 0) {
      return {}
    }
    return this.connectionInputData[this.itemIndex] || {}
  }

  /**
   * Get all input items
   */
  get $items(): IDataObject[] {
    return this.connectionInputData
  }

  /**
   * Get current item index
   */
  get $itemIndex(): number {
    return this.itemIndex
  }

  /**
   * Get workflow data
   */
  get $workflow(): any {
    return {
      id: this.workflow.id,
      name: this.workflow.name,
      active: this.workflow.active
    }
  }

  /**
   * Get execution data
   */
  get $execution(): any {
    return {
      id: 'exec_' + Date.now(),
      mode: 'manual',
      resumeUrl: undefined
    }
  }

  /**
   * Get current timestamp
   */
  get $now(): DateTime {
    return DateTime.now().setZone(this.defaultTimezone)
  }

  /**
   * Get today's date
   */
  get $today(): DateTime {
    return DateTime.now().setZone(this.defaultTimezone).startOf('day')
  }

  /**
   * JMESPath query function
   */
  $jmespath(data: any, query: string): any {
    return jmespath.search(data, query)
  }

  /**
   * Get node data proxy
   */
  private getNodeDataProxy(): any {
    const proxy: any = {}
    
    // Add data for all executed nodes
    for (const nodeName in this.runExecutionData.resultData.runData) {
      const nodeRunData = this.runExecutionData.resultData.runData[nodeName]
      
      if (nodeRunData && nodeRunData.length > 0) {
        // Get the last execution of the node
        const lastNodeExecution = nodeRunData[nodeRunData.length - 1]
        
        if (lastNodeExecution.data?.main && lastNodeExecution.data.main[0]) {
          proxy[nodeName] = {
            json: lastNodeExecution.data.main[0][0] || {},
            data: lastNodeExecution.data.main[0] || [],
            context: {},
            parameter: this.workflow.getNode(nodeName)?.parameters || {}
          }
        }
      }
    }
    
    return proxy
  }

  /**
   * Get output data from a specific node
   */
  private getNodeOutput(nodeName: string, outputIndex = 0): IDataObject[] {
    const nodeRunData = this.runExecutionData.resultData.runData[nodeName]
    
    if (!nodeRunData || nodeRunData.length === 0) {
      return []
    }
    
    const lastNodeExecution = nodeRunData[nodeRunData.length - 1]
    
    if (lastNodeExecution.data?.main && lastNodeExecution.data.main[outputIndex]) {
      return lastNodeExecution.data.main[outputIndex]
    }
    
    return []
  }

  /**
   * Get previous node output
   */
  get $prev(): any {
    const parentNodes = this.workflow.getParentNodes(this.nodeName)
    
    if (parentNodes.length === 0) {
      return null
    }
    
    // Return data from the first parent node
    const parentNodeName = parentNodes[0]
    const nodeData = this.getNodeOutput(parentNodeName)
    
    return {
      json: nodeData[0] || {},
      data: nodeData,
      name: parentNodeName,
      outputIndex: 0,
      runIndex: 0
    }
  }

  /**
   * Get input data
   */
  get $input(): any {
    return {
      all: () => this.connectionInputData,
      first: () => this.connectionInputData[0] || {},
      last: () => this.connectionInputData[this.connectionInputData.length - 1] || {},
      item: (index: number) => this.connectionInputData[index] || {},
      params: this.workflow.getNode(this.nodeName)?.parameters || {}
    }
  }

  /**
   * Get binary data proxy
   */
  get $binary(): any {
    const binaryData = this.$json._binary || this.$json.binary || {}
    
    return new Proxy(binaryData, {
      get: (target, prop) => {
        if (typeof prop === 'string' && target[prop]) {
          return target[prop]
        }
        return undefined
      }
    })
  }

  /**
   * Get position in current execution
   */
  get $position(): number {
    return this.itemIndex
  }

  /**
   * Get run index
   */
  get $runIndex(): number {
    const nodeRunData = this.runExecutionData.resultData.runData[this.nodeName]
    return nodeRunData ? nodeRunData.length : 0
  }

  /**
   * Get environment variables (mock)
   */
  get $env(): any {
    return {
      NODE_ENV: 'production',
      TZ: this.defaultTimezone
    }
  }

  /**
   * Get parameter value
   */
  $parameter(name: string, options?: any): any {
    const node = this.workflow.getNode(this.nodeName)
    if (!node) {
      return undefined
    }
    
    return node.parameters?.[name] || options?.fallback
  }

  /**
   * Evaluate expression helper
   */
  $evaluateExpression(expression: string, evaluator?: any): any {
    // This would normally use the expression evaluator
    // For now, return the expression as-is
    return expression
  }

  /**
   * Check if property exists
   */
  $exists(path: string): boolean {
    try {
      const result = jmespath.search(this.$json, path)
      return result !== null && result !== undefined
    } catch {
      return false
    }
  }

  /**
   * Check if empty
   */
  $isEmpty(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return true
    }
    
    if (Array.isArray(value)) {
      return value.length === 0
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0
    }
    
    return false
  }
}