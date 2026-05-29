import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { HttpErrorType } from '../types'

export function httpErrorToFetchBaseQueryError(error: HttpErrorType): FetchBaseQueryError {
  const { statusCode, message, data } = error

  if (typeof statusCode === 'number') {
    const payload =
      typeof data === 'object' && data !== null
        ? { ...(data as Record<string, unknown>), message }
        : { message, ...(data !== undefined ? { details: data } : {}) }

    return { status: statusCode, data: payload }
  }

  return {
    status: 'CUSTOM_ERROR' as const,
    error: message,
    data
  }
}
