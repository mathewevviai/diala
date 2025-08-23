/**
 * Expression evaluation error handling
 */

export class ExpressionError extends Error {
  description: string
  context: any
  causeDetailed?: string
  
  constructor(message: string, context?: any) {
    super(message)
    this.name = 'ExpressionError'
    this.description = message
    this.context = context || {}
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExpressionError)
    }
  }
}