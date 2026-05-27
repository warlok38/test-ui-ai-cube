import type { ChatMessage } from '@/features/assistant/model/assistantSlice'

export type ChatTurn = {
  message: ChatMessage
}

export function groupMessagesIntoTurns(messages: ChatMessage[]): ChatTurn[] {
  return messages.map((message) => ({ message }))
}
