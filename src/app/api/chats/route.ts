import { getChats } from '@/fakeBackend/handlers/getChats'
import { streamPostChat } from '@/fakeBackend/handlers/streamPostChat'
import { FakeBackendError } from '@/fakeBackend/errors'
import { handleFakeBackendError } from '@/fakeBackend/http'
import type { MessageSendParams } from '@/services/assistantWorkflow/types'
import { encodeSseEvent } from '@/store/utils/encodeSseEvent'

export async function GET() {
  try {
    const data = getChats()
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MessageSendParams
    const accept = request.headers.get('accept') ?? ''

    if (!accept.includes('text/event-stream')) {
      throw new FakeBackendError('Accept: text/event-stream required', 406)
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of streamPostChat(body, request.signal)) {
            controller.enqueue(encoder.encode(encodeSseEvent(event)))
            if (event.event === 'end' || event.event === 'error') {
              if (event.event === 'error') {
                controller.enqueue(encoder.encode(encodeSseEvent({ event: 'end', data: {} })))
              }
              break
            }
          }
        } catch (error) {
          if (error instanceof FakeBackendError) {
            const message = error.message
            controller.enqueue(
              encoder.encode(
                encodeSseEvent({
                  event: 'error',
                  data: { type: 'error', ts: new Date().toISOString(), message }
                })
              )
            )
            controller.enqueue(encoder.encode(encodeSseEvent({ event: 'end', data: {} })))
          } else if (
            !(error instanceof DOMException && error.name === 'AbortError')
          ) {
            controller.enqueue(
              encoder.encode(
                encodeSseEvent({
                  event: 'error',
                  data: {
                    type: 'error',
                    ts: new Date().toISOString(),
                    message: error instanceof Error ? error.message : 'Сбой выполнения запроса'
                  }
                })
              )
            )
            controller.enqueue(encoder.encode(encodeSseEvent({ event: 'end', data: {} })))
          }
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
