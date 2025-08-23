# N8N Comprehensive Functionality Extraction

This document provides a comprehensive extraction of n8n's core functionality, organized by feature area for implementation in our voice agent workflow builder.

## 1. Complete Workflow Engine

### Core Workflow Class (`packages/workflow/src/workflow.ts`)

```typescript
export interface WorkflowParameters {
  id?: string;
  name?: string;
  nodes: INode[];
  connections: IConnections;
  active: boolean;
  nodeTypes: INodeTypes;
  staticData?: IDataObject;
  settings?: IWorkflowSettings;
  pinData?: IPinData;
}

export class Workflow {
  id: string;
  name: string | undefined;
  nodes: INodes = {};
  connectionsBySourceNode: IConnections;
  connectionsByDestinationNode: IConnections;
  nodeTypes: INodeTypes;
  expression: Expression;
  active: boolean;
  settings: IWorkflowSettings;
  timezone: string;
  staticData: IDataObject;
  testStaticData: IDataObject | undefined;
  pinData?: IPinData;

  // Key methods:
  getStaticData(type: string, node?: INode): IDataObject
  getHighestNode(nodeName: string, nodeConnectionIndex?: number, checkedNodes?: string[]): string[]
  getChildNodes(nodeName: string, type: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN' = NodeConnectionTypes.Main, depth = -1): string[]
  getParentNodes(nodeName: string, type: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN' = NodeConnectionTypes.Main, depth = -1): string[]
  getStartNode(destinationNode?: string): INode | undefined
  renameNode(currentName: string, newName: string): void
}
```

### Workflow Execution Engine (`packages/core/src/execution-engine/workflow-execute.ts`)

```typescript
export class WorkflowExecute {
  private status: ExecutionStatus = 'new';
  private readonly abortController = new AbortController();

  // Main execution methods
  run(
    workflow: Workflow,
    startNode?: INode,
    destinationNode?: string,
    pinData?: IPinData,
    triggerToStartFrom?: IWorkflowExecutionDataProcess['triggerToStartFrom']
  ): PCancelable<IRun>

  runPartialWorkflow(
    workflow: Workflow,
    runData: IRunData,
    startNodes: StartNodeData[],
    destinationNode?: string,
    pinData?: IPinData
  ): PCancelable<IRun>

  runPartialWorkflow2(
    workflow: Workflow,
    runData: IRunData,
    pinData: IPinData = {},
    dirtyNodeNames: string[] = [],
    destinationNodeName?: string,
    agentRequest?: AiAgentRequest
  ): PCancelable<IRun>

  // Node execution
  async runNode(
    workflow: Workflow,
    executionData: IExecuteData,
    runExecutionData: IRunExecutionData,
    runIndex: number,
    additionalData: IWorkflowExecuteAdditionalData,
    mode: WorkflowExecuteMode,
    abortSignal?: AbortSignal
  ): Promise<IRunNodeResponse>

  // State management
  checkReadyForExecution(workflow: Workflow, inputData: {}): IWorkflowIssues | null
  processSuccessExecution(startedAt: Date, workflow: Workflow, executionError?: ExecutionBaseError, closeFunction?: Promise<void>): Promise<IRun>
}
```

### Execution States & Modes

```typescript
type ExecutionStatus = 'new' | 'running' | 'waiting' | 'success' | 'error' | 'canceled';

type WorkflowExecuteMode = 
  | 'cli'
  | 'error'
  | 'integrated'
  | 'internal'
  | 'manual'
  | 'retry'
  | 'trigger'
  | 'webhook';

interface IRunExecutionData {
  startData?: IStartRunData;
  resultData: {
    runData: IRunData;
    pinData?: IPinData;
    lastNodeExecuted?: string;
    error?: ExecutionBaseError;
  };
  executionData?: {
    contextData: IDataObject;
    nodeExecutionStack: IExecuteData[];
    metadata: Record<string, ITaskMetadata[]>;
    waitingExecution: IWaitingForExecution;
    waitingExecutionSource: IWaitingForExecutionSource;
  };
  waitTill?: Date;
}
```

