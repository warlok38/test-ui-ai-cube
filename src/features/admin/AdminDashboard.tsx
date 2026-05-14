'use client'

import type { ColumnsType } from 'antd/es/table'

import type { MetricsAggregate, RequestLogRecord } from '@/modules/fakeDb/schema'
import { Card, Alert, Statistic, Row, Col, Typography, Space, Button, Drawer, Tooltip, Table } from 'antd'

import {
  QuestionCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons'

import { useMemo, useState } from 'react'
import { useExportLogsBinaryMutation, useLogsQuery, useMetricsQuery } from '@/store/api/cubeApi'
import { triggerBlobDownload } from '@/features/assistant/utils/exportTable'

import styles from './AdminDashboard.module.css'

export function AdminDashboard() {
  const { data: metrics, isFetching: metricsFetching } = useMetricsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 60_000,
  })
  const { data: logs = [], isFetching: logsFetching } = useLogsQuery({ limit: 200 })
  const [exportMutation, exportState] = useExportLogsBinaryMutation()
  const [drawerRows, setDrawerRows] = useState<RequestLogRecord | null>(null)

  const columns: ColumnsType<RequestLogRecord> = useMemo(
    () => [
      {
        title: 'Время',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        defaultSortOrder: 'descend',
        responsive: ['md'],
      },
      {
        title: 'Запрос',
        dataIndex: 'userPrompt',
        key: 'userPrompt',
        ellipsis: true,
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        filters: [
          { text: 'success', value: 'success' },
          { text: 'failed_max', value: 'failed_max' },
          { text: 'server_unreachable', value: 'server_unreachable' },
          { text: 'cancelled_hint', value: 'cancelled_hint' },
        ],
        onFilter: (value, record) => record.status === String(value),
      },
      {
        title: 'Попытки',
        dataIndex: 'attemptsUsed',
        key: 'attemptsUsed',
        responsive: ['md'],
      },
      {
        title: 'Фидбек',
        dataIndex: 'feedback',
        key: 'feedback',
        responsive: ['lg'],
        render: (value: RequestLogRecord['feedback']) => value ?? '—',
      },
      {
        title: 'Действия',
        key: 'details',
        render: (_, row) => (
          <Button type="link" onClick={() => setDrawerRows(row)}>
            Подробнее
          </Button>
        ),
      },
    ],
    [],
  )

  const metricCards = (m: MetricsAggregate | undefined) => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card loading={metricsFetching}>
          <Statistic title="Всего запусков (журнал)" value={m?.totalRuns ?? 0} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card loading={metricsFetching}>
          <Statistic title="Сегодня" value={m?.runsToday ?? 0} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card loading={metricsFetching}>
          <Statistic
            title={
              <span>
                Успешность %
                <Tooltip title="successful / завершённые (success + failed_max + server_unreachable)">
                  <QuestionCircleOutlined style={{ marginInlineStart: 6 }} />
                </Tooltip>
              </span>
            }
            value={m?.successRatePercent ?? 0}
            suffix="%"
          />
        </Card>
      </Col>
    </Row>
  )

  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    const blob = await exportMutation({ format }).unwrap()
    let ext: 'csv' | 'json' | 'xlsx'
    switch (format) {
      case 'xlsx':
        ext = 'xlsx'
        break
      case 'csv':
        ext = 'csv'
        break
      default:
        ext = 'json'
    }
    triggerBlobDownload(blob, `cube-logs-${Date.now()}.${ext}`)
  }

  return (
    <div className={styles.wrap}>
      <Typography.Title level={2}>Мониторинг ассистента</Typography.Title>
      <Typography.Paragraph type="secondary">
        Метрики и журналы читаются из локального фейкового хранилища (localStorage) и обновляются после каждого запуска
        клиента ассистента.
      </Typography.Paragraph>

      <Alert type="info" style={{ marginBottom: 16 }} title="Подсказка" description={'Успешность считается как successful ÷ все завершённые запуски. Не включаются только помеченные как cancelled_hint, если они появятся.'} />

      {metricCards(metrics)}

      <Card className={styles.logsCard} title="Журнал запросов" extra={<Typography.Text type="secondary">{logsFetching ? 'Обновление…' : `${logs.length} записей загружено`}</Typography.Text>}>
        <Space wrap className={styles.exportBar}>
          <Button icon={<DownloadOutlined />} loading={exportState.isLoading} onClick={() => void handleExport('csv')}>
            Экспорт CSV
          </Button>
          <Button icon={<DownloadOutlined />} loading={exportState.isLoading} onClick={() => void handleExport('json')}>
            Экспорт JSON
          </Button>
          <Button icon={<DownloadOutlined />} loading={exportState.isLoading} onClick={() => void handleExport('xlsx')}>
            Экспорт Excel
          </Button>
        </Space>

        <Table<RequestLogRecord>
          rowKey="id"
          columns={columns}
          dataSource={logs}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          scroll={{ x: true }}
          loading={logsFetching || exportState.isLoading}
        />
      </Card>

      <Drawer size={620} title="Запись журнала" open={!!drawerRows} onClose={() => setDrawerRows(null)}>
        {drawerRows ? (
          <Space orientation="vertical" style={{ width: '100%' }} size={12}>
            <Typography.Paragraph>
              <Typography.Text strong>Запрос: </Typography.Text>
              {drawerRows.userPrompt}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Typography.Text strong>Статус: </Typography.Text>
              {drawerRows.status}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Typography.Text strong>Время выполнения: </Typography.Text>
              {drawerRows.durationMs} мс
            </Typography.Paragraph>
            <Typography.Title level={5}>Ретраи</Typography.Title>
            <Typography.Paragraph>
              {drawerRows.retrySummaries.length ? drawerRows.retrySummaries.join('\n') : '—'}
            </Typography.Paragraph>
            <Typography.Title level={5}>DAX</Typography.Title>
            <pre className={styles.code}>{drawerRows.finalDax ?? '—'}</pre>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}
