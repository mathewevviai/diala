/**
 * Expression evaluation system extracted from n8n
 */

import jmespath from 'jmespath'
import { DateTime } from 'luxon'

export interface IDataObject {
  [key: string]: any
}

export interface IWorkflowDataProxyData {
  $binary: any
  $data: any
  $env: any
  $evaluateExpression: (expression: string, itemIndex?: number) => any
  $item: (itemIndex: number, runIndex?: number, inputIndex?: number) => IDataObject
  $items: (nodeName?: string, outputIndex?: number, runIndex?: number) => IDataObject[]
  $json: IDataObject
  $node: any
  $parameter: any
  $position: number
  $runIndex: number
  $workflow: any
}

export class ExpressionEvaluator {
  private context: Record<string, any>
  private data: IDataObject
  private helpers: Record<string, Function>

  constructor(workflow: any, runExecutionData: any, itemIndex: number = 0) {
    this.data = {}
    this.context = {}
    this.helpers = this.createHelpers()
    this.setupContext(workflow, runExecutionData, itemIndex)
  }

  private createHelpers(): Record<string, Function> {
    return {
      // Date helpers
      $now: () => DateTime.now(),
      $today: () => DateTime.now().startOf('day'),
      $jmespath: (data: any, expression: string) => jmespath.search(data, expression),
      
      // String helpers
      $lowercase: (str: string) => str?.toLowerCase(),
      $uppercase: (str: string) => str?.toUpperCase(),
      $trim: (str: string) => str?.trim(),
      $split: (str: string, separator: string) => str?.split(separator),
      
      // Number helpers
      $round: (num: number, decimals = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
      $floor: (num: number) => Math.floor(num),
      $ceil: (num: number) => Math.ceil(num),
      $abs: (num: number) => Math.abs(num),
      
      // Array helpers
      $first: (arr: any[]) => arr?.[0],
      $last: (arr: any[]) => arr?.[arr.length - 1],
      $length: (arr: any[] | string) => arr?.length || 0,
      $isEmpty: (val: any) => !val || (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && Object.keys(val).length === 0),
      
      // Object helpers
      $keys: (obj: Record<string, any>) => Object.keys(obj || {}),
      $values: (obj: Record<string, any>) => Object.values(obj || {}),
      $entries: (obj: Record<string, any>) => Object.entries(obj || {}),
      
      // Type checking
      $isString: (val: any) => typeof val === 'string',
      $isNumber: (val: any) => typeof val === 'number',
      $isBoolean: (val: any) => typeof val === 'boolean',
      $isArray: (val: any) => Array.isArray(val),
      $isObject: (val: any) => typeof val === 'object' && val !== null && !Array.isArray(val),
      
      // Conversion
      $toString: (val: any) => String(val),
      $toNumber: (val: any) => Number(val),
      $toBoolean: (val: any) => Boolean(val),
      $toJson: (val: any) => JSON.stringify(val),
      $parseJson: (str: string) => {
        try {
          return JSON.parse(str)
        } catch {
          return null
        }
      },
    }
  }

  private setupContext(workflow: any, runExecutionData: any, itemIndex: number): void {
    // Setup basic context
    this.context = {
      ...this.helpers,
      $workflow: {
        id: workflow.id,
        name: workflow.name,
      },
      $execution: {
        id: 'test-execution',
        mode: 'manual',
      },
      $itemIndex: itemIndex,
    }

    // Add node data access
    if (runExecutionData) {
      this.context.$node = {}
      for (const nodeName in runExecutionData.resultData.runData) {
        const nodeData = runExecutionData.resultData.runData[nodeName]
        if (nodeData && nodeData.length > 0) {
          const lastRun = nodeData[nodeData.length - 1]
          if (lastRun.main && lastRun.main[0] && lastRun.main[0].length > 0) {
            this.context.$node[nodeName] = {
              json: lastRun.main[0][0],
              data: lastRun.main[0],
            }
          }
        }
      }
    }
  }

  evaluate(expression: string, data: IDataObject = {}): any {
    // Check if it's an expression (starts with = or {{ and ends with }})
    const isExpression = expression.startsWith('=') || (expression.startsWith('{{') && expression.endsWith('}}'))
    if (!isExpression) {
      return expression
    }

    // Clean expression
    let cleanExpression = expression
    if (expression.startsWith('=')) {
      cleanExpression = expression.substring(1).trim()
    } else if (expression.startsWith('{{') && expression.endsWith('}}')) {
      cleanExpression = expression.substring(2, expression.length - 2).trim()
    }

    // Create evaluation context
    const evalContext = {
      ...this.context,
      $json: data,
      $input: data,
      $: data, // Shorthand for current data
    }

    try {
      // Create safe evaluation function
      const func = new Function(...Object.keys(evalContext), `return ${cleanExpression}`)
      return func(...Object.values(evalContext))
    } catch (error) {
      console.error('Expression evaluation error:', error)
      return undefined
    }
  }

  evaluateAll(data: IDataObject, itemIndex: number = 0): IDataObject {
    const result: IDataObject = {}
    
    for (const key in data) {
      const value = data[key]
      
      if (typeof value === 'string') {
        result[key] = this.evaluate(value, data)
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'string' ? this.evaluate(item, data) : item
        )
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.evaluateAll(value, itemIndex)
      } else {
        result[key] = value
      }
    }
    
    return result
  }

  // Helper method to resolve parameter values
  resolveParameterValue(
    parameterValue: any,
    data: IDataObject,
    additionalKeys?: Record<string, any>
  ): any {
    if (typeof parameterValue !== 'string') {
      return parameterValue
    }

    const evalContext = {
      ...this.context,
      ...additionalKeys,
      $json: data,
      $input: data,
    }

    return this.evaluate(parameterValue, data)
  }
}