### Error Handling & Retry Logic

```typescript
// Retry configuration
if (executionData.node.retryOnFail === true) {
  maxTries = Math.min(5, Math.max(2, executionData.node.maxTries || 3));
  waitBetweenTries = Math.min(5000, Math.max(0, executionData.node.waitBetweenTries || 1000));
}

// Error handling strategies
if (executionData.node.continueOnFail === true || 
    ['continueRegularOutput', 'continueErrorOutput'].includes(executionData.node.onError || '')) {
  // Continue workflow execution
}
```

### Partial Execution Support

```typescript
// New partial execution flow with advanced features
const partialExecutionUtils = {
  DirectedGraph,
  findStartNodes,
  findSubgraph,
  findTriggerForPartialExecution,
  cleanRunData,
  recreateNodeExecutionStack,
  handleCycles,
  filterDisabledNodes,
  rewireGraph,
  getNextExecutionIndex
};
```

## 2. Advanced Node Features

### Node Interface Structure

```typescript
interface INode {
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  continueOnFail?: boolean;
  executeOnce?: boolean;
  onError?: 'continueErrorOutput' | 'continueRegularOutput' | 'stopWorkflow';
  parameters: INodeParameters;
  credentials?: INodeCredentials;
  webhookId?: string;
  pinData?: INodeExecutionData[];
  issues?: INodeIssues;
}

interface INodeType {
  description: INodeTypeDescription;
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  executeSingle?(this: IExecuteSingleFunctions): Promise<INodeExecutionData>;
  poll?(this: IPollFunctions): Promise<INodeExecutionData[][]>;
  trigger?(this: ITriggerFunctions): Promise<ITriggerResponse | undefined>;
  webhook?(this: IWebhookFunctions): Promise<IWebhookResponseData>;
  hooks?: {
    activate?: Array<(this: IActivationFunctions) => Promise<void>>;
    deactivate?: Array<(this: IDeactivationFunctions) => Promise<void>>;
  };
  methods?: {
    loadOptions?: ILoadOptionsFunctions;
    listSearch?: ILoadOptionsFunctions;
    credentialTest?: ICredentialTestFunctions;
  };
  supplyData?(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
```

### Node Lifecycle Hooks

```typescript
// Activation hooks (when workflow starts)
async activate(): Promise<void> {
  // Set up webhooks, start polling, initialize connections
}

// Deactivation hooks (when workflow stops)
async deactivate(): Promise<void> {
  // Clean up webhooks, stop polling, close connections
}

// Execution hooks
interface IExecuteFunctions {
  // Access to workflow data
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData[];
  getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): NodeParameterValueType;
  
  // Helper functions
  helpers: {
    prepareBinaryData: (binaryData: Buffer | Readable, filePath?: string, mimeType?: string) => Promise<IBinaryData>;
    getBinaryDataBuffer: (itemIndex: number, propertyName: string) => Promise<Buffer>;
    httpRequest: (requestOptions: IHttpRequestOptions) => Promise<any>;
    createDeferredPromise: <T = void>() => IDeferredPromise<T>;
    // ... many more
  };
  
  // Workflow context
  getWorkflow(): IWorkflowMetadata;
  getNode(): INode;
  getMode(): WorkflowExecuteMode;
  getExecutionId(): string;
  getTimezone(): string;
  getRestApiUrl(): string;
  
  // Send data methods
  sendMessageToUI(message: any): void;
  sendResponse(response: IExecuteResponsePromiseData): Promise<void>;
}
```

### Node Versioning System

```typescript
interface IVersionedNodeType {
  nodeVersions: {
    [key: number]: INodeType;
  };
  currentVersion: number;
  description: INodeTypeBaseDescription;
  
  // Version migration
  migrations?: {
    [key: string]: (node: INode) => void;
  };
}
```

