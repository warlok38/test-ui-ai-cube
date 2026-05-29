import { DEFAULT_ERROR_MESSAGES } from '../consts'
import { HttpErrorType, StatusCodeType } from '../types'
import { createError } from './createError'

export function createHttpError<TStatus>(
  statusCode: StatusCodeType<TStatus>,
  message?: string,
  data?: unknown,
  stack?: string
): HttpErrorType<TStatus> {
  return {
    ...createError(message || DEFAULT_ERROR_MESSAGES.Default, stack),
    statusCode,
    data
  }
}
