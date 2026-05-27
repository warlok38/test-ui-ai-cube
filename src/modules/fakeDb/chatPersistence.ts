const STORAGE_KEY = 'olap-assistant.chats.v1'

export function loadChatsFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveChatsToStorage(json: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, json)
  } catch {
    // ignore quota / private mode
  }
}
