/**
 * Advanced expression parser with full n8n syntax support
 */

import { DateTime } from 'luxon'
import jmespath from 'jmespath'
import { ExpressionError } from './ExpressionError'
import { IDataObject } from '../types'

export class ExpressionParser {
  private static readonly EXPRESSION_REGEX = /\{\{(.+?)\}\}/g
  private static readonly BLOCK_REGEX = /\$\(([^)]+)\)/g
  
  /**
   * Parse and evaluate an expression
   */
  static evaluate(expression: string, context: IDataObject): any {
    if (!this.isExpression(expression)) {
      return expression
    }

    // Handle simple expressions (single value)
    if (expression.startsWith('={{') && expression.endsWith('}}')) {
      const code = expression.slice(3, -2).trim()
      return this.evaluateCode(code, context)
    }

    // Handle mixed expressions (text with embedded expressions)
    return expression.replace(this.EXPRESSION_REGEX, (match, code) => {
      try {
        const result = this.evaluateCode(code.trim(), context)
        return result?.toString() || ''
      } catch (error) {
        throw new ExpressionError(`Error in expression: ${match}`, { expression: match, error })
      }
    })
  }

  /**
   * Check if a string contains expressions
   */
  static isExpression(value: any): boolean {
    if (typeof value !== 'string') return false
    return value.includes('{{') && value.includes('}}')
  }

  /**
   * Evaluate JavaScript code with context
   */
  private static evaluateCode(code: string, context: IDataObject): any {
    // Build evaluation context with all helper functions
    const evalContext = {
      // Core variables
      ...context,
      
      // Date/Time functions
      $now: DateTime.now(),
      $today: DateTime.now().startOf('day'),
      DateTime,
      
      // Utility functions
      $jmespath: (data: any, expression: string) => jmespath.search(data, expression),
      $exists: (path: string) => this.exists(context.$json || {}, path),
      $isEmpty: (value: any) => this.isEmpty(value),
      $isNotEmpty: (value: any) => !this.isEmpty(value),
      
      // String functions
      $lowercase: (str: string) => str?.toLowerCase(),
      $uppercase: (str: string) => str?.toUpperCase(),
      $titleCase: (str: string) => this.titleCase(str),
      $trim: (str: string) => str?.trim(),
      $replace: (str: string, search: string, replace: string) => str?.replace(new RegExp(search, 'g'), replace),
      $split: (str: string, separator: string) => str?.split(separator),
      $join: (arr: any[], separator: string) => arr?.join(separator),
      $pad: (str: string, length: number, char = ' ') => str?.padStart(length, char),
      
      // Number functions
      $round: (num: number, decimals = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
      $floor: (num: number) => Math.floor(num),
      $ceil: (num: number) => Math.ceil(num),
      $abs: (num: number) => Math.abs(num),
      $random: (min = 0, max = 1) => Math.random() * (max - min) + min,
      $min: (...nums: number[]) => Math.min(...nums),
      $max: (...nums: number[]) => Math.max(...nums),
      
      // Array functions
      $first: (arr: any[]) => arr?.[0],
      $last: (arr: any[]) => arr?.[arr.length - 1],
      $length: (value: any[] | string) => value?.length || 0,
      $unique: (arr: any[]) => [...new Set(arr)],
      $sort: (arr: any[], key?: string) => this.sortArray(arr, key),
      $reverse: (arr: any[]) => arr?.slice().reverse(),
      $slice: (arr: any[], start: number, end?: number) => arr?.slice(start, end),
      $filter: (arr: any[], condition: (item: any) => boolean) => arr?.filter(condition),
      $map: (arr: any[], transform: (item: any) => any) => arr?.map(transform),
      $reduce: (arr: any[], reducer: (acc: any, item: any) => any, initial?: any) => arr?.reduce(reducer, initial),
      
      // Object functions
      $keys: (obj: IDataObject) => Object.keys(obj || {}),
      $values: (obj: IDataObject) => Object.values(obj || {}),
      $entries: (obj: IDataObject) => Object.entries(obj || {}),
      $merge: (...objs: IDataObject[]) => Object.assign({}, ...objs),
      $pick: (obj: IDataObject, ...keys: string[]) => this.pick(obj, keys),
      $omit: (obj: IDataObject, ...keys: string[]) => this.omit(obj, keys),
      
      // Type checking
      $isString: (val: any) => typeof val === 'string',
      $isNumber: (val: any) => typeof val === 'number' && !isNaN(val),
      $isBoolean: (val: any) => typeof val === 'boolean',
      $isArray: (val: any) => Array.isArray(val),
      $isObject: (val: any) => typeof val === 'object' && val !== null && !Array.isArray(val),
      $isNull: (val: any) => val === null,
      $isUndefined: (val: any) => val === undefined,
      $isDefined: (val: any) => val !== undefined,
      
      // Type conversion
      $toString: (val: any) => String(val),
      $toNumber: (val: any) => Number(val),
      $toBoolean: (val: any) => Boolean(val),
      $toJson: (val: any) => JSON.stringify(val),
      $parseJson: (str: string) => this.parseJson(str),
      $toDate: (val: any) => new Date(val),
      $toInt: (val: any) => parseInt(val, 10),
      $toFloat: (val: any) => parseFloat(val),
      
      // Encoding/Decoding
      $base64Encode: (str: string) => Buffer.from(str).toString('base64'),
      $base64Decode: (str: string) => Buffer.from(str, 'base64').toString(),
      $urlEncode: (str: string) => encodeURIComponent(str),
      $urlDecode: (str: string) => decodeURIComponent(str),
      $htmlEscape: (str: string) => this.htmlEscape(str),
      $htmlUnescape: (str: string) => this.htmlUnescape(str),
      
      // Hash functions
      $hash: (str: string, algorithm = 'sha256') => this.hash(str, algorithm),
      
      // Logical functions
      $if: (condition: any, truthy: any, falsy: any) => condition ? truthy : falsy,
      $switch: (value: any, cases: IDataObject, defaultCase?: any) => cases[value] || defaultCase,
      $and: (...args: any[]) => args.every(Boolean),
      $or: (...args: any[]) => args.some(Boolean),
      $not: (val: any) => !val,
      
      // Math constants
      Math,
      
      // JSON/Object path access
      $: (path: string) => this.getPath(context, path)
    }

    try {
      // Create function with all context variables
      const func = new Function(...Object.keys(evalContext), `return ${code}`)
      return func(...Object.values(evalContext))
    } catch (error) {
      throw new ExpressionError(`Failed to evaluate: ${code}`, { code, error: error.message })
    }
  }

  // Helper methods
  private static exists(obj: any, path: string): boolean {
    try {
      const result = jmespath.search(obj, path)
      return result !== null && result !== undefined
    } catch {
      return false
    }
  }

  private static isEmpty(value: any): boolean {
    if (value === null || value === undefined || value === '') return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }

  private static titleCase(str: string): string {
    if (!str) return ''
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  private static sortArray(arr: any[], key?: string): any[] {
    if (!arr || !Array.isArray(arr)) return []
    
    return arr.slice().sort((a, b) => {
      const aVal = key ? a[key] : a
      const bVal = key ? b[key] : b
      
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })
  }

  private static pick(obj: IDataObject, keys: string[]): IDataObject {
    const result: IDataObject = {}
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key]
      }
    }
    return result
  }

  private static omit(obj: IDataObject, keys: string[]): IDataObject {
    const result = { ...obj }
    for (const key of keys) {
      delete result[key]
    }
    return result
  }

  private static parseJson(str: string): any {
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  private static htmlEscape(str: string): string {
    const map: IDataObject = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return str?.replace(/[&<>"']/g, m => map[m]) || ''
  }

  private static htmlUnescape(str: string): string {
    const map: IDataObject = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    }
    return str?.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m]) || ''
  }

  private static hash(str: string, algorithm: string): string {
    // Simplified hash - in production use crypto
    if (algorithm === 'md5') {
      // Simple hash for demo
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16)
    }
    return str // Fallback
  }

  private static getPath(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }
    
    return current
  }
}