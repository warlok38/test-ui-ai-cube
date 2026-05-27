import type { ChatEntity } from '@/services/assistantWorkflow/types'

export type ChatGroup = {
  label: string
  chats: ChatEntity[]
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatMonthLabel(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function groupChatsByDate(chats: ChatEntity[]): ChatGroup[] {
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups = new Map<string, ChatEntity[]>()

  for (const chat of chats) {
    const updated = new Date(chat.updated_at)
    const day = startOfDay(updated)
    let label: string
    if (day.getTime() === today.getTime()) {
      label = 'Сегодня'
    } else if (day.getTime() === yesterday.getTime()) {
      label = 'Вчера'
    } else {
      label = formatMonthLabel(updated)
    }
    const list = groups.get(label) ?? []
    list.push(chat)
    groups.set(label, list)
  }

  const order = ['Сегодня', 'Вчера']
  const result: ChatGroup[] = []

  for (const key of order) {
    const list = groups.get(key)
    if (list?.length) {
      result.push({ label: key, chats: list })
      groups.delete(key)
    }
  }

  const monthKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a))
  for (const key of monthKeys) {
    const list = groups.get(key)
    if (list?.length) {
      result.push({ label: key, chats: list })
    }
  }

  return result
}
