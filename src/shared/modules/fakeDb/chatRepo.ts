import type { ChatDetailEntity, ChatEntity, MessageEntity } from '@/services/assistantWorkflow/types'
import type { RequestFeedback } from './schema'
import chatsSeed from './chatsSeed.json'
import type { ChatRecord, ChatsDbSnapshot, MessageRecordDb } from './chatSchema'
import { isLegacyChatsSnapshot } from './chatSchema'
import { loadChatsFromStorage, saveChatsToStorage } from './chatPersistence'
import { toChatDetailEntity, toChatEntity, toMessageEntity } from './chatMappers'
import { createId } from '@/shared/utils/createId'

let memorySnapshot: ChatsDbSnapshot | null = null

function hydrate(): ChatsDbSnapshot {
  if (memorySnapshot) return memorySnapshot
  const raw = loadChatsFromStorage()
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ChatsDbSnapshot
      if (
        Array.isArray(parsed.chats) &&
        Array.isArray(parsed.messages) &&
        !isLegacyChatsSnapshot(parsed)
      ) {
        memorySnapshot = parsed
        return memorySnapshot
      }
    } catch {
      // fall through to seed
    }
  }
  const seed = chatsSeed as ChatsDbSnapshot
  memorySnapshot = {
    chats: seed.chats.map((c) => ({ ...c })),
    messages: seed.messages.map((m) => ({ ...m }))
  }
  persist(memorySnapshot)
  return memorySnapshot
}

function persist(snapshot: ChatsDbSnapshot): void {
  memorySnapshot = snapshot
  saveChatsToStorage(JSON.stringify(snapshot))
}

function deriveTitle(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return 'Новый чат'
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed
}

function getLastMessageInChat(snapshot: ChatsDbSnapshot, chatId: string): MessageRecordDb | undefined {
  return [...snapshot.messages]
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)
}

export function listChats(): ChatEntity[] {
  const { chats } = hydrate()
  return [...chats]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toChatEntity)
}

export function getChatById(chatId: string): ChatDetailEntity | null {
  const snapshot = hydrate()
  const chat = snapshot.chats.find((c) => c.id === chatId)
  if (!chat) return null
  const messages = snapshot.messages.filter((m) => m.chatId === chatId)
  return toChatDetailEntity(chat, messages)
}

export function createChat(title: string): ChatRecord {
  const snapshot = hydrate()
  const now = new Date().toISOString()
  const chat: ChatRecord = {
    id: createId(),
    title: title.trim() || 'Новый чат',
    createdAt: now,
    updatedAt: now,
    messageCount: 0
  }
  persist({
    chats: [chat, ...snapshot.chats],
    messages: snapshot.messages
  })
  return chat
}

export type AppendMessagePayload = Omit<MessageEntity, 'id' | 'chat_id' | 'prev_id' | 'created_at'> & {
  id?: string | null
  prev_id?: string | null
  created_at?: string
}

export function appendMessage(chatId: string, payload: AppendMessagePayload): MessageRecordDb {
  const snapshot = hydrate()
  const chatIdx = snapshot.chats.findIndex((c) => c.id === chatId)
  if (chatIdx === -1) throw new Error('Chat not found')

  const prevMessage = getLastMessageInChat(snapshot, chatId)
  const now = payload.created_at ?? new Date().toISOString()

  const msg: MessageRecordDb = {
    id: payload.id ?? createId(),
    chatId,
    prevId: payload.prev_id ?? prevMessage?.id ?? null,
    queryText: payload.query_text,
    dax: payload.dax,
    status: payload.status,
    attemptsMade: payload.attempts_made,
    resultRowCount: payload.result_row_count,
    executionTimeMs: payload.execution_time_ms,
    errorHistory: payload.error_history,
    qColumns: payload.q_columns,
    qData: payload.q_data,
    interpretation: payload.interpretation,
    chartConfig: payload.chart_config,
    vote: payload.vote ?? null,
    votedAt: payload.voted_at ?? null,
    createdAt: now
  }

  const chats = [...snapshot.chats]
  const chat = { ...chats[chatIdx] }
  chat.messageCount += 1
  chat.updatedAt = now
  if (payload.status) {
    chat.lastQueryStatus = payload.status
  }
  chats[chatIdx] = chat

  persist({
    chats,
    messages: [...snapshot.messages, msg]
  })
  return msg
}

export function ensureChat(chatId: string | undefined, query: string): ChatRecord {
  if (chatId) {
    const snapshot = hydrate()
    const existing = snapshot.chats.find((c) => c.id === chatId)
    if (!existing) throw new Error('Chat not found')
    return existing
  }
  return createChat(deriveTitle(query))
}

export function deleteChat(chatId: string): boolean {
  const snapshot = hydrate()
  const exists = snapshot.chats.some((c) => c.id === chatId)
  if (!exists) return false
  persist({
    chats: snapshot.chats.filter((c) => c.id !== chatId),
    messages: snapshot.messages.filter((m) => m.chatId !== chatId)
  })
  return true
}

export function patchMessageVote(messageId: string, vote: RequestFeedback): boolean {
  const snapshot = hydrate()
  const idx = snapshot.messages.findIndex((m) => m.id === messageId)
  if (idx === -1) return false
  const messages = [...snapshot.messages]
  messages[idx] = {
    ...messages[idx],
    vote,
    votedAt: new Date().toISOString()
  }
  persist({ ...snapshot, messages })
  return true
}

export function getMessageById(messageId: string): MessageEntity | null {
  const snapshot = hydrate()
  const msg = snapshot.messages.find((m) => m.id === messageId)
  return msg ? toMessageEntity(msg) : null
}

/** Для модульных тестов — сброс в seed. */
export function resetChatsDb(): void {
  const seed = chatsSeed as ChatsDbSnapshot
  memorySnapshot = {
    chats: seed.chats.map((c) => ({ ...c })),
    messages: seed.messages.map((m) => ({ ...m }))
  }
  persist(memorySnapshot)
}
