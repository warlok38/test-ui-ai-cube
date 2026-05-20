'use client'

import { Table } from 'antd'
import { useMemo } from 'react'
import type { AdminQueryLog } from '@/services/admin/types'

import { createAdminLogsColumns } from './adminLogsColumns'

type AdminLogsTableProps = {
  logs: AdminQueryLog[]
  loading: boolean
  onOpenDetails: (row: AdminQueryLog) => void
}

export function AdminLogsTable({ logs, loading, onOpenDetails }: AdminLogsTableProps) {
  const columns = useMemo(() => createAdminLogsColumns(onOpenDetails), [onOpenDetails])

  return (
    <Table<AdminQueryLog>
      rowKey="event_tech_id"
      columns={columns}
      dataSource={logs}
      pagination={{ pageSize: 12, showSizeChanger: true }}
      scroll={{ x: true }}
      loading={loading}
    />
  )
}
