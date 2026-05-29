import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createHttpError } from './createHttpError'
import { SerializedError } from '@reduxjs/toolkit'
import {
  createAccessDeniedError,
  createBadRequestError,
  createNotFoundError,
  createUnprocessableEntityError,
  createServerInternalError,
  createUnauthorizedError,
  createGatewayTimeoutError
} from './baseErrors'
import { HTTP_ERROR_CODES } from '../consts'
import { HttpErrorType } from '../types'

export const createErrorFromRtkError = (
  error: FetchBaseQueryError | SerializedError
): HttpErrorType => {
  if ('status' in error && typeof error.status === 'number') {
    const status = error.status
    let message
    let errorData: unknown
    if (error.data && typeof error.data === 'object') {
      const dataFromError = error.data as Record<string, unknown>
      if (dataFromError?.message && typeof dataFromError?.message === 'string') {
        message = dataFromError.message
      }
      errorData = dataFromError
    } else if (error.data) {
      errorData = { data: error.data }
    }

    const errorMap: Record<number, (message?: string, data?: unknown) => HttpErrorType> = {
      [HTTP_ERROR_CODES.BadRequest]: createBadRequestError,
      [HTTP_ERROR_CODES.Unauthorized]: createUnauthorizedError,
      [HTTP_ERROR_CODES.AccessDenied]: createAccessDeniedError,
      [HTTP_ERROR_CODES.NotFound]: createNotFoundError,
      [HTTP_ERROR_CODES.UnprocessableEntity]: createUnprocessableEntityError,
      [HTTP_ERROR_CODES.ServerInternalError]: createServerInternalError,
      [HTTP_ERROR_CODES.GatewayTimeout]: createGatewayTimeoutError
    }

    if (errorMap[status]) {
      const createErrorFn = errorMap[status]
      return createErrorFn(message, errorData)
    }

    return createHttpError(status, message, errorData)
  }

  if ('status' in error) {
    return createHttpError(error.status, error.error, error.data)
  }

  return createHttpError(error.code, error.message, undefined, error.stack)
}
