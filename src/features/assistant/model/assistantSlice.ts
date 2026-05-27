import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  clampStageDelayMs,
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  type AssistantTechnicalSettings
} from '@/features/technical/model'
import { loadTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
import type { AssistantPhase, MessageEntity, ValidMaxAttempts } from '@/services/assistantWorkflow/types'
import type { RequestFeedback } from '@/modules/fakeDb/schema'
import { createId } from '@/utils/createId'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
  result?: MessageEntity | null
  messageId?: string | null
  feedback?: RequestFeedback | null
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
  suppressChatLoad: false
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
      action: PayloadAction<{
        prompt: string
        result: MessageEntity
        messageId: string
        chatId: string
      }>
    ) {
      state.isRunning = false
      state.phase = 'idle'
      state.currentAttempt = 1
      state.lastResult = action.payload.result
      state.lastQuery = action.payload.prompt
      state.lastMessageId = action.payload.messageId
      state.activeChatId = action.payload.chatId
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
        messageId: action.payload.messageId,
        feedback: null
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
    queryCancelled(state) {
      state.isRunning = false
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
