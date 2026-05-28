import { LLM_RESPONSE_DELAY_MS, type FakeScenarioKind } from '@/fakeBackend/llm/config'
import type {
  CubeQueryResult,
  MessageChartConfig,
  MessageDataRow,
  MessageSendParams
} from '@/services/assistantWorkflow/types'
import { fakeDelay, throwIfAborted } from './delay'

export type OlapExecutionKind = 'success' | 'empty' | 'soap_error'

export type OlapExecutionResult = {
  kind: OlapExecutionKind
  rows: Record<string, string | number | null>[]
  soapMessage?: string
}

const REGIONS = ['Север', 'Юг', 'Запад', 'Восток'] as const

const demoRowsBar: Record<string, string | number | null>[] = Array.from(
  { length: 20 },
  (_, index) => {
    const quarter = Math.floor(index / 5) + 1
    const period = `Q${quarter}-W${(index % 5) + 1}`
    const revenue = 900 + index * 47
    const cost = 560 + index * 29
    const margin = revenue - cost
    const region = REGIONS[index % REGIONS.length]
    return { period, revenue, cost, margin, region }
  }
)

const demoRowsLine: Record<string, string | number | null>[] = Array.from(
  { length: 20 },
  (_, index) => {
    const month = `2024-${String(index + 1).padStart(2, '0')}-01`
    const revenue = 1100 + index * 36
    const orders = 180 + index * 9
    const avgCheck = Math.round((revenue * 1000) / orders) / 10
    const planDelta = Math.round((revenue * 0.08 - 35 + (index % 4) * 12) * 10) / 10
    return { month, revenue, orders, avgCheck, planDelta }
  }
)

export function resolveExecutionForAttempt(input: {
  scenario: FakeScenarioKind
  attempt: number
  dax: string
  userPrompt: string
}): OlapExecutionResult {
  const { scenario, attempt } = input
  switch (scenario) {
    case 'successful_bar':
      return {
        kind: 'success',
        rows: demoRowsBar
      }
    case 'successful_line':
      return {
        kind: 'success',
        rows: demoRowsLine
      }
    case 'retry_then_success':
      if (attempt <= 2) {
        return attempt === 1
          ? {
              kind: 'soap_error',
              rows: [],
              soapMessage:
                'SOAP Fault: Parser error near token EVALUATE (псевдо-ошибка для ретрая).'
            }
          : {
              kind: 'empty',
              rows: []
            }
      }
      return { kind: 'success', rows: demoRowsBar }
    case 'fail_all_soap':
      return {
        kind: 'soap_error',
        rows: [],
        soapMessage: `SOAP Fault: Internal server error (#${attempt}); см. трассировку XMLA.`
      }
    case 'fail_all_empty':
      return { kind: 'empty', rows: [] }
    case 'server_unreachable':
      return {
        kind: 'soap_error',
        rows: [],
        soapMessage: 'Недоступно: сценарий ping уже должен был остановить поток.'
      }
    default: {
      const _exhaustive: never = scenario
      return _exhaustive
    }
  }
}

export async function executeDaxQuery(
  input: {
    scenario: FakeScenarioKind
    attempt: number
    dax: string
    userPrompt: string
  },
  signal?: AbortSignal
): Promise<OlapExecutionResult> {
  await fakeDelay(220 + Math.floor(Math.random() * 200), signal)
  return resolveExecutionForAttempt(input)
}

function buildDax(query: string, attempt: number): string {
  return `-- attempt ${attempt}\nEVALUATE\nSUMMARIZECOLUMNS(\n  Metrics[metric],\n  "value", SUM(Facts[amount])\n)\n-- prompt: ${query}`
}

function buildColumns(rows: MessageDataRow[]): string[] {
  const uniq = new Set<string>()
  for (const row of rows) {
    Object.keys(row).forEach((key) => uniq.add(key))
  }
  return Array.from(uniq)
}

function fallbackChartConfig(): MessageChartConfig {
  return {
    chart_type: 'bar',
    x_axis: 'category',
    y_axis: 'value',
    title: 'Визуализация недоступна',
    series: 'value'
  }
}

