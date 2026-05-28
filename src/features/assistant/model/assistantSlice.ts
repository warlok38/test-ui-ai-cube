import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  clampStageDelayMs,
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  type AssistantTechnicalSettings
} from '@/features/technical/model'
import { loadTechnicalSettings } from '@/fakeBackend/db/technicalSettingsPersistence'
import type {
  AssistantPhase,
  MessageEntity,
  SendMessageResponse,
  ValidMaxAttempts
} from '@/services/assistantWorkflow/types'
import { createId } from '@/utils/createId'

export type ChatMessage = MessageEntity

function createMessageStub(queryText: string, chatId: string | null): MessageEntity {
  return {
    id: createId(),
    chat_id: chatId ?? '',
    prev_id: null,
    query_text: queryText,
    dax: null,
    status: null,
    attempts_made: null,
    result_row_count: null,
    execution_time_ms: null,
    error_history: null,
    q_columns: null,
    q_data: null,
    interpretation: null,
    chart_config: null,
    vote: null,
    voted_at: null,
    created_at: new Date().toISOString()
  }
}

export type StreamingStatus = {
  message: string
  step: string
}

export type AssistantUiState = {
  phase: AssistantPhase
  isRunning: boolean
  inputWarning: string | null
  unreachableDetails: string | null
  unreachableCode: string | null
  failedSummaryText: string | null
  lastResult: MessageEntity | null
  lastQuery: string | null
  lastMessageId: string | null
  feedbackChoice: 'like' | 'dislike' | null
  technicalSettings: AssistantTechnicalSettings
  messages: ChatMessage[]
  currentAttempt: number
  maxAttempts: number
  activeChatId: string | null
  /** Блокирует loadChatMessages после «Новый чат», пока не уйдём с /chat/:id */
  suppressChatLoad: boolean
  streamingStatus: StreamingStatus | null
  currentTaskId: string | null
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
  lastMessageId: null,
  feedbackChoice: null,
  technicalSettings: { ...initialTechnicalSettings },
  messages: [],
  currentAttempt: 1,
  maxAttempts: 3,
  activeChatId: null,
  suppressChatLoad: false,
  streamingStatus: null,
  currentTaskId: null
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
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload
    },
    loadChatMessages(
      state,
      action: PayloadAction<{ chatId: string; messages: ChatMessage[] }>
    ) {
      state.activeChatId = action.payload.chatId
      state.messages = action.payload.messages
      state.phase = 'idle'
      state.isRunning = false
      state.inputWarning = null
      state.failedSummaryText = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.feedbackChoice = null
      state.currentAttempt = 1
      state.streamingStatus = null
      state.currentTaskId = null
    },
    setStreamingStatus(state, action: PayloadAction<StreamingStatus>) {
      state.streamingStatus = action.payload
    },
    updateStreamingStep(state, action: PayloadAction<{ step: string }>) {
      if (state.streamingStatus) {
        state.streamingStatus.step = action.payload.step
      }
    },
    setCurrentTaskId(state, action: PayloadAction<string>) {
      state.currentTaskId = action.payload
    },
    clearStreaming(state) {
      state.streamingStatus = null
      state.currentTaskId = null
    },
    startQuery(
      state,
      action: PayloadAction<{ prompt: string; maxAttempts: ValidMaxAttempts; chatId?: string | null }>
    ) {
      const prompt = action.payload.prompt.trim()
      state.isRunning = true
      state.inputWarning = null
      state.failedSummaryText = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.feedbackChoice = null
      state.streamingStatus = null
      state.currentTaskId = null
      state.phase = 'generating'
      state.currentAttempt = 1
      state.maxAttempts = action.payload.maxAttempts
      if (prompt) {
        state.messages = [
          ...state.messages,
          createMessageStub(prompt, action.payload.chatId ?? state.activeChatId)
        ]
      }
    },
    querySucceeded(state, action: PayloadAction<{ prompt: string; result: SendMessageResponse }>) {
      const { result } = action.payload
      state.isRunning = false
      state.streamingStatus = null
      state.currentTaskId = null
      state.phase = 'idle'
      state.currentAttempt = 1
      state.lastResult = result
      state.lastQuery = action.payload.prompt
      state.lastMessageId = result.id
      state.activeChatId = result.chat_id
      state.failedSummaryText =
        result.status === 'failed_max' ? (result.interpretation ?? null) : null
      state.unreachableDetails =
        result.status === 'server_unreachable' ? (result.interpretation ?? null) : null
      state.unreachableCode = null

      const lastIdx = state.messages.length - 1
      if (lastIdx >= 0) {
        state.messages[lastIdx] = {
          ...result,
          query_text: action.payload.prompt
        }
      } else {
        state.messages.push(result)
      }
    },
    queryFailed(state, action: PayloadAction<string>) {
      state.isRunning = false
      state.streamingStatus = null
      state.currentTaskId = null
      state.phase = 'idle'
      state.currentAttempt = 1
      state.failedSummaryText = action.payload

      const lastIdx = state.messages.length - 1
      if (lastIdx >= 0) {
        state.messages[lastIdx] = {
          ...state.messages[lastIdx],
          interpretation: action.payload,
          status: 'failed_max'
        }
      }
    },
    queryCancelled(state) {
      state.isRunning = false
      state.streamingStatus = null
      state.currentTaskId = null
      state.phase = 'idle'
      state.currentAttempt = 1
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
      state.streamingStatus = null
      state.currentTaskId = null
      state.phase = 'idle'
      state.isRunning = false
      state.inputWarning = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.failedSummaryText = null
      state.lastResult = null
      state.lastQuery = null
      state.lastMessageId = null
      state.feedbackChoice = null
      state.currentAttempt = 1
      state.activeChatId = null
      state.suppressChatLoad = false
    },
    startNewChat(state) {
      state.messages = []
      state.streamingStatus = null
      state.currentTaskId = null
      state.phase = 'idle'
      state.isRunning = false
      state.inputWarning = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.failedSummaryText = null
      state.lastResult = null
      state.lastQuery = null
      state.lastMessageId = null
      state.feedbackChoice = null
      state.currentAttempt = 1
      state.activeChatId = null
      state.suppressChatLoad = true
    },
    clearSuppressChatLoad(state) {
      state.suppressChatLoad = false
    }
  }
})

export const assistantActions = assistantSlice.actions
