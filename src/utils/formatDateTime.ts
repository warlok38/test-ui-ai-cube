const compactDateTime = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const compactDateOnly = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/

export function isIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!ISO_DATE_ONLY.test(trimmed) && !ISO_DATE_TIME.test(trimmed)) return false
  const d = new Date(trimmed)
  return !Number.isNaN(d.getTime())
}

function hasTimeComponent(iso: string): boolean {
  return iso.includes('T')
}

function isMidnightLocal(d: Date): boolean {
  return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
}

export function formatCompactDateTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : compactDateTime.format(d)
}

export function formatSmartDateTime(iso: string): string {
  if (!isIsoDateString(iso)) return iso
  const d = new Date(iso)
  if (!hasTimeComponent(iso) || isMidnightLocal(d)) {
    return compactDateOnly.format(d)
  }
  return compactDateTime.format(d)
}

export function isDateColumn(
  rows: Record<string, string | number | null>[],
  key: string
): boolean {
  const nonNull = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined)
  if (nonNull.length === 0) return false
  return nonNull.every((v) => isIsoDateString(v))
}

export function formatAnalyticsCell(value: string | number | null): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' && isIsoDateString(value)) {
    return formatSmartDateTime(value)
  }
  return String(value)
}

export function parseIsoToTimestamp(value: string | number | null): number {
  if (typeof value === 'string' && isIsoDateString(value)) {
    return new Date(value).getTime()
  }
  return Number.NaN
}
