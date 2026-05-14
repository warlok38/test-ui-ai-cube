'use client'

import { ThemeSwitch } from '@/components/ThemeSwitch'
import styles from './Header1.module.css'

export function Header1() {
  return (
    <header className={styles.headerPrimary}>
      <span className={styles.title}>Header1</span>
      <ThemeSwitch />
    </header>
  )
}
