'use client'

import { Typography } from 'antd'
import { useLayoutEffect, useRef, type Ref } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import { AnalyticsChart } from '@/features/assistant/components/AnalyticsChart'
import { AnalyticsTable } from '@/features/assistant/components/AnalyticsTable'
import { FeedbackBar } from '@/features/assistant/components/FeedbackBar'
import { exportRowsToExcel } from '@/features/assistant/utils/exportTable'

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

function UserMessage({ text, innerRef }: MessageRowProps & { text: string }) {
  return (
    <div ref={innerRef} className={styles.messageRow}>
      <div className={`${styles.messageBubble} ${styles.messageUser}`}>{text}</div>
    </div>
  )
}

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
  const lastScrolledIdRef = useRef<string | null>(null)

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

  return (
    <div ref={messageListRef} className={styles.messageList}>
      <div className={styles.chatColumn}>
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage
              key={message.id}
              text={message.text}
              innerRef={setMessageRef(message.id)}
            />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              innerRef={setMessageRef(message.id)}
            />
          )
        )}

        {isRunning ? (
          <div className={styles.messageRow}>
            <Typography.Text type="secondary" className={styles.loadingStatus}>
              Попытка {currentAttempt} из {maxAttempts}
            </Typography.Text>
          </div>
        ) : null}
      </div>
    </div>
  )
}
