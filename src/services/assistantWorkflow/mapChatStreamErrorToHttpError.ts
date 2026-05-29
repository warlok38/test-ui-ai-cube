import { createHttpError, mapHttpStatusToError, type HttpErrorType } from '@/shared/errors'
import { ChatStreamError } from './consumeChatStream'

export function mapChatStreamErrorToHttpError(error: ChatStreamError): HttpErrorType {
  if (typeof error.code === 'number') {
    return mapHttpStatusToError(error.code, error.message, error.entity)
  }
  return createHttpError(undefined, error.message, error.entity)
}
