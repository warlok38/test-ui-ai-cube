import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { ChatStreamError, consumeChatStream } from '@/services/assistantWorkflow/consumeChatStream'
import type {
  CancelTaskResponse,
  ChatDetailEntity,
  ChatEntity,
  DeleteChatResponse,
  MessageEntity,
  MessageSendParams,
  PatchMessageVoteBody,
  PatchMessageVoteResponse
} from '@/services/assistantWorkflow/types'

export const chatsApi = createApi({
  reducerPath: 'chatsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Chats', 'Chat', 'CubeStats', 'QueryLogs'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<MessageEntity, MessageSendParams>({
      async queryFn(params, { dispatch, signal }) {
        try {
          const data = await consumeChatStream(params, {
            signal,
            onEvent: (event) => dispatch(assistantActions.applyStreamEvent(event))
          })
          return { data }
        } catch (error) {
          if (error instanceof ChatStreamError) {
            if (typeof error.code === 'number') {
              return { error: { status: error.code, data: error.message } }
            }
            return { error: { status: 'CUSTOM_ERROR', error: error.message } }
          }
          const message = error instanceof Error ? error.message : 'Сбой выполнения запроса'
          return { error: { status: 'CUSTOM_ERROR', error: message } }
        }
      },
      invalidatesTags: (result, _error, arg) => {
        const tags: Array<'Chats' | { type: 'Chat'; id: string }> = ['Chats']
        if (arg.chat_id) tags.push({ type: 'Chat', id: arg.chat_id })
        if (result?.chat_id) tags.push({ type: 'Chat', id: result.chat_id })
        return tags
      }
    }),

    listChats: builder.query<ChatEntity[], void>({
      query: () => '/chats',
      providesTags: ['Chats']
    }),

    getChat: builder.query<ChatDetailEntity, string>({
      query: (chatId) => `/chats/${chatId}`,
      providesTags: (_result, _error, chatId) => [{ type: 'Chat', id: chatId }]
    }),

    deleteChat: builder.mutation<DeleteChatResponse, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Chats']
    }),

    voteMessage: builder.mutation<PatchMessageVoteResponse, PatchMessageVoteBody>({
      query: (body) => ({
        url: '/chats/vote',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Chats', 'CubeStats', 'QueryLogs']
    }),

    cancelTask: builder.mutation<CancelTaskResponse, string>({
      query: (taskId) => ({
        url: `/chats/cancel/${taskId}`,
        method: 'POST'
      })
    })
  })
})

export const {
  useSendMessageMutation,
  useListChatsQuery,
  useGetChatQuery,
  useDeleteChatMutation,
  useVoteMessageMutation,
  useCancelTaskMutation
} = chatsApi
