import type { AssistantUiState, ChatMessage } from '@/features/assistant/model/assistantSlice'

export type VisibleChatState = {
  messages: ChatMessage[]
  isEmpty: boolean
}

export function getVisibleChatState(
  routeChatId: string | undefined,
  assistant: AssistantUiState
): VisibleChatState {
  const hasMessages = assistant.messages.length > 0

  if (routeChatId && assistant.activeChatId !== routeChatId && !hasMessages) {
    return { messages: [], isEmpty: true }
  }

  return {
    messages: assistant.messages,
    isEmpty: !hasMessages
  }
}
