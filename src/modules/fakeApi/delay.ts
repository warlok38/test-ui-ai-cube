export async function fakeDelay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomDelay(min = 200, max = 600): Promise<void> {
  const ms = min + Math.floor(Math.random() * (max - min + 1))
  return fakeDelay(ms)
}
