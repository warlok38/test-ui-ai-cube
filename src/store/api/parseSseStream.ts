import type { ExecuteQueryStreamEvent, SseEventName } from './sseEvents'
import { isExecuteQueryStreamEvent } from './sseEvents'

type ParsedSseFrame = {
  event?: string
  data?: string
}

function parseSseFrame(block: string): ParsedSseFrame {
  const frame: ParsedSseFrame = {}
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      frame.event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      const chunk = line.slice(5).trimStart()
      frame.data = frame.data ? `${frame.data}\n${chunk}` : chunk
    }
  }
  return frame
}

function toStreamEvent(frame: ParsedSseFrame): ExecuteQueryStreamEvent | null {
  const eventName = frame.event as SseEventName | undefined
  if (!eventName) return null

  if (eventName === 'end') {
    return { event: 'end', data: {} }
  }

  if (!frame.data) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(frame.data)
  } catch {
    return null
  }

  const candidate = { event: eventName, data: parsed }
  if (!isExecuteQueryStreamEvent(candidate)) {
    return null
  }

  return candidate
}

/**
 * Reads an SSE response body and invokes `onEvent` for each parsed frame.
 * Use with `fetch` + `response.body.getReader()` when connecting to FastAPI.
 */
export async function parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: ExecuteQueryStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''

  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read()
    if (done) return

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const streamEvent = toStreamEvent(parseSseFrame(trimmed))
      if (streamEvent) {
        onEvent(streamEvent)
      }
    }

    await pump()
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  const onAbort = () => {
    void reader.cancel()
  }
  signal?.addEventListener('abort', onAbort)

  try {
    await pump()
    if (buffer.trim()) {
      const streamEvent = toStreamEvent(parseSseFrame(buffer.trim()))
      if (streamEvent) {
        onEvent(streamEvent)
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}
