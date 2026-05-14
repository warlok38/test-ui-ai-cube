import { ReactNode } from 'react'
import { Header1, Header2 } from '@/components'
import styles from './Layout.module.css'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header1 />

      <section className={styles.contentArea}>
        <div className={styles.contentColumn}>
          <Header2 />
          <main className={styles.mainContent}>{children}</main>
        </div>
      </section>
    </div>
  )
}
