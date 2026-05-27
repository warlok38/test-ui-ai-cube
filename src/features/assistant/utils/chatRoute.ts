export function getChatIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/chat\/([^/]+)/)
  return match?.[1] ?? null
}

export function isViewingChat(pathname: string, chatId: string): boolean {
  return getChatIdFromPathname(pathname) === chatId
}
