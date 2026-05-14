/**
 * Переключение сценария фейкового контура (LLM/DAX/OLAP) для демонстрации и отладки.
 * Не использовать в продакшене.
 */
export type FakeScenarioKind =
  /** Успешный ответ за 1 попытку, конфиг бар-чарта */
  | 'successful_bar'
  /** Успешный ответ, линейный график */
  | 'successful_line'
  /** Первые две попытки с ошибкой/пусто, затем успех */
  | 'retry_then_success'
  /** Три ошибки SOAP подряд */
  | 'fail_all_soap'
  /** Три раза пустой результат */
  | 'fail_all_empty'
  /** Сервер недоступен на этапе ping */
  | 'server_unreachable'

export const ACTIVE_FAKE_SCENARIO: FakeScenarioKind = 'successful_bar'