function buildChartConfig(
  rows: MessageDataRow[],
  scenario: FakeScenarioKind,
  query: string
): MessageChartConfig {
  const first = rows[0]
  if (!first) return fallbackChartConfig()

  const keys = Object.keys(first)
  const yAxis = keys.find((key) => typeof first[key] === 'number')
  const xAxis = keys.find((key) => key !== yAxis)
  if (!xAxis || !yAxis) return fallbackChartConfig()

  return {
    chart_type: scenario === 'successful_line' ? 'line' : 'bar',
    x_axis: xAxis,
    y_axis: yAxis,
    title: `Результат по запросу: ${query}`,
    series: yAxis
  }
}

function emptyResult(
  overrides: Partial<CubeQueryResult> & Pick<CubeQueryResult, 'dax' | 'interpretation' | 'status'>
): CubeQueryResult {
  return {
    dax: overrides.dax,
    status: overrides.status,
    attempts_made: overrides.attempts_made ?? null,
    result_row_count: overrides.result_row_count ?? 0,
    error_history: overrides.error_history ?? null,
    q_columns: overrides.q_columns ?? [],
    q_data: overrides.q_data ?? [],
    interpretation: overrides.interpretation,
    chart_config: overrides.chart_config ?? fallbackChartConfig()
  }
}

export async function executeCubeQuery(
  params: MessageSendParams,
  scenario: FakeScenarioKind,
  signal?: AbortSignal
): Promise<CubeQueryResult> {
  const query = params.query.trim()
  const maxAttempts = params.max_attempts ?? 3

  if (!query) {
    return emptyResult({
      dax: '',
      status: null,
      interpretation:
        'Введите текст запроса: поле не должно быть пустым.\n\nУточните метрику, период и разрез анализа (например, регион или канал), чтобы система сформировала корректный DAX и вернула содержательный результат.'
    })
  }

  if (scenario === 'server_unreachable') {
    return emptyResult({
      dax: buildDax(query, 1),
      status: 'server_unreachable',
      attempts_made: 1,
      interpretation:
        'Сервер OLAP недоступен. Проверьте соединение и повторите запрос.\n\nЕсли проблема сохраняется, проверьте доступность источника данных и сетевые ограничения между сервисами.'
    })
  }

  await fakeDelay(LLM_RESPONSE_DELAY_MS, signal)

  let lastDax = buildDax(query, 1)
  const errorHistory: unknown[] = []

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastDax = buildDax(query, attempt)
    const result = await executeDaxQuery(
      {
        scenario,
        attempt,
        dax: lastDax,
        userPrompt: query
      },
      signal
    )

    throwIfAborted(signal)

    if (result.kind === 'success' && result.rows.length > 0) {
      const qData = result.rows
      const previewColumns = buildColumns(qData).slice(0, 3).join(', ')
      return {
        dax: lastDax,
        status: 'success',
        attempts_made: attempt,
        result_row_count: qData.length,
        error_history: errorHistory.length > 0 ? errorHistory : null,
        q_columns: buildColumns(qData),
        q_data: qData,
        interpretation:
          `Запрос «${query}» выполнен успешно: получено ${qData.length} строк. Данные согласованы по ключевым полям (${previewColumns}), и выборка подходит для базового сравнительного анализа.\n\n` +
          'По результатам видно стабильную динамику метрик без аномальных скачков в пределах демонстрационного сценария. Рекомендуется использовать фильтрацию по периодам и региону, а затем сравнить маржинальность и выручку для принятия управленческого решения.',
        chart_config: buildChartConfig(qData, scenario, query)
      }
    }

    if (result.soapMessage) {
      errorHistory.push(result.soapMessage)
    } else if (result.kind === 'empty') {
      errorHistory.push('Пустой результат запроса')
    }
  }

  return emptyResult({
    dax: lastDax,
    status: 'failed_max',
    attempts_made: maxAttempts,
    error_history: errorHistory.length > 0 ? errorHistory : null,
    interpretation: `Не удалось получить данные за ${maxAttempts} попыток. Измените формулировку запроса.\n\nПопробуйте уточнить период, показатель и измерение (например: выручка по регионам за квартал), чтобы повысить шанс успешного выполнения.`
  })
}
