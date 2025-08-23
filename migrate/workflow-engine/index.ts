/**
 * Workflow Engine - Main Entry Point
 * Export all core components and types
 */

// Core executor and types
export * from './core/workflow-executor';

// Expression evaluation
export * from './core/expression-evaluator';

// Node helper functions
export * as NodeHelpers from './core/node-helpers';

// Re-export commonly used types for convenience
export type {
  INode,
  INodeParameters,
  NodeParameterValue,
  IConnection,
  IConnections,
  INodeExecutionData,
  IDataObject,
  IExecuteData,
  IRunExecutionData,
  IRunData,
  ITaskData,
  IPinData,
  IWorkflowBase,
  INodeType,
  INodeTypeDescription,
  INodeProperties,
  IExecuteFunctions,
  ITriggerFunctions,
  IPollFunctions,
  INodeTypes,
  WorkflowExecuteMode
} from './core/workflow-executor';

// Utility function to create a basic workflow
export function createWorkflow(
  name: string,
  nodes: INode[],
  connections: IConnections
): IWorkflowBase {
  return {
    id: `workflow-${Date.now()}`,
    name,
    nodes,
    connections,
    settings: {},
    staticData: {}
  };
}

// Utility function to create a basic node
export function createNode(
  name: string,
  type: string,
  parameters: INodeParameters = {},
  position: [number, number] = [0, 0]
): INode {
  return {
    name,
    type,
    parameters,
    position,
    typeVersion: 1
  };
}

// Utility function to create a connection
export function createConnection(
  sourceNode: string,
  targetNode: string,
  sourceOutput = 0,
  targetInput = 0,
  connectionType: 'main' = 'main'
): IConnections {
  return {
    [sourceNode]: {
      [connectionType]: [
        [{
          node: targetNode,
          type: connectionType,
          index: targetInput
        }]
      ]
    }
  };
}

// Merge multiple connection objects
export function mergeConnections(...connections: IConnections[]): IConnections {
  const merged: IConnections = {};
  
  for (const conn of connections) {
    for (const [sourceNode, sourceData] of Object.entries(conn)) {
      if (!merged[sourceNode]) {
        merged[sourceNode] = {};
      }
      
      for (const [connType, connData] of Object.entries(sourceData)) {
        if (!merged[sourceNode][connType]) {
          merged[sourceNode][connType] = [];
        }
        
        for (let i = 0; i < connData.length; i++) {
          if (!merged[sourceNode][connType][i]) {
            merged[sourceNode][connType][i] = [];
          }
          merged[sourceNode][connType][i].push(...(connData[i] || []));
        }
      }
    }
  }
  
  return merged;
}