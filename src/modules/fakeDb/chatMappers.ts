import type {
  ChatDetailEntity,
  ChatEntity,
  ChatMessageRecord,
  MessageChartConfig
} from '@/services/assistantWorkflow/types'
import type { ChatMessageRecordDb, ChatRecord } from './chatSchema'

export function toChatEntity(chat: ChatRecord): ChatEntity {
  return {
    id: chat.id,
    title: chat.title,
    created_at: chat.createdAt,
    updated_at: chat.updatedAt,
    message_count: chat.messageCount,
    last_query_status: chat.lastQueryStatus
  }
}

export function toChatMessageRecord(msg: ChatMessageRecordDb): ChatMessageRecord {
  const base: ChatMessageRecord = {
    message_id: msg.messageId,
    chat_id: msg.chatId,
    role: msg.role,
    created_at: msg.createdAt,
    query: msg.query,
    feedback: msg.feedback ?? null
  }

  if (msg.role === 'assistant') {
    return {
      ...base,
      success: msg.success,
      error: msg.error,
      data: msg.data,
      columns: msg.columns,
      dax: msg.dax,
      interpretation: msg.interpretation,
      chart_config: msg.chartConfig
    }
  }

  return base
}

export function toChatDetailEntity(
  chat: ChatRecord,
  messages: ChatMessageRecordDb[]
): ChatDetailEntity {
  return {
    ...toChatEntity(chat),
    messages: messages
      .filter((m) => m.chatId === chat.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(toChatMessageRecord)
  }
}

export function dbChartToApi(chart?: MessageChartConfig): MessageChartConfig | undefined {
  return chart
}
