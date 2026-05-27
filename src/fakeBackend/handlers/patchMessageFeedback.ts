import { patchMessageFeedback as patchFeedbackInRepo } from '@/modules/fakeDb/chatRepo'
import type { PatchMessageFeedbackBody } from '@/services/assistantWorkflow/types'
import type { RequestFeedback } from '@/modules/fakeDb/schema'
import { FakeBackendError } from '../errors'

export function patchMessageFeedback(
  messageId: string,
  body: PatchMessageFeedbackBody
): boolean {
  const feedback = body.feedback as RequestFeedback
  if (feedback !== 'like' && feedback !== 'dislike') {
    throw new FakeBackendError('Некорректное значение feedback', 400)
  }
  const ok = patchFeedbackInRepo(messageId, feedback)
  if (!ok) {
    throw new FakeBackendError('Сообщение не найдено', 404)
  }
  return ok
}
