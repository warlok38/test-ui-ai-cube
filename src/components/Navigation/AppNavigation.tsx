'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import classNames from 'classnames'

import { NAV_ITEMS } from './navigationConfig'
import styles from './AppNavigation.module.css'

export function AppNavigation() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav} aria-label="Разделы приложения">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={classNames(styles.navLink, pathname === href && styles.navLinkActive)}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
