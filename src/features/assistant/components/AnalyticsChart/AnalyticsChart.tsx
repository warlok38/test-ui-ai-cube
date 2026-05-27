'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { MessageChartConfig } from '@/services/assistantWorkflow/types'
import { PALETTE_PRIMARY, PALETTE_PRIMARY_DARK, CHART_GRID_STROKE } from '@/constants/theme'
import { useTheme } from '@/hooks'
import { Card, Typography } from 'antd'
import { formatSmartDateTime, isDateColumn, parseIsoToTimestamp } from '@/utils/formatDateTime'

type AnalyticsChartProps = {
  config: MessageChartConfig
  rows: Record<string, string | number | null>[]
}

/** Линии сетки на тёмном фоне — ниже основного текста, без «грязи». */
const CHART_GRID_DARK = 'rgba(220, 227, 238, 0.18)'

const TICK_COLOR = 'var(--color-text-default)'

export function AnalyticsChart({ config, rows }: AnalyticsChartProps) {
  const { theme } = useTheme()
  const color = theme === 'dark' ? PALETTE_PRIMARY_DARK : PALETTE_PRIMARY
  const axisStroke = theme === 'dark' ? CHART_GRID_DARK : CHART_GRID_STROKE
  const xIsDate = isDateColumn(rows, config.x_axis)

  const chartRows = useMemo(() => {
    if (!xIsDate) return rows
    return [...rows].sort((a, b) => {
      const ta = parseIsoToTimestamp(a[config.x_axis])
      const tb = parseIsoToTimestamp(b[config.x_axis])
      if (Number.isNaN(ta) || Number.isNaN(tb)) return 0
      return ta - tb
    })
  }, [rows, config.x_axis, xIsDate])

  const formatXTick = (value: string | number) =>
    xIsDate ? formatSmartDateTime(String(value)) : String(value)

  const formatTooltipLabel = (label: unknown) =>
    xIsDate && label !== null ? formatSmartDateTime(String(label)) : String(label ?? '')

  return (
    <Card
      size="small"
      title={config.title || 'Визуализация'}
      styles={{ title: { fontSize: '1rem' } }}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Ось X: {config.x_axis}, значение: {config.y_axis}, серия: {config.series}
      </Typography.Paragraph>
      <div style={{ width: '100%', height: 320, minWidth: 0, minHeight: 320 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 800, height: 320 }}
          minHeight={280}
          minWidth={0}
        >
          {config.chart_type === 'bar' ? (
            <BarChart data={chartRows}>
              <CartesianGrid stroke={axisStroke} strokeDasharray="3 3" />
              <XAxis
                dataKey={config.x_axis}
                stroke={axisStroke}
                tick={{ fill: TICK_COLOR, fontSize: 12 }}
                tickFormatter={xIsDate ? formatXTick : undefined}
              />
              <YAxis stroke={axisStroke} tick={{ fill: TICK_COLOR, fontSize: 12 }} />
              <Tooltip labelFormatter={xIsDate ? formatTooltipLabel : undefined} />
              <Bar dataKey={config.y_axis} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartRows}>
              <CartesianGrid stroke={axisStroke} strokeDasharray="3 3" />
              <XAxis
                dataKey={config.x_axis}
                stroke={axisStroke}
                tick={{ fill: TICK_COLOR, fontSize: 12 }}
                tickFormatter={xIsDate ? formatXTick : undefined}
              />
              <YAxis stroke={axisStroke} tick={{ fill: TICK_COLOR, fontSize: 12 }} />
              <Tooltip labelFormatter={xIsDate ? formatTooltipLabel : undefined} />
              <Line type="monotone" dataKey={config.y_axis} stroke={color} strokeWidth={2} dot />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
