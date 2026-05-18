export type NavigationItem = {
  href: string
  label: string
}

export const NAV_ITEMS: readonly NavigationItem[] = [{ href: '/', label: 'Главная' }] as const
