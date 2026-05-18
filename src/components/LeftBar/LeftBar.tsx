'use client'

import Link from 'next/link'

import styles from './LeftBar.module.css'
import { useLeftBar } from './hooks/useLeftBar'

type LeftBarProps = {
  collapsedLabel?: string
}

export function LeftBar({ collapsedLabel = 'Меню' }: LeftBarProps) {
  const { isOpen, closeLeftBar, handleCollapsedMenuKeyDown, asideInteractionProps } = useLeftBar()

  return (
    <>
      <aside
        className={`${styles.leftBar} ${isOpen ? styles.leftBarOpen : ''}`}
        onKeyDown={handleCollapsedMenuKeyDown}
        {...asideInteractionProps}
      >
        <div className={styles.collapsedLabelWrap}>
          <span className={styles.collapsedLabel}>{collapsedLabel}</span>
        </div>

        <div className={`${styles.menuContent} ${isOpen ? styles.menuContentOpen : ''}`}>
          <div className={styles.menuHeader}>
            <span className={styles.menuTitle}>{collapsedLabel}</span>
            <button type="button" className={styles.closeButton} onClick={closeLeftBar}>
              ×
            </button>
          </div>
          <nav className={styles.menuBody}>
            <section className={styles.navIntro}>
              <p>Навигация по ключевым разделам демонстрационного приложения.</p>
            </section>
            <Link className={styles.navLink} href="/" onClick={closeLeftBar}>
              Главная
            </Link>
          </nav>
        </div>
      </aside>

      <button
        type="button"
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={closeLeftBar}
      />
    </>
  )
}
