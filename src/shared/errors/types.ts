import { HTTP_ERROR_CODES } from './consts'

export type HttpErrorCode = keyof typeof HTTP_ERROR_CODES

export type StatusCodeType<T> = T extends HttpErrorCode ? T : string | number | undefined

export type ErrorType = {
  message: string
  stack?: string
  [key: string]: unknown
}

export type HttpErrorType<TStatus = undefined> = {
  statusCode: StatusCodeType<TStatus>
  data?: unknown
} & ErrorType

export type BadRequestErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.BadRequest>
export type UnauthorizedErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.Unauthorized>
export type AccessDeniedErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.AccessDenied>
export type NotFoundErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.NotFound>
export type MethodNotAllowedErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.MethodNotAllowed>
export type UnprocessableEntityErrorType = HttpErrorType<
  typeof HTTP_ERROR_CODES.UnprocessableEntity
>
export type RequestCancelledErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.RequestCancelled>
export type ServerInternalErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.ServerInternalError>
export type GatewayTimeoutErrorType = HttpErrorType<typeof HTTP_ERROR_CODES.GatewayTimeout>
