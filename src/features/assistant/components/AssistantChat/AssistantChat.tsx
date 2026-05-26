'use client'

import { App } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { appendRequestLog } from '@/fakeBackend/db/repo'
import type { ValidMaxAttempts } from '@/services/assistantWorkflow/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cubeApi, useExecuteQueryMutation } from '@/store/api/cubeApi'

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

export function AssistantChat() {
  const dispatch = useAppDispatch()
  const assistant = useAppSelector((s) => s.assistant)
  const { message } = App.useApp()
  const [executeQuery] = useExecuteQueryMutation()
  const requestRef = useRef<ReturnType<typeof executeQuery> | null>(null)

  const [draft, setDraft] = useState('')
  const chatShellRef = useRef<HTMLDivElement>(null)
  const isEmptyChat = assistant.messages.length === 0

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
    requestRef.current?.abort()
  }

  const handleRun = async () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }

    const maxAttempts: ValidMaxAttempts = 3
    dispatch(assistantActions.startQuery({ prompt: text, maxAttempts }))

    const startedAt = performance.now()
    const request = executeQuery({
      query: text,
      max_attempts: maxAttempts,
      _technical: assistant.technicalSettings
    })
    requestRef.current = request

    try {
      const result = await request.unwrap()

      const durationMs = Math.round(performance.now() - startedAt)
      let status: 'success' | 'server_unreachable' | 'failed_max' = 'failed_max'
      if (result.success) {
        status = 'success'
      } else if (assistant.technicalSettings.scenario === 'server_unreachable') {
        status = 'server_unreachable'
      }
      const log = appendRequestLog({
        userPrompt: text,
        finalDax: result.dax || null,
        status,
        attemptsUsed: result.success ? 1 : maxAttempts,
        retrySummaries: result.error ? [result.interpretation] : [],
        interpretation: result.interpretation,
        tableRows: result.success ? result.data : null,
        durationMs,
        feedback: null
      })
      dispatch(
        assistantActions.querySucceeded({
          prompt: text,
          result,
          logId: log.id
        })
      )
      dispatch(cubeApi.util.invalidateTags(['CubeStats', 'QueryLogs']))
      setDraft('')
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
            messages={assistant.messages}
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
