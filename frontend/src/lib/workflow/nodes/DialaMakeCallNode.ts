/**
 * Diala Make Call node - Custom node for voice agent calls
 */

import { BaseNode } from './BaseNode'
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeTypeDescription,
  IDataObject
} from '../types'

export class DialaMakeCallNode extends BaseNode {
  description: INodeTypeDescription = {
    displayName: 'Make Call',
    name: 'dialaMakeCall',
    icon: 'phone',
    group: ['action'],
    version: 1,
    description: 'Initiate a voice call using Diala voice agents',
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
        placeholder: '+1234567890',
        required: true,
        description: 'Phone number to call (with country code)',
      },
      {
        displayName: 'Agent',
        name: 'agent',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getAgents',
        },
        options: [
          { name: 'Default Agent', value: 'default' },
          { name: 'Sales Agent', value: 'sales' },
          { name: 'Support Agent', value: 'support' },
          { name: 'Custom Agent', value: 'custom' },
        ],
        default: 'default',
        description: 'Voice agent to use for the call',
      },
      {
        displayName: 'Voice',
        name: 'voice',
        type: 'options',
        options: [
          { name: 'Alloy', value: 'alloy' },
          { name: 'Echo', value: 'echo' },
          { name: 'Fable', value: 'fable' },
          { name: 'Onyx', value: 'onyx' },
          { name: 'Nova', value: 'nova' },
          { name: 'Shimmer', value: 'shimmer' },
        ],
        default: 'alloy',
        description: 'Voice to use for the agent',
      },
      {
        displayName: 'Initial Message',
        name: 'initialMessage',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: 'Hello! This is an automated call from {{$workflow.name}}.',
        description: 'Initial message to speak when call is answered',
      },
      {
        displayName: 'Call Purpose',
        name: 'purpose',
        type: 'options',
        options: [
          { name: 'Information', value: 'info' },
          { name: 'Sales', value: 'sales' },
          { name: 'Support', value: 'support' },
          { name: 'Survey', value: 'survey' },
          { name: 'Reminder', value: 'reminder' },
          { name: 'Custom', value: 'custom' },
        ],
        default: 'info',
        description: 'Purpose of the call',
      },
      {
        displayName: 'Variables',
        name: 'variables',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'variable',
            displayName: 'Variable',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                placeholder: 'customerName',
                description: 'Variable name to pass to agent',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'Variable value',
              },
            ],
          },
        ],
        description: 'Variables to pass to the voice agent',
      },
      {
        displayName: 'Additional Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Max Call Duration',
            name: 'maxDuration',
            type: 'number',
            default: 300,
            description: 'Maximum call duration in seconds',
          },
          {
            displayName: 'Record Call',
            name: 'recordCall',
            type: 'boolean',
            default: false,
            description: 'Whether to record the call',
          },
          {
            displayName: 'Transcribe Call',
            name: 'transcribeCall',
            type: 'boolean',
            default: true,
            description: 'Whether to transcribe the call',
          },
          {
            displayName: 'Wait for Completion',
            name: 'waitForCompletion',
            type: 'boolean',
            default: false,
            description: 'Whether to wait for call to complete before continuing',
          },
          {
            displayName: 'Retry on Busy',
            name: 'retryOnBusy',
            type: 'boolean',
            default: true,
            description: 'Whether to retry if line is busy',
          },
          {
            displayName: 'Retry Attempts',
            name: 'retryAttempts',
            type: 'number',
            displayOptions: {
              show: {
                retryOnBusy: [true],
              },
            },
            default: 3,
            description: 'Number of retry attempts',
          },
          {
            displayName: 'Language',
            name: 'language',
            type: 'options',
            options: [
              { name: 'English', value: 'en' },
              { name: 'Spanish', value: 'es' },
              { name: 'French', value: 'fr' },
              { name: 'German', value: 'de' },
              { name: 'Italian', value: 'it' },
              { name: 'Portuguese', value: 'pt' },
              { name: 'Dutch', value: 'nl' },
              { name: 'Russian', value: 'ru' },
              { name: 'Chinese', value: 'zh' },
              { name: 'Japanese', value: 'ja' },
              { name: 'Korean', value: 'ko' },
            ],
            default: 'en',
            description: 'Language for the conversation',
          },
          {
            displayName: 'Webhook URL',
            name: 'webhookUrl',
            type: 'string',
            default: '',
            description: 'URL to receive call events and updates',
          },
        ],
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return this.processAllItems(this, async (item, itemIndex) => {
      // Get parameters
      const phoneNumber = this.getNodeParameter('phoneNumber', itemIndex) as string
      const agent = this.getNodeParameter('agent', itemIndex) as string
      const voice = this.getNodeParameter('voice', itemIndex) as string
      const initialMessage = this.getNodeParameter('initialMessage', itemIndex) as string
      const purpose = this.getNodeParameter('purpose', itemIndex) as string
      const variables = this.getNodeParameter('variables', itemIndex, {}) as any
      const options = this.getNodeParameter('options', itemIndex, {}) as any
      
      // Validate phone number
      if (!phoneNumber || !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error('Invalid phone number format')
      }
      
      // Build variables object
      const callVariables: IDataObject = {}
      if (variables.variable) {
        for (const variable of variables.variable) {
          if (variable.name) {
            callVariables[variable.name] = variable.value
          }
        }
      }
      
      // Prepare call request
      const callRequest = {
        to: phoneNumber,
        agent: {
          id: agent,
          voice,
          language: options.language || 'en',
          initialMessage: this.evaluateParameter(this, initialMessage, itemIndex, item),
        },
        purpose,
        variables: callVariables,
        options: {
          maxDuration: options.maxDuration || 300,
          recordCall: options.recordCall || false,
          transcribeCall: options.transcribeCall !== false,
          webhookUrl: options.webhookUrl,
        },
        metadata: {
          workflowId: this.getWorkflow().id,
          executionId: this.getExecutionId(),
          nodeId: this.getNode().id,
          itemIndex,
        },
      }
      
      // Make the call (simulated for now)
      const callResponse = await this.makeCall(callRequest, options)
      
      return {
        ...item,
        call: callResponse,
      }
    })
  }

  private async makeCall(callRequest: any, options: any): Promise<IDataObject> {
    // Simulate API call to Diala calling service
    // In production, this would make an actual API request
    
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Simulate call initiation
    const response: IDataObject = {
      callId,
      status: 'initiated',
      startTime: new Date().toISOString(),
      to: callRequest.to,
      agent: callRequest.agent.id,
      voice: callRequest.agent.voice,
      purpose: callRequest.purpose,
      variables: callRequest.variables,
    }
    
    // If wait for completion is enabled, simulate call completion
    if (options.waitForCompletion) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate delay
      
      response.status = 'completed'
      response.endTime = new Date().toISOString()
      response.duration = 45 // seconds
      response.outcome = 'answered'
      response.transcription = 'Hello, this is a test call transcript...'
      response.summary = 'Call completed successfully. Customer was interested in the product.'
      response.sentiment = 'positive'
      response.keyPoints = [
        'Customer expressed interest',
        'Scheduled follow-up for next week',
        'Requested more information via email',
      ]
    }
    
    return response
  }
}