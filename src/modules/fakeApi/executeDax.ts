import type { FakeScenarioKind } from '@/modules/fakeLlm/config'
import { fakeDelay } from './delay'

export type OlapExecutionKind = 'success' | 'empty' | 'soap_error'

export type OlapExecutionResult = {
  kind: OlapExecutionKind
  rows: Record<string, string | number | null>[]
  soapMessage?: string
}

const demoRowsBar: Record<string, string | number | null>[] = [
  { metric: 'Q1', value: 42 },
  { metric: 'Q2', value: 55 },
  { metric: 'Q3', value: 49 }
]

const demoRowsLine: Record<string, string | number | null>[] = [
  { month: 'Янв', revenue: 120 },
  { month: 'Фев', revenue: 132 },
  { month: 'Мар', revenue: 118 },
  { month: 'Апр', revenue: 140 }
]

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
