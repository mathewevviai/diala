/**
 * Set node for data transformation
 */

import { BaseNode } from './BaseNode'
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeTypeDescription,
  IDataObject
} from '../types'

export class SetNode extends BaseNode {
  description: INodeTypeDescription = {
    displayName: 'Set',
    name: 'set',
    icon: 'pen',
    group: ['transform'],
    version: 1,
    description: 'Set fields on items',
    defaults: {
      name: 'Set',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Keep Only Set Fields',
        name: 'keepOnlySet',
        type: 'boolean',
        default: false,
        description: 'Whether to keep only the fields that are set',
      },
      {
        displayName: 'Values to Set',
        name: 'values',
        type: 'fixedCollection',
        placeholder: 'Add Value',
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        default: {},
        options: [
          {
            name: 'string',
            displayName: 'String',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                placeholder: 'e.g. firstName',
                description: 'Name of the property to set',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                placeholder: 'e.g. John',
                description: 'Value to set',
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
                default: 'propertyName',
                placeholder: 'e.g. age',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'number',
                default: 0,
                description: 'Value to set',
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
                default: 'propertyName',
                placeholder: 'e.g. isActive',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'boolean',
                default: false,
                description: 'Value to set',
              },
            ],
          },
          {
            name: 'json',
            displayName: 'JSON',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: 'propertyName',
                placeholder: 'e.g. data',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'json',
                default: '{}',
                description: 'JSON value to set',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Dot Notation',
            name: 'dotNotation',
            type: 'boolean',
            default: true,
            description: 'Whether to use dot notation to set nested properties',
          },
          {
            displayName: 'Parse Numbers',
            name: 'parseNumbers',
            type: 'boolean',
            default: false,
            description: 'Whether to parse strings to numbers when possible',
          },
          {
            displayName: 'Include Binary',
            name: 'includeBinary',
            type: 'boolean',
            default: true,
            description: 'Whether to include binary data from input',
          },
        ],
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return this.processAllItems(this, async (item, itemIndex) => {
      const keepOnlySet = this.getNodeParameter('keepOnlySet', itemIndex) as boolean
      const values = this.getNodeParameter('values', itemIndex, {}) as any
      const options = this.getNodeParameter('options', itemIndex, {}) as any
      
      // Start with existing item or empty object
      let newItem: IDataObject = keepOnlySet ? {} : { ...item }
      
      // Process each value type
      const valueTypes = ['string', 'number', 'boolean', 'json']
      
      for (const valueType of valueTypes) {
        if (values[valueType]) {
          for (const field of values[valueType]) {
            if (!field.name) continue
            
            let value = field.value
            
            // Evaluate expressions
            value = this.evaluateParameter(this, value, itemIndex, item)
            
            // Type-specific processing
            switch (valueType) {
              case 'number':
                if (options.parseNumbers && typeof value === 'string') {
                  const parsed = parseFloat(value)
                  if (!isNaN(parsed)) {
                    value = parsed
                  }
                }
                break
              case 'json':
                if (typeof value === 'string') {
                  try {
                    value = JSON.parse(value)
                  } catch {
                    // Keep as string if not valid JSON
                  }
                }
                break
            }
            
            // Set the value
            if (options.dotNotation !== false && field.name.includes('.')) {
              // Handle dot notation
              this.setValueByPath(newItem, field.name, value)
            } else {
              // Direct assignment
              newItem[field.name] = value
            }
          }
        }
      }
      
      // Handle binary data
      if (!keepOnlySet && options.includeBinary !== false && item._binary) {
        newItem._binary = item._binary
      }
      
      return newItem
    })
  }
}