### Resource Locator

```typescript
interface INodeParameterResourceLocator {
  __rl: true;
  mode: 'id' | 'name' | 'url' | 'list';
  value: string | number;
  cachedResultName?: string;
  cachedResultUrl?: string;
  __regex?: string;
}
```

### Dynamic Parameters & Display Conditions

```typescript
interface INodeProperties {
  displayName: string;
  name: string;
  type: NodePropertyTypes;
  default?: NodeParameterValueType;
  description?: string;
  hint?: string;
  
  // Display conditions
  displayOptions?: {
    show?: {
      [key: string]: NodeParameterValue[] | undefined;
    };
    hide?: {
      [key: string]: NodeParameterValue[] | undefined;
    };
  };
  
  // Dynamic options
  options?: INodePropertyOptions[] | INodePropertyCollection[];
  loadOptionsMethod?: string;
  loadOptionsDependsOn?: string[];
  
  // Fixed collections
  typeOptions?: {
    multipleValues?: boolean;
    multipleValueButtonText?: string;
    loadOptionsMethod?: string;
  };
}
```

## 3. Expression System

### Expression Engine (`packages/workflow/src/expression.ts`)

```typescript
export class Expression {
  constructor(private readonly workflow: Workflow) {}
  
  // Main resolution methods
  resolveSimpleParameterValue(
    parameterValue: NodeParameterValue,
    siblingParameters: INodeParameters,
    runExecutionData: IRunExecutionData | null,
    runIndex: number,
    itemIndex: number,
    activeNodeName: string,
    connectionInputData: INodeExecutionData[],
    mode: WorkflowExecuteMode,
    additionalKeys: IWorkflowDataProxyAdditionalKeys,
    executeData?: IExecuteData,
    returnObjectAsString = false,
    selfData = {},
    contextNodeName?: string
  ): NodeParameterValue | INodeParameters | NodeParameterValue[] | INodeParameters[]
  
  getParameterValue(
    parameterValue: NodeParameterValueType | INodeParameterResourceLocator,
    runExecutionData: IRunExecutionData | null,
    runIndex: number,
    itemIndex: number,
    activeNodeName: string,
    connectionInputData: INodeExecutionData[],
    mode: WorkflowExecuteMode,
    additionalKeys: IWorkflowDataProxyAdditionalKeys,
    executeData?: IExecuteData,
    returnObjectAsString = false,
    selfData = {},
    contextNodeName?: string
  ): NodeParameterValueType
}
```

### Built-in Variables & Methods

```typescript
// Available in expressions
const expressionContext = {
  // Workflow data access
  $json: {}, // Current item's JSON data
  $binary: {}, // Current item's binary data
  $node: {}, // Node data and parameters
  $items: (nodeName?: string, outputIndex?: number, runIndex?: number) => INodeExecutionData[],
  $item: (itemIndex: number, runIndex?: number) => INodeExecutionData,
  $input: {
    all: () => INodeExecutionData[][],
    first: () => INodeExecutionData | undefined,
    last: () => INodeExecutionData | undefined,
    item: (itemIndex: number) => INodeExecutionData
  },
  
  // Workflow metadata
  $workflow: {
    id: string,
    name: string,
    active: boolean
  },
  $execution: {
    id: string,
    mode: WorkflowExecuteMode,
    resumeUrl?: string,
    resumeFormUrl?: string,
    customData: IDataObject
  },
  $vars: IDataObject, // Workflow variables
  $env: IDataObject, // Environment variables
  
  // Time functions
  $now: DateTime,
  $today: DateTime,
  
  // Helper functions
  $jmespath: (data: any, path: string) => any,
  $if: (condition: boolean, valueTrue: any, valueFalse: any) => any,
  $min: (...args: number[]) => number,
  $max: (...args: number[]) => number,
  $runIndex: number,
  $itemIndex: number,
  
  // Extended functions
  DateTime,
  Duration,
  Interval,
  
  // Custom extensions
  extend,
  extendOptional
};
```

