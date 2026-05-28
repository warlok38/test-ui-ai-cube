'use client'

import { App, Spin } from 'antd'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import type { RootState } from '@/store'
import { buildChatDetailCacheAfterSend } from '@/features/assistant/utils/buildChatDetailCache'
import { getQueryErrorStatus } from '@/features/assistant/utils/getQueryErrorStatus'
import { getVisibleChatState } from '@/features/assistant/utils/getVisibleChatState'
import { mapChatRecordsToUiMessages } from '@/features/assistant/utils/mapChatMessages'
import type { ValidMaxAttempts } from '@/services/assistantWorkflow/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  chatsApi,
  mainApi,
  useCancelTaskMutation,
  useGetChatQuery,
  useSendMessageMutation
} from '@/store/api'
import { createId } from '@/utils/createId'

import { AssistantChatMessages } from './AssistantChatMessages'
import { AssistantChatView } from './AssistantChatView'
import { AssistantEmptyLanding } from './AssistantEmptyLanding'

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
  const taskIdRef = useRef<string | null>(null)

  const [draft, setDraft] = useState('')
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
    if (!routeChatId) {
      dispatch(assistantActions.clearSuppressChatLoad())
      setDraft('')
      return
    }

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

    const status = getQueryErrorStatus(chatError)
    if (status === 404) {
      message.error('Чат не найден')
      router.replace('/')
      return
    }

    if (status !== undefined) {
      message.error('Не удалось загрузить чат')
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
    const taskId = taskIdRef.current ?? assistant.currentTaskId
    if (taskId) {
      void cancelTaskMutation(taskId)
    }
    requestRef.current?.abort()
  }

  const handleRun = async () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }

    const maxAttempts: ValidMaxAttempts = 3
    const taskId = createId()
    taskIdRef.current = taskId

    dispatch(
      assistantActions.startQuery({
        prompt: text,
        maxAttempts,
        chatId: routeChatId ?? assistant.activeChatId
      })
    )

    const chatId = routeChatId ?? assistant.activeChatId ?? undefined
    const request = sendMessage({
      query: text,
      max_attempts: maxAttempts,
      chat_id: chatId,
      task_id: taskId,
      _technical: assistant.technicalSettings
    })
    requestRef.current = request

    try {
      const result = await request.unwrap()

      dispatch(
        assistantActions.querySucceeded({
          prompt: text,
          result
        })
      )
      dispatch(mainApi.util.invalidateTags(['CubeStats', 'QueryLogs']))
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
      if (isRequestAborted(error)) {
        dispatch(assistantActions.queryCancelled())
        return
      }
      const errorMessage = error instanceof Error ? error.message : 'Сбой выполнения запроса'
      dispatch(assistantActions.queryFailed(errorMessage))
      setDraft('')
    } finally {
      requestRef.current = null
      taskIdRef.current = null
    }
  }

  const composer = (
    <AssistantChatView
      variant={isEmptyChat ? 'empty' : 'active'}
      draft={draft}
      isRunning={assistant.isRunning}
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
            <AssistantEmptyLanding>{composer}</AssistantEmptyLanding>
          </div>
        </div>
      ) : (
        <>
          <AssistantChatMessages
            messages={visibleMessages}
            chatId={routeChatId}
            isRunning={assistant.isRunning}
            streamingStatus={assistant.streamingStatus}
          />
          <div className={styles.composerDock}>
            <div className={styles.chatColumn}>{composer}</div>
          </div>
        </>
      )}
    </div>
  )
}
