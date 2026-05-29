import { appendRequestLog } from '@/shared/modules/fakeDb/repo'
import { appendMessage } from '@/shared/modules/fakeDb/chatRepo'
import { toMessageEntity } from '@/shared/modules/fakeDb/chatMappers'
import type { CubeQueryResult, MessageEntity } from '@/services/assistantWorkflow/types'

export function persistChatMessage(
  chatId: string,
  query: string,
  result: CubeQueryResult,
  durationMs: number
): MessageEntity {
  const saved = appendMessage(chatId, {
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
    attemptsUsed: result.attempts_made ?? 1,
    retrySummaries:
      result.error_history?.map((entry) =>
        typeof entry === 'string' ? entry : JSON.stringify(entry)
      ) ?? [],
    interpretation: result.interpretation,
    tableRows: result.status === 'success' ? (result.q_data ?? []) : null,
    durationMs,
    feedback: null
  })

  return message
}
