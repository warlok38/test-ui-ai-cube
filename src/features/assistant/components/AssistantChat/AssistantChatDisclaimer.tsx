import styles from './AssistantChat.module.css'

const DISCLAIMER_TEXT = 'ИИ Модуль может ошибаться. Рекомендуем проверять ответы'

export function AssistantChatDisclaimer() {
  return <p className={styles.composerDisclaimer}>{DISCLAIMER_TEXT}</p>
}
