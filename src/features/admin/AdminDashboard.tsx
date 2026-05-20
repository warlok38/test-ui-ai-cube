'use client'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import Link from 'next/link'

import { AdminLogsSection, AdminStatsBar } from './components'

import styles from './AdminDashboard.module.css'

export function AdminDashboard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <Typography.Title level={2}>Админка</Typography.Title>
        </div>
        <Link href="/" className={styles.exitLink}>
          <Button type="link" icon={<ArrowLeftOutlined />}>
            К ассистенту
          </Button>
        </Link>
      </div>

      <AdminStatsBar />
      <AdminLogsSection />
    </div>
  )
}
