import { createErrorFromUnknown } from './createErrorFromUnknown'

export function getHttpErrorStatus(error: unknown): number | undefined {
  const { statusCode } = createErrorFromUnknown(error)
  return typeof statusCode === 'number' ? statusCode : undefined
}
