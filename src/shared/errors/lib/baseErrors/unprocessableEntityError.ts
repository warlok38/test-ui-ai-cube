import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { UnprocessableEntityErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createUnprocessableEntityError(
  message?: string,
  data?: unknown,
  stack?: string
): UnprocessableEntityErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.UnprocessableEntity,
      message || DEFAULT_ERROR_MESSAGES.UnprocessableEntity,
      data,
      stack
    )
  }
}
