import { deleteChat } from '@/fakeBackend/handlers/deleteChat'
import { getChatById } from '@/fakeBackend/handlers/getChatById'
import { handleFakeBackendError } from '@/fakeBackend/http'

type RouteContext = {
  params: { chatId: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const data = getChatById(context.params.chatId)
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const data = deleteChat(context.params.chatId)
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
