import { patchMessageFeedback } from '@/fakeBackend/handlers/patchMessageFeedback'
import { handleFakeBackendError } from '@/fakeBackend/http'
import type { PatchMessageFeedbackBody } from '@/services/assistantWorkflow/types'

type RouteContext = {
  params: { messageId: string }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as PatchMessageFeedbackBody
    const ok = patchMessageFeedback(context.params.messageId, body)
    return Response.json({ ok })
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
