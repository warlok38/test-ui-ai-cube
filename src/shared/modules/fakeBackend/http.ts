import { FakeBackendError } from './errors'

export function handleFakeBackendError(error: unknown): Response {
  if (error instanceof FakeBackendError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  const message = error instanceof Error ? error.message : 'Внутренняя ошибка'
  return Response.json({ error: message }, { status: 500 })
}
