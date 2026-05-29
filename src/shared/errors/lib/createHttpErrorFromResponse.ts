import { HttpErrorType } from '../types'
import { mapHttpStatusToError } from './mapHttpStatusToError'

function extractErrorMessageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined

  const record = body as Record<string, unknown>
  if (typeof record.error === 'string') return record.error
  if (typeof record.message === 'string') return record.message

  return undefined
}

export async function createHttpErrorFromResponse(response: Response): Promise<HttpErrorType> {
  let body: unknown
  let message: string | undefined

  try {
    body = await response.json()
    message = extractErrorMessageFromBody(body)
  } catch {
    // non-JSON body
  }

  return mapHttpStatusToError(response.status, message, body)
}
