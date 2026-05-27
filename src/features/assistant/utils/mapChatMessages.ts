import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import type { ChatMessageRecord } from '@/services/assistantWorkflow/types'
import { createId } from '@/utils/createId'

export function mapChatRecordsToUiMessages(records: ChatMessageRecord[]): ChatMessage[] {
  return records.map((record) => {
    if (record.role === 'user') {
      return {
        id: record.message_id,
        role: 'user',
        text: record.query ?? '',
        createdAt: new Date(record.created_at).getTime(),
        messageId: record.message_id
      }
    }

    return {
      id: record.message_id,
      role: 'assistant',
      text: record.interpretation ?? '',
      createdAt: new Date(record.created_at).getTime(),
      messageId: record.message_id,
      feedback: record.feedback ?? null,
      result:
        record.success !== undefined
          ? {
              success: record.success ?? false,
              error: record.error ?? true,
              data: record.data ?? [],
              columns: record.columns ?? [],
              dax: record.dax ?? '',
              interpretation: record.interpretation ?? '',
              chart_config: record.chart_config ?? {
                chart_type: 'bar',
                x_axis: '',
                y_axis: '',
                title: '',
                series: ''
              },
              chat_id: record.chat_id,
              message_id: record.message_id
            }
          : null
    }
  })
}

export function createOptimisticUserMessage(text: string): ChatMessage {
  const id = createId()
  return {
    id,
    role: 'user',
    text,
    createdAt: Date.now()
  }
}
