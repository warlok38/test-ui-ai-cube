const HEX: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

function bytesToUuid(bytes: Uint8Array): string {
  // RFC 4122 v4 bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  return (
    HEX[bytes[0]] +
    HEX[bytes[1]] +
    HEX[bytes[2]] +
    HEX[bytes[3]] +
    '-' +
    HEX[bytes[4]] +
    HEX[bytes[5]] +
    '-' +
    HEX[bytes[6]] +
    HEX[bytes[7]] +
    '-' +
    HEX[bytes[8]] +
    HEX[bytes[9]] +
    '-' +
    HEX[bytes[10]] +
    HEX[bytes[11]] +
    HEX[bytes[12]] +
    HEX[bytes[13]] +
    HEX[bytes[14]] +
    HEX[bytes[15]]
  )
}

function weakFallbackId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function createId(): string {
  const c = globalThis.crypto

  if (c?.randomUUID) {
    return c.randomUUID()
  }

  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    return bytesToUuid(bytes)
  }

  return weakFallbackId()
}
