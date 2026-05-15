'use client'

import { App } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { runAssistantThunk } from '@/features/assistant/model/assistantSlice'
import type { AssistantPhase } from '@/services/assistantWorkflow/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import { AssistantChatView } from './AssistantChatView'

function phaseToStepIndex(phase: AssistantPhase): number {
  switch (phase) {
    case 'checking':
      return 0
    case 'generating':
      return 1
    case 'fetching':
      return 2
    case 'interpreting':
      return 3
    default:
      return -1
  }
}

export function AssistantChat() {
  const dispatch = useAppDispatch()
  const assistant = useAppSelector((s) => s.assistant)
  const { message } = App.useApp()

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

  const handleRun = () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }

    shouldSmoothScrollRef.current = true
    setIsPinnedToBottom(true)
    dispatch(runAssistantThunk(text))
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
