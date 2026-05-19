'use client'

import { useAppSelector } from '@/store/hooks'

import { AssistantChat } from './components/AssistantChat'
import { AssistantChatHeader } from './components/AssistantChat/AssistantChatHeader'

import styles from './AssistantWorkspace.module.css'

export function AssistantWorkspace() {
  const messages = useAppSelector((s) => s.assistant.messages)
  const hasMessages = messages.length > 0

  return (
    <div className={styles.page}>
      {hasMessages ? <AssistantChatHeader /> : null}
      <AssistantChat />
    </div>
  )
}
