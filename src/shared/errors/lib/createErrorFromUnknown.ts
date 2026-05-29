import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { DEFAULT_ERROR_MESSAGES } from '../consts'
import { HttpErrorType } from '../types'
import { createErrorFromRtkError } from './createErrorFromRtkError'
import { createHttpError } from './createHttpError'

function isFetchBaseQueryErrorLike(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error
}

export function createErrorFromUnknown(error: unknown): HttpErrorType {
  if (isFetchBaseQueryErrorLike(error)) {
    return createErrorFromRtkError(error)
  }

  if (error instanceof Error) {
    return createHttpError(undefined, error.message, undefined, error.stack)
  }

  return createHttpError(undefined, DEFAULT_ERROR_MESSAGES.Default)
}
