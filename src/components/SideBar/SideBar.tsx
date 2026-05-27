'use client'

import { CommentOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import { SideBarChats } from './SideBarChats'
import { SideBarFooter } from './SideBarFooter/SideBarFooter'
import styles from './SideBar.module.css'
import { useSideBar } from './hooks/useSideBar'

export type SideBarPosition = 'left' | 'right'

export type SideBarProps = {
  position?: SideBarPosition
}

export function SideBar({ position = 'left' }: SideBarProps) {
  const { isOpen, openSideBar, toggleSideBar } = useSideBar()

  return (
    <aside
      className={classNames(styles.sideBar, {
        [styles.sideBarRight]: position === 'right',
        [styles.sideBarOpen]: isOpen
      })}
    >
      <div className={styles.body}>
        {!isOpen && (
          <button
            type="button"
            className={styles.collapsedTrigger}
            onClick={openSideBar}
            aria-label="Открыть панель чатов"
          >
            <CommentOutlined />
          </button>
        )}

        <SideBarChats isOpen={isOpen} onToggle={toggleSideBar} position={position} />
      </div>

      <SideBarFooter isCollapsed={!isOpen} />
    </aside>
  )
}
