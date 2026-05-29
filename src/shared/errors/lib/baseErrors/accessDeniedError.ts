import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { AccessDeniedErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createAccessDeniedError(
  message?: string,
  data?: unknown,
  stack?: string
): AccessDeniedErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.AccessDenied,
      message || DEFAULT_ERROR_MESSAGES.AccessDenied,
      data,
      stack
    )
  }
}
