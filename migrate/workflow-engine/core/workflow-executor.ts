/**
 * Simplified Workflow Execution Engine
 * Extracted and adapted from n8n's core workflow execution logic
 */

import { EventEmitter } from 'events';

export interface INode {
  name: string;
  type: string;
  typeVersion?: number;
  parameters: INodeParameters;
  disabled?: boolean;
  position: [number, number];
}

export interface INodeParameters {
  [key: string]: NodeParameterValue | INodeParameters | NodeParameterValue[] | INodeParameters[];
}

export type NodeParameterValue = string | number | boolean | null | undefined;

export interface IConnection {
  node: string;
  type: NodeConnectionType;
  index: number;
}

export type NodeConnectionType = 'main';

export interface IConnections {
  [sourceNode: string]: {
    [outputType: string]: IConnection[][];
  };
}

export interface INodeExecutionData {
  json: IDataObject;
  binary?: IBinaryKeyData;
  error?: Error;
  pairedItem?: IPairedItemData | IPairedItemData[];
}

export interface IDataObject {
  [key: string]: any;
}

export interface IBinaryKeyData {
  [key: string]: IBinaryData;
}

export interface IBinaryData {
  data: string;
  mimeType: string;
  fileName?: string;
  fileExtension?: string;
}

export interface IPairedItemData {
  item: number;
  input?: number;
}

export interface IExecuteData {
  node: INode;
  data: ITaskDataConnections;
  source: ITaskDataConnectionsSource | null;
}

export interface ITaskDataConnections {
  [type: string]: INodeExecutionData[][];
}

export interface ITaskDataConnectionsSource {
  [type: string]: ISourceData[];
}

export interface ISourceData {
  previousNode: string;
  previousNodeOutput?: number;
  previousNodeRun?: number;
}

export interface IRunExecutionData {
  startData?: {
    destinationNode?: string;
    runNodeFilter?: string[];
  };
  resultData: {
    runData: IRunData;
    pinData?: IPinData;
  };
  executionData?: {
    contextData: IContextObject;
    nodeExecutionStack: IExecuteData[];
    metadata: { [nodeName: string]: ITaskMetadata[] };
    waitingExecution: IWaitingForExecution;
    waitingExecutionSource: IWaitingForExecutionSource;
  };
}

export interface IRunData {
  [nodeName: string]: ITaskData[];
}

export interface ITaskData {
  startTime: number;
  executionTime: number;
  data?: ITaskDataConnections;
  error?: Error;
  source?: ITaskDataConnectionsSource;
  metadata?: ITaskMetadata;
}

export interface ITaskMetadata {
  [key: string]: any;
}

export interface IPinData {
  [nodeName: string]: INodeExecutionData[];
}

export interface IContextObject {
  [key: string]: any;
}

export interface IWaitingForExecution {
  [nodeName: string]: {
    [runIndex: string]: ITaskDataConnections;
  };
}

export interface IWaitingForExecutionSource {
  [nodeName: string]: {
    [runIndex: string]: ITaskDataConnectionsSource;
  };
}

export interface IWorkflowBase {
  id?: string;
  name?: string;
  nodes: INode[];
  connections: IConnections;
  settings?: IWorkflowSettings;
  staticData?: IDataObject;
  pinData?: IPinData;
}

export interface IWorkflowSettings {
  [key: string]: any;
}

export interface INodeType {
  description: INodeTypeDescription;
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  trigger?(this: ITriggerFunctions): Promise<ITriggerResponse | undefined>;
  poll?(this: IPollFunctions): Promise<INodeExecutionData[][] | null>;
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  version: number;
  description?: string;
  inputs: string[];
  outputs: string[];
  properties: INodeProperties[];
  credentials?: INodeCredentialDescription[];
  maxNodes?: number;
  subtitle?: string;
  defaults?: INodePropertyOptions;
  trigger?: () => Promise<ITriggerResponse | undefined>;
  poll?: () => Promise<INodeExecutionData[][] | null>;
}

export interface INodeProperties {
  name: string;
  displayName: string;
  type: string;
  default?: any;
  description?: string;
  required?: boolean;
  displayOptions?: {
    show?: { [key: string]: NodeParameterValue[] };
    hide?: { [key: string]: NodeParameterValue[] };
  };
  options?: INodePropertyOptions[];
}

