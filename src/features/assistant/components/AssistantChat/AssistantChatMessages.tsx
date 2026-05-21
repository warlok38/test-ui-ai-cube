'use client'

import { useLayoutEffect, useMemo, useRef, type Ref } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { ScrollToBottom } from '@/components/ScrollToBottom'
import { ShimmerText } from '@/components/ShimmerText'
import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import { AnalyticsChart } from '@/features/assistant/components/AnalyticsChart'
import { AnalyticsTable } from '@/features/assistant/components/AnalyticsTable'
import { FeedbackBar } from '@/features/assistant/components/FeedbackBar'
import { usePinnedQuestionHandoff } from '@/features/assistant/hooks/usePinnedQuestionHandoff'
import { groupMessagesIntoTurns } from '@/features/assistant/utils/groupMessagesIntoTurns'
import { exportRowsToExcel } from '@/features/assistant/utils/exportTable'

import { PinnedUserQuestion } from './PinnedUserQuestion'

import styles from './AssistantChat.module.css'

type AssistantChatMessagesProps = {
  messages: ChatMessage[]
  isRunning: boolean
  currentAttempt: number
  maxAttempts: number
}

type MessageRowProps = {
  innerRef?: Ref<HTMLDivElement>
}

const DEFAULT_PIN_STATE = { pinDisabled: false }

function AssistantMessage({ message, innerRef }: MessageRowProps & { message: ChatMessage }) {
  const { result, logId } = message
  const hasTable = result && result.data.length > 0
  const hasChart = hasTable && result.chart_config

  return (
    <div ref={innerRef} className={styles.messageRow}>
      <div className={styles.messageAssistant}>
        <div className={styles.markdownBody}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>

        {hasTable ? (
          <div className={styles.messageAnalytics}>
            <AnalyticsTable
              rows={result.data}
              columns={result.columns}
              onExportExcel={() => exportRowsToExcel(result.data, `cube-result-${Date.now()}.xlsx`)}
            />
          </div>
        ) : null}

        {hasChart ? (
          <div className={styles.messageAnalytics}>
            <AnalyticsChart config={result.chart_config} rows={result.data} />
          </div>
        ) : null}

        {logId ? (
          <div className={styles.messageFeedback}>
            <FeedbackBar logId={logId} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AssistantChatMessages({
  messages,
  isRunning,
  currentAttempt,
  maxAttempts
}: AssistantChatMessagesProps) {
  const messageListRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const userRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const lastScrolledIdRef = useRef<string | null>(null)

  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages])
  const turnUserIds = useMemo(() => turns.map((turn) => turn.userMessage.id), [turns])

  const { pinStates, activePinnedMessageId } = usePinnedQuestionHandoff({
    scrollContainerRef: messageListRef,
    turnUserIds,
    userRefs
  })

  useLayoutEffect(() => {
    if (messages.length === 0) {
      lastScrolledIdRef.current = null
      return
    }

    const last = messages.at(-1)
    if (!last || last.id === lastScrolledIdRef.current) return

    lastScrolledIdRef.current = last.id
    const container = messageListRef.current
    if (!container) return

    if (last.role === 'user') {
      container.scrollTop = container.scrollHeight
      return
    }

    const el = messageRefs.current.get(last.id)
    if (!el) return

    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top
    container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' })
  }, [messages])

  const setMessageRef = (id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      messageRefs.current.set(id, node)
      return
    }

    messageRefs.current.delete(id)
  }

  const setUserRef = (id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      userRefs.current.set(id, node)
      return
    }

    userRefs.current.delete(id)
  }

  return (
    <div className={styles.messagesStage}>
      <div ref={messageListRef} className={styles.messageList} data-chat-scroll-container>
        <div className={styles.chatColumn}>
          {turns.map((turn) => {
            const pinState = pinStates.get(turn.userMessage.id) ?? DEFAULT_PIN_STATE

            return (
              <div key={turn.userMessage.id} className={styles.turn}>
                <PinnedUserQuestion
                  messageId={turn.userMessage.id}
                  activePinnedMessageId={pinState.pinDisabled ? null : activePinnedMessageId}
                  text={turn.userMessage.text}
                  innerRef={setUserRef(turn.userMessage.id)}
                />

                {turn.assistantMessages.map((message) => (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    innerRef={setMessageRef(message.id)}
                  />
                ))}
              </div>
            )
          })}

          {isRunning ? (
            <div className={styles.messageRow}>
              <ShimmerText
                className={styles.loadingStatus}
                text={`Попытка ${currentAttempt} из ${maxAttempts}`}
              />
            </div>
          ) : null}
        </div>
      </div>
      <ScrollToBottom scrollContainerRef={messageListRef} />
    </div>
  )
}
