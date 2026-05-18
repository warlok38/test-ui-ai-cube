'use client'

import { App } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { appendRequestLog } from '@/modules/fakeDb/repo'
import type { AssistantPhase, ValidMaxAttempts } from '@/services/assistantWorkflow/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cubeApi, useExecuteQueryMutation } from '@/store/api/cubeApi'

import { AssistantChatView } from './AssistantChatView'

function phaseToStepIndex(phase: AssistantPhase): number {
  switch (phase) {
    case 'checking':
    case 'generating':
    case 'fetching':
      return 0
    case 'interpreting':
      return 1
    default:
      return -1
  }
}

export function AssistantChat() {
  const dispatch = useAppDispatch()
  const assistant = useAppSelector((s) => s.assistant)
  const { message } = App.useApp()
  const [executeQuery] = useExecuteQueryMutation()

  const [draft, setDraft] = useState('')
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const messageListRef = useRef<HTMLDivElement>(null)
  const shouldSmoothScrollRef = useRef(false)

  const activeStepIndex = useMemo(() => phaseToStepIndex(assistant.phase), [assistant.phase])

  const handleMessageListScroll = () => {
    const container = messageListRef.current
    if (!container) return

    const bottomOffset = container.scrollHeight - container.scrollTop - container.clientHeight
    setIsPinnedToBottom(bottomOffset <= 24)
  }

  useEffect(() => {
    if (!isPinnedToBottom) return
    const container = messageListRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: shouldSmoothScrollRef.current ? 'smooth' : 'auto'
    })
    shouldSmoothScrollRef.current = false
  }, [assistant.messages, isPinnedToBottom])

  const handleRun = async () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }

    const maxAttempts: ValidMaxAttempts = 3
    shouldSmoothScrollRef.current = true
    setIsPinnedToBottom(true)
    dispatch(assistantActions.startQuery({ prompt: text, maxAttempts }))

    const startedAt = performance.now()
    try {
      dispatch(
        assistantActions.setPhase({
          phase: 'fetching',
          currentAttempt: 1,
          maxAttempts
        })
      )
      const result = await executeQuery({ query: text, max_attempts: maxAttempts }).unwrap()
      dispatch(
        assistantActions.setPhase({
          phase: 'interpreting',
          currentAttempt: 1,
          maxAttempts
        })
      )

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
      dispatch(cubeApi.util.invalidateTags(['Metrics', 'Logs']))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Сбой выполнения запроса'
      dispatch(assistantActions.queryFailed(errorMessage))
    }

    setDraft('')
  }

  return (
    <AssistantChatView
      inputWarning={assistant.inputWarning}
      unreachableDetails={assistant.unreachableDetails}
      unreachableCode={assistant.unreachableCode}
      failedSummaryText={assistant.failedSummaryText}
      messages={assistant.messages}
      isRunning={assistant.isRunning}
      currentAttempt={assistant.currentAttempt}
      maxAttempts={assistant.maxAttempts}
      activeStepIndex={activeStepIndex}
      draft={draft}
      messageListRef={messageListRef}
      onDraftChange={setDraft}
      onRun={handleRun}
      onMessageListScroll={handleMessageListScroll}
    />
  )
}