### Expression Extensions

```typescript
// String extensions
$string.capitalize()
$string.contains(searchString: string)
$string.endsWith(searchString: string)
$string.extractEmail()
$string.extractUrl()
$string.isEmpty()
$string.isEmail()
$string.isUrl()
$string.length()
$string.parseJson()
$string.removeMarkdown()
$string.replaceAll(find: string, replace: string)
$string.split(separator: string)
$string.startsWith(searchString: string)
$string.titleCase()
$string.toDate()
$string.toDateTime()
$string.toFloat()
$string.toInt()
$string.toLowerCase()
$string.toUpperCase()
$string.trim()

// Array extensions
$array.append(...items)
$array.compact()
$array.difference(array2)
$array.filter(fn)
$array.first()
$array.isEmpty()
$array.last()
$array.map(fn)
$array.pluck(key)
$array.randomItem()
$array.reduce(fn, initialValue)
$array.reverse()
$array.sort()
$array.sum()
$array.unique()

// Object extensions
$object.keys()
$object.values()
$object.isEmpty()
$object.hasField(field)
$object.removeField(field)
$object.removeFieldsContaining(str)
$object.keepFieldsContaining(str)
$object.compact()
$object.urlEncode()

// Date extensions
$date.beginningOf(unit)
$date.endOf(unit)
$date.extract(part)
$date.format(fmt)
$date.isBetween(date1, date2)
$date.isDst()
$date.isInLast(n, unit)
$date.isWeekend()
$date.minus(duration)
$date.plus(duration)
$date.toDateTime()
```

### JMESPath Integration

```typescript
// Full JMESPath support for complex queries
$jmespath(data, 'items[?price > `100`].{name: name, price: price}')
```

## 4. Data Handling

### Workflow Data Proxy (`packages/workflow/src/workflow-data-proxy.ts`)

```typescript
export class WorkflowDataProxy {
  constructor(
    private workflow: Workflow,
    runExecutionData: IRunExecutionData | null,
    private runIndex: number,
    private itemIndex: number,
    private activeNodeName: string,
    connectionInputData: INodeExecutionData[],
    private siblingParameters: INodeParameters,
    private mode: WorkflowExecuteMode,
    private additionalKeys: IWorkflowDataProxyAdditionalKeys,
    private executeData?: IExecuteData,
    private defaultReturnRunIndex = -1,
    private selfData: IDataObject = {},
    private contextNodeName: string = activeNodeName,
    private envProviderState?: EnvProviderState
  )

  // Data access methods
  getNodeExecutionData(nodeName: string, shortSyntax = false, outputIndex?: number, runIndex?: number): INodeExecutionData[]
  nodeParameterGetter(nodeName: string, resolveValue = true): ProxyHandler<INodeParameters>
  nodeContextGetter(nodeName: string): ProxyHandler<{}>
  
  // Paired item handling
  $getPairedItem(destinationNodeName: string, incomingSourceData: ISourceData | null, pairedItem: IPairedItemData): INodeExecutionData | null
}
```

### Binary Data Support

```typescript
interface IBinaryData {
  data: string; // Base64 encoded
  mimeType: string;
  fileType?: BinaryFileType;
  fileName?: string;
  directory?: string;
  fileExtension?: string;
  fileSize?: string;
  id?: string;
}

// Binary data helpers
interface IBinaryHelperFunctions {
  prepareBinaryData(binaryData: Buffer | Readable, filePath?: string, mimeType?: string): Promise<IBinaryData>;
  copyBinaryFile(filePath: string, fileName: string, mimeType?: string): Promise<IBinaryData>;
  getBinaryDataBuffer(itemIndex: number, propertyName: string): Promise<Buffer>;
  setBinaryDataBuffer(data: IBinaryData, binaryData: Buffer): Promise<IBinaryData>;
  binaryToString(body: Buffer, encoding?: string): string;
  getBinaryPath(binaryDataId: string): string;
  getBinaryStream(binaryDataId: string, chunkSize?: number): Promise<Readable>;
  getBinaryMetadata(binaryDataId: string): Promise<BinaryData.Metadata>;
}
```

