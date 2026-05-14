'use client'

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
import type { ChartConfigPayload } from '@/services/assistantWorkflow/types'
import { PALETTE_PRIMARY, PALETTE_PRIMARY_DARK, CHART_GRID_STROKE } from '@/constants/theme'
import { useTheme } from '@/hooks'
import { Card, Typography } from 'antd'

type AnalyticsChartProps = {
  config: ChartConfigPayload
  rows: Record<string, string | number | null>[]
}

/** Линии сетки на тёмном фоне — ниже основного текста, без «грязи». */
const CHART_GRID_DARK = 'rgba(220, 227, 238, 0.18)'

export function AnalyticsChart({ config, rows }: AnalyticsChartProps) {
  const { theme } = useTheme()
  const color = config.color ?? (theme === 'dark' ? PALETTE_PRIMARY_DARK : PALETTE_PRIMARY)
  const axisStroke = theme === 'dark' ? CHART_GRID_DARK : CHART_GRID_STROKE

  return (
    <Card size="small" title={config.title ?? 'Визуализация'}>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Ось X: {config.xKey}, значение: {config.yKey}
      </Typography.Paragraph>
      <div style={{ width: '100%', height: 320, minWidth: 0, minHeight: 320 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 800, height: 320 }}
          minHeight={280}
          minWidth={0}
        >
          {config.type === 'bar' ? (
            <BarChart data={rows}>
              <CartesianGrid stroke={axisStroke} strokeDasharray="3 3" />
              <XAxis
                dataKey={config.xKey}
                stroke={axisStroke}
                tick={{ fill: axisStroke, fontSize: 12 }}
              />
              <YAxis stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={config.yKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={rows}>
              <CartesianGrid stroke={axisStroke} strokeDasharray="3 3" />
              <XAxis
                dataKey={config.xKey}
                stroke={axisStroke}
                tick={{ fill: axisStroke, fontSize: 12 }}
              />
              <YAxis stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={config.yKey} stroke={color} strokeWidth={2} dot />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
