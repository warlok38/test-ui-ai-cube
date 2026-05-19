import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  clampStageDelayMs,
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  type AssistantTechnicalSettings
} from '@/features/technical/model'
import { loadTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
import type {
  AssistantPhase,
  CubeQueryEntity,
  ValidMaxAttempts
} from '@/services/assistantWorkflow/types'
import { createId } from '@/utils/createId'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
  result?: CubeQueryEntity | null
  logId?: string | null
}

export type AssistantUiState = {
  phase: AssistantPhase
  isRunning: boolean
  inputWarning: string | null
  unreachableDetails: string | null
  unreachableCode: string | null
  failedSummaryText: string | null
  lastResult: CubeQueryEntity | null
  lastQuery: string | null
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
  failedSummaryText: null,
  lastResult: null,
  lastQuery: null,
  lastLogId: null,
  feedbackChoice: null,
  technicalSettings: { ...initialTechnicalSettings },
  messages: [],
  currentAttempt: 1,
  maxAttempts: 3
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
    startQuery(state, action: PayloadAction<{ prompt: string; maxAttempts: ValidMaxAttempts }>) {
      const prompt = action.payload.prompt.trim()
      state.isRunning = true
      state.inputWarning = null
      state.failedSummaryText = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.feedbackChoice = null
      state.phase = 'generating'
      state.currentAttempt = 1
      state.maxAttempts = action.payload.maxAttempts
      if (prompt) {
        state.messages = pushMessage(state.messages, {
          id: createId(),
          role: 'user',
          text: prompt
        })
      }
    },
    querySucceeded(
      state,
      action: PayloadAction<{ prompt: string; result: CubeQueryEntity; logId: string | null }>
    ) {
      state.isRunning = false
      state.phase = 'idle'
      state.currentAttempt = 1
      state.lastResult = action.payload.result
      state.lastQuery = action.payload.prompt
      state.lastLogId = action.payload.logId
      state.failedSummaryText = action.payload.result.error
        ? action.payload.result.interpretation
        : null
      state.unreachableDetails = action.payload.result.interpretation.includes('недоступен')
        ? action.payload.result.interpretation
        : null
      state.unreachableCode = null
      state.messages = pushMessage(state.messages, {
        id: createId(),
        role: 'assistant',
        text: action.payload.result.interpretation,
        result: action.payload.result,
        logId: action.payload.logId
      })
    },
    queryFailed(state, action: PayloadAction<string>) {
      state.isRunning = false
      state.phase = 'idle'
      state.currentAttempt = 1
      state.failedSummaryText = action.payload
      state.messages = pushMessage(state.messages, {
        id: createId(),
        role: 'assistant',
        text: action.payload
      })
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
    },
    resetChat(state) {
      state.messages = []
      state.phase = 'idle'
      state.isRunning = false
      state.inputWarning = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.failedSummaryText = null
      state.lastResult = null
      state.lastQuery = null
      state.lastLogId = null
      state.feedbackChoice = null
      state.currentAttempt = 1
    }
  }
})

export const assistantActions = assistantSlice.actions
