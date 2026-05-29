import { getChats } from '@/shared/modules/fakeBackend/handlers/getChats'
import { handleFakeBackendError } from '@/shared/modules/fakeBackend/http'

export async function GET() {
  try {
    const data = getChats()
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
