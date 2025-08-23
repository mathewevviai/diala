/**
 * Webhook trigger node
 */

import { BaseNode } from './BaseNode'
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData
} from '../types'

export class WebhookNode extends BaseNode {
  description: INodeTypeDescription = {
    displayName: 'Webhook',
    name: 'webhook',
    icon: 'webhook',
    group: ['trigger'],
    version: 1,
    description: 'Starts workflow when webhook URL is called',
    defaults: {
      name: 'Webhook',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '',
        placeholder: 'webhook-path',
        required: true,
        description: 'The path to listen on',
      },
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        options: [
          { name: 'DELETE', value: 'DELETE' },
          { name: 'GET', value: 'GET' },
          { name: 'HEAD', value: 'HEAD' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
        ],
        default: 'POST',
        description: 'The HTTP method to listen for',
      },
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        options: [
          {
            name: 'On Received',
            value: 'onReceived',
            description: 'Response immediately when webhook is received',
          },
          {
            name: 'Last Node',
            value: 'lastNode',
            description: 'Response with data from last executed node',
          },
        ],
        default: 'onReceived',
        description: 'When and how to respond to the webhook',
      },
      {
        displayName: 'Response Code',
        name: 'responseCode',
        type: 'number',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
          },
        },
        default: 200,
        description: 'The HTTP response code to return',
      },
      {
        displayName: 'Response Data',
        name: 'responseData',
        type: 'options',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
          },
        },
        options: [
          {
            name: 'None',
            value: 'noData',
          },
          {
            name: 'Text',
            value: 'text',
          },
          {
            name: 'JSON',
            value: 'json',
          },
        ],
        default: 'noData',
        description: 'What data to return in response',
      },
      {
        displayName: 'Response Body',
        name: 'responseBody',
        type: 'json',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
            responseData: ['json'],
          },
        },
        default: '{\n  "success": true\n}',
        description: 'The JSON response body',
      },
    ],
  }

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject()
    const resp = this.getResponseObject()
    const headers = this.getHeaderData()
    const params = this.getParamsData()
    const query = this.getQueryData()
    const body = this.getBodyData()

    // Prepare webhook data
    const webhookData: INodeExecutionData[][] = [[
      {
        json: {
          headers,
          params,
          query,
          body,
          webhookUrl: this.getNodeWebhookUrl('default'),
          method: req.method,
        },
      },
    ]]

    // Handle response based on mode
    const responseMode = this.getNodeParameter('responseMode') as string

    if (responseMode === 'onReceived') {
      const responseCode = this.getNodeParameter('responseCode') as number
      const responseData = this.getNodeParameter('responseData') as string

      resp.statusCode = responseCode

      if (responseData === 'json') {
        const responseBody = this.getNodeParameter('responseBody')
        resp.json(responseBody)
      } else if (responseData === 'text') {
        resp.send('Webhook received')
      } else {
        resp.end()
      }

      return {
        workflowData: webhookData,
        noWebhookResponse: true,
      }
    }

    return {
      workflowData: webhookData,
    }
  }

  // For manual execution
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Return mock webhook data for testing
    return [[
      {
        json: {
          headers: {
            'content-type': 'application/json',
          },
          params: {},
          query: {},
          body: {
            message: 'Test webhook data',
            timestamp: new Date().toISOString(),
          },
          webhookUrl: 'http://localhost:5678/webhook/test',
          method: 'POST',
        },
      },
    ]]
  }
}