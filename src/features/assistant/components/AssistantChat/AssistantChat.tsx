'use client'

import { App, Spin } from 'antd'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'
import {
  assistantActions,
  type AssistantUiState
} from '@/features/assistant/model/assistantSlice'
import type { RootState } from '@/store'
import { buildChatDetailCacheAfterSend } from '@/features/assistant/utils/buildChatDetailCache'
import { getVisibleChatState } from '@/features/assistant/utils/getVisibleChatState'
import {
  createErrorFromUnknown,
  getHttpErrorStatus,
  HTTP_ERROR_CODES
} from '@/shared/errors'
import { mapChatRecordsToUiMessages } from '@/features/assistant/utils/mapChatMessages'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  chatsApi,
  useCancelTaskMutation,
  useGetChatQuery,
  useSendMessageMutation
} from '@/store/api/chatsApi'
import { cubeApi } from '@/store/api/cubeApi'

import { useCubeConnectHealth } from '@/features/assistant/hooks/useCubeConnectHealth'
import { AssistantChatMessages } from './AssistantChatMessages'
import { AssistantChatView } from './AssistantChatView'
import { AssistantEmptyLanding } from './AssistantEmptyLanding'
import { CubeUnavailableAlert } from './CubeUnavailableAlert'

import styles from './AssistantChat.module.css'

function isRequestAborted(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  ) {
    return true
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: string }).status === 'ABORTED'
  ) {
    return true
  }
  return false
}

function isRequestCancelled(error: unknown, state: AssistantUiState): boolean {
  if (isRequestAborted(error)) {
    return true
  }
  const httpError = createErrorFromUnknown(error)
  if (httpError.statusCode === HTTP_ERROR_CODES.RequestCancelled) {
    return true
  }
  const lastMessage = state.messages.at(-1)
  return lastMessage?.status === 'cancelled_hint'
}

type AssistantChatProps = {
  chatIdFromRoute?: string
}

