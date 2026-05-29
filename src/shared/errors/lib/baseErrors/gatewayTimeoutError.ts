import { DEFAULT_ERROR_MESSAGES, HTTP_ERROR_CODES } from '../../consts'
import { GatewayTimeoutErrorType } from '../../types'
import { createHttpError } from '../createHttpError'

export function createGatewayTimeoutError(
  message?: string,
  data?: unknown,
  stack?: string
): GatewayTimeoutErrorType {
  return {
    ...createHttpError(
      HTTP_ERROR_CODES.GatewayTimeout,
      message || DEFAULT_ERROR_MESSAGES.GatewayTimeout,
      data,
      stack
    )
  }
}
