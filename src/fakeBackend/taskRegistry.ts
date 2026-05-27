type TaskEntry = {
  controller: AbortController
}

const tasks = new Map<string, TaskEntry>()

export function registerTask(taskId: string): AbortController {
  const controller = new AbortController()
  tasks.set(taskId, { controller })
  return controller
}

export function unregisterTask(taskId: string): void {
  tasks.delete(taskId)
}

export function cancelTask(taskId: string): boolean {
  const entry = tasks.get(taskId)
  if (!entry) return false
  entry.controller.abort()
  tasks.delete(taskId)
  return true
}

export function getTaskSignal(taskId: string): AbortSignal | undefined {
  return tasks.get(taskId)?.controller.signal
}
