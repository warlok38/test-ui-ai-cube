'use client'

import { AssistantChat } from './components/AssistantChat'

import styles from './AssistantWorkspace.module.css'

export function AssistantWorkspace() {
  return (
    <div className={styles.page}>
      <AssistantChat />
    </div>
  )
}
