'use client'

import { DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Space, Typography } from 'antd'
import { useState } from 'react'
import type { AdminQueryLog } from '@/services/admin/types'
import { useAdminLogsExport } from '@/features/admin/hooks/useAdminLogsExport'
import { useQueryLogsQuery } from '@/store/api/cubeApi'

import { AdminLogDetailsDrawer } from '../AdminLogDetailsDrawer'
import { AdminLogsTable } from '../AdminLogsTable'

import styles from './AdminLogsSection.module.css'

export function AdminLogsSection() {
  const { data: logs = [], isFetching: logsFetching } = useQueryLogsQuery({ limit: 200 })
  const { handleExport, isLoading: exportLoading } = useAdminLogsExport()
  const [drawerRow, setDrawerRow] = useState<AdminQueryLog | null>(null)

  const tableLoading = logsFetching || exportLoading

  return (
    <>
      <Card className={styles.logsCard}>
        {/* <Space wrap className={styles.exportBar}>
          <Button
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => void handleExport('csv')}
          >
            Экспорт CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => void handleExport('json')}
          >
            Экспорт JSON
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => void handleExport('xlsx')}
          >
            Экспорт Excel
          </Button>
        </Space> */}
        <AdminLogsTable logs={logs} loading={tableLoading} onOpenDetails={setDrawerRow} />
      </Card>

      <AdminLogDetailsDrawer
        row={drawerRow}
        open={!!drawerRow}
        onClose={() => setDrawerRow(null)}
      />
    </>
  )
}
