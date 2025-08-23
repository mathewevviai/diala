/**
 * Comprehensive type definitions extracted from n8n
 */

// Basic types
export type IDataObject = Record<string, any>

export type NodeParameterValue = string | number | boolean | IDataObject | IDataObject[] | null | undefined

export type WorkflowExecuteMode = 
  | 'cli'
  | 'error'
  | 'integrated'
  | 'internal'
  | 'manual'
  | 'retry'
  | 'trigger'
  | 'webhook'

export type ExecutionStatus = 
  | 'canceled'
  | 'crashed'
  | 'error'
  | 'new'
  | 'running'
  | 'success'
  | 'unknown'
  | 'waiting'

// Node types
export interface INode {
  id: string
  name: string
  type: string
  typeVersion?: number
  position: [number, number]
  disabled?: boolean
  notes?: string
  notesInFlow?: boolean
  retryOnFail?: boolean
  maxTries?: number
  waitBetweenTries?: number
  continueOnFail?: boolean
  parameters: INodeParameters
  credentials?: INodeCredentials
  webhookId?: string
}

export interface INodeParameters {
  [key: string]: NodeParameterValue
}

export interface INodeCredentials {
  [credentialType: string]: string | { id: string; name: string }
}

// Connection types
export interface IConnection {
  node: string
  type: NodeConnectionType
  index: number
}

export interface IConnections {
  [outputIndex: string]: IConnection[][]
}

export interface INodeConnections {
  [nodeName: string]: IConnections
}

export type NodeConnectionType = 'main'

// Workflow types
export interface IWorkflowBase {
  id?: string
  name?: string
  active?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  nodes: INode[]
  connections: INodeConnections
  settings?: IWorkflowSettings
  staticData?: IDataObject
  pinData?: IPinData
  tags?: string[]
}

export interface IWorkflowSettings {
  timezone?: string
  errorWorkflow?: string
  saveDataErrorExecution?: string
  saveDataSuccessExecution?: string
  saveManualExecutions?: boolean
  callerIds?: string
  callerPolicy?: string
  executionTimeout?: number
}

export interface IPinData {
  [nodeName: string]: INodeExecutionData[]
}

// Execution types
export interface IExecuteData {
  node: INode
  data: INodeExecutionData
  source: ITaskDataConnections | null
}

export interface INodeExecutionData {
  [outputIndex: string]: IDataObject[][]
  webhookResponse?: any
}

export interface ITaskDataConnections {
  [inputIndex: string]: Array<{
    node: string
    type: NodeConnectionType
    index: number
  }>
}

export interface ITaskData {
  startTime: number
  executionTime: number
  executionStatus: ExecutionStatus
  data?: INodeExecutionData
  error?: Error
}

export interface IRunExecutionData {
  startData?: IDataObject
  resultData: {
    error?: Error
    lastNodeExecuted?: string
    runData: IRunData
    executionData?: IExecutionData
    metadata?: Record<string, any>
  }
  executionData?: IExecutionData
}

export interface IRunData {
  [nodeName: string]: ITaskData[]
}

export interface IExecutionData {
  contextData: IDataObject
  nodeExecutionStack: IExecuteData[]
  waitingExecution: IWaitingForExecution
  waitingExecutionSource: IWaitingForExecutionSource
}

export interface IWaitingForExecution {
  [nodeId: string]: IExecuteData[]
}

export interface IWaitingForExecutionSource {
  [nodeId: string]: IExecuteData
}

