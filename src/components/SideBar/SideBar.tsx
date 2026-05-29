'use client'

import { CommentOutlined, PlusOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import { useStartNewChat } from '@/features/assistant/hooks/useStartNewChat'

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
  const startNewChat = useStartNewChat()

  return (
    <aside
      className={classNames(styles.sideBar, {
        [styles.sideBarRight]: position === 'right',
        [styles.sideBarOpen]: isOpen
      })}
    >
      <div className={styles.body}>
        {!isOpen && (
          <>
            <button
              type="button"
              className={styles.collapsedTrigger}
              onClick={openSideBar}
              aria-label="Открыть панель чатов"
            >
              <CommentOutlined />
            </button>
            <button
              type="button"
              className={styles.collapsedNewChatButton}
              onClick={(e) => {
                e.stopPropagation()
                startNewChat()
              }}
              aria-label="Новый чат"
            >
              <PlusOutlined />
            </button>
          </>
        )}

        <SideBarChats isOpen={isOpen} onToggle={toggleSideBar} position={position} />
      </div>

      <SideBarFooter isCollapsed={!isOpen} />
    </aside>
  )
}
