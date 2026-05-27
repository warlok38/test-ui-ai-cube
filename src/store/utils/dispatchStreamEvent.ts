import { assistantActions } from '@/features/assistant/model/assistantSlice'
import type { AppDispatch } from '@/store/index'
import type { ExecuteQueryStreamEvent } from './sseEvents'

export function dispatchExecuteQueryStreamEvent(
  dispatch: AppDispatch,
  streamEvent: ExecuteQueryStreamEvent
): void {
  switch (streamEvent.event) {
    case 'task':
      dispatch(assistantActions.setCurrentTaskId(streamEvent.data.task_id))
      break
    case 'ack':
      dispatch(
        assistantActions.setStreamingStatus({
          message: streamEvent.data.message,
          step: 'ack'
        })
      )
      break
    case 'progress':
      dispatch(
        assistantActions.setStreamingStatus({
          message: streamEvent.data.message,
          step: streamEvent.data.step
        })
      )
      break
    case 'heartbeat':
      dispatch(assistantActions.updateStreamingStep({ step: streamEvent.data.step }))
      break
    case 'result':
    case 'error':
    case 'end':
      break
  }
}
