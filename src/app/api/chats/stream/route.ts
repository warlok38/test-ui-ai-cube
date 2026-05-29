import { postChatStream } from '@/shared/modules/fakeBackend/handlers/postChatStream'
import { handleFakeBackendError } from '@/shared/modules/fakeBackend/http'
import type { MessageSendParams } from '@/services/assistantWorkflow/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MessageSendParams
    return postChatStream(body, request.signal)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
