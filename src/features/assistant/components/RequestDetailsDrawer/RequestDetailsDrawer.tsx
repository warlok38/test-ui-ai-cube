'use client'

import { Button, Descriptions, Drawer, Space, Typography } from 'antd'
import { useState } from 'react'
import type { CubeQueryEntity } from '@/services/assistantWorkflow/types'

type RequestDetailsProps = {
  result: CubeQueryEntity
}

export function RequestDetailsDrawer({ result }: RequestDetailsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="link" onClick={() => setOpen(true)}>
        Технические детали запроса
      </Button>
      <Drawer size={520} title="Детали исполнения" open={open} onClose={() => setOpen(false)}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Статус">
              {result.success ? 'Успех' : 'Ошибка'}
            </Descriptions.Item>
            <Descriptions.Item label="Колонок">{result.columns.length}</Descriptions.Item>
            <Descriptions.Item label="Строк данных">{result.data.length}</Descriptions.Item>
          </Descriptions>

          <div>
            <Typography.Title level={5}>DAX</Typography.Title>
            <Typography.Paragraph>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  background: '#0f172a0d',
                  padding: 12,
                  borderRadius: 8
                }}
              >
                {result.dax || '—'}
              </pre>
            </Typography.Paragraph>
          </div>
        </Space>
      </Drawer>
    </>
  )
}
