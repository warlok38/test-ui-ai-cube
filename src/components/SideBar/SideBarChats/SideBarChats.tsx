'use client'

import { DeleteOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useDeleteChat } from '@/features/assistant/hooks/useDeleteChat'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { getChatIdFromPathname } from '@/features/assistant/utils/chatRoute'
import { useAppDispatch } from '@/store/hooks'
import { useListChatsQuery } from '@/store/api/chatsApi'

import { DeleteChatConfirmModal } from '../DeleteChatConfirmModal/DeleteChatConfirmModal'
import styles from './SideBarChats.module.css'

export type SideBarChatsProps = {
  isOpen: boolean
  onToggle: () => void
  position?: 'left' | 'right'
}

export function SideBarChats({ isOpen, onToggle, position = 'left' }: SideBarChatsProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { data: chats = [], isLoading } = useListChatsQuery()
  const { deleteChat, isDeleting } = useDeleteChat()
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)

  const activeChatId = getChatIdFromPathname(pathname)

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
    onToggle()
  }

  return (
    <>
      <div
        className={classNames(styles.menuContent, {
          [styles.menuContentOpen]: isOpen,
          [styles.menuContentRight]: position === 'right'
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className={classNames(styles.header, {
            [styles.headerRight]: position === 'right'
          })}
        >
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
          {isLoading && <p className={styles.chatListPlaceholder}>Загрузка…</p>}
          {!isLoading && chats.length === 0 && (
            <p className={styles.chatListPlaceholder}>Нет чатов</p>
          )}
          {!isLoading &&
            chats.map((chat) => (
              <div
                key={chat.id}
                className={classNames(styles.chatItem, {
                  [styles.chatItemActive]: activeChatId === chat.id
                })}
              >
                <button
                  type="button"
                  className={styles.chatItemButton}
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
        </div>
      </div>

      <DeleteChatConfirmModal
        open={chatToDelete !== null}
        onCancel={() => setChatToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        isDeleting={isDeleting}
      />
    </>
  )
}
