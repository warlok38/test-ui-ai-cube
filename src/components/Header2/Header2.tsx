'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LinkOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import styles from './Header2.module.css'

const NAV_ITEMS = [
  { href: '/', label: 'Главная' },
  { href: '/assistant', label: 'Ассистент' },
  { href: '/admin', label: 'Админ' },
] as const

export function Header2() {
  const pathname = usePathname()

  return (
    <header className={styles.headerSecondary}>
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
      <span className={styles.olapStatus}>
        <LinkOutlined className={styles.olapIcon} aria-hidden />
        OLAP подключен
      </span>
    </header>
  )
}
