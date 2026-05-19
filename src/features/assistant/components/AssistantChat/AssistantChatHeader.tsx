'use client'

import styles from './AssistantChatHeader.module.css'

export function AssistantChatHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <h1 className={styles.title}>Заголовок</h1>
      </div>
    </header>
  )
}
