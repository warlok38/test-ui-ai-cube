import { Typography } from 'antd'
import type { ReactNode } from 'react'

import styles from './ServiceInfo.module.css'

export type ServiceInfoKey = 'capabilities' | 'data'

export type ServiceInfoSection = {
  title: string
  content: ReactNode
}

export const SERVICE_INFO_SECTIONS: Record<ServiceInfoKey, ServiceInfoSection> = {
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
  }
}

export const SERVICE_INFO_MODAL_SECTIONS: ServiceInfoKey[] = ['capabilities', 'data']
