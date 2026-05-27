import { getChats } from '@/fakeBackend/handlers/getChats'
import { postChat } from '@/fakeBackend/handlers/postChat'
import { handleFakeBackendError } from '@/fakeBackend/http'
import type { MessageSendParams } from '@/services/assistantWorkflow/types'

export async function GET() {
  try {
    const data = getChats()
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MessageSendParams
    const data = await postChat(body, request.signal)
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
