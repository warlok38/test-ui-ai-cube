import type { RequestFeedback, RequestLogStatus } from './schema'
import type { MessageChartConfig, MessageDataRow } from '@/services/assistantWorkflow/types'

export type ChatRecord = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastQueryStatus?: RequestLogStatus
}

export type MessageRecordDb = {
  id: string
  chatId: string
  prevId: string | null
  queryText: string
  dax: string | null
  status: RequestLogStatus | null
  attemptsMade: number | null
  resultRowCount: number | null
  executionTimeMs: number | null
  errorHistory: unknown[] | null
  qColumns: string[] | null
  qData: MessageDataRow[] | null
  interpretation: string | null
  chartConfig: MessageChartConfig | null
  vote: RequestFeedback | null
  votedAt: string | null
  createdAt: string
}

/** @deprecated Use MessageRecordDb */
export type ChatMessageRecordDb = MessageRecordDb

export type ChatsDbSnapshot = {
  chats: ChatRecord[]
  messages: MessageRecordDb[]
}

function isLegacyMessageRecord(value: unknown): value is { role?: string } {
  return typeof value === 'object' && value !== null && 'role' in value
}

export function isLegacyChatsSnapshot(snapshot: ChatsDbSnapshot): boolean {
  return snapshot.messages.some(isLegacyMessageRecord)
}
