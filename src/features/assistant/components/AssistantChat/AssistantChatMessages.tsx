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

function AssistantMessage({ message, innerRef }: MessageRowProps & { message: ChatMessage }) {
  const { id, interpretation, q_data, q_columns, chart_config, vote } = message
  const hasTable = Boolean(q_data && q_data.length > 0)
  const hasChart = hasTable && chart_config

  if (!interpretation) {
    return null
  }

  return (
    <div ref={innerRef} className={styles.messageRow}>
      <div className={styles.messageAssistant}>
        <div className={styles.markdownBody}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{interpretation}</ReactMarkdown>
        </div>

        {hasTable && q_data && q_columns ? (
          <div className={styles.messageAnalytics}>
            <AnalyticsTable
              rows={q_data}
              columns={q_columns}
              onExportExcel={() => exportRowsToExcel(q_data, `cube-result-${Date.now()}.xlsx`)}
            />
          </div>
        ) : null}

        {hasChart && chart_config && q_data ? (
          <div className={styles.messageAnalytics}>
            <AnalyticsChart config={chart_config} rows={q_data} />
          </div>
        ) : null}

        {id ? (
          <div className={styles.messageFeedback}>
            <FeedbackBar messageId={id} initialVote={vote} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function getAssistantScrollKey(message: ChatMessage): string {
  return `${message.id ?? 'pending'}-assistant`
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
  const turnUserIds = useMemo(
    () => turns.map((turn) => turn.message.id ?? turn.message.created_at),
    [turns]
  )

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
    if (!last) return

    const scrollKey = last.interpretation ? getAssistantScrollKey(last) : (last.id ?? last.created_at)
    if (scrollKey === lastScrolledIdRef.current) return

    lastScrolledIdRef.current = scrollKey
    const container = messageListRef.current
    if (!container) return

    if (!last.interpretation) {
      container.scrollTop = container.scrollHeight
      return
    }

    const el = messageRefs.current.get(getAssistantScrollKey(last))
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
            const messageKey = turn.message.id ?? turn.message.created_at
            const pinState = pinStates.get(messageKey) ?? { pinDisabled: false }

            return (
              <div key={messageKey} className={styles.turn}>
                <PinnedUserQuestion
                  messageId={messageKey}
                  activePinnedMessageId={pinState.pinDisabled ? null : activePinnedMessageId}
                  text={turn.message.query_text}
                  innerRef={setUserRef(messageKey)}
                />

                <AssistantMessage
                  message={turn.message}
                  innerRef={setMessageRef(getAssistantScrollKey(turn.message))}
                />
              </div>
            )
          })}

          {isRunning ? (
            <div className={styles.messageRow}>
              <div className={styles.messageAssistant}>
                <ShimmerText
                  className={styles.loadingStatus}
                  text={`Попытка ${currentAttempt} из ${maxAttempts}`}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <ScrollToBottom scrollContainerRef={messageListRef} />
    </div>
  )
}
