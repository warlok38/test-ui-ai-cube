import { ReactNode } from 'react'
import { Header1, Header2 } from '@/components'
import styles from './Layout.module.css'
import { SideBar } from '../SideBar/SideBar'
import { usePathname } from 'next/navigation'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const isAdminPage = usePathname().includes('/admin')
  return (
    <div className={styles.layout}>
      {/* <Header1 /> */}

      <section className={styles.contentArea}>
        {!isAdminPage && <SideBar position="right" />}
        <div className={styles.contentColumn}>
          {/* <Header2 /> */}
          <main className={styles.mainContent}>{children}</main>
        </div>
      </section>
    </div>
  )
}
