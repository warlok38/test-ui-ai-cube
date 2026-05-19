'use client'

import { Typography } from 'antd'
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

function UserMessage({ text }: { text: string }) {
  return (
    <div className={styles.messageRow}>
      <div className={`${styles.messageBubble} ${styles.messageUser}`}>{text}</div>
    </div>
  )
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const { result, logId } = message
  const hasTable = result && result.data.length > 0
  const hasChart = hasTable && result.chart_config

  return (
    <div className={styles.messageRow}>
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
  return (
    <div className={styles.messageList}>
      <div className={styles.chatColumn}>
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} text={message.text} />
          ) : (
            <AssistantMessage key={message.id} message={message} />
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
