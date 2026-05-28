import type { FakeScenarioKind } from '@/fakeBackend/llm/config'
import { executeCubeQuery } from '@/fakeBackend/api/executeDax'
import { fakeDelay, throwIfAborted } from '@/fakeBackend/api/delay'
import type { MessageSendParams } from '@/services/assistantWorkflow/types'
import type { ExecuteQueryStreamEvent } from '@/store/utils/sseEvents'
import { streamTs } from '@/store/utils/sseEvents'
import { createId } from '@/utils/createId'

const PROGRESS_DELAY_MS = 420
const HEARTBEAT_DELAY_MS = 280

async function emitProgress(
  signal: AbortSignal | undefined,
  step: string,
  message: string
): Promise<ExecuteQueryStreamEvent> {
  await fakeDelay(PROGRESS_DELAY_MS, signal)
  return {
    event: 'progress',
    data: { type: 'progress', ts: streamTs(), step, message }
  }
}

async function emitHeartbeat(
  signal: AbortSignal | undefined,
  step: string,
  message: string
): Promise<ExecuteQueryStreamEvent> {
  await fakeDelay(HEARTBEAT_DELAY_MS, signal)
  return {
    event: 'heartbeat',
    data: { type: 'heartbeat', ts: streamTs(), step, message }
  }
}

export async function* streamExecuteQuery(
  params: MessageSendParams,
  scenario: FakeScenarioKind,
  signal?: AbortSignal
): AsyncGenerator<ExecuteQueryStreamEvent, void, unknown> {
  const taskId = params.task_id ?? createId()

  yield {
    event: 'task',
    data: { task_id: taskId }
  }

  throwIfAborted(signal)
  await fakeDelay(120, signal)

  yield {
    event: 'ack',
    data: {
      type: 'ack',
      ts: streamTs(),
      message: 'Запрос принят, начинаю обработку…'
    }
  }

  yield await emitProgress(signal, 'validation', 'Проверяю формулировку запроса…')
  yield await emitHeartbeat(signal, 'validation', 'Проверяю формулировку запроса…')
  yield await emitHeartbeat(signal, 'validation', 'Проверяю формулировку запроса…')

  if (scenario === 'server_unreachable') {
    yield await emitProgress(signal, 'fetching', 'Проверяю доступность OLAP…')
    yield {
      event: 'error',
      data: {
        type: 'error',
        ts: streamTs(),
        message: 'Сервер OLAP недоступен. Проверьте соединение и повторите запрос.',
        code: 'server_unreachable'
      }
    }
    yield { event: 'end', data: {} }
    return
  }

  yield await emitProgress(signal, 'narrate', 'Формирую DAX и подбираю визуализацию…')
  yield await emitHeartbeat(signal, 'narrate', 'Формирую DAX и подбираю визуализацию…')
  yield await emitHeartbeat(signal, 'narrate', 'Формирую DAX и подбираю визуализацию…')

  yield await emitProgress(signal, 'fetching', 'Выполняю запрос к кубу…')

  const payload = await executeCubeQuery(params, scenario, signal)

  yield {
    event: 'result',
    data: {
      type: 'result',
      ts: streamTs(),
      task_id: taskId,
      payload
    }
  }

  yield { event: 'end', data: {} }
}
