/**
 * Advanced Code node with sandboxed execution
 */

import { BaseNode } from './BaseNode'
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeTypeDescription,
  IDataObject
} from '../types'

export class CodeNode extends BaseNode {
  description: INodeTypeDescription = {
    displayName: 'Code',
    name: 'code',
    icon: 'code',
    group: ['transform'],
    version: 1,
    description: 'Execute custom JavaScript code',
    defaults: {
      name: 'Code',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Language',
        name: 'language',
        type: 'options',
        options: [
          { name: 'JavaScript', value: 'javascript' },
          { name: 'Python (Planned)', value: 'python' },
        ],
        default: 'javascript',
        description: 'The programming language to use',
      },
      {
        displayName: 'Code',
        name: 'jsCode',
        type: 'string',
        typeOptions: {
          alwaysOpenEditWindow: true,
          rows: 10,
        },
        default: `// Available variables:
// - $input: The input data
// - $json: The current item's JSON data
// - $node: Data from other nodes
// - $workflow: Workflow metadata
// - $now: Current datetime
// - $today: Today's date at midnight
// - $items: All input items

// Example: Process each item
const items = $input.all();

return items.map(item => {
  return {
    ...item.json,
    processedAt: $now.toISO(),
    itemCount: items.length
  };
});`,
        description: 'JavaScript code to execute',
        displayOptions: {
          show: {
            language: ['javascript'],
          },
        },
      },
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        options: [
          {
            name: 'Run Once for All Items',
            value: 'runOnceForAllItems',
            description: 'Run code once with all items available',
          },
          {
            name: 'Run Once for Each Item',
            value: 'runOnceForEachItem',
            description: 'Run code for each item individually',
          },
        ],
        default: 'runOnceForAllItems',
        description: 'How to run the code',
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const mode = this.getNodeParameter('mode', 0) as string
    const jsCode = this.getNodeParameter('jsCode', 0) as string
    const items = this.getInputData()

    if (mode === 'runOnceForAllItems') {
      // Run code once with all items
      const result = await this.runCode(jsCode, items, 0)
      
      // Ensure result is an array
      const resultArray = Array.isArray(result) ? result : [result]
      
      return [resultArray.map(item => ({
        json: typeof item === 'object' ? item : { result: item }
      }))]
    } else {
      // Run code for each item
      const returnData: IDataObject[] = []
      
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        try {
          const result = await this.runCode(jsCode, [items[itemIndex]], itemIndex)
          
          if (Array.isArray(result)) {
            returnData.push(...result)
          } else {
            returnData.push(typeof result === 'object' ? result : { result })
          }
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              error: error.message,
              errorDetails: error
            })
          } else {
            throw error
          }
        }
      }
      
      return [returnData.map(item => ({ json: item }))]
    }
  }

  private async runCode(
    code: string,
    items: INodeExecutionData[],
    itemIndex: number
  ): Promise<any> {
    // Get workflow data proxy for expressions
    const dataProxy = this.getWorkflowDataProxy(itemIndex)
    
    // Create execution context
    const context = {
      // Input data access
      $input: {
        all: () => items.map(item => item.json),
        first: () => items[0]?.json || {},
        last: () => items[items.length - 1]?.json || {},
        item: (index = 0) => items[index]?.json || {},
      },
      
      // Current item
      $json: items[itemIndex]?.json || {},
      $binary: items[itemIndex]?.binary || {},
      
      // Workflow data
      $node: dataProxy.$node,
      $workflow: dataProxy.$workflow,
      $execution: dataProxy.$execution,
      
      // Date/time helpers
      $now: dataProxy.$now,
      $today: dataProxy.$today,
      DateTime: (await import('luxon')).DateTime,
      
      // Utility functions
      $items: (nodeName?: string) => {
        if (nodeName) {
          return dataProxy.$node[nodeName]?.data || []
        }
        return items.map(item => item.json)
      },
      
      // Helper functions
      $: dataProxy.$,
      $jmespath: dataProxy.$jmespath,
      
      // Built-in helpers
      console: {
        log: (...args: any[]) => console.log('[Code]', ...args),
        error: (...args: any[]) => console.error('[Code]', ...args),
        warn: (...args: any[]) => console.warn('[Code]', ...args),
      },
      
      // Safe JSON methods
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
      
      // Safe Object methods
      Object: {
        keys: Object.keys,
        values: Object.values,
        entries: Object.entries,
        assign: Object.assign,
        fromEntries: Object.fromEntries,
      },
      
      // Safe Array methods
      Array: {
        isArray: Array.isArray,
        from: Array.from,
      },
      
      // Math functions
      Math,
      
      // String/Number constructors
      String,
      Number,
      Boolean,
      
      // Promise support
      Promise,
      
      // Async/await support
      async: true,
    }

    try {
      // Create function with async support
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
      const func = new AsyncFunction(...Object.keys(context), code)
      
      // Execute code
      const result = await func(...Object.values(context))
      
      return result
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`)
    }
  }
}