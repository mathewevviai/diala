/**
 * Base node class with full n8n functionality
 */

import { 
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IDataObject,
  NodeParameterValue,
  INodeProperties
} from '../types'
import { ExpressionParser } from '../core/ExpressionParser'
import { WorkflowDataProxy } from '../core/WorkflowDataProxy'

export class BaseNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Base Node',
    name: 'baseNode',
    group: [],
    version: 1,
    description: 'Base node implementation',
    defaults: { name: 'Base Node' },
    inputs: [],
    outputs: [],
    properties: [],
  }

  /**
   * Execute method - must be overridden by subclasses
   */
  async execute(context: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    throw new Error('Execute method must be implemented by subclass')
  }

  /**
   * Process all items with expression evaluation
   */
  protected async processAllItems(
    context: IExecuteFunctions,
    processor: (item: IDataObject, index: number) => Promise<IDataObject>
  ): Promise<INodeExecutionData[][]> {
    const items = context.getInputData()
    const returnData: IDataObject[] = []

    for (let i = 0; i < items.length; i++) {
      try {
        const processedItem = await processor(items[i], i)
        returnData.push(processedItem)
      } catch (error) {
        if (context.continueOnFail()) {
          returnData.push({
            error: error.message,
            errorDetails: error
          })
        } else {
          throw error
        }
      }
    }

    return [returnData]
  }

  /**
   * Evaluate parameter with expression support
   */
  protected evaluateParameter(
    context: IExecuteFunctions,
    parameterValue: NodeParameterValue,
    itemIndex: number,
    inputData: IDataObject
  ): any {
    if (typeof parameterValue !== 'string') {
      return parameterValue
    }

    // Check if it's an expression
    if (!ExpressionParser.isExpression(parameterValue)) {
      return parameterValue
    }

    // Create context for expression evaluation
    const dataProxy = context.getWorkflowDataProxy(itemIndex)
    const evalContext = {
      $json: inputData,
      $node: dataProxy.$node,
      $workflow: dataProxy.$workflow,
      $position: itemIndex,
      $now: dataProxy.$now,
      $today: dataProxy.$today,
      $items: dataProxy.$items,
      $input: dataProxy.$input,
      $binary: dataProxy.$binary,
      $: (nodeName: string) => dataProxy.$(nodeName)
    }

    return ExpressionParser.evaluate(parameterValue, evalContext)
  }

  /**
   * Get resolved node parameters
   */
  protected getResolvedNodeParameters(
    context: IExecuteFunctions,
    itemIndex: number,
    inputData: IDataObject
  ): IDataObject {
    const resolved: IDataObject = {}
    const properties = this.description.properties

    for (const property of properties) {
      const paramValue = context.getNodeParameter(property.name, itemIndex, property.default)
      
      // Check display conditions
      if (this.shouldDisplay(property, resolved, context, itemIndex)) {
        resolved[property.name] = this.evaluateParameter(
          context,
          paramValue,
          itemIndex,
          inputData
        )
      }
    }

    return resolved
  }

  /**
   * Check if property should be displayed based on conditions
   */
  private shouldDisplay(
    property: INodeProperties,
    resolvedParams: IDataObject,
    context: IExecuteFunctions,
    itemIndex: number
  ): boolean {
    if (!property.displayOptions) return true

    const { show, hide } = property.displayOptions

    // Check show conditions
    if (show) {
      for (const [param, values] of Object.entries(show)) {
        const currentValue = resolvedParams[param] ?? context.getNodeParameter(param, itemIndex, undefined)
        if (!values?.includes(currentValue)) {
          return false
        }
      }
    }

    // Check hide conditions
    if (hide) {
      for (const [param, values] of Object.entries(hide)) {
        const currentValue = resolvedParams[param] ?? context.getNodeParameter(param, itemIndex, undefined)
        if (values?.includes(currentValue)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Helper to handle binary data
   */
  protected async handleBinaryData(
    context: IExecuteFunctions,
    itemIndex: number,
    propertyName: string
  ): Promise<Buffer | null> {
    try {
      return await context.helpers.getBinaryDataBuffer(itemIndex, propertyName)
    } catch {
      return null
    }
  }

  /**
   * Helper to prepare output with proper metadata
   */
  protected prepareOutputData(
    items: IDataObject[],
    inputItems: INodeExecutionData[]
  ): INodeExecutionData[][] {
    return [items.map(item => ({ json: item }))]
  }

  /**
   * Helper for retryable operations
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }

    throw lastError!
  }

  /**
   * Validate required parameters
   */
  protected validateRequiredParameters(
    params: IDataObject,
    required: string[]
  ): void {
    const missing = required.filter(param => !params[param])
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`)
    }
  }

  /**
   * Transform data based on property mapping
   */
  protected transformDataByMapping(
    inputData: IDataObject,
    mapping: Record<string, string>
  ): IDataObject {
    const output: IDataObject = {}

    for (const [outputKey, inputPath] of Object.entries(mapping)) {
      const value = this.getValueByPath(inputData, inputPath)
      if (value !== undefined) {
        output[outputKey] = value
      }
    }

    return output
  }

  /**
   * Get value from object by dot notation path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Set value in object by dot notation path
   */
  protected setValueByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }
}