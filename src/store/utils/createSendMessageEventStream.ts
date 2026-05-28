import type { MessageSendParams } from '@/services/assistantWorkflow/types'
import type { ExecuteQueryStreamEvent } from './sseEvents'
import { streamSendMessageHttpEvents } from './streamSendMessageHttp'

export type CreateSendMessageEventStreamOptions = {
  signal?: AbortSignal
}

function resolveBaseUrl(): string {
  const external = process.env.NEXT_PUBLIC_CUBE_API_URL?.trim()
  return external ?? ''
}

export function createSendMessageEventStream(
  params: MessageSendParams,
  options: CreateSendMessageEventStreamOptions = {}
): AsyncIterable<ExecuteQueryStreamEvent> {
  return streamSendMessageHttpEvents(params, {
    baseUrl: resolveBaseUrl(),
    path: '/api/chats',
    signal: options.signal
  })
}
