import { cancelTask } from '../taskRegistry'
import type { CancelTaskResponse } from '@/services/assistantWorkflow/types'

export function cancelChatTask(taskId: string): CancelTaskResponse {
  const cancelled = cancelTask(taskId)
  return { cancelled, task_id: taskId }
}
