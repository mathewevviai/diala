/**
 * If/Conditional node with advanced logic support
 */

import { BaseNode } from './BaseNode'
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeTypeDescription,
  IDataObject
} from '../types'
import { ExpressionParser } from '../core/ExpressionParser'

export class IfNode extends BaseNode {
  description: INodeTypeDescription = {
    displayName: 'If',
    name: 'if',
    icon: 'code-branch',
    group: ['transform'],
    version: 1,
    description: 'Splits data based on conditions',
    defaults: {
      name: 'If',
    },
    inputs: ['main'],
    outputs: ['main', 'main'],
    outputNames: ['True', 'False'],
    properties: [
      {
        displayName: 'Conditions',
        name: 'conditions',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'condition',
            displayName: 'Condition',
            values: [
              {
                displayName: 'Value 1',
                name: 'value1',
                type: 'string',
                default: '',
                description: 'First value to compare',
              },
              {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                  { name: 'Equals', value: 'equals' },
                  { name: 'Not Equals', value: 'notEquals' },
                  { name: 'Contains', value: 'contains' },
                  { name: 'Not Contains', value: 'notContains' },
                  { name: 'Starts With', value: 'startsWith' },
                  { name: 'Ends With', value: 'endsWith' },
                  { name: 'Greater Than', value: 'gt' },
                  { name: 'Less Than', value: 'lt' },
                  { name: 'Greater Than or Equal', value: 'gte' },
                  { name: 'Less Than or Equal', value: 'lte' },
                  { name: 'Is Empty', value: 'isEmpty' },
                  { name: 'Is Not Empty', value: 'isNotEmpty' },
                  { name: 'Regex Match', value: 'regex' },
                  { name: 'Is True', value: 'isTrue' },
                  { name: 'Is False', value: 'isFalse' },
                  { name: 'Is Null', value: 'isNull' },
                  { name: 'Is Not Null', value: 'isNotNull' },
                ],
                default: 'equals',
              },
              {
                displayName: 'Value 2',
                name: 'value2',
                type: 'string',
                displayOptions: {
                  hide: {
                    operation: [
                      'isEmpty',
                      'isNotEmpty',
                      'isTrue',
                      'isFalse',
                      'isNull',
                      'isNotNull',
                    ],
                  },
                },
                default: '',
                description: 'Second value to compare',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Combine Conditions',
        name: 'combineConditions',
        type: 'options',
        options: [
          { name: 'AND', value: 'and', description: 'All conditions must be true' },
          { name: 'OR', value: 'or', description: 'Any condition must be true' },
        ],
        default: 'and',
        description: 'How to combine multiple conditions',
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const trueItems: IDataObject[] = []
    const falseItems: IDataObject[] = []

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex]
      const params = this.getResolvedNodeParameters(this, itemIndex, item)
      
      const conditionMet = this.evaluateConditions(
        params.conditions?.condition || [],
        params.combineConditions as string,
        item,
        itemIndex
      )

      if (conditionMet) {
        trueItems.push(item)
      } else {
        falseItems.push(item)
      }
    }

    return [
      trueItems.map(item => ({ json: item })),
      falseItems.map(item => ({ json: item }))
    ]
  }

  private evaluateConditions(
    conditions: any[],
    combineMode: string,
    item: IDataObject,
    itemIndex: number
  ): boolean {
    if (conditions.length === 0) {
      return true
    }

    const results = conditions.map(condition => 
      this.evaluateCondition(condition, item, itemIndex)
    )

    if (combineMode === 'and') {
      return results.every(result => result === true)
    } else {
      return results.some(result => result === true)
    }
  }

  private evaluateCondition(
    condition: any,
    item: IDataObject,
    itemIndex: number
  ): boolean {
    const value1 = this.evaluateParameter(this, condition.value1, itemIndex, item)
    const value2 = condition.value2 !== undefined 
      ? this.evaluateParameter(this, condition.value2, itemIndex, item)
      : undefined
    const operation = condition.operation

    switch (operation) {
      case 'equals':
        return value1 == value2
      case 'notEquals':
        return value1 != value2
      case 'contains':
        return String(value1).includes(String(value2))
      case 'notContains':
        return !String(value1).includes(String(value2))
      case 'startsWith':
        return String(value1).startsWith(String(value2))
      case 'endsWith':
        return String(value1).endsWith(String(value2))
      case 'gt':
        return Number(value1) > Number(value2)
      case 'lt':
        return Number(value1) < Number(value2)
      case 'gte':
        return Number(value1) >= Number(value2)
      case 'lte':
        return Number(value1) <= Number(value2)
      case 'isEmpty':
        return this.isEmpty(value1)
      case 'isNotEmpty':
        return !this.isEmpty(value1)
      case 'regex':
        try {
          const regex = new RegExp(String(value2))
          return regex.test(String(value1))
        } catch {
          return false
        }
      case 'isTrue':
        return value1 === true || value1 === 'true' || value1 === 1
      case 'isFalse':
        return value1 === false || value1 === 'false' || value1 === 0
      case 'isNull':
        return value1 === null || value1 === undefined
      case 'isNotNull':
        return value1 !== null && value1 !== undefined
      default:
        return false
    }
  }

  private isEmpty(value: any): boolean {
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