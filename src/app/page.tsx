import Link from 'next/link'

import styles from './HomeLinks.module.css'

export default function Home() {
  return (
    <div className={styles.wrap}>
      <p className={styles.badge}>Демо · без сервера</p>
      <h1 className={styles.title}>Интеллектуальный анализ OLAP‑кубов</h1>
      <p className={styles.lead}>
        Демонстрационный фронтенд: диалог на естественном языке, фейковая генерация DAX/LLM, таблицы, графики и
        журнал без реального сервера.
      </p>
      <nav className={styles.nav} aria-label="Быстрые действия на главной">
        <Link className={styles.ctaPrimary} href="/assistant">
          Открыть ассистента
        </Link>
        <Link className={styles.ctaGhost} href="/admin">
          Админ‑дашборд
        </Link>
      </nav>
      <section className={styles.hints} aria-label="Подсказка для разработчика">
        <p>
          Сценарий ответов настраивается в <code>src/modules/fakeLlm/config.ts</code>. Лог запросов и метрики
          сохраняются в <code>localStorage</code> для имитации базы данных.
        </p>
      </section>
    </div>
  )
}
