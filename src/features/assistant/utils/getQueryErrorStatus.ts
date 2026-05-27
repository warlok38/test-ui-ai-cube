import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export function getQueryErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined
  }
  const status = (error as FetchBaseQueryError).status
  return typeof status === 'number' ? status : undefined
}