export interface INodePropertyOptions {
  name: string;
  value: string | number;
  description?: string;
}

export interface INodeCredentialDescription {
  name: string;
  required?: boolean;
  displayOptions?: {
    show?: { [key: string]: NodeParameterValue[] };
    hide?: { [key: string]: NodeParameterValue[] };
  };
}

export interface IExecuteFunctions {
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData[];
  getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): any;
  getWorkflowStaticData(type: string): IDataObject;
  helpers: {
    returnJsonArray(jsonData: IDataObject[]): INodeExecutionData[];
  };
}

export interface ITriggerFunctions extends IExecuteFunctions {
  emit(eventName: string, data?: any[]): void;
}

export interface IPollFunctions extends IExecuteFunctions {
  // Poll specific functions
}

export interface ITriggerResponse {
  closeFunction?: () => Promise<void>;
  manualTriggerFunction?: () => Promise<void>;
}

export interface INodeTypes {
  getByNameAndVersion(nodeType: string, version?: number): INodeType;
}

export type WorkflowExecuteMode = 'manual' | 'trigger' | 'integrated' | 'webhook' | 'internal';

/**
 * Core Workflow Execution Class
 */
export class WorkflowExecutor extends EventEmitter {
  private runExecutionData: IRunExecutionData;
  private nodeTypes: INodeTypes;
  private mode: WorkflowExecuteMode;
  private executionId: string;
  private abortController: AbortController;

