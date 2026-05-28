'use client'

import { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { ScrollToBottom } from '@/components/ScrollToBottom'
import { ShimmerText } from '@/components/ShimmerText'
import type { ChatMessage, StreamingStatus } from '@/features/assistant/model/assistantSlice'
import { AnalyticsChart } from '@/features/assistant/components/AnalyticsChart'
import { AnalyticsTable } from '@/features/assistant/components/AnalyticsTable'
import { FeedbackBar } from '@/features/assistant/components/FeedbackBar'
import { useChatAutoScroll } from '@/features/assistant/hooks/useChatAutoScroll'
import { usePinnedQuestionHandoff } from '@/features/assistant/hooks/usePinnedQuestionHandoff'
import { groupMessagesIntoTurns } from '@/features/assistant/utils/groupMessagesIntoTurns'
import { exportRowsToExcel } from '@/features/assistant/utils/exportTable'

import { PinnedUserQuestion } from './PinnedUserQuestion'

import styles from './AssistantChat.module.css'

type AssistantChatMessagesProps = {
  messages: ChatMessage[]
  chatId?: string | null
  isRunning: boolean
  streamingStatus: StreamingStatus | null
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const { id, interpretation, q_data, q_columns, chart_config, vote } = message
  const hasTable = Boolean(q_data && q_data.length > 0)
  const hasChart = hasTable && chart_config

  if (!interpretation) {
    return null
  }

  return (
    <div className={styles.messageRow}>
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

export function AssistantChatMessages({
  messages,
  chatId,
  isRunning,
  streamingStatus
}: AssistantChatMessagesProps) {
  const messageListRef = useRef<HTMLDivElement>(null)
  const chatColumnRef = useRef<HTMLDivElement>(null)
  const userRefs = useRef<Map<string, HTMLDivElement>>(new Map())

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

  useChatAutoScroll({
    scrollContainerRef: messageListRef,
    contentRef: chatColumnRef,
    messages,
    chatId,
    isRunning
  })

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
        <div ref={chatColumnRef} className={styles.chatColumn}>
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

                <AssistantMessage message={turn.message} />
              </div>
            )
          })}

          {isRunning ? (
            <div className={styles.messageRow}>
              <div className={styles.messageAssistant}>
                <ShimmerText
                  className={styles.loadingStatus}
                  text={streamingStatus?.message ?? 'Обработка запроса…'}
                />
                {streamingStatus?.step ? (
                  <span className={styles.streamingStep}>{streamingStatus.step}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <ScrollToBottom scrollContainerRef={messageListRef} />
    </div>
  )
}
