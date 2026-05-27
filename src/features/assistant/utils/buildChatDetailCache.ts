import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import type {
  ChatDetailEntity,
  ChatMessageRecord,
  SendMessageResponse
} from '@/services/assistantWorkflow/types'

function deriveTitle(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return 'Новый чат'
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed
}

function uiMessageToRecord(msg: ChatMessage, chatId: string): ChatMessageRecord {
  const created_at = new Date(msg.createdAt).toISOString()
  if (msg.role === 'user') {
    return {
      message_id: msg.messageId ?? msg.id,
      chat_id: chatId,
      role: 'user',
      created_at,
      query: msg.text
    }
  }

  const result = msg.result
  return {
    message_id: msg.messageId ?? msg.id,
    chat_id: chatId,
    role: 'assistant',
    created_at,
    feedback: msg.feedback ?? null,
    success: result?.success,
    error: result?.error,
    data: result?.data,
    columns: result?.columns,
    dax: result?.dax,
    interpretation: result?.interpretation ?? msg.text,
    chart_config: result?.chart_config
  }
}

export function buildChatDetailCache(
  chatId: string,
  messages: ChatMessage[],
  lastUserQuery: string
): ChatDetailEntity {
  const now = new Date().toISOString()
  const records = messages.map((m) => uiMessageToRecord(m, chatId))
  const lastAssistant = [...records].reverse().find((m) => m.role === 'assistant')

  let last_query_status: ChatDetailEntity['last_query_status']
  if (lastAssistant?.success) {
    last_query_status = 'success'
  } else if (lastAssistant?.error) {
    last_query_status = 'failed_max'
  }

  return {
    id: chatId,
    title: deriveTitle(lastUserQuery),
    created_at: now,
    updated_at: now,
    message_count: records.length,
    last_query_status,
    messages: records
  }
}

export function buildChatDetailCacheAfterSend(
  result: SendMessageResponse,
  messages: ChatMessage[],
  prompt: string
): ChatDetailEntity {
  return buildChatDetailCache(result.chat_id, messages, prompt)
}
