import type { ExecuteQueryStreamEvent } from './sseEvents'

export function encodeSseEvent(streamEvent: ExecuteQueryStreamEvent): string {
  const lines = [`event: ${streamEvent.event}`]
  if (streamEvent.event === 'end') {
    lines.push('data: {}')
  } else {
    lines.push(`data: ${JSON.stringify(streamEvent.data)}`)
  }
  return `${lines.join('\n')}\n\n`
}
