'use client'

import { Alert, App, Button, Card, Divider, Input, Space, Steps, Typography } from 'antd'
import { useMemo, useState } from 'react'
import classNames from 'classnames'

import { ACTIVE_FAKE_SCENARIO } from '@/modules/fakeLlm/config'
import type { AssistantPhase } from '@/services/assistantWorkflow/types'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { runAssistantThunk } from '@/store/slices/assistantSlice'

import { AnalyticsChart } from './components/AnalyticsChart'
import { AnalyticsTable } from './components/AnalyticsTable'
import { FeedbackBar } from './components/FeedbackBar'
import { RequestDetailsDrawer } from './components/RequestDetailsDrawer'
import { ServiceInfo } from './components/ServiceInfo'
import { exportRowsToExcel } from './utils/exportTable'

import styles from './AssistantWorkspace.module.css'

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function phaseToStepIndex(phase: AssistantPhase): number {
  switch (phase) {
    case 'checking':
      return 0
    case 'generating':
      return 1
    case 'fetching':
      return 2
    case 'interpreting':
      return 3
    default:
      return -1
  }
}

export function AssistantWorkspace() {
  const dispatch = useAppDispatch()
  const assistant = useAppSelector((s) => s.assistant)

  const { message } = App.useApp()

  const [draft, setDraft] = useState('')

  const activeStepIndex = useMemo(() => phaseToStepIndex(assistant.phase), [assistant.phase])

  const handleRun = () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }
    dispatch(runAssistantThunk(text))
    setDraft('')
  }

  return (
    <div className={styles.page}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Title level={2} className={styles.title}>
          Интеллектуальный помощник OLAP
        </Typography.Title>
        <Typography.Text type="secondary">
          Активный демон-сценарий: <Typography.Text code>{ACTIVE_FAKE_SCENARIO}</Typography.Text> — задаёт ответ фейкового
          LLM/DAX/OLAP. Измените в{' '}
          <Typography.Text code>src/modules/fakeLlm/config.ts</Typography.Text>.
        </Typography.Text>

        <ServiceInfo />

        <Card title="Диалог" className={styles.dialogCard}>
          {assistant.inputWarning ? <Alert showIcon type="warning" title={assistant.inputWarning} /> : null}
          {assistant.unreachableDetails ? (
            <Alert
              showIcon
              type="error"
              title="Сервер OLAP недоступен"
              description={
                <div>
                  <Typography.Paragraph>{assistant.unreachableDetails}</Typography.Paragraph>
                  <Typography.Paragraph code>{assistant.unreachableCode ?? 'нет кода ошибки'}</Typography.Paragraph>
                </div>
              }
            />
          ) : null}
          {assistant.failedSummaryText ? (
            <Alert showIcon type="error" title="Достигнут лимит попыток" description={assistant.failedSummaryText} />
          ) : null}

          <div className={styles.messageList} role="list">
            {assistant.messages.map((item) => (
              <div
                key={item.id}
                role="listitem"
                className={classNames(
                  styles.messageRow,
                  item.role === 'user' ? styles.messageUser : styles.messageBot,
                )}
              >
                <Space orientation="vertical">
                  <Typography.Text strong>{item.role === 'user' ? 'Вы' : 'Ассистент'}</Typography.Text>
                  <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {item.text}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">{timeFmt.format(item.createdAt)}</Typography.Text>
                </Space>
              </div>
            ))}
          </div>

          {assistant.isRunning ? (
            <div className={styles.stepWrap}>
              <Typography.Text>Статус выполнения</Typography.Text>
              <Steps
                size="small"
                status="process"
                current={activeStepIndex < 0 ? 0 : activeStepIndex}
                items={[
                  { title: 'Проверка' },
                  { title: 'LLM → DAX' },
                  { title: 'Запрос к кубу' },
                  { title: 'Интерпретация' },
                ]}
              />
            </div>
          ) : null}

          <Space orientation="vertical" style={{ width: '100%', marginTop: 12 }} size="middle">
            <Input.TextArea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder="Сформулируйте аналитический вопрос к кубу на естественном языке"
            />
            <Button type="primary" loading={assistant.isRunning} disabled={assistant.isRunning} onClick={handleRun}>
              Выполнить запрос
            </Button>
          </Space>
        </Card>

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
                exportRowsToExcel(assistant.lastSuccess?.rows ?? [], `cube-result-${Date.now()}.xlsx`)
              }
            />

            {assistant.lastSuccess.chartConfig ? (
              <>
                <Divider />
                <AnalyticsChart config={assistant.lastSuccess.chartConfig} rows={assistant.lastSuccess.rows} />
              </>
            ) : (
              <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
                График не сформирован: недостаточно данных по правилам визуализации или конфигурация отсутствует.
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
              {assistant.unreachableDurationMs != null ? `${assistant.unreachableDurationMs} мс` : 'нет данных'}.
            </Typography.Paragraph>
            <RequestDetailsDrawer attempts={0} retryLog={assistant.lastAttemptLogEntries} durationMs={assistant.unreachableDurationMs} />
          </Card>
        ) : null}
      </Space>
    </div>
  )
}
