import { DEFAULT_ASSISTANT_TECHNICAL_SETTINGS } from '@/features/technical/model'
import { streamExecuteQuery } from '@/fakeBackend/api/streamExecuteQuery'
import type { CubeQueryParams } from '@/services/assistantWorkflow/types'
import type { ExecuteQueryStreamEvent } from './sseEvents'
import { streamExecuteQueryHttpEvents } from './streamExecuteQueryHttp'

export type CreateExecuteQueryEventStreamOptions = {
  signal?: AbortSignal
}

function isHttpTransportEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CUBE_API_URL?.trim())
}

export function createExecuteQueryEventStream(
  params: CubeQueryParams,
  options: CreateExecuteQueryEventStreamOptions = {}
): AsyncIterable<ExecuteQueryStreamEvent> {
  if (isHttpTransportEnabled()) {
    return streamExecuteQueryHttpEvents(params, { signal: options.signal })
  }

  const scenario = params._technical?.scenario ?? DEFAULT_ASSISTANT_TECHNICAL_SETTINGS.scenario

  return streamExecuteQuery(params, scenario, options.signal)
}
