import { LLM_RESPONSE_DELAY_MS, type FakeScenarioKind } from '@/modules/fakeLlm/config'
import type {
  CubeQueryChartConfig,
  CubeQueryDataEntity,
  CubeQueryEntity,
  CubeQueryParams
} from '@/services/assistantWorkflow/types'
import { fakeDelay } from './delay'

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
    const month = `Месяц ${index + 1}`
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

export async function executeDaxQuery(input: {
  scenario: FakeScenarioKind
  attempt: number
  dax: string
  userPrompt: string
}): Promise<OlapExecutionResult> {
  await fakeDelay(220 + Math.floor(Math.random() * 200))
  return resolveExecutionForAttempt(input)
}

function buildDax(query: string, attempt: number): string {
  return `-- attempt ${attempt}\nEVALUATE\nSUMMARIZECOLUMNS(\n  Metrics[metric],\n  "value", SUM(Facts[amount])\n)\n-- prompt: ${query}`
}

function buildColumns(rows: CubeQueryDataEntity[]): string[] {
  const uniq = new Set<string>()
  for (const row of rows) {
    Object.keys(row).forEach((key) => uniq.add(key))
  }
  return Array.from(uniq)
}

function fallbackChartConfig(): CubeQueryChartConfig {
  return {
    chart_type: 'bar',
    x_axis: 'category',
    y_axis: 'value',
    title: 'Визуализация недоступна',
    series: 'value'
  }
}

function buildChartConfig(
  rows: CubeQueryDataEntity[],
  scenario: FakeScenarioKind,
  query: string
): CubeQueryChartConfig {
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

export async function executeCubeQuery(
  params: CubeQueryParams,
  scenario: FakeScenarioKind
): Promise<CubeQueryEntity> {
  const query = params.query.trim()
  const maxAttempts = params.max_attempts ?? 3

  if (!query) {
    return {
      success: false,
      error: true,
      data: [],
      columns: [],
      dax: '',
      interpretation:
        'Введите текст запроса: поле не должно быть пустым.\n\nУточните метрику, период и разрез анализа (например, регион или канал), чтобы система сформировала корректный DAX и вернула содержательный результат.',
      chart_config: fallbackChartConfig()
    }
  }

  if (scenario === 'server_unreachable') {
    return {
      success: false,
      error: true,
      data: [],
      columns: [],
      dax: buildDax(query, 1),
      interpretation:
        'Сервер OLAP недоступен. Проверьте соединение и повторите запрос.\n\nЕсли проблема сохраняется, проверьте доступность источника данных и сетевые ограничения между сервисами.',
      chart_config: fallbackChartConfig()
    }
  }

  await fakeDelay(LLM_RESPONSE_DELAY_MS)

  let lastDax = buildDax(query, 1)
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastDax = buildDax(query, attempt)
    const result = await executeDaxQuery({
      scenario,
      attempt,
      dax: lastDax,
      userPrompt: query
    })

    if (result.kind === 'success' && result.rows.length > 0) {
      const data = result.rows
      const previewColumns = buildColumns(data).slice(0, 3).join(', ')
      return {
        success: true,
        error: false,
        data,
        columns: buildColumns(data),
        dax: lastDax,
        interpretation:
          `Запрос «${query}» выполнен успешно: получено ${data.length} строк. Данные согласованы по ключевым полям (${previewColumns}), и выборка подходит для базового сравнительного анализа.\n\n` +
          'По результатам видно стабильную динамику метрик без аномальных скачков в пределах демонстрационного сценария. Рекомендуется использовать фильтрацию по периодам и региону, а затем сравнить маржинальность и выручку для принятия управленческого решения.',
        chart_config: buildChartConfig(data, scenario, query)
      }
    }
  }

  return {
    success: false,
    error: true,
    data: [],
    columns: [],
    dax: lastDax,
    interpretation: `Не удалось получить данные за ${maxAttempts} попыток. Измените формулировку запроса.\n\nПопробуйте уточнить период, показатель и измерение (например: выручка по регионам за квартал), чтобы повысить шанс успешного выполнения.`,
    chart_config: fallbackChartConfig()
  }
}
