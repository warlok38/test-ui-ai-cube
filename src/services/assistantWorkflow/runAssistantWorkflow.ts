import type { FakeScenarioKind } from '@/modules/fakeLlm/config'
import { executeDaxQuery } from '@/modules/fakeApi/executeDax'
import { pingOlapServer } from '@/modules/fakeApi/olapPing'
import { buildChartJson, canChart, generateDaxText, generateInterpretation } from '@/modules/fakeLlm/templates'
import type {
  AssistantFailurePayload,
  AssistantPhase,
  AssistantSuccessPayload,
  AssistantWorkflowResult,
  RetryLogEntry,
} from './types'

export type PhaseListener = (_phase: AssistantPhase) => void

const MAX_ATTEMPTS = 3

export async function runAssistantWorkflow(params: {
  userPrompt: string
  scenario: FakeScenarioKind
  onPhase: PhaseListener
}): Promise<AssistantWorkflowResult> {
  const { userPrompt, scenario, onPhase } = params
  const startedAt = performance.now()

  if (!userPrompt.trim()) {
    return {
      outcome: 'input_warning',
      message: 'Введите текст запроса: поле не должно быть пустым.',
    }
  }

  onPhase('checking')
  const ping = await pingOlapServer(scenario)
  if (!ping.ok) {
    const durationMs = Math.round(performance.now() - startedAt)
    return {
      outcome: 'server_unreachable',
      details: ping.details,
      errorCode: ping.errorCode,
      retryLog: [],
      durationMs,
    }
  }

  let attempt = 1
  const retryLog: RetryLogEntry[] = []
  let lastDax: string | null = null
  let lastErrorContext: string | undefined

  while (attempt <= MAX_ATTEMPTS) {
    onPhase('generating')
    await new Promise((r) => setTimeout(r, 50))
    lastDax = generateDaxText({
      scenario,
      attempt,
      userPrompt,
      lastError: lastErrorContext,
    })

    onPhase('fetching')
    const exec = await executeDaxQuery({
      scenario,
      attempt,
      dax: lastDax,
      userPrompt,
    })

    if (exec.kind === 'success' && exec.rows.length > 0) {
      onPhase('interpreting')
      const interpretation = generateInterpretation(userPrompt, exec.rows)
      const chartRaw = canChart(exec.rows)
        ? buildChartJson({
            scenario,
            rows: exec.rows,
          })
        : null

      const durationMs = Math.round(performance.now() - startedAt)
      const success: AssistantSuccessPayload = {
        outcome: 'success',
        attemptsUsed: attempt,
        retryLog,
        finalDax: lastDax,
        rows: exec.rows,
        interpretation,
        chartConfig: chartRaw,
        durationMs,
        scenarioLabel: scenario,
      }
      return success
    }

    const summary =
      exec.kind === 'empty'
        ? `Попытка ${attempt}: результат пустой (0 строк)`
        : `Попытка ${attempt}: SOAP/HTTP ошибка — ${exec.soapMessage ?? 'Неизвестная ошибка OLAP'}`
    retryLog.push({ attempt, summary })
    lastErrorContext = exec.kind === 'empty' ? 'Пустой результат' : exec.soapMessage

    if (attempt === MAX_ATTEMPTS) {
      const durationMs = Math.round(performance.now() - startedAt)
      const failure: AssistantFailurePayload = {
        outcome: 'failed_max',
        retryLog,
        lastDax,
        attemptsUsed: MAX_ATTEMPTS,
        summaryText:
          'Не удалось получить корректные данные после 3 попыток. Просмотрите техническое резюме ретраев ниже или измените формулировку вопроса.',
        durationMs,
      }
      return failure
    }

    attempt += 1
  }

  const durationMs = Math.round(performance.now() - startedAt)
  return {
    outcome: 'failed_max',
    retryLog,
    lastDax,
    attemptsUsed: MAX_ATTEMPTS,
    summaryText:
      'Достигнуто максимальное число попыток генерации и исполнения DAX без успешного ответа куба.',
    durationMs,
  }
}
