import { dispatchExecuteQueryStreamEvent } from './dispatchStreamEvent'
import type { ExecuteQueryStreamEvent } from './sseEvents'
import { isErrorEvent, isResultEvent } from './sseEvents'
import type { AppDispatch } from '@/store/index'
import type { MessageEntity } from '@/services/assistantWorkflow/types'

export type ConsumeExecuteQueryStreamOptions = {
  onEvent?: (event: ExecuteQueryStreamEvent) => void
  dispatch?: AppDispatch
}

export async function consumeExecuteQueryStream(
  stream: AsyncIterable<ExecuteQueryStreamEvent>,
  options: ConsumeExecuteQueryStreamOptions = {}
): Promise<MessageEntity> {
  let result: MessageEntity | undefined

  for await (const streamEvent of stream) {
    options.onEvent?.(streamEvent)
    if (options.dispatch) {
      dispatchExecuteQueryStreamEvent(options.dispatch, streamEvent)
    }

    if (isResultEvent(streamEvent)) {
      result = streamEvent.data.payload as MessageEntity
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
