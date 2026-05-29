import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { MethodNotAllowedErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createMethodNotAllowedError(
  message?: string,
  data?: unknown,
  stack?: string
): MethodNotAllowedErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.MethodNotAllowed,
      message || DEFAULT_ERROR_MESSAGES.MethodNotAllowed,
      data,
      stack
    )
  }
}
