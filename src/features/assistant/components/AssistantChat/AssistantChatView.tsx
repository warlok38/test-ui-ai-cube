'use client'

import { ArrowUpOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'

import styles from './AssistantChat.module.css'

type AssistantChatViewProps = {
  variant: 'empty' | 'active'
  draft: string
  isRunning: boolean
  onDraftChange: (value: string) => void
  onRun: () => void
  onAbort: () => void
}

export function AssistantChatView({
  variant,
  draft,
  isRunning,
  onDraftChange,
  onRun,
  onAbort
}: AssistantChatViewProps) {
  const canSend = draft.trim().length > 0 && !isRunning
  const minRows = variant === 'empty' ? 4 : 2

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
          <Input.TextArea
            className={styles.composerTextarea}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            autoSize={{ minRows, maxRows: 12 }}
            bordered={false}
            placeholder="Сформулируйте аналитический вопрос к кубу на естественном языке"
          />
        </div>

        <footer className={styles.composerFooter}>
          <div className={styles.composerFooterStart} />
          <div className={styles.composerFooterEnd}>
            {isRunning ? (
              <Button
                type="primary"
                shape="circle"
                icon={<CloseOutlined />}
                className={styles.composerSend}
                onClick={onAbort}
                title="Отменить запрос"
              />
            ) : (
              <Button
                type="primary"
                shape="circle"
                icon={<ArrowUpOutlined />}
                className={styles.composerSend}
                disabled={!canSend}
                onClick={onRun}
              />
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
