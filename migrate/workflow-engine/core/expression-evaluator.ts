/**
 * Expression Evaluation System
 * Simplified version of n8n's expression evaluation logic
 */

import { DateTime, Duration, Interval } from 'luxon';
import * as jmespath from 'jmespath';

export interface IWorkflowDataProxyData {
  $input: any;
  $json: any;
  $node: any;
  $workflow: any;
  $now: DateTime;
  $today: DateTime;
  $execution: any;
  $prevNode: any;
  $runIndex: number;
  $itemIndex: number;
  [key: string]: any;
}

export interface IDataObject {
  [key: string]: any;
}

export interface INodeExecutionData {
  json: IDataObject;
  binary?: any;
  error?: Error;
  pairedItem?: any;
}

export type NodeParameterValue = string | number | boolean | null | undefined;

export class ExpressionEvaluator {
  private workflow: any;
  private defaultTimezone: string;

  constructor(workflow?: any, defaultTimezone = 'UTC') {
    this.workflow = workflow;
    this.defaultTimezone = defaultTimezone;
  }

  /**
   * Evaluate an expression with given data context
   */
  evaluate(expression: string, data: IWorkflowDataProxyData): any {
    try {
      // Remove leading '=' if present
      if (expression.startsWith('=')) {
        expression = expression.substring(1);
      }

      // Prepare the evaluation context
      const context = this.prepareContext(data);
      
      // Handle special syntax extensions
      expression = this.extendSyntax(expression);

      // Use Function constructor for safe evaluation
      // This is a simplified version - production should use a proper sandbox
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error(`Expression evaluation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Resolve parameter value (handles both simple values and expressions)
   */
  resolveParameterValue(
    parameterValue: any,
    data: IWorkflowDataProxyData
  ): any {
    // Not an expression
    if (typeof parameterValue !== 'string' || !parameterValue.startsWith('=')) {
      return parameterValue;
    }

    // Evaluate expression
    return this.evaluate(parameterValue, data);
  }

  /**
   * Prepare the context for expression evaluation
   */
  private prepareContext(data: IWorkflowDataProxyData): any {
    const context: any = { ...data };

    // Add built-in functions and objects
    context.DateTime = DateTime;
    context.Duration = Duration;
    context.Interval = Interval;
    context.Date = Date;
    context.Math = Math;
    context.Object = Object;
    context.Array = Array;
    context.String = String;
    context.Number = Number;
    context.Boolean = Boolean;
    context.JSON = JSON;
    context.parseInt = parseInt;
    context.parseFloat = parseFloat;
    context.isNaN = isNaN;
    context.isFinite = isFinite;
    context.encodeURI = encodeURI;
    context.encodeURIComponent = encodeURIComponent;
    context.decodeURI = decodeURI;
    context.decodeURIComponent = decodeURIComponent;

    // Add custom helper functions
    context.$jmespath = (jsonData: any, expression: string) => {
      return jmespath.search(jsonData, expression);
    };

    context.$exists = (value: any) => {
      return value !== null && value !== undefined && value !== '';
    };

    context.$isEmpty = (value: any) => {
      if (value === null || value === undefined || value === '') return true;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    };

    context.$if = (condition: any, trueValue: any, falseValue: any) => {
      return condition ? trueValue : falseValue;
    };

    context.$min = (...args: number[]) => Math.min(...args);
    context.$max = (...args: number[]) => Math.max(...args);
    context.$round = (value: number, decimals = 0) => {
      const factor = Math.pow(10, decimals);
      return Math.round(value * factor) / factor;
    };

    context.$lowercase = (str: string) => String(str).toLowerCase();
    context.$uppercase = (str: string) => String(str).toUpperCase();
    context.$trim = (str: string) => String(str).trim();
    context.$replaceAll = (str: string, search: string, replace: string) => {
      return String(str).split(search).join(replace);
    };

    context.$toNumber = (value: any) => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    context.$toString = (value: any) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    context.$toBoolean = (value: any) => {
      return Boolean(value);
    };

    context.$toJson = (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    context.$now = DateTime.now().setZone(this.defaultTimezone);
    context.$today = DateTime.now().setZone(this.defaultTimezone).startOf('day');

    return context;
  }

  /**
   * Extend expression syntax with custom operations
   */
  private extendSyntax(expression: string): string {
    // Replace object property access with optional chaining
    expression = expression.replace(/\$node\["([^"]+)"\]\.([^.\s\[]+)/g, '$node["$1"]?.$2');
    expression = expression.replace(/\$json\.([^.\s\[]+)/g, '$json?.$1');
    
    // Handle array access with fallback
    expression = expression.replace(/\[(\d+)\]/g, '?.[$1]');

    return expression;
  }

  /**
   * Create a data proxy for workflow execution context
   */
  createDataProxy(
    runExecutionData: any,
    workflow: any,
    itemIndex: number,
    activeNodeName: string,
    connectionInputData: INodeExecutionData[]
  ): IWorkflowDataProxyData {
    const proxy: IWorkflowDataProxyData = {
      $input: this.createInputProxy(connectionInputData, itemIndex),
      $json: connectionInputData[itemIndex]?.json || {},
      $node: this.createNodeProxy(workflow, activeNodeName),
      $workflow: this.createWorkflowProxy(workflow),
      $execution: this.createExecutionProxy(runExecutionData),
      $prevNode: this.createPrevNodeProxy(runExecutionData, activeNodeName),
      $now: DateTime.now().setZone(this.defaultTimezone),
      $today: DateTime.now().setZone(this.defaultTimezone).startOf('day'),
      $runIndex: 0,
      $itemIndex: itemIndex
    };

    // Add convenience methods
    proxy.$item = (index: number) => connectionInputData[index] || null;
    proxy.$items = () => connectionInputData;
    proxy.$parameter = this.createParameterProxy(workflow, activeNodeName);

    return proxy;
  }

  /**
   * Create input data proxy
   */
  private createInputProxy(connectionInputData: INodeExecutionData[], itemIndex: number): any {
    return {
      all: () => connectionInputData,
      first: () => connectionInputData[0]?.json || {},
      last: () => connectionInputData[connectionInputData.length - 1]?.json || {},
      item: connectionInputData[itemIndex]?.json || {},
      params: {} // Would contain query parameters in webhook scenarios
    };
  }

  /**
   * Create node information proxy
   */
  private createNodeProxy(workflow: any, nodeName: string): any {
    const node = workflow?.nodes?.find((n: any) => n.name === nodeName) || {};
    
    return {
      name: node.name || '',
      type: node.type || '',
      typeVersion: node.typeVersion || 1,
      position: node.position || [0, 0],
      disabled: node.disabled || false,
      notes: node.notes || '',
      parameters: { ...node.parameters } || {}
    };
  }

  /**
   * Create workflow information proxy
   */
  private createWorkflowProxy(workflow: any): any {
    return {
      id: workflow?.id || '',
      name: workflow?.name || '',
      active: workflow?.active || false
    };
  }

  /**
   * Create execution information proxy
   */
  private createExecutionProxy(runExecutionData: any): any {
    return {
      id: runExecutionData?.executionId || '',
      mode: runExecutionData?.mode || 'manual',
      resumeUrl: '',
      customData: runExecutionData?.customData || {}
    };
  }

  /**
   * Create previous node data proxy
   */
  private createPrevNodeProxy(runExecutionData: any, activeNodeName: string): any {
    // This would look up the actual previous node data
    // Simplified for this implementation
    return {
      name: '',
      outputIndex: 0,
      runIndex: 0
    };
  }

  /**
   * Create parameter access proxy
   */
  private createParameterProxy(workflow: any, nodeName: string): any {
    const node = workflow?.nodes?.find((n: any) => n.name === nodeName);
    const parameters = node?.parameters || {};
    
    return new Proxy(parameters, {
      get: (target, prop) => {
        const value = target[prop as string];
        // Would normally resolve nested expressions here
        return value;
      }
    });
  }

  /**
   * Evaluate a JMESPath expression
   */
  evaluateJMESPath(data: any, expression: string): any {
    try {
      return jmespath.search(data, expression);
    } catch (error) {
      throw new Error(`JMESPath evaluation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Safe JSON stringify that handles circular references
   */
  safeStringify(obj: any, indent?: number): string {
    const seen = new WeakSet();
    
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      // Handle special types
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value instanceof RegExp) {
        return value.toString();
      }
      
      return value;
    }, indent);
  }

  /**
   * Deep get value from object using dot notation
   */
  deepGet(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  }

  /**
   * Deep set value in object using dot notation
   */
  deepSet(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target = obj;
    
    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
  }
}