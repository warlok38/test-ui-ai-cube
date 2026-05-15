'use client'

import { Card, Divider, Space, Typography } from 'antd'

import { useAppSelector } from '@/store/hooks'

import { AnalyticsChart } from './components/AnalyticsChart'
import { AssistantChat } from './components/AssistantChat'
import { AnalyticsTable } from './components/AnalyticsTable'
import { FeedbackBar } from './components/FeedbackBar'
import { RequestDetailsDrawer } from './components/RequestDetailsDrawer'
import { ServiceInfo } from './components/ServiceInfo'
import { exportRowsToExcel } from './utils/exportTable'

import styles from './AssistantWorkspace.module.css'

export function AssistantWorkspace() {
  const assistant = useAppSelector((s) => s.assistant)

  return (
    <div className={styles.page}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Title level={2} className={styles.title}>
          Главная
        </Typography.Title>
        <Typography.Text type="secondary">
          Активный демон-сценарий:{' '}
          <Typography.Text code>{assistant.technicalSettings.scenario}</Typography.Text> — задаёт
          ответ фейкового LLM/DAX/OLAP. Измените в разделе{' '}
          <Typography.Text code>/technical</Typography.Text>.
        </Typography.Text>

        <ServiceInfo />

        <AssistantChat />

        {assistant.lastSuccess ? (
          <Card title="Ответ модели и данные куба" className={styles.resultCard}>
            <Typography.Paragraph>{assistant.lastSuccess.interpretation}</Typography.Paragraph>

            <FeedbackBar logId={assistant.lastLogId} />

            <Divider />
            <RequestDetailsDrawer
              success={assistant.lastSuccess}
              attempts={assistant.lastSuccess.attemptsUsed}
              retryLog={assistant.lastSuccess.retryLog}
              durationMs={assistant.lastSuccess.durationMs}
            />

            <Divider />
            <AnalyticsTable
              rows={assistant.lastSuccess.rows}
              onExportExcel={() =>
                exportRowsToExcel(
                  assistant.lastSuccess?.rows ?? [],
                  `cube-result-${Date.now()}.xlsx`
                )
              }
            />

            {assistant.lastSuccess.chartConfig ? (
              <>
                <Divider />
                <AnalyticsChart
                  config={assistant.lastSuccess.chartConfig}
                  rows={assistant.lastSuccess.rows}
                />
              </>
            ) : (
              <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
                График не сформирован: недостаточно данных по правилам визуализации или конфигурация
                отсутствует.
              </Typography.Paragraph>
            )}
          </Card>
        ) : null}

        {assistant.lastFailureDiagnostics && !assistant.lastSuccess ? (
          <Card title="Техническое резюме">
            <RequestDetailsDrawer
              failureDax={assistant.lastFailureDiagnostics.lastDax}
              attempts={assistant.lastFailureDiagnostics.attemptsUsed}
              retryLog={assistant.lastFailureDiagnostics.retryLog}
              durationMs={assistant.lastFailureDiagnostics.durationMs}
            />
          </Card>
        ) : null}

        {assistant.unreachableDetails && !assistant.lastSuccess ? (
          <Card title="Диагностика соединения">
            <Typography.Paragraph>
              Последнее измерение пинга:{' '}
              {assistant.unreachableDurationMs !== null
                ? `${assistant.unreachableDurationMs} мс`
                : 'нет данных'}
              .
            </Typography.Paragraph>
            <RequestDetailsDrawer
              attempts={0}
              retryLog={assistant.lastAttemptLogEntries}
              durationMs={assistant.unreachableDurationMs}
            />
          </Card>
        ) : null}
      </Space>
    </div>
  )
}
