'use client'

import { LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import { App, Button, Space, Tooltip } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'
import { useSubmitFeedbackMutation } from '@/store/api'

import styles from './FeedbackBar.module.css'

type FeedbackBarProps = {
  logId: string | null
}

export function FeedbackBar({ logId }: FeedbackBarProps) {
  const { message } = App.useApp()
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation()
  const [choice, setChoice] = useState<'like' | 'dislike' | null>(null)

  if (!logId) {
    return null
  }

  const handle = async (feedback: 'like' | 'dislike') => {
    const ok = await submitFeedback({ logId, feedback }).unwrap()
    if (!ok) {
      message.error('Не удалось сохранить оценку')
      return
    }
    setChoice(feedback)
    message.success('Спасибо за обратную связь')
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
