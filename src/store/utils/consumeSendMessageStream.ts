import { dispatchExecuteQueryStreamEvent } from './dispatchStreamEvent'
import type { ExecuteQueryStreamEvent } from './sseEvents'
import { isErrorEvent, isResultEvent } from './sseEvents'
import type { AppDispatch } from '@/store/index'
import type {
  SendMessageResponse
} from '@/services/assistantWorkflow/types'

function isSendMessageResponse(
  payload: SendMessageResponse | import('@/services/assistantWorkflow/types').CubeQueryResult
): payload is SendMessageResponse {
  return 'chat_id' in payload && 'task_id' in payload
}

export type ConsumeSendMessageStreamOptions = {
  onEvent?: (event: ExecuteQueryStreamEvent) => void
  dispatch?: AppDispatch
}

export async function consumeSendMessageStream(
  stream: AsyncIterable<ExecuteQueryStreamEvent>,
  options: ConsumeSendMessageStreamOptions = {}
): Promise<SendMessageResponse> {
  let result: SendMessageResponse | undefined

  for await (const streamEvent of stream) {
    options.onEvent?.(streamEvent)
    if (options.dispatch) {
      dispatchExecuteQueryStreamEvent(options.dispatch, streamEvent)
    }

    if (isResultEvent(streamEvent)) {
      const { payload } = streamEvent.data
      if (!isSendMessageResponse(payload)) {
        throw new Error('Ожидался SendMessageResponse в событии result')
      }
      result = payload
    }

    if (isErrorEvent(streamEvent)) {
      const err = new Error(streamEvent.data.message)
      if (streamEvent.data.code) {
        ;(err as Error & { code?: string }).code = streamEvent.data.code
      }
      throw err
    }
  }

  if (!result) {
    throw new Error('Поток завершился без результата')
  }

  return result
}
