/**
 * Main workflow module exports
 */

// Core workflow engine
export { WorkflowEngine } from './WorkflowEngine'
export { Workflow } from './core/Workflow'
export { WorkflowExecute } from './core/WorkflowExecute'
export { WorkflowDataProxy } from './core/WorkflowDataProxy'
export { ExpressionParser } from './core/ExpressionParser'
export { ExpressionError } from './core/ExpressionError'

// Node types
export { BaseNode } from './nodes/BaseNode'
export { HttpRequestNode } from './nodes/HttpRequestNode'
export { IfNode } from './nodes/IfNode'
export { WebhookNode } from './nodes/WebhookNode'
export { CodeNode } from './nodes/CodeNode'
export { SetNode } from './nodes/SetNode'
export { DialaMakeCallNode } from './nodes/DialaMakeCallNode'

// Types
export * from './types'

// Utilities
export const EXPRESSION_REGEX = /\{\{(.+?)\}\}/g

export function isExpression(value: any): boolean {
  return typeof value === 'string' && value.includes('{{') && value.includes('}}')
}

export function extractExpression(value: string): string {
  if (value.startsWith('={{') && value.endsWith('}}')) {
    return value.slice(3, -2).trim()
  }
  return value
}