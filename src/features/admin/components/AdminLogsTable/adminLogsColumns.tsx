import type { ColumnsType } from 'antd/es/table'
import { Button } from 'antd'
import type { AdminQueryLog } from '@/services/admin/types'
import { formatCompactDateTime } from '@/utils/formatDateTime'

export function createAdminLogsColumns(
  onOpenDetails: (row: AdminQueryLog) => void
): ColumnsType<AdminQueryLog> {
  return [
    {
      title: 'Время',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 140,
      render: (value: string) => formatCompactDateTime(value),
      sorter: (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      defaultSortOrder: 'descend',
      responsive: ['md']
    },
    {
      title: 'Пользователь',
      dataIndex: 'user',
      key: 'user',
      width: 120,
      render: (value: string | null) => value ?? '—',
      responsive: ['lg']
    },
    {
      title: 'Событие',
      dataIndex: 'event',
      key: 'event',
      width: 110,
      responsive: ['md']
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'success', value: 'success' },
        { text: 'failed_max', value: 'failed_max' },
        { text: 'server_unreachable', value: 'server_unreachable' },
        { text: 'cancelled_hint', value: 'cancelled_hint' }
      ],
      onFilter: (value, record) => record.status === String(value)
    },
    {
      title: 'Запрос',
      dataIndex: 'query',
      key: 'query',
      ellipsis: true
    },
    {
      title: 'Действия',
      key: 'details',
      width: 110,
      render: (_, row) => (
        <Button type="link" onClick={() => onOpenDetails(row)}>
          Подробнее
        </Button>
      )
    }
  ]
}
