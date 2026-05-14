'use client'

import { LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import { App, Button, Space, Typography } from 'antd'
import { useState } from 'react'
import { useSubmitFeedbackMutation } from '@/store/api/cubeApi'

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
    <div>
      <Typography.Text>Оцените результат:</Typography.Text>
      <Space style={{ marginLeft: 8 }}>
        <Button
          type={choice === 'like' ? 'primary' : 'default'}
          icon={<LikeOutlined />}
          disabled={!!choice || isLoading}
          onClick={() => void handle('like')}
        >
          Полезно
        </Button>
        <Button
          danger={choice === 'dislike'}
          icon={<DislikeOutlined />}
          disabled={!!choice || isLoading}
          onClick={() => void handle('dislike')}
        >
          Не помогло
        </Button>
      </Space>
    </div>
  )
}
