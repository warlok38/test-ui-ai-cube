import { PALETTE_PRIMARY } from '@/constants/theme'

import type { FakeScenarioKind } from './config'
import type { OlapExecutionResult } from '@/modules/fakeApi/executeDax'
import type { ChartConfigPayload } from '@/services/assistantWorkflow/types'

export function generateInterpretation(
  prompt: string,
  rowsSample: OlapExecutionResult['rows']
): string {
  const count = rowsSample.length
  return `По вашему запросу («${truncate(
    prompt,
    80
  )}») было получено ${count} строк(и). Основная динамика отражает демонстрационные показатели куба. Рекомендуется проверить фильтры и измерения на соответствие бизнес-вопросу.`
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

export function generateDaxText(input: {
  scenario: FakeScenarioKind
  attempt: number
  userPrompt: string
  lastError?: string
}): string {
  const base = `-- attempt ${input.attempt}\nEVALUATE\n    SUMMARIZECOLUMNS(\n        Metrics[metric],\n        \"value\", SUM(Facts[amount])\n    )`
  if (input.lastError) {
    return `${base}\n-- context: повтор после ошибки: ${truncate(input.lastError, 140)}`
  }
  switch (input.scenario) {
    case 'successful_line':
      return `${base}\n-- intent: временной ряд (line)`
    case 'successful_bar':
      return `${base}\n-- intent: сравнение категорий (bar)`
    default:
      return base
  }
}

export function buildChartJson(input: {
  scenario: FakeScenarioKind
  rows: OlapExecutionResult['rows']
}): ChartConfigPayload | null {
  const { scenario, rows } = input
  if (scenario === 'server_unreachable') return null
  const first = rows[0]
  if (!first) return null

  const keys = Object.keys(first)
  const numericKey = keys.find((k) => typeof first[k] === 'number')
  const labelKey = keys.find((k) => k !== numericKey && first[k] !== null && first[k] !== undefined)
  if (!numericKey || !labelKey) return null

  if (scenario === 'successful_line') {
    return {
      type: 'line',
      xKey: labelKey,
      yKey: numericKey,
      title: 'Динамика показателя',
      color: PALETTE_PRIMARY
    }
  }

  if (scenario === 'successful_bar' || scenario === 'retry_then_success') {
    return {
      type: 'bar',
      xKey: labelKey,
      yKey: numericKey,
      title: 'Сравнение значений',
      color: PALETTE_PRIMARY
    }
  }

  if (scenario === 'fail_all_soap' || scenario === 'fail_all_empty') {
    return null
  }

  return {
    type: 'bar',
    xKey: labelKey,
    yKey: numericKey,
    title: 'Аналитический срез',
    color: PALETTE_PRIMARY
  }
}

/** Правило «достаточно ли данных для графика»: ≥2 строки и есть хотя бы одно числовое поле. */
export function canChart(rows: OlapExecutionResult['rows']): boolean {
  if (!rows.length || rows.length < 2) return false
  const first = rows[0]
  return Object.values(first).some((v) => typeof v === 'number')
}
