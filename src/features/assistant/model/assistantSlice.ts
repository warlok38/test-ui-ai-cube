import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  clampStageDelayMs,
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  type AssistantTechnicalSettings
} from '@/features/technical/model'
import { appendRequestLog } from '@/modules/fakeDb/repo'
import { loadTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
import type {
  AssistantPhase,
  AssistantSuccessPayload,
  RetryLogEntry
} from '@/services/assistantWorkflow/types'
import {
  ASSISTANT_MAX_ATTEMPTS,
  runAssistantWorkflow
} from '@/services/assistantWorkflow/runAssistantWorkflow'
import { cubeApi } from '@/store/api/cubeApi'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

export type AssistantUiState = {
  phase: AssistantPhase
  isRunning: boolean
  inputWarning: string | null
  /** Последний зафейленный технический текст (Unreachable / summary) для UI */
  unreachableDetails: string | null
  unreachableCode: string | null
  unreachableDurationMs: number | null
  failedSummaryText: string | null
  lastFailureDiagnostics: {
    summaryText: string
    retryLog: RetryLogEntry[]
    lastDax: string | null
    durationMs: number
    attemptsUsed: number
  } | null
  lastSuccess: AssistantSuccessPayload | null
  lastAttemptLogEntries: AssistantSuccessPayload['retryLog'] | null
  lastLogId: string | null
  feedbackChoice: 'like' | 'dislike' | null
  technicalSettings: AssistantTechnicalSettings
  messages: ChatMessage[]
  currentAttempt: number
  maxAttempts: number
}

const initialTechnicalSettings = loadTechnicalSettings()

const initialState: AssistantUiState = {
  phase: 'idle',
  isRunning: false,
  inputWarning: null,
  unreachableDetails: null,
  unreachableCode: null,
  unreachableDurationMs: null,
  failedSummaryText: null,
  lastFailureDiagnostics: null,
  lastSuccess: null,
  lastAttemptLogEntries: null,
  lastLogId: null,
  feedbackChoice: null,
  technicalSettings: { ...initialTechnicalSettings },
  messages: [],
  currentAttempt: 1,
  maxAttempts: ASSISTANT_MAX_ATTEMPTS
}

function pushMessage(
  list: ChatMessage[],
  msg: Omit<ChatMessage, 'createdAt'> & Partial<Pick<ChatMessage, 'createdAt'>>
) {
  return [
    ...list,
    {
      ...msg,
      createdAt: msg.createdAt ?? Date.now()
    }
  ]
}

export const runAssistantThunk = createAsyncThunk(
  'assistant/runAssistant',
  async (prompt: string, { dispatch, rejectWithValue, getState }) => {
    try {
      const state = getState() as { assistant: AssistantUiState }
      const settings = state.assistant?.technicalSettings ?? DEFAULT_ASSISTANT_TECHNICAL_SETTINGS
      const result = await runAssistantWorkflow({
        userPrompt: prompt,
        scenario: settings.scenario,
        stageDelayMs: clampStageDelayMs(settings.stageDelayMs),
        onPhase: (phase, meta) => {
          dispatch(
            assistantSlice.actions.setPhase({
              phase,
              currentAttempt: meta?.attempt,
              maxAttempts: meta?.maxAttempts
            })
          )
        }
      })

      dispatch(cubeApi.util.invalidateTags(['Metrics', 'Logs']))

      let logId: string | null = null
      if (result.outcome === 'success') {
        logId = appendRequestLog({
          userPrompt: prompt,
          finalDax: result.finalDax,
          status: 'success',
          attemptsUsed: result.attemptsUsed,
          retrySummaries: result.retryLog.map((r) => r.summary),
          interpretation: result.interpretation,
          tableRows: result.rows,
          durationMs: result.durationMs,
          feedback: null
        }).id
      } else if (result.outcome === 'failed_max') {
        logId = appendRequestLog({
          userPrompt: prompt,
          finalDax: result.lastDax,
          status: 'failed_max',
          attemptsUsed: result.attemptsUsed,
          retrySummaries: result.retryLog.map((r) => r.summary),
          interpretation: null,
          tableRows: null,
          durationMs: result.durationMs,
          feedback: null
        }).id
      } else if (result.outcome === 'server_unreachable') {
        logId = appendRequestLog({
          userPrompt: prompt,
          finalDax: null,
          status: 'server_unreachable',
          attemptsUsed: 0,
          retrySummaries: [],
          interpretation: result.details ?? 'Сервер недоступен',
          tableRows: null,
          durationMs: result.durationMs,
          feedback: null
        }).id
      }

      return { result, logId }
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Неизвестная ошибка')
    }
  },
  {
    condition: (prompt: string | undefined | null): boolean =>
      typeof prompt === 'string' ? prompt.trim().length > 0 : false
  }
)

export const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    setPhase(
      state,
      action: PayloadAction<{
        phase: AssistantPhase
        currentAttempt?: number
        maxAttempts?: number
      }>
    ) {
      state.phase = action.payload.phase
      if (action.payload.currentAttempt !== undefined) {
        state.currentAttempt = action.payload.currentAttempt
      }
      if (action.payload.maxAttempts !== undefined) {
        state.maxAttempts = action.payload.maxAttempts
      }
    },
    resetFeedbackPreview(state) {
      state.feedbackChoice = null
    },
    setFeedbackChoice(state, action: PayloadAction<'like' | 'dislike' | null>) {
      state.feedbackChoice = action.payload
    },
    setTechnicalScenario(state, action: PayloadAction<AssistantTechnicalSettings['scenario']>) {
      state.technicalSettings.scenario = action.payload
    },
    setTechnicalStageDelayMs(state, action: PayloadAction<number>) {
      state.technicalSettings.stageDelayMs = clampStageDelayMs(action.payload)
    },
    resetTechnicalSettings(state) {
      state.technicalSettings = { ...DEFAULT_ASSISTANT_TECHNICAL_SETTINGS }
    },
    clearTransientErrors(state) {
      state.inputWarning = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.failedSummaryText = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAssistantThunk.pending, (state, action) => {
        state.isRunning = true
        state.inputWarning = null
        state.lastSuccess = null
        state.failedSummaryText = null
        state.unreachableDetails = null
        state.unreachableCode = null
        state.unreachableDurationMs = null
        state.lastFailureDiagnostics = null
        state.feedbackChoice = null
        state.lastAttemptLogEntries = null
        state.phase = 'checking'
        state.currentAttempt = 1
        state.maxAttempts = ASSISTANT_MAX_ATTEMPTS
        const prompt = action.meta.arg
        state.messages = pushMessage(state.messages, {
          id: crypto.randomUUID(),
          role: 'user',
          text: prompt
        })
      })
      .addCase(runAssistantThunk.fulfilled, (state, action) => {
        state.isRunning = false
        state.phase = 'idle'
        state.currentAttempt = 1
        const { result, logId } = action.payload
        state.lastLogId = logId

        if (result.outcome === 'input_warning') {
          state.inputWarning = result.message
          state.lastLogId = null
          state.messages = pushMessage(state.messages, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: result.message
          })
          return
        }

        if (result.outcome === 'server_unreachable') {
          state.unreachableDetails = result.details ?? 'Сервер OLAP недоступен'
          state.unreachableCode = result.errorCode ?? null
          state.unreachableDurationMs = result.durationMs
          state.lastAttemptLogEntries = result.retryLog
          state.messages = pushMessage(state.messages, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `Сервер недоступен: ${state.unreachableDetails}`
          })
          return
        }

        if (result.outcome === 'failed_max') {
          state.failedSummaryText = result.summaryText
          state.lastAttemptLogEntries = result.retryLog
          state.lastFailureDiagnostics = {
            summaryText: result.summaryText,
            retryLog: result.retryLog,
            lastDax: result.lastDax,
            durationMs: result.durationMs,
            attemptsUsed: result.attemptsUsed
          }
          state.messages = pushMessage(state.messages, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `${result.summaryText}\n\nДетали ретраев:\n${result.retryLog
              .map((r) => `- ${r.summary}`)
              .join('\n')}`
          })
          return
        }

        state.lastSuccess = result
        state.lastFailureDiagnostics = null
        state.unreachableDurationMs = null
        state.lastAttemptLogEntries = result.retryLog
        state.messages = pushMessage(state.messages, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `Готово. Использовано попыток: ${result.attemptsUsed}. См. интерпретацию и таблицу ниже.`
        })
      })
      .addCase(runAssistantThunk.rejected, (state, action) => {
        state.isRunning = false
        state.phase = 'idle'
        state.currentAttempt = 1
        const msg = typeof action.payload === 'string' ? action.payload : 'Сбой выполнения запроса'
        state.messages = pushMessage(state.messages, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: msg
        })
      })
  }
})

export const assistantActions = assistantSlice.actions
