import type { FakeScenarioKind } from '@/shared/modules/fakeLlm/config'

export const TECHNICAL_DELAY_MIN_MS = 0
export const TECHNICAL_DELAY_MAX_MS = 10_000
export const TECHNICAL_DELAY_DEFAULT_MS = 0

export type AssistantTechnicalSettings = {
  scenario: FakeScenarioKind
  stageDelayMs: number
}

export const DEFAULT_ASSISTANT_TECHNICAL_SETTINGS: AssistantTechnicalSettings = {
  scenario: 'successful_bar',
  stageDelayMs: TECHNICAL_DELAY_DEFAULT_MS
}

export function clampStageDelayMs(value: number): number {
  if (!Number.isFinite(value)) return TECHNICAL_DELAY_DEFAULT_MS
  return Math.min(TECHNICAL_DELAY_MAX_MS, Math.max(TECHNICAL_DELAY_MIN_MS, Math.round(value)))
}

export const TECHNICAL_SCENARIO_OPTIONS: Array<{
  value: FakeScenarioKind
  label: string
  summary: string
}> = [
  {
    value: 'successful_bar',
    label: 'Успех + bar-график',
    summary: 'Успешный ответ с категориальным графиком.'
  },
  {
    value: 'successful_line',
    label: 'Успех + line-график',
    summary: 'Успешный ответ с временным рядом.'
  },
  {
    value: 'fail_all_soap',
    label: 'Ошибка SOAP',
    summary: 'Финал: failed_max после SOAP-ошибки.'
  },
  {
    value: 'fail_all_empty',
    label: 'Пустой результат',
    summary: 'Финал: failed_max после пустой выборки.'
  },
  {
    value: 'server_unreachable',
    label: 'Сервер недоступен',
    summary: 'Падение на этапе ping с outcome server_unreachable.'
  }
]
