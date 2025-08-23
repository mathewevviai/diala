/**
 * Advanced HTTP Request node with full n8n functionality
 */

import { BaseNode } from './BaseNode'
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeTypeDescription,
  IDataObject,
  IHttpRequestOptions
} from '../types'

export class HttpRequestNode extends BaseNode {
  description: INodeTypeDescription = {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    icon: 'globe',
    group: ['transform'],
    version: 1,
    description: 'Makes HTTP requests and returns the response',
    defaults: {
      name: 'HTTP Request',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'httpBasicAuth',
        required: false,
      },
      {
        name: 'httpBearerTokenAuth',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'DELETE', value: 'DELETE' },
          { name: 'GET', value: 'GET' },
          { name: 'HEAD', value: 'HEAD' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
        ],
        default: 'GET',
        description: 'The request method to use',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        placeholder: 'https://example.com/endpoint',
        required: true,
        description: 'The URL to make the request to',
      },
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Basic Auth', value: 'basicAuth' },
          { name: 'Bearer Token', value: 'bearerToken' },
          { name: 'Header Auth', value: 'headerAuth' },
        ],
        default: 'none',
      },
      {
        displayName: 'Send Query Parameters',
        name: 'sendQuery',
        type: 'boolean',
        default: false,
        description: 'Whether to send query parameters',
      },
      {
        displayName: 'Query Parameters',
        name: 'queryParameters',
        type: 'fixedCollection',
        displayOptions: {
          show: {
            sendQuery: [true],
          },
        },
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Parameter',
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
        ],
      },
      {
        displayName: 'Send Headers',
        name: 'sendHeaders',
        type: 'boolean',
        default: false,
        description: 'Whether to send custom headers',
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'fixedCollection',
        displayOptions: {
          show: {
            sendHeaders: [true],
          },
        },
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'header',
            displayName: 'Header',
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
        ],
      },
      {
        displayName: 'Send Body',
        name: 'sendBody',
        type: 'boolean',
        displayOptions: {
          show: {
            method: ['PATCH', 'POST', 'PUT'],
          },
        },
        default: false,
        description: 'Whether to send a body',
      },
      {
        displayName: 'Body Content Type',
        name: 'bodyContentType',
        type: 'options',
        displayOptions: {
          show: {
            sendBody: [true],
            method: ['PATCH', 'POST', 'PUT'],
          },
        },
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'RAW/Text', value: 'raw' },
          { name: 'Form Data', value: 'form' },
          { name: 'Form URL Encoded', value: 'urlencoded' },
        ],
        default: 'json',
      },
      {
        displayName: 'Body',
        name: 'bodyJson',
        type: 'json',
        displayOptions: {
          show: {
            sendBody: [true],
            bodyContentType: ['json'],
            method: ['PATCH', 'POST', 'PUT'],
          },
        },
        default: '{\n  "key": "value"\n}',
        description: 'The JSON body to send',
      },
      {
        displayName: 'Body',
        name: 'bodyRaw',
        type: 'string',
        displayOptions: {
          show: {
            sendBody: [true],
            bodyContentType: ['raw'],
            method: ['PATCH', 'POST', 'PUT'],
          },
        },
        default: '',
        description: 'The raw body to send',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Ignore SSL Issues',
            name: 'ignoreSslIssues',
            type: 'boolean',
            default: false,
            description: 'Whether to ignore SSL certificate validation',
          },
          {
            displayName: 'Response Format',
            name: 'responseFormat',
            type: 'options',
            options: [
              { name: 'JSON', value: 'json' },
              { name: 'Text', value: 'text' },
              { name: 'Binary', value: 'binary' },
            ],
            default: 'json',
            description: 'The format in which to return the response',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 30000,
            description: 'Request timeout in milliseconds',
          },
          {
            displayName: 'Follow Redirects',
            name: 'followRedirects',
            type: 'boolean',
            default: true,
            description: 'Whether to follow HTTP redirects',
          },
          {
            displayName: 'Follow All Redirects',
            name: 'followAllRedirects',
            type: 'boolean',
            default: false,
            description: 'Whether to follow all redirects (including non-GET)',
          },
          {
            displayName: 'Max Redirects',
            name: 'maxRedirects',
            type: 'number',
            default: 5,
            description: 'Maximum number of redirects to follow',
          },
          {
            displayName: 'Response Headers',
            name: 'responseHeaders',
            type: 'boolean',
            default: false,
            description: 'Whether to return response headers',
          },
          {
            displayName: 'Full Response',
            name: 'fullResponse',
            type: 'boolean',
            default: false,
            description: 'Whether to return the full response object',
          },
        ],
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return this.processAllItems(this, async (item, itemIndex) => {
      // Get resolved parameters
      const params = this.getResolvedNodeParameters(this, itemIndex, item)
      
      // Build request options
      const requestOptions: IHttpRequestOptions = {
        method: params.method as string,
        url: params.url as string,
        headers: {},
        qs: {},
        timeout: params.options?.timeout || 30000,
        json: params.bodyContentType === 'json',
        rejectUnauthorized: !params.options?.ignoreSslIssues,
      }

      // Add query parameters
      if (params.sendQuery && params.queryParameters?.parameter) {
        const queryParams = params.queryParameters.parameter as any[]
        for (const param of queryParams) {
          if (param.name) {
            requestOptions.qs![param.name] = param.value
          }
        }
      }

      // Add headers
      if (params.sendHeaders && params.headers?.header) {
        const headers = params.headers.header as any[]
        for (const header of headers) {
          if (header.name) {
            requestOptions.headers![header.name] = header.value
          }
        }
      }

      // Add body
      if (params.sendBody && ['PATCH', 'POST', 'PUT'].includes(params.method as string)) {
        switch (params.bodyContentType) {
          case 'json':
            try {
              requestOptions.body = JSON.parse(params.bodyJson as string)
            } catch {
              requestOptions.body = params.bodyJson
            }
            break
          case 'raw':
            requestOptions.body = params.bodyRaw
            break
          case 'form':
          case 'urlencoded':
            // Handle form data
            requestOptions.headers!['Content-Type'] = 
              params.bodyContentType === 'form' 
                ? 'multipart/form-data' 
                : 'application/x-www-form-urlencoded'
            break
        }
      }

      // Handle authentication
      if (params.authentication !== 'none') {
        switch (params.authentication) {
          case 'basicAuth':
            const basicCreds = await this.getCredentials('httpBasicAuth', itemIndex)
            requestOptions.auth = {
              username: basicCreds.user as string,
              password: basicCreds.password as string,
            }
            break
          case 'bearerToken':
            const bearerCreds = await this.getCredentials('httpBearerTokenAuth', itemIndex)
            requestOptions.headers!['Authorization'] = `Bearer ${bearerCreds.token}`
            break
        }
      }

      // Make the request
      try {
        const response = await this.helpers.httpRequest(requestOptions)
        
        // Format response based on options
        if (params.options?.fullResponse) {
          return {
            statusCode: response.statusCode,
            headers: response.headers,
            body: response.body,
            request: {
              url: requestOptions.url,
              method: requestOptions.method,
              headers: requestOptions.headers,
            },
          }
        } else if (params.options?.responseHeaders) {
          return {
            headers: response.headers,
            data: response.body,
          }
        } else {
          return response.body
        }
      } catch (error) {
        throw new Error(`HTTP Request failed: ${error.message}`)
      }
    })
  }
}