// Node type definitions
export interface INodeType {
  description: INodeTypeDescription
  methods?: {
    loadOptions?: {
      [methodName: string]: (this: ILoadOptionsFunctions) => Promise<INodePropertyOptions[]>
    }
    credentialTest?: {
      [methodName: string]: (this: ICredentialTestFunctions) => Promise<INodeCredentialTestResult>
    }
  }
  webhookMethods?: {
    default?: {
      checkExists?: (this: IWebhookFunctions) => Promise<boolean>
      create?: (this: IWebhookFunctions) => Promise<boolean>
      delete?: (this: IWebhookFunctions) => Promise<boolean>
    }
  }
  webhook?: (this: IWebhookFunctions) => Promise<IWebhookResponseData>
  trigger?: (this: ITriggerFunctions) => Promise<ITriggerResponse | undefined>
  execute?: (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>
  poll?: (this: IPollFunctions) => Promise<INodeExecutionData[][] | null>
}

export interface INodeTypeDescription {
  displayName: string
  name: string
  group: string[]
  version: number | number[]
  description: string
  subtitle?: string
  defaults: INodeTypeDefaults
  inputs: string[] | INodeInputConfiguration[]
  outputs: string[] | INodeOutputConfiguration[]
  outputNames?: string[]
  properties: INodeProperties[]
  credentials?: INodeCredentialDescription[]
  maxNodes?: number
  polling?: boolean
  supportsCORS?: boolean
  webhooks?: IWebhookDescription[]
  triggerPanel?: boolean
  activationMessage?: string
  documentationUrl?: string
  icon?: string
  iconUrl?: string
  codex?: INodeTypeCodex
}

export interface INodeTypeDefaults {
  name: string
  color?: string
}

export interface INodeInputConfiguration {
  type: string
  displayName?: string
  required?: boolean
  maxConnections?: number
}

export interface INodeOutputConfiguration {
  type: string
  displayName?: string
}

// Node properties
export interface INodeProperties {
  displayName: string
  name: string
  type: NodePropertyTypes
  typeOptions?: INodeTypeOptions
  default?: NodeParameterValue
  description?: string
  hint?: string
  displayOptions?: IDisplayOptions
  options?: INodePropertyOptions[] | INodePropertyCollection[]
  placeholder?: string
  isNodeSetting?: boolean
  noDataExpression?: boolean
  required?: boolean
  routing?: INodePropertyRouting
  credentialTypes?: string[]
  extractValue?: INodePropertyValueExtractor
}

export type NodePropertyTypes =
  | 'boolean'
  | 'collection'
  | 'color'
  | 'dateTime'
  | 'fixedCollection'
  | 'hidden'
  | 'json'
  | 'multiOptions'
  | 'number'
  | 'options'
  | 'string'
  | 'notice'
  | 'assignmentCollection'
  | 'credentials'
  | 'filter'
  | 'resourceLocator'
  | 'curlImport'
  | 'resourceMapper'
  | 'file'

export interface INodeTypeOptions {
  alwaysOpenEditWindow?: boolean
  loadOptionsMethod?: string
  loadOptionsDependsOn?: string[]
  multipleValues?: boolean
  multipleValueButtonText?: string
  password?: boolean
  rows?: number
  showAlpha?: boolean
  sortable?: boolean
  expirable?: boolean
  maxExpiredDelay?: number
}

export interface IDisplayOptions {
  hide?: INodeDisplayConditions
  show?: INodeDisplayConditions
}

export interface INodeDisplayConditions {
  [nodePropertyName: string]: NodeParameterValue[] | undefined
}

export interface INodePropertyOptions {
  name: string
  value: string | number
  description?: string
  action?: string
  routing?: INodePropertyRouting
}

export interface INodePropertyCollection {
  name: string
  displayName: string
  values: INodeProperties[]
}

export interface INodePropertyRouting {
  operations?: INodePropertyRoutingOperation
  request?: INodeRequestOptions
  send?: INodeRequestSend
  output?: INodeRequestOutput
}

export interface INodePropertyRoutingOperation {
  [key: string]: any
}

export interface INodeRequestOptions {
  baseURL?: string
  url?: string
  method?: string
  qs?: IDataObject
  headers?: IDataObject
  body?: IDataObject
}

export interface INodeRequestSend {
  type?: string
  property?: string
  value?: any
  preSend?: Array<(this: IExecuteSingleFunctions) => Promise<void>>
}

export interface INodeRequestOutput {
  postReceive?: Array<(this: IExecuteSingleFunctions, items: INodeExecutionData[]) => Promise<INodeExecutionData[]>>
}

export interface INodePropertyValueExtractor {
  type: string
  regex?: string
  value?: string
}

// Webhook types
export interface IWebhookDescription {
  name: string
  httpMethod: string
  isFullPath?: boolean
  path?: string
  responseBinaryPropertyName?: string
  responseContentType?: string
  responsePropertyName?: string
  responseMode?: string
  responseData?: string
  restartWebhook?: boolean
}

export interface IWebhookResponseData {
  workflowData?: INodeExecutionData[][]
  webhookResponse?: any
  noWebhookResponse?: boolean
}

export interface ITriggerResponse {
  closeFunction?: () => Promise<void>
  manualTriggerFunction?: () => Promise<void>
}

// Function interfaces
export interface IExecuteFunctions extends IExecuteFunctionsBase {
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData
  getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): NodeParameterValue
  getMode(): WorkflowExecuteMode
  getNode(): INode
  getWorkflow(): IWorkflowMetadata
  getWorkflowDataProxy(itemIndex: number): IDataObject
  prepareOutputData(outputData: INodeExecutionData[], outputIndex?: number): Promise<INodeExecutionData[][]>
  putExecutionToWait(waitTill: Date): Promise<void>
  sendMessageToUI(message: string): void
  helpers: IExecuteFunctionsHelpers
}

