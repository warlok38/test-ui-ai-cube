import { deleteChat } from '@/shared/modules/fakeBackend/handlers/deleteChat'
import { getChatById } from '@/shared/modules/fakeBackend/handlers/getChatById'
import { handleFakeBackendError } from '@/shared/modules/fakeBackend/http'

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
