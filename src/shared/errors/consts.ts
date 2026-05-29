export const HTTP_ERROR_CODES = {
  BadRequest: 400,
  Unauthorized: 401,
  AccessDenied: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  UnprocessableEntity: 422,
  RequestCancelled: 499,
  ServerInternalError: 500,
  GatewayTimeout: 504
} as const

export const DEFAULT_ERROR_MESSAGES = {
  BadRequest: 'Ошибка запроса',
  Unauthorized: 'Ошибка авторизации',
  AccessDenied: 'Доступ запрещен',
  NotFound: 'Не найдено',
  MethodNotAllowed: 'Метод не поддерживается',
  UnprocessableEntity: 'Неверный формат данных',
  RequestCancelled: 'Запрос отменён',
  ServerInternalError: 'Внутренняя ошибка сервера',
  GatewayTimeout: 'Превышено время ожидания от сервера',
  Default: 'Ошибка http запроса'
} as const
