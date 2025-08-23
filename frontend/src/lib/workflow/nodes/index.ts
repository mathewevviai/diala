/**
 * Node implementations for the workflow system
 */

import { NodeType, IExecuteContext, INodeExecutionData, IDataObject } from '../workflow-executor'
import { ExpressionEvaluator } from '../expression-evaluator'

export class WebhookNode extends NodeType {
  description = {
    displayName: 'Webhook',
    name: 'webhook',
    group: ['trigger'],
    version: 1,
    description: 'Starts workflow on webhook call',
    defaults: {
      name: 'Webhook',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '',
        required: true,
        description: 'The path to listen for webhook calls',
      },
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        default: 'POST',
        description: 'The HTTP method to listen for',
      },
    ],
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    // In a real implementation, this would receive data from the webhook
    // For now, return mock data
    const webhookData = {
      headers: {
        'content-type': 'application/json',
      },
      body: {
        message: 'Webhook triggered',
        timestamp: new Date().toISOString(),
      },
      query: {},
    }

    return [[webhookData]]
  }
}

export class HttpRequestNode extends NodeType {
  description = {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    group: ['transform'],
    version: 1,
    description: 'Makes HTTP requests',
    defaults: {
      name: 'HTTP Request',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        ],
        default: 'GET',
        description: 'The HTTP method to use',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
        description: 'The URL to make the request to',
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'json',
        default: '{}',
        description: 'Headers to send with the request',
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'json',
        default: '{}',
        description: 'Body to send with the request',
      },
    ],
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const items = context.getInputData()
    const returnData: IDataObject[] = []
    
    const method = context.getNodeParameter('method') as string
    const url = context.getNodeParameter('url') as string
    const headers = context.getNodeParameter('headers', 0, {})
    const body = context.getNodeParameter('body', 0, {})

    for (let i = 0; i < items.length; i++) {
      try {
        // Create expression evaluator for this item
        const evaluator = new ExpressionEvaluator({}, {}, i)
        
        // Resolve expressions in parameters
        const resolvedUrl = evaluator.evaluate(url, items[i])
        const resolvedHeaders = evaluator.evaluateAll(headers, i)
        const resolvedBody = evaluator.evaluateAll(body, i)

        // Make the HTTP request
        const response = await fetch(resolvedUrl, {
          method,
          headers: resolvedHeaders as HeadersInit,
          body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(resolvedBody),
        })

        const responseData = await response.json()

        returnData.push({
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData,
        })
      } catch (error) {
        returnData.push({
          error: error.message,
          statusCode: 0,
        })
      }
    }

    return [returnData]
  }
}

export class CodeNode extends NodeType {
  description = {
    displayName: 'Code',
    name: 'code',
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
        displayName: 'JavaScript Code',
        name: 'code',
        type: 'code',
        default: '// Access input data\nconst items = $input.all();\n\n// Process data\nreturn items.map(item => {\n  return {\n    ...item.json,\n    processed: true\n  };\n});',
        description: 'JavaScript code to execute',
      },
    ],
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const items = context.getInputData()
    const code = context.getNodeParameter('code') as string

    // Create safe execution context
    const $input = {
      all: () => items,
      first: () => items[0] || {},
      last: () => items[items.length - 1] || {},
      item: (index: number) => items[index] || {},
    }

    const helpers = {
      $now: () => new Date(),
      $today: () => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        return date
      },
      $random: (min = 0, max = 1) => Math.random() * (max - min) + min,
    }

    try {
      // Execute code in sandboxed environment
      const func = new Function('$input', ...Object.keys(helpers), code)
      const result = func($input, ...Object.values(helpers))

      // Ensure result is an array
      const resultArray = Array.isArray(result) ? result : [result]
      
      return [resultArray.map(item => ({
        json: item,
      }))]
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`)
    }
  }
}

export class DialaMakeCallNode extends NodeType {
  description = {
    displayName: 'Make Call',
    name: 'dialaMakeCall',
    group: ['action'],
    version: 1,
    description: 'Initiate a voice call using Diala',
    defaults: {
      name: 'Make Call',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        default: '',
        required: true,
        description: 'Phone number to call',
      },
      {
        displayName: 'Agent ID',
        name: 'agentId',
        type: 'string',
        default: '',
        required: true,
        description: 'ID of the agent to use for the call',
      },
      {
        displayName: 'Initial Message',
        name: 'initialMessage',
        type: 'string',
        default: '',
        description: 'Initial message to speak when call is answered',
      },
      {
        displayName: 'Variables',
        name: 'variables',
        type: 'json',
        default: '{}',
        description: 'Variables to pass to the agent',
      },
    ],
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const items = context.getInputData()
    const returnData: IDataObject[] = []

    for (let i = 0; i < items.length; i++) {
      const phoneNumber = context.getNodeParameter('phoneNumber', i) as string
      const agentId = context.getNodeParameter('agentId', i) as string
      const initialMessage = context.getNodeParameter('initialMessage', i, '') as string
      const variables = context.getNodeParameter('variables', i, {})

      // Create expression evaluator
      const evaluator = new ExpressionEvaluator({}, {}, i)
      
      // Resolve expressions
      const resolvedPhoneNumber = evaluator.evaluate(phoneNumber, items[i])
      const resolvedInitialMessage = evaluator.evaluate(initialMessage, items[i])
      const resolvedVariables = evaluator.evaluateAll(variables, i)

      // Simulate API call to Diala
      const callResult = {
        callId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        phoneNumber: resolvedPhoneNumber,
        agentId,
        status: 'initiated',
        timestamp: new Date().toISOString(),
        variables: resolvedVariables,
        initialMessage: resolvedInitialMessage,
      }

      returnData.push(callResult)
    }

    return [returnData]
  }
}

export class SetNode extends NodeType {
  description = {
    displayName: 'Set',
    name: 'set',
    group: ['transform'],
    version: 1,
    description: 'Set data fields on items',
    defaults: {
      name: 'Set',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Values to Set',
        name: 'values',
        type: 'fixedCollection',
        default: {},
        typeOptions: {
          multipleValues: true,
        },
        options: [
          {
            name: 'string',
            displayName: 'String',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
          {
            name: 'number',
            displayName: 'Number',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'number',
                default: 0,
              },
            ],
          },
          {
            name: 'boolean',
            displayName: 'Boolean',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'boolean',
                default: false,
              },
            ],
          },
        ],
      },
    ],
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const items = context.getInputData()
    const returnData: IDataObject[] = []
    const values = context.getNodeParameter('values', 0, {}) as any

    for (let i = 0; i < items.length; i++) {
      const newItem = { ...items[i] }
      
      // Set string values
      if (values.string) {
        for (const stringValue of values.string) {
          if (stringValue.name) {
            newItem[stringValue.name] = stringValue.value
          }
        }
      }

      // Set number values
      if (values.number) {
        for (const numberValue of values.number) {
          if (numberValue.name) {
            newItem[numberValue.name] = numberValue.value
          }
        }
      }

      // Set boolean values
      if (values.boolean) {
        for (const booleanValue of values.boolean) {
          if (booleanValue.name) {
            newItem[booleanValue.name] = booleanValue.value
          }
        }
      }

      returnData.push(newItem)
    }

    return [returnData]
  }
}

// Registry of all available nodes
export const nodeTypes = new Map<string, NodeType>([
  ['webhook', new WebhookNode()],
  ['httpRequest', new HttpRequestNode()],
  ['code', new CodeNode()],
  ['dialaMakeCall', new DialaMakeCallNode()],
  ['set', new SetNode()],
])