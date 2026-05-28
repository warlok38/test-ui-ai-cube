import { patchMessageVote as patchVoteInRepo } from '@/fakeBackend/db/chatRepo'
import type { PatchMessageVoteBody, PatchMessageVoteResponse } from '@/services/assistantWorkflow/types'
import type { RequestFeedback } from '@/fakeBackend/db/schema'
import { FakeBackendError } from '../errors'

export function postChatVote(body: PatchMessageVoteBody): PatchMessageVoteResponse {
  const vote = body.vote as RequestFeedback
  if (vote !== 'like' && vote !== 'dislike') {
    throw new FakeBackendError('Некорректное значение vote', 400)
  }
  if (!body.message_id?.trim()) {
    throw new FakeBackendError('Поле message_id обязательно', 400)
  }
  const ok = patchVoteInRepo(body.message_id, vote)
  if (!ok) {
    throw new FakeBackendError('Сообщение не найдено', 404)
  }
  return { ok, vote, message_id: body.message_id }
}
