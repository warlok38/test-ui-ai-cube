export class FakeBackendError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'FakeBackendError'
  }
}