export function AssistantChat({ chatIdFromRoute }: AssistantChatProps) {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const router = useRouter()
  const params = useParams()
  const routeChatId = (params?.chatId as string | undefined) ?? chatIdFromRoute
  const assistant = useAppSelector((s) => s.assistant)
  const { message } = App.useApp()
  const [sendMessage] = useSendMessageMutation()
  const [cancelTaskMutation] = useCancelTaskMutation()
  const requestRef = useRef<ReturnType<typeof sendMessage> | null>(null)

  const [draft, setDraft] = useState('')
  const [cubeAlertDismissed, setCubeAlertDismissed] = useState(false)
  const { isHealthyConnect } = useCubeConnectHealth()
  const chatShellRef = useRef<HTMLDivElement>(null)
  const { messages: visibleMessages, isEmpty: isEmptyChat } = getVisibleChatState(
    routeChatId,
    assistant
  )

  const {
    data: chatDetail,
    error: chatError,
    isLoading: isChatLoading,
    isFetching: isChatFetching,
    isError: isChatError
  } = useGetChatQuery(routeChatId ?? '', {
    skip: !routeChatId
  })

  const hasLocalMessagesForRoute =
    assistant.activeChatId === routeChatId && assistant.messages.length > 0

  const isRouteSynced = !routeChatId || assistant.activeChatId === routeChatId

  const showInitialLoader =
    Boolean(routeChatId) &&
    isChatLoading &&
    !chatDetail &&
    !hasLocalMessagesForRoute

  const showTransitionLoader =
    Boolean(routeChatId) &&
    !isRouteSynced &&
    !hasLocalMessagesForRoute &&
    (isChatLoading || isChatFetching)

  const showLoader = showInitialLoader || showTransitionLoader

  useEffect(() => {
    setCubeAlertDismissed(false)
  }, [routeChatId, isHealthyConnect])

  useEffect(() => {
    if (!routeChatId) {
      dispatch(assistantActions.clearSuppressChatLoad())
    }
  }, [routeChatId, dispatch])

  useEffect(() => {
    if (routeChatId || assistant.isRunning || assistant.messages.length > 0) {
      return
    }

    setDraft('')
  }, [routeChatId, assistant.isRunning, assistant.messages.length])

  useEffect(() => {
    if (!routeChatId) return
    if (!chatDetail) return
    if (assistant.suppressChatLoad) return
    if (assistant.isRunning) return

    if (assistant.activeChatId === routeChatId && assistant.messages.length > 0) {
      return
    }

    dispatch(
      assistantActions.loadChatMessages({
        chatId: chatDetail.id,
        messages: mapChatRecordsToUiMessages(chatDetail.messages)
      })
    )
  }, [
    routeChatId,
    chatDetail,
    dispatch,
    assistant.suppressChatLoad,
    assistant.isRunning,
    assistant.activeChatId,
    assistant.messages.length
  ])

  useEffect(() => {
    if (!routeChatId || !isChatError || isChatFetching || chatDetail) return

    const httpError = createErrorFromUnknown(chatError)
    if (httpError.statusCode === HTTP_ERROR_CODES.NotFound) {
      message.error(httpError.message)
      router.replace('/')
      return
    }

    if (getHttpErrorStatus(chatError) !== undefined) {
      message.error(httpError.message)
    }
  }, [
    isChatError,
    isChatFetching,
    chatDetail,
    chatError,
    routeChatId,
    message,
    router
  ])

  useEffect(() => {
    return () => {
      requestRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (isEmptyChat) return

    const shell = chatShellRef.current
    if (!shell) return

    let node: HTMLElement | null = shell.parentElement
    while (node) {
      const { overflowY, overflow } = getComputedStyle(node)
      if (
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflow === 'auto' ||
        overflow === 'scroll'
      ) {
        node.scrollTop = 0
      }
      node = node.parentElement
    }
  }, [isEmptyChat])

  const handleAbort = () => {
    if (assistant.activeTaskId) {
      void cancelTaskMutation(assistant.activeTaskId)
    }
    requestRef.current?.abort()
  }

  const handleRun = async () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }

    dispatch(
      assistantActions.startQuery({
        prompt: text,
        chatId: routeChatId ?? assistant.activeChatId
      })
    )

    const chatId = routeChatId ?? assistant.activeChatId ?? undefined
    const request = sendMessage({
      query: text,
      chat_id: chatId
    })
    requestRef.current = request

    try {
      const result = await request.unwrap()
      dispatch(cubeApi.util.invalidateTags(['CubeStats', 'QueryLogs']))
      setDraft('')

      if (!chatId && result.chat_id) {
        const messages = store.getState().assistant.messages
        dispatch(
          chatsApi.util.upsertQueryData(
            'getChat',
            result.chat_id,
            buildChatDetailCacheAfterSend(result, messages, text)
          )
        )
        router.replace(`/chat/${result.chat_id}`)
      }
    } catch (error) {
      const state = store.getState().assistant

      if (isRequestCancelled(error, state)) {
        if (isRequestAborted(error)) {
          dispatch(assistantActions.queryCancelled())
        }

        const cancelledQueryText = state.messages.at(-1)?.query_text
        if (!draft.trim() && cancelledQueryText) {
          setDraft(cancelledQueryText)
        }

        return
      }

      const streamAlreadyHandled =
        !state.isRunning &&
        (state.failedSummaryText !== null || state.lastResult !== null)

      if (!streamAlreadyHandled) {
        const httpError = createErrorFromUnknown(error)
        dispatch(assistantActions.queryFailed(httpError.message))
      }
      setDraft('')
    } finally {
      requestRef.current = null
    }
  }

  const composer = (
    <AssistantChatView
      variant={isEmptyChat ? 'empty' : 'active'}
      draft={draft}
      isRunning={assistant.isRunning}
      isHealthyConnect={isHealthyConnect}
      onDraftChange={setDraft}
      onRun={handleRun}
      onAbort={handleAbort}
    />
  )

  if (showLoader) {
    return (
      <div className={styles.chatShell}>
        <div className={styles.chatLoading}>
          <Spin size="large" />
        </div>
      </div>
    )
  }

  return (
    <div
      key={isEmptyChat ? 'empty' : 'active'}
      ref={chatShellRef}
      className={`${styles.chatShell} ${styles.chatShellActive}`}
    >
      {isEmptyChat ? (
        <div className={styles.emptyStage}>
          <div className={styles.chatColumn}>
            <AssistantEmptyLanding showCubeUnavailableAlert={!isHealthyConnect}>
              {composer}
            </AssistantEmptyLanding>
          </div>
        </div>
      ) : (
        <>
          <AssistantChatMessages
            messages={visibleMessages}
            chatId={routeChatId}
            isRunning={assistant.isRunning}
            streamEventType={assistant.streamEventType}
            streamEventMessage={assistant.streamEventMessage}
          />
          <div className={styles.composerDock}>
            {!isHealthyConnect && !cubeAlertDismissed ? (
              <div className={styles.chatColumn}>
                <CubeUnavailableAlert closable onClose={() => setCubeAlertDismissed(true)} />
              </div>
            ) : null}
            <div className={styles.chatColumn}>{composer}</div>
          </div>
        </>
      )}
    </div>
  )
}
