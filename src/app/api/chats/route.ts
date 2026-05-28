import { getChats } from '@/fakeBackend/handlers/getChats'
import { handleFakeBackendError } from '@/fakeBackend/http'

export async function GET() {
  try {
    const data = getChats()
    return Response.json(data)
  } catch (error) {
    return handleFakeBackendError(error)
  }
}
