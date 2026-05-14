import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'ui-theme'

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(storedTheme)) {
      return storedTheme
    }
  }

  if (typeof document !== 'undefined') {
    const attrTheme = document.documentElement.dataset.theme
    if (isTheme(attrTheme)) {
      return attrTheme
    }
  }

  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setTheme(getInitialTheme())
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme, isReady])

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
