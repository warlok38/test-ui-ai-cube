'use client'

import styles from './AssistantChatHeader.module.css'

export function AssistantChatHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.title}>Заголовок</div>
      </div>
    </header>
  )
}
