import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { NotFoundErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createNotFoundError(
  message?: string,
  data?: unknown,
  stack?: string
): NotFoundErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.NotFound,
      message || DEFAULT_ERROR_MESSAGES.NotFound,
      data,
      stack
    )
  }
}
