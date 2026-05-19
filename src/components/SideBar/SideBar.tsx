'use client'

import {
  CommentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined
} from '@ant-design/icons'
import classNames from 'classnames'
import { useState } from 'react'

import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { useAppDispatch } from '@/store/hooks'

import { SideBarFooter } from './SideBarFooter/SideBarFooter'
import styles from './SideBar.module.css'
import { useSideBar } from './hooks/useSideBar'
import { MOCK_CHAT_GROUPS } from './mockChats'

export type SideBarPosition = 'left' | 'right'

export type SideBarProps = {
  position?: SideBarPosition
}

export function SideBar({ position = 'left' }: SideBarProps) {
  const dispatch = useAppDispatch()
  const { isOpen, openSideBar, toggleSideBar } = useSideBar()
  const [activeChatId, setActiveChatId] = useState('1')

  const handleNewChat = () => {
    dispatch(assistantActions.resetChat())
    setActiveChatId('1')
  }

  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    toggleSideBar()
  }

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

        <div
          className={classNames(styles.menuContent, { [styles.menuContentOpen]: isOpen })}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.header}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleToggleClick}
              aria-label={isOpen ? 'Свернуть панель чатов' : 'Развернуть панель чатов'}
            >
              {isOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            </button>
          </header>

          <button type="button" className={styles.newChatButton} onClick={handleNewChat}>
            <PlusOutlined />
            Новый чат
          </button>

          <div className={styles.chatList}>
            {MOCK_CHAT_GROUPS.map((group) => (
              <section key={group.label} className={styles.chatGroup}>
                <p className={styles.chatGroupLabel}>{group.label}</p>
                {group.chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    className={classNames(styles.chatItem, {
                      [styles.chatItemActive]: activeChatId === chat.id
                    })}
                    onClick={() => setActiveChatId(chat.id)}
                  >
                    {chat.title}
                  </button>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>

      <SideBarFooter isCollapsed={!isOpen} />
    </aside>
  )
}
