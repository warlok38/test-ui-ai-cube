import type { ReactNode } from 'react'

import styles from './AssistantChat.module.css'
import { AssistantChatDisclaimer } from './AssistantChatDisclaimer'

const ASSISTANT_LANDING_DESCRIPTION = [
  'ИИ Модуль помогает формулировать аналитические вопросы к кубу на естественном языке и получать таблицы, интерпретации и базовые визуализации.',
  'Задайте вопрос в поле выше — модуль сформирует запрос к данным и покажет результат в диалоге. При необходимости уточните формулировку и отправьте запрос повторно.',
  'Для подробной справки о возможностях и источниках данных откройте раздел «Инфо» в меню пользователя в боковой панели.'
]

type AssistantEmptyLandingProps = {
  children: ReactNode
}

export function AssistantEmptyLanding({ children }: AssistantEmptyLandingProps) {
  return (
    <div className={styles.emptyLanding}>
      <h1 className={styles.emptyTitle}>ИИ Модуль</h1>
      {children}
      <AssistantChatDisclaimer />
      <section className={styles.descriptionCard} aria-labelledby="assistant-landing-description">
        <h2 id="assistant-landing-description" className={styles.descriptionCardHeader}>
          О модуле
        </h2>
        <div className={styles.descriptionCardBody}>
          {ASSISTANT_LANDING_DESCRIPTION.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>
    </div>
  )
}
