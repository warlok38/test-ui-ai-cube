'use client'

import { LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import { App, Button, Space, Tooltip } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'
import { createErrorFromUnknown } from '@/shared/errors'
import type { RequestFeedback } from '@/shared/modules/fakeDb/schema'
import { useVoteMessageMutation } from '@/store/api/chatsApi'

import styles from './FeedbackBar.module.css'

type FeedbackBarProps = {
  messageId: string | null
  initialVote?: RequestFeedback | null
}

export function FeedbackBar({ messageId, initialVote = null }: FeedbackBarProps) {
  const { message } = App.useApp()
  const [voteMessage, { isLoading }] = useVoteMessageMutation()
  const [choice, setChoice] = useState<RequestFeedback | null>(initialVote)

  if (!messageId) {
    return null
  }

  const handle = async (vote: RequestFeedback) => {
    try {
      await voteMessage({ message_id: messageId, vote }).unwrap()
      setChoice(vote)
      message.success('Спасибо за обратную связь')
    } catch (error) {
      message.error(createErrorFromUnknown(error).message)
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
