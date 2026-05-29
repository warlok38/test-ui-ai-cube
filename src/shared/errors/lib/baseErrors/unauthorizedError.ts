import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { UnauthorizedErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createUnauthorizedError(
  message?: string,
  data?: unknown,
  stack?: string
): UnauthorizedErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.Unauthorized,
      message || DEFAULT_ERROR_MESSAGES.Unauthorized,
      data,
      stack
    )
  }
}
