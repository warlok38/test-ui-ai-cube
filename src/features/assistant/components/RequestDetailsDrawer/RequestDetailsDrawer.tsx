'use client'

import { Button, Descriptions, Drawer, Space, Typography } from 'antd'
import { useState } from 'react'
import type { AssistantSuccessPayload } from '@/services/assistantWorkflow/types'
import type { RetryLogEntry } from '@/services/assistantWorkflow/types'

type RequestDetailsProps = {
  success?: AssistantSuccessPayload | null
  failureDax?: string | null
  attempts?: number
  retryLog?: RetryLogEntry[] | null
  durationMs?: number | null
}

export function RequestDetailsDrawer({
  success,
  failureDax,
  attempts,
  retryLog,
  durationMs
}: RequestDetailsProps) {
  const [open, setOpen] = useState(false)
  const dax = success?.finalDax ?? failureDax

  return (
    <>
      <Button type="link" onClick={() => setOpen(true)}>
        Технические детали запроса
      </Button>
      <Drawer size={520} title="Детали исполнения" open={open} onClose={() => setOpen(false)}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Попыток использовано">
              {success?.attemptsUsed ?? attempts ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Длительность">
              {durationMs !== null && durationMs !== undefined ? `${durationMs} мс` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Сценарий (демо)">
              {success?.scenarioLabel ?? '—'}
            </Descriptions.Item>
          </Descriptions>

          {retryLog && retryLog.length ? (
            <div>
              <Typography.Title level={5}>История ретраев</Typography.Title>
              <ul>
                {retryLog.map((entry) => (
                  <li key={entry.attempt}>
                    <Typography.Text>{entry.summary}</Typography.Text>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <Typography.Title level={5}>Итоговый DAX</Typography.Title>
            <Typography.Paragraph>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  background: '#0f172a0d',
                  padding: 12,
                  borderRadius: 8
                }}
              >
                {dax ?? '—'}
              </pre>
            </Typography.Paragraph>
          </div>
        </Space>
      </Drawer>
    </>
  )
}
