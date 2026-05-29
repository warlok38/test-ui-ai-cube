import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  clampStageDelayMs,
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  type AssistantTechnicalSettings
} from '@/features/technical/model'
import { loadTechnicalSettings } from '@/shared/modules/fakeDb/technicalSettingsPersistence'
import type {
  AssistantPhase,
  ChatStreamEvent,
  ErrorEntity,
  MessageEntity
} from '@/services/assistantWorkflow/types'
import { createId } from '@/shared/utils/createId'

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
  activeChatId: string | null
  activeTaskId: string | null
  streamMessage: string | null
  /** Блокирует loadChatMessages после «Новый чат», пока не уйдём с /chat/:id */
  suppressChatLoad: boolean
}

function clearStreamState(state: AssistantUiState) {
  state.streamMessage = null
  state.activeTaskId = null
}

function markLastMessageCancelled(state: AssistantUiState) {
  state.isRunning = false
  state.phase = 'idle'
  state.failedSummaryText = null
  clearStreamState(state)
  const lastIdx = state.messages.length - 1
  if (lastIdx >= 0) {
    state.messages[lastIdx] = {
      ...state.messages[lastIdx],
      status: 'cancelled_hint',
      interpretation: null
    }
  }
}

function applyQueryResult(state: AssistantUiState, result: MessageEntity, prompt: string) {
  state.isRunning = false
  state.phase = 'idle'
  state.lastResult = result
  state.lastQuery = prompt
  state.lastMessageId = result.id
  state.activeChatId = result.chat_id
  state.failedSummaryText = result.status === 'failed_max' ? (result.interpretation ?? null) : null
  state.unreachableDetails =
    result.status === 'server_unreachable' ? (result.interpretation ?? null) : null

  state.unreachableCode = null

  clearStreamState(state)

  const lastIdx = state.messages.length - 1

  if (lastIdx >= 0) {
    state.messages[lastIdx] = {
      ...result,

      query_text: prompt
    }
  } else {
    state.messages.push({ ...result, query_text: prompt })
  }
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
  activeChatId: null,
  activeTaskId: null,
  streamMessage: null,
  suppressChatLoad: false
}

export const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    setPhase(state, action: PayloadAction<{ phase: AssistantPhase }>) {
      state.phase = action.payload.phase
    },
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload
    },
    loadChatMessages(state, action: PayloadAction<{ chatId: string; messages: ChatMessage[] }>) {
      state.activeChatId = action.payload.chatId
      state.messages = action.payload.messages
      state.phase = 'idle'
      state.isRunning = false
      state.inputWarning = null
      state.failedSummaryText = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.feedbackChoice = null
      clearStreamState(state)
    },

    startQuery(state, action: PayloadAction<{ prompt: string; chatId?: string | null }>) {
      const prompt = action.payload.prompt.trim()
      state.isRunning = true
      state.inputWarning = null
      state.failedSummaryText = null
      state.unreachableDetails = null
      state.unreachableCode = null
      state.feedbackChoice = null
      state.phase = 'generating'
      clearStreamState(state)
      if (prompt) {
        state.messages = [
          ...state.messages,

          createMessageStub(prompt, action.payload.chatId ?? state.activeChatId)
        ]
      }
    },
    querySucceeded(state, action: PayloadAction<{ prompt: string; result: MessageEntity }>) {
      applyQueryResult(state, action.payload.result, action.payload.prompt)
    },
    applyStreamEvent(state, action: PayloadAction<ChatStreamEvent>) {
      const event = action.payload
      switch (event.event) {
        case 'task': {
          if (event.id) state.activeTaskId = event.id
          break
        }
        case 'progress':
        case 'heartbeat':
          if (event.message) {
            state.streamMessage = event.message
          }
          break
        case 'result': {
          if (!event.data || !('chat_id' in event.data)) break
          const result = event.data as MessageEntity
          const lastIdx = state.messages.length - 1
          const prompt = lastIdx >= 0 ? state.messages[lastIdx].query_text : result.query_text
          applyQueryResult(state, result, prompt)
          break
        }
        case 'error': {
          const entity = event.data as ErrorEntity | null | undefined
          if (entity?.code === 499) {
            markLastMessageCancelled(state)
            break
          }
          const message = entity?.message ?? event.message ?? 'Сбой выполнения запроса'
          state.isRunning = false
          state.phase = 'idle'
          state.failedSummaryText = message
          clearStreamState(state)
          const lastIdx = state.messages.length - 1
          if (lastIdx >= 0) {
            state.messages[lastIdx] = {
              ...state.messages[lastIdx],
              interpretation: message,
              status: 'failed_max'
            }
          }
          break
        }
        case 'end':
          state.streamMessage = null
          break
        default:
          break
      }
    },
    queryFailed(state, action: PayloadAction<string>) {
      state.isRunning = false
      state.phase = 'idle'
      state.failedSummaryText = action.payload
      clearStreamState(state)
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
      markLastMessageCancelled(state)
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
      state.activeChatId = null
      clearStreamState(state)
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
      state.activeChatId = null
      clearStreamState(state)
      state.suppressChatLoad = true
    },
    clearSuppressChatLoad(state) {
      state.suppressChatLoad = false
    }
  }
})

export const assistantActions = assistantSlice.actions