### Data Transformation Utilities

```typescript
// Item normalization
function normalizeItems(items: INodeExecutionData | INodeExecutionData[]): INodeExecutionData[] {
  if (!Array.isArray(items)) {
    return [items];
  }
  return items;
}

// JSON parsing with fallback
function jsonParse(jsonString: string, options?: { fallbackValue?: any }): any

// Deep copy functionality
function deepCopy<T>(source: T): T

// Paired item support
interface IPairedItemData {
  item: number;
  input?: number;
  sourceOverwrite?: ISourceData;
}

// Data lineage tracking
interface ISourceData {
  previousNode: string;
  previousNodeOutput?: number;
  previousNodeRun?: number;
}
```

### Streaming Support

```typescript
interface INodeExecuteFunctions {
  // Stream handling
  helpers: {
    createReadStream(filePath: PathLike): Promise<Readable>;
    getStoragePath(): string;
    writeContentToFile(filePath: PathLike, content: string | Buffer, flag?: string): Promise<void>;
  };
}
```

## 5. UI Components

### Node Creator Component

```typescript
interface INodeCreatorState {
  selectedView: string;
  subcategory: string;
  searchFilter: string;
  nodes: INodeTypeDescription[];
  filteredNodes: INodeTypeDescription[];
}

// Node search functionality
const nodeSearch = {
  searchNodes: (searchTerm: string, nodes: INodeTypeDescription[]) => {
    // Fuzzy search implementation
    // Ranks by: exact match > starts with > contains
    // Considers: displayName, name, description, aliases
  },
  
  categorizeNodes: (nodes: INodeTypeDescription[]) => {
    // Group by category
    // Sort by popularity/usage
    // Handle subcategories
  }
};
```

### Parameter Input Components

```typescript
// Parameter types
type NodePropertyTypes = 
  | 'boolean'
  | 'collection'
  | 'color'
  | 'dateTime'
  | 'fixedCollection'
  | 'hidden'
  | 'json'
  | 'multiOptions'
  | 'notice'
  | 'number'
  | 'options'
  | 'string'
  | 'resourceLocator'
  | 'resourceMapper'
  | 'filter'
  | 'assignmentCollection';

// Dynamic parameter rendering
interface IParameterInputProps {
  parameter: INodeProperties;
  value: NodeParameterValueType;
  path: string;
  nodeValues: INodeParameters;
  isReadOnly: boolean;
  displayOptions: boolean;
  hideLabel: boolean;
  onValueChanged: (update: IUpdateInformation) => void;
}
```

### Expression Editor

```typescript
interface IExpressionEditorProps {
  value: string;
  path: string;
  isReadOnly: boolean;
  rows: number;
  
  // Features
  autocomplete: boolean;
  syntaxHighlighting: boolean;
  bracketMatching: boolean;
  
  // Data access
  resolvedValue: any;
  evaluationError?: Error;
}

// Expression autocomplete
const expressionAutocomplete = {
  // Variable suggestions
  getVariableSuggestions: (context: string) => ISuggestion[],
  
  // Method suggestions
  getMethodSuggestions: (object: any, partial: string) => ISuggestion[],
  
  // Node reference suggestions
  getNodeSuggestions: (workflow: IWorkflowData) => ISuggestion[]
};
```

### Run Data Display

