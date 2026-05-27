import { listChats } from '@/modules/fakeDb/chatRepo'
import type { ChatEntity } from '@/services/assistantWorkflow/types'

export function getChats(): ChatEntity[] {
  return listChats()
}
