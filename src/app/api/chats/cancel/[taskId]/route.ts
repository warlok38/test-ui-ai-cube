import { cancelChatTask } from '@/shared/modules/fakeBackend/handlers/cancelChatTask'
import { handleFakeBackendError } from '@/shared/modules/fakeBackend/http'

type RouteContext = {
  params: { taskId: string }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const data = cancelChatTask(context.params.taskId)
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
