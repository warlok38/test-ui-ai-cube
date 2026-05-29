import type { AdminQueryLog, CubeStats } from '@/services/admin/types'
import type { MetricsAggregate, RequestFeedback, RequestLogRecord } from './schema'
import seed from './seed.json'
import { loadFromStorage, saveToStorage } from './persistence'
import { createId } from '@/shared/utils/createId'

let memoryLogs: RequestLogRecord[] | null = null

function hydrate(): RequestLogRecord[] {
  if (memoryLogs) return memoryLogs
  const raw = loadFromStorage()
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RequestLogRecord[]
      memoryLogs = Array.isArray(parsed) ? parsed : []
      return memoryLogs
    } catch {
      memoryLogs = []
      return memoryLogs
    }
  }
  memoryLogs = (seed as RequestLogRecord[]).map((row) => ({ ...row }))
  persist(memoryLogs)
  return memoryLogs
}

function persist(logs: RequestLogRecord[]): void {
  memoryLogs = logs
  saveToStorage(JSON.stringify(logs))
}

export function appendRequestLog(
  record: Omit<RequestLogRecord, 'id' | 'createdAt'>
): RequestLogRecord {
  const logs = hydrate()
  const full: RequestLogRecord = {
    ...record,
    id: createId(),
    createdAt: new Date().toISOString()
  }
  persist([full, ...logs])
  return full
}

export function patchRequestFeedback(id: string, feedback: RequestFeedback): boolean {
  const logs = hydrate()
  const idx = logs.findIndex((l) => l.id === id)
  if (idx === -1) return false
  const next = [...logs]
  next[idx] = { ...next[idx], feedback }
  persist(next)
  return true
}

export type LogQueryArgs = {
  limit?: number
  offset?: number
}

export function listLogs({ limit = 100, offset = 0 }: LogQueryArgs): RequestLogRecord[] {
  const logs = hydrate()
  return logs.slice(offset, offset + limit)
}

function startOfTodayIso(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function aggregateMetrics(): MetricsAggregate {
  const logs = hydrate()
  const finished = logs.filter(
    (l) => l.status === 'success' || l.status === 'failed_max' || l.status === 'server_unreachable'
  )
  const successful = logs.filter((l) => l.status === 'success')
  const todayStart = startOfTodayIso()
  const runsToday = logs.filter((l) => new Date(l.createdAt).getTime() >= todayStart).length

  const totalRuns = logs.length
  const finishedRuns = finished.length
  const successfulRuns = successful.length
  const successRatePercent =
    finishedRuns === 0 ? 0 : Math.round((successfulRuns / finishedRuns) * 1000) / 10

  return {
    totalRuns,
    runsToday,
    finishedRuns,
    successfulRuns,
    successRatePercent
  }
}

export function aggregateCubeStats(): CubeStats {
  const logs = hydrate()
  const finished = logs.filter(
    (l) => l.status === 'success' || l.status === 'failed_max' || l.status === 'server_unreachable'
  )
  const successful = logs.filter((l) => l.status === 'success')
  const todayStart = startOfTodayIso()
  const daily_queries = logs.filter((l) => new Date(l.createdAt).getTime() >= todayStart).length
  const finishedCount = finished.length
  const success_rate =
    finishedCount === 0 ? 0 : Math.round((successful.length / finishedCount) * 1000) / 10

  return {
    total_queries: logs.length,
    daily_queries,
    likes: logs.filter((l) => l.feedback === 'like').length,
    dislikes: logs.filter((l) => l.feedback === 'dislike').length,
    success_rate
  }
}

const ADMIN_QUERY_EVENT = 'cube.query'

function toAdminQueryLog(record: RequestLogRecord): AdminQueryLog {
  return {
    event_tech_id: record.id,
    start_time: record.createdAt,
    user: null,
    event: ADMIN_QUERY_EVENT,
    status: record.status,
    query: record.userPrompt
  }
}

export function listAdminQueryLogs({
  limit = 100,
  offset = 0
}: LogQueryArgs = {}): AdminQueryLog[] {
  return listLogs({ limit, offset }).map(toAdminQueryLog)
}

/** Для модульных тестов / расширения — сброс в начальное состояние. */
export function resetFakeDb(seedOnly = true): void {
  memoryLogs = seedOnly ? (seed as RequestLogRecord[]).map((row) => ({ ...row })) : []
  if (memoryLogs) persist(memoryLogs)
}
