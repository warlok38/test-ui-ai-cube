'use client'

import { LinkOutlined } from '@ant-design/icons'
import { AppNavigation } from '@/components/Navigation'

import styles from './Header2.module.css'

export function Header2() {
  return (
    <header className={styles.headerSecondary}>
      <AppNavigation />
      <span className={styles.olapStatus}>
        <LinkOutlined className={styles.olapIcon} aria-hidden />
        OLAP подключен
      </span>
    </header>
  )
}
