import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { ServerInternalErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createServerInternalError(
  message?: string,
  data?: unknown,
  stack?: string
): ServerInternalErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.ServerInternalError,
      message || DEFAULT_ERROR_MESSAGES.ServerInternalError,
      data,
      stack
    )
  }
}
