import {
  createAccessDeniedError,
  createBadRequestError,
  createGatewayTimeoutError,
  createMethodNotAllowedError,
  createNotFoundError,
  createRequestCancelledError,
  createServerInternalError,
  createUnauthorizedError,
  createUnprocessableEntityError
} from './baseErrors'
import { HTTP_ERROR_CODES } from '../consts'
import { HttpErrorType } from '../types'
import { createHttpError } from './createHttpError'

const errorMap: Record<number, (message?: string, data?: unknown) => HttpErrorType> = {
  [HTTP_ERROR_CODES.BadRequest]: createBadRequestError,
  [HTTP_ERROR_CODES.Unauthorized]: createUnauthorizedError,
  [HTTP_ERROR_CODES.AccessDenied]: createAccessDeniedError,
  [HTTP_ERROR_CODES.NotFound]: createNotFoundError,
  [HTTP_ERROR_CODES.MethodNotAllowed]: createMethodNotAllowedError,
  [HTTP_ERROR_CODES.UnprocessableEntity]: createUnprocessableEntityError,
  [HTTP_ERROR_CODES.RequestCancelled]: createRequestCancelledError,
  [HTTP_ERROR_CODES.ServerInternalError]: createServerInternalError,
  [HTTP_ERROR_CODES.GatewayTimeout]: createGatewayTimeoutError
}

export function mapHttpStatusToError(
  status: number,
  message?: string,
  data?: unknown
): HttpErrorType {
  const createErrorFn = errorMap[status]
  if (createErrorFn) {
    return createErrorFn(message, data)
  }
  return createHttpError(status, message, data)
}