export interface IExecuteFunctionsBase {
  getCredentials(type: string, itemIndex?: number): Promise<IDataObject>
  getTimezone(): string
  getRestApiUrl(): string
  getInstanceId(): string
  getExecutionId(): string
  continueOnFail(): boolean
}

export interface IExecuteFunctionsHelpers {
  returnJsonArray(jsonData: IDataObject | IDataObject[]): IDataObject[]
  normalizeItems(items: INodeExecutionData | INodeExecutionData[]): INodeExecutionData[]
  constructExecutionMetaData(
    inputData: INodeExecutionData[],
    options: { itemData: IPairedItemData | IPairedItemData[] }
  ): NodeExecutionWithMetadata[]
  assertBinaryData(itemIndex: number, propertyName: string): Promise<IBinaryData>
  getBinaryDataBuffer(itemIndex: number, propertyName: string): Promise<Buffer>
  prepareBinaryData(
    binaryData: Buffer | Readable,
    filePath?: string,
    mimeType?: string
  ): Promise<IBinaryData>
  setBinaryDataBuffer(data: IBinaryData, binaryData: Buffer): Promise<IBinaryData>
  binaryToString(body: Buffer | Readable, encoding?: string): Promise<string>
  httpRequest(requestOptions: IHttpRequestOptions): Promise<any>
  httpRequestWithAuthentication(
    credentialType: string,
    requestOptions: IHttpRequestOptions,
    additionalOptions?: IAdditionalOptions
  ): Promise<any>
}

export interface IWorkflowMetadata {
  id: string
  name: string
  active: boolean
}

export interface IPairedItemData {
  item: number
  input?: number
  sourceOverwrite?: ISourceData
}

export interface ISourceData {
  previousNode: string
  previousNodeOutput?: number
  previousNodeRun?: number
}

export interface NodeExecutionWithMetadata {
  json: IDataObject
  binary?: IBinaryKeyData
  pairedItem?: IPairedItemData | IPairedItemData[]
}

export interface IBinaryKeyData {
  [key: string]: IBinaryData
}

export interface IBinaryData {
  data: string
  mimeType: string
  fileType?: string
  fileName?: string
  directory?: string
  fileExtension?: string
  fileSize?: string
  id?: string
}

export interface IHttpRequestOptions {
  url: string
  method: string
  body?: any
  qs?: IDataObject
  headers?: IDataObject
  auth?: {
    username: string
    password: string
  }
  timeout?: number
  json?: boolean
  returnFullResponse?: boolean
  proxy?: string
  encoding?: string
  simple?: boolean
  gzip?: boolean
  rejectUnauthorized?: boolean
}

