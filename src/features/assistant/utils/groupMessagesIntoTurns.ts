import type { ChatMessage } from '@/features/assistant/model/assistantSlice'

export type ChatTurn = {
  userMessage: ChatMessage
  assistantMessages: ChatMessage[]
}

export function groupMessagesIntoTurns(messages: ChatMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = []

  for (const message of messages) {
    if (message.role === 'user') {
      turns.push({ userMessage: message, assistantMessages: [] })
      continue
    }

    const currentTurn = turns.at(-1)
    if (currentTurn) {
      currentTurn.assistantMessages.push(message)
    }
  }

  return turns
}
