import { ensureChat } from '@/modules/fakeDb/chatRepo'
import { executeCubeQuery } from '@/modules/fakeApi/executeDax'
import { loadTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
import type {
  ChatStreamEvent,
  ErrorEntity,
  MessageSendParams
} from '@/services/assistantWorkflow/types'
import { createId } from '@/utils/createId'
import { createSseResponse, encodeSseChunk } from '../sse'
import { FakeBackendError } from '../errors'
import { registerTask, unregisterTask } from '../taskRegistry'
import { persistChatMessage } from './persistChatMessage'

const HEARTBEAT_INTERVAL_MS = 12_000

function createStreamEvent(
  event: ChatStreamEvent['event'],
  overrides?: Partial<Omit<ChatStreamEvent, 'event' | 'id' | 'timestamp'>>
): ChatStreamEvent {
  return {
    event,
    id: `evt_${createId()}`,
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  )
}

function toErrorEntity(error: unknown): ErrorEntity {
  if (error instanceof FakeBackendError) {
    return {
      type: 'backend',
      code: error.status,
      message: error.message,
      details: null
    }
  }
  if (isAbortError(error)) {
    return {
      type: 'cancelled',
      code: 499,
      message: 'Запрос отменён',
      details: null
    }
  }
  if (error instanceof Error && error.message === 'Chat not found') {
    return {
      type: 'not_found',
      code: 404,
      message: 'Чат не найден',
      details: null
    }
  }
  const message = error instanceof Error ? error.message : 'Внутренняя ошибка'
  return {
    type: 'internal',
    code: 500,
    message,
    details: null
  }
}

export function postChatStream(params: MessageSendParams, externalSignal?: AbortSignal): Response {
  const query = params.query?.trim() ?? ''
  if (!query) {
    throw new FakeBackendError('Поле query обязательно', 400)
  }

  const taskId = params.task_id ?? createId()
  const controller = registerTask(taskId)

  const onExternalAbort = () => {
    controller.abort()
    unregisterTask(taskId)
  }
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true })

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      const enqueue = (event: ChatStreamEvent) => {
        streamController.enqueue(encodeSseChunk(event))
      }

      const emitErrorAndEnd = (error: unknown) => {
        const entity = toErrorEntity(error)
        enqueue(
          createStreamEvent('error', {
            message: entity.message,
            data: entity
          })
        )
        enqueue(createStreamEvent('end'))
        streamController.close()
      }

      let heartbeatTimer: ReturnType<typeof setInterval> | null = null

      const startHeartbeat = () => {
        stopHeartbeat()
        heartbeatTimer = setInterval(() => {
          enqueue(
            createStreamEvent('heartbeat', {
              message: 'Выполнение запроса…'
            })
          )
        }, HEARTBEAT_INTERVAL_MS)
      }

      const stopHeartbeat = () => {
        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer)
          heartbeatTimer = null
        }
      }

      try {
        enqueue(
          createStreamEvent('task', {
            message: 'Запрос принят',
            data: { task_id: taskId }
          })
        )

        enqueue(
          createStreamEvent('ack', {
            message: 'Запрос принят пайплайном'
          })
        )

        enqueue(
          createStreamEvent('progress', {
            message: 'Проверка доступности OLAP'
          })
        )

        const chat = ensureChat(params.chat_id, query)
        const settings = loadTechnicalSettings()
        const startedAt = performance.now()

        startHeartbeat()

        const result = await executeCubeQuery(
          { query },
          settings.scenario,
          controller.signal,
          (message) => {
            enqueue(createStreamEvent('progress', { message }))
          }
        )

        stopHeartbeat()

        const durationMs = Math.round(performance.now() - startedAt)
        const message = persistChatMessage(chat.id, query, result, durationMs)

        enqueue(
          createStreamEvent('result', {
            message: 'Запрос выполнен',
            data: message
          })
        )
        enqueue(createStreamEvent('end'))
        streamController.close()
      } catch (error) {
        stopHeartbeat()
        emitErrorAndEnd(error)
      } finally {
        externalSignal?.removeEventListener('abort', onExternalAbort)
        unregisterTask(taskId)
      }
    }
  })

  return createSseResponse(stream)
}