```typescript
interface IRunDataProps {
  node: INode;
  runIndex: number;
  outputIndex: number;
  paneType: 'input' | 'output';
  
  // Display modes
  displayMode: 'table' | 'json' | 'binary' | 'html' | 'schema';
  
  // Features
  search: boolean;
  pagination: boolean;
  mapping: boolean;
}

// Data display utilities
const runDataUtils = {
  // Format data for display
  formatData: (data: INodeExecutionData[], displayMode: string) => any,
  
  // Search functionality
  searchData: (data: any[], searchTerm: string) => any[],
  
  // Schema generation
  generateSchema: (data: INodeExecutionData[]) => IDataSchema,
  
  // Data mapping hints
  getMappingHints: (sourceData: any, targetParameter: INodeProperties) => IMappingHint[]
};
```

### Sticky Notes

```typescript
interface IStickyNote {
  id: string;
  position: XYPosition;
  width: number;
  height: number;
  content: string;
  zIndex: number;
  color: number;
}
```

## 6. Workflow Features

### Sub-workflows

```typescript
interface IExecuteWorkflowInfo {
  code?: IWorkflowBase;
  id?: string;
}

// Sub-workflow execution
const subWorkflowExecute = {
  executeWorkflow: async (
    workflowInfo: IExecuteWorkflowInfo,
    additionalData: IWorkflowExecuteAdditionalData,
    options: {
      parentWorkflowId: string;
      parentWorkflowSettings?: IWorkflowSettings;
      inputData?: INodeExecutionData[];
    }
  ): Promise<IWorkflowExecutionData>
};
```

### Error Workflows

```typescript
interface IWorkflowSettings {
  errorWorkflow?: string;
  timezone?: string;
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  executionTimeout?: number;
  executionOrder?: 'v0' | 'v1';
}

// Error workflow execution
const errorWorkflowExecute = async (
  error: ExecutionError,
  workflowId: string,
  workflowData: IWorkflowBase,
  executionData: IRunExecutionData
) => {
  // Execute configured error workflow
  // Pass error details as input data
};
```

### Workflow Sharing

```typescript
interface IWorkflowShare {
  workflow: IWorkflowBase;
  sharedWith: IUser[];
  role: 'owner' | 'editor' | 'viewer';
  
  // Sharing methods
  shareWithUsers: (userIds: string[], role: string) => Promise<void>;
  shareWithTeams: (teamIds: string[], role: string) => Promise<void>;
  shareViaLink: (options: IShareLinkOptions) => Promise<string>;
}
```

### Variables Support

```typescript
interface IWorkflowVariable {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

// Variable resolution in expressions
$vars.get('variableName')
$vars.set('variableName', value)
```

### Tags

```typescript
interface ITag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface IWorkflowTags {
  tags: ITag[];
  
  // Tag management
  addTag: (tagName: string) => Promise<ITag>;
  removeTag: (tagId: string) => Promise<void>;
  getTags: () => Promise<ITag[]>;
}
```

## Implementation Guidelines

### 1. Architecture Patterns

- **Proxy-based data access**: Use Proxy objects for reactive data access
- **Cancelable promises**: Use PCancelable for execution control
- **Event-driven updates**: Implement event bus for UI updates
- **Modular node system**: Separate node logic from execution engine

### 2. Key Design Decisions

- **Expression evaluation**: Sandboxed execution with controlled context
- **Data flow**: Immutable data passing between nodes
- **Error handling**: Graceful degradation with multiple error strategies
- **Type safety**: Extensive TypeScript interfaces for all data structures

### 3. Performance Considerations

- **Lazy loading**: Load node types on demand
- **Streaming**: Support for large data processing
- **Partial execution**: Only execute necessary nodes
- **Caching**: Cache expression results and node outputs

### 4. Security Features

- **Expression sandboxing**: Restricted execution context
- **Credential encryption**: Secure storage of sensitive data
- **Access control**: Role-based permissions for workflows
- **Audit logging**: Track all workflow executions

### 5. Extensibility

- **Custom nodes**: Plugin architecture for adding nodes
- **Expression extensions**: Add custom functions
- **Webhook handling**: Dynamic webhook registration
- **External triggers**: Support for various trigger types

This extraction provides the foundation for building a comprehensive workflow automation system with n8n's powerful features adapted for voice agent workflows.