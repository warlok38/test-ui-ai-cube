import { postChatVote } from '@/shared/modules/fakeBackend/handlers/postChatVote'
import { handleFakeBackendError } from '@/shared/modules/fakeBackend/http'
import type { PatchMessageVoteBody } from '@/services/assistantWorkflow/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PatchMessageVoteBody
    const result = postChatVote(body)
    return Response.json(result)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
