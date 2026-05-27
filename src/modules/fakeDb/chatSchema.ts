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

export type ChatMessageRecordDb = {
  messageId: string
  chatId: string
  role: 'user' | 'assistant'
  createdAt: string
  query?: string
  feedback?: RequestFeedback | null
  success?: boolean
  error?: boolean
  data?: MessageDataRow[]
  columns?: string[]
  dax?: string
  interpretation?: string
  chartConfig?: MessageChartConfig
}

export type ChatsDbSnapshot = {
  chats: ChatRecord[]
  messages: ChatMessageRecordDb[]
}
