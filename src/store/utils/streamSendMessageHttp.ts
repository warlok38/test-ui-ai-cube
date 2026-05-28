import { omitTechnicalParams } from './omitTechnicalParams'
import { parseSseStream } from './parseSseStream'
import type { ExecuteQueryStreamEvent } from './sseEvents'
import type { MessageSendParams } from '@/services/assistantWorkflow/types'

const DEFAULT_SEND_MESSAGE_PATH = '/api/chats'

export type StreamSendMessageHttpOptions = {
  baseUrl?: string
  path?: string
  signal?: AbortSignal
}

/**
 * HTTP SSE transport for sendMessage: POST /api/chats with Accept: text/event-stream.
 */
export async function* streamSendMessageHttpEvents(
  params: MessageSendParams,
  options: StreamSendMessageHttpOptions = {}
): AsyncGenerator<ExecuteQueryStreamEvent> {
  const baseUrl = options.baseUrl ?? ''
  const path = options.path ?? DEFAULT_SEND_MESSAGE_PATH
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(omitTechnicalParams(params)),
    signal: options.signal
  })

  if (!response.ok) {
    throw new Error(`sendMessage failed: HTTP ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('sendMessage failed: response body is not readable')
  }

  const queue: ExecuteQueryStreamEvent[] = []
  let notify: (() => void) | null = null
  let parseDone = false
  let parseError: Error | null = null

  const wake = () => {
    notify?.()
    notify = null
  }

  const parseTask = parseSseStream(
    reader,
    (streamEvent) => {
      queue.push(streamEvent)
      wake()
    },
    options.signal
  )
    .then(() => {
      parseDone = true
      wake()
    })
    .catch((error: unknown) => {
      parseError = error instanceof Error ? error : new Error(String(error))
      parseDone = true
      wake()
    })

  try {
    while (true) {
      if (parseError) {
        throw parseError
      }

      const streamEvent = queue.shift()
      if (streamEvent) {
        yield streamEvent
        continue
      }

      if (parseDone) {
        break
      }

      await new Promise<void>((resolve) => {
        notify = resolve
      })
    }
  } finally {
    await parseTask.catch(() => undefined)
  }
}