export interface IAdditionalOptions {
  credentialsDecrypted?: ICredentialsDecrypted
}

export interface ICredentialsDecrypted {
  [key: string]: IDataObject
}

// Other function types
export interface ITriggerFunctions extends IExecuteFunctionsBase {
  emit(data: INodeExecutionData[][]): void
  emitError(error: Error): void
  getMode(): WorkflowExecuteMode
  getActivationMode(): string
  getNode(): INode
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getWorkflow(): IWorkflowMetadata
  getWorkflowStaticData(type: string): IDataObject
  helpers: ITriggerFunctionsHelpers
}

export interface ITriggerFunctionsHelpers extends IExecuteFunctionsHelpers {
  returnJsonArray(jsonData: IDataObject | IDataObject[]): IDataObject[]
}

export interface IWebhookFunctions extends IExecuteFunctionsBase {
  getBodyData(): IDataObject
  getHeaderData(): IDataObject
  getMode(): WorkflowExecuteMode
  getNode(): INode
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getNodeWebhookUrl(name: string): string | undefined
  getParamsData(): IDataObject
  getQueryData(): IDataObject
  getRequestObject(): express.Request
  getResponseObject(): express.Response
  getWebhookName(): string
  getWorkflow(): IWorkflowMetadata
  getWorkflowStaticData(type: string): IDataObject
  prepareOutputData(outputData: INodeExecutionData[], outputIndex?: number): Promise<INodeExecutionData[][]>
  helpers: IWebhookFunctionsHelpers
}

export interface IWebhookFunctionsHelpers extends IExecuteFunctionsHelpers {
  returnJsonArray(jsonData: IDataObject | IDataObject[]): IDataObject[]
}

export interface IPollFunctions extends IExecuteFunctionsBase {
  getMode(): WorkflowExecuteMode
  getActivationMode(): string
  getNode(): INode
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getWorkflow(): IWorkflowMetadata
  getWorkflowStaticData(type: string): IDataObject
  helpers: IPollFunctionsHelpers
}

export interface IPollFunctionsHelpers extends IExecuteFunctionsHelpers {
  returnJsonArray(jsonData: IDataObject | IDataObject[]): IDataObject[]
}

export interface ILoadOptionsFunctions extends IExecuteFunctionsBase {
  getNode(): INode
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getCurrentNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getCurrentNodeParameters(): INodeParameters
  helpers: ILoadOptionsFunctionsHelpers
}

export interface ILoadOptionsFunctionsHelpers {
  httpRequest(requestOptions: IHttpRequestOptions): Promise<any>
}

export interface ICredentialTestFunctions extends IExecuteFunctionsBase {
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getCredentials(type: string): Promise<IDataObject>
  helpers: ICredentialTestFunctionsHelpers
}

export interface ICredentialTestFunctionsHelpers {
  httpRequest(requestOptions: IHttpRequestOptions): Promise<any>
}

export interface INodeCredentialTestResult {
  status: 'OK' | 'Error'
  message: string
}

export interface INodeTypeCodex {
  categories?: string[]
  subcategories?: {
    [category: string]: string[]
  }
  alias?: string[]
}

export interface INodeCredentialDescription {
  name: string
  required?: boolean
  displayOptions?: IDisplayOptions
  testedBy?: ICredentialTestRequest | string
}

export interface ICredentialTestRequest {
  request: IHttpRequestOptions
  rules?: ICredentialTestRequestRule[]
}

export interface ICredentialTestRequestRule {
  type: 'responseCode' | 'responseSuccessBody'
  properties: {
    value?: number
    message?: string
    messagePattern?: string
  }
}

