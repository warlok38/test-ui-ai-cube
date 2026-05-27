import type { ChatDetailEntity, ChatEntity, MessageEntity } from '@/services/assistantWorkflow/types'
import type { ChatRecord, MessageRecordDb } from './chatSchema'

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

export function toMessageEntity(msg: MessageRecordDb): MessageEntity {
  return {
    id: msg.id,
    chat_id: msg.chatId,
    prev_id: msg.prevId,
    query_text: msg.queryText,
    dax: msg.dax,
    status: msg.status,
    attempts_made: msg.attemptsMade,
    result_row_count: msg.resultRowCount,
    execution_time_ms: msg.executionTimeMs,
    error_history: msg.errorHistory,
    q_columns: msg.qColumns,
    q_data: msg.qData,
    interpretation: msg.interpretation,
    chart_config: msg.chartConfig,
    vote: msg.vote,
    voted_at: msg.votedAt,
    created_at: msg.createdAt
  }
}

/** @deprecated Use toMessageEntity */
export const toChatMessageRecord = toMessageEntity

export function toChatDetailEntity(
  chat: ChatRecord,
  messages: MessageRecordDb[]
): ChatDetailEntity {
  return {
    ...toChatEntity(chat),
    messages: messages
      .filter((m) => m.chatId === chat.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(toMessageEntity)
  }
}
