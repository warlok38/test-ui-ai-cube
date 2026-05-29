import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { BadRequestErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createBadRequestError(
  message?: string,
  data?: unknown,
  stack?: string
): BadRequestErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.BadRequest,
      message || DEFAULT_ERROR_MESSAGES.BadRequest,
      data,
      stack
    )
  }
}