  constructor(
    nodeTypes: INodeTypes,
    mode: WorkflowExecuteMode = 'manual',
    executionId?: string
  ) {
    super();
    this.nodeTypes = nodeTypes;
    this.mode = mode;
    this.executionId = executionId || this.generateExecutionId();
    this.abortController = new AbortController();
    this.runExecutionData = this.initializeRunExecutionData();
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: IWorkflowBase,
    startNode?: INode,
    destinationNode?: string,
    pinData?: IPinData
  ): Promise<IRunExecutionData> {
    try {
      // Initialize execution data
      this.runExecutionData.resultData.pinData = pinData;
      
      // Find start node if not provided
      if (!startNode) {
        startNode = this.findStartNode(workflow, destinationNode);
      }

      if (!startNode) {
        throw new Error('No start node found');
      }

      // Set up node filter if destination is specified
      let runNodeFilter: string[] | undefined;
      if (destinationNode) {
        runNodeFilter = this.getParentNodes(workflow, destinationNode);
        runNodeFilter.push(destinationNode);
      }

      // Initialize execution stack
      const nodeExecutionStack: IExecuteData[] = [{
        node: startNode,
        data: { main: [[{ json: {} }]] },
        source: null
      }];

      this.runExecutionData.startData = { destinationNode, runNodeFilter };
      this.runExecutionData.executionData!.nodeExecutionStack = nodeExecutionStack;

      // Process execution
      await this.processRunExecutionData(workflow);

      return this.runExecutionData;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Main execution loop
   */
  private async processRunExecutionData(workflow: IWorkflowBase): Promise<void> {
    const executionData = this.runExecutionData.executionData!;
    
    while (executionData.nodeExecutionStack.length !== 0) {
      if (this.abortController.signal.aborted) {
        throw new Error('Workflow execution aborted');
      }

      // Get the next node to execute
      const executeData = executionData.nodeExecutionStack.shift()!;
      const node = executeData.node;

      // Skip disabled nodes
      if (node.disabled) {
        continue;
      }

      // Check if node should be executed
      if (this.runExecutionData.startData?.runNodeFilter?.length) {
        if (!this.runExecutionData.startData.runNodeFilter.includes(node.name)) {
          continue;
        }
      }

      try {
        // Execute the node
        const nodeOutput = await this.executeNode(
          node,
          executeData.data,
          workflow,
          executeData.source
        );

        // Process node output
        if (nodeOutput) {
          await this.processNodeOutput(
            workflow,
            node,
            nodeOutput,
            executionData.nodeExecutionStack
          );
        }
      } catch (error) {
        // Handle node execution error
        this.handleNodeExecutionError(node, error as Error);
      }
    }

    // Handle any waiting executions
    await this.processWaitingExecutions(workflow);
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: INode,
    inputData: ITaskDataConnections,
    workflow: IWorkflowBase,
    source: ITaskDataConnectionsSource | null
  ): Promise<INodeExecutionData[][] | null> {
    const startTime = Date.now();
    
    try {
      // Get node type
      const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
      if (!nodeType) {
        throw new Error(`Node type "${node.type}" is not known`);
      }

      // Create execution context
      const executeFunctions = this.createExecuteFunctions(
        node,
        inputData,
        workflow
      );

      // Execute node
      let output: INodeExecutionData[][] | null = null;
      if (nodeType.execute) {
        output = await nodeType.execute.call(executeFunctions);
      }

      // Record execution data
      const executionTime = Date.now() - startTime;
      this.recordNodeExecution(node, inputData, output, executionTime, source);

      // Emit execution event
      this.emit('nodeExecuted', {
        nodeName: node.name,
        executionTime,
        itemsProcessed: output ? output[0]?.length || 0 : 0
      });

      return output;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordNodeExecution(node, inputData, null, executionTime, source, error as Error);
      throw error;
    }
  }

  /**
   * Create execution functions for node
   */
  private createExecuteFunctions(
    node: INode,
    inputData: ITaskDataConnections,
    workflow: IWorkflowBase
  ): IExecuteFunctions {
    const self = this;
    
    return {
      getInputData(inputIndex = 0): INodeExecutionData[] {
        return inputData.main?.[inputIndex] || [];
      },

      getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): any {
        const parameter = node.parameters[parameterName];
        if (parameter === undefined) {
          return fallbackValue;
        }
        
        // Handle expression evaluation here (simplified)
        if (typeof parameter === 'string' && parameter.startsWith('=')) {
          // This would normally evaluate the expression
          return parameter.substring(1);
        }
        
        return parameter;
      },

      getWorkflowStaticData(type: string): IDataObject {
        if (!workflow.staticData) {
          workflow.staticData = {};
        }
        
        const key = type === 'global' ? 'global' : `node:${node.name}`;
        if (!workflow.staticData[key]) {
          workflow.staticData[key] = {};
        }
        
        return workflow.staticData[key] as IDataObject;
      },

      helpers: {
        returnJsonArray(jsonData: IDataObject[]): INodeExecutionData[] {
          return jsonData.map(json => ({ json }));
        }
      }
    };
  }

  /**
   * Process node output and add connected nodes to execution stack
   */
  private async processNodeOutput(
    workflow: IWorkflowBase,
    node: INode,
    nodeOutput: INodeExecutionData[][],
    nodeExecutionStack: IExecuteData[]
  ): Promise<void> {
    // Get connections from this node
    const nodeConnections = workflow.connections[node.name];
    if (!nodeConnections) {
      return;
    }

    // Process each output
    for (const [outputIndex, connections] of Object.entries(nodeConnections.main || [])) {
      const outputData = nodeOutput[parseInt(outputIndex)] || [];
      
      // Process each connection
      for (const connection of connections) {
        const targetNode = workflow.nodes.find(n => n.name === connection.node);
        if (!targetNode || targetNode.disabled) {
          continue;
        }

        // Add to execution stack
        const executeData: IExecuteData = {
          node: targetNode,
          data: {
            main: [outputData]
          },
          source: {
            main: [{
              previousNode: node.name,
              previousNodeOutput: parseInt(outputIndex)
            }]
          }
        };

        nodeExecutionStack.push(executeData);
      }
    }
  }

  /**
   * Record node execution data
   */
  private recordNodeExecution(
    node: INode,
    inputData: ITaskDataConnections,
    outputData: INodeExecutionData[][] | null,
    executionTime: number,
    source: ITaskDataConnectionsSource | null,
    error?: Error
  ): void {
    const runData = this.runExecutionData.resultData.runData;
    
    if (!runData[node.name]) {
      runData[node.name] = [];
    }

    const taskData: ITaskData = {
      startTime: Date.now() - executionTime,
      executionTime,
      source
    };

    if (outputData) {
      taskData.data = { main: outputData };
    }

    if (error) {
      taskData.error = error;
    }

    runData[node.name].push(taskData);
  }

  /**
   * Handle node execution errors
   */
  private handleNodeExecutionError(node: INode, error: Error): void {
    this.emit('nodeExecutionError', {
      nodeName: node.name,
      error: error.message
    });
  }

  /**
   * Process any waiting executions
   */
  private async processWaitingExecutions(workflow: IWorkflowBase): Promise<void> {
    // This would handle nodes waiting for multiple inputs
    // Simplified for this implementation
  }

  /**
   * Find the start node for workflow execution
   */
  private findStartNode(workflow: IWorkflowBase, destinationNode?: string): INode | undefined {
    // If destination specified, find highest parent
    if (destinationNode) {
      const parentNodes = this.getHighestParentNodes(workflow, destinationNode);
      if (parentNodes.length > 0) {
        return workflow.nodes.find(n => n.name === parentNodes[0]);
      }
    }

    // Find trigger/poll nodes
    const triggerNodes = workflow.nodes.filter(node => {
      const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
      return nodeType && (nodeType.description.trigger || nodeType.description.poll);
    });

    if (triggerNodes.length > 0) {
      return triggerNodes[0];
    }

    // Return first node
    return workflow.nodes[0];
  }

  /**
   * Get parent nodes of a given node
   */
  private getParentNodes(workflow: IWorkflowBase, nodeName: string): string[] {
    const parents: string[] = [];
    const connections = this.getConnectionsByDestination(workflow.connections);
    
    const nodeConnections = connections[nodeName];
    if (!nodeConnections) {
      return parents;
    }

    for (const connectionType of Object.values(nodeConnections)) {
      for (const connectionList of connectionType) {
        if (connectionList) {
          for (const connection of connectionList) {
            if (!parents.includes(connection.node)) {
              parents.push(connection.node);
              // Recursively get parents
              const grandParents = this.getParentNodes(workflow, connection.node);
              grandParents.forEach(gp => {
                if (!parents.includes(gp)) {
                  parents.push(gp);
                }
              });
            }
          }
        }
      }
    }

    return parents;
  }

  /**
   * Get highest parent nodes (nodes with no parents)
   */
  private getHighestParentNodes(workflow: IWorkflowBase, nodeName: string): string[] {
    const parents = this.getParentNodes(workflow, nodeName);
    const highestParents: string[] = [];
    
    for (const parent of parents) {
      const parentOfParent = this.getParentNodes(workflow, parent);
      if (parentOfParent.length === 0) {
        highestParents.push(parent);
      }
    }

    return highestParents.length > 0 ? highestParents : [nodeName];
  }

  /**
   * Transform connections by destination
   */
  private getConnectionsByDestination(connections: IConnections): IConnections {
    const connectionsByDestination: IConnections = {};
    
    for (const [sourceNode, sourceConnections] of Object.entries(connections)) {
      for (const [type, typeConnections] of Object.entries(sourceConnections)) {
        for (const [outputIndex, outputConnections] of typeConnections.entries()) {
          if (!outputConnections) continue;
          
          for (const connection of outputConnections) {
            if (!connectionsByDestination[connection.node]) {
              connectionsByDestination[connection.node] = {};
            }
            if (!connectionsByDestination[connection.node][type]) {
              connectionsByDestination[connection.node][type] = [];
            }
            if (!connectionsByDestination[connection.node][type][connection.index]) {
              connectionsByDestination[connection.node][type][connection.index] = [];
            }
            
            connectionsByDestination[connection.node][type][connection.index].push({
              node: sourceNode,
              type: type as NodeConnectionType,
              index: outputIndex
            });
          }
        }
      }
    }
    
    return connectionsByDestination;
  }

  /**
   * Initialize run execution data
   */
  private initializeRunExecutionData(): IRunExecutionData {
    return {
      startData: {},
      resultData: {
        runData: {},
        pinData: {}
      },
      executionData: {
        contextData: {},
        nodeExecutionStack: [],
        metadata: {},
        waitingExecution: {},
        waitingExecutionSource: {}
      }
    };
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Abort workflow execution
   */
  abort(): void {
    this.abortController.abort();
    this.emit('executionAborted', { executionId: this.executionId });
  }

  /**
   * Get execution ID
   */
  getExecutionId(): string {
    return this.executionId;
  }

  /**
   * Get current execution data
   */
  getExecutionData(): IRunExecutionData {
    return this.runExecutionData;
  }
}