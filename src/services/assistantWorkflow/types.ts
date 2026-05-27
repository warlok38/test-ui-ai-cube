import type { RequestFeedback, RequestLogStatus } from '@/modules/fakeDb/schema'

export type AssistantPhase = 'idle' | 'checking' | 'generating' | 'fetching' | 'interpreting'

export type ChartType = 'bar' | 'line'

export type MessageChartConfig = {
  chart_type: ChartType
  x_axis: string
  y_axis: string
  title: string
  series: string
}

export type MessageDataRow = {
  [key: string]: string | number | null
}

export type MessageEntity = {
  id: string | null
  chat_id: string
  prev_id: string | null
  query_text: string
  dax: string | null
  status: RequestLogStatus | null
  attempts_made: number | null
  result_row_count: number | null
  execution_time_ms: number | null
  error_history: unknown[] | null
  q_columns: string[] | null
  q_data: MessageDataRow[] | null
  interpretation: string | null
  chart_config: MessageChartConfig | null
  vote: RequestFeedback | null
  voted_at: string | null
  created_at: string
}

export type CubeQueryResult = Pick<
  MessageEntity,
  | 'dax'
  | 'status'
  | 'attempts_made'
  | 'result_row_count'
  | 'error_history'
  | 'q_columns'
  | 'q_data'
  | 'interpretation'
  | 'chart_config'
>

export type SendMessageResponse = MessageEntity & {
  task_id: string
}

export type ValidMaxAttempts = 1 | 2 | 3 | 4 | 5

export type MessageSendParams = {
  query: string
  max_attempts?: ValidMaxAttempts
  chat_id?: string
  /** Клиент может передать id для cancel во время in-flight запроса */
  task_id?: string
}

export type ChatEntity = {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  last_query_status?: RequestLogStatus
}

export type ChatDetailEntity = ChatEntity & {
  messages: MessageEntity[]
}

export type PatchMessageVoteBody = {
  message_id: string
  vote: RequestFeedback
}

export type PatchMessageVoteResponse = {
  ok: boolean
  vote: RequestFeedback
  message_id: string
}

export type DeleteChatResponse = {
  ok: string
  message: string
}

export type CancelTaskResponse = {
  cancelled: boolean
  task_id: string
}

/** @deprecated Use MessageChartConfig */
export type CubeQueryChartConfig = MessageChartConfig
/** @deprecated Use MessageDataRow */
export type CubeQueryDataEntity = MessageDataRow
/** @deprecated Use MessageEntity */
export type CubeQueryEntity = MessageEntity
/** @deprecated Use MessageSendParams */
export type CubeQueryParams = MessageSendParams

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
