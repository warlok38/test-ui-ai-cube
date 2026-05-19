'use client'

import { ArrowUpOutlined } from '@ant-design/icons'
import { Button, Input, Typography } from 'antd'

import styles from './AssistantChat.module.css'

type AssistantChatViewProps = {
  draft: string
  isRunning: boolean
  currentAttempt: number
  maxAttempts: number
  onDraftChange: (value: string) => void
  onRun: () => void
}

export function AssistantChatView({
  draft,
  isRunning,
  currentAttempt,
  maxAttempts,
  onDraftChange,
  onRun
}: AssistantChatViewProps) {
  const canSend = draft.trim().length > 0 && !isRunning

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onRun()
    }
  }

  return (
    <div className={styles.composerRoot}>
      <div className={styles.composerContent}>
        <div className={styles.composerBody}>
          {isRunning ? (
            <Typography.Text type="secondary" className={styles.composerStatus}>
              Попытка {currentAttempt} из {maxAttempts}
            </Typography.Text>
          ) : null}

          <Input.TextArea
            className={styles.composerTextarea}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            autoSize={{ minRows: 4, maxRows: 12 }}
            bordered={false}
            placeholder="Сформулируйте аналитический вопрос к кубу на естественном языке"
          />
        </div>

        <footer className={styles.composerFooter}>
          <div className={styles.composerFooterStart} />
          <div className={styles.composerFooterEnd}>
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              className={styles.composerSend}
              loading={isRunning}
              disabled={!canSend}
              onClick={onRun}
              aria-label="Отправить запрос"
            />
          </div>
        </footer>
      </div>
    </div>
  )
}
