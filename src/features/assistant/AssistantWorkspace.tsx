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
          ответ фейкового LLM/DAX/OLAP.
        </Typography.Text>

        <ServiceInfo />

        <AssistantChat />

        {assistant.lastResult ? (
          <Card className={styles.resultCard}>
            <FeedbackBar logId={assistant.lastLogId} />

            <Divider />
            <AnalyticsTable
              rows={assistant.lastResult.data}
              columns={assistant.lastResult.columns}
              onExportExcel={() =>
                exportRowsToExcel(
                  assistant.lastResult?.data ?? [],
                  `cube-result-${Date.now()}.xlsx`
                )
              }
            />

            {assistant.lastResult.data.length > 0 ? (
              <>
                <Divider />
                <AnalyticsChart
                  config={assistant.lastResult.chart_config}
                  rows={assistant.lastResult.data}
                />
              </>
            ) : (
              <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
                График не сформирован: недостаточно данных по правилам визуализации или конфигурация
                отсутствует.
              </Typography.Paragraph>
            )}

            <Divider />
            <RequestDetailsDrawer result={assistant.lastResult} />
          </Card>
        ) : null}
      </Space>
    </div>
  )
}
