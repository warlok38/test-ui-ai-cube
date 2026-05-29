import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createHttpError } from './createHttpError'
import { SerializedError } from '@reduxjs/toolkit'
import { HttpErrorType } from '../types'
import { mapHttpStatusToError } from './mapHttpStatusToError'

export const createErrorFromRtkError = (
  error: FetchBaseQueryError | SerializedError
): HttpErrorType => {
  if ('status' in error && typeof error.status === 'number') {
    const status = error.status
    let message: string | undefined
    let errorData: unknown
    if (error.data && typeof error.data === 'object') {
      const dataFromError = error.data as Record<string, unknown>
      if (dataFromError?.message && typeof dataFromError?.message === 'string') {
        message = dataFromError.message
      } else if (dataFromError?.error && typeof dataFromError?.error === 'string') {
        message = dataFromError.error
      }
      errorData = dataFromError
    } else if (error.data) {
      errorData = { data: error.data }
    }

    return mapHttpStatusToError(status, message, errorData)
  }

  if ('status' in error) {
    return createHttpError(error.status, error.error, error.data)
  }

  return createHttpError(error.code, error.message, undefined, error.stack)
}
