'use client'

import { Drawer, Space, Typography } from 'antd'
import type { AdminQueryLog } from '@/services/admin/types'
import { ADMIN_DRAWER_DEMO_DAX } from '@/features/admin/constants/adminDemoDax'
import { formatCompactDateTime } from '@/utils/formatDateTime'

import styles from './AdminLogDetailsDrawer.module.css'

type AdminLogDetailsDrawerProps = {
  row: AdminQueryLog | null
  open: boolean
  onClose: () => void
}

export function AdminLogDetailsDrawer({ row, open, onClose }: AdminLogDetailsDrawerProps) {
  return (
    <Drawer size={620} title="Запись журнала" open={open} onClose={onClose}>
      {row ? (
        <Space orientation="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Paragraph>
            <Typography.Text strong>ID: </Typography.Text>
            {row.event_tech_id}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Время: </Typography.Text>
            {formatCompactDateTime(row.start_time)}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Пользователь: </Typography.Text>
            {row.user ?? '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Событие: </Typography.Text>
            {row.event}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Запрос: </Typography.Text>
            {row.query}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Статус: </Typography.Text>
            {row.status}
          </Typography.Paragraph>
          <Typography.Title level={5}>DAX</Typography.Title>
          <pre className={styles.code}>{ADMIN_DRAWER_DEMO_DAX}</pre>
        </Space>
      ) : null}
    </Drawer>
  )
}
