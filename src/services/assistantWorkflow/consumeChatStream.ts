import type {
  ChatStreamEvent,
  ErrorEntity,
  MessageEntity,
  MessageSendParams
} from './types'

export type ConsumeChatStreamOptions = {
  signal?: AbortSignal
  onEvent?: (event: ChatStreamEvent) => void
}

export class ChatStreamError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly entity?: ErrorEntity
  ) {
    super(message)
    this.name = 'ChatStreamError'
  }
}

function parseSseDataLine(line: string): ChatStreamEvent | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null

  const payload = trimmed.slice(5).trim()
  if (!payload || payload === '[DONE]') return null

  try {
    return JSON.parse(payload) as ChatStreamEvent
  } catch {
    return null
  }
}

function parseSseChunk(chunk: string): ChatStreamEvent[] {
  const events: ChatStreamEvent[] = []
  const blocks = chunk.split('\n\n')

  for (const block of blocks) {
    const lines = block.split('\n')
    for (const line of lines) {
      const event = parseSseDataLine(line)
      if (event) events.push(event)
    }
  }

  return events
}

function isEventStreamResponse(response: Response): boolean {
  const contentType = response.headers.get('Content-Type') ?? ''
  return contentType.includes('text/event-stream')
}

async function readHttpError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export async function consumeChatStream(
  params: MessageSendParams,
  options: ConsumeChatStreamOptions = {}
): Promise<MessageEntity> {
  const { signal, onEvent } = options

  const response = await fetch('/api/chats/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(params),
    signal
  })

  if (!response.ok) {
    throw new ChatStreamError(await readHttpError(response), response.status)
  }

  if (!isEventStreamResponse(response)) {
    throw new ChatStreamError('Ожидался поток SSE', response.status)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new ChatStreamError('Пустой ответ сервера')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let resultMessage: MessageEntity | null = null
  let streamError: ChatStreamError | null = null

  const handleEvent = (event: ChatStreamEvent) => {
    onEvent?.(event)

    if (event.event === 'result' && event.data && 'chat_id' in event.data) {
      resultMessage = event.data as MessageEntity
    }

    if (event.event === 'error' && event.data && 'code' in event.data) {
      const entity = event.data as ErrorEntity
      streamError = new ChatStreamError(entity.message, entity.code, entity)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lastDelimiter = buffer.lastIndexOf('\n\n')
      if (lastDelimiter === -1) continue

      const complete = buffer.slice(0, lastDelimiter + 2)
      buffer = buffer.slice(lastDelimiter + 2)

      for (const event of parseSseChunk(complete)) {
        handleEvent(event)
        if (streamError) throw streamError
      }
    }

    if (buffer.trim()) {
      for (const event of parseSseChunk(buffer)) {
        handleEvent(event)
        if (streamError) throw streamError
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (streamError) throw streamError

  if (!resultMessage) {
    throw new ChatStreamError('Поток завершён без результата')
  }

  return resultMessage
}
