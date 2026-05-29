'use client'

import { App } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { getChatIdFromPathname } from '@/features/assistant/utils/chatRoute'
import { createErrorFromUnknown } from '@/shared/errors'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { chatsApi, useDeleteChatMutation } from '@/store/api/chatsApi'

export function useDeleteChat() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { message } = App.useApp()
  const [deleteChatMutation, { isLoading: isDeleting }] = useDeleteChatMutation()
  const assistantActiveChatId = useAppSelector((s) => s.assistant.activeChatId)
  const assistantMessages = useAppSelector((s) => s.assistant.messages)

  const deleteChat = useCallback(
    async (chatId: string): Promise<boolean> => {
      const routeChatId = getChatIdFromPathname(pathname)
      const isViewingDeletedChat = routeChatId === chatId
      const isStaleHomeState =
        pathname === '/' &&
        assistantActiveChatId === chatId &&
        assistantMessages.length > 0

      try {
        dispatch(
          chatsApi.util.updateQueryData('getChat', chatId, () => undefined as never)
        )

        if (isViewingDeletedChat || isStaleHomeState) {
          dispatch(assistantActions.startNewChat())
        }

        if (isViewingDeletedChat) {
          router.replace('/')
        }

        await deleteChatMutation(chatId).unwrap()
        message.success('Чат удалён')

        return true
      } catch (error) {
        const { message: errMsg } = createErrorFromUnknown(error)
        message.error(errMsg)
        return false
      }
    },
    [
      assistantActiveChatId,
      assistantMessages.length,
      deleteChatMutation,
      dispatch,
      message,
      pathname,
      router
    ]
  )

  return { deleteChat, isDeleting }
}
