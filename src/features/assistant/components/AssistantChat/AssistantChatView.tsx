'use client'

import { Alert, Button, Card, Input, Space, Steps, Typography } from 'antd'
import type { RefObject } from 'react'
import classNames from 'classnames'
import type { ChatMessage } from '@/features/assistant/model/assistantSlice'

import styles from './AssistantChat.module.css'

type AssistantChatViewProps = {
  inputWarning: string | null
  unreachableDetails: string | null
  unreachableCode: string | null
  failedSummaryText: string | null
  messages: ChatMessage[]
  isRunning: boolean
  currentAttempt: number
  maxAttempts: number
  activeStepIndex: number
  draft: string
  messageListRef: RefObject<HTMLDivElement>
  onDraftChange: (value: string) => void
  onRun: () => void
  onMessageListScroll: () => void
}

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})

export function AssistantChatView({
  inputWarning,
  unreachableDetails,
  unreachableCode,
  failedSummaryText,
  messages,
  isRunning,
  currentAttempt,
  maxAttempts,
  activeStepIndex,
  draft,
  messageListRef,
  onDraftChange,
  onRun,
  onMessageListScroll
}: AssistantChatViewProps) {
  return (
    <Card className={styles.dialogCard}>
      {inputWarning ? <Alert showIcon type="warning" title={inputWarning} /> : null}
      {unreachableDetails ? (
        <Alert
          showIcon
          type="error"
          title="Сервер OLAP недоступен"
          description={
            <div>
              <Typography.Paragraph>{unreachableDetails}</Typography.Paragraph>
              <Typography.Paragraph code>{unreachableCode ?? 'нет кода ошибки'}</Typography.Paragraph>
            </div>
          }
        />
      ) : null}
      {failedSummaryText ? (
        <Alert
          showIcon
          type="error"
          title="Достигнут лимит попыток"
          description={failedSummaryText}
        />
      ) : null}

      {messages.length > 0 ? (
        <div
          className={styles.messageList}
          role="list"
          ref={messageListRef}
          onScroll={onMessageListScroll}
        >
          {messages.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className={classNames(
                styles.messageRow,
                item.role === 'user' ? styles.messageUser : styles.messageBot
              )}
            >
              <Space orientation="vertical">
                <Typography.Text strong>{item.role === 'user' ? 'Вы' : 'Ассистент'}</Typography.Text>
                <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {item.text}
                </Typography.Paragraph>
                <Typography.Text type="secondary">{timeFmt.format(item.createdAt)}</Typography.Text>
              </Space>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.composerArea}>
        <Space orientation="vertical" className={styles.composerForm} size="middle">
          <div
            className={classNames(styles.composerContent, isRunning ? styles.composerContentLoading : null)}
          >
            {isRunning ? (
              <div className={styles.stepWrap}>
                <div className={styles.stepHeader}>
                  <Typography.Text>Статус выполнения</Typography.Text>
                  <Typography.Text strong>
                    попытка: {currentAttempt} из {maxAttempts}
                  </Typography.Text>
                </div>
                <Steps
                  size="small"
                  status="process"
                  current={activeStepIndex < 0 ? 0 : activeStepIndex}
                  items={[
                    { title: 'Проверка' },
                    { title: 'LLM → DAX' },
                    { title: 'Запрос к кубу' },
                    { title: 'Интерпретация' }
                  ]}
                />
              </div>
            ) : (
              <Input.TextArea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                rows={4}
                bordered={false}
                style={{ height: '100%', resize: 'none' }}
                placeholder="Сформулируйте аналитический вопрос к кубу на естественном языке"
              />
            )}
          </div>
          <Button type="primary" loading={isRunning} disabled={isRunning} onClick={onRun}>
            {isRunning ? 'Выполняется...' : 'Выполнить запрос'}
          </Button>
        </Space>
      </div>
    </Card>
  )
}
