'use client'

import {
  CommentOutlined,
  DeleteOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined
} from '@ant-design/icons'
import classNames from 'classnames'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useDeleteChat } from '@/features/assistant/hooks/useDeleteChat'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { getChatIdFromPathname } from '@/features/assistant/utils/chatRoute'
import { useAppDispatch } from '@/store/hooks'
import { useListChatsQuery } from '@/store/api/chatsApi'

import { DeleteChatConfirmModal } from './DeleteChatConfirmModal/DeleteChatConfirmModal'
import { SideBarFooter } from './SideBarFooter/SideBarFooter'
import styles from './SideBar.module.css'
import { useSideBar } from './hooks/useSideBar'
import { groupChatsByDate } from './utils/groupChatsByDate'

export type SideBarPosition = 'left' | 'right'

export type SideBarProps = {
  position?: SideBarPosition
}

export function SideBar({ position = 'left' }: SideBarProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { isOpen, openSideBar, toggleSideBar } = useSideBar()
  const { data: chats = [], isLoading } = useListChatsQuery()
  const { deleteChat, isDeleting } = useDeleteChat()
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)

  const activeChatId = getChatIdFromPathname(pathname)
  const groups = groupChatsByDate(chats)

  const handleNewChat = () => {
    dispatch(assistantActions.startNewChat())
    if (pathname.startsWith('/chat/')) {
      router.replace('/')
    } else if (pathname !== '/') {
      router.replace('/')
    }
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
  }

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return

    const deleted = await deleteChat(chatToDelete)
    if (deleted) {
      setChatToDelete(null)
    }
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
            {isLoading && <p className={styles.chatGroupLabel}>Загрузка…</p>}
            {!isLoading && groups.length === 0 && (
              <p className={styles.chatGroupLabel}>Нет чатов</p>
            )}
            {!isLoading &&
              groups.map((group) => (
                <section key={group.label} className={styles.chatGroup}>
                  <p className={styles.chatGroupLabel}>{group.label}</p>
                  {group.chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={classNames(styles.chatItemWrap, {
                        [styles.chatItemWrapActive]: activeChatId === chat.id
                      })}
                    >
                      <button
                        type="button"
                        className={classNames(styles.chatItem, {
                          [styles.chatItemActive]: activeChatId === chat.id
                        })}
                        onClick={() => handleChatClick(chat.id)}
                      >
                        {chat.title}
                      </button>
                      <button
                        type="button"
                        className={styles.chatDeleteButton}
                        aria-label="Удалить чат"
                        onClick={(e) => {
                          e.stopPropagation()
                          setChatToDelete(chat.id)
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ))}
                </section>
              ))}
          </div>
        </div>
      </div>

      <SideBarFooter isCollapsed={!isOpen} />

      <DeleteChatConfirmModal
        open={chatToDelete !== null}
        onCancel={() => setChatToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        isDeleting={isDeleting}
      />
    </aside>
  )
}
