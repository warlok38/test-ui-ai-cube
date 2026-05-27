'use client'

import { LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import { App, Button, Space, Tooltip } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'
import type { RequestFeedback } from '@/modules/fakeDb/schema'
import { usePatchMessageFeedbackMutation } from '@/store/api/chatsApi'

import styles from './FeedbackBar.module.css'

type FeedbackBarProps = {
  messageId: string | null
  initialFeedback?: RequestFeedback | null
}

export function FeedbackBar({ messageId, initialFeedback = null }: FeedbackBarProps) {
  const { message } = App.useApp()
  const [patchFeedback, { isLoading }] = usePatchMessageFeedbackMutation()
  const [choice, setChoice] = useState<RequestFeedback | null>(initialFeedback)

  if (!messageId) {
    return null
  }

  const handle = async (feedback: RequestFeedback) => {
    try {
      await patchFeedback({ messageId, body: { feedback } }).unwrap()
      setChoice(feedback)
      message.success('Спасибо за обратную связь')
    } catch {
      message.error('Не удалось сохранить оценку')
    }
  }

  return (
    <Space size={4}>
      <Tooltip title="Полезно">
        <Button
          type="text"
          size="small"
          aria-label="Полезно"
          className={classNames(choice === 'like' && styles.btnSelectedLike)}
          icon={<LikeOutlined />}
          disabled={!!choice || isLoading}
          onClick={() => void handle('like')}
        />
      </Tooltip>
      <Tooltip title="Не помогло">
        <Button
          type="text"
          size="small"
          aria-label="Не помогло"
          className={classNames(choice === 'dislike' && styles.btnSelectedDislike)}
          icon={<DislikeOutlined />}
          disabled={!!choice || isLoading}
          onClick={() => void handle('dislike')}
        />
      </Tooltip>
    </Space>
  )
}
