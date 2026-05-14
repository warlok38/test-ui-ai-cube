'use client'

import type { Key } from 'react'
import type { TableColumnsType, TableProps } from 'antd'
import { useMemo, useState } from 'react'
import { Button, Space, Table, Typography } from 'antd'
import type { FilterValue } from 'antd/es/table/interface'

type Row = Record<string, string | number | null>

type AnalyticsTableProps = {
  rows: Row[]
  onExportExcel?: () => void
}

/** Стабильная подпись строки без индекса в `rowKey` (antd не гарантирует поддержку индекса). */
function rowFingerprint(row: Row): string {
  return Object.keys(row)
    .sort()
    .map((key) => `${key}:${row[key]}`)
    .join('\u241e')
}

type RowWithStableKey = Row & { readonly __rk: string }

export function AnalyticsTable({ rows, onExportExcel }: AnalyticsTableProps) {
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})

  const dataSource = useMemo<RowWithStableKey[]>(
    () =>
      rows.map((row, index) => ({
        ...row,
        __rk: `${rowFingerprint(row)}#${index}`,
      })),
    [rows],
  )

  const columns: TableColumnsType<RowWithStableKey> = useMemo(() => {
    if (!rows.length) return []
    const keys = Object.keys(rows[0])
    return keys.map((key) => {
      const uniq = Array.from(new Set(rows.map((r) => String(r[key] ?? ''))))
      const filters =
        uniq.length > 40
          ? undefined
          : uniq.map((value) => ({
              text: value,
              value,
            }))
      return {
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
        sorter: (a: RowWithStableKey, b: RowWithStableKey) => {
          const va = a[key]
          const vb = b[key]
          if (typeof va === 'number' && typeof vb === 'number') return va - vb
          return String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true })
        },
        filters,
        filteredValue: filteredInfo[key] ?? null,
        filterSearch: uniq.length > 8,
        onFilter: (value: boolean | Key, record: RowWithStableKey) =>
          String(record[key] ?? '')
            .toLowerCase()
            .includes(String(value).toLowerCase()),
      }
    })
  }, [filteredInfo, rows])

  const handleChange: TableProps<RowWithStableKey>['onChange'] = (_pagination, filters) => {
    setFilteredInfo(filters as Record<string, FilterValue | null>)
  }

  return (
    <div>
      <Space align="center" style={{ marginBottom: 12 }} wrap>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Таблица результата
        </Typography.Title>
        {onExportExcel ? (
          <Button type="default" onClick={onExportExcel} disabled={!rows.length}>
            Экспорт в Excel
          </Button>
        ) : null}
      </Space>
      <Table<RowWithStableKey>
        rowKey="__rk"
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 8, showSizeChanger: true }}
        scroll={{ x: true }}
        onChange={handleChange}
      />
    </div>
  )
}
