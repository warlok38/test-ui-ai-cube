import { appendRequestLog } from '@/fakeBackend/db/repo'
import { appendMessage, ensureChat } from '@/fakeBackend/db/chatRepo'
import { streamExecuteQuery } from '@/fakeBackend/api/streamExecuteQuery'
import { loadTechnicalSettings } from '@/fakeBackend/db/technicalSettingsPersistence'
import { toMessageEntity } from '@/fakeBackend/db/chatMappers'
import type {
  CubeQueryResult,
  MessageSendParams,
  SendMessageResponse
} from '@/services/assistantWorkflow/types'
import type { ExecuteQueryStreamEvent } from '@/store/utils/sseEvents'
import { streamTs } from '@/store/utils/sseEvents'
import { createId } from '@/utils/createId'
import { registerTask, unregisterTask } from '../taskRegistry'
import { FakeBackendError } from '../errors'

function isCubeQueryResult(payload: SendMessageResponse | CubeQueryResult): payload is CubeQueryResult {
  return !('chat_id' in payload && typeof payload.chat_id === 'string')
}

export async function* streamPostChat(
  params: MessageSendParams,
  externalSignal?: AbortSignal
): AsyncGenerator<ExecuteQueryStreamEvent> {
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

  const startedAt = performance.now()

  try {
    const settings = loadTechnicalSettings()
    const scenario = params._technical?.scenario ?? settings.scenario
    const streamParams: MessageSendParams = { ...params, task_id: taskId }

    for await (const event of streamExecuteQuery(streamParams, scenario, controller.signal)) {
      if (event.event === 'task') {
        yield { event: 'task', data: { task_id: taskId } }
        continue
      }

      if (event.event === 'result') {
        const cubeResult = isCubeQueryResult(event.data.payload)
          ? event.data.payload
          : (event.data.payload as CubeQueryResult)

        const chat = ensureChat(params.chat_id, query)
        const maxAttempts = params.max_attempts ?? 3
        const durationMs = Math.round(performance.now() - startedAt)

        const saved = appendMessage(chat.id, {
          query_text: query,
          dax: cubeResult.dax,
          status: cubeResult.status,
          attempts_made: cubeResult.attempts_made,
          result_row_count: cubeResult.result_row_count,
          execution_time_ms: durationMs,
          error_history: cubeResult.error_history,
          q_columns: cubeResult.q_columns,
          q_data: cubeResult.q_data,
          interpretation: cubeResult.interpretation,
          chart_config: cubeResult.chart_config,
          vote: null,
          voted_at: null
        })

        const message = toMessageEntity(saved)

        appendRequestLog({
          userPrompt: query,
          finalDax: cubeResult.dax || null,
          status: cubeResult.status ?? 'failed_max',
          attemptsUsed: cubeResult.attempts_made ?? maxAttempts,
          retrySummaries:
            cubeResult.error_history?.map((entry) =>
              typeof entry === 'string' ? entry : JSON.stringify(entry)
            ) ?? [],
          interpretation: cubeResult.interpretation,
          tableRows: cubeResult.status === 'success' ? (cubeResult.q_data ?? []) : null,
          durationMs,
          feedback: null
        })

        const response: SendMessageResponse = {
          ...message,
          task_id: taskId
        }

        yield {
          event: 'result',
          data: {
            type: 'result',
            ts: streamTs(),
            task_id: taskId,
            payload: response
          }
        }
        continue
      }

      yield event
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      yield {
        event: 'error',
        data: {
          type: 'error',
          ts: streamTs(),
          message: 'Запрос отменён',
          code: 'aborted'
        }
      }
      yield { event: 'end', data: {} }
      return
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
    ) {
      yield {
        event: 'error',
        data: {
          type: 'error',
          ts: streamTs(),
          message: 'Запрос отменён',
          code: 'aborted'
        }
      }
      yield { event: 'end', data: {} }
      return
    }
    if (error instanceof FakeBackendError) {
      yield {
        event: 'error',
        data: {
          type: 'error',
          ts: streamTs(),
          message: error.message,
          code: String(error.status)
        }
      }
      yield { event: 'end', data: {} }
      return
    }
    if (error instanceof Error && error.message === 'Chat not found') {
      yield {
        event: 'error',
        data: {
          type: 'error',
          ts: streamTs(),
          message: 'Чат не найден',
          code: '404'
        }
      }
      yield { event: 'end', data: {} }
      return
    }
    throw error
  } finally {
    externalSignal?.removeEventListener('abort', onExternalAbort)
    unregisterTask(taskId)
  }
}
