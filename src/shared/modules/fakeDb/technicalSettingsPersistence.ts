import {
  clampStageDelayMs,
  TECHNICAL_SCENARIO_OPTIONS,
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  type AssistantTechnicalSettings
} from '@/features/technical/model'

const STORAGE_KEY = 'olap-assistant.technical-settings.v1'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalize(input: unknown): AssistantTechnicalSettings {
  if (!isObject(input)) return { ...DEFAULT_ASSISTANT_TECHNICAL_SETTINGS }

  const scenarioValues = new Set(TECHNICAL_SCENARIO_OPTIONS.map((opt) => opt.value))
  const scenario =
    typeof input.scenario === 'string' &&
    scenarioValues.has(input.scenario as AssistantTechnicalSettings['scenario'])
      ? (input.scenario as AssistantTechnicalSettings['scenario'])
      : DEFAULT_ASSISTANT_TECHNICAL_SETTINGS.scenario

  return {
    scenario,
    stageDelayMs: clampStageDelayMs(
      typeof input.stageDelayMs === 'number'
        ? input.stageDelayMs
        : DEFAULT_ASSISTANT_TECHNICAL_SETTINGS.stageDelayMs
    )
  }
}

export function loadTechnicalSettings(): AssistantTechnicalSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_ASSISTANT_TECHNICAL_SETTINGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ASSISTANT_TECHNICAL_SETTINGS }
    return normalize(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_ASSISTANT_TECHNICAL_SETTINGS }
  }
}

export function saveTechnicalSettings(settings: AssistantTechnicalSettings): void {
  if (typeof window === 'undefined') return
  try {
    const payload = normalize(settings)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode errors
  }
}