export interface IExecuteSingleFunctions extends IExecuteFunctionsBase {
  getInputData(inputIndex?: number, inputName?: string): INodeExecutionData
  getItemIndex(): number
  getMode(): WorkflowExecuteMode
  getNode(): INode
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValue
  getWorkflow(): IWorkflowMetadata
  helpers: IExecuteSingleFunctionsHelpers
}

export interface IExecuteSingleFunctionsHelpers extends IExecuteFunctionsHelpers {
  getBinaryDataBuffer(propertyName: string): Promise<Buffer>
}

export interface IExecuteResponsePromiseData {
  data: INodeExecutionData
  response: any
}

export interface IWorkflowExecuteAdditionalData {
  credentialsHelper?: ICredentialsHelper
  executionId?: string
  restartExecutionId?: string
  hooks?: IWorkflowExecuteHooks
  httpRequest?: (requestOptions: IHttpRequestOptions) => Promise<any>
  httpRequestWithAuthentication?: (
    credentialType: string,
    requestOptions: IHttpRequestOptions,
    additionalOptions?: IAdditionalOptions
  ) => Promise<any>
  currentNodeParameters?: INodeParameters
  executionTimeoutTimestamp?: number
  userId?: string
  variables?: IDataObject
  instanceId?: string
  secretsHelpers?: ISecretsHelper
  parentExecutionId?: string
  workflowData: IWorkflowBase
}

export interface ICredentialsHelper {
  authenticate(
    credentials: ICredentialsDecrypted,
    typeName: string,
    requestOptions: IHttpRequestOptions
  ): Promise<IHttpRequestOptions>
  getCredentials(nodeCredentials: INodeCredentialsDetails, type: string): Promise<ICredentials>
  getDecrypted(
    nodeCredentials: INodeCredentialsDetails,
    type: string,
    mode: WorkflowExecuteMode,
    timezone: string,
    raw?: boolean,
    expressionResolveValues?: ICredentialsExpressionResolveValues
  ): Promise<ICredentialsDecrypted>
  updateCredentials(
    nodeCredentials: INodeCredentialsDetails,
    type: string,
    data: ICredentialDataDecryptedObject
  ): Promise<void>
}

export interface INodeCredentialsDetails {
  id: string | null
  name: string
}

export interface ICredentials {
  id?: string
  name: string
  type?: string
  data?: ICredentialDataDecryptedObject
  nodesAccess?: ICredentialNodeAccess[]
}

export interface ICredentialDataDecryptedObject {
  [key: string]: any
}

export interface ICredentialNodeAccess {
  nodeType: string
  user?: string
  date?: Date
}

export interface ICredentialsExpressionResolveValues {
  connectionInputData: INodeExecutionData[]
  itemIndex: number
  node: INode
  runExecutionData: IRunExecutionData | null
  runIndex: number
  workflow: IWorkflowMetadata
}

export interface IWorkflowExecuteHooks {
  nodeExecuteAfter?: Array<
    (
      nodeName: string,
      data: ITaskData,
      executionData: IRunExecutionData
    ) => Promise<void>
  >
  nodeExecuteBefore?: Array<(nodeName: string) => Promise<void>>
  workflowExecuteAfter?: Array<
    (data: IRun, newStaticData: IDataObject) => Promise<void>
  >
  workflowExecuteBefore?: Array<(workflow: Workflow, data: IRunExecutionData) => Promise<void>>
  sendResponse?: Array<(response: IExecuteResponsePromiseData) => Promise<void>>
}

export interface IRun {
  data: IRunExecutionData
  finished: boolean
  mode: WorkflowExecuteMode
  startedAt: Date
  stoppedAt?: Date
  status: ExecutionStatus
}

export interface ISecretsHelper {
  getSecret(provider: string, name: string): IDataObject
  listProviders(): string[]
  listSecrets(provider: string): string[]
  update(): Promise<void>
}

export interface INodeTypeRegistry {
  getByNameAndVersion(nodeType: string, version?: number): INodeType | undefined
  getByName(nodeType: string): Array<{ type: INodeType; version: number }>
}