'use client'

import { Alert, Collapse } from 'antd'
import styles from './ServiceInfo.module.css'

export function ServiceInfo() {
  return (
    <div className={styles.wrapper}>
      <Alert
        type="info"
        title="Что может сервис"
        description={
          <ul className={styles.list}>
            <li>Переформулировать ваш вопрос на естественном языке в DAX-подобный запрос и показать ответ контура данных.</li>
            <li>Отобразить таблицу, короткий аналитический текст и простой график (линия/бар).</li>
            <li>Выполнить базовый пинг точки доступа к многомерному кубу (демо-симулятор).</li>
          </ul>
        }
      />
      <Collapse
        bordered={false}
        className={styles.collapse}
        items={[
          {
            key: 'limits',
            label: 'Ограничения и риски',
            children: (
              <div className={styles.limits}>
                <p>
                  Ответ LLM недетерминирован: возможны ошибки синтаксиса DAX, неверное чтение схемы измерений и меры.
                  Сервис не заменяет контроль аналитиком качества KPI.
                </p>
                <p>
                  Отображаются только агрегированные строки результата: при больших наборах данные режутся на стороне куба
                  (демо ограничение).
                </p>
                <p>
                  SLA и доступность кубов зависят от производственной среды; при сбое пинга выполнение вопроса не
                  стартует.
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
