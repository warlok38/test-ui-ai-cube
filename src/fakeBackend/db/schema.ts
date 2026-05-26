export type RequestFeedback = 'like' | 'dislike'

export type RequestLogStatus = 'success' | 'failed_max' | 'server_unreachable' | 'cancelled_hint'

export type RequestLogRecord = {
  id: string
  createdAt: string
  userPrompt: string
  finalDax: string | null
  status: RequestLogStatus
  attemptsUsed: number
  retrySummaries: string[]
  interpretation: string | null
  tableRows: Record<string, string | number | null>[] | null
  durationMs: number
  feedback: RequestFeedback | null
}

export type MetricsAggregate = {
  totalRuns: number
  runsToday: number
  successRatePercent: number
  /** Количество завершённых запусков (успех + failed_max); для успешности. */
  finishedRuns: number
  successfulRuns: number
}
