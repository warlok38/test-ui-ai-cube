'use client'

import { Alert, App, Button, Card, Divider, Input, Space, Steps, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import { runAssistantThunk } from '@/features/assistant/model/assistantSlice'
import type { AssistantPhase } from '@/services/assistantWorkflow/types'

import { useAppDispatch, useAppSelector } from '@/store/hooks'

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
  second: '2-digit'
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
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const messageListRef = useRef<HTMLDivElement>(null)
  const shouldSmoothScrollRef = useRef(false)

  const activeStepIndex = useMemo(() => phaseToStepIndex(assistant.phase), [assistant.phase])

  const updatePinToBottomState = () => {
    const container = messageListRef.current
    if (!container) return
    const bottomOffset = container.scrollHeight - container.scrollTop - container.clientHeight
    setIsPinnedToBottom(bottomOffset <= 24)
  }

  useEffect(() => {
    if (!isPinnedToBottom) return
    const container = messageListRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: shouldSmoothScrollRef.current ? 'smooth' : 'auto'
    })
    shouldSmoothScrollRef.current = false
  }, [assistant.messages, isPinnedToBottom])

  const handleRun = () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }
    shouldSmoothScrollRef.current = true
    setIsPinnedToBottom(true)
    dispatch(runAssistantThunk(text))
    setDraft('')
  }

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

        <Card className={styles.dialogCard}>
          {assistant.inputWarning ? (
            <Alert showIcon type="warning" title={assistant.inputWarning} />
          ) : null}
          {assistant.unreachableDetails ? (
            <Alert
              showIcon
              type="error"
              title="Сервер OLAP недоступен"
              description={
                <div>
                  <Typography.Paragraph>{assistant.unreachableDetails}</Typography.Paragraph>
                  <Typography.Paragraph code>
                    {assistant.unreachableCode ?? 'нет кода ошибки'}
                  </Typography.Paragraph>
                </div>
              }
            />
          ) : null}
          {assistant.failedSummaryText ? (
            <Alert
              showIcon
              type="error"
              title="Достигнут лимит попыток"
              description={assistant.failedSummaryText}
            />
          ) : null}

          {assistant.messages.length > 0 ? (
            <div
              className={styles.messageList}
              role="list"
              ref={messageListRef}
              onScroll={updatePinToBottomState}
            >
              {assistant.messages.map((item) => (
                <div
                  key={item.id}
                  role="listitem"
                  className={classNames(
                    styles.messageRow,
                    item.role === 'user' ? styles.messageUser : styles.messageBot
                  )}
                >
                  <Space orientation="vertical">
                    <Typography.Text strong>
                      {item.role === 'user' ? 'Вы' : 'Ассистент'}
                    </Typography.Text>
                    <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                      {item.text}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary">
                      {timeFmt.format(item.createdAt)}
                    </Typography.Text>
                  </Space>
                </div>
              ))}
            </div>
          ) : null}

          <div className={styles.composerArea}>
            <Space orientation="vertical" className={styles.composerForm} size="middle">
              <div
                className={classNames(
                  styles.composerContent,
                  assistant.isRunning ? styles.composerContentLoading : null
                )}
              >
                {assistant.isRunning ? (
                  <div className={styles.stepWrap}>
                    <div className={styles.stepHeader}>
                      <Typography.Text>Статус выполнения</Typography.Text>
                      <Typography.Text strong>
                        попытка: {assistant.currentAttempt} из {assistant.maxAttempts}
                      </Typography.Text>
                    </div>
                    <Steps
                      size="small"
                      status="process"
                      current={activeStepIndex < 0 ? 0 : activeStepIndex}
                      items={[
                        { title: 'Проверка' },
                        { title: 'LLM → DAX' },
                        { title: 'Запрос к кубу' },
                        { title: 'Интерпретация' }
                      ]}
                    />
                  </div>
                ) : (
                  <Input.TextArea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    bordered={false}
                    style={{ height: '100%', resize: 'none' }}
                    placeholder="Сформулируйте аналитический вопрос к кубу на естественном языке"
                  />
                )}
              </div>
              <Button
                type="primary"
                loading={assistant.isRunning}
                disabled={assistant.isRunning}
                onClick={handleRun}
              >
                {assistant.isRunning ? 'Выполняется...' : 'Выполнить запрос'}
              </Button>
            </Space>
          </div>
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
