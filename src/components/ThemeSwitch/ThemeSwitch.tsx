'use client'

import { useTheme } from '@/hooks'
import styles from './ThemeSwitch.module.css'

const SunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
  </svg>
)

const MoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
  </svg>
)

export type ThemeSwitchSize = 'default' | 'small'

type ThemeSwitchProps = {
  size?: ThemeSwitchSize
}

export function ThemeSwitch({ size = 'default' }: ThemeSwitchProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`${styles.switch} ${size === 'small' ? styles.switchSmall : ''}`}
      onClick={toggleTheme}
      title={isDark ? 'Светлая тема' : 'Темная тема'}
    >
      <span className={`${styles.thumb} ${isDark ? styles.thumbDark : ''}`}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}
