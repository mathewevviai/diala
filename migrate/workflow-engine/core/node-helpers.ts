/**
 * Node Helper Functions
 * Utility functions for working with nodes and their data
 */

import {
  INode,
  INodeParameters,
  NodeParameterValue,
  INodeType,
  INodeTypeDescription,
  INodeProperties,
  INodeExecutionData,
  IDataObject,
  IRunData,
  ITaskData,
  IConnection
} from './workflow-executor';

/**
 * Get node parameters with defaults applied
 */
export function getNodeParameters(
  nodeProperties: INodeProperties[],
  nodeParameters: INodeParameters,
  applyDefaults = true
): INodeParameters {
  const parameters: INodeParameters = {};

  for (const property of nodeProperties) {
    const parameterName = property.name;
    let parameterValue = nodeParameters[parameterName];

    // Apply default if parameter is not set
    if (parameterValue === undefined && applyDefaults && property.default !== undefined) {
      parameterValue = property.default;
    }

    if (parameterValue !== undefined) {
      parameters[parameterName] = parameterValue;
    }
  }

  return parameters;
}

/**
 * Check if a parameter should be displayed based on display options
 */
export function displayParameter(
  nodeParameters: INodeParameters,
  parameter: INodeProperties
): boolean {
  if (!parameter.displayOptions) {
    return true;
  }

  const { show, hide } = parameter.displayOptions;

  // Check show conditions
  if (show) {
    for (const [propertyName, expectedValues] of Object.entries(show)) {
      const actualValue = nodeParameters[propertyName];
      if (!expectedValues.includes(actualValue as NodeParameterValue)) {
        return false;
      }
    }
  }

  // Check hide conditions
  if (hide) {
    for (const [propertyName, expectedValues] of Object.entries(hide)) {
      const actualValue = nodeParameters[propertyName];
      if (expectedValues.includes(actualValue as NodeParameterValue)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get node output data from run data
 */
export function getNodeOutputData(
  runData: IRunData,
  nodeName: string,
  outputIndex = 0,
  runIndex = 0
): INodeExecutionData[] | null {
  const nodeRunData = runData[nodeName];
  if (!nodeRunData || !nodeRunData[runIndex]) {
    return null;
  }

  const taskData = nodeRunData[runIndex];
  if (!taskData.data || !taskData.data.main) {
    return null;
  }

  return taskData.data.main[outputIndex] || null;
}

/**
 * Merge node execution data arrays
 */
export function mergeNodeExecutionData(
  data1: INodeExecutionData[],
  data2: INodeExecutionData[]
): INodeExecutionData[] {
  const merged: INodeExecutionData[] = [];
  const maxLength = Math.max(data1.length, data2.length);

  for (let i = 0; i < maxLength; i++) {
    const item1 = data1[i];
    const item2 = data2[i];

    if (item1 && item2) {
      // Merge both items
      merged.push({
        json: { ...item1.json, ...item2.json },
        binary: { ...item1.binary, ...item2.binary },
        pairedItem: item1.pairedItem || item2.pairedItem
      });
    } else if (item1) {
      merged.push(item1);
    } else if (item2) {
      merged.push(item2);
    }
  }

  return merged;
}

/**
 * Create empty task data
 */
export function createEmptyTaskData(): ITaskData {
  return {
    startTime: Date.now(),
    executionTime: 0,
    data: {
      main: [[]]
    }
  };
}

/**
 * Get all node connection types
 */
export function getNodeConnectionTypes(node: INodeTypeDescription): string[] {
  const types: string[] = ['main'];
  
  // Check for additional output types
  if (Array.isArray(node.outputs)) {
    for (const output of node.outputs) {
      if (typeof output === 'object' && output.type && output.type !== 'main') {
        types.push(output.type);
      }
    }
  }

  return types;
}

/**
 * Check if node has input of specific type
 */
export function nodeHasInputOfType(
  node: INodeTypeDescription,
  connectionType: string
): boolean {
  if (connectionType === 'main') {
    return true; // All nodes have main input
  }

  if (Array.isArray(node.inputs)) {
    return node.inputs.some(input => 
      typeof input === 'object' && input.type === connectionType
    );
  }

  return false;
}

/**
 * Get paired item information
 */
export function getPairedItem(
  item: INodeExecutionData,
  itemIndex: number
): { item: number; input?: number } {
  if (item.pairedItem) {
    if (Array.isArray(item.pairedItem)) {
      return item.pairedItem[0];
    }
    return item.pairedItem;
  }

  return { item: itemIndex };
}

/**
 * Add execution data to item
 */
export function addExecutionDataToItem(
  item: INodeExecutionData,
  executionData: IDataObject
): INodeExecutionData {
  return {
    ...item,
    json: {
      ...item.json,
      _executionData: executionData
    }
  };
}

/**
 * Remove execution data from item
 */
export function removeExecutionDataFromItem(
  item: INodeExecutionData
): INodeExecutionData {
  const { _executionData, ...json } = item.json;
  return {
    ...item,
    json
  };
}

/**
 * Check if node is a trigger node
 */
export function isTriggerNode(nodeType: INodeType): boolean {
  return !!nodeType.description.trigger || !!nodeType.trigger;
}

/**
 * Check if node is a poll node
 */
export function isPollNode(nodeType: INodeType): boolean {
  return !!nodeType.description.poll || !!nodeType.poll;
}

/**
 * Check if node is a webhook node
 */
export function isWebhookNode(nodeType: INodeType): boolean {
  return nodeType.description.name.toLowerCase().includes('webhook');
}

/**
 * Get node input connections count
 */
export function getNodeInputConnectionsCount(
  node: INodeTypeDescription,
  connectionType = 'main'
): number {
  if (typeof node.inputs === 'string') {
    return 0; // Dynamic inputs
  }

  if (Array.isArray(node.inputs)) {
    return node.inputs.filter(input => {
      if (typeof input === 'string') {
        return input === connectionType;
      }
      return input.type === connectionType;
    }).length;
  }

  return 1; // Default to 1 main input
}

/**
 * Get node output connections count
 */
export function getNodeOutputConnectionsCount(
  node: INodeTypeDescription,
  connectionType = 'main'
): number {
  if (typeof node.outputs === 'string') {
    return 0; // Dynamic outputs
  }

  if (Array.isArray(node.outputs)) {
    return node.outputs.filter(output => {
      if (typeof output === 'string') {
        return output === connectionType;
      }
      return output.type === connectionType;
    }).length;
  }

  return 1; // Default to 1 main output
}

/**
 * Validate node connections
 */
export function validateNodeConnections(
  node: INode,
  nodeType: INodeTypeDescription,
  incomingConnections: IConnection[],
  outgoingConnections: IConnection[]
): string[] {
  const errors: string[] = [];

  // Validate input connections
  const maxInputs = getNodeInputConnectionsCount(nodeType);
  if (maxInputs > 0 && incomingConnections.length > maxInputs) {
    errors.push(`Node "${node.name}" has too many input connections`);
  }

  // Validate output connections
  const maxOutputs = getNodeOutputConnectionsCount(nodeType);
  if (maxOutputs > 0 && outgoingConnections.length > maxOutputs) {
    errors.push(`Node "${node.name}" has too many output connections`);
  }

  return errors;
}

/**
 * Get context data for node execution
 */
export function getContextData(
  runData: IRunData,
  nodeName: string,
  key: string
): any {
  // This would retrieve context data stored during execution
  // Simplified for this implementation
  return null;
}

/**
 * Set context data for node execution
 */
export function setContextData(
  runData: IRunData,
  nodeName: string,
  key: string,
  value: any
): void {
  // This would store context data during execution
  // Simplified for this implementation
}

/**
 * Create error execution data
 */
export function createErrorExecutionData(
  error: Error,
  itemIndex?: number
): INodeExecutionData {
  return {
    json: {
      error: error.message,
      errorType: error.name,
      errorStack: error.stack,
      itemIndex
    },
    error
  };
}

/**
 * Check if execution data contains errors
 */
export function hasExecutionErrors(executionData: INodeExecutionData[]): boolean {
  return executionData.some(item => !!item.error);
}

/**
 * Filter out error items from execution data
 */
export function filterOutErrors(executionData: INodeExecutionData[]): INodeExecutionData[] {
  return executionData.filter(item => !item.error);
}

/**
 * Get only error items from execution data
 */
export function getOnlyErrors(executionData: INodeExecutionData[]): INodeExecutionData[] {
  return executionData.filter(item => !!item.error);
}

/**
 * Convert simple data to node execution data format
 */
export function convertToNodeExecutionData(data: any[]): INodeExecutionData[] {
  return data.map(item => {
    if (typeof item === 'object' && 'json' in item) {
      return item as INodeExecutionData;
    }
    return { json: item };
  });
}

/**
 * Flatten node execution data to simple array
 */
export function flattenNodeExecutionData(data: INodeExecutionData[][]): INodeExecutionData[] {
  return data.reduce((acc, curr) => acc.concat(curr), []);
}

/**
 * Group items by a specific field
 */
export function groupItemsByField(
  items: INodeExecutionData[],
  fieldName: string
): { [key: string]: INodeExecutionData[] } {
  const groups: { [key: string]: INodeExecutionData[] } = {};

  for (const item of items) {
    const key = String(item.json[fieldName] || 'undefined');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups;
}

/**
 * Split items into batches
 */
export function batchItems(
  items: INodeExecutionData[],
  batchSize: number
): INodeExecutionData[][] {
  const batches: INodeExecutionData[][] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Deep copy node execution data
 */
export function deepCopyNodeExecutionData(
  data: INodeExecutionData[]
): INodeExecutionData[] {
  return JSON.parse(JSON.stringify(data));
}