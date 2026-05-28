import { getChatById as getChatFromRepo } from '@/fakeBackend/db/chatRepo'
import type { ChatDetailEntity } from '@/services/assistantWorkflow/types'
import { FakeBackendError } from '../errors'

export function getChatById(chatId: string): ChatDetailEntity {
  const chat = getChatFromRepo(chatId)
  if (!chat) {
    throw new FakeBackendError('Чат не найден', 404)
  }
  return chat
}
