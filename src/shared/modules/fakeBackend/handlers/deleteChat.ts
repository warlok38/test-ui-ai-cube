import { deleteChat as deleteChatFromRepo } from '@/shared/modules/fakeDb/chatRepo'
import type { DeleteChatResponse } from '@/services/assistantWorkflow/types'
import { FakeBackendError } from '../errors'

export function deleteChat(chatId: string): DeleteChatResponse {
  const ok = deleteChatFromRepo(chatId)
  if (!ok) {
    throw new FakeBackendError('Чат не найден', 404)
  }
  return {
    ok: 'true',
    message: 'Чат удалён'
  }
}
