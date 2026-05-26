import type { CubeQueryEntity } from '@/services/assistantWorkflow/types'

export type SseEventName = 'task' | 'ack' | 'progress' | 'heartbeat' | 'result' | 'error' | 'end'

export type TaskEventData = {
  task_id: string
}

export type AckEventData = {
  type: 'ack'
  ts: string
  message: string
}

export type ProgressEventData = {
  type: 'progress'
  ts: string
  step: string
  message: string
}

export type HeartbeatEventData = {
  type: 'heartbeat'
  ts: string
  step: string
  message: string
}

export type ResultEventData = {
  type: 'result'
  ts: string
  task_id?: string
  payload: CubeQueryEntity
}

export type ErrorEventData = {
  type: 'error'
  ts: string
  message: string
  code?: string
}

export type EndEventData = Record<string, never>

export type ExecuteQueryStreamEvent =
  | { event: 'task'; data: TaskEventData }
  | { event: 'ack'; data: AckEventData }
  | { event: 'progress'; data: ProgressEventData }
  | { event: 'heartbeat'; data: HeartbeatEventData }
  | { event: 'result'; data: ResultEventData }
  | { event: 'error'; data: ErrorEventData }
  | { event: 'end'; data: EndEventData }

export function streamTs(): string {
  return new Date().toISOString()
}

export function isExecuteQueryStreamEvent(value: unknown): value is ExecuteQueryStreamEvent {
  if (typeof value !== 'object' || value === null) return false
  const event = (value as { event?: unknown }).event
  return (
    event === 'task' ||
    event === 'ack' ||
    event === 'progress' ||
    event === 'heartbeat' ||
    event === 'result' ||
    event === 'error' ||
    event === 'end'
  )
}

export function isResultEvent(
  event: ExecuteQueryStreamEvent
): event is Extract<ExecuteQueryStreamEvent, { event: 'result' }> {
  return event.event === 'result'
}

export function isErrorEvent(
  event: ExecuteQueryStreamEvent
): event is Extract<ExecuteQueryStreamEvent, { event: 'error' }> {
  return event.event === 'error'
}
