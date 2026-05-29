/**
 * Переключение сценария фейкового контура (LLM/DAX/OLAP) для демонстрации и отладки.
 * Не использовать в продакшене.
 */
export type FakeScenarioKind =
  /** Успешный ответ за 1 попытку, конфиг бар-чарта */
  | 'successful_bar'
  /** Успешный ответ, линейный график */
  | 'successful_line'
  /** Ошибка SOAP */
  | 'fail_all_soap'
  /** Пустой результат */
  | 'fail_all_empty'
  /** Сервер недоступен на этапе ping */
  | 'server_unreachable'

export const ACTIVE_FAKE_SCENARIO: FakeScenarioKind = 'successful_bar'

/** Имитация задержки ответа LLM (мс). */
export const LLM_RESPONSE_DELAY_MS = 1300
