import { appendRequestLog } from '@/modules/fakeDb/repo'
import { appendAssistantMessage, appendUserMessage, ensureChat } from '@/modules/fakeDb/chatRepo'
import { executeCubeQuery } from '@/modules/fakeApi/executeDax'
import { loadTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
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
    appendUserMessage(chat.id, query)

    const settings = loadTechnicalSettings()
    const maxAttempts = params.max_attempts ?? 3
    const startedAt = performance.now()

    const result = await executeCubeQuery(
      { query, max_attempts: maxAttempts },
      settings.scenario,
      controller.signal
    )

    const assistantMsg = appendAssistantMessage(chat.id, {
      success: result.success,
      error: result.error,
      data: result.data,
      columns: result.columns,
      dax: result.dax,
      interpretation: result.interpretation,
      chart_config: result.chart_config
    })

    const durationMs = Math.round(performance.now() - startedAt)
    let status: 'success' | 'server_unreachable' | 'failed_max' = 'failed_max'
    if (result.success) {
      status = 'success'
    } else if (settings.scenario === 'server_unreachable') {
      status = 'server_unreachable'
    }

    appendRequestLog({
      userPrompt: query,
      finalDax: result.dax || null,
      status,
      attemptsUsed: result.success ? 1 : maxAttempts,
      retrySummaries: result.error ? [result.interpretation] : [],
      interpretation: result.interpretation,
      tableRows: result.success ? result.data : null,
      durationMs,
      feedback: null
    })

    return {
      ...result,
      chat_id: chat.id,
      message_id: assistantMsg.messageId,
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
