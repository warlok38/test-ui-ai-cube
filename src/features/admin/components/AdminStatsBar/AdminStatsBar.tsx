'use client'

import { QuestionCircleOutlined } from '@ant-design/icons'
import { Card, Col, Row, Statistic, Tooltip } from 'antd'
import { useCubeStatsQuery } from '@/store/api'

import styles from './AdminStatsBar.module.css'

export function AdminStatsBar() {
  const { data: stats, isFetching } = useCubeStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 60_000
  })

  return (
    <Card className={styles.statsBar} loading={isFetching}>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Всего запросов" value={stats?.total_queries ?? 0} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Сегодня" value={stats?.daily_queries ?? 0} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Лайки" value={stats?.likes ?? 0} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Дизлайки" value={stats?.dislikes ?? 0} />
        </Col>
        <Col xs={24} sm={16} md={8}>
          <Statistic
            title={
              <span>
                Успешность
                <Tooltip title="successful / завершённые запуски">
                  <QuestionCircleOutlined style={{ marginInlineStart: 6 }} />
                </Tooltip>
              </span>
            }
            value={stats?.success_rate ?? 0}
            suffix="%"
          />
        </Col>
      </Row>
    </Card>
  )
}
