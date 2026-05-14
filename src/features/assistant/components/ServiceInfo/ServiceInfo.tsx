'use client'

import { useState, type ReactNode } from 'react'
import { Modal, Typography } from 'antd'
import styles from './ServiceInfo.module.css'

type ServiceInfoKey = 'capabilities' | 'data' | 'limits'

type ServiceInfoSection = {
  title: string
  content: ReactNode
}

const SERVICE_INFO_SECTIONS: Record<ServiceInfoKey, ServiceInfoSection> = {
  capabilities: {
    title: 'Что умеет ИИ модуль',
    content: (
      <ul className={styles.modalList}>
        <li>Переформулирует вопрос на естественном языке в DAX-подобный запрос к кубу.</li>
        <li>
          Возвращает таблицу результата, краткую аналитическую интерпретацию и простую визуализацию.
        </li>
        <li>Выполняет базовую проверку доступности контура данных до запуска полного сценария.</li>
      </ul>
    )
  },
  data: {
    title: 'Какими данными владеет ИИ модуль?',
    content: (
      <div className={styles.modalText}>
        <Typography.Paragraph>
          Модуль работает с агрегированными данными OLAP-куба и промежуточными артефактами
          пайплайна: сформированным DAX-запросом, строками ответа и технической диагностикой.
        </Typography.Paragraph>
        <Typography.Paragraph>
          В интерфейсе вы видите только необходимые для анализа сущности: результирующую таблицу,
          краткий вывод модели, базовый график и служебный статус выполнения.
        </Typography.Paragraph>
      </div>
    )
  },
  limits: {
    title: 'Ограничения и риски',
    content: (
      <ul className={styles.modalList}>
        <li>Ответ LLM недетерминирован: возможны синтаксические и смысловые ошибки в DAX.</li>
        <li>
          Сервис не заменяет проверку KPI аналитиком и должен использоваться как инструмент
          ускорения.
        </li>
        <li>
          При больших выборках отображается сокращенный набор агрегированных строк
          (демо-ограничение).
        </li>
        <li>Если пинг куба завершается ошибкой, запуск аналитического сценария блокируется.</li>
      </ul>
    )
  }
}

export function ServiceInfo() {
  const [activeSection, setActiveSection] = useState<ServiceInfoKey | null>(null)

  const handleTagClick = (section: ServiceInfoKey) => {
    setActiveSection(section)
  }

  const handleClose = () => setActiveSection(null)
  const selectedSection = activeSection ? SERVICE_INFO_SECTIONS[activeSection] : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.tagsRow} role="list" aria-label="Справочные разделы ассистента">
        {(Object.keys(SERVICE_INFO_SECTIONS) as ServiceInfoKey[]).map((section) => (
          <button
            key={section}
            type="button"
            role="listitem"
            className={styles.tagButton}
            onClick={() => handleTagClick(section)}
          >
            {SERVICE_INFO_SECTIONS[section].title}
          </button>
        ))}
      </div>

      <Modal
        title={selectedSection?.title}
        open={Boolean(selectedSection)}
        onCancel={handleClose}
        footer={null}
      >
        {selectedSection?.content}
      </Modal>
    </div>
  )
}
