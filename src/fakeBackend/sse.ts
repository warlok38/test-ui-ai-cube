import type { ChatStreamEvent } from '@/services/assistantWorkflow/types'

export function formatSseEvent(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export function createSseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}

export function encodeSseChunk(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(formatSseEvent(event))
}
