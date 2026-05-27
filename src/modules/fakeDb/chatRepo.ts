import type {
  ChatDetailEntity,
  ChatEntity,
  ChatMessageRecord,
  MessageEntity
} from '@/services/assistantWorkflow/types'
import type { RequestFeedback, RequestLogStatus } from './schema'
import chatsSeed from './chatsSeed.json'
import type { ChatMessageRecordDb, ChatRecord, ChatsDbSnapshot } from './chatSchema'
import { loadChatsFromStorage, saveChatsToStorage } from './chatPersistence'
import { toChatDetailEntity, toChatEntity, toChatMessageRecord } from './chatMappers'
import { createId } from '@/utils/createId'

let memorySnapshot: ChatsDbSnapshot | null = null

function hydrate(): ChatsDbSnapshot {
  if (memorySnapshot) return memorySnapshot
  const raw = loadChatsFromStorage()
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ChatsDbSnapshot
      if (Array.isArray(parsed.chats) && Array.isArray(parsed.messages)) {
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

export function appendUserMessage(chatId: string, query: string): ChatMessageRecordDb {
  const snapshot = hydrate()
  const chatIdx = snapshot.chats.findIndex((c) => c.id === chatId)
  if (chatIdx === -1) throw new Error('Chat not found')

  const msg: ChatMessageRecordDb = {
    messageId: createId(),
    chatId,
    role: 'user',
    createdAt: new Date().toISOString(),
    query
  }

  const chats = [...snapshot.chats]
  const chat = { ...chats[chatIdx] }
  chat.messageCount += 1
  chat.updatedAt = msg.createdAt
  chats[chatIdx] = chat

  persist({
    chats,
    messages: [...snapshot.messages, msg]
  })
  return msg
}

export function appendAssistantMessage(
  chatId: string,
  payload: Omit<MessageEntity, 'chat_id' | 'message_id'>
): ChatMessageRecordDb {
  const snapshot = hydrate()
  const chatIdx = snapshot.chats.findIndex((c) => c.id === chatId)
  if (chatIdx === -1) throw new Error('Chat not found')

  const msg: ChatMessageRecordDb = {
    messageId: createId(),
    chatId,
    role: 'assistant',
    createdAt: new Date().toISOString(),
    success: payload.success,
    error: payload.error,
    data: payload.data,
    columns: payload.columns,
    dax: payload.dax,
    interpretation: payload.interpretation,
    chartConfig: payload.chart_config,
    feedback: null
  }

  let status: RequestLogStatus = 'failed_max'
  if (payload.success) {
    status = 'success'
  } else if (payload.interpretation.includes('недоступен')) {
    status = 'server_unreachable'
  }

  const chats = [...snapshot.chats]
  const chat = { ...chats[chatIdx] }
  chat.messageCount += 1
  chat.updatedAt = msg.createdAt
  chat.lastQueryStatus = status
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

export function patchMessageFeedback(messageId: string, feedback: RequestFeedback): boolean {
  const snapshot = hydrate()
  const idx = snapshot.messages.findIndex((m) => m.messageId === messageId)
  if (idx === -1) return false
  const messages = [...snapshot.messages]
  messages[idx] = { ...messages[idx], feedback }
  persist({ ...snapshot, messages })
  return true
}

export function getMessageById(messageId: string): ChatMessageRecord | null {
  const snapshot = hydrate()
  const msg = snapshot.messages.find((m) => m.messageId === messageId)
  return msg ? toChatMessageRecord(msg) : null
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
