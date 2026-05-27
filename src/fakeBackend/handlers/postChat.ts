import { appendRequestLog } from '@/modules/fakeDb/repo'
import { appendMessage, ensureChat } from '@/modules/fakeDb/chatRepo'
import { executeCubeQuery } from '@/modules/fakeApi/executeDax'
import { loadTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
import { toMessageEntity } from '@/modules/fakeDb/chatMappers'
import type { MessageSendParams, SendMessageResponse } from '@/services/assistantWorkflow/types'
import { createId } from '@/utils/createId'
import { registerTask, unregisterTask } from '../taskRegistry'
import { FakeBackendError } from '../errors'

export async function postChat(
  params: MessageSendParams,
  externalSignal?: AbortSignal
): Promise<SendMessageResponse> {
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

  try {
    const chat = ensureChat(params.chat_id, query)
    const settings = loadTechnicalSettings()
    const maxAttempts = params.max_attempts ?? 3
    const startedAt = performance.now()

    const result = await executeCubeQuery(
      { query, max_attempts: maxAttempts },
      settings.scenario,
      controller.signal
    )

    const durationMs = Math.round(performance.now() - startedAt)

    const saved = appendMessage(chat.id, {
      query_text: query,
      dax: result.dax,
      status: result.status,
      attempts_made: result.attempts_made,
      result_row_count: result.result_row_count,
      execution_time_ms: durationMs,
      error_history: result.error_history,
      q_columns: result.q_columns,
      q_data: result.q_data,
      interpretation: result.interpretation,
      chart_config: result.chart_config,
      vote: null,
      voted_at: null
    })

    const message = toMessageEntity(saved)

    appendRequestLog({
      userPrompt: query,
      finalDax: result.dax || null,
      status: result.status ?? 'failed_max',
      attemptsUsed: result.attempts_made ?? maxAttempts,
      retrySummaries:
        result.error_history?.map((entry) =>
          typeof entry === 'string' ? entry : JSON.stringify(entry)
        ) ?? [],
      interpretation: result.interpretation,
      tableRows: result.status === 'success' ? (result.q_data ?? []) : null,
      durationMs,
      feedback: null
    })

    return {
      ...message,
      task_id: taskId
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new FakeBackendError('Запрос отменён', 499)
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
    ) {
      throw new FakeBackendError('Запрос отменён', 499)
    }
    if (error instanceof FakeBackendError) throw error
    if (error instanceof Error && error.message === 'Chat not found') {
      throw new FakeBackendError('Чат не найден', 404)
    }
    throw error
  } finally {
    externalSignal?.removeEventListener('abort', onExternalAbort)
    unregisterTask(taskId)
  }
}
