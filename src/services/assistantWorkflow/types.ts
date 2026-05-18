import type { RequestLogStatus } from '@/modules/fakeDb/schema'

export type AssistantPhase = 'idle' | 'checking' | 'generating' | 'fetching' | 'interpreting'

export type ChartType = 'bar' | 'line'

export type CubeQueryChartConfig = {
  chart_type: ChartType
  x_axis: string
  y_axis: string
  title: string
  series: string
}

export type CubeQueryDataEntity = {
  [key: string]: string | number | null
}

export type CubeQueryEntity = {
  success: boolean
  error: boolean
  data: CubeQueryDataEntity[]
  columns: string[]
  dax: string
  interpretation: string
  chart_config: CubeQueryChartConfig
}

export type ValidMaxAttempts = 1 | 2 | 3 | 4 | 5

export type CubeQueryParams = {
  query: string
  max_attempts?: ValidMaxAttempts
}

export type ChartConfigPayload = {
  type: 'bar' | 'line'
  xKey: string
  yKey: string
  title?: string
  color?: string
}

export type AssistantOutcome =
  | 'idle'
  | 'input_warning'
  | 'server_unreachable'
  | 'failed_max'
  | 'success'

export type RetryLogEntry = {
  attempt: number
  summary: string
}

export type AssistantSuccessPayload = {
  outcome: 'success'
  attemptsUsed: number
  retryLog: RetryLogEntry[]
  finalDax: string
  rows: Record<string, string | number | null>[]
  interpretation: string
  chartConfig: ChartConfigPayload | null
  durationMs: number
  scenarioLabel: string
}

export type AssistantFailurePayload =
  | {
      outcome: 'server_unreachable'
      details?: string
      errorCode?: string
      retryLog: RetryLogEntry[]
      durationMs: number
    }
  | {
      outcome: 'failed_max'
      retryLog: RetryLogEntry[]
      lastDax: string | null
      attemptsUsed: number
      summaryText: string
      durationMs: number
    }
  | {
      outcome: 'input_warning'
      message: string
    }

export type AssistantWorkflowResult = AssistantSuccessPayload | AssistantFailurePayload

export function toLogStatus(outcome: AssistantOutcome): RequestLogStatus {
  switch (outcome) {
    case 'success':
      return 'success'
    case 'failed_max':
      return 'failed_max'
    case 'server_unreachable':
      return 'server_unreachable'
    default:
      return 'cancelled_hint'
  }
}
