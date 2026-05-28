import { listChats } from '@/fakeBackend/db/chatRepo'
import type { ChatEntity } from '@/services/assistantWorkflow/types'

export function getChats(): ChatEntity[] {
  return listChats()
}
