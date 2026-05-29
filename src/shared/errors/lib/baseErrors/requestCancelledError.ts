import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { RequestCancelledErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createRequestCancelledError(
  message?: string,
  data?: unknown,
  stack?: string
): RequestCancelledErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.RequestCancelled,
      message || DEFAULT_ERROR_MESSAGES.RequestCancelled,
      data,
      stack
    )
  }
}
