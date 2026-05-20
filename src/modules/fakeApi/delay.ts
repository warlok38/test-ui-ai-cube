function createAbortError(): DOMException {
  return new DOMException('Aborted', 'AbortError')
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

export async function fakeDelay(ms: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal)

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
      reject(createAbortError())
    }

    signal?.addEventListener('abort', onAbort)
  })
}

export function randomDelay(min = 200, max = 600): Promise<void> {
  const ms = min + Math.floor(Math.random() * (max - min + 1))
  return fakeDelay(ms)
}
