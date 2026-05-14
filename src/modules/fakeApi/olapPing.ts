import type { FakeScenarioKind } from '@/modules/fakeLlm/config'
import { fakeDelay } from './delay'

export type OlapPingResult = {
  ok: boolean
  latencyMs: number
  details?: string
  errorCode?: string
}

export async function pingOlapServer(scenario: FakeScenarioKind): Promise<OlapPingResult> {
  const started = performance.now()
  await fakeDelay(180 + Math.floor(Math.random() * 120))

  if (scenario === 'server_unreachable') {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      details: 'SOAP Fault: не удалось установить соединение с Analysis Services (таймаут).',
      errorCode: 'E_OLAP_TIMEOUT'
    }
  }

  return {
    ok: true,
    latencyMs: Math.round(performance.now() - started),
    details: 'Базовая проверка конечной точки XMLA пройдена.'
  }
}
