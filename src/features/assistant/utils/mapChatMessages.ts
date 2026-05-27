import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import type { MessageEntity } from '@/services/assistantWorkflow/types'

export function mapChatRecordsToUiMessages(records: MessageEntity[]): ChatMessage[] {
  return records
}
