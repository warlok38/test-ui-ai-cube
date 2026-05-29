import { ErrorType } from '../types'

export function createError(message: string, stack?: string): ErrorType {
  return {
    message,
    stack
  }
}
