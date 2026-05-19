import { ReactNode } from 'react'
import { Header1, Header2 } from '@/components'
import styles from './Layout.module.css'
import { SideBar } from '../SideBar/SideBar'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      {/* <Header1 /> */}

      <section className={styles.contentArea}>
        <SideBar position="right" />
        <div className={styles.contentColumn}>
          {/* <Header2 /> */}
          <main className={styles.mainContent}>{children}</main>
        </div>
      </section>
    </div>
  )
}
