import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import type { ChatDetailEntity, MessageEntity } from '@/services/assistantWorkflow/types'

function deriveTitle(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return 'Новый чат'
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed
}

export function buildChatDetailCache(
  chatId: string,
  messages: ChatMessage[],
  lastUserQuery: string
): ChatDetailEntity {
  const now = new Date().toISOString()
  const lastMessage = messages.at(-1)

  return {
    id: chatId,
    title: deriveTitle(lastUserQuery),
    created_at: now,
    updated_at: now,
    message_count: messages.length,
    last_query_status: lastMessage?.status ?? undefined,
    messages
  }
}

export function buildChatDetailCacheAfterSend(
  result: MessageEntity,
  messages: ChatMessage[],
  prompt: string
): ChatDetailEntity {
  return buildChatDetailCache(result.chat_id, messages, prompt)
}
