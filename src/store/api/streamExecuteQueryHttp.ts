import { omitTechnicalParams } from './omitTechnicalParams'
import { parseSseStream } from './parseSseStream'
import type { ExecuteQueryStreamEvent } from './sseEvents'
import type { CubeQueryParams } from '@/services/assistantWorkflow/types'

const DEFAULT_EXECUTE_PATH = '/api/cube/execute'

export type StreamExecuteQueryHttpOptions = {
  baseUrl?: string
  path?: string
  signal?: AbortSignal
}

/**
 * HTTP SSE transport: yields the same events as the fake in-process stream.
 */
export async function* streamExecuteQueryHttpEvents(
  params: CubeQueryParams,
  options: StreamExecuteQueryHttpOptions = {}
): AsyncGenerator<ExecuteQueryStreamEvent> {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_CUBE_API_URL
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_CUBE_API_URL is not set')
  }

  const url = `${baseUrl.replace(/\/$/, '')}${options.path ?? DEFAULT_EXECUTE_PATH}`
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
    throw new Error(`executeQuery failed: HTTP ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('executeQuery failed: response body is not readable')